<script lang="ts">
  import RegionHero from '../illustrations/RegionHero.svelte';
  import type { Mood } from './Buffalo.svelte';
  import Trau from './Trau.svelte';

  /**
   * Trâu auf dem Roller mit Blumenkorb (Hero-Objekt von Hà Nội) – Roller-Sprint. Drei Ebenen im selben Quadrat:
   * hinten der Blumenkorb, dann Trâu (wie im Spielstand: Größe, Accessoires, Stimmung), vorn Sitzbank, Verkleidung und
   * Räder – so sitzt er im Sattel, die Beine verschwinden hinter der Verkleidung.
   */
  let { size = 96, mood = 'idle' }: { size?: number; mood?: Mood } = $props();

  /** Trâus Größe relativ zum Roller; Lage so, dass seine Körpermitte (100|150) auf der Sitzbank (74|96) liegt. */
  const RIDER = 0.6;
</script>

<div class="ride" style:--s="{size}px" aria-hidden="true">
  <RegionHero region="hanoi" layer="back" {size} />
  <div class="rider"><Trau size={size * RIDER} {mood} /></div>
  <RegionHero region="hanoi" layer="front" {size} />
</div>

<style>
  .ride {
    position: relative;
    width: var(--s);
    height: var(--s);
  }
  .ride > :global(svg) {
    position: absolute;
    inset: 0;
  }
  .rider {
    position: absolute;
    left: calc(var(--s) * 0.07);
    top: calc(var(--s) * 0.03);
    line-height: 0;
  }
</style>
