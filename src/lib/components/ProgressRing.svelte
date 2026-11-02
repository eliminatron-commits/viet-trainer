<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    value,
    size = 64,
    stroke = 8,
    color = 'var(--red)',
    track = 'var(--paper-2)',
    label,
    children,
  }: {
    /** Fortschritt 0..1 */
    value: number;
    size?: number;
    stroke?: number;
    color?: string;
    track?: string;
    /** Zugänglicher Text, z. B. „Tagesziel 60 %“. */
    label: string;
    children?: Snippet;
  } = $props();

  const r = $derived((size - stroke) / 2);
  const c = $derived(2 * Math.PI * r);
  const clamped = $derived(Math.max(0, Math.min(1, value)));
</script>

<div class="ring" style:width="{size}px" style:height="{size}px" role="img" aria-label={label}>
  <svg width={size} height={size} viewBox="0 0 {size} {size}">
    <circle cx={size / 2} cy={size / 2} {r} fill="none" stroke={track} stroke-width={stroke} />
    <circle
      class="bar"
      cx={size / 2}
      cy={size / 2}
      {r}
      fill="none"
      stroke={color}
      stroke-width={stroke}
      stroke-linecap="round"
      stroke-dasharray={c}
      stroke-dashoffset={c * (1 - clamped)}
      transform="rotate(-90 {size / 2} {size / 2})"
    />
  </svg>
  {#if children}<div class="center">{@render children()}</div>{/if}
</div>

<style>
  .ring {
    position: relative;
    flex: none;
  }
  .bar {
    transition: stroke-dashoffset var(--dur-slow) var(--ease-out);
  }
  .center {
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-weight: 800;
  }
</style>
