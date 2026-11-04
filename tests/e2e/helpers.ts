import { expect, type Page } from '@playwright/test';

/**
 * Das Playwright-WebKit unter Windows (WinCairo-Port, nicht iOS-Safari) stürzt reproduzierbar ab, wenn eine
 * View Transition auf eine Quiz-Aufgabe wechselt. Die E2E-Tests laufen daher ohne View Transitions
 * (die App wechselt dann ohne Übergang); die Übergänge werden in Edge und auf dem iPhone geprüft.
 */
export async function withoutViewTransitions(page: Page): Promise<void> {
  await page.addInitScript(() => {
    delete (Document.prototype as { startViewTransition?: unknown }).startViewTransition;
  });
}

/**
 * Löst die laufende Aufgabe richtig. Die Lösung steht als data-answer am Screen: Options-ID bei Auswahl, Rolle und
 * Ton-Ninja; Kachel-IDs der Zielfolge bei Satzbau und Diktat (danach „Prüfen“); Wort-IDs bei Paaren (Kacheln vn:/de:).
 * Gibt die Aufgabenart zurück.
 */
export async function solveTask(page: Page): Promise<string> {
  const play = page.locator('main.play');
  const kind = (await play.getAttribute('data-task-kind')) ?? '';
  if (kind === 'intro') return kind;
  const answer = (await play.getAttribute('data-answer')) ?? '';
  if (kind === 'pairs') {
    for (const id of answer.split(' ')) {
      await play.locator(`[data-id="vn:${id}"]`).click();
      await play.locator(`[data-id="de:${id}"]`).click();
    }
  } else if (kind === 'build') {
    for (const id of answer.split(' ')) await play.locator(`[data-id="${id}"]`).click();
    await page.getByRole('button', { name: 'Prüfen', exact: true }).click();
  } else {
    await play.locator(`[data-id="${answer}"]`).click();
  }
  await expect(page.getByRole('status').filter({ hasText: 'Richtig!' })).toBeVisible();
  return kind;
}

/** Spielt die laufende Runde mit lauter richtigen Antworten zu Ende. */
export async function playRound(page: Page): Promise<string> {
  const play = page.locator('main.play');
  for (let i = 0; i < 40; i++) {
    const outcome = await play.getAttribute('data-outcome');
    if (outcome) return outcome;
    const progress = await page.getByRole('progressbar').getAttribute('aria-valuenow');
    await solveTask(page);
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
