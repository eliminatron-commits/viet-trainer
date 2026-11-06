<script lang="ts">
  import Button from '../lib/components/Button.svelte';
  import { arrivingByTab } from '../lib/motion';
  import { game, today } from '../lib/game.svelte';
  import { focusInfo, learnedKeys, PAIR_COUNT, PAIRS_SECONDS, type TrainingFocus } from '../lib/logic/session';
  import type { PlantInfo } from '../lib/logic/field';
  import { isDue } from '../lib/logic/srs';
  import { ripple } from '../lib/ripple';
  import RiceField from './training/RiceField.svelte';

  let { onstart }: { onstart: (verbsOnly: boolean, focus: TrainingFocus) => void } = $props();

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

  type Focus = Exclude<TrainingFocus, 'mixed'>;
  interface Mode {
    focus: Focus;
    title: string;
    text: string;
    need: string;
    tone: 'lantern' | 'yellow' | 'sea' | 'lotus';
  }
  const modes: Mode[] = [
    {
      focus: 'pairs',
      title: 'Paare gegen die Uhr',
      text: `${PAIR_COUNT} Wörter, ${PAIRS_SECONDS} Sekunden: finde die Paare, bevor die Zeit abläuft.`,
      need: `Dafür brauchst du mindestens ${PAIR_COUNT} gelernte Wörter.`,
      tone: 'lantern',
    },
    {
      focus: 'build',
      title: 'Satzbau',
      text: 'Lege den vietnamesischen Satz aus Wortkacheln.',
      need: 'Dafür brauchst du mindestens einen gelernten Satz.',
      tone: 'yellow',
    },
    {
      focus: 'dictation',
      title: 'Hör-Diktat',
      text: 'Hör den Satz und lege ihn aus Wortkacheln.',
      need: 'Dafür brauchst du mindestens einen gelernten Satz.',
      tone: 'sea',
    },
    {
      focus: 'tone',
      title: 'Ton-Ninja',
      text: 'Welche Schreibweise hast du gehört? Die Möglichkeiten unterscheiden sich nur im Ton.',
      need: 'Dafür brauchst du gelernte Wörter.',
      tone: 'lotus',
    },
  ];
  const available = $derived(Object.fromEntries(modes.map((m) => [m.focus, focusInfo(game.save, m.focus).available])) as Record<Focus, boolean>);
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

  {#each modes as m (m.focus)}
    <button class="mode {m.tone} pick" data-focus={m.focus} disabled={!available[m.focus]} onclick={() => onstart(false, m.focus)} use:ripple>
      <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
        {#if m.focus === 'pairs'}
          <rect x="3" y="9" width="17" height="22" rx="5" fill="var(--surface)" />
          <rect x="20" y="9" width="17" height="22" rx="5" fill="var(--yellow)" />
        {:else if m.focus === 'build'}
          <rect x="2" y="6" width="14" height="12" rx="4" fill="var(--surface)" />
          <rect x="18" y="6" width="20" height="12" rx="4" fill="var(--red)" />
          <rect x="2" y="22" width="22" height="12" rx="4" fill="var(--yellow)" />
          <rect x="26" y="22" width="12" height="12" rx="4" fill="var(--surface)" />
        {:else if m.focus === 'dictation'}
          <circle cx="20" cy="20" r="18" fill="var(--sun-halo)" />
          <circle cx="20" cy="20" r="12" fill="var(--yellow)" />
          <circle cx="20" cy="20" r="4.5" fill="var(--red)" />
        {:else}
          <rect x="4" y="12" width="32" height="24" rx="8" fill="var(--surface)" />
          <path d="M14 8 24 2l-2.5 9z" fill="var(--red)" />
          <circle cx="20" cy="24" r="5" fill="var(--yellow)" />
        {/if}
      </svg>
      <h2>{m.title}</h2>
      <p>{m.text}</p>
      {#if !available[m.focus]}<p class="hint">{m.need}</p>{/if}
    </button>
  {/each}
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

  /* Modus-Karten: flache Flächen aus den Tokens */
  .mode {
    display: grid;
    justify-items: start;
    gap: 6px;
    width: 100%;
    padding: 22px;
    border: 0;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    color: var(--ink);
    text-align: left;
    font: inherit;
    position: relative;
    overflow: hidden;
  }
  .mode h2 {
    font-size: var(--fs-h2);
    font-weight: 800;
    line-height: 1.15;
  }
  .lotus {
    background: var(--lotus);
  }
  .lantern {
    background: var(--lantern);
  }
  .sea {
    background: var(--sea);
  }
  .yellow {
    background: var(--tone-yellow);
  }
  .pick {
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .pick:active:not(:disabled) {
    transform: scale(0.97);
  }
  .pick:disabled {
    background: var(--disabled-bg);
    color: var(--disabled-ink);
    box-shadow: inset 0 0 0 2px var(--paper-2);
    cursor: default;
  }
  .pick:disabled svg {
    opacity: 0.45;
  }
  .mode :global(.btn) {
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
