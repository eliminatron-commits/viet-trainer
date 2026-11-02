<script lang="ts">
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Button from '../lib/components/Button.svelte';
  import { receive, send } from '../lib/motion';

  let { stage, onback, onstart }: { stage: Stage; onback: () => void; onstart: () => void } = $props();

  const words = $derived(content.words.filter((w) => w.stage === stage.id));
  const index = $derived(content.stages.findIndex((s) => s.id === stage.id) + 1);
</script>

<section class="detail" style:view-transition-name="stage-card" in:receive={{ key: 'stage' }} out:send={{ key: 'stage' }}>
  <button class="back" onclick={onback} aria-label="Zurück">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
  </button>

  <p class="kicker">Etappe {index} · {words.length} neue Wörter</p>
  <h1 style:view-transition-name="stage-title">{stage.title}</h1>

  <ul class="chips">
    {#each words as w (w.id)}
      <li>{w.vn}</li>
    {/each}
  </ul>

  <div class="actions">
    <Button onclick={onstart}>Etappe starten</Button>
    <p class="hint">ca. 12 Aufgaben · 3–5 Minuten</p>
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
  .chips {
    list-style: none;
    padding: 0;
    margin: 10px 0 0;
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
  .actions {
    margin-top: auto;
    display: grid;
    gap: 10px;
  }
  .hint {
    text-align: center;
    font-size: var(--fs-small);
    color: rgb(35 26 21 / 0.75);
  }
</style>
