<script lang="ts">
  import { plantShape } from '../logic/field';
  import { theme } from '../theme.svelte';

  /**
   * Eine Reispflanze wie im Reisfeld (Training): Wuchs nach SRS-Box, durstig = fahl und hängend.
   * `stage` 0 = noch nicht gesetzt (nur feuchte Erde). Farben wie im Reisfeld.
   */
  let { stage, thirsty = false, size = 64 }: { stage: number; thirsty?: boolean; size?: number } = $props();

  const DAY = {
    soil: '#B3DDD6',
    sprout: '#8CC65A',
    leaf: '#57A04C',
    leafShade: '#3B7A3B',
    grain: '#D5D56A',
    gold: '#EBB83A',
    goldShade: '#C48C22',
    dry: '#A8B27C',
    dryShade: '#8A945F',
  };
  const NIGHT: typeof DAY = {
    soil: '#2B416B',
    sprout: '#4F8C59',
    leaf: '#3A6F50',
    leafShade: '#28503D',
    grain: '#9A9C58',
    gold: '#B78F3D',
    goldShade: '#8C6C2B',
    dry: '#6C735A',
    dryShade: '#565C49',
  };
  const C = $derived(theme.dark ? NIGHT : DAY);
  const shape = $derived(stage > 0 ? plantShape(stage, thirsty ? 1 : 0) : null);
  const paint = $derived(
    thirsty
      ? { light: C.dry, shade: C.dryShade, head: C.dryShade }
      : stage < 2.5
        ? { light: C.sprout, shade: C.leaf, head: C.grain }
        : stage < 4.5
          ? { light: C.leaf, shade: C.leafShade, head: C.grain }
          : { light: C.gold, shade: C.goldShade, head: C.goldShade },
  );
</script>

<svg class="plant" viewBox="-26 -44 52 50" width={size} height={size * (50 / 52)} aria-hidden="true">
  <ellipse cx="0" cy="2.5" rx="21" ry="4" fill={C.soil} />
  {#if shape}
    <path d={shape.shade} fill={paint.shade} />
    <path d={shape.light} fill={paint.light} />
    {#if shape.head}<path d={shape.head} fill={paint.head} />{/if}
  {/if}
</svg>
