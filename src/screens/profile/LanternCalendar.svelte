<script lang="ts">
  import { onMount } from 'svelte';
  import { cubicOut } from 'svelte/easing';
  import { tick as haptic } from '../../lib/feedback';
  import { game, today } from '../../lib/game.svelte';
  import {
    calendarMonth,
    dayInfo,
    dayTitle,
    diaryStart,
    monthOf,
    monthRange,
    monthSummary,
    shiftMonth,
    WEEKDAYS_SHORT,
    type CalendarDay,
    type Lantern,
  } from '../../lib/logic/calendar';
  import { reducedMotion } from '../../lib/motion';
  import { theme } from '../../lib/theme.svelte';

  /**
   * Laternen-Kalender: je Woche eine Laternenkette wie in den Gassen von Hội An, je Tag eine Laterne mit seiner Zahl.
   * Aus (blass), gelernt (orange), Tagesziel (rot mit gelben Rippen), Streak-Schutz (meerblau); nachts leuchten die
   * Lerntage mit flachen Lichthöfen. Beim ersten Sichtbarwerden und nach jedem Blättern gehen die Laternen Tag für Tag
   * an; danach pendeln sie sacht. Blättern per Pfeil oder Wischen, angetippt schwingt die Laterne und das Feld darunter
   * zeigt die Zahlen des Tages (feste Höhe, damit nichts springt).
   */
  const save = $derived(game.save);
  const now = today();
  const range = $derived(monthRange(save, now));
  let month = $state(monthOf(now));
  let dir = $state<1 | -1>(1);
  let selected = $state<string | null>(now);
  const cal = $derived(calendarMonth(save, month, now));
  const start = $derived(diaryStart(save));
  const sel = $derived(cal.days.find((d) => d.date === selected) ?? null);
  const info = $derived(sel ? dayInfo(sel, start) : null);
  /** Leere Felder vor dem 1. und bis zum Ende der letzten Woche (die Kette läuft über die ganze Reihe). */
  const cells = $derived<(CalendarDay | null)[]>([
    ...Array<null>(cal.lead).fill(null),
    ...cal.days,
    ...Array<null>((7 - ((cal.lead + cal.days.length) % 7)) % 7).fill(null),
  ]);

  const LIT: Lantern[] = ['learned', 'goal', 'shield'];
  const NAME: Record<Lantern, string> = {
    off: 'nicht gelernt',
    learned: 'gelernt',
    goal: 'Tagesziel erreicht',
    shield: 'Streak-Schutz',
    before: 'vor dem Tagebuch',
    future: 'noch nicht da',
  };
  const LEGEND: [Lantern, string][] = [
    ['off', 'nicht gelernt'],
    ['learned', 'gelernt'],
    ['goal', 'Tagesziel'],
    ['shield', 'Streak-Schutz'],
  ];

  function go(n: 1 | -1) {
    const to = shiftMonth(month, n);
    if (to < range.first || to > range.last) return;
    dir = n;
    month = to;
    selected = to === monthOf(now) ? now : null;
    haptic();
  }

  /** Angetippt: Tag wählen, die Laterne schwingt aus. */
  function pick(d: CalendarDay, swing: Element | null) {
    if (swiped) return;
    selected = d.date;
    haptic();
    if (swing && !reducedMotion())
      swing.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(12deg)', offset: 0.18 },
          { transform: 'rotate(-8deg)', offset: 0.42 },
          { transform: 'rotate(4.5deg)', offset: 0.64 },
          { transform: 'rotate(-2deg)', offset: 0.84 },
          { transform: 'rotate(0deg)' },
        ],
        { duration: 1000, easing: 'ease-in-out' },
      );
  }

  // Wischen: waagerecht blättert, senkrecht scrollt die Seite weiter (touch-action: pan-y). Nach einem Wisch zählt
  // das Loslassen auf einer Laterne nicht als Antippen.
  let startX: number | null = null;
  let swiped = false;
  function down(e: PointerEvent) {
    startX = e.clientX;
    swiped = false;
  }
  function up(e: PointerEvent) {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 44) {
      swiped = true;
      go(dx < 0 ? 1 : -1);
    }
  }

  // Monat gleitet in Blätterrichtung; beide liegen in derselben Rasterzelle, die Höhe bleibt (immer sechs Reihen).
  function enter(_node: Element) {
    if (reducedMotion()) return { duration: 0 };
    return { duration: 340, easing: cubicOut, css: (t: number, u: number) => `transform: translateX(${u * dir * 56}px); opacity: ${t};` };
  }
  function leave(_node: Element) {
    if (reducedMotion()) return { duration: 0 };
    return { duration: 200, easing: cubicOut, css: (t: number, u: number) => `transform: translateX(${-u * dir * 56}px); opacity: ${t};` };
  }

  // Erst beim Sichtbarwerden gehen die Laternen an; außerhalb des Bildschirms ruhen die Schleifen.
  let root: HTMLElement;
  let phase = $state<'wait' | 'in'>('wait');
  let visible = $state(true);
  onMount(() => {
    if (typeof IntersectionObserver === 'undefined') {
      phase = 'in';
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e!.isIntersecting;
        if (visible) phase = 'in';
      },
      { threshold: 0.25 },
    );
    io.observe(root);
    return () => io.disconnect();
  });
