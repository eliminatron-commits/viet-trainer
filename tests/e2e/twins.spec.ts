import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { solveTask, withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

const words: { id: string; vn: string; de: string }[] = JSON.parse(readFileSync('src/content/words.json', 'utf8'));
const byVn = (vn: string) => words.find((w) => w.vn.trim() === vn)!;

/** Spielstand: die ersten zehn Wörter gelernt, dazu die genannten; Tagesblick aus (er hat eigene Tests). */
async function seed(page: Page, extra: string[]) {
  const ids = [...words.slice(0, 10).map((w) => w.id), ...extra.map((vn) => byVn(vn).id)];
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
  }, ids);
  await page.reload();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: 'Zu Ton-Zwillinge' }).click();
}

test('Ton-Zwillinge: hören, Bedeutung wählen, danach steht bei jeder Bedeutung ihre Schreibung', async ({ page }) => {
  // bạn (Freund) ist unter den ersten zehn, bán (verkaufen) kommt dazu – bàn (Tisch) bleibt ungelernt
  await seed(page, ['bán']);
  const card = page.locator('[data-focus="twins"]');
  await expect(card).toHaveClass(/current/);
  await expect(card).not.toHaveAttribute('aria-disabled', 'true');
  await card.click();

  const play = page.locator('main.play');
  await expect(play).toHaveAttribute('data-task-kind', 'twins');
  await expect(page.getByText('Ton-Zwillinge: Was bedeutet das?')).toBeVisible();
  const options = play.locator('.answers [data-id]');
  await expect(options).toHaveCount(3);
  // vor der Antwort: nur Bedeutungen, keine Schreibung
  await expect(play.locator('.answers .spell').first()).toBeHidden();
  const answer = (await play.getAttribute('data-answer'))!;
  const target = words.find((w) => w.id === answer)!;
  expect(['bạn', 'bán']).toContain(target.vn.trim());
  await expect(play.locator(`[data-id="${answer}"]`)).toContainText(target.de);

  // falsch: die getippte Bedeutung rot, die richtige grün, jede mit ihrer Schreibung, oben das gehörte Wort
  const ids = await options.evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id!));
  const wrong = ids.find((id) => id !== answer)!;
  await play.locator(`[data-id="${wrong}"]`).click();
  await expect(page.getByRole('status').filter({ hasText: 'Nicht ganz.' })).toBeVisible();
  await expect(play.locator(`[data-id="${wrong}"]`)).toHaveClass(/wrong/);
  await expect(play.locator(`[data-id="${answer}"]`)).toHaveClass(/right/);
  // der dritte Zwilling bleibt voll lesbar – seine Schreibung gehört zum Lernen
  const third = ids.find((id) => id !== answer && id !== wrong)!;
  await expect(play.locator(`[data-id="${third}"]`)).not.toHaveClass(/dim/);
  for (const id of ids) {
    const spell = play.locator(`[data-id="${id}"] .spell`);
    await expect(spell).toBeVisible();
    await expect(spell).toHaveText(words.find((w) => w.id === id)!.vn.trim());
  }
  await expect(play.locator('.reveal')).toHaveText(target.vn.trim());

  // richtig, dann zum Wort
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await expect(play).toHaveAttribute('data-task-kind', 'twins');
  await solveTask(page);
  await expect(page.getByRole('button', { name: 'Zum Wort' })).toBeVisible();
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.getByRole('button', { name: 'Training beenden' }).click();
  await expect(page.getByRole('heading', { name: '1 von 2 richtig' })).toBeVisible();
});

test('Ton-Zwillinge sind gesperrt, solange kein Paar gelernt ist', async ({ page }) => {
  await seed(page, []);
  const card = page.locator('[data-focus="twins"]');
  await expect(card).toHaveClass(/current/);
  await expect(card).toHaveAttribute('aria-disabled', 'true');
  await expect(card).toContainText('Dafür brauchst du zwei gelernte Wörter, die sich nur im Ton unterscheiden.');
  // Antippen trotz Sperre (Playwright wartet sonst, bis die Karte frei ist)
  await card.click({ force: true });
  await expect(page.locator('main.play')).toHaveCount(0);
});
