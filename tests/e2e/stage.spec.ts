import { expect, test } from '@playwright/test';
import { playRound, solveTask, withoutViewTransitions } from './helpers';

test.beforeEach(({ page }) => withoutViewTransitions(page));

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

  // Erster Sieg ohne verlorenes Leben: eine Truhe mit garantiertem Accessoire; anlegen.
  await page.getByRole('button', { name: 'Truhe öffnen' }).click();
  await page.getByRole('button', { name: 'Öffnen', exact: true }).click();
  await expect(page.locator('[data-prize]')).toHaveAttribute('data-prize', 'accessory');
  await page.getByRole('button', { name: 'Gleich anlegen' }).click();
  await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  await expect(page.getByText('Truhe geöffnet')).toBeVisible();
  await expect(page.getByText('Erster Boss')).toBeVisible();

  await page.getByRole('button', { name: 'Fertig' }).click();
  await expect(page.getByRole('button', { name: /Etappe 1: Ich & du – geschafft/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Etappe 2: .* – offen/ })).toBeEnabled();

  // Fortschritt, Truhe und Accessoire überstehen einen Neustart.
  await page.reload();
  await expect(page.getByRole('button', { name: /Etappe 2: .* – offen/ })).toBeEnabled();
  await page.getByRole('button', { name: 'Profil' }).click();
  await expect(page.locator('.garment[aria-pressed="true"]')).toHaveCount(1);
  await expect(page.getByRole('button', { name: 'Truhe öffnen' })).toHaveCount(0);
});

test('Training: jeder Modus ist wählbar und lässt sich lösen', async ({ page }) => {
  // Spielstand mit gelernten Einheiten: Etappe 1 komplett (Runden bis Boss, Boss gewonnen).
  await page.goto('/viet-trainer/');
  await page.getByRole('button', { name: /Etappe 1: Ich & du/ }).click();
  await page.getByRole('button', { name: 'Etappe starten' }).click();
  while (true) {
    expect(await playRound(page)).toBe('done');
    if (await page.getByRole('button', { name: 'Zum Bosskampf' }).isVisible()) break;
    await page.getByRole('button', { name: 'Weiterspielen' }).click();
  }
  await page.getByRole('button', { name: 'Fertig' }).click();

  const modes: { focus: string; title: string; kind: string }[] = [
    { focus: 'pairs', title: 'Paare gegen die Uhr', kind: 'pairs' },
    { focus: 'build', title: 'Satzbau', kind: 'build' },
    { focus: 'dictation', title: 'Hör-Diktat', kind: 'build' },
    { focus: 'tone', title: 'Ton-Ninja', kind: 'tone' },
  ];
  for (const m of modes) {
    await page.getByRole('button', { name: 'Training', exact: true }).click();
    // Karussell: erst die Karte in die Mitte holen (Punkt darunter), dann antippen
    await page.getByRole('button', { name: `Zu ${m.title}` }).click();
    const card = page.locator(`[data-focus="${m.focus}"]`);
    await expect(card).toHaveClass(/current/);
    if (await card.isDisabled()) continue; // dafür ist in Etappe 1 noch zu wenig gelernt
    await card.click();
    const play = page.locator('main.play');
    for (let i = 0; i < 2; i++) {
      await expect(play).toHaveAttribute('data-task-kind', m.kind);
      await solveTask(page);
      await page.getByRole('button', { name: 'Weiter', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Training beenden' }).click();
    await expect(page.getByRole('heading', { name: /\d+ von \d+ richtig/ })).toBeVisible();
    await page.getByRole('button', { name: 'Fertig' }).click();
  }

  // Gemischt: eine Runde Aufgaben beliebiger Art.
  await page.getByRole('button', { name: 'Training', exact: true }).click();
  await page.getByRole('button', { name: /^(Training starten|Feld gießen)$/ }).click();
  for (let i = 0; i < 12; i++) {
    await solveTask(page);
    await page.getByRole('button', { name: 'Weiter', exact: true }).click();
  }
});
