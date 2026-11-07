<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { MotifGap } from '../../lib/logic/carousel';
  import { at, loop } from './motion-loop';

  /**
   * Lebendes Motiv einer Modus-Karte im Training – flache Flächen aus den Tokens, Maße in cqw (wächst mit der Karte).
   * - Paare: links Vietnamesisch, rechts Deutsch; Paar für Paar leuchtet gelb auf, schnappt zusammen und verblasst,
   *   unten läuft die Zeit ab.
   * - Lückensatz: in der Satzleiste klafft eine Lücke; die richtige Kachel springt hinein, die anderen treten zurück.
   * - Satzbau: die Kacheln eines gelernten Satzes liegen verstreut und springen der Reihe nach in die Satzleiste.
   * - Hör-Diktat: die Klangscheibe pulsiert wie beim Sprechen, die Kacheln erscheinen Wort für Wort.
   * - Ton-Ninja: Tonzeichen fliegen kreiselnd heran und landen auf dem a; das vorige fliegt davon, sobald das nächste kommt.
   * Steht es still (nicht in der Mitte, nicht sichtbar, reduzierte Bewegung), zeigt es eine erklärende Pose.
   * Ohne passenden gelernten Inhalt bleiben die Kacheln leer – das Motiv zeigt nie etwas Ungelerntes.
   */
  type Focus = 'pairs' | 'gap' | 'build' | 'dictation' | 'tone';
  let {
    focus,
    playing,
    idle = false,
    pairs = [],
    tiles = null,
    gap = null,
  }: {
    focus: Focus;
    playing: boolean;
    idle?: boolean;
    pairs?: { vn: string; de: string }[];
    tiles?: string[] | null;
    gap?: MotifGap | null;
  } = $props();

  const D = 6000;
  const SPRING = 'cubic-bezier(0.34, 1.56, 0.64, 1)';
  const OUT = 'cubic-bezier(0.22, 1, 0.36, 1)';
  const POSE: Record<Focus, number> = { pairs: 2750, gap: 3000, build: 4300, dictation: 4300, tone: 900 };
  /** gesperrte Karte (`idle`): ruhige Grundstellung statt Spielszene – bei Paaren alle Kacheln weiß */
  const pose = $derived(idle && (focus === 'pairs' || focus === 'gap') ? 0 : POSE[focus]);
  const run = (frames: Keyframe[]) => ({ frames, duration: D, pose, playing });

  // --- Paare ---------------------------------------------------------------------------------------------------
  const PAIR_ROWS = 3;
  const rows = $derived(Array.from({ length: PAIR_ROWS }, (_, i) => pairs[i] ?? { vn: '', de: '' }));
  /** Zeile der Übersetzung je Paar (rechts gemischt) */
  const RIGHT = [2, 0, 1];
  const pickAt = (p: number) => 600 + p * 1500;
  const matchAt = (p: number) => pickAt(p) + 740;
  function tileFrames(pick: number, match: number): Keyframe[] {
    return [
      { offset: 0, transform: 'scale(1)', opacity: 1 },
      { offset: at(pick, D), transform: 'scale(1)', opacity: 1 },
      { offset: at(pick + 90, D), transform: 'scale(1.07)', opacity: 1 },
      { offset: at(pick + 220, D), transform: 'scale(1)', opacity: 1 },
      { offset: at(match, D), transform: 'scale(1)', opacity: 1 },
      { offset: at(match + 120, D), transform: 'scale(1.1)', opacity: 1 },
      { offset: at(match + 380, D), transform: 'scale(0.94)', opacity: 0.3 },
      { offset: at(5300, D), transform: 'scale(0.94)', opacity: 0.3, easing: OUT },
      { offset: at(5700, D), transform: 'scale(1)', opacity: 1 },
      { offset: 1, transform: 'scale(1)', opacity: 1 },
    ];
  }
  const glowFrames = (pick: number, match: number): Keyframe[] => [
    { offset: 0, opacity: 0 },
    { offset: at(pick, D), opacity: 0 },
    { offset: at(pick + 120, D), opacity: 1 },
    { offset: at(match + 260, D), opacity: 1 },
    { offset: at(match + 380, D), opacity: 0 },
    { offset: 1, opacity: 0 },
  ];
  const TIMER: Keyframe[] = [
    { offset: 0, transform: 'scaleX(1)' },
    { offset: at(5300, D), transform: 'scaleX(0.1)', easing: OUT },
    { offset: at(5700, D), transform: 'scaleX(1)' },
    { offset: 1, transform: 'scaleX(1)' },
  ];

  // --- Lückensatz ---------------------------------------------------------------------------------------------
  /** Platzhalter-Breiten (cqw) ohne gelernten Satz: Kacheln unten, Satzstücke vor und nach der Lücke */
  const CHOICE_BLANK = [14, 18, 13];
  const choices = $derived(gap?.options ?? CHOICE_BLANK.map(() => ''));
  const hit = $derived(gap?.answer ?? 2);
  let slotEl: HTMLSpanElement | undefined = $state();
  let choiceEls: HTMLElement[] = $state([]);
  /** Weg der richtigen Kachel in die Lücke (px) und Breite der Lücke (= Breite der Kachel) */
  let hop = $state({ dx: 0, dy: 0 });
  let slotWidth = $state<string | undefined>(undefined);

  /** Lage eines Elements im Motiv (Layout, ohne laufende Transformationen) */
  function posIn(el: HTMLElement) {
    let x = el.offsetWidth / 2;
    let y = el.offsetHeight / 2;
    for (let n: HTMLElement | null = el; n && n !== box; n = n.offsetParent as HTMLElement | null) {
      x += n.offsetLeft;
      y += n.offsetTop;
    }
    return { x, y };
  }
  async function measureGap() {
    const tile = choiceEls[hit];
    if (focus !== 'gap' || !box || !slotEl || !tile) return;
    slotWidth = `${tile.offsetWidth}px`;
    await tick();
    const from = posIn(tile);
    const to = posIn(slotEl);
    hop = { dx: to.x - from.x, dy: to.y - from.y };
  }
  const PICK = 600;
  const LAND = 1300;
  const BACK = 4700;
  const hopFrames = $derived.by((): Keyframe[] => {
    const home = 'translate(0px, 0px) scale(1)';
    const there = `translate(${hop.dx}px, ${hop.dy}px) scale(1)`;
    return [
      { offset: 0, transform: home },
      { offset: at(PICK, D), transform: home },
      { offset: at(PICK + 160, D), transform: 'translate(0px, 0px) scale(1.12)', easing: SPRING },
      { offset: at(LAND, D), transform: there },
      { offset: at(BACK, D), transform: there, easing: OUT },
      { offset: at(BACK + 620, D), transform: home },
      { offset: 1, transform: home },
    ];
  });
  /** die übrigen Kacheln treten zurück, sobald die richtige sitzt */
  const DIM: Keyframe[] = [
    { offset: 0, opacity: 1 },
    { offset: at(LAND - 80, D), opacity: 1 },
    { offset: at(LAND + 220, D), opacity: 0.35 },
    { offset: at(BACK, D), opacity: 0.35 },
    { offset: at(BACK + 500, D), opacity: 1 },
    { offset: 1, opacity: 1 },
  ];
  const GAP_STRIP: Keyframe[] = [
    { offset: 0, transform: 'scale(1)' },
    { offset: at(LAND - 40, D), transform: 'scale(1)' },
    { offset: at(LAND + 120, D), transform: 'scale(1.04)' },
    { offset: at(LAND + 340, D), transform: 'scale(1)' },
    { offset: 1, transform: 'scale(1)' },
  ];

  // --- Satzbau und Diktat ----------------------------------------------------------------------------------------
  /** Platzhalter-Breiten (cqw), wenn noch kein Satz gelernt ist */
  const BLANK = [11, 17, 9, 14];
  const words = $derived(tiles ?? BLANK.map(() => ''));
  let box: HTMLDivElement;
  let tileEls: HTMLElement[] = $state([]);
  /** Verstreute Lage je Kachel relativ zu ihrem Platz in der Satzleiste (px) */
  let scatter = $state<{ dx: number; dy: number; r: number }[]>([]);
  const PERM = [2, 0, 3, 1, 4];
  const TILT = [-7, 5, -4, 8, -6];

  function measure() {
    if (focus !== 'build' || !box) return;
    const w = box.clientWidth / 100; // 1 cqw in px
    const n = words.length;
    const order = PERM.filter((p) => p < n);
    scatter = tileEls.slice(0, n).map((el, i) => {
      const slot = order[i]!;
      const sx = (8 + (slot + 0.5) * (84 / n)) * w;
      const sy = (33 + (slot % 2) * 8) * w;
      return { dx: sx - (el.offsetLeft + el.offsetWidth / 2), dy: sy - (el.offsetTop + el.offsetHeight / 2), r: TILT[i]! };
    });
  }
  onMount(() => {
    if (focus !== 'build' && focus !== 'gap') return;
    const again = () => (focus === 'gap' ? void measureGap() : measure());
    const ro = new ResizeObserver(again);
    ro.observe(box);
    void document.fonts?.ready.then(() => tick().then(again));
    return () => ro.disconnect();
  });
  const flyAt = (i: number) => 500 + i * 520;
  function buildFrames(i: number): Keyframe[] {
    const s = scatter[i];
    const away = s ? `translate(${s.dx}px, ${s.dy}px) rotate(${s.r}deg)` : 'none';
    return [
      { offset: 0, transform: away },
      { offset: at(flyAt(i), D), transform: away, easing: SPRING },
      { offset: at(flyAt(i) + 460, D), transform: 'translate(0px, 0px) rotate(0deg)' },
      { offset: at(4900, D), transform: 'translate(0px, 0px) rotate(0deg)', easing: OUT },
      { offset: at(5600, D), transform: away },
      { offset: 1, transform: away },
    ];
  }
  const doneAt = $derived(flyAt(words.length - 1) + 560);
  const stripFrames = $derived<Keyframe[]>([
    { offset: 0, transform: 'scale(1)' },
    { offset: at(doneAt, D), transform: 'scale(1)' },
    { offset: at(doneAt + 140, D), transform: 'scale(1.04)' },
    { offset: at(doneAt + 340, D), transform: 'scale(1)' },
    { offset: 1, transform: 'scale(1)' },
  ]);

  const hearAt = (i: number) => 700 + i * 520;
  const hearFrames = (i: number): Keyframe[] => [
    { offset: 0, opacity: 0, transform: 'scale(0.6)' },
    { offset: at(hearAt(i), D), opacity: 0, transform: 'scale(0.6)', easing: SPRING },
    { offset: at(hearAt(i) + 380, D), opacity: 1, transform: 'scale(1)' },
    { offset: at(4800, D), opacity: 1, transform: 'scale(1)', easing: 'ease-in' },
    { offset: at(5300, D), opacity: 0, transform: 'scale(0.9)' },
    { offset: 1, opacity: 0, transform: 'scale(0.6)' },
  ];
  /** Hof der Klangscheibe: pulsiert im Sprechrhythmus, solange Wörter erscheinen */
  const HALO: Keyframe[] = [
    { offset: 0, transform: 'scale(1)' },
    { offset: at(600, D), transform: 'scale(1)' },
    ...[0, 1, 2, 3, 4, 5].flatMap((k) => [
      { offset: at(800 + k * 420, D), transform: `scale(${k % 2 ? 1.12 : 1.18})` },
      { offset: at(1010 + k * 420, D), transform: 'scale(1.03)' },
    ]),
    { offset: at(3600, D), transform: 'scale(1)' },
    { offset: 1, transform: 'scale(1)' },
  ];

  // --- Ton-Ninja ------------------------------------------------------------------------------------------------
  const MARKS = ['sac', 'huyen', 'hoi', 'nga', 'nang'] as const;
  const landAt = (k: number) => 200 + k * 1160;
  const FLIGHT = 380;
  function markFrames(k: number): Keyframe[] {
    const thrown = 'translate(58cqw, -18cqw) rotate(0deg)';
    const sit = 'translate(0cqw, 0cqw) rotate(-720deg)';
    const knocked = 'translate(-52cqw, 26cqw) rotate(-940deg)';
    // das vorige Zeichen fliegt weg, sobald das neue losfliegt – nie liegen zwei übereinander (sähe wie ein X aus)
    const leave = k < MARKS.length - 1 ? landAt(k + 1) - 20 : 5500;
    return [
      { offset: 0, opacity: 0, transform: thrown },
      { offset: at(landAt(k), D), opacity: 0, transform: thrown },
      { offset: at(landAt(k), D), opacity: 1, transform: thrown, easing: OUT },
      { offset: at(landAt(k) + FLIGHT, D), opacity: 1, transform: sit },
      { offset: at(leave, D), opacity: 1, transform: sit, easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)' },
      { offset: at(leave + 300, D), opacity: 0, transform: knocked },
      { offset: 1, opacity: 0, transform: knocked },
    ];
  }
  const LETTER: Keyframe[] = [
    { offset: 0, transform: 'scale(1)' },
    ...MARKS.flatMap((_, k) => [
      { offset: at(landAt(k) + FLIGHT - 40, D), transform: 'scale(1)' },
      { offset: at(landAt(k) + FLIGHT + 60, D), transform: 'scale(1.06, 0.95)' },
      { offset: at(landAt(k) + FLIGHT + 260, D), transform: 'scale(1)' },
    ]),
    { offset: 1, transform: 'scale(1)' },
  ];
