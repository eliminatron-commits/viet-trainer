import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

const words: { id: string; kind: string }[] = JSON.parse(readFileSync('src/content/words.json', 'utf8'));

/** Beantwortet die offene Sprint-Aufgabe (richtig oder falsch) und wartet, bis die nächste da ist oder das Ziel erreicht. */
async function answer(page: Page, right: boolean) {
  const sprint = page.locator('main.sprint');
  const id = (await sprint.getAttribute('data-answer'))!;
  const ids = await sprint.locator('.answers [data-id]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id!));
  await sprint.locator(`[data-id="${right ? id : ids.find((x) => x !== id)}"]`).click();
  // nie dasselbe Wort direkt hintereinander – eine neue Lösung heißt: nächste Aufgabe
  await expect(async () => {
    const phase = await sprint.getAttribute('data-phase');
    expect(phase === 'done' || (await sprint.getAttribute('data-answer')) !== id).toBe(true);
  }).toPass();
}

test('Roller-Sprint: Ampel, zwölf richtige bis ins Ziel, ein Fehler kostet 3 s, Bestzeit bleibt', async ({ page }) => {
  const learned = words.filter((w) => w.kind === 'word').slice(0, 20).map((w) => w.id);
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: 'Training', exact: true })).toBeVisible();
  await page.evaluate(async (ids) => {
    const db = await new Promise<IDBDatabase>((res) => {
      const r = indexedDB.open('viet-trainer');
      r.onsuccess = () => res(r.result);
    });
    const store = (m: IDBTransactionMode) => db.transaction('state', m).objectStore('state');
    const save = await new Promise<{ items: Record<string, unknown>; settings: { brief: boolean } }>((res) => {
      const t = store('readonly').get('save');
      t.onsuccess = () => res(t.result);
    });
    for (const id of ids) save.items[id] = { box: 2, due: '2099-01-01', seen: 2, right: 1, wrong: 0 };
    // Tagesblick aus: er hat eigene Tests (brief.spec.ts) und läge sonst über der Seite.
    save.settings.brief = false;
    await new Promise((res) => {
      const t = store('readwrite').put(save, 'save');
      t.onsuccess = res;
    });
  }, learned);
  await page.reload();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: 'Zu Roller-Sprint' }).click();
  const card = page.locator('[data-focus="sprint"]');
  await expect(card).toHaveClass(/current/);
  await expect(card).not.toHaveAttribute('aria-disabled', 'true');
  await card.click();

  // Ampel: erst Rot, die Uhr steht; dann geht es los
  const sprint = page.locator('main.sprint');
  await expect(sprint).toHaveAttribute('data-phase', 'ready');
  await expect(page.getByRole('status', { name: 'Rot' })).toBeVisible();
  await expect(page.getByRole('timer')).toHaveText('0,0 s');
  await expect(sprint).toHaveAttribute('data-phase', 'race', { timeout: 5000 });
  await expect(sprint).toHaveAttribute('data-task-kind', 'choice');
  const track = page.getByRole('progressbar', { name: 'Strecke bis ins Ziel' });
  await expect(track).toHaveAttribute('aria-valuemax', '12');

  // ein Fehler: kein Stück weiter, die Uhr springt um 3 s
  await answer(page, false);
  await expect(track).toHaveAttribute('aria-valuenow', '0');
  const afterMistake = (await page.getByRole('timer').textContent())!;
  expect(parseFloat(afterMistake.replace(',', '.'))).toBeGreaterThanOrEqual(3);
  for (let i = 1; i <= 12; i++) {
    await answer(page, true);
    if (i < 12) await expect(track).toHaveAttribute('aria-valuenow', String(i));
  }

  await expect(sprint).toHaveAttribute('data-phase', 'done');
  await expect(page.getByText('Erste Fahrt')).toBeVisible();
  await expect(page.getByText('1 Fehler, +3 s')).toBeVisible();
  const time = (await page.locator('.result .time').textContent())!.trim();
  expect(time).toMatch(/^\d+,\d s$/);
  await expect(page.locator('.records dd').first()).toHaveText(time);

  // Nochmal: wieder an der Ampel, dann zurück – die Karte zeigt die Bestzeit, auch nach einem Neustart
  await page.getByRole('button', { name: 'Nochmal fahren' }).click();
  await expect(sprint).toHaveAttribute('data-phase', 'ready');
  await page.getByRole('button', { name: 'Sprint beenden' }).click();
  await page.reload();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await expect(page.locator('[data-focus="sprint"]')).toContainText(`Bestzeit ${time}`);
});

test('Roller-Sprint: wer gleich nach der zwölften Antwort beendet, behält Fahrt und Bestzeit', async ({ page }) => {
  const learned = words.filter((w) => w.kind === 'word').slice(0, 20).map((w) => w.id);
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: 'Training', exact: true })).toBeVisible();
  await page.evaluate(async (ids) => {
    const db = await new Promise<IDBDatabase>((res) => {
      const r = indexedDB.open('viet-trainer');
      r.onsuccess = () => res(r.result);
    });
    const store = (m: IDBTransactionMode) => db.transaction('state', m).objectStore('state');
    const save = await new Promise<{ items: Record<string, unknown>; settings: { brief: boolean } }>((res) => {
      const t = store('readonly').get('save');
      t.onsuccess = () => res(t.result);
    });
    for (const id of ids) save.items[id] = { box: 2, due: '2099-01-01', seen: 2, right: 1, wrong: 0 };
    save.settings.brief = false;
    await new Promise((res) => {
      const t = store('readwrite').put(save, 'save');
      t.onsuccess = res;
    });
  }, learned);
  await page.reload();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: 'Zu Roller-Sprint' }).click();
  await page.locator('[data-focus="sprint"]').click();
  const sprint = page.locator('main.sprint');
  await expect(sprint).toHaveAttribute('data-phase', 'race', { timeout: 5000 });
  for (let i = 1; i < 12; i++) await answer(page, true);
  // die zwölfte richtige Antwort und sofort schließen – noch vor dem Ziel-Bildschirm
  await sprint.locator(`[data-id="${await sprint.getAttribute('data-answer')}"]`).click();
  await page.getByRole('button', { name: 'Sprint beenden' }).click();
  await expect(sprint).toHaveCount(0);
  await expect(page.locator('[data-focus="sprint"]')).toContainText('Bestzeit');
  const runs = () =>
    page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((res) => {
        const r = indexedDB.open('viet-trainer');
        r.onsuccess = () => res(r.result);
      });
      return new Promise<number>((res) => {
        const t = db.transaction('state', 'readonly').objectStore('state').get('save');
        t.onsuccess = () => res(t.result.sprint.runs);
      });
    });
  await expect.poll(runs).toBe(1);
});

test('Roller-Sprint ist gesperrt, solange zu wenig Wörter gelernt sind', async ({ page }) => {
  await page.goto('/viet-trainer/');
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: 'Zu Roller-Sprint' }).click();
  const card = page.locator('[data-focus="sprint"]');
  await expect(card).toHaveAttribute('aria-disabled', 'true');
  await expect(card).toContainText('mindestens 8 gelernte Wörter');
  // Antippen trotz Sperre (Playwright wartet sonst, bis die Karte frei ist)
  await card.click({ force: true });
  await expect(page.locator('main.sprint')).toHaveCount(0);
});
