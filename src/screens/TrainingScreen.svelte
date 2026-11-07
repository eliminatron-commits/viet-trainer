<script lang="ts">
  import Button from '../lib/components/Button.svelte';
  import type { ItemId, SentenceId, WordId } from '../content/types';
  import { openLookup, type LookupView } from '../lib/lookup/lookup.svelte';
  import { arrivingByTab } from '../lib/motion';
  import { ripple } from '../lib/ripple';
  import { game, today } from '../lib/game.svelte';
  import { learnedKeys, type TrainingFocus } from '../lib/logic/session';
  import type { PlantInfo } from '../lib/logic/field';
  import { isDue } from '../lib/logic/srs';
  import ModeCarousel, { type CardTone } from './training/ModeCarousel.svelte';
  import RiceField from './training/RiceField.svelte';

  let {
    onstart,
    onsprint,
  }: {
    onstart: (verbsOnly: boolean, focus: TrainingFocus, card?: CardTone, water?: boolean) => void;
    onsprint: (card: CardTone) => void;
  } = $props();

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
  const lookOf = (item: ItemId): LookupView =>
    item.startsWith('s') ? { kind: 'sentence', id: item as SentenceId } : { kind: 'word', id: item as WordId };
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
        <!-- Info-Feld mit fester Mindesthöhe; die Lupe sitzt rechts daneben, damit nichts darunter springt. -->
        <div class="detail">
          <p role="status">
            {#if info}
              <strong lang="vi">{info.vn}</strong> · {info.de}<br /><span class="state">{info.state}</span>
            {:else if report}
              <strong>Seit deinem letzten Blick</strong><br />{report}
            {:else}
              Jede gelernte Einheit ist eine Pflanze: Rechtzeitig wiederholt, wächst sie bis zur Ernte. Tipp eine an.
            {/if}
          </p>
          {#if info?.item}
            {@const item = info.item}
            <button
              class="look"
              aria-label="{item.startsWith('s') ? 'Wort für Wort' : 'Zum Wort'}: {info.vn}"
              onclick={() => openLookup(lookOf(item))}
              use:ripple
            >
              <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
                ><path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="currentColor" /></svg
              >
            </button>
          {/if}
        </div>
      {/if}
      <label class="switch">
        <input type="checkbox" bind:checked={verbsOnly} />
        <span>Nur Verben</span>
      </label>
      <Button disabled={keys.length === 0} onclick={() => onstart(verbsOnly, 'mixed', undefined, due > 0)}>{due > 0 ? 'Feld gießen' : 'Training starten'}</Button>
      {#if all.length === 0}
        <p class="hint">Noch nichts gepflanzt – spiel zuerst eine Etappe im Lernpfad.</p>
      {/if}
    </div>
  </section>

  <ModeCarousel onstart={(focus, tone) => onstart(false, focus, tone)} {onsprint} />
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
    /* drei Zeilen: so hoch wie der Hinweis vor dem ersten Antippen – Pflanzen wechseln, ohne dass etwas springt */
    min-height: calc(3 * 1.45em + 20px);
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 10px;
    padding: 10px 10px 10px 14px;
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
  /* Zur Wortkarte bzw. Satzlupe der angetippten Pflanze: runde Lupe, gelb wie die Zweitknöpfe (hebt sich bei Tag und Nacht ab) */
  .look {
    position: relative;
    overflow: hidden;
    display: grid;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--yellow);
    color: var(--on-yellow);
    cursor: pointer;
    transition: transform 120ms ease;
  }
  .look:active {
    transform: scale(0.92);
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