</script>

{#snippet lantern(state: Lantern)}
  <svg class="lamp" viewBox="0 0 36 42" aria-hidden="true">
    <rect x="17.25" y="0" width="1.5" height="6" class="cordline" />
    <g class="unlit">
      <rect x="12" y="5" width="12" height="4" rx="1.5" class="cap" />
      <ellipse cx="18" cy="20.5" rx="15" ry="12" class="off-body" />
      <path d="M18 8.9C9.9 8.9 3.4 14.1 3.4 20.5S9.9 32.1 18 32.1Q8.8 30 8.8 20.5T18 8.9Z" class="shade" />
      <rect x="13" y="31.5" width="10" height="3.5" rx="1.5" class="cap" />
      <path d="M16.5 35h3l1.2 6h-5.4z" class="cap" />
    </g>
    {#if LIT.includes(state)}
      <g class="lit">
        <rect x="12" y="5" width="12" height="4" rx="1.5" class="gold" />
        <ellipse cx="18" cy="20.5" rx="15" ry="12" class="body" />
        <path d="M18 8.9C9.9 8.9 3.4 14.1 3.4 20.5S9.9 32.1 18 32.1Q8.8 30 8.8 20.5T18 8.9Z" class="shade" />
        <path d="M9.7 10.6Q1.9 20.5 9.7 30.4Q5 20.5 9.7 10.6Z" class="gold" />
        <path d="M26.3 10.6Q34.1 20.5 26.3 30.4Q31 20.5 26.3 10.6Z" class="gold" />
        <rect x="13" y="31.5" width="10" height="3.5" rx="1.5" class="gold" />
        <path d="M16.5 35h3l1.2 6h-5.4z" class="gold" />
      </g>
    {/if}
  </svg>
{/snippet}

<div class="calendar" class:paused={!visible} data-phase={phase} bind:this={root}>
  <div class="head">
    <button class="turn" onclick={() => go(-1)} disabled={month <= range.first} aria-label="Voriger Monat">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
    </button>
    <div class="title">
      <p class="month">{cal.title}</p>
      <p class="sum">{monthSummary(cal)}</p>
    </div>
    <button class="turn" onclick={() => go(1)} disabled={month >= range.last} aria-label="Nächster Monat">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8.6 19.4 16 12 8.6 4.6 10 3.2 18.8 12 10 20.8z" fill="currentColor" /></svg>
    </button>
  </div>

  <div class="week" aria-hidden="true">
    {#each WEEKDAYS_SHORT as w (w)}<span>{w}</span>{/each}
  </div>

  <div class="pages" role="group" aria-label={cal.title} onpointerdown={down} onpointerup={up} onpointercancel={() => (startX = null)}>
    {#key month}
      <ol class="grid" aria-label="Tage im {cal.title}" in:enter out:leave>
        {#each cells as d, i (d ? d.date : `leer${i}`)}
          <li class="cell" aria-hidden={d ? undefined : 'true'}>
            <svg class="cord" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"
              ><path d="M0 .6Q50 12.6 100 .6V2.2Q50 14.2 0 2.2Z" /></svg
            >
            {#if d}
              <button
                class="day {d.lantern}"
                class:today={d.today}
                class:on={d.date === selected}
                style:--i={d.day - 1}
                style:--t="{2.4 + (d.day % 4) * 0.3}s"
                style:--d="{-((d.day * 0.53) % 3)}s"
                disabled={d.lantern === 'future'}
                aria-pressed={d.date === selected}
                aria-label="{dayTitle(d.date)}: {NAME[d.lantern]}{d.today ? ', heute' : ''}"
                data-date={d.date}
                data-lantern={d.lantern}
                onclick={(e) => pick(d, e.currentTarget.querySelector('.swing'))}
              >
                {#if theme.dark && (d.lantern === 'goal' || d.lantern === 'learned')}
                  <span class="halo" aria-hidden="true"><span class="pulse"><span class="disc"></span><span class="disc"></span></span></span>
                {/if}
                <span class="hang"
                  ><span class="swing">{@render lantern(d.lantern)}<span class="num">{d.day}</span></span></span
                >
              </button>
            {/if}
          </li>
        {/each}
      </ol>
    {/key}
  </div>

  <div class="info" role="status">
    {#if info && sel}
      <p class="i-title">{info.title}{#if sel.today}<span class="chip">heute</span>{/if}</p>
      <p class="i-status">{info.status}</p>
      <dl class="nums">
        {#each info.numbers as n (n.label)}
          <div><dt>{n.label}</dt><dd>{n.value}</dd></div>
        {/each}
      </dl>
    {:else}
      <p class="i-hint">Tipp eine Laterne an, um zu sehen, was an dem Tag war.</p>
    {/if}
  </div>

  <ul class="legend" aria-label="Laternen">
    {#each LEGEND as [l, name] (l)}
      <li class={l}><span class="mini">{@render lantern(l)}</span>{name}</li>
    {/each}
  </ul>
</div>

<style>
  .calendar {
    isolation: isolate;
    display: grid;
    gap: 6px;
    padding: 14px 10px 12px;
    border-radius: var(--radius-card);
    background: var(--surface);
    box-shadow: var(--shadow-card);
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding-inline: 4px;
  }
  .title {
    text-align: center;
    min-width: 0;
  }
  .month {
    font-size: 20px;
    font-weight: 800;
  }
  .sum {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .turn {
    flex: none;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--yellow);
    color: var(--on-yellow);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .turn:disabled {
    background: var(--disabled-bg);
    color: var(--disabled-ink);
    cursor: default;
  }
  .week,
  .grid {
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
  }
  .week {
    margin-top: 6px;
  }
  .week span {
    text-align: center;
    color: var(--ink-2);
    font-size: 13px;
    font-weight: 700;
  }

  /* Monate liegen übereinander in einer Zelle; immer Platz für sechs Wochen. */
  .pages {
    display: grid;
    touch-action: pan-y;
  }
  .grid {
    grid-area: 1 / 1;
    grid-auto-rows: 58px;
    min-height: calc(6 * 58px);
    align-content: start;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .cell {
    position: relative;
  }
  /* Kette: ein Bogen je Tag, zusammen eine durchhängende Schnur über die Woche */
  .cord {
    position: absolute;
    z-index: 2;
    inset: 0 0 auto;
    width: 100%;
    height: 10px;
    fill: var(--ink-3);
  }

  .day {
    position: absolute;
    inset: 0;
    width: 100%;
    border: 0;
    padding: 0;
    background: none;
    font: inherit;
    cursor: pointer;
  }
  .day:disabled {
    cursor: default;
  }
  /* Farbe je Zustand (Tagesknopf und Legende); Zahl je Fläche AA bei Tag und Nacht */
  .calendar {
    --lamp: var(--lamp-off);
    --num: var(--ink-2);
  }
  .learned {
    --lamp: var(--lamp-learned);
    --num: var(--lamp-ink);
  }
  .goal {
    --lamp: var(--red);
    --num: var(--on-red);
  }
  .shield {
    --lamp: var(--lamp-shield);
    --num: var(--lamp-ink);
  }
  /* gewählter Tag: Fläche hinter der Laterne */
  .day.on::before {
    content: '';
    position: absolute;
    z-index: 0;
    inset: 9px 1px 0;
    border-radius: 14px;
    background: var(--tone-yellow-soft);
  }
  /* heute: roter Punkt unter der Quaste */
  .day.today::after {
    content: '';
    position: absolute;
    z-index: 3;
    left: calc(50% - 3px);
    bottom: 2px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--red);
  }

  .hang {
    position: absolute;
    z-index: 3;
    top: 6.5px;
    left: calc(50% - 18px);
    width: 36px;
    height: 42px;
    transform-origin: 50% 0;
  }
  .swing {
    position: absolute;
    inset: 0;
    transform-origin: 50% 0;
  }
  .lamp {
    display: block;
    width: 36px;
    height: 42px;
    overflow: visible;
  }
  .lamp .cordline,
  .lamp .cap {
    fill: var(--ink-3);
  }
  .lamp .off-body {
    fill: var(--lamp-off);
  }
  .lamp .body {
    fill: var(--lamp);
  }
  .lamp .shade {
    fill: var(--lamp-shade);
  }
  .lamp .gold {
    fill: var(--yellow);
  }
  .day.future .lamp {
    opacity: 0.45;
  }
  .num {
    position: absolute;
    left: 0;
    right: 0;
    top: 20.5px;
    transform: translateY(-50%);
    text-align: center;
    font-size: 12px;
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--num);
  }

  /* Lichthof (nur nachts): flache Scheiben, sacht pulsierend – wie Glow.svelte */
  .halo {
    position: absolute;
    z-index: 1;
    left: 50%;
    top: 27px;
    width: 0;
    height: 0;
  }
  .pulse {
    position: absolute;
  }
  .disc {
    position: absolute;
    border-radius: 50%;
    background: var(--lamp-glow);
  }
  .disc:first-child {
    width: 50px;
    height: 50px;
    left: -25px;
    top: -25px;
    opacity: 0.13;
  }
  .disc:last-child {
    width: 33px;
    height: 33px;
    left: -16.5px;
    top: -16.5px;
    opacity: 0.26;
  }
  /* Lerntag: ein kleinerer, leiserer Hof */
  .learned .disc:first-child {
    display: none;
  }
  .learned .disc:last-child {
    width: 42px;
    height: 42px;
    left: -21px;
    top: -21px;
    opacity: 0.2;
  }

  @media (prefers-reduced-motion: no-preference) {
    .hang {
      animation: lamp-sway var(--t) ease-in-out var(--d) infinite alternate;
    }
    .future .hang {
      animation: none;
    }
    .pulse {
      animation: lamp-glow 2.6s ease-in-out var(--d) infinite alternate;
    }
    .paused :global(*) {
      animation-play-state: paused !important;
    }
    /* Anzünden: vor dem Sichtbarwerden aus, dann Tag für Tag mit kurzem Flackern */
    [data-phase='wait'] .grid .lit,
    [data-phase='wait'] .grid .halo {
      opacity: 0;
    }
    [data-phase='wait'] .grid .num {
      color: var(--ink-2);
    }
    [data-phase='in'] .grid .lit {
      animation: lamp-lit 460ms ease-out calc(var(--i) * 24ms + 120ms) both;
    }
    [data-phase='in'] .grid .halo {
      animation: halo-in 600ms var(--ease-out) calc(var(--i) * 24ms + 220ms) both;
    }
    [data-phase='in'] .grid .learned .num,
    [data-phase='in'] .grid .goal .num,
    [data-phase='in'] .grid .shield .num {
      animation: num-lit 460ms ease-out calc(var(--i) * 24ms + 120ms) both;
    }
  }
  @keyframes lamp-sway {
    from {
      transform: rotate(-2deg);
    }
    to {
      transform: rotate(2deg);
    }
  }
  @keyframes lamp-glow {
    from {
      transform: scale(0.88);
      opacity: 0.7;
    }
    to {
      transform: scale(1.08);
      opacity: 1;
    }
  }
  @keyframes lamp-lit {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 0.85;
    }
    45% {
      opacity: 0.4;
    }
    65%,
    100% {
      opacity: 1;
    }
  }
  @keyframes halo-in {
    from {
      transform: scale(0.3);
      opacity: 0;
    }
  }
  @keyframes num-lit {
    0%,
    62% {
      color: var(--ink-2);
    }
    66% {
      color: var(--num);
    }
  }

  .info {
    display: grid;
    align-content: start;
    gap: 4px;
    margin-top: 4px;
    padding: 12px 14px;
    border-radius: 20px;
    background: var(--paper-2);
  }
  .i-title {
    font-weight: 800;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .chip {
    padding: 1px 8px;
    border-radius: var(--radius-pill);
    background: var(--yellow);
    color: var(--on-yellow);
    font-size: 13px;
    font-weight: 700;
  }
  .i-status,
  .i-hint {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 20px;
  }
  .i-status {
    min-height: 40px;
  }
  .i-hint {
    align-self: center;
  }
  .nums {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 6px;
    margin: 6px 0 0;
  }
  .nums div {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
  }
  .nums dd {
    margin: 0;
    font-size: 22px;
    font-weight: 800;
    line-height: 1.15;
    font-variant-numeric: tabular-nums;
  }
  .nums dt {
    color: var(--ink-2);
    font-size: 13px;
    font-weight: 600;
    line-height: 1.2;
  }

  .legend {
    display: grid;
    grid-template-columns: repeat(2, max-content);
    justify-content: center;
    gap: 6px 22px;
    list-style: none;
    margin: 4px 0 0;
    padding: 0;
    color: var(--ink-2);
    font-size: 13px;
    font-weight: 600;
  }
  .legend li {
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .mini {
    display: block;
    width: 17px;
    height: 20px;
  }
  .mini :global(.lamp) {
    width: 17px;
    height: 20px;
  }
  .legend :global(.cordline) {
    display: none;
  }
</style>
