<script module lang="ts">
  /** Farbe einer Modus-Karte – die Übung geht beim Start in dieser Farbe auf. */
  export type CardTone = 'lantern' | 'yellow' | 'sea' | 'lotus';
  /** Zuletzt gewählte Karte – beim Zurückkommen aus der Übung steht das Karussell wieder dort. */
  let lastIndex = 0;
</script>

<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { game } from '../../lib/game.svelte';
  import { centeredIndex, motifGap, motifPairs, motifSentences } from '../../lib/logic/carousel';
  import { focusInfo, PAIR_COUNT, PAIRS_SECONDS, type TrainingFocus } from '../../lib/logic/session';
  import { reducedMotion } from '../../lib/motion';
  import { ripple } from '../../lib/ripple';
  import ModeMotif from './ModeMotif.svelte';

  /**
   * Modus-Karussell im Training: eine Karte je Übung zum Wischen (Einrasten in der Mitte, Nachbarn lugen hervor).
   * Nur die mittlere Karte lebt (Motiv läuft), die anderen treten etwas zurück. Antippen einer Nachbarkarte holt
   * sie in die Mitte, Antippen der mittleren startet die Übung – die Karte wächst dabei wie ein Fenster in die
   * Übung (`stage-card`, motion „morph-open“).
   */
  type Focus = Exclude<TrainingFocus, 'mixed'>;
  let { onstart }: { onstart: (focus: Focus, tone: CardTone) => void } = $props();

  interface Mode {
    focus: Focus;
    title: string;
    text: string;
    need: string;
    tone: CardTone;
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
      focus: 'gap',
      title: 'Lückensatz',
      text: 'Ein Wort fehlt im Satz: wähle es aus vier Kacheln.',
      need: 'Dafür brauchst du mindestens einen gelernten Satz.',
      tone: 'lotus',
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
  const pairs = $derived(motifPairs(game.save));
  const sentences = $derived(motifSentences(game.save));
  const gap = $derived(motifGap(game.save));

  let track: HTMLDivElement;
  const cards: HTMLButtonElement[] = [];
  let active = $state(lastIndex);
  let visible = $state(true);
  let opening = $state<Focus | null>(null);
  const still = reducedMotion();

  const middle = () => track.scrollLeft + track.clientWidth / 2;
  const centers = () => cards.map((c) => c.offsetLeft + c.offsetWidth / 2);

  function scrollToCard(i: number, smooth: boolean) {
    const c = cards[i];
    if (!c) return;
    track.scrollTo({ left: c.offsetLeft + c.offsetWidth / 2 - track.clientWidth / 2, behavior: smooth && !still ? 'smooth' : 'instant' });
  }

  let frame = 0;
  function onscroll() {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => (active = centeredIndex(centers(), middle())));
  }

  onMount(() => {
    void tick().then(() => scrollToCard(lastIndex, false));
    const io = new IntersectionObserver(([e]) => (visible = e!.isIntersecting), { threshold: 0.3 });
    io.observe(track);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  });

  function pick(i: number) {
    const m = modes[i]!;
    // erst in die Mitte holen; gilt die Karte schon als mittig (auch direkt nach dem Wischen), startet sie
    if (centeredIndex(centers(), middle()) !== i) {
      scrollToCard(i, true);
      return;
    }
    if (!available[m.focus]) return;
    lastIndex = i;
    opening = m.focus;
    onstart(m.focus, m.tone);
  }
</script>

