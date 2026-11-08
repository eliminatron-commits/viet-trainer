import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { playRound, withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

const words: { id: string; stage: string }[] = JSON.parse(readFileSync('src/content/words.json', 'utf8'));
const learned = words.filter((w) => w.stage === 'e01' || w.stage === 'e02').map((w) => w.id);
const L = (p: Record<string, number | boolean>) => ({ xp: 0, tasks: 0, right: 0, newWords: 0, rounds: 0, goal: false, shield: false, ...p });

/** Stand vom Vorabend: Etappe 1 und 2 gelernt, drei Wörter fällig, Challenge „8 Runden“ bei 5. */
async function seed(page: Page, at: string, extra: Record<string, unknown> = {}) {
  await page.clock.setFixedTime(new Date(at));
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.evaluate(
    async ({ learned, extra }) => {
      const db = await new Promise<IDBDatabase>((res) => {
        const r = indexedDB.open('viet-trainer');
        r.onsuccess = () => res(r.result);
      });
      const store = (m: IDBTransactionMode) => db.transaction('state', m).objectStore('state');
      const save = await new Promise<Record<string, any>>((res) => {
        const t = store('readonly').get('save');
        t.onsuccess = () => res(t.result);
      });
      save.items = {};
      learned.forEach((id, i) => (save.items[id] = { box: 2, due: i < 3 ? '2026-11-09' : '2026-11-30', seen: 2, right: 1, wrong: 0 }));
      save.createdAt = '2026-10-20T09:00:00.000Z';
      save.stats.rounds = 5;
      save.challenges = { week: '2026-11-09', list: [{ id: 'runden', base: 0, done: false }] };
      save.recap = { seen: '2026-11-02' };
      save.brief = { seen: null };
      Object.assign(save, extra);
      await new Promise((res) => {
        const t = store('readwrite').put(save, 'save');
        t.onsuccess = res;
      });
    },
    { learned, extra },
  );
}

test('Tagesblick: einmal am Tag, zeigt was ansteht, jeder Punkt führt hin', async ({ page }) => {
  await seed(page, '2026-11-09T21:00:00', { today: { date: '2026-11-10', xp: 20 } });
  await page.clock.setFixedTime(new Date('2026-11-10T07:40:00'));
  await page.reload();

  const dialog = page.getByRole('dialog', { name: 'Guten Morgen!' });
  await expect(dialog).toBeVisible();
  const items = dialog.locator('.item');
  await expect(items).toHaveCount(3);
  await expect(items.nth(0)).toContainText('3 Pflanzen sind durstig');
  await expect(items.nth(0)).toContainText('Feld gießen');
  await expect(items.nth(1)).toContainText('Noch 30 XP bis zum Tagesziel');
  await expect(items.nth(1)).toContainText('Weiter mit Etappe 1: Ich & du');
  await expect(items.nth(2)).toContainText('8 Runden spielen');
  await expect(items.nth(2)).toContainText('Wochen-Challenge: 5 von 8');

  // „Feld gießen“ führt direkt in die Gießrunde aus genau den drei durstigen Einheiten
  await items.nth(0).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.locator('main.play')).toHaveAttribute('data-focus', 'water');
  await expect(page.getByRole('progressbar').first()).toHaveAttribute('aria-valuemax', '3');

  // Am selben Tag kommt er nicht wieder
  await page.reload();
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Am nächsten Tag wieder – das Tagesziel führt in die Etappe, „Später“ schließt
  await page.clock.setFixedTime(new Date('2026-11-11T12:00:00'));
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Hallo!' })).toBeVisible();
  await page.getByRole('dialog').locator('.item[data-kind="goal"]').click();
  await expect(page.locator('main.play')).toHaveAttribute('data-mode', 'stage');
});

test('Tagesblick abschaltbar; „Später“ schließt', async ({ page }) => {
  await seed(page, '2026-11-09T21:00:00');
  await page.clock.setFixedTime(new Date('2026-11-10T19:00:00'));
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Guten Abend!' })).toBeVisible();
  await page.getByRole('button', { name: 'Später' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'Profil', exact: true }).click();
  await page.getByRole('button', { name: 'Einstellungen' }).click();
  const sw = page.getByRole('switch', { name: /Trâus Tagesblick/ });
  await expect(sw).toHaveAttribute('aria-checked', 'true');
  await sw.click();
  await expect(sw).toHaveAttribute('aria-checked', 'false');

  await page.clock.setFixedTime(new Date('2026-11-11T08:00:00'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('am ersten Tag einer neuen Woche: Tagesblick als letzte Seite des Wochenrückblicks', async ({ page }) => {
  await seed(page, '2026-11-15T20:00:00', {
    days: { '2026-11-10': L({ xp: 60, tasks: 14, right: 12, goal: true }), '2026-11-12': L({ xp: 25, tasks: 6, right: 5, rounds: 1 }) },
    today: { date: '2026-11-15', xp: 0 },
  });
  await page.clock.setFixedTime(new Date('2026-11-16T07:30:00'));
  await page.reload();

  await expect(page.getByRole('dialog', { name: '9.–15. November' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  const heute = page.getByRole('dialog', { name: 'Guten Morgen!' });
  await expect(heute).toBeVisible();
  await expect(heute.locator('.page[data-page="2"] .item[data-kind="water"]')).toContainText('3 Pflanzen sind durstig');
  await heute.locator('.page[data-page="2"] .item[data-kind="goal"]').click();
  await expect(page.locator('main.play')).toHaveAttribute('data-mode', 'stage');

  // gezeigt ist gezeigt: weder Rückblick noch Tagesblick kommen heute wieder
  await page.reload();
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('erster Lerntag: nach der ersten Runde kein Tagesblick, erst bei der nächsten Öffnung', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-10T07:40:00'));
  await page.goto('/viet-trainer/');
  await page.getByRole('button', { name: /^Etappe 1: Ich & du – / }).click();
  await page.getByRole('button', { name: 'Etappe starten' }).click();
  expect(await playRound(page)).toBe('done');
  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('button', { name: /^Etappe 1: Ich & du – / })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Die nächste Öffnung ist die erste mit Gelerntem – jetzt kommt er
  await page.reload();
  await expect(page.getByRole('dialog', { name: 'Guten Morgen!' })).toBeVisible();
});
