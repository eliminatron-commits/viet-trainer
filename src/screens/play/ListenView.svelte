<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../lib/components/Button.svelte';
  import SoundDisc from '../../lib/components/SoundDisc.svelte';
  import { play, stop } from '../../lib/audio/player';
  import type { Opt } from './ChoiceView.svelte';

  let {
    kicker = 'Was hörst du?',
    audioId,
    reveal,
    options,
    answerId,
    picked,
    onpick,
  }: {
    kicker?: string;
    audioId: string;
    /** Vietnamesischer Text, der nach der Antwort erscheint. */
    reveal: string;
    options: Opt[];
    answerId: string;
    picked: string | null;
    onpick: (id: string) => void;
  } = $props();

  let playing = $state(false);

  async function listen() {
    playing = true;
    try {
      await play(audioId);
    } catch {
      /* Audio nicht ladbar – Aufgabe bleibt lösbar über erneutes Tippen */
    } finally {
      playing = false;
    }
  }

  /** Ton-Zwillinge: nach der Antwort ist die Schreibung jedes Zwillings der Lerninhalt – keiner tritt zurück. */
  const keepAll = $derived(options.some((o) => o.spell));

  function answerState(id: string) {
    if (!picked) return 'idle';
    if (id === answerId) return 'right';
    return id === picked ? 'wrong' : keepAll ? 'idle' : 'dim';
  }

  // Hör-Aufgaben starten automatisch.
  onMount(() => {
    void listen();
    return stop;
  });
</script>

<p class="kicker">{kicker}</p>
<div class="prompt">
  <button class="disc" onclick={listen} aria-label="Noch einmal anhören">
    <SoundDisc size={170} />
  </button>
  {#if picked}
    <p class="reveal" lang="vi">{reveal}</p>
  {:else}
    <p class="status" aria-live="polite">{playing ? 'spielt …' : 'Tippe die Sonne zum Wiederholen'}</p>
  {/if}
</div>

<div class="answers">
  {#each options as o (o.id)}
    <Button
      variant="answer"
      state={answerState(o.id)}
      cheer={picked === o.id && o.id === answerId}
      dataId={o.id}
      disabled={picked !== null}
      onclick={() => onpick(o.id)}
    >
      {#if o.spell}
        <span class="twin">
          <span lang={o.vi ? 'vi' : 'de'}>{o.text}</span>
          <span class="spell" class:shown={picked !== null} lang="vi">{o.spell}</span>
        </span>
      {:else}
        <span lang={o.vi ? 'vi' : 'de'}>{o.text}</span>
      {/if}
    </Button>
  {/each}
</div>

<style>
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .prompt {
    background: var(--sea);
    border-radius: var(--radius-lg);
    padding: 18px 22px 22px;
    display: grid;
    justify-items: center;
    gap: 6px;
    text-align: center;
    box-shadow: var(--shadow-card);
  }
  .disc {
    border: 0;
    padding: 0;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
  }
  /* Niedrige Bildschirme: kleinere Sonne, damit die Antwortkacheln über der Rückmeldungsleiste bleiben */
  @media (max-height: 760px) {
    .prompt {
      padding: 12px 22px 16px;
    }
    .disc :global(svg) {
      width: 120px;
      height: 120px;
    }
  }
  .status {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-muted);
    min-height: 1.4em;
  }
  .reveal {
    font-size: var(--fs-h2);
    font-weight: 800;
    line-height: 1.2;
  }
  .answers {
    display: grid;
    gap: 12px;
  }
  /* Ton-Zwillinge: Bedeutung links, nach der Antwort die Schreibung rechts – ihr Platz ist von Anfang an
     reserviert (unsichtbar), damit beim Aufdecken nichts umbricht oder springt */
  .twin {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 14px;
  }
  .spell {
    flex: none;
    font-size: 22px;
    font-weight: 800;
    visibility: hidden;
  }
  .spell.shown {
    visibility: visible;
  }
</style>
