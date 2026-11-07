<script lang="ts" module>
  import { glyphs, type Glyph } from '../logic/tones';

  // Zeitplan in ms: Buchstaben im Takt, dann Ton für Ton (fallen, kurz liegen, verschmelzen).
  const LETTER = 55;
  const TYPE = 320;
  const DROP = 440;
  const HOLD = 460; // rot liegen lassen, damit man den Ton bemerkt
  const GAP = 170;
  const MERGE = 240;

  type Placed = Glyph & { i: number; drop: number | null; lift: boolean };

  function planOf(vn: string) {
    const parts = glyphs(vn);
    const typed = parts.length * LETTER + TYPE;
    let n = 0;
    const placed: Placed[] = parts.map((g, i) => ({
      ...g,
      i,
      drop: g.tone === 'ngang' ? null : typed + 80 + n++ * GAP,
      // Über Zirkumflex und Breve sitzt der Ton höher.
      lift: /[âêôăÂÊÔĂ]/.test(g.bare),
    }));
    // Silben einzeln umbrechen, nie mitten im Wort.
    const syllables: Placed[][] = [[]];
    for (const g of placed) {
      if (g.bare === ' ') syllables.push([]);
      else syllables.at(-1)!.push(g);
    }
    const end = n > 0 ? typed + 80 + (n - 1) * GAP + DROP + HOLD + MERGE : typed;
    return { syllables, end };
  }

  /** Dauer bis das Wort fertig dasteht (alle Töne verschmolzen), in ms. */
  export const livingEnd = (vn: string): number => planOf(vn).end;
</script>

<script lang="ts">
  import ToneMark from './ToneMark.svelte';

  /**
   * Lebendiges Wort: erscheint Buchstabe für Buchstabe, zuerst ohne Tonzeichen. Dann fällt jedes Tonzeichen als kleine
   * rote Fläche auf seinen Vokal und geht in die Schrift über. Größe = Schriftgröße des umgebenden Elements.
   * Der Text im DOM ist immer das echte Wort. Reduzierte Bewegung: steht gleich fertig da.
   */
  let { vn }: { vn: string } = $props();

  const plan = $derived(planOf(vn));
</script>

{#each plan.syllables as syllable, s (s)}
  {#if s > 0}{' '}{/if}<span class="syl"
    >{#each syllable as g (g.i)}{#if g.drop === null}<span class="ch" style:--i={g.i}>{g.full}</span
        >{:else}<span
          class="ch toned"
          style:--i={g.i}
          style:--drop="{g.drop}ms"
          style:--merge="{g.drop + DROP + HOLD}ms"
          data-bare={g.bare === 'i' ? 'ı' : g.bare}
          ><span class="real">{g.full}</span><ToneMark tone={g.tone} class="tone {g.tone}{g.lift ? ' lift' : ''}" /></span
        >{/if}{/each}</span
  >
{/each}

<style>
  .syl {
    display: inline-block;
    white-space: nowrap;
  }
  /* Buchstabe für Buchstabe herein. */
  .ch {
    display: inline-block;
    position: relative;
    animation: ch-in 320ms var(--ease-out) both;
    animation-delay: calc(var(--i) * 55ms);
  }
  /* Buchstabe mit Ton: erst ohne (::before), der Ton fällt als rote Fläche, dann übernimmt die echte Schrift. */
  .toned .real {
    opacity: 0;
    animation: real-in 240ms var(--ease-out) var(--merge) forwards;
  }
  .toned::before {
    content: attr(data-bare);
    position: absolute;
    left: 0;
    top: 0;
    animation: bare-out 240ms var(--ease-out) var(--merge) forwards;
  }
  .ch :global(.tone) {
    position: absolute;
    left: 50%;
    top: -0.1em;
    width: 0.34em;
    height: 0.34em;
    margin-left: -0.17em;
    fill: var(--red);
    opacity: 0;
    animation:
      tone-drop 440ms var(--ease-spring) var(--drop) forwards,
      tone-out 240ms var(--ease-out) var(--merge) forwards;
  }
  .ch :global(.tone.lift) {
    top: -0.3em;
    margin-left: -0.04em;
  }
  .ch :global(.tone.nang) {
    top: 0.93em;
    width: 0.18em;
    height: 0.18em;
    margin-left: -0.09em;
  }
  @keyframes ch-in {
    from {
      opacity: 0;
      transform: translateY(0.3em) scale(0.9);
    }
  }
  @keyframes real-in {
    to {
      opacity: 1;
    }
  }
  @keyframes bare-out {
    to {
      opacity: 0;
    }
  }
  @keyframes -global-tone-drop {
    from {
      opacity: 0;
      transform: translateY(-1.1em) scale(1.5) rotate(-20deg);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes -global-tone-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: scale(0.6);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ch,
    .toned .real,
    .toned::before,
    .ch :global(.tone) {
      animation: none;
    }
    .toned .real {
      opacity: 1;
    }
    .toned::before,
    .ch :global(.tone) {
      display: none;
    }
  }
</style>
