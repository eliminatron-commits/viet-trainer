<script lang="ts">
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Button from '../lib/components/Button.svelte';
  import { play } from '../lib/audio/player';

  let { stage, onnext, onclose }: { stage: Stage; onnext: () => void; onclose: () => void } = $props();

  // Prototyp: eine VN→DE-Aufgabe mit Ablenkern aus derselben Etappe
  const pool = $derived(content.words.filter((w) => w.stage === stage.id));
  const target = $derived(pool[3] ?? pool[0]!);
  const options = $derived(
    [target, ...pool.filter((w) => w.id !== target.id).slice(5, 8)].sort((a, b) => a.vn.localeCompare(b.vn)),
  );

  let picked = $state<string | null>(null);
  const correct = $derived(picked === target.id);

  function answerState(id: string) {
    if (!picked) return 'idle';
    if (id === target.id) return 'right';
    return id === picked ? 'wrong' : 'dim';
  }
</script>

<main class="quiz">
  <header class="bar">
    <button class="close" onclick={onclose} aria-label="Etappe verlassen">
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" /></svg>
    </button>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="12" aria-valuenow="3">
      <div class="fill" style:width="25%"></div>
    </div>
  </header>

  <p class="kicker">Was bedeutet das?</p>
  <div class="prompt">
    <h1 lang="vi">{target.vn}</h1>
    {#if target.pron}<p class="pron">[{target.pron}]</p>{/if}
    <button class="speak" onclick={() => play(target.id)} aria-label="Anhören">
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4zM15.5 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18 6a8.5 8.5 0 0 1 0 12l-1.4-1.4a6.5 6.5 0 0 0 0-9.2z" fill="currentColor" /></svg>
    </button>
  </div>

  <div class="answers">
    {#each options as o (o.id)}
      <Button variant="answer" state={answerState(o.id)} disabled={picked !== null} onclick={() => (picked = o.id)}>{o.de}</Button>
    {/each}
  </div>

  {#if picked}
    <footer class="feedback" class:ok={correct}>
      <p class="verdict">{correct ? 'Richtig!' : `Richtig wäre: ${target.de}`}</p>
      <Button variant={correct ? 'secondary' : 'primary'} onclick={onnext}>Weiter</Button>
    </footer>
  {/if}
</main>

<style>
  .quiz {
    min-height: 100dvh;
    padding: calc(var(--safe-top) + 10px) var(--gutter) calc(var(--safe-bottom) + 24px);
    display: flex;
    flex-direction: column;
    gap: 18px;
    background: var(--paper);
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .close {
    width: var(--tap);
    height: var(--tap);
    margin-left: -10px;
    border: 0;
    background: transparent;
    display: grid;
    place-items: center;
    color: var(--ink-2);
    cursor: pointer;
  }
  .progress {
    flex: 1;
    height: 14px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--sea);
    border-radius: 999px;
  }
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .prompt {
    background: var(--lotus);
    border-radius: var(--radius-lg);
    padding: 34px 22px 26px;
    display: grid;
    justify-items: center;
    gap: 6px;
    box-shadow: var(--shadow-card);
  }
  .prompt h1 {
    font-size: 52px;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .pron {
    color: rgb(35 26 21 / 0.7);
    font-weight: 600;
  }
  .speak {
    margin-top: 8px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 0;
    background: var(--lotus-soft);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .speak:active {
    transform: scale(0.94);
  }
  .answers {
    display: grid;
    gap: 12px;
  }
  .feedback {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 18px var(--gutter) calc(var(--safe-bottom) + 18px);
    background: var(--bad-soft);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    display: grid;
    gap: 12px;
    animation: rise var(--dur) var(--ease-out);
  }
  .feedback.ok {
    background: var(--ok-soft);
  }
  .verdict {
    font-weight: 800;
    font-size: 20px;
  }
  @keyframes rise {
    from {
      transform: translateY(100%);
    }
  }
</style>
