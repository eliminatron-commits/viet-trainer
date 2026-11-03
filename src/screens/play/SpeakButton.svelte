<script lang="ts">
  import { play } from '../../lib/audio/player';

  let { id, label = 'Anhören' }: { id: string; label?: string } = $props();
</script>

<button class="speak" onclick={() => play(id).catch(() => {})} aria-label={label}>
  <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
    <path
      d="M4 9h4l5-4v14l-5-4H4zM15.5 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18 6a8.5 8.5 0 0 1 0 12l-1.4-1.4a6.5 6.5 0 0 0 0-9.2z"
      fill="currentColor"
    />
  </svg>
</button>

<style>
  .speak {
    margin-top: 6px;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: 0;
    background: rgb(255 255 255 / 0.45);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .speak:active {
    transform: scale(0.94);
  }
</style>
