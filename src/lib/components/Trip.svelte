<script lang="ts">
  import { tick } from 'svelte';
  import { content } from '../../content';
  import type { RegionId } from '../../content/types';
  import RegionHero, { HERO_LABEL } from '../illustrations/RegionHero.svelte';
  import Ride from '../illustrations/Ride.svelte';
  import { nextRegion, rideProgress, rideTimeAt, TRIP, tripLanding, tripStop, tripSwap } from '../logic/trip';
  import type { Mood } from '../mascot/Buffalo.svelte';
  import { reducedMotion } from '../motion';
  import { trip } from '../trip.svelte';
  import Button from './Button.svelte';

  /**
   * Reise zur nächsten Region als Vollbild-Blatt (einmal in App.svelte): oben die Fahrt (`Ride`), darunter
   * „Nächster Halt“, das bei der Ankunft zu „Willkommen in …“ wird, und die Seite des Reisepasses mit Route und
   * Souvenirs – der Zug fährt die Route mit, am Ende fliegt das Souvenir der geschafften Region auf sein Regal.
   * Unten erst „Überspringen“, nach der Landung „Weiter“ (nach dem Boss) bzw. „Fertig“ (aus dem Reisepass).
   */
  let { onfinish }: { onfinish: () => void } = $props();

  type Phase = 'ride' | 'arrive' | 'stop' | 'souvenir' | 'done';
  let phase = $state<Phase>('ride');
  const from = $derived(trip.from);
  const to = $derived(from ? nextRegion(from) : null);
  const name = (id: RegionId | null) => content.regions.find((r) => r.id === id)?.name ?? '';
  const order = content.regions.map((r) => r.id);
  const fromIdx = $derived(from ? order.indexOf(from) : 0);
  /** Strichel je Abschnitt der Route; die des laufenden Abschnitts werden rot, sobald der Zug sie passiert. */
  const DASHES = 5;
  const dashAt = Array.from({ length: DASHES }, (_, j) => Math.round(TRIP.start + TRIP.ride * rideTimeAt((j + 0.5) / DASHES)));
  const mood = $derived<Mood>(phase === 'done' ? 'cheer' : phase === 'stop' || phase === 'souvenir' ? 'happy' : 'idle');

  let root = $state<HTMLElement | null>(null);
  let stage = $state<HTMLElement | null>(null);
  let marker = $state<HTMLElement | null>(null);
  let fly = $state<{ x: number; y: number; dx: number; dy: number; s: number } | null>(null);

  // Ablauf: Zeitplan aus logic/trip.ts; bei reduzierter Bewegung gleich angekommen.
  // (liest `phase` nie – sonst begänne der Ablauf bei jedem Phasenwechsel neu)
  $effect(() => {
    if (!trip.from) return;
    const still = reducedMotion();
    phase = still ? 'done' : 'ride';
    fly = null;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    void tick().then(() => document.getElementById('trip-title')?.focus({ preventScroll: true }));
    if (still) return () => (html.style.overflow = prev);
    const timers = [
      setTimeout(() => (phase = 'arrive'), tripSwap()),
      setTimeout(() => (phase = 'stop'), tripStop()),
      setTimeout(launch, tripStop() + TRIP.souvenir),
      setTimeout(() => (phase = 'done'), tripLanding()),
    ];
    return () => {
      timers.forEach(clearTimeout);
      html.style.overflow = prev;
    };
  });

  // Der kleine Zug auf der Route fährt nach demselben Profil wie die Fahrt.
  $effect(() => {
    if (!marker || !trip.from) return;
    const at = (p: number) => `${((fromIdx + p) / 4) * 100}%`;
    if (reducedMotion()) {
      marker.style.left = at(1);
      return;
    }
    const N = 40;
    const frames = Array.from({ length: N + 1 }, (_, i) => ({ left: at(rideProgress(i / N)), offset: i / N }));
    const a = marker.animate(frames, { duration: TRIP.ride, delay: TRIP.start, fill: 'both' });
    return () => a.cancel();
  });

  /** Das Souvenir steigt über dem Zug auf und fliegt auf sein Regal in der Pass-Seite. */
  function launch() {
    const slot = root?.querySelector<HTMLElement>(`.shelf [data-region="${trip.from}"]`);
    if (!stage || !slot) return void (phase = 'souvenir');
    const a = stage.getBoundingClientRect();
    const b = slot.getBoundingClientRect();
    const x = a.left + a.width / 2;
    const y = a.top + a.height * 0.4;
    fly = { x, y, dx: b.left + b.width / 2 - x, dy: b.top + b.height / 2 - y, s: b.width / 120 };
    phase = 'souvenir';
  }

  function finish() {
    if (!trip.from) return;
    onfinish();
  }

  function onkeydown(e: KeyboardEvent) {
    if (!trip.from) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      finish();
    } else if (e.key === 'Tab') {
      // Nur der Knopf ist fokussierbar: der Fokus bleibt im Blatt.
      e.preventDefault();
      root?.querySelector<HTMLElement>('.actions button')?.focus();
    }
  }
