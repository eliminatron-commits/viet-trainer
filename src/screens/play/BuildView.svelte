<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../lib/components/Button.svelte';
  import SoundDisc from '../../lib/components/SoundDisc.svelte';
  import { play, stop } from '../../lib/audio/player';
  import { content } from '../../content';
  import { buildCorrect, type Task } from '../../lib/logic/session';

  /** Satzbau (deutsche Vorgabe) und Hör-Diktat (Klangscheibe): vietnamesischen Satz aus Kacheln legen. */
  let {
    task,
    done,
    onresult,
  }: {
    task: Extract<Task, { kind: 'build' }>;
    /** Aufgabe aufgelöst (Rückmeldung läuft). */
    done: boolean;
    onresult: (correct: boolean) => void;
  } = $props();

  const dictation = $derived(task.mode === 'dictation');
  const context = $derived(content.contexts.find((c) => c.id === task.item.ctx)?.label);
  let placed = $state<string[]>([]);
  let playing = $state(false);

  const text = (id: string) => task.tiles.find((t) => t.id === id)?.text ?? '';
  const correct = $derived(done && buildCorrect(task, placed));

  function put(id: string) {
    if (!done) placed = [...placed, id];
  }
  function take(id: string) {
    if (!done) placed = placed.filter((p) => p !== id);
  }
  function check() {
    if (!done && placed.length > 0) onresult(buildCorrect(task, placed));
  }

  async function listen() {
    playing = true;
    try {
      await play(task.item.id);
    } catch {
      /* Audio nicht ladbar – die Aufgabe bleibt über erneutes Tippen lösbar */
    } finally {
      playing = false;
    }
  }

  // Diktat startet automatisch.
  onMount(() => {
    if (!dictation) return;
    void listen();
    return stop;
  });
</script>

<p class="kicker">{dictation ? 'Schreib, was du hörst' : 'Baue den Satz'}</p>
<div class="prompt" class:sea={dictation} class:lantern={!dictation}>
  {#if dictation}
    <button class="disc" onclick={listen} aria-label="Noch einmal anhören">
      <SoundDisc size={150} />
    </button>
    {#if done}
      <p class="de" lang="de">{task.item.de}</p>
    {:else}
      <p class="status" aria-live="polite">{playing ? 'spielt …' : 'Tippe die Sonne zum Wiederholen'}</p>
    {/if}
  {:else}
    <h1 lang="de" class:long={task.item.de.length > 30}>{task.item.de}</h1>
    <!-- Wen man anspricht, verrät die Übersetzung nicht – der Kontext legt die Anrede fest. -->
    {#if context}<p class="ctx">{context}</p>{/if}
  {/if}
</div>

<div class="line" class:ok={done && correct} class:bad={done && !correct} role="group" aria-label="Dein Satz">
  {#each placed as id (id)}
    <div class="tile">
      <Button variant="answer" dataId={id} disabled={done} onclick={() => take(id)}>
        <span lang="vi">{text(id)}</span>
      </Button>
    </div>
  {/each}
  {#if placed.length === 0}
    <span class="hint">Tippe die Kacheln in der richtigen Reihenfolge.</span>
  {:else if task.closing}
    <span class="closing" lang="vi">{task.closing}</span>
  {/if}
</div>

<div class="answers bank">
  {#each task.tiles as t (t.id)}
    {@const used = placed.includes(t.id)}
    <div class="tile" class:used>
      <Button variant="answer" dataId={used ? undefined : t.id} disabled={used || done} onclick={() => put(t.id)}>
        <span lang="vi">{t.text}</span>
      </Button>
    </div>
  {/each}
</div>

{#if !done}
  <div class="next">
    <Button disabled={placed.length === 0} onclick={check}>Prüfen</Button>
  </div>
{/if}

<style>
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .prompt {
    border-radius: var(--radius-lg);
    padding: 24px 22px;
    display: grid;
    justify-items: center;
    gap: 6px;
    text-align: center;
    box-shadow: var(--shadow-card);
  }
  .lantern {
    background: var(--lantern);
  }
  .sea {
    background: var(--sea);
    padding-top: 18px;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
  }
  h1.long {
    font-size: var(--fs-h2);
  }
  .disc {
    border: 0;
    padding: 0;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
  }
  .status {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-muted);
    min-height: 1.4em;
  }
  .ctx {
    font-weight: 600;
    font-size: var(--fs-small);
    color: var(--ink-muted);
  }
  .de {
    font-size: var(--fs-h2);
    font-weight: 800;
    line-height: 1.2;
  }

  /* Antwortzeile: Kacheln liegen auf einer Grundlinie */
  .line {
    min-height: 76px;
    padding: 10px 12px 14px;
    border-radius: var(--radius-card);
    background: var(--surface);
    box-shadow: inset 0 -4px 0 var(--paper-2);
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    transition: background-color var(--dur) var(--ease-out);
  }
  .line.ok {
    background: var(--ok-soft);
    box-shadow: inset 0 -4px 0 var(--ok);
  }
  .line.bad {
    background: var(--bad-soft);
    box-shadow: inset 0 -4px 0 var(--red);
  }
  .hint {
    color: var(--ink-muted);
    font-weight: 600;
    font-size: var(--fs-small);
    padding: 0 8px;
  }
  .closing {
    font-size: 22px;
    font-weight: 800;
  }
  .bank {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  /* Kachel = Antwort-Knopf in Textbreite */
  .tile {
    max-width: 100%;
  }
  .tile :global(.btn) {
    width: auto;
    max-width: 100%;
    min-height: 48px;
    padding: 10px 16px;
    font-size: 18px;
    overflow-wrap: anywhere;
  }
  /* Gelegte Kachel verlässt den Vorrat, ihr Platz bleibt stehen (kein Springen des Layouts). */
  .tile.used {
    visibility: hidden;
  }
</style>
