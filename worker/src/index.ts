import { buildPushPayload, type PushSubscription } from '@block65/webcrypto-web-push';
import { emptyUser, reminderText, remindersDue, type PushSubscriptionData, type PushUser } from './schedule';

/**
 * Push-Worker für genau einen Nutzer (Alex).
 * - KV-Schlüssel „user“ hält Abo, Uhrzeiten, gemeldeten Lernstand und versandte Erinnerungen.
 * - Cron alle 5 Minuten prüft, ob Morgen-/Abenderinnerung dran ist.
 * - Jede Anfrage braucht `Authorization: Bearer <PUSH_TOKEN>`.
 * Secrets (wrangler secret put): PUSH_TOKEN, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY.
 */
export interface Env {
  STATE: KVNamespace;
  PUSH_TOKEN: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_SUBJECT: string;
  /** Kommagetrennte erlaubte Origins für CORS. */
  ALLOWED_ORIGINS: string;
}

const KEY = 'user';

async function loadUser(env: Env): Promise<PushUser> {
  const stored = await env.STATE.get<Partial<PushUser>>(KEY, 'json');
  return { ...emptyUser(), ...stored };
}
const saveUser = (env: Env, user: PushUser) => env.STATE.put(KEY, JSON.stringify(user));

type SendResult = 'ok' | 'expired' | 'failed';

async function sendPush(env: Env, user: PushUser, title: string, body: string): Promise<SendResult> {
  if (!user.subscription) return 'expired';
  const payload = await buildPushPayload(
    { data: { title, body }, options: { ttl: 4 * 3600, urgency: 'normal' } },
    { expirationTime: null, ...user.subscription } as PushSubscription,
    { subject: env.VAPID_SUBJECT, publicKey: env.VAPID_PUBLIC_KEY, privateKey: env.VAPID_PRIVATE_KEY },
  );
  const res = await fetch(user.subscription.endpoint, payload);
  if (res.ok) return 'ok';
  console.error(`Push abgelehnt: ${res.status} ${await res.text()}`);
  // 404/410: Abo gibt es nicht mehr (z. B. App gelöscht) → verwerfen, die App zeigt dann „nicht angemeldet“.
  if (res.status === 404 || res.status === 410) {
    user.subscription = null;
    return 'expired';
  }
  return 'failed';
}

const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const isDate = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

function isSubscription(v: unknown): v is PushSubscriptionData {
  const s = v as PushSubscriptionData;
  return (
    typeof s?.endpoint === 'string' &&
    s.endpoint.startsWith('https://') &&
    typeof s.keys?.p256dh === 'string' &&
    typeof s.keys?.auth === 'string'
  );
}

/** Übernimmt Uhrzeiten und Lernstand aus einer App-Meldung (unbekannte/ungültige Felder werden ignoriert). */
function applyReport(user: PushUser, body: Record<string, unknown>): void {
  if (typeof body.morning === 'string' && HHMM.test(body.morning)) user.morning = body.morning;
  if (typeof body.evening === 'string' && HHMM.test(body.evening)) user.evening = body.evening;
  if (body.goalDate === null || isDate(body.goalDate)) user.goalDate = body.goalDate as string | null;
  const due = body.dueByDate;
  if (due && typeof due === 'object' && !Array.isArray(due)) {
    user.dueByDate = Object.fromEntries(
      Object.entries(due).filter(([d, n]) => isDate(d) && Number.isInteger(n) && (n as number) >= 0),
    ) as Record<string, number>;
  }
}

function status(user: PushUser) {
  return { subscribed: user.subscription !== null, morning: user.morning, evening: user.evening, sent: user.sent };
}

/** Zeitkonstanter Vergleich, damit das Token nicht per Laufzeit erraten werden kann. */
function sameToken(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  let diff = ea.length ^ eb.length;
  for (let i = 0; i < Math.max(ea.length, eb.length); i++) diff |= (ea[i] ?? 0) ^ (eb[i] ?? 0);
  return diff === 0;
}

function cors(env: Env, req: Request): Record<string, string> {
  const origin = req.headers.get('origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  if (!allowed.includes(origin)) return {};
  return {
    'access-control-allow-origin': origin,
    'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'access-control-allow-headers': 'authorization, content-type',
    'access-control-max-age': '86400',
    vary: 'origin',
  };
}

async function handle(req: Request, env: Env): Promise<Response> {
  const headers = { 'content-type': 'application/json', ...cors(env, req) };
  const json = (data: unknown, code = 200) => new Response(JSON.stringify(data), { status: code, headers });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });

  const auth = req.headers.get('authorization') ?? '';
  if (!env.PUSH_TOKEN || !sameToken(auth, `Bearer ${env.PUSH_TOKEN}`)) return json({ error: 'unauthorized' }, 401);

  const route = `${req.method} ${new URL(req.url).pathname}`;
  const body = req.method === 'PUT' || req.method === 'POST' ? ((await req.json().catch(() => ({}))) as Record<string, unknown>) : {};
  const user = await loadUser(env);

  switch (route) {
    case 'GET /vapid':
      return json({ publicKey: env.VAPID_PUBLIC_KEY });
    case 'GET /status':
      return json(status(user));
    case 'PUT /subscription':
      if (!isSubscription(body.subscription)) return json({ error: 'invalid subscription' }, 400);
      user.subscription = body.subscription;
      applyReport(user, body);
      await saveUser(env, user);
      return json(status(user));
    case 'DELETE /subscription':
      user.subscription = null;
      await saveUser(env, user);
      return json(status(user));
    case 'PUT /report':
      applyReport(user, body);
      await saveUser(env, user);
      return json(status(user));
    case 'POST /test': {
      const result = await sendPush(env, user, 'Test aus dem Việt-Trainer', 'Erinnerungen kommen an.');
      if (result === 'expired') await saveUser(env, user);
      return json({ result, ...status(user) }, result === 'ok' ? 200 : 502);
    }
    default:
      return json({ error: 'not found' }, 404);
  }
}

export default {
  fetch(req, env) {
    return handle(req, env);
  },

  async scheduled(controller, env) {
    const user = await loadUser(env);
    const due = remindersDue(new Date(controller.scheduledTime), user);
    if (due.length === 0) return;
    for (const r of due) {
      if (r.send) {
        const { title, body } = reminderText(r.slot, r.date, user);
        if ((await sendPush(env, user, title, body)) === 'failed') continue; // beim nächsten Lauf erneut versuchen
      }
      user.sent[r.slot] = r.date;
    }
    await saveUser(env, user);
  },
} satisfies ExportedHandler<Env>;
