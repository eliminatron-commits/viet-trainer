<script lang="ts">
  import type { Snippet } from 'svelte';

  export type CardTone = 'lotus' | 'lantern' | 'sea' | 'red' | 'yellow' | 'paper';

  let {
    tone = 'paper',
    vtName,
    onclick,
    children,
  }: {
    tone?: CardTone;
    /** view-transition-name für Shared-Element-Übergänge (eindeutig pro Seite). */
    vtName?: string;
    onclick?: () => void;
    children: Snippet;
  } = $props();
</script>

{#if onclick}
  <button class="card {tone} pressable" style:view-transition-name={vtName} {onclick}>
    {@render children()}
  </button>
{:else}
  <div class="card {tone}" style:view-transition-name={vtName}>
    {@render children()}
  </div>
{/if}

<style>
  .card {
    display: block;
    width: 100%;
    text-align: left;
    border: 0;
    border-radius: var(--radius-card);
    padding: 22px;
    color: var(--ink);
    box-shadow: var(--shadow-card);
    overflow: hidden;
    position: relative;
  }
  .paper { background: #fff; }
  .lotus { background: var(--lotus); }
  .lantern { background: var(--lantern); }
  .sea { background: var(--sea); }
  .yellow { background: var(--yellow); }
  .red { background: var(--red); color: var(--on-red); }

  .pressable {
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .pressable:active {
    transform: scale(0.97);
  }
</style>
