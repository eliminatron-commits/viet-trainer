import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { withoutViewTransitions } from './helpers';

const words: { id: string; vn: string }[] = JSON.parse(readFileSync('src/content/words.json', 'utf8'));
const byVn = (vn: string) => words.find((w) => w.vn.trim() === vn)!;

/**
 * Wie auf dem iPhone im Vollbild (Safe-Area oben und unten), die ersten zehn Wörter und bán gelernt (bạn/bán sind
 * Ton-Zwillinge), Tagesblick aus. Danach im Training die Karte der Übung in die Mitte holen und starten.
 */
async function start(page: Page, safe: { top: number; bottom: number }, focus: 'tone' | 'twins') {
  await withoutViewTransitions(page);
  await page.addInitScript((s) => {
    document.addEventListener('DOMContentLoaded', () => {
      const st = document.createElement('style');
      st.textContent = `:root{--safe-top:${s.top}px !important;--safe-bottom:${s.bottom}px !important}`;
      document.head.append(st);
    });
  }, safe);
  const ids = [...words.slice(0, 10).map((w) => w.id), byVn('bán').id];
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
  await page.getByRole('button', { name: focus === 'tone' ? 'Zu Ton-Ninja' : 'Zu Ton-Zwillinge' }).click();
  const card = page.locator(`[data-focus="${focus}"]`);
  await expect(card).toHaveClass(/current/);
  await card.click();
  await expect(page.locator('main.play')).toHaveAttribute('data-task-kind', focus);
}

/** Falsch antworten und warten, bis Leiste und Kacheln stehen (Aufsteigen, Wackeln). */
async function answerWrong(page: Page) {
  const play = page.locator('main.play');
  const answer = (await play.getAttribute('data-answer'))!;
  const ids = await play.locator('.answers [data-id]').evaluateAll((els) => els.map((e) => (e as HTMLElement).dataset.id!));
  await play.locator(`[data-id="${ids.find((id) => id !== answer)}"]`).click();
  await expect(page.getByRole('status').filter({ hasText: 'Nicht ganz.' })).toBeVisible();
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((a) => Number(a.effect?.getComputedTiming().endTime) !== Infinity)
        .map((a) => a.finished.catch(() => {})),
    ),
  );
}

/** Anteil jeder Antwortkachel über der Oberkante der Rückmeldungsleiste (1 = ganz sichtbar), in Bildschirmreihenfolge. */
function shares(page: Page): Promise<number[]> {
  return page.locator('main.play').evaluate((play) => {
    const top = play.querySelector('.feedback')!.getBoundingClientRect().top;
    return [...play.querySelectorAll('.answers [data-id]')]
      .map((e) => e.getBoundingClientRect())
      .sort((a, b) => a.top - b.top)
      .map((r) => Math.round((100 * Math.max(0, Math.min(r.bottom, top) - Math.max(r.top, 0))) / r.height) / 100);
  });
}

test.describe('440×956 (iPhone Pro Max im Vollbild)', () => {
  test.use({ viewport: { width: 440, height: 956 } });

  test('Ton-Ninja: nach der Antwort liegen alle vier Kacheln über der Rückmeldungsleiste', async ({ page }) => {
    await start(page, { top: 59, bottom: 34 }, 'tone');
    let four = 0;
    for (let i = 0; i < 8 && four < 2; i++) {
      await answerWrong(page);
      const s = await shares(page);
      expect(s.every((x) => x === 1), `Kacheln sichtbar: ${s.join(' / ')}`).toBe(true);
      if (s.length === 4) four++;
      await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    }
    expect(four, 'Aufgaben mit vier Kacheln').toBe(2);
  });
});

test.describe('375×667 (kleines iPhone)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('Ton-Zwillinge: nach der Antwort liegen die ersten zwei Kacheln ganz über der Rückmeldungsleiste', async ({ page }) => {
    await start(page, { top: 20, bottom: 0 }, 'twins');
    await answerWrong(page);
    const s = await shares(page);
    expect(s.slice(0, 2), `Kacheln sichtbar: ${s.join(' / ')}`).toEqual([1, 1]);
    // „Zum Wort“ und „Weiter“ stehen nebeneinander und bleiben Tap-Ziele
    const lens = await page.getByRole('button', { name: 'Zum Wort' }).boundingBox();
    const next = await page.getByRole('button', { name: 'Weiter', exact: true }).boundingBox();
    expect(Math.abs(lens!.y + lens!.height / 2 - (next!.y + next!.height / 2))).toBeLessThan(4);
    expect(lens!.x + lens!.width).toBeLessThanOrEqual(next!.x);
    expect(Math.min(lens!.height, lens!.width, next!.height)).toBeGreaterThanOrEqual(44);
  });
});
