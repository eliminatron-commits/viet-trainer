<script lang="ts">
  import { onMount } from 'svelte';
  import type { Word } from '../../content/types';
  import Button from '../../lib/components/Button.svelte';
  import LivingWord, { livingEnd } from '../../lib/components/LivingWord.svelte';
  import { play } from '../../lib/audio/player';
  import { reducedMotion } from '../../lib/motion';
  import SpeakButton from './SpeakButton.svelte';

  /**
   * Lebendige Wörter: Das neue Wort erscheint Buchstabe für Buchstabe, zuerst ohne Tonzeichen. Dann fällt jedes
   * Tonzeichen als kleine rote Fläche auf seinen Vokal und geht in die Schrift über. Danach dreht sich die Karte zur
   * Übersetzung um; der Knopf oben rechts dreht sie zurück. Reduzierte Bewegung: gleich die Rückseite, ohne Animation.
   */
  let { word, onnext }: { word: Word; onnext: () => void } = $props();

  let flipped = $state(false);

  onMount(() => {
    play(word.id).catch(() => {});
    if (reducedMotion()) {
      flipped = true;
      return;
    }
    const t = setTimeout(() => (flipped = true), livingEnd(word.vn) + 900);
    return () => clearTimeout(t);
  });
</script>

<p class="kicker">{word.kind === 'particle' ? 'Neue Partikel' : 'Neues Wort'}</p>
<div class="flip" class:flipped>
  <div class="face front" inert={flipped}>
    <h1 lang="vi" class="word"><LivingWord vn={word.vn} /></h1>
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
    .face {
      transition: none;
    }
  }
</style>
