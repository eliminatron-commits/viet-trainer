import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

/** Wie stage.spec.ts: ohne View Transitions (WebKit unter Windows stürzt sonst ab); die Übergänge prüft die Hauptsitzung am iPhone-Maß. */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition;
  });
});

/** „cảm ơn“ als Unicode-Escape, damit die Schreibweise (zusammengesetzt) nicht vom Editor abhängt. */
const CAM_ON = 'cảm ơn';

const openPhrasebook = async (page: Page) => {
  await page.getByRole('button', { name: 'Sprachführer' }).click();
  await expect(page.getByRole('heading', { name: 'Sprachführer', level: 1 })).toBeVisible();
};

test('Sprachführer: Situationen, Suche ohne Akzente und Favoriten über Neuladen', async ({ page }) => {
  await page.goto('/viet-trainer/');
  await openPhrasebook(page);

  // Übersicht: Situationskarten, ein Tipp öffnet die Liste der Situation.
  await page.getByRole('button', { name: /^Restaurant/ }).click();
  await expect(page.getByRole('heading', { name: 'Restaurant', level: 2 })).toBeVisible();
  await expect(page.locator('li.item').first()).toBeVisible();
  await page.getByRole('button', { name: 'Alle Situationen' }).click();
  await expect(page.locator('li.item')).toHaveCount(0);

  // „cam on“ findet „cảm ơn“ (der genaue Treffer steht vorn).
  await page.getByRole('searchbox', { name: 'Suchen' }).fill('cam on');
  const item = page.locator('li.item').first();
  await expect(item).toContainText(CAM_ON);
  const id = await item.getAttribute('data-id');
  expect(id).toMatch(/^[ws]\d+$/);

  // Noch keine Favoriten.
  await page.getByRole('button', { name: 'Suche löschen' }).click();
  await page.getByRole('button', { name: 'Favoriten', exact: true }).click();
  await expect(page.getByText('Noch keine Favoriten')).toBeVisible();
  await page.getByRole('button', { name: 'Alle', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Suchen' }).fill('cam on');

  // Favorit setzen → erscheint unter „Favoriten“.
  const star = page.locator(`li.item[data-id="${id}"]`).getByRole('button', { name: 'Favorit', exact: true });
  await star.click();
  await expect(star).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Suche löschen' }).click();
  await page.getByRole('button', { name: 'Favoriten', exact: true }).click();
  await expect(page.locator('li.item')).toHaveCount(1);
  await expect(page.locator(`li.item[data-id="${id}"]`)).toContainText(CAM_ON);

  // Der Favorit übersteht ein Neuladen.
  await page.reload();
  await openPhrasebook(page);
  await page.getByRole('button', { name: 'Favoriten', exact: true }).click();
  await expect(page.locator(`li.item[data-id="${id}"]`)).toBeVisible();
  await expect(page.locator('li.item')).toHaveCount(1);

  // Stern wieder abwählen → Liste leer.
  await page.locator(`li.item[data-id="${id}"]`).getByRole('button', { name: 'Favorit', exact: true }).click();
  await expect(page.getByText('Noch keine Favoriten')).toBeVisible();
});

test('Prüfmodus: beurteilen, Notiz speichern und als JSON exportieren', async ({ page }) => {
  await page.goto('/viet-trainer/');
  await page.getByRole('button', { name: 'Profil' }).click();
  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await page.getByRole('button', { name: 'Prüfmodus öffnen' }).click();
  await expect(page.getByRole('heading', { name: 'Prüfmodus', level: 1 })).toBeVisible();

  const progress = page.locator('.progress');
  await expect(progress).toHaveAttribute('data-done', '0');
  const total = await progress.getAttribute('data-total');
  expect(Number(total)).toBeGreaterThan(2);
  await expect(progress).toHaveText(`0 von ${total} beurteilt`);
  await expect(page.getByRole('button', { name: /exportieren/ })).toBeDisabled();

  // Der erste Eintrag „passt“, der zweite ist „unnatürlich“ mit Notiz. Beurteilte Karten bleiben im Filter „offen“ stehen.
  const items = page.locator('li.item');
  const firstId = await items.nth(0).getAttribute('data-id');
  const secondId = await items.nth(1).getAttribute('data-id');
  await items.nth(0).getByRole('button', { name: 'Passt', exact: true }).click();
  await items.nth(1).getByRole('button', { name: 'Unnatürlich', exact: true }).click();
  await items.nth(1).getByRole('textbox', { name: 'Notiz' }).fill('klingt steif');
  await expect(progress).toHaveText(`2 von ${total} beurteilt`);
  await expect(items.nth(1)).toHaveAttribute('data-id', secondId!);

  // Neuladen: Urteile und Notiz sind gespeichert.
  await page.reload();
  await page.getByRole('button', { name: 'Profil' }).click();
  await page.getByRole('button', { name: 'Einstellungen' }).click();
  await page.getByRole('button', { name: 'Prüfmodus öffnen' }).click();
  await expect(progress).toHaveText(`2 von ${total} beurteilt`);
  await page.getByRole('button', { name: 'Alle', exact: true }).click();
  await expect(page.locator(`li.item[data-id="${secondId}"]`).getByRole('textbox', { name: 'Notiz' })).toHaveValue('klingt steif');

  // Export: nur die zwei beurteilten Einträge.
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: /exportieren/ }).click(),
  ]);
  expect(download.suggestedFilename()).toMatch(/^viet-trainer-pruefung-\d{4}-\d{2}-\d{2}\.json$/);
  const data = JSON.parse(readFileSync((await download.path())!, 'utf8')) as {
    app: string;
    exportedAt: string;
    items: { id: string; vn: string; de: string; pron?: string; verdict: string; note: string }[];
  };
  expect(data.app).toBe('viet-trainer');
  expect(Number.isNaN(Date.parse(data.exportedAt))).toBe(false);
  expect(data.items).toHaveLength(2);
  expect(data.items[0]).toMatchObject({ id: firstId, verdict: 'ok', note: '' });
  expect(data.items[1]).toMatchObject({ id: secondId, verdict: 'unnatural', note: 'klingt steif' });
  for (const i of data.items) {
    expect(i.vn).toBeTruthy();
    expect(i.de).toBeTruthy();
  }

  // Urteil zurücknehmen: erneutes Tippen auf „Passt“.
  await page.locator(`li.item[data-id="${firstId}"]`).getByRole('button', { name: 'Passt', exact: true }).click();
  await expect(progress).toHaveText(`1 von ${total} beurteilt`);
});
