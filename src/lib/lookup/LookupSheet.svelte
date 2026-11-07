<script lang="ts">
  import { tick } from 'svelte';
  import { content } from '../../content';
  import { reducedMotion } from '../motion';
  import { backLookup, closeLookup, lookup } from './lookup.svelte';
  import SentenceLens from './SentenceLens.svelte';
  import WordCard from './WordCard.svelte';

  /**
   * Blatt für Satzlupe und Wortkarte, einmal in App.svelte. Steigt von unten über die aktuelle Ansicht (Papier-Schleier
   * dahinter), hat einen eigenen Verlauf (Zurück) und schließt per Schleier, Knopf oder Escape. Der Fokus bleibt im
   * Blatt und kehrt beim Schließen zum auslösenden Element zurück.
   */
  const top = $derived(lookup.stack.at(-1));
  const sentence = $derived(top?.kind === 'sentence' ? content.sentences.find((s) => s.id === top.id) : undefined);
  const word = $derived(top?.kind === 'word' ? content.words.find((w) => w.id === top.id) : undefined);
  const from = $derived(top?.kind === 'word' && top.from ? content.sentences.find((s) => s.id === top.from) : undefined);
  const key = $derived(top ? `${lookup.stack.length}:${top.id}` : '');

  let sheet = $state<HTMLElement | null>(null);
  let closing = $state(false);

  function close() {
    if (closing) return;
    if (reducedMotion()) return closeLookup();
    closing = true;
    setTimeout(() => {
      closing = false;
      closeLookup();
    }, 240);
  }

  // Neue Ansicht im Blatt: nach oben und Fokus auf ihre Überschrift.
  $effect(() => {
    if (!key || !sheet) return;
    const el = sheet;
    el.scrollTop = 0;
    void tick().then(() => el.querySelector<HTMLElement>('#lookup-title')?.focus({ preventScroll: true }));
  });

  // Seite dahinter scrollt nicht mit.
  $effect(() => {
    if (!top) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  });

  function onkeydown(e: KeyboardEvent) {
    if (!top) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab' && sheet) {
      const all = [...sheet.querySelectorAll<HTMLElement>('button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])')];
      if (!all.length) return;
      const first = all[0]!;
      const last = all.at(-1)!;
      if (e.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }
</script>

<svelte:window {onkeydown} />

{#if top && (sentence || word)}
  <div class="lookup" class:closing>
    <div class="scrim" aria-hidden="true" onclick={close}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="lookup-title" bind:this={sheet}>
      <div class="bar">
        {#if lookup.stack.length > 1}
          <button class="glass" onclick={backLookup} aria-label="Zurück">
            <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15.4 5 8.4 12l7 7-1.4 1.4L5.6 12 14 3.6z" fill="currentColor" /></svg>
          </button>
        {/if}
        <button class="glass close" onclick={close} aria-label="Schließen">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
            ><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" /></svg
          >
        </button>
      </div>
      {#key key}
        <div class="view" class:back={lookup.dir === -1}>
          {#if sentence}<SentenceLens {sentence} />{:else if word}<WordCard {word} {from} />{/if}
        </div>
      {/key}
    </div>
  </div>
{/if}

<style>
  .lookup {
    position: fixed;
    inset: 0;
    z-index: 40;
    display: grid;
    align-items: end;
  }
  .scrim {
    position: absolute;
    inset: 0;
    background: var(--scrim);
    touch-action: none;
    animation: fade 260ms var(--ease-out) both;
  }
  .sheet {
    position: relative;
    /* Feste Höhe: beim Wechsel zwischen Satz und Wort bleibt das Blatt ruhig stehen */
    height: calc(100dvh - var(--safe-top) - 16px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 0 0 calc(var(--safe-bottom) + 28px);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: var(--paper);
    box-shadow: var(--shadow-float);
    animation: sheet-up 420ms var(--ease-out) both;
  }
  .closing .scrim {
    animation: fade-out 240ms var(--ease-out) forwards;
  }
  .closing .sheet {
    animation: sheet-down 240ms cubic-bezier(0.5, 0, 0.75, 0) forwards;
  }
  /* Zurück und Schließen schweben über dem Band und bleiben beim Scrollen erreichbar. */
  .bar {
    position: sticky;
    top: 0;
    z-index: 2;
    height: 0;
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 12px;
  }
  .glass {
    margin-top: 12px;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--glass);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .glass:active {
    transform: scale(0.92);
  }
  /* Weiter in die Tiefe: neue Ansicht gleitet von rechts herein, zurück von links. */
  .view {
    animation: view-in 300ms var(--ease-out) both;
  }
  .view.back {
    animation-name: view-back;
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }
  @keyframes sheet-up {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes sheet-down {
    to {
      transform: translateY(100%);
    }
  }
  /* Halb sichtbar beginnen: das Blatt blinkt beim Wechsel nicht leer auf */
  @keyframes view-in {
    from {
      opacity: 0.4;
      transform: translateX(28px);
    }
  }
  @keyframes view-back {
    from {
      opacity: 0.4;
      transform: translateX(-28px);
    }
  }
</style>