<section class="carousel" aria-roledescription="Karussell" aria-label="Übungen">
  <h2 class="title">Übungen</h2>
  <div class="track" bind:this={track} {onscroll}>
    {#each modes as m, i (m.focus)}
      <button
        class="mode {m.tone}"
        class:current={i === active}
        class:off={!available[m.focus]}
        data-focus={m.focus}
        aria-disabled={!available[m.focus]}
        aria-roledescription="Karte"
        aria-label="{m.title} ({i + 1} von {modes.length})"
        aria-describedby="mode-text-{m.focus}"
        style:view-transition-name={opening === m.focus ? 'stage-card' : undefined}
        bind:this={cards[i]}
        onclick={() => pick(i)}
        use:ripple
      >
        <ModeMotif
          focus={m.focus}
          playing={!still && visible && i === active && available[m.focus]}
          idle={!available[m.focus]}
          {pairs}
          {gap}
          tiles={m.focus === 'build' ? sentences.build : m.focus === 'dictation' ? sentences.dictation : null}
        />
        <span class="body">
          <span class="name">{m.title}</span>
          <span class="text" id="mode-text-{m.focus}">{available[m.focus] ? m.text : m.need}</span>
        </span>
      </button>
    {/each}
  </div>
  <div class="dots">
    {#each modes as m, i (m.focus)}
      <button class="dot" class:on={i === active} aria-label="Zu {m.title}" aria-current={i === active} onclick={() => scrollToCard(i, true)}
        ><span></span></button
      >
    {/each}
  </div>
</section>

<style>
  .carousel {
    display: grid;
    gap: 10px;
    /* bis an den Bildschirmrand, damit die Nachbarkarten hervorlugen */
    margin-inline: calc(-1 * var(--gutter));
    container-type: inline-size;
  }
  .title {
    padding-inline: var(--gutter);
    font-size: var(--fs-h2);
    font-weight: 800;
  }
  .track {
    /* Breite in cqw (Breite des Karussells), denn % in grid-auto-columns bezöge sich auf den Inhalt ohne Rand */
    --card: min(360px, calc(100cqw - 2 * var(--gutter) - 44px));
    display: grid;
    grid-auto-flow: column;
    grid-auto-columns: var(--card);
    gap: 12px;
    padding: 8px calc((100cqw - var(--card)) / 2) 18px;
    overflow-x: auto;
    scroll-snap-type: x mandatory;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
  }
  .track::-webkit-scrollbar {
    display: none;
  }
  .mode {
    scroll-snap-align: center;
    scroll-snap-stop: always;
    display: grid;
    align-content: start;
    gap: 0;
    padding: 14px 14px 22px;
    border: 0;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    color: var(--ink);
    text-align: left;
    font: inherit;
    position: relative;
    overflow: hidden;
    cursor: pointer;
    transform: scale(0.92);
    transition: transform var(--dur) var(--ease-out);
  }
  .mode.current {
    transform: none;
  }
  .mode.current:active:not(.off) {
    transform: scale(0.97);
    transition-duration: var(--dur-fast);
  }
  .body {
    display: grid;
    gap: 6px;
    padding: 12px 8px 0;
  }
  .name {
    font-size: var(--fs-h2);
    font-weight: 800;
    line-height: 1.15;
    text-wrap: balance;
  }
  .text {
    line-height: 1.4;
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
  .mode.off {
    background: var(--disabled-bg);
    color: var(--disabled-ink);
    box-shadow: inset 0 0 0 2px var(--paper-2);
    cursor: default;
  }
  /* Der Grund der Sperre ist die einzige Auskunft – lesbar (AA), nicht ausgegraut */
  .mode.off .text {
    font-weight: 600;
    color: var(--ink-2);
  }
  .mode.off :global(.motif) {
    opacity: 0.45;
  }
  .dots {
    display: flex;
    justify-content: center;
  }
  .dot {
    display: grid;
    place-items: center;
    width: var(--tap);
    height: var(--tap);
    padding: 0;
    border: 0;
    background: none;
    cursor: pointer;
  }
  .dot span {
    width: 8px;
    height: 8px;
    border-radius: var(--radius-pill);
    background: var(--ink-3);
    transition:
      width var(--dur) var(--ease-out),
      background var(--dur) var(--ease-out);
  }
  .dot.on span {
    width: 22px;
    background: var(--red);
  }
</style>
