<svelte:options namespace="svg" />

<script lang="ts">
  /** Flacher Lichthof eines Nachtlichts: zwei durchscheinende Scheiben, sacht pulsierend (kein Weichzeichner). */
  let { x, y, r, color, t = 2.6, d = 0 }: { x: number; y: number; r: number; color: string; t?: number; d?: number } = $props();
</script>

<g class="loop-glow" style="--t: {t}s; --d: {d}s">
  <circle cx={x} cy={y} r={r * 2.3} fill={color} opacity="0.13" />
  <circle cx={x} cy={y} r={r * 1.5} fill={color} opacity="0.26" />
</g>
