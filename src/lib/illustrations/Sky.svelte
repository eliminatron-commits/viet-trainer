<svelte:options namespace="svg" />

<script lang="ts" module>
  /**
   * Feste Farben des Himmels, gemeinsam für alle Szenen (zählen nicht zur Palette C einer Szene):
   * Mondspiegelung auf dem Wasser und Glühwürmchen (Nachtlicht über Feld und Hof).
   */
  export const MOON_SHINE = '#E9DEAF';
  export const FIREFLY = '#FFC14D';
</script>

<script lang="ts">
  import { theme } from '../theme.svelte';

  /**
   * Himmelskörper einer Szene: bei Tag die Sonne mit atmendem Hof, bei Nacht der Mond mit flachen Lichthöfen
   * (Scheiben, kein Weichzeichner) und funkelnden Sternen – an derselben Stelle, das Licht kommt weiter von rechts oben.
   * Direkt nach dem Himmel zeichnen, damit Berge und Häuser davor liegen.
   */
  let {
    x,
    y,
    r,
    e = 140,
    sun = true,
    moon = true,
  }: { x: number; y: number; r: number; e?: number; sun?: boolean; moon?: boolean } = $props();

  const STARS = [
    [24, 22, 1.4],
    [62, 50, 1],
    [96, 16, 1.6],
    [138, 40, 1.1],
    [176, 12, 1.3],
    [214, 34, 1],
    [252, 16, 1.5],
    [40, 86, 1.1],
    [120, 72, 1.2],
    [196, 62, 1],
    [384, 120, 1.2],
    [232, 98, 0.9],
    [12, 120, 1],
  ] as const;
</script>

{#if theme.dark}
  {#each STARS as [sx, sy, sr], i (i)}
    <g class="in in-fade" style="--e: {e + 80 + i * 35}">
      <g class="loop-twinkle" style="--t: {1.6 + (i % 4) * 0.55}s; --d: {-i * 0.37}s"><circle cx={sx} cy={sy} r={sr} fill="#FFF4D6" /></g>
    </g>
  {/each}
  {#if moon}
    <g class="in in-drop" style="--e: {e}">
      <g class="loop-breathe" style="--t: 5.2s; --s: 1.08">
        <circle cx={x} cy={y} r={r * 1.95} fill="#252F57" />
        <circle cx={x} cy={y} r={r * 1.45} fill="#323D6C" />
      </g>
      <circle cx={x} cy={y} r={r} fill="#F4ECCB" />
      <circle cx={x - r * 0.32} cy={y - r * 0.18} r={r * 0.22} fill="#E2D6AC" />
      <circle cx={x + r * 0.22} cy={y + r * 0.34} r={r * 0.16} fill="#E2D6AC" />
      <circle cx={x + r * 0.38} cy={y - r * 0.32} r={r * 0.1} fill="#E2D6AC" />
    </g>
  {/if}
{:else if sun}
  <g class="in in-rise" style="--e: {e}">
    <g class="loop-breathe" style="--t: 4.6s; --s: 1.12"><circle cx={x} cy={y} r={r * 1.55} fill="#FFE58A" /></g>
    <circle cx={x} cy={y} r={r} fill="#FFCD00" />
  </g>
{/if}
