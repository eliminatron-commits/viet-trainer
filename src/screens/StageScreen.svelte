<script lang="ts">
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Button from '../lib/components/Button.svelte';
  import { game } from '../lib/game.svelte';
  import { bossReady, isDone, stageLearned, stageWords } from '../lib/logic/path';
  import RegionHero, { REGION_TONE } from '../lib/illustrations/RegionHero.svelte';
  import RegionScene from '../lib/illustrations/RegionScene.svelte';

  let { stage, onback, onlearn, onboss }: { stage: Stage; onback: () => void; onlearn: () => void; onboss: () => void } =
    $props();

  const words = $derived(stageWords(stage.id));
  const index = $derived(content.stages.findIndex((s) => s.id === stage.id) + 1);
  const learned = $derived(stageLearned(game.save, stage.id));
  const started = $derived(words.some((w) => game.save.items[w.id]));
  const done = $derived(isDone(game.save, stage.id));
  const ready = $derived(bossReady(game.save, stage.id));
  const kindLabel = $derived(
    stage.kind === 'pronouns' ? 'Anreden' : stage.kind === 'particles' ? 'Partikel' : 'Wörter',
  );
</script>

<section
  class="detail"
  data-tone={REGION_TONE[stage.region]}
  style:view-transition-name="stage-card"
>
  <!-- Der Ort baut sich im wachsenden Fenster auf; das Hero-Objekt landet aufrecht an seiner Unterkante. -->
  <div class="band"><RegionScene region={stage.region} /></div>
  <div class="hero" style:view-transition-name="stage-hero" aria-hidden="true">
    <div class="bob"><RegionHero region={stage.region} /></div>
  </div>
  <button class="back" onclick={onback} aria-label="Zurück">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
  </button>

  <p class="kicker head">Etappe {index} · {words.length} {kindLabel}{done ? ' · geschafft' : ''}</p>
  <h1 class="head" style:view-transition-name="stage-title">{stage.title}</h1>

  <div class="meter" role="progressbar" aria-label="Gelernt" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(learned * 100)}>
    <div class="fill" style:width="{learned * 100}%"></div>
  </div>
  <p class="hint">{Math.round(learned * 100)} % gelernt</p>

  <ul class="chips">
    {#each words as w, i (w.id)}
      <li style:--i={i} class:known={(game.save.items[w.id]?.right ?? 0) > 0} lang="vi">{game.save.items[w.id] ? w.vn : '···'}</li>
    {/each}
  </ul>

  <div class="actions">
    <Button variant={ready && !done ? 'secondary' : 'primary'} onclick={onlearn}>
      {done ? 'Nochmal üben' : started ? 'Weiterlernen' : 'Etappe starten'}
    </Button>
    <Button variant={ready && !done ? 'primary' : 'secondary'} disabled={!ready} onclick={onboss}>
      {done ? 'Boss erneut' : 'Bosskampf'}
    </Button>
    <p class="hint">
      {#if ready || done}ca. 12 Aufgaben · 3–5 Minuten{:else}Der Boss wartet, sobald jedes Wort einmal richtig war.{/if}
    </p>
  </div>
</section>

<style>
  /* Fläche je Region (wie Weiter- und Regionskarte); --soft für Leiste und Wort-Chips. */
  .detail {
    --bg: var(--lantern);
    --soft: var(--lantern-soft);
    --band: calc(var(--safe-top) + clamp(150px, 27vh, 250px));
    position: relative;
    min-height: 100dvh;
    background: var(--bg);
    padding: 0 var(--gutter) calc(var(--safe-bottom) + 24px);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .detail[data-tone='sea'] {
    --bg: var(--sea);
    --soft: var(--sea-soft);
  }
  .detail[data-tone='lotus'] {
    --bg: var(--lotus);
    --soft: var(--lotus-soft);
  }
  .detail[data-tone='yellow'] {
    --bg: var(--tone-yellow);
    --soft: var(--tone-yellow-soft);
  }
  .detail[data-tone='paper'] {
    --bg: var(--surface);
    --soft: var(--paper-2);
  }
  .band {
    height: var(--band);
    margin: 0 calc(-1 * var(--gutter)) 4px;
  }
  /* Hero-Objekt bricht aus der Unterkante der Szene aus, wie das Kajak aus seinem Feld. */
  .hero {
    position: absolute;
    --size: clamp(128px, 38vw, 168px);
    top: calc(var(--band) - var(--size) * 0.62);
    right: calc(var(--gutter) - 8px);
    width: var(--size);
    height: var(--size);
    pointer-events: none;
    z-index: 1;
  }
  .bob {
    height: 100%;
    animation: hero-bob 3.4s ease-in-out infinite alternate;
  }
  @keyframes hero-bob {
    from {
      transform: translateY(2px) rotate(-2deg);
    }
    to {
      transform: translateY(-6px) rotate(2deg);
    }
  }
  .head {
    padding-right: calc(clamp(128px, 38vw, 168px) - 16px);
  }
  .back {
    position: absolute;
    top: calc(var(--safe-top) + 8px);
    left: calc(var(--gutter) - 6px);
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--glass);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: var(--shadow-card);
  }
  .kicker {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-muted);
  }
  h1 {
    font-size: var(--fs-hero);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }
  .meter {
    height: 12px;
    border-radius: 999px;
    background: var(--soft);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--ink);
    border-radius: 999px;
  }
  .chips {
    list-style: none;
    padding: 0;
    margin: 6px 0 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .chips li {
    background: var(--soft);
    border-radius: 999px;
    padding: 8px 14px;
    font-weight: 600;
  }
  .chips li.known {
    background: var(--known, var(--surface));
  }
  .detail[data-tone='paper'] .chips li.known {
    --known: var(--tone-yellow-soft);
  }
  .actions {
    margin-top: auto;
    display: grid;
    gap: 12px;
  }
  /* Während die Karte aufwächst, ploppen die Wörter nacheinander auf, die Knöpfe steigen nach. */
  .chips li {
    animation: chip-in 460ms var(--ease-spring) both;
    animation-delay: calc(220ms + var(--i) * 40ms);
  }
  .meter .fill {
    animation: fill-in 700ms var(--ease-out) 260ms both;
  }
  .actions {
    animation: rise-in 520ms var(--ease-out) 300ms both;
  }
  @keyframes chip-in {
    from {
      transform: scale(0.6);
      opacity: 0;
    }
  }
  @keyframes fill-in {
    from {
      width: 0;
    }
  }
  @keyframes rise-in {
    from {
      transform: translateY(32px);
      opacity: 0;
    }
  }
  .hint {
    text-align: center;
    font-size: var(--fs-small);
    color: var(--ink-muted);
  }
</style>
