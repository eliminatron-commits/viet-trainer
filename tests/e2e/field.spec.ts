import { expect, test, type Page } from '@playwright/test';
import { playRound, solveTask, withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

/** Spielstand mit `thirsty` gelernten Wörtern, die seit gestern fällig sind, und `fine` Wörtern, die noch Zeit haben. */
async function seedField(page: Page, thirsty: number, fine: number) {
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: 'Training', exact: true })).toBeVisible();
  await page.evaluate(
    async ({ thirsty, fine }) => {
      const db = await new Promise<IDBDatabase>((res) => {
        const r = indexedDB.open('viet-trainer');
        r.onsuccess = () => res(r.result);
      });
      const store = (m: IDBTransactionMode) => db.transaction('state', m).objectStore('state');
      const save = await new Promise<{ items: Record<string, unknown>; settings: { brief: boolean } }>((res) => {
        const t = store('readonly').get('save');
        t.onsuccess = () => res(t.result);
      });
      const day = (n: number) => {
        const d = new Date();
        d.setDate(d.getDate() + n);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };
      for (let i = 1; i <= thirsty + fine; i++) {
        save.items[`w${String(i).padStart(3, '0')}`] = { box: 2, due: day(i <= thirsty ? -1 : 3), seen: 2, right: 1, wrong: 0 };
      }
      // Tagesblick aus: er hat eigene Tests (brief.spec.ts) und läge sonst über der Seite.
      save.settings.brief = false;
      await new Promise((res) => {
        const t = store('readwrite').put(save, 'save');
        t.onsuccess = res;
      });
    },
    { thirsty, fine },
  );
  await page.reload();
  await page.getByRole('button', { name: 'Training', exact: true }).click();
}

test('Gießrunde: nur die durstigen Pflanzen, danach ist das Feld gegossen und das Training geht auf Wunsch weiter', async ({ page }) => {
  await seedField(page, 5, 6);
  await expect(page.getByText('5 durstig')).toBeVisible();
  await page.getByRole('button', { name: 'Feld gießen', exact: true }).click();
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '5');
  expect(await playRound(page)).toBe('done');
  await expect(page.getByText('Feld gegossen', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '5 von 5 richtig' })).toBeVisible();

  // Weiter trainieren: gewöhnliches Training mit allem Gelernten.
  await page.getByRole('button', { name: 'Weiter trainieren' }).click();
  await expect(page.locator('main.play')).not.toHaveAttribute('data-outcome', /./);
  await expect(page.getByRole('progressbar')).toBeVisible();
  await solveTask(page);
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await page.getByRole('button', { name: 'Training beenden' }).click();
  await expect(page.getByText('Training beendet', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fertig' }).click();

  // Zurück im Training: nichts mehr durstig, der Knopf startet wieder das gewöhnliche Training.
  await expect(page.getByText('alle gegossen')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Training starten', exact: true })).toBeVisible();
});

test('Pflanze antippen zeigt das Wort und führt zur Wortkarte', async ({ page }) => {
  await seedField(page, 0, 4);
  // Tastatur wählt die Pflanzen der Reihe nach (wie Antippen).
  await page.getByRole('button', { name: /^Reisfeld mit 4 Pflanzen/ }).press('Enter');
  const look = page.getByRole('button', { name: 'Zum Wort' });
  await expect(look).toBeVisible();
  const vn = (await page.locator('.detail strong[lang="vi"]').textContent())!.trim();
  await look.click();
  const sheet = page.getByRole('dialog');
  await expect(sheet.getByRole('heading', { name: vn, exact: true })).toBeVisible();
  await sheet.getByRole('button', { name: 'Schließen' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