</script>

<div class="motif {focus}" bind:this={box} aria-hidden="true">
  {#if focus === 'pairs'}
    {#each rows as pair, p (p)}
      <span class="tile left" style:--row={p} use:loop={run(tileFrames(pickAt(p), matchAt(p)))}>
        <span class="face" lang="vi">{pair.vn}</span>
        <span class="face glow" use:loop={run(glowFrames(pickAt(p), matchAt(p)))}>{pair.vn}</span>
      </span>
      <span class="tile right" style:--row={RIGHT[p]} use:loop={run(tileFrames(pickAt(p) + 520, matchAt(p)))}>
        <span class="face" lang="de">{pair.de}</span>
        <span class="face glow" use:loop={run(glowFrames(pickAt(p) + 520, matchAt(p)))}>{pair.de}</span>
      </span>
    {/each}
    <span class="timer"><span class="fill" use:loop={run(TIMER)}></span></span>
  {:else if focus === 'gap'}
    <div class="strip gapline" use:loop={run(GAP_STRIP)}>
      {#if gap}
        <span class="say" lang="vi">{gap.before}<span class="slot" bind:this={slotEl} style:width={slotWidth}></span>{gap.after}</span>
      {:else}
        <span class="tile word blank" style:width="14cqw"></span><span class="slot" bind:this={slotEl} style:width={slotWidth}></span><span
          class="tile word blank"
          style:width="9cqw"
        ></span>
      {/if}
    </div>
    <div class="choices">
      {#each choices as o, i (i)}
        <span
          class="tile word"
          class:blank={!o}
          style:width={o ? undefined : `${CHOICE_BLANK[i]}cqw`}
          bind:this={choiceEls[i]}
          use:loop={run(i === hit ? hopFrames : DIM)}
          lang="vi">{o}</span
        >
      {/each}
    </div>
  {:else if focus === 'build'}
    <div class="strip" use:loop={run(stripFrames)}>
      {#each words as w, i (i)}
        <span
          class="tile word"
          class:blank={!w}
          style:width={w ? undefined : `${BLANK[i]}cqw`}
          bind:this={tileEls[i]}
          use:loop={run(buildFrames(i))}
          lang="vi">{w}</span
        >
      {/each}
    </div>
  {:else if focus === 'dictation'}
    <span class="disc">
      <span class="halo" use:loop={run(HALO)}></span>
      <span class="sun"></span>
      <span class="core"></span>
    </span>
    <div class="heard">
      {#each words as w, i (i)}
        <span class="tile word" class:blank={!w} style:width={w ? undefined : `${BLANK[i]}cqw`} use:loop={run(hearFrames(i))} lang="vi">{w}</span>
      {/each}
    </div>
  {:else}
    <span class="letter" use:loop={run(LETTER)}>a</span>
    {#each MARKS as m, k (m)}
      <svg class="mark {m}" viewBox="0 0 20 20" use:loop={run(markFrames(k))}>
        {#if m === 'sac'}<rect x="7.8" y="1.5" width="4.4" height="17" rx="2.2" transform="rotate(38 10 10)" />
        {:else if m === 'huyen'}<rect x="7.8" y="1.5" width="4.4" height="17" rx="2.2" transform="rotate(-38 10 10)" />
        {:else if m === 'hoi'}<path
            d="M5.2 7.4a4.8 4.8 0 1 1 7.6 3.9c-1.1.8-1.4 1.3-1.4 2.4v1.6H8.1v-1.9c0-2 .8-3.1 2.3-4.2a1.6 1.6 0 1 0-2.6-1.6z"
          />
        {:else if m === 'nga'}<path
            d="M1.6 12.2c1.8-4 4.4-5.4 7.3-3.4l1.7 1.2c1.3.9 2.4.6 3.4-1.1l.7-1.2 3.2 1.6-.8 1.3c-2 3.8-4.6 4.7-7.4 2.8L8 10.2c-1.3-.9-2.4-.6-3.4 1.2l-.6 1.1z"
          />
        {:else}<circle cx="10" cy="10" r="5" />{/if}
      </svg>
    {/each}
  {/if}
</div>

<style>
  .motif {
    position: relative;
    width: 100%;
    aspect-ratio: 2 / 1;
    container-type: inline-size;
    overflow: hidden;
  }
  .tile {
    position: absolute;
    display: grid;
    place-items: center;
    height: 11cqw;
    border-radius: 3cqw;
    background: var(--surface);
    color: var(--ink);
    font-size: 4.4cqw;
    font-weight: 700;
    white-space: nowrap;
    transform-origin: center;
  }
  .face {
    grid-area: 1 / 1;
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    border-radius: inherit;
    padding: 0 2cqw;
    overflow: hidden;
  }
  .face.glow {
    background: var(--yellow);
    color: var(--on-yellow);
  }

  /* Paare: zwei Spalten, darunter die ablaufende Zeit */
  .pairs .tile {
    top: calc(4cqw + var(--row) * 13.5cqw);
    width: 37cqw;
  }
  .pairs .left {
    left: 6cqw;
  }
  .pairs .right {
    right: 6cqw;
  }
  .timer {
    position: absolute;
    left: 6cqw;
    right: 6cqw;
    top: 44.5cqw;
    height: 2.2cqw;
    border-radius: 1.1cqw;
    background: var(--lantern-soft);
    overflow: hidden;
  }
  .timer .fill {
    display: block;
    height: 100%;
    background: var(--yellow);
    border-radius: inherit;
    transform-origin: left center;
  }

  /* Lückensatz: Satzleiste mit eingelassener Lücke oben, die Kacheln darunter; die richtige springt hinein.
     Größer als die Satzbau-Kacheln, damit das Motiv seine Fläche füllt (unten bleibt nur der Rand). */
  .strip.gapline {
    top: 5cqw;
    min-height: 21cqw;
    background: var(--lotus-soft);
    color: var(--ink);
    font-size: 5.6cqw;
    font-weight: 700;
    line-height: 15cqw;
  }
  .gap .tile {
    height: 13.5cqw;
    border-radius: 3.6cqw;
    font-size: 5.6cqw;
  }
  .gap .word:not(.blank) {
    padding: 0 3cqw;
  }
  .say {
    text-align: center;
    white-space: nowrap;
  }
  .slot {
    display: inline-block;
    vertical-align: middle;
    width: 17cqw;
    height: 13.5cqw;
    margin: 0 0.8cqw;
    border-radius: 3.6cqw;
    background: var(--lotus);
    box-shadow: inset 0 -0.9cqw 0 var(--ink-3);
  }
  .choices {
    position: absolute;
    left: 5cqw;
    right: 5cqw;
    top: 32cqw;
    display: flex;
    justify-content: center;
    gap: 3.4cqw;
  }

  /* Satzbau: Satzleiste oben, die Kacheln springen aus der Streuung unten hinein */
  .strip {
    position: absolute;
    left: 5cqw;
    right: 5cqw;
    top: 5cqw;
    min-height: 15cqw;
    padding: 2cqw;
    border-radius: 4.5cqw;
    background: var(--tone-yellow-soft);
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-content: center;
    gap: 1.4cqw;
  }
  .word {
    position: relative;
    padding: 0 2.2cqw;
    font-size: 4.2cqw;
  }
  .word.blank {
    padding: 0;
  }

  /* Hör-Diktat: Klangscheibe links, die gehörten Wörter rechts */
  .disc {
    position: absolute;
    left: 5cqw;
    top: 9cqw;
    width: 32cqw;
    height: 32cqw;
  }
  .disc span {
    position: absolute;
    border-radius: 50%;
  }
  .halo {
    inset: 0;
    background: var(--sun-halo);
  }
  .sun {
    inset: 6cqw;
    background: var(--yellow);
  }
  .core {
    inset: 12.4cqw;
    background: var(--red);
  }
  .heard {
    position: absolute;
    left: 42cqw;
    right: 5cqw;
    top: 4cqw;
    bottom: 4cqw;
    display: flex;
    flex-wrap: wrap;
    align-content: center;
    gap: 1.6cqw;
  }

  /* Ton-Ninja: das a, auf dem die Tonzeichen landen */
  .letter {
    position: absolute;
    left: 34cqw;
    top: 4cqw;
    width: 32cqw;
    height: 42cqw;
    display: grid;
    place-items: center;
    border-radius: 6cqw;
    background: var(--surface);
    color: var(--ink);
    font-size: 30cqw;
    font-weight: 800;
    line-height: 1;
    transform-origin: 50% 100%;
  }
  /* Lage gemessen am a (Oberkante ≈ 19,5 cqw, Grundlinie ≈ 36,6 cqw): Zeichen knapp darüber bzw. darunter */
  .mark {
    position: absolute;
    left: 45.5cqw;
    top: 8.5cqw;
    width: 10cqw;
    height: 10cqw;
    fill: var(--red);
  }
  .mark.nang {
    top: 35.5cqw;
    left: 46cqw;
    width: 8cqw;
    height: 8cqw;
  }
</style>
