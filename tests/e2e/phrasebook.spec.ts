import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

/** „cảm ơn“ als Unicode-Escape, damit die Schreibweise (zusammengesetzt) nicht vom Editor abhängt. */
const CAM_ON = 'cảm ơn';

const openPhrasebook = async (page: Page) => {
  await page.getByRole('button', { name: 'Sprachführer' }).click();
  await expect(page.getByRole('heading', { name: 'Sprachführer', level: 1 })).toBeVisible();
};

test('Sprachführer: Situationen, Suche ohne Akzente und Favoriten über Neuladen', async ({ page }) => {
  await page.goto('/viet-trainer/');
  await openPhrasebook(page);

  // Übersicht: Situationen als Orte; ein Tipp öffnet die Situation als Vollbild mit eigener Suche, „Zurück“ führt zurück.
  await page.getByRole('button', { name: /^Restaurant/ }).click();
  await expect(page.getByRole('heading', { name: 'Restaurant', level: 1 })).toBeVisible();
  await expect(page.locator('li.item').first()).toBeVisible();
  const count = page.locator('p.count');
  const all = Number((await count.textContent())!.split(' ')[0]);
  await page.getByRole('searchbox', { name: 'In Restaurant suchen' }).fill('com');
  await expect(page.locator('li.item').first()).toContainText(/cơm/i);
  expect(Number((await count.textContent())!.split(' ')[0])).toBeLessThan(all);
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { name: 'Sprachführer', level: 1 })).toBeVisible();
  await expect(page.locator('li.item')).toHaveCount(0);
  await expect(page.locator('[data-situation]')).toHaveCount(10);

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

test('Satzlupe: Satz Wort für Wort, Wortkarte mit Rolle im Gespräch, Verlauf, Merken und Schließen', async ({ page }) => {
  await page.goto('/viet-trainer/');
  await openPhrasebook(page);
  await page.getByRole('searchbox', { name: 'Suchen' }).fill('Anh là bạn của em');
  await page.locator('li.item[data-id="s002"]').getByRole('button', { name: /Wort für Wort erklären/ }).click();

  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: 'Anh là bạn của em.', exact: true })).toBeFocused();
  // Jedes Wort mit Erklärung; die Anreden zeigen, was sie in diesem Gespräch heißen.
  await expect(sheet.locator('.tile')).toHaveText([/^Anh\s*du$/, /^là\s*sein \/ ist$/, /^bạn\s*du \/ Freund$/, /^của/, /^em\s*ich$/]);

  await sheet.locator('.tile').last().click();
  await expect(sheet.getByRole('heading', { name: 'em', exact: true })).toBeVisible();
  await expect(sheet.getByText('„ich“ – du sprichst zu älterem Mann')).toBeVisible();
  await expect(sheet.getByText('ngang', { exact: true })).toBeVisible();

  // Weitere Sätze mit dem Wort öffnen ihre Satzlupe; „Zurück“ führt zur Wortkarte.
  await sheet.locator('.other').first().click();
  await expect(sheet.locator('.tile').first()).toBeVisible();
  await sheet.getByRole('button', { name: 'Zurück' }).click();
  await expect(sheet.getByRole('heading', { name: 'em', exact: true })).toBeVisible();

  // Merken setzt den Favoriten; Escape schließt das Blatt.
  await sheet.getByRole('button', { name: 'Merken' }).click();
  await expect(sheet.getByRole('button', { name: 'Gemerkt' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Suche löschen' }).click();
  await page.getByRole('button', { name: 'Favoriten', exact: true }).click();
  await expect(page.locator('li.item[data-id="w005"]')).toBeVisible();
});

test('Zurück aus einer Situation: der Sprachführer steht wieder an derselben Stelle (auch ohne Übergänge)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 700 });
  await page.goto('/viet-trainer/');
  await openPhrasebook(page);
  const tile = page.locator('[data-situation="arbeit"]');
  await tile.scrollIntoViewIfNeeded();
  const before = await page.evaluate(() => scrollY);
  expect(before).toBeGreaterThan(300);
  await tile.click();
  await expect(page.getByRole('heading', { name: 'Arbeit', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page.locator('[data-situation="arbeit"]')).toBeInViewport();
  expect(Math.abs((await page.evaluate(() => scrollY)) - before)).toBeLessThan(4);
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
