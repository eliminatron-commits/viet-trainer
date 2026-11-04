import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { solveTask, withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

/** Spielstand direkt aus IndexedDB, wie ihn ein Neustart lädt. */
const storedSave = (page: Page) =>
  page.evaluate(
    () =>
      new Promise<{ stats: { correct: number }; favorites: string[]; items: Record<string, unknown> }>((resolve, reject) => {
        const open = indexedDB.open('viet-trainer');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const get = open.result.transaction('state').objectStore('state').get('save');
          get.onsuccess = () => resolve(get.result);
          get.onerror = () => reject(get.error);
        };
      }),
  );

const openSettings = async (page: Page) => {
  await page.getByRole('button', { name: 'Profil' }).click();
  await page.getByRole('button', { name: 'Einstellungen' }).click();
};

test('App-Kill mitten in der Session verliert höchstens die laufende Aufgabe', async ({ page }) => {
  await page.goto('/viet-trainer/');
  await page.getByRole('button', { name: /Etappe 1: Ich & du/ }).click();
  await page.getByRole('button', { name: 'Etappe starten' }).click();

  // Drei Aufgaben richtig lösen (Einführungen zählen nicht), die vierte bleibt offen – dann „abschießen“.
  let solved = 0;
  while (solved < 3) {
    if ((await solveTask(page)) !== 'intro') solved++;
    await page.getByRole('button', { name: /^Weiter/ }).first().click();
  }
  await page.reload();

  const save = await storedSave(page);
  expect(save.stats.correct).toBe(3);
  expect(Object.keys(save.items).length).toBeGreaterThan(0);
  await page.getByRole('button', { name: /Etappe 1: Ich & du/ }).click();
  await expect(page.getByRole('button', { name: 'Weiterlernen' })).toBeVisible();
});

test('Fortschritt sichern: Export als Datei, Import stellt genau diesen Stand wieder her', async ({ page }) => {
  await page.goto('/viet-trainer/');
  // Ein Stand mit Fortschritt und einem Favoriten.
  await page.getByRole('button', { name: /Etappe 1: Ich & du/ }).click();
  await page.getByRole('button', { name: 'Etappe starten' }).click();
  let solved = 0;
  while (solved < 2) {
    if ((await solveTask(page)) !== 'intro') solved++;
    await page.getByRole('button', { name: /^Weiter/ }).first().click();
  }
  await page.reload();
  await page.getByRole('button', { name: 'Sprachführer' }).click();
  await page.getByRole('button', { name: /^Restaurant/ }).click();
  const first = page.locator('li.item').first();
  const favId = await first.getAttribute('data-id');
  await first.getByRole('button', { name: 'Favorit', exact: true }).click();
  await expect(first.getByRole('button', { name: 'Favorit', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const exported = await storedSave(page);

  await openSettings(page);
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportieren (JSON)' }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^viet-trainer-\d{4}-\d{2}-\d{2}\.json$/);
  const file = (await download.path())!;
  expect(JSON.parse(readFileSync(file, 'utf8'))).toMatchObject({ stats: { correct: 2 }, favorites: [favId] });

  // Danach weitergespielt: der Stand ändert sich …
  await page.reload();
  await page.getByRole('button', { name: /Etappe 1: Ich & du/ }).click();
  await page.getByRole('button', { name: 'Weiterlernen' }).click();
  solved = 0;
  while (solved < 1) {
    if ((await solveTask(page)) !== 'intro') solved++;
    await page.getByRole('button', { name: /^Weiter/ }).first().click();
  }
  await page.reload();
  expect((await storedSave(page)).stats.correct).toBe(3);

  // … und der Import stellt den gesicherten Stand her – gespeichert, also auch nach einem Neustart.
  await openSettings(page);
  page.once('dialog', (d) => d.accept());
  await page.locator('input[type="file"]').setInputFiles(file);
  await expect(page.getByRole('status').filter({ hasText: 'Fortschritt importiert.' })).toBeVisible();
  await page.reload();
  const restored = await storedSave(page);
  expect(restored.stats.correct).toBe(2);
  expect(restored.favorites).toEqual([favId]);
  expect(Object.keys(restored.items).sort()).toEqual(Object.keys(exported.items).sort());
});

test('Offline (Flugmodus): App startet und jedes Audio kommt aus dem Cache', async ({ page, context }) => {
  await page.goto('/viet-trainer/');
  await page.waitForSelector('nav');
  // Service Worker übernimmt und hat alles vorab geladen.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise((r) => navigator.serviceWorker.addEventListener('controllerchange', r, { once: true }));
  });

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('navigation', { name: 'Hauptnavigation' })).toBeVisible();

  const ids = [
    ...(JSON.parse(readFileSync('src/content/words.json', 'utf8')) as { id: string }[]).map((w) => w.id),
    ...(JSON.parse(readFileSync('src/content/sentences.json', 'utf8')) as { id: string }[]).map((s) => s.id),
  ];
  const failed = await page.evaluate(async (ids) => {
    const bad: string[] = [];
    for (const id of ids) {
      try {
        const r = await fetch(`/viet-trainer/audio/${id}.mp3`);
        const size = (await r.arrayBuffer()).byteLength;
        if (!r.ok || size < 1000) bad.push(`${id} (${r.status}, ${size} B)`);
      } catch {
        bad.push(`${id} (nicht erreichbar)`);
      }
    }
    return bad;
  }, ids);
  expect(ids.length).toBe(808);
  expect(failed).toEqual([]);
});
