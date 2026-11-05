<script lang="ts" module>
  /** Zuletzt geöffnete Etappe samt Scrollstand: dorthin schrumpft die Etappe beim Zurückgehen (überlebt das Neu-Einhängen). */
  let returnTo: { id: string; scroll: number } | null = null;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Card from '../lib/components/Card.svelte';
  import ProgressRing from '../lib/components/ProgressRing.svelte';
  import { game, today } from '../lib/game.svelte';
  import RegionHero, { REGION_TONE } from '../lib/illustrations/RegionHero.svelte';
  import RegionScene from '../lib/illustrations/RegionScene.svelte';
  import StageVignette from '../lib/illustrations/StageVignette.svelte';
  import { currentStage, regionDone, stageLearned, stageStatus, stageWords } from '../lib/logic/path';
  import { currentStreak, levelInfo } from '../lib/logic/rewards';
  import Trau from '../lib/mascot/Trau.svelte';
  import { arrivingByTab } from '../lib/motion';

  let { onopen }: { onopen: (stage: Stage) => void } = $props();

  const day = today();
  const save = $derived(game.save);
  const current = $derived(currentStage(save));
  const xpToday = $derived(save.today.date === day ? save.today.xp : 0);
  const streak = $derived(currentStreak(save, day));
  const level = $derived(levelInfo(save.xp).level);
  const greeting = (() => {
    const h = new Date().getHours();
    return h < 11 ? 'Guten Morgen' : h < 18 ? 'Hallo' : 'Guten Abend';
  })();
  const offsets = [0, 70, 30, -50, -70, 10];
  const regionOf = $derived(content.regions.find((r) => r.id === current.region)!);

  const currentOpen = $derived(stageStatus(save, current.id) === 'open');
  const currentNo = $derived(content.stages.findIndex((s) => s.id === current.id) + 1);

  // Genau ein Element heißt `stage-card` (sonst bricht die View Transition ab): die Weiter-Karte,
  // oder – wenn eine andere Etappe geöffnet wird bzw. wurde – deren Knoten.
  let opening = $state(returnTo?.id ?? null);
  const fromCard = $derived(currentOpen && (opening === null || opening === current.id));
  function open(stage: Stage) {
    opening = stage.id;
    returnTo = { id: stage.id, scroll: scrollY };
    onopen(stage);
  }

  // Zurück aus der Etappe: Scrollstand wiederherstellen, bevor der neue Schnappschuss entsteht,
  // damit die Etappe in ihren Knoten zurückschrumpft. Beim Tab-Wechsel gleiten die Teile gestaffelt herein.
  const motionOnArrival = document.documentElement.dataset.vt ?? '';
  onMount(() => {
    if (motionOnArrival === 'morph-close' && returnTo) scrollTo(0, returnTo.scroll);
  });
</script>