</script>

<svelte:window {onkeydown} />

{#if from && to}
  <div class="trip" role="dialog" aria-modal="true" aria-labelledby="trip-title" data-phase={phase} bind:this={root}>
    <div class="stage" aria-hidden="true" bind:this={stage}>
      <Ride {to} arrived={phase !== 'ride'} {mood} />
    </div>

    <div class="body">
      <div class="head">
        <p class="kicker"><span class="place" lang="vi">{name(from)}</span> geschafft</p>
        <h2 id="trip-title" tabindex="-1">
          <span class="t depart" aria-hidden="true">Nächster Halt: <span class="place" lang="vi">{name(to)}</span></span>
          <span class="t arrive">Willkommen in <span class="place" lang="vi">{name(to)}</span></span>
        </h2>
        <p class="sub">
          <span class="t depart" aria-hidden="true">Mit dem Zug an der Küste entlang</span>
          <span class="t arrive">{content.regions[fromIdx + 1]?.subtitle}</span>
        </p>
      </div>

      <div class="mid">
      <section class="pass" aria-label="Reisepass: Souvenirs und Route">
        <div class="shelf">
          {#each content.regions as r, i (r.id)}
            <div class="obj" class:got={i < fromIdx} class:landed={i === fromIdx} data-region={r.id}><RegionHero region={r.id} /></div>
          {/each}
        </div>
        <div class="route" aria-hidden="true">
          <div class="legs">
            {#each { length: 4 } as _, leg (leg)}
              <span class="leg">
                {#each { length: DASHES } as _, j (j)}
                  <span class="dash" class:passed={leg < fromIdx} class:active={leg === fromIdx} style:--at="{dashAt[j]}ms"></span>
                {/each}
              </span>
            {/each}
            <span class="marker" bind:this={marker}></span>
          </div>
          {#each content.regions as r, i (r.id)}
            <span class="stop" class:passed={i <= fromIdx}></span>
          {/each}
        </div>
        <div class="names">
          {#each content.regions as r (r.id)}<span lang="vi">{r.name}</span>{/each}
        </div>
      </section>
      <p class="caption" aria-live="polite">
        {#if phase === 'done'}<span class="cap">Souvenir aus <span lang="vi">{name(from)}</span>: {HERO_LABEL[from]}</span>{/if}
      </p>
      </div>

      <div class="actions">
        <Button variant={phase === 'done' ? 'primary' : 'ghost'} onclick={finish}>
          {phase === 'done' ? (trip.replay ? 'Fertig' : 'Weiter') : 'Überspringen'}
        </Button>
      </div>
    </div>

    {#if fly && phase === 'souvenir'}
      <div class="fly" aria-hidden="true" style:--x="{fly.x}px" style:--y="{fly.y}px" style:--dx="{fly.dx}px" style:--dy="{fly.dy}px" style:--s={fly.s}>
        <div class="fx"><div class="fy"><div class="fs"><RegionHero region={from} /></div></div></div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .trip {
    position: fixed;
    inset: 0;
    z-index: 38;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    overscroll-behavior: contain;
    background: var(--paper);
  }
  .stage {
    flex: none;
    /* Die Szene ist der Star: sie nimmt, was der Text darunter übrig lässt (bis 380 px). */
    height: calc(var(--safe-top) + clamp(210px, 100dvh - 540px, 380px));
  }
  .body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 18px var(--gutter) calc(var(--safe-bottom) + 16px);
  }
  .kicker,
  .sub {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  /* Ortsnamen brechen nie auseinander („Hội“ / „An“). */
  .place {
    white-space: nowrap;
  }
  h2 {
    margin: 2px 0 4px;
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
    outline: none;
  }
  /* Abfahrt und Ankunft liegen in derselben Zelle (die längere bestimmt die Höhe – nichts springt). */
  h2,
  .sub {
    display: grid;
  }
  /* Erst geht „Nächster Halt“, dann kommt „Willkommen“ – nie beide zugleich. */
  .t {
    grid-area: 1 / 1;
    transition:
      opacity 220ms var(--ease-out),
      translate 220ms var(--ease-out);
  }
  .t.arrive {
    opacity: 0;
    translate: 0 8px;
  }
  .trip:not([data-phase='ride']) .t.depart {
    opacity: 0;
    translate: 0 -8px;
  }
  .trip:not([data-phase='ride']) .t.arrive {
    opacity: 1;
    translate: 0 0;
    transition-delay: 220ms;
  }

  /* Seite des Reisepasses: roter Rücken, Regal mit den Souvenirs, darunter die Route. */
  .pass {
    position: relative;
    padding: 12px 12px 10px 20px;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
  }
  .pass::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 8px;
    border-radius: 20px 0 0 20px;
    background: var(--red);
  }
  .shelf,
  .names,
  .route {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
  .shelf {
    align-items: end;
    justify-items: center;
  }
  .obj {
    width: min(54px, 100%);
    aspect-ratio: 1;
  }
  .obj:not(.got) {
    filter: brightness(0);
    opacity: 0.12;
  }
  :global(:root[data-theme='dark']) .obj:not(.got) {
    filter: brightness(0) invert(1);
    opacity: 0.14;
  }
  .trip[data-phase='done'] .obj.landed {
    filter: none;
    opacity: 1;
    animation: land 520ms var(--ease-spring) both;
  }
  .route {
    position: relative;
    align-items: center;
    justify-items: center;
    height: 22px;
    margin-top: 6px;
  }
  /* Die Strecke liegt über den Haltepunkten: der kleine Zug fährt auf ihnen ein. */
  .legs {
    position: absolute;
    inset: 50% 10% auto;
    z-index: 1;
    display: flex;
    translate: 0 -50%;
  }
  .leg {
    flex: 1;
    display: flex;
    justify-content: space-evenly;
    padding: 0 9px;
  }
  .dash {
    width: 6px;
    height: 4px;
    border-radius: 2px;
    background: var(--ink-3);
    opacity: 0.55;
  }
  .dash.passed {
    background: var(--red);
    opacity: 1;
  }
  .dash.active {
    animation: dash-on 1ms linear var(--at) both;
  }
  .stop {
    position: relative;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--ink-3);
  }
  .stop.passed {
    background: var(--red);
  }
  .marker {
    position: absolute;
    top: 50%;
    left: 0;
    width: 20px;
    height: 11px;
    margin: -5.5px 0 0 -10px;
    border-radius: 5px 7px 3px 3px;
    background: var(--red);
    box-shadow: inset 0 -3px var(--yellow);
    z-index: 1;
  }
  .names {
    margin-top: 4px;
  }
  .names span {
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    color: var(--ink-2);
  }
  /* Oben Szene und Titel, unten Pass-Seite und Knopf (hohe Bildschirme haben dazwischen Luft, niedrige keine). */
  .mid {
    display: grid;
    gap: 10px;
    margin-top: auto;
  }
  .caption {
    min-height: 1.4em;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    text-align: center;
  }
  .cap {
    display: inline-block;
    animation: fade-in 400ms var(--ease-out) both;
  }
  .actions {
    display: grid;
  }

  /* Souvenir: springt über dem Zug auf, fliegt im Bogen und schrumpft auf seinen Platz im Regal. */
  .fly {
    position: fixed;
    left: var(--x);
    top: var(--y);
    width: 120px;
    height: 120px;
    margin: -60px 0 0 -60px;
    pointer-events: none;
    z-index: 2;
  }
  .fx {
    animation: fly-x 1000ms cubic-bezier(0.45, 0, 0.4, 1) 350ms both;
  }
  .fy {
    animation: fly-y 1000ms 350ms both;
  }
  .fs {
    width: 120px;
    height: 120px;
    animation: fly-s 1350ms both;
  }
  @keyframes fly-x {
    to {
      translate: var(--dx) 0;
    }
  }
  @keyframes fly-y {
    0% {
      translate: 0 0;
      animation-timing-function: cubic-bezier(0.3, 0, 0.6, 1);
    }
    30% {
      translate: 0 -34px;
      animation-timing-function: cubic-bezier(0.5, 0, 0.8, 0.6);
    }
    100% {
      translate: 0 var(--dy);
    }
  }
  @keyframes fly-s {
    0% {
      scale: 0;
      animation-timing-function: cubic-bezier(0.3, 1.5, 0.6, 1);
    }
    22% {
      scale: 1;
      animation-timing-function: cubic-bezier(0.45, 0, 0.4, 1);
    }
    26% {
      scale: 1;
    }
    100% {
      scale: var(--s);
    }
  }
  @keyframes land {
    0% {
      scale: 1.25 0.8;
    }
    60% {
      scale: 0.94 1.06;
    }
    100% {
      scale: 1;
    }
  }
  @keyframes dash-on {
    from {
      background: var(--ink-3);
      opacity: 0.55;
    }
    to {
      background: var(--red);
      opacity: 1;
    }
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
</style>
