import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { playRound, withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

const stages: { id: string; region: string; title: string }[] = JSON.parse(readFileSync('src/content/stages.json', 'utf8'));
const words: { id: string; stage: string }[] = JSON.parse(readFileSync('src/content/words.json', 'utf8'));
const danang = stages.filter((s) => s.region === 'danang');
const last = danang.at(-1)!;

/** Spielstand: Đà Nẵng bis auf den letzten Boss geschafft (`bossDone`: auch ihn), dessen Wörter je einmal richtig. */
async function seed(page: Page, bossDone: boolean) {
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  const done = (bossDone ? danang : danang.slice(0, -1)).map((s) => s.id);
  const learned = words.filter((w) => w.stage === last.id).map((w) => w.id);
  await page.evaluate(
    async ({ done, learned }) => {
      const db = await new Promise<IDBDatabase>((res) => {
        const r = indexedDB.open('viet-trainer');
        r.onsuccess = () => res(r.result);
      });
      const store = (m: IDBTransactionMode) => db.transaction('state', m).objectStore('state');
      const save = await new Promise<Record<string, any>>((res) => {
        const t = store('readonly').get('save');
        t.onsuccess = () => res(t.result);
      });
      save.stages = Object.fromEntries(done.map((id) => [id, { done: true, bossBest: 3 }]));
      for (const id of learned) save.items[id] = { box: 2, due: '2099-01-01', seen: 2, right: 1, wrong: 0 };
      // Tagesblick aus: er hat eigene Tests (brief.spec.ts) und läge sonst über der Seite.
      save.settings.brief = false;
      await new Promise((res) => {
        const t = store('readwrite').put(save, 'save');
        t.onsuccess = res;
      });
    },
    { done, learned },
  );
  await page.reload();
}

test('nach dem Boss, der Đà Nẵng abschließt: Reise nach Hội An, danach geht es dort weiter', async ({ page }) => {
  await seed(page, false);
  await page.getByRole('button', { name: new RegExp(`^Etappe ${danang.length}: .* – offen`) }).click();
  await page.getByRole('button', { name: 'Bosskampf' }).click();
  expect(await playRound(page)).toBe('won');

  await expect(page.getByRole('heading', { name: 'Đà Nẵng geschafft!' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fertig' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Mit dem Zug nach Hội An' }).click();

  const trip = page.getByRole('dialog', { name: 'Willkommen in Hội An' });
  await expect(trip).toBeVisible();
  await expect(trip).toHaveAttribute('data-phase', 'ride');
  await expect(trip.getByRole('button', { name: 'Überspringen' })).toBeVisible();
  // der Zug fährt ein, das Souvenir landet im Reisepass
  await expect(trip).toHaveAttribute('data-phase', 'done', { timeout: 15_000 });
  await expect(trip.locator('.shelf [data-region="danang"]')).toHaveClass(/landed/);
  await expect(trip).toContainText('Souvenir aus Đà Nẵng: Korbboot mit Ruder');
  await trip.getByRole('button', { name: 'Weiter', exact: true }).click();

  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /in Hội An/ })).toBeVisible();
  await expect(page.getByRole('button', { name: new RegExp(`^Etappe ${danang.length + 1}: .* – offen`) })).toBeVisible();
});

test('im Reisepass: das Souvenir spielt die Reise noch einmal, „Überspringen“ springt ans Ende, „Fertig“ führt zurück in den Pass', async ({ page }) => {
  await seed(page, true);
  await page.getByRole('button', { name: 'Profil', exact: true }).click();
  await page.getByRole('button', { name: /^Reisepass/ }).click();
  await expect(page.getByText('Tipp ein Souvenir an – Trâu fährt die Reise noch einmal.')).toBeVisible();
  // nur geschaffte Regionen mit einer nächsten haben eine Reise
  await expect(page.getByRole('button', { name: /^Reise von/ })).toHaveCount(1);
  await page.getByRole('button', { name: 'Reise von Đà Nẵng nach Hội An ansehen' }).click();

  // „Überspringen“ mitten in der Fahrt: sofort angekommen, das Souvenir liegt im Fach, die Fahrt ist zu Ende
  const trip = page.getByRole('dialog', { name: 'Willkommen in Hội An' });
  await expect(trip).toBeVisible();
  await expect(trip).toHaveAttribute('data-phase', 'ride');
  await trip.getByRole('button', { name: 'Überspringen' }).click();
  await expect(trip).toHaveAttribute('data-phase', 'done');
  await expect(trip).toContainText('Souvenir aus Đà Nẵng: Korbboot mit Ruder');
  const ended = await trip.evaluate((el) =>
    el.getAnimations({ subtree: true }).filter((a) => {
      const end = Number(a.effect?.getComputedTiming().endTime ?? 0);
      return a.playState === 'running' && end !== Infinity && end > 3000;
    }).length,
  );
  expect(ended).toBe(0); // keine Fahrt läuft mehr (nur Schleifen und kurze Aufbau-Animationen)
  await trip.getByRole('button', { name: 'Fertig', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // zurück im Reisepass auf derselben Seite, der Fokus liegt wieder auf dem Souvenir
  await expect(page.getByRole('button', { name: 'Reise von Đà Nẵng nach Hội An ansehen' })).toBeFocused();

  // ohne Überspringen bis zum Ende: „Fertig“ statt „Weiter“
  await page.getByRole('button', { name: 'Reise von Đà Nẵng nach Hội An ansehen' }).click();
  await expect(trip).toHaveAttribute('data-phase', 'done', { timeout: 15_000 });
  await trip.getByRole('button', { name: 'Fertig', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reise von Đà Nẵng nach Hội An ansehen' })).toBeVisible();
});