<main class="home" class:arrive={arrivingByTab()}>
  <header class="top">
    <div>
      <p class="kicker">{greeting}, Alex</p>
      <h1>Weiter geht's<br />in {regionOf.name}.</h1>
    </div>
    <ProgressRing value={xpToday / save.dailyGoal} size={84} stroke={9} label="Tagesziel {xpToday} von {save.dailyGoal} XP">
      <Trau size={58} mood={xpToday >= save.dailyGoal ? 'happy' : 'idle'} />
    </ProgressRing>
  </header>

  <div class="stats">
    <div class="stat"><strong>{streak}</strong><span>{streak === 1 ? 'Tag Serie' : 'Tage Serie'}</span></div>
    <div class="stat"><strong>{xpToday}/{save.dailyGoal}</strong><span>XP heute</span></div>
    <div class="stat"><strong>Lv {level}</strong><span>Level</span></div>
  </div>

  <!-- Weiter-Karte oben: auf jedem iPhone ohne Scrollen sichtbar. Wie im Kajak-Vorbild liegt das Hero-Objekt
       der Region schräg darauf und fliegt beim Öffnen aufrecht in die Etappen-Ansicht. -->
  {#if currentOpen}
    <div class="weiter">
      <Card tone={REGION_TONE[current.region]} vtName={fromCard ? 'stage-card' : undefined} onclick={() => open(current)}>
        <div class="weiter-text">
          <p class="kicker dark">
            <span>Etappe {currentNo}</span> · <span>{stageWords(current.id).length} Wörter</span> ·
            <span>{Math.round(stageLearned(save, current.id) * 100)} %</span>
          </p>
          <h2 style:view-transition-name={fromCard ? 'stage-title' : undefined}>{current.title}</h2>
          <p class="go">Los geht's →</p>
        </div>
      </Card>
      <div class="hero" style:view-transition-name={fromCard ? 'stage-hero' : undefined} aria-hidden="true">
        <div class="bob"><RegionHero region={current.region} size={112} /></div>
      </div>
    </div>
  {/if}

  {#each content.regions as region, r (region.id)}
    {@const stages = content.stages.filter((s) => s.region === region.id)}
    {@const done = stages.filter((s) => save.stages[s.id]?.done).length}
    {@const firstIndex = content.stages.findIndex((s) => s.region === region.id)}
    <section class="region" class:locked={stageStatus(save, stages[0]!.id) === 'locked'}>
      <Card tone={REGION_TONE[region.id]}>
        <div class="region-card">
          <div class="scene"><RegionScene region={region.id} /></div>
          <div class="region-text">
            <p class="kicker dark">Region {r + 1} von {content.regions.length}{regionDone(save, region.id) ? ' · geschafft' : ''}</p>
            <h2>{region.name}</h2>
            <p>{region.subtitle} · {done}/{stages.length} Etappen</p>
          </div>
        </div>
      </Card>

      <ol class="path" aria-label="Lernpfad {region.name}">
        {#each stages as stage, i (stage.id)}
          {@const status = stageStatus(save, stage.id)}
          {@const isCurrent = stage.id === current.id && status === 'open'}
          {@const n = firstIndex + i + 1}
          {@const x = offsets[i % offsets.length]!}
          <li class="node-row" style:--x="{x}px" data-current={isCurrent ? '' : undefined}>
            <button
              class="node {isCurrent ? 'current' : status}"
              style:view-transition-name={!fromCard && opening === stage.id ? 'stage-card' : undefined}
              disabled={status === 'locked'}
              onclick={() => open(stage)}
              aria-label="Etappe {n}: {stage.title} – {status === 'done' ? 'geschafft' : status === 'open' ? 'offen' : 'gesperrt'}"
            >
              {#if status === 'done'}
                <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M9.5 16.6 4.9 12l-1.4 1.4 6 6L21 7.9l-1.4-1.4z" fill="currentColor" /></svg>
              {:else if status === 'locked'}
                <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
                  ><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5v11h-13V10H7Zm2 0h6V8a3 3 0 0 0-6 0v2Z" fill="currentColor" /></svg
                >
              {:else}
                <span>{n}</span>
              {/if}
            </button>
            <!-- Vignette der Etappe auf der freien Seite des Knotens; gesperrte noch blass. -->
            <div class="vig {x >= 0 ? 'left' : 'right'} {isCurrent ? 'current' : status}" aria-hidden="true">
              <div class="vig-img"><StageVignette stage={stage.id} tone={REGION_TONE[region.id]} /></div>
              <span>{stage.title}</span>
            </div>
          </li>
        {/each}
      </ol>
    </section>
  {/each}
</main>

<style>
  .home {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    gap: 20px;
    /* Die versetzten Knoten dürfen nie seitlich scrollen lassen. */
    overflow-x: clip;
  }
  .top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }
  .kicker {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    letter-spacing: 0.02em;
  }
  .kicker.dark {
    color: var(--ink-muted);
  }
  /* Kennzahlen umbrechen nur als Ganzes (sonst steht „%“ allein in der Zeile). */
  .kicker span {
    white-space: nowrap;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  h2 {
    font-size: var(--fs-h2);
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
  }
  .stat {
    background: var(--surface);
    border-radius: 20px;
    padding: 12px;
    display: grid;
    box-shadow: var(--shadow-card);
  }
  .stat strong {
    font-size: 20px;
    font-weight: 800;
  }
  .stat span {
    font-size: 13px;
    color: var(--ink-2);
  }
  .weiter {
    position: relative;
    margin-top: 6px;
  }
  .weiter-text {
    padding-right: 100px;
  }
  /* Das Hero-Objekt bricht oben rechts aus der Karte aus, schräg wie das Kajak im Vorbild. */
  .hero {
    position: absolute;
    top: -24px;
    right: 0;
    width: 112px;
    height: 112px;
    transform: rotate(-22deg);
    pointer-events: none;
  }
  .bob {
    animation: hero-bob 3.2s ease-in-out infinite alternate;
  }
  @keyframes hero-bob {
    from {
      transform: translateY(2px) rotate(-3deg);
    }
    to {
      transform: translateY(-6px) rotate(3deg);
    }
  }
  .region {
    display: grid;
    gap: 20px;
  }
  /* Gesperrte Region: Fläche, Szene und Knoten verblassen, die Schrift nicht (AA bei Tag und Nacht).
     Die Papier-Lasur auf .region-card entspricht der Kartenfläche bei 60 % Deckkraft. */
  .region.locked .region-card {
    background: color-mix(in srgb, var(--paper) 40%, transparent);
  }
  .region.locked .scene,
  .region.locked .node {
    opacity: 0.6;
  }
  .region-card {
    margin: -22px;
  }
  .scene {
    aspect-ratio: 400 / 260;
  }
  .region-text {
    padding: 16px 22px 22px;
  }
  .path {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 18px;
  }
  .node-row {
    position: relative;
    display: grid;
    justify-items: center;
    gap: 14px;
    transform: translateX(var(--x));
  }
  /* Vignette mit Titel neben dem Knoten (Knoten 68 px, Abstand 10 px); höchstens so hoch wie ein Pfad-Schritt. */
  .vig {
    position: absolute;
    top: 50%;
    width: 112px;
    display: grid;
    justify-items: center;
    gap: 2px;
    transform: translateY(-50%);
    pointer-events: none;
    text-align: center;
  }
  .vig.left {
    right: calc(50% + 44px);
  }
  .vig.right {
    left: calc(50% + 44px);
  }
  .vig span {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--ink-2);
  }
  .vig.locked .vig-img {
    filter: grayscale(1);
    opacity: 0.45;
  }
  /* Gesperrt: die Vignette verblasst, der Titel bleibt lesbar (AA bei Tag und Nacht). */
  .vig.locked span {
    color: var(--ink-muted);
    font-weight: 400;
  }
  .vig.current .vig-img {
    animation: hero-bob 3.2s ease-in-out infinite alternate;
  }
  .node {
    width: 68px;
    height: 68px;
    border: 0;
    border-radius: 50%;
    display: grid;
    place-items: center;
    font: inherit;
    font-weight: 800;
    font-size: 24px;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .node:active:not(:disabled) {
    transform: scale(0.94);
  }
  .node.done {
    background: var(--red);
    color: var(--on-red);
    box-shadow: 0 6px 0 var(--red-deep);
  }
  .node.open {
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 6px 0 var(--paper-2);
  }
  .node.current {
    background: var(--yellow);
    color: var(--on-yellow);
    box-shadow:
      0 6px 0 #d9a900,
      0 0 0 8px rgb(255 205 0 / 0.3);
    animation: pulse 2.4s var(--ease-out) infinite;
  }
  .node.locked {
    background: var(--paper-2);
    color: var(--ink-3);
    cursor: default;
  }
  .go {
    margin-top: 10px;
    font-weight: 800;
  }
  @keyframes pulse {
    50% {
      box-shadow:
        0 6px 0 #d9a900,
        0 0 0 14px rgb(255 205 0 / 0.12);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .node.current,
    .bob,
    .vig.current .vig-img {
      animation: none;
    }
  }
</style>
