import { readFileSync } from 'node:fs';
import { expect, test } from '@playwright/test';
import { solveTask, withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

const words: { id: string }[] = JSON.parse(readFileSync('src/content/words.json', 'utf8'));
const sentences: { id: string; words: string[] }[] = JSON.parse(readFileSync('src/content/sentences.json', 'utf8'));

test('Lückensatz: aus dem Karussell starten, falsch und richtig lösen, das richtige Wort steht in der Lücke', async ({ page }) => {
  // gelernt: die ersten 60 Wörter und alle Sätze, die nur aus ihnen bestehen
  const learned = new Set(words.slice(0, 60).map((w) => w.id));
  const ids = [...learned, ...sentences.filter((s) => s.words.every((w) => learned.has(w))).map((s) => s.id)];
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
    const d = new Date();
    d.setDate(d.getDate() + 3);
    const later = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    for (const id of ids) save.items[id] = { box: 2, due: later, seen: 2, right: 1, wrong: 0 };
    // Tagesblick aus: er hat eigene Tests (brief.spec.ts) und läge sonst über der Seite.
    save.settings.brief = false;
    await new Promise((res) => {
      const t = store('readwrite').put(save, 'save');
      t.onsuccess = res;
    });
  }, ids);
  await page.reload();
  await page.getByRole('button', { name: 'Training', exact: true }).click();

  await page.getByRole('button', { name: 'Zu Lückensatz' }).click();
  const card = page.locator('[data-focus="gap"]');
  await expect(card).toHaveClass(/current/);
  await expect(card).not.toHaveAttribute('aria-disabled', 'true');
  await card.click();

  const play = page.locator('main.play');
  await expect(play).toHaveAttribute('data-task-kind', 'gap');
  await expect(page.getByText('Welches Wort fehlt?')).toBeVisible();
  await expect(play.locator('.gap .fill')).toHaveText('Lücke');
  const options = play.locator('.answers [data-id]');
  await expect(options).toHaveCount(4);

  // Falsch: die getippte Kachel ist rot, die richtige grün, und in der Lücke steht das richtige Wort.
  const answer = (await play.getAttribute('data-answer'))!;
  const ids4 = await options.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id!));
  const wrong = ids4.find((id) => id !== answer)!;
  await play.locator(`[data-id="${wrong}"]`).click();
  await expect(page.getByRole('status').filter({ hasText: 'Nicht ganz.' })).toBeVisible();
  await expect(play.locator(`[data-id="${wrong}"]`)).toHaveClass(/wrong/);
  await expect(play.locator(`[data-id="${answer}"]`)).toHaveClass(/right/);
  const right = (await play.locator(`[data-id="${answer}"]`).textContent())!.trim().toLowerCase();
  expect((await play.locator('.gap .fill').textContent())!.trim().toLowerCase()).toBe(right);

  // Richtig, dann Wort für Wort zum Satz.
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await expect(play).toHaveAttribute('data-task-kind', 'gap');
  await solveTask(page);
  await page.getByRole('button', { name: 'Wort für Wort' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.getByRole('button', { name: 'Training beenden' }).click();
  await expect(page.getByRole('heading', { name: '1 von 2 richtig' })).toBeVisible();
});
