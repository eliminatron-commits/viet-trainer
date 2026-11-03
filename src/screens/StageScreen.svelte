<script lang="ts">
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Button from '../lib/components/Button.svelte';
  import { game } from '../lib/game.svelte';
  import { bossReady, isDone, stageLearned, stageWords } from '../lib/logic/path';
  import { receive, send } from '../lib/motion';

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

<section class="detail" style:view-transition-name="stage-card" in:receive={{ key: 'stage' }} out:send={{ key: 'stage' }}>
  <button class="back" onclick={onback} aria-label="Zurück">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
  </button>

  <p class="kicker">Etappe {index} · {words.length} {kindLabel}{done ? ' · geschafft' : ''}</p>
  <h1 style:view-transition-name="stage-title">{stage.title}</h1>

  <div class="meter" role="progressbar" aria-label="Gelernt" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(learned * 100)}>
    <div class="fill" style:width="{learned * 100}%"></div>
  </div>
  <p class="hint">{Math.round(learned * 100)} % gelernt</p>

  <ul class="chips">
    {#each words as w (w.id)}
      <li class:known={(game.save.items[w.id]?.right ?? 0) > 0} lang="vi">{game.save.items[w.id] ? w.vn : '···'}</li>
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
  .detail {
    min-height: 100dvh;
    background: var(--lantern);
    padding: calc(var(--safe-top) + 12px) var(--gutter) calc(var(--safe-bottom) + 24px);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .back {
    width: var(--tap);
    height: var(--tap);
    margin-left: -10px;
    border: 0;
    background: transparent;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .kicker {
    font-size: var(--fs-small);
    font-weight: 600;
    color: rgb(35 26 21 / 0.75);
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
    background: var(--lantern-soft);
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
    background: var(--lantern-soft);
    border-radius: 999px;
    padding: 8px 14px;
    font-weight: 600;
  }
  .chips li.known {
    background: #fff;
  }
  .actions {
    margin-top: auto;
    display: grid;
    gap: 12px;
  }
  .hint {
    text-align: center;
    font-size: var(--fs-small);
    color: rgb(35 26 21 / 0.75);
  }
</style>
