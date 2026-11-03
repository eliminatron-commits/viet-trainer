import { dueForecast } from './logic/srs';
import type { DateKey, SaveState } from './storage/state';

/**
 * Push-Erinnerungen über den Cloudflare-Worker (worker/).
 * Adresse und Token kommen aus der Build-Umgebung (VITE_PUSH_URL, VITE_PUSH_TOKEN) – nie aus einer Repo-Datei.
 * Die Anmeldung geht nur per Tippen aus der installierten App (iOS 16.4+).
 */
const BASE = (import.meta.env.VITE_PUSH_URL as string | undefined)?.replace(/\/$/, '');
const TOKEN = import.meta.env.VITE_PUSH_TOKEN as string | undefined;

export type PushStatus =
  | 'checking'
  /** Build ohne Worker-Adresse/Token. */
  | 'unconfigured'
  /** Browser kann kein Web Push (iPhone: erst „Zum Home-Bildschirm“, dann aus der App öffnen). */
  | 'not-installed'
  | 'denied'
  | 'off'
  | 'on';

export const push = $state<{ status: PushStatus; busy: boolean; message: string }>({
  status: 'checking',
  busy: false,
  message: '',
});

const standalone = () =>
  matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { authorization: `Bearer ${TOKEN}`, ...(body ? { 'content-type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
  return data;
}

/** Aktuelles Abo im Browser; ohne registrierten Service Worker (z. B. Dev-Server) keins. */
async function currentSubscription(): Promise<PushSubscription | null> {
  if (!supported()) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

/** Was die App dem Worker meldet: fällige Wiederholungen der nächsten Tage, Tagesziel, Uhrzeiten. */
export function reportBody(save: SaveState, today: DateKey) {
  return {
    dueByDate: dueForecast(save.items, today),
    goalDate: save.streak.lastDate,
    morning: save.settings.morning,
    evening: save.settings.evening,
  };
}

export async function refreshPushStatus(): Promise<void> {
  if (!BASE || !TOKEN) return void (push.status = 'unconfigured');
  if (!supported() || !standalone()) return void (push.status = 'not-installed');
  if (Notification.permission === 'denied') return void (push.status = 'denied');
  const sub = await currentSubscription();
  if (!sub) return void (push.status = 'off');
  try {
    const server = await api<{ subscribed: boolean }>('GET', '/status');
    push.status = server.subscribed ? 'on' : 'off';
    push.message = '';
  } catch (e) {
    push.status = 'on';
    push.message = `Worker nicht erreichbar (${e instanceof Error ? e.message : String(e)}).`;
  }
}

async function run(task: () => Promise<string>): Promise<void> {
  push.busy = true;
  push.message = '';
  try {
    push.message = await task();
  } catch (e) {
    push.message = e instanceof Error ? e.message : String(e);
  } finally {
    push.busy = false;
    await refreshPushStatus();
  }
}

/** Nur aus einem Tipp-Handler aufrufen: iOS fragt die Berechtigung nur bei einer Nutzergeste. */
export function enablePush(save: SaveState, today: DateKey): Promise<void> {
  const permission = Notification.requestPermission();
  return run(async () => {
    if ((await permission) !== 'granted') return 'Benachrichtigungen wurden nicht erlaubt.';
    const reg = await navigator.serviceWorker.ready;
    const { publicKey } = await api<{ publicKey: string }>('GET', '/vapid');
    const old = await reg.pushManager.getSubscription();
    await old?.unsubscribe();
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: publicKey });
    await api('PUT', '/subscription', { subscription: sub.toJSON(), ...reportBody(save, today) });
    return 'Erinnerungen sind an.';
  });
}

export function disablePush(): Promise<void> {
  return run(async () => {
    await (await currentSubscription())?.unsubscribe();
    await api('DELETE', '/subscription');
    return 'Erinnerungen sind aus.';
  });
}

export function sendTestPush(): Promise<void> {
  return run(async () => {
    await api('POST', '/test');
    return 'Test gesendet – die Mitteilung sollte gleich erscheinen.';
  });
}

/** Beim Session-Ende und nach Zeitänderungen: Stand melden. Still, wenn Push aus ist oder offline. */
export async function reportToWorker(save: SaveState, today: DateKey): Promise<void> {
  if (!BASE || !TOKEN || !(await currentSubscription())) return;
  try {
    await api('PUT', '/report', reportBody(save, today));
  } catch {
    /* offline: beim nächsten Session-Ende erneut */
  }
}
