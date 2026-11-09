import { expect, test, type Page } from '@playwright/test';
import { withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

const L = (p: Record<string, number | boolean>) => ({ xp: 0, tasks: 0, right: 0, newWords: 0, rounds: 0, goal: false, shield: false, ...p });

/** Sonntag, 8. November: Woche vom 2. mit Tagebuch und laufenden Challenges anlegen. */
async function seedWeek(page: Page) {
  await page.clock.setFixedTime(new Date('2026-11-08T19:00:00'));
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.evaluate(
    async (days) => {
      const db = await new Promise<IDBDatabase>((res) => {
        const r = indexedDB.open('viet-trainer');
        r.onsuccess = () => res(r.result);
      });
      const store = (m: IDBTransactionMode) => db.transaction('state', m).objectStore('state');
      const save = await new Promise<Record<string, any>>((res) => {
        const t = store('readonly').get('save');
        t.onsuccess = () => res(t.result);
      });
      save.days = days;
      save.createdAt = '2026-10-20T09:00:00.000Z';
      save.stats.pairs = 10;
      save.stats.goals = 5;
      save.stats.tones = 20;
      save.challenges = {
        week: '2026-11-02',
        list: [
          { id: 'paare', base: 5, done: true },
          { id: 'tagesziel', base: 2, done: false },
          { id: 'ton', base: 5, done: true },
        ],
      };
      await new Promise((res) => {
        const t = store('readwrite').put(save, 'save');
        t.onsuccess = res;
      });
    },
    {
      '2026-11-03': L({ xp: 60, tasks: 14, right: 12, newWords: 4, rounds: 2, goal: true }),
      '2026-11-05': L({ shield: true }),
      '2026-11-07': L({ xp: 90, tasks: 22, right: 19, newWords: 8, rounds: 3, goal: true }),
      '2026-11-08': L({ xp: 25, tasks: 6, right: 5, newWords: 1, rounds: 1 }),
    },
  );
}

test('Wochenrückblick: am Montag einmal von selbst, Doppelseite mit Lerntagen, Zahlen und Challenges', async ({ page }) => {
  await seedWeek(page);
  await page.clock.setFixedTime(new Date('2026-11-09T08:30:00'));
  await page.reload();

  await expect(page.getByRole('dialog', { name: '2.–8. November' })).toBeVisible();
  // Inhalt ohne Namen suchen: der Name des Dialogs folgt der aufgeschlagenen Seite
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Deine Woche').first()).toBeVisible();
  await expect(dialog.getByRole('list', { name: 'Lerntage' }).getByRole('listitem')).toHaveCount(7);
  await expect(dialog.getByRole('listitem', { name: 'Di 3.: Tagesziel' })).toBeVisible();
  await expect(dialog.getByRole('listitem', { name: 'Do 5.: Streak-Schutz' })).toBeVisible();
  await expect(dialog.getByRole('listitem', { name: 'So 8.: gelernt' })).toBeVisible();
  const big = dialog.locator('.big dd');
  await expect(big.nth(0)).toHaveText('3');
  await expect(big.nth(1)).toHaveText('2');
  await expect(big.nth(2)).toHaveAttribute('data-value', '175');
  await expect(big.nth(2).locator('.sr')).toHaveText('175');
  await expect(dialog.getByText('Einen Tag hat der Streak-Schutz gerettet.')).toBeVisible();

  // Umblättern: Seite 2
  await dialog.getByRole('button', { name: 'Weiter', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Gelernt' })).toBeVisible();
  const grid = dialog.locator('.grid dd');
  await expect(grid).toHaveText(['13', '42', '86 %', '6']);
  const ch = dialog.locator('.challenges li');
  await expect(ch).toHaveCount(3);
  await expect(ch.nth(0)).toContainText('5 Paare-Runden gegen die Uhr gewinnen');
  await expect(ch.nth(0)).toContainText('geschafft');
  await expect(ch.nth(1)).toContainText('3 / 4');
  await expect(ch.nth(2)).toContainText('geschafft');
  // und zurück
  await dialog.getByRole('button', { name: 'Vorige Seite' }).click();
  await expect(page.getByRole('dialog', { name: '2.–8. November' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Weiter', exact: true }).click();
  await dialog.getByRole('button', { name: 'Fertig', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Nur einmal: nach dem Neuladen kommt er nicht wieder
  await page.reload();
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);

  // Aus dem Laternen-Kalender: jede Woche mit Lerntagen; die neue Woche hat noch keine
  await page.getByRole('button', { name: 'Profil', exact: true }).click();
  await page.locator('.day[data-date="2026-11-09"]').click();
  await expect(page.locator('.week-btn')).toBeDisabled();
  await page.locator('.day[data-date="2026-11-07"]').click();
  await page.getByRole('button', { name: 'Woche 2.–8. November ansehen' }).click();
  await expect(page.getByRole('dialog', { name: '2.–8. November' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('Wochenrückblick nach Rückkehr aus dem Hintergrund (ohne Neuladen): die alte Woche ist festgehalten', async ({ page }) => {
  await seedWeek(page);
  await page.reload(); // Sonntag: App offen, kein Rückblick
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Über Nacht im Hintergrund, Montag früh zurück – iOS lädt die App dabei nicht neu
  await page.clock.setFixedTime(new Date('2026-11-09T08:30:00'));
  await page.evaluate(() => {
    const set = (v: DocumentVisibilityState) => {
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v });
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => v === 'hidden' });
      document.dispatchEvent(new Event('visibilitychange'));
    };
    set('hidden');
    set('visible');
  });
  await expect(page.getByRole('dialog', { name: '2.–8. November' })).toBeVisible();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Weiter', exact: true }).click();
  const ch = dialog.locator('.challenges li');
  await expect(ch).toHaveCount(3);
  await expect(ch.nth(0)).toContainText('geschafft');
  await expect(ch.nth(1)).toContainText('3 / 4');
  await expect(dialog).not.toContainText('nicht festgehalten');
});

test('Wochenrückblick: nicht in derselben Woche und nicht nach einer Woche ohne Lernen', async ({ page }) => {
  await seedWeek(page);
  await page.reload(); // noch Sonntag
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
  // Zwei Wochen später: in der Woche davor (9.–15.) wurde nicht gelernt
  await page.clock.setFixedTime(new Date('2026-11-16T09:00:00'));
  await page.reload();
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.waitForTimeout(800);
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
