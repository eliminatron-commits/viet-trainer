<script lang="ts">
  import Button from '../lib/components/Button.svelte';
  import { arrivingByTab } from '../lib/motion';
  import { game, today } from '../lib/game.svelte';
  import { learnedKeys, type TrainingFocus } from '../lib/logic/session';
  import type { PlantInfo } from '../lib/logic/field';
  import { isDue } from '../lib/logic/srs';
  import ModeCarousel, { type CardTone } from './training/ModeCarousel.svelte';
  import RiceField from './training/RiceField.svelte';

  let { onstart }: { onstart: (verbsOnly: boolean, focus: TrainingFocus, card?: CardTone) => void } = $props();

  let verbsOnly = $state(false);
  const day = today();
  /** Alles Gelernte = die Pflanzen im Feld; mit „Nur Verben“ treten die übrigen zurück. */
  const all = $derived(learnedKeys(game.save));
  const keys = $derived(learnedKeys(game.save, verbsOnly));
  const focusSet = $derived(verbsOnly ? new Set<string>(keys) : null);
  const due = $derived(keys.filter((k) => isDue(game.save.items[k]!, day)).length);
  const ripe = $derived(keys.filter((k) => game.save.items[k]!.box === 5).length);
  const noun = $derived(verbsOnly ? (keys.length === 1 ? 'Verb' : 'Verben') : keys.length === 1 ? 'Pflanze' : 'Pflanzen');
  const summary = $derived([due === 0 ? 'alle gegossen' : `${due} durstig`, ...(ripe ? [`${ripe} reif`] : [])].join(' · '));
  /** zuletzt angetippte Pflanze im Feld */
  let info = $state<PlantInfo | null>(null);
  /** was sich seit dem letzten Blick aufs Feld getan hat */
  let report = $state<string | null>(null);
</script>

<main class="training" class:arrive={arrivingByTab()}>
  <h1>Training</h1>
  <p class="lead">Endlos wiederholen, was du schon kannst – fällige Einheiten zuerst.</p>

  <section class="field-card" aria-labelledby="feld-titel">
    <RiceField keys={all} focus={focusSet} bind:info bind:report />
    <div class="body">
      <h2 id="feld-titel">Dein Reisfeld</h2>
      <div class="count">
        <p><strong>{keys.length}</strong> {noun}</p>
        {#if keys.length}<p class="sub">{summary}</p>{/if}
      </div>
      {#if all.length}
        <p class="detail" role="status">
          {#if info}
            <strong lang="vi">{info.vn}</strong> · {info.de}<br /><span class="state">{info.state}</span>
          {:else if report}
            <strong>Seit deinem letzten Blick</strong><br />{report}
          {:else}
            Jede gelernte Einheit ist eine Pflanze: Rechtzeitig wiederholt, wächst sie bis zur Ernte. Tipp eine an.
          {/if}
        </p>
      {/if}
      <label class="switch">
        <input type="checkbox" bind:checked={verbsOnly} />
        <span>Nur Verben</span>
      </label>
      <Button disabled={keys.length === 0} onclick={() => onstart(verbsOnly, 'mixed')}>{due > 0 ? 'Feld gießen' : 'Training starten'}</Button>
      {#if all.length === 0}
        <p class="hint">Noch nichts gepflanzt – spiel zuerst eine Etappe im Lernpfad.</p>
      {/if}
    </div>
  </section>

  <ModeCarousel onstart={(focus, tone) => onstart(false, focus, tone)} />
</main>

<style>
  .training {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    gap: 18px;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .lead {
    color: var(--ink-2);
  }
  /* Reisfeld: Szene oben bündig, darunter Zahlen, Schalter und Gießen */
  .field-card {
    border-radius: var(--radius-card);
    overflow: hidden;
    background: var(--surface);
    box-shadow: var(--shadow-card);
  }
  .field-card .body {
    display: grid;
    justify-items: start;
    gap: 8px;
    padding: 10px 22px 22px;
  }
  .field-card h2 {
    font-size: var(--fs-h2);
    font-weight: 800;
    line-height: 1.15;
  }
  .count {
    font-weight: 600;
  }
  .count .sub {
    color: var(--ink-2);
  }
  .count strong {
    font-size: var(--fs-hero);
    font-weight: 800;
    line-height: 1.1;
    margin-right: 4px;
  }
  /* Erklärung bzw. angetippte Pflanze */
  .detail {
    width: 100%;
    min-height: calc(2 * 1.45em + 20px);
    padding: 10px 14px;
    border-radius: 16px;
    background: var(--paper-2);
    font-size: var(--fs-small);
    line-height: 1.45;
    color: var(--ink);
  }
  .detail strong {
    font-weight: 800;
  }
  .detail .state {
    color: var(--ink-2);
    font-weight: 600;
  }
  .field-card .body :global(.btn) {
    margin-top: 6px;
  }

  .hint {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .switch {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--tap);
    font-weight: 600;
  }
  .switch input {
    width: 24px;
    height: 24px;
    accent-color: var(--red);
  }
</style>
