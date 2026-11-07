<script lang="ts">
  import Button from '../../lib/components/Button.svelte';
  import { content } from '../../content';
  import type { Task } from '../../lib/logic/session';

  /**
   * Lückensatz: der Satz mit einer Lücke, darunter die Übersetzung; das fehlende Wort aus vier Kacheln wählen.
   * Die Lücke ist so breit wie die längste Kachel (verrät die Lösung nicht, und beim Füllen springt nichts).
   * Nach der Antwort steht das richtige Wort grün in der Lücke; die falsch getippte Kachel ist rot.
   */
  let {
    task,
    picked,
    onpick,
  }: { task: Extract<Task, { kind: 'gap' }>; picked: string | null; onpick: (id: string) => void } = $props();

  const context = $derived(content.contexts.find((c) => c.id === task.item.ctx)?.label);
  const done = $derived(picked !== null);
  const long = $derived(task.item.vn.length > 22);

  function answerState(id: string) {
    if (!picked) return 'idle';
    if (id === task.answer.id) return 'right';
    return id === picked ? 'wrong' : 'dim';
  }
</script>

<p class="kicker">Welches Wort fehlt?</p>
<div class="prompt">
  <p class="vn" class:long lang="vi">
    {task.before}<span class="gap" class:done
      >{#each task.options as o (o.id)}<span class="size" aria-hidden="true">{o.vn.trim()}</span>{/each}<span class="size" aria-hidden="true"
        >{task.fill}</span
      ><span class="fill"
        >{#if done}{task.fill}{:else}<span class="sr">Lücke</span>{/if}</span
      ></span
    >{task.after}
  </p>
  <p class="de" lang="de">{task.item.de}</p>
  <!-- Wen man anspricht, verrät die Übersetzung nicht – der Kontext legt die Anrede fest. -->
  {#if context}<p class="ctx">{context}</p>{/if}
</div>

<div class="answers">
  {#each task.options as o (o.id)}
    <Button
      variant="answer"
      state={answerState(o.id)}
      cheer={picked === o.id && o.id === task.answer.id}
      dataId={o.id}
      disabled={done}
      onclick={() => onpick(o.id)}
    >
      <span lang="vi">{o.vn.trim()}</span>
    </Button>
  {/each}
</div>

<style>
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .prompt {
    border-radius: var(--radius-lg);
    padding: 28px 20px 24px;
    display: grid;
    justify-items: center;
    gap: 10px;
    text-align: center;
    background: var(--lotus);
    box-shadow: var(--shadow-card);
  }
  .vn {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.5;
    letter-spacing: -0.01em;
    color: var(--ink);
  }
  .vn.long {
    font-size: var(--fs-h2);
  }
  /* Lücke: eingelassene Fläche, so breit wie die längste Kachel (alle Kacheln und die Schreibung im Satz – am Satzanfang
     groß – liegen unsichtbar in derselben Zelle) */
  .gap {
    display: inline-grid;
    vertical-align: baseline;
    margin: 0 0.12em;
    padding: 0 0.32em;
    border-radius: 0.36em;
    background: var(--lotus-soft);
    box-shadow: inset 0 -0.12em 0 var(--ink-3);
    transition:
      background-color var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }
  .gap > * {
    grid-area: 1 / 1;
    text-align: center;
  }
  .size {
    visibility: hidden;
  }
  /* Nach der Antwort steht immer das richtige Wort in der Lücke – grün wie die richtige Kachel; rot ist nur die falsch getippte. */
  .gap.done {
    background: var(--ok-soft);
    box-shadow: inset 0 -0.12em 0 var(--ok);
  }
  .gap.done .fill {
    animation: fill-in 420ms var(--ease-spring, cubic-bezier(0.34, 1.56, 0.64, 1)) both;
  }
  @keyframes fill-in {
    from {
      transform: translateY(0.5em) scale(0.6);
      opacity: 0;
    }
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .de {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.35;
    color: var(--ink-muted);
  }
  .ctx {
    font-weight: 600;
    font-size: var(--fs-small);
    color: var(--ink-muted);
  }
  /* Vier Kacheln, zwei je Reihe */
  .answers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .answers :global(.btn) {
    height: 100%;
    overflow-wrap: anywhere;
  }
  @media (prefers-reduced-motion: reduce) {
    .gap.done .fill {
      animation: none;
    }
  }
</style>
