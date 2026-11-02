<script lang="ts">
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Card from '../lib/components/Card.svelte';
  import ProgressRing from '../lib/components/ProgressRing.svelte';
  import MarbleMountains from '../lib/illustrations/MarbleMountains.svelte';
  import Buffalo from '../lib/mascot/Buffalo.svelte';
  import { receive, send } from '../lib/motion';

  let { onopen, hidden }: { onopen: (stage: Stage) => void; hidden: boolean } = $props();

  // Prototyp-Stand: Etappe 1–2 geschafft, 3 ist dran.
  const region = content.regions[0]!;
  const stages = content.stages.filter((s) => s.region === region.id);
  const currentIndex = 2;
  const current = stages[currentIndex]!;
  const wordCount = (id: string) => content.words.filter((w) => w.stage === id).length;
  const offsets = [0, 70, 30, -50, -70, 10];
</script>

<main class="home">
  <header class="top">
    <div>
      <p class="kicker">Guten Morgen, Alex</p>
      <h1>Weiter geht's<br />in {region.name}.</h1>
    </div>
    <ProgressRing value={0.6} size={84} stroke={9} label="Tagesziel 30 von 50 XP">
      <Buffalo size={58} />
    </ProgressRing>
  </header>

  <div class="stats">
    <div class="stat"><strong>4</strong><span>Tage Serie</span></div>
    <div class="stat"><strong>30/50</strong><span>XP heute</span></div>
    <div class="stat"><strong>Lv 3</strong><span>Level</span></div>
  </div>

  <Card tone="sea">
    <div class="region">
      <div class="scene"><MarbleMountains /></div>
      <div class="region-text">
        <p class="kicker dark">Region 1 von 5</p>
        <h2>{region.name}</h2>
        <p>{region.subtitle} · {currentIndex}/{stages.length} Etappen</p>
      </div>
    </div>
  </Card>

  <ol class="path" aria-label="Lernpfad {region.name}">
    {#each stages as stage, i (stage.id)}
      {@const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'locked'}
      <li class="node-row" style:--x="{offsets[i % offsets.length]}px">
        <div class="node {state}" aria-label="{stage.title}: {state === 'done' ? 'geschafft' : state === 'current' ? 'aktuell' : 'gesperrt'}">
          {#if state === 'done'}
            <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M9.5 16.6 4.9 12l-1.4 1.4 6 6L21 7.9l-1.4-1.4z" fill="currentColor" /></svg>
          {:else if state === 'locked'}
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2h1.5v11h-13V10H7Zm2 0h6V8a3 3 0 0 0-6 0v2Z" fill="currentColor" /></svg>
          {:else}
            <span>{i + 1}</span>
          {/if}
        </div>
        {#if state === 'current' && !hidden}
          <div class="current-card" in:receive={{ key: 'stage' }} out:send={{ key: 'stage' }}>
            <Card tone="lantern" vtName="stage-card" onclick={() => onopen(current)}>
              <p class="kicker dark">Etappe {i + 1} · {wordCount(stage.id)} Wörter</p>
              <h2 style:view-transition-name="stage-title">{stage.title}</h2>
              <p class="go">Los geht's →</p>
            </Card>
          </div>
        {/if}
      </li>
    {/each}
  </ol>
</main>

<style>
  .home {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    gap: 20px;
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
    margin: 8px 0 0;
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
    border-radius: 50%;
    display: grid;
    place-items: center;
    font-weight: 800;
    font-size: 24px;
  }
  .node.done {
    background: var(--red);
    color: var(--on-red);
    box-shadow: 0 6px 0 var(--red-deep);
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
