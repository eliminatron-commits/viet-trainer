<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    variant = 'primary',
    state = 'idle',
    disabled = false,
    dataId,
    onclick,
    children,
  }: {
    variant?: 'primary' | 'secondary' | 'ghost' | 'answer';
    /** Nur für Antwort-Knöpfe: Rückmeldung nach dem Tippen. */
    state?: 'idle' | 'right' | 'wrong' | 'dim';
    disabled?: boolean;
    /** Kennung der Antwort (data-id), u. a. für E2E-Tests. */
    dataId?: string;
    onclick?: () => void;
    children: Snippet;
  } = $props();
</script>

<button class="btn {variant} {state}" data-id={dataId} {disabled} {onclick}>
  {@render children()}
</button>

<style>
  .btn {
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
  .primary:disabled,
  .secondary:disabled {
    opacity: 0.45;
    box-shadow: none;
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
