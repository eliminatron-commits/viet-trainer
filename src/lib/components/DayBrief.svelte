<script lang="ts">
  import { tick } from 'svelte';
  import { closeBrief, brief } from '../brief.svelte';
  import { game, today } from '../game.svelte';
  import { briefItems, greeting, type BriefTarget } from '../logic/brief';
  import Trau from '../mascot/Trau.svelte';
  import { reducedMotion } from '../motion';
  import BriefList from './BriefList.svelte';
  import Button from './Button.svelte';

  /**
   * Trâus Tagesblick als Blatt von unten (Papier-Schleier dahinter): Trâu hüpft und grüßt, darunter was heute ansteht.
   * Jeder Punkt führt direkt hin (`onfollow`, App.svelte startet die Runde); „Später“, Schleier oder Escape schließen.
   */
  let { onfollow }: { onfollow: (target: BriefTarget) => void } = $props();

  const items = $derived(brief.open ? briefItems(game.save, today()) : []);
  const hello = greeting(new Date().getHours());
  let closing = $state(false);
  let sheet = $state<HTMLElement | null>(null);

  $effect(() => {
    if (!brief.open || !sheet) return;
    const el = sheet;
    void tick().then(() => el.querySelector<HTMLElement>('#brief-title')?.focus({ preventScroll: true }));
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  });

  function close() {
    if (closing) return;
    if (reducedMotion()) return closeBrief();
    closing = true;
    setTimeout(() => {
      closing = false;
      closeBrief();
    }, 240);
  }

  function onkeydown(e: KeyboardEvent) {
    if (!brief.open) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab' && sheet) {
      const all = [...sheet.querySelectorAll<HTMLElement>('button:not([disabled])')];
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

{#if brief.open}
  <div class="brief" class:closing>
    <div class="scrim" aria-hidden="true" onclick={close}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="brief-title" bind:this={sheet}>
      <div class="head">
        <div class="trau"><Trau size={96} mood="happy" /></div>
        <div class="hello">
          <p class="kicker">Trâus Tagesblick</p>
          <h2 id="brief-title" tabindex="-1">{hello}!</h2>
          <p class="sub">Das steht heute an:</p>
        </div>
      </div>
      <BriefList {items} {onfollow} />
      <Button variant="ghost" onclick={close}>Später</Button>
    </div>
  </div>
{/if}

<style>
  .brief {
    position: fixed;
    inset: 0;
    z-index: 35;
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
    display: grid;
    gap: 14px;
    max-height: calc(100dvh - var(--safe-top) - 12px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 20px var(--gutter) calc(var(--safe-bottom) + 16px);
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
  .head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .trau {
    flex: none;
  }
  .hello {
    min-width: 0;
  }
  .kicker,
  .sub {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  h2 {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
    outline: none;
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
  @media (prefers-reduced-motion: reduce) {
    .scrim,
    .sheet {
      animation: none !important;
    }
  }
</style>
