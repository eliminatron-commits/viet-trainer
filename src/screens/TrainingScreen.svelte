<script lang="ts">
  import Button from '../lib/components/Button.svelte';
  import { arrivingByTab } from '../lib/motion';
  import Card from '../lib/components/Card.svelte';
  import { game, today } from '../lib/game.svelte';
  import { focusInfo, learnedKeys, PAIR_COUNT, PAIRS_SECONDS, type TrainingFocus } from '../lib/logic/session';
  import { isDue } from '../lib/logic/srs';
  import { ripple } from '../lib/ripple';

  let { onstart }: { onstart: (verbsOnly: boolean, focus: TrainingFocus) => void } = $props();

  let verbsOnly = $state(false);
  const day = today();
  const keys = $derived(learnedKeys(game.save, verbsOnly));
  const due = $derived(keys.filter((k) => isDue(game.save.items[k]!, day)).length);

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

  <Card tone="sea">
    <p class="kicker">{verbsOnly ? 'Nur Verben' : 'Alles Gelernte'}</p>
    <p class="big">{keys.length}</p>
    <p>{keys.length === 1 ? 'Einheit' : 'Einheiten'} · davon {due} fällig</p>
  </Card>

  <section class="mode lotus" aria-label="Gemischt">
    <svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true">
      <rect x="4" y="4" width="14" height="14" rx="4" fill="var(--surface)" />
      <rect x="22" y="4" width="14" height="14" rx="7" fill="var(--yellow)" />
      <rect x="4" y="22" width="14" height="14" rx="7" fill="var(--red)" />
      <rect x="22" y="22" width="14" height="14" rx="4" fill="var(--surface)" />
    </svg>
    <h2>Gemischt</h2>
    <p>Alles Gelernte bunt gemischt: Auswahl, Hören, Satzbau, Ton-Ninja und Paare.</p>
    <label class="switch">
      <input type="checkbox" bind:checked={verbsOnly} />
      <span>Nur Verben</span>
    </label>
    <Button disabled={keys.length === 0} onclick={() => onstart(verbsOnly, 'mixed')}>Training starten</Button>
    {#if keys.length === 0}
      <p class="hint">Noch nichts gelernt – spiel zuerst eine Etappe im Lernpfad.</p>
    {/if}
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
  .kicker {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .big {
    font-size: var(--fs-hero);
    font-weight: 800;
    line-height: 1.1;
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
