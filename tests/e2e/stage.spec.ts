import { expect, test, type Page } from '@playwright/test';

/**
 * Das Playwright-WebKit unter Windows (WinCairo-Port, nicht iOS-Safari) stürzt reproduzierbar ab, wenn eine
 * View Transition auf eine Quiz-Aufgabe wechselt. Die E2E-Tests laufen daher ohne View Transitions
 * (die App fällt per Feature-Detection auf den Svelte-Crossfade zurück); die Übergänge werden auf dem iPhone geprüft.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition;
  });
});

/** Spielt die laufende Runde mit lauter richtigen Antworten zu Ende (Lösung steht als data-answer am Screen). */
async function playRound(page: Page): Promise<string> {
  const play = page.locator('main.play');
  for (let i = 0; i < 40; i++) {
    const outcome = await play.getAttribute('data-outcome');
    if (outcome) return outcome;
    const progress = await page.getByRole('progressbar').getAttribute('aria-valuenow');
    if ((await play.getAttribute('data-task-kind')) !== 'intro') {
      const answer = await play.getAttribute('data-answer');
      await play.locator(`[data-id="${answer}"]`).click();
      await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
    }
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    await page.waitForFunction(
      (prev) =>
        document.querySelector('main.play')?.getAttribute('data-outcome') ||
        document.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow') !== prev,
      progress,
    );
  }
  throw new Error('Runde endet nicht');
}

test('Etappe 1 ist von Start bis Boss spielbar und schaltet Etappe 2 frei', async ({ page }) => {
  await page.goto('/viet-trainer/');
  await expect(page.getByRole('button', { name: /Etappe 2: .* – gesperrt/ })).toBeDisabled();

  await page.getByRole('button', { name: /Etappe 1: Ich & du/ }).click();
  await expect(page.getByRole('button', { name: 'Bosskampf' })).toBeDisabled();
  await page.getByRole('button', { name: 'Etappe starten' }).click();

  // Runden spielen, bis der Boss wartet (Weiterspielen hängt jeweils eine Runde an).
  let rounds = 0;
  while (true) {
    expect(await playRound(page)).toBe('done');
    rounds++;
    if (await page.getByRole('button', { name: 'Zum Bosskampf' }).isVisible()) break;
    expect(rounds, 'Boss sollte nach wenigen Runden bereit sein').toBeLessThan(6);
    await page.getByRole('button', { name: 'Weiterspielen' }).click();
  }

  await page.getByRole('button', { name: 'Zum Bosskampf' }).click();
  await expect(page.getByText(/Bosskampf · Ich & du/)).toBeVisible();
  await expect(page.getByRole('img', { name: '3 von 3 Leben' })).toBeVisible();
  expect(await playRound(page)).toBe('won');
  await expect(page.getByRole('heading', { name: 'Etappe geschafft!' })).toBeVisible();

  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('button', { name: /Etappe 1: Ich & du – geschafft/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Etappe 2: .* – offen/ })).toBeEnabled();

  // Fortschritt übersteht einen Neustart.
  await page.reload();
  await expect(page.getByRole('button', { name: /Etappe 2: .* – offen/ })).toBeEnabled();
});
