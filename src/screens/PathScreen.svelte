<script lang="ts">
  import { onMount } from 'svelte';
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Card from '../lib/components/Card.svelte';
  import ProgressRing from '../lib/components/ProgressRing.svelte';
  import { game, today } from '../lib/game.svelte';
  import MarbleMountains from '../lib/illustrations/MarbleMountains.svelte';
  import { afterTransition } from '../lib/motion';
  import { currentStage, regionDone, stageLearned, stageStatus, stageWords } from '../lib/logic/path';
  import { currentStreak, levelInfo } from '../lib/logic/rewards';
  import Buffalo from '../lib/mascot/Buffalo.svelte';

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
  const tones = ['sea', 'lantern', 'lotus', 'yellow', 'paper'] as const;
  const regionOf = $derived(content.regions.find((r) => r.id === current.region)!);

  onMount(() =>
    afterTransition(() => {
      // Nur scrollen, wenn die aktuelle Etappe weiter unten liegt – sonst bleibt die Kopfzeile sichtbar.
      const el = document.querySelector('[data-current]');
      if (el && el.getBoundingClientRect().top > innerHeight * 0.6) el.scrollIntoView({ block: 'center', inline: 'nearest' });
    }),
  );
</script>

<main class="home">
  <header class="top">
    <div>
      <p class="kicker">{greeting}, Alex</p>
      <h1>Weiter geht's<br />in {regionOf.name}.</h1>
    </div>
    <ProgressRing value={xpToday / save.dailyGoal} size={84} stroke={9} label="Tagesziel {xpToday} von {save.dailyGoal} XP">
      <Buffalo size={58} />
    </ProgressRing>
  </header>

  <div class="stats">
    <div class="stat"><strong>{streak}</strong><span>{streak === 1 ? 'Tag Serie' : 'Tage Serie'}</span></div>
    <div class="stat"><strong>{xpToday}/{save.dailyGoal}</strong><span>XP heute</span></div>
    <div class="stat"><strong>Lv {level}</strong><span>Level</span></div>
  </div>

  {#each content.regions as region, r (region.id)}
    {@const stages = content.stages.filter((s) => s.region === region.id)}
    {@const done = stages.filter((s) => save.stages[s.id]?.done).length}
    {@const firstIndex = content.stages.findIndex((s) => s.region === region.id)}
    <section class="region" class:locked={stageStatus(save, stages[0]!.id) === 'locked'}>
      <Card tone={tones[r]}>
        <div class="region-card" class:with-scene={region.id === 'danang'}>
          {#if region.id === 'danang'}<div class="scene"><MarbleMountains /></div>{/if}
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
          <li class="node-row" style:--x="{offsets[i % offsets.length]}px" data-current={isCurrent ? '' : undefined}>
            <button
              class="node {isCurrent ? 'current' : status}"
              disabled={status === 'locked'}
              onclick={() => onopen(stage)}
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
            {#if isCurrent}
              <div class="current-card">
                <Card tone="lantern" vtName="stage-card" onclick={() => onopen(stage)}>
                  <p class="kicker dark">Etappe {n} · {stageWords(stage.id).length} Wörter · {Math.round(stageLearned(save, stage.id) * 100)} %</p>
                  <h2 style:view-transition-name="stage-title">{stage.title}</h2>
                  <p class="go">Los geht's →</p>
                </Card>
              </div>
            {/if}
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
    color: rgb(35 26 21 / 0.75);
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
    background: #fff;
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
  .region {
    display: grid;
    gap: 20px;
  }
  .region.locked {
    opacity: 0.6;
  }
  .region-card.with-scene {
    margin: -22px;
  }
  .scene {
    aspect-ratio: 400 / 260;
  }
  .with-scene .region-text {
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
    display: grid;
    justify-items: center;
    gap: 14px;
    transform: translateX(var(--x));
  }
  .current-card {
    width: min(320px, 100%);
    transform: translateX(calc(var(--x) * -1));
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
    background: #fff;
    color: var(--ink);
    box-shadow: 0 6px 0 var(--paper-2);
  }
  .node.current {
    background: var(--yellow);
    color: var(--ink);
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
    .node.current {
      animation: none;
    }
  }
</style>
