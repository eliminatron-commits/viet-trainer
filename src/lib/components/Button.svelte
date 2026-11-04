<script lang="ts">
  import type { Snippet } from 'svelte';
  import { ripple } from '../ripple';

  let {
    variant = 'primary',
    state = 'idle',
    disabled = false,
    dataId,
    cheer = false,
    onclick,
    children,
  }: {
    variant?: 'primary' | 'secondary' | 'ghost' | 'answer';
    /** Nur für Antwort-Knöpfe: Rückmeldung nach dem Tippen. */
    state?: 'idle' | 'right' | 'wrong' | 'dim';
    disabled?: boolean;
    /** Kennung der Antwort (data-id), u. a. für E2E-Tests. */
    dataId?: string;
    /** Richtig getippt: Sternenregen vom Tippunkt (Flaggenstern in Gelb und Rot). */
    cheer?: boolean;
    onclick?: () => void;
    children: Snippet;
  } = $props();
</script>

<button class="btn {variant} {state}" data-id={dataId} {disabled} {onclick} use:ripple>
  <span class="fx" aria-hidden="true"></span>
  {@render children()}
  {#if cheer}
    <span class="burst" aria-hidden="true">
      {#each [0, 36, 72, 108, 144, 180, 216, 252, 288, 324] as a (a)}<i style:--a="{a}deg"></i>{/each}
    </span>
  {/if}
</button>

<style>
  .btn {
    position: relative;
    isolation: isolate;
    min-height: 56px;
    min-width: var(--tap);
    width: 100%;
    padding: 14px 22px;
    border: 0;
    border-radius: var(--radius-btn);
    font-weight: 600;
    font-size: 18px;
    cursor: pointer;
    transition:
      transform var(--dur-fast) var(--ease-out),
      background-color var(--dur) var(--ease-out),
      opacity var(--dur) var(--ease-out),
      box-shadow var(--dur) var(--ease-out);
  }
  .btn:active:not(:disabled) {
    transform: scale(0.96);
  }
  .btn:disabled {
    cursor: default;
  }
  .primary:disabled {
    opacity: 0.45;
    box-shadow: none;
  }
  /* Neutral statt 45 % Gelb – das würde auf Meer-Türkis zu Oliv. */
  .secondary:disabled {
    background: rgb(255 255 255 / 0.45);
    color: rgb(35 26 21 / 0.55);
    box-shadow: inset 0 0 0 2px rgb(35 26 21 / 0.08);
  }

  .primary {
    background: var(--red);
    color: var(--on-red);
    box-shadow: 0 6px 0 var(--red-deep);
  }
  .primary:active:not(:disabled) {
    transform: translateY(4px);
    box-shadow: 0 2px 0 var(--red-deep);
  }
  .secondary {
    background: var(--yellow);
    color: var(--ink);
  }
  .ghost {
    background: transparent;
    color: inherit;
    font-weight: 600;
  }

  /* Antwort-Kacheln (helles Quiz) */
  .answer {
    background: #fff;
    color: var(--ink);
    text-align: left;
    font-weight: 600;
    box-shadow: 0 4px 0 var(--paper-2);
  }
  .answer.right {
    background: var(--ok-soft);
    color: var(--ok);
    box-shadow: 0 4px 0 var(--ok);
    animation: pop var(--dur) var(--ease-spring);
  }
  .answer.wrong {
    background: var(--bad-soft);
    color: var(--red-deep);
    box-shadow: 0 4px 0 var(--red);
    animation: shake var(--dur-slow) var(--ease-out);
  }
  .answer.dim {
    opacity: 0.45;
  }

  .fx {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    overflow: hidden;
    pointer-events: none;
    z-index: -1;
  }
  .burst {
    position: absolute;
    left: var(--px, 50%);
    top: var(--py, 50%);
    pointer-events: none;
  }
  .burst i {
    position: absolute;
    left: -10px;
    top: -10px;
    width: 20px;
    height: 20px;
    background: var(--yellow);
    clip-path: polygon(50% 0, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%);
    animation: burst 760ms var(--ease-out) both;
  }
  .burst i:nth-child(even) {
    left: -7px;
    top: -7px;
    width: 14px;
    height: 14px;
    background: var(--red);
    animation-delay: 40ms;
  }
  @keyframes burst {
    from {
      transform: rotate(var(--a)) translateY(-6px) scale(0.3);
    }
    70% {
      opacity: 1;
    }
    to {
      transform: rotate(var(--a)) translateY(-92px) scale(1) rotate(140deg);
      opacity: 0;
    }
  }
  @keyframes pop {
    50% { transform: scale(1.04); }
  }
  @keyframes shake {
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(3px); }
  }
</style>
