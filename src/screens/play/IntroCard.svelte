<script lang="ts">
  import { onMount } from 'svelte';
  import type { Word } from '../../content/types';
  import Button from '../../lib/components/Button.svelte';
  import { play } from '../../lib/audio/player';
  import { glyphs, type Glyph } from '../../lib/logic/tones';
  import { reducedMotion } from '../../lib/motion';
  import SpeakButton from './SpeakButton.svelte';

  /**
   * Lebendige Wörter: Das neue Wort erscheint Buchstabe für Buchstabe, zuerst ohne Tonzeichen. Dann fällt jedes
   * Tonzeichen als kleine rote Fläche auf seinen Vokal und geht in die Schrift über. Danach dreht sich die Karte zur
   * Übersetzung um; der Knopf oben rechts dreht sie zurück. Reduzierte Bewegung: gleich die Rückseite, ohne Animation.
   */
  let { word, onnext }: { word: Word; onnext: () => void } = $props();

  // Zeitplan in ms: Buchstaben im Takt, dann Ton für Ton (fallen, kurz liegen, verschmelzen), dann umdrehen.
  const LETTER = 55;
  const TYPE = 320;
  const DROP = 440;
  const HOLD = 460; // rot liegen lassen, damit man den Ton bemerkt
  const GAP = 170;
  const MERGE = 240;

  type Placed = Glyph & { i: number; drop: number | null; lift: boolean };
  const plan = $derived.by(() => {
    const parts = glyphs(word.vn);
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
  });

  let flipped = $state(false);

  onMount(() => {
    play(word.id).catch(() => {});
    if (reducedMotion()) {
      flipped = true;
      return;
    }
    const t = setTimeout(() => (flipped = true), plan.end + 900);
    return () => clearTimeout(t);
  });
</script>

<p class="kicker">{word.kind === 'particle' ? 'Neue Partikel' : 'Neues Wort'}</p>
<div class="flip" class:flipped>
  <div class="face front" inert={flipped}>
    <h1 lang="vi" class="word">
      {#each plan.syllables as syllable, s (s)}
        {#if s > 0}{' '}{/if}<span class="syl"
          >{#each syllable as g (g.i)}{#if g.drop === null}<span class="ch" style:--i={g.i}>{g.full}</span
              >{:else}<span
                class="ch toned"
                style:--i={g.i}
                style:--drop="{g.drop}ms"
                style:--merge="{g.drop + DROP + HOLD}ms"
                data-bare={g.bare === 'i' ? 'ı' : g.bare}
                ><span class="real">{g.full}</span><svg
                  class="tone {g.tone}"
                  class:lift={g.lift}
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  >{#if g.tone === 'sac'}<rect x="7.8" y="1.5" width="4.4" height="17" rx="2.2" transform="rotate(38 10 10)" />{:else if g.tone === 'huyen'}<rect
                      x="7.8"
                      y="1.5"
                      width="4.4"
                      height="17"
                      rx="2.2"
                      transform="rotate(-38 10 10)"
                    />{:else if g.tone === 'hoi'}<path
                      d="M5.2 7.4a4.8 4.8 0 1 1 7.6 3.9c-1.1.8-1.4 1.3-1.4 2.4v1.6H8.1v-1.9c0-2 .8-3.1 2.3-4.2a1.6 1.6 0 1 0-2.6-1.6z"
                    />{:else if g.tone === 'nga'}<path
                      d="M1.6 12.2c1.8-4 4.4-5.4 7.3-3.4l1.7 1.2c1.3.9 2.4.6 3.4-1.1l.7-1.2 3.2 1.6-.8 1.3c-2 3.8-4.6 4.7-7.4 2.8L8 10.2c-1.3-.9-2.4-.6-3.4 1.2l-.6 1.1z"
                    />{:else}<circle cx="10" cy="10" r="5" />{/if}</svg
                ></span
              >{/if}{/each}</span
        >
      {/each}
    </h1>
    {#if word.pron}<p class="pron">[{word.pron}]</p>{/if}
    <SpeakButton id={word.id} />
  </div>
  <div class="face back" inert={!flipped}>
    <p class="small" lang="vi">{word.vn}</p>
    <p class="de" class:long={word.de.length > 22}>{word.de}</p>
    <SpeakButton id={word.id} />
  </div>
  <button class="turn" onclick={() => (flipped = !flipped)} aria-label={flipped ? 'Vietnamesisch zeigen' : 'Übersetzung zeigen'}>
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
      ><path d="M12 4V1L7.5 5.5 12 10V7a5 5 0 1 1-5 5H4a8 8 0 1 0 8-8Z" fill="currentColor" /></svg
    >
  </button>
</div>
<div class="next">
  <Button onclick={onnext}>Weiter</Button>
</div>

<style>
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  /* Karte mit zwei Seiten im selben Rasterfeld: so hoch wie die höhere Seite. */
  .flip {
    position: relative;
    display: grid;
    perspective: 1400px;
  }
  .face {
    grid-area: 1 / 1;
    border-radius: var(--radius-lg);
    padding: 34px 22px 28px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 8px;
    text-align: center;
    box-shadow: var(--shadow-card);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
    transition: transform 760ms var(--ease-spring);
  }
  .front {
    background: var(--tone-yellow);
  }
  .back {
    background: var(--surface);
    transform: rotateY(180deg);
  }
  /* Auf der weißen Rückseite trägt der Anhören-Knopf dieselbe Tönung wie der Dreh-Knopf. */
  .back :global(.speak) {
    background: color-mix(in srgb, var(--ink) 9%, transparent);
  }
  .flipped .front {
    transform: rotateY(-180deg);
  }
  .flipped .back {
    transform: rotateY(0deg);
  }
  .turn {
    position: absolute;
    top: 10px;
    right: 10px;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: color-mix(in srgb, var(--ink) 9%, transparent);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  h1 {
    font-size: 52px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
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
  .tone {
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
  .tone.lift {
    top: -0.3em;
    margin-left: -0.04em;
  }
  .tone.nang {
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
  @keyframes tone-drop {
    from {
      opacity: 0;
      transform: translateY(-1.1em) scale(1.5) rotate(-20deg);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
  @keyframes tone-out {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
      transform: scale(0.6);
    }
  }
  .pron {
    color: var(--ink-muted);
    font-weight: 600;
  }
  .small {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: -0.01em;
  }
  .de {
    font-size: 36px;
    font-weight: 800;
    line-height: 1.15;
  }
  .de.long {
    font-size: 20px;
    font-weight: 600;
    line-height: 1.35;
  }
  .next {
    margin-top: auto;
  }
  @media (prefers-reduced-motion: reduce) {
    .ch,
    .toned .real,
    .toned::before,
    .tone {
      animation: none;
    }
    .toned .real {
      opacity: 1;
    }
    .toned::before,
    .tone {
      display: none;
    }
    .face {
      transition: none;
    }
  }
</style>
