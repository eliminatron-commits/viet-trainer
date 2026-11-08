import { expect, test } from '@playwright/test';
import { withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

const L = (p: Record<string, number | boolean>) => ({ xp: 0, tasks: 0, right: 0, newWords: 0, rounds: 0, goal: false, shield: false, ...p });

test('Laternen-Kalender: eine Laterne je Tag, Tag antippen zeigt seine Zahlen, Monate blättern', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-24T10:00:00'));
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: 'Profil', exact: true })).toBeVisible();
  await page.evaluate(
    async (days) => {
      const db = await new Promise<IDBDatabase>((res) => {
        const r = indexedDB.open('viet-trainer');
        r.onsuccess = () => res(r.result);
      });
      const store = (m: IDBTransactionMode) => db.transaction('state', m).objectStore('state');
      const save = await new Promise<Record<string, unknown>>((res) => {
        const t = store('readonly').get('save');
        t.onsuccess = () => res(t.result);
      });
      save.days = days;
      save.createdAt = '2026-11-01T09:00:00.000Z';
      save.today = { date: '2026-11-24', xp: 15 };
      await new Promise((res) => {
        const t = store('readwrite').put(save, 'save');
        t.onsuccess = res;
      });
    },
    {
      '2026-10-30': L({ xp: 20, tasks: 4, right: 4 }),
      '2026-11-07': L({ xp: 90, tasks: 22, right: 19, newWords: 8, rounds: 3, goal: true }),
      '2026-11-08': L({ xp: 25, tasks: 6, right: 5, newWords: 2, rounds: 1 }),
      '2026-11-12': L({ shield: true }),
      '2026-11-24': L({ xp: 15, tasks: 4, right: 3, newWords: 1 }),
    },
  );
  await page.reload();
  await page.getByRole('button', { name: 'Profil', exact: true }).click();

  const cal = page.locator('.calendar');
  await expect(page.getByRole('heading', { name: 'Laternen-Kalender' })).toBeVisible();
  await expect(cal.getByText('November 2026', { exact: true })).toBeVisible();
  await expect(cal.getByText('3 Lerntage · 1 Tagesziel', { exact: true })).toBeVisible();
  const day = (d: string) => cal.locator(`.day[data-date="${d}"]`);
  await expect(cal.locator('.grid .day')).toHaveCount(30);
  for (const [d, state] of [
    ['2026-11-03', 'before'],
    ['2026-11-07', 'goal'],
    ['2026-11-08', 'learned'],
    ['2026-11-11', 'off'],
    ['2026-11-12', 'shield'],
    ['2026-11-24', 'learned'],
    ['2026-11-25', 'future'],
  ] as const)
    await expect(day(d)).toHaveAttribute('data-lantern', state);
  await expect(day('2026-11-25')).toBeDisabled();
  await expect(cal.getByRole('button', { name: 'Nächster Monat' })).toBeDisabled();

  // Heute ist gewählt
  const info = cal.locator('.info');
  await expect(day('2026-11-24')).toHaveAttribute('aria-pressed', 'true');
  await expect(info).toContainText('Dienstag, 24. November');
  await expect(info).toContainText('heute');
  await expect(info).toContainText('Gelernt – das Tagesziel fehlt noch');

  // Tag antippen: seine Zahlen
  await page.getByRole('button', { name: 'Samstag, 7. November: Tagesziel erreicht' }).click();
  await expect(day('2026-11-07')).toHaveAttribute('aria-pressed', 'true');
  await expect(day('2026-11-24')).toHaveAttribute('aria-pressed', 'false');
  await expect(info.locator('.i-title')).toHaveText('Samstag, 7. November');
  await expect(info.locator('.i-status')).toHaveText('Tagesziel erreicht · 3 Runden');
  await expect(info.locator('dd')).toHaveText(['90', '22', '19', '8']);
  await expect(info.locator('dt')).toHaveText(['XP', 'Aufgaben', 'richtig', 'neue Wörter']);
  await day('2026-11-12').click();
  await expect(info.locator('.i-status')).toHaveText('Der Streak-Schutz hat die Serie gerettet');
  await day('2026-11-03').click();
  await expect(info.locator('.i-status')).toHaveText('Vor dem Tagebuch – es zählt seit dem 7. November 2026');
  await expect(info.locator('dd')).toHaveText(['–', '–', '–', '–']);

  // Blättern per Pfeil: zurück bis zum ersten Eintrag, weiter nicht
  await cal.getByRole('button', { name: 'Voriger Monat' }).click();
  await expect(cal.getByText('Oktober 2026', { exact: true })).toBeVisible();
  await expect(cal.locator('.grid .day')).toHaveCount(31);
  await expect(day('2026-10-30')).toHaveAttribute('data-lantern', 'learned');
  await expect(cal.getByRole('button', { name: 'Voriger Monat' })).toBeDisabled();
  await expect(info).toContainText('Tipp eine Laterne an');
  await cal.getByRole('button', { name: 'Nächster Monat' }).click();
  await expect(cal.getByText('November 2026', { exact: true })).toBeVisible();
  await expect(day('2026-11-24')).toHaveAttribute('aria-pressed', 'true');

  // Wischen nach rechts blättert zurück; das Loslassen wählt keinen Tag
  const box = (await cal.locator('.pages').boundingBox())!;
  const y = box.y + box.height / 2;
  await page.mouse.move(box.x + 60, y);
  await page.mouse.down();
  await page.mouse.move(box.x + 200, y, { steps: 6 });
  await page.mouse.up();
  await expect(cal.getByText('Oktober 2026', { exact: true })).toBeVisible();
  await expect(cal.locator('.day[aria-pressed="true"]')).toHaveCount(0);
});
