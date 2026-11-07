<script lang="ts">
  import { content } from '../../content';
  import type { Sentence } from '../../content/types';
  import { play } from '../audio/player';
  import { REGION_TONE } from '../illustrations/RegionHero.svelte';
  import { glossSentence, glossText, type GlossPart } from '../logic/gloss';
  import { ripple } from '../ripple';
  import SpeakButton from '../../screens/play/SpeakButton.svelte';
  import { pushLookup } from './lookup.svelte';

  /**
   * Satzlupe: der Satz oben in der Farbe seiner Region, darunter Wort für Wort als Kacheln mit Erklärung.
   * Anreden zeigen, was sie in diesem Gespräch bedeuten („ich“/„du“). Antippen einer Kachel: Wort hören, Wortkarte.
   */
  let { sentence }: { sentence: Sentence } = $props();

  const stage = $derived(content.stages.find((s) => s.id === sentence.stage));
  const region = $derived(content.regions.find((r) => r.id === stage?.region));
  const tone = $derived(region ? REGION_TONE[region.id] : 'paper');
  const ctx = $derived(sentence.ctx ? content.contexts.find((c) => c.id === sentence.ctx) : undefined);
  const parts = $derived(glossSentence(sentence));

  function open(p: GlossPart) {
    if (!p.word) return;
    play(p.word.id).catch(() => {});
    pushLookup({ kind: 'word', id: p.word.id, from: sentence.id });
  }
</script>

<div class="band {tone}">
  <p class="kicker">Satz{stage ? ` · Etappe ${Number(stage.id.slice(1))}` : ''}{region ? ` · ${region.name}` : ''}</p>
  <h2 id="lookup-title" tabindex="-1" class="vn" lang="vi">{sentence.vn}</h2>
  <p class="de">{sentence.de}</p>
  {#if ctx}<p class="ctx">Gespräch: {ctx.label}</p>{/if}
  <SpeakButton id={sentence.id} label="Satz anhören" />
</div>

<section class="words" aria-labelledby="wfw">
  <h3 id="wfw">Wort für Wort</h3>
  <ul class="tiles">
    {#each parts as p, i (i)}
      <li style:--i={i}>
        {#if p.word}
          <button class="tile" class:role={p.role} onclick={() => open(p)} use:ripple>
            <span class="tv" lang="vi">{p.text}</span>
            <span class="tg">{glossText(p)}</span>
          </button>
        {:else}
          <span class="tile unknown"><span class="tv" lang="vi">{p.text}</span><span class="tg">noch nicht im Wortschatz</span></span>
        {/if}
      </li>
    {/each}
  </ul>
  <p class="hint">Tippe ein Wort an: du hörst es und siehst, was dahintersteckt.</p>
</section>

<style>
  .band {
    display: grid;
    justify-items: start;
    gap: 6px;
    padding: 22px 22px 20px;
    border-radius: var(--radius-lg) var(--radius-lg) 24px 24px;
    color: var(--ink);
  }
  .kicker {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-muted);
    padding-right: 104px; /* Platz für Zurück und Schließen */
  }
  .vn:focus {
    outline: none;
  }
  .vn {
    font-size: 30px;
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.01em;
    text-wrap: balance;
  }
  .de {
    font-size: var(--fs-body);
    font-weight: 600;
  }
  .ctx {
    margin-top: 2px;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    background: var(--glass);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .band :global(.speak) {
    margin-top: 8px;
  }
  .lotus {
    background: var(--lotus);
  }
  .lantern {
    background: var(--lantern);
  }
  .sea {
    background: var(--sea);
  }
  .yellow {
    background: var(--tone-yellow);
  }
  .paper {
    background: var(--paper-2);
  }

  .words {
    display: grid;
    gap: 12px;
    padding: 20px var(--gutter) 0;
  }
  h3 {
    font-size: 20px;
    font-weight: 800;
  }
  .tiles {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  /* Die Wörter fallen nacheinander aus dem Satz in ihre Kacheln. */
  .tiles li {
    animation: tile-in 420ms var(--ease-spring) both;
    animation-delay: calc(120ms + var(--i) * 55ms);
  }
  @keyframes tile-in {
    from {
      opacity: 0;
      transform: translateY(-18px) scale(0.92);
    }
  }
  .tile {
    position: relative;
    display: grid;
    gap: 2px;
    min-height: 64px;
    min-width: var(--tap);
    max-width: 100%;
    padding: 10px 14px 12px;
    border: 0;
    border-radius: 18px;
    background: var(--surface);
    box-shadow: 0 4px 0 var(--paper-2);
    color: var(--ink);
    font: inherit;
    text-align: left;
    overflow: hidden;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .tile:active {
    transform: scale(0.95);
  }
  .tv {
    font-size: 21px;
    font-weight: 800;
    line-height: 1.15;
  }
  .tg {
    max-width: 11em;
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.25;
    color: var(--ink-2);
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* Anrede im Gespräch: „ich“/„du“ kräftig, ein roter Punkt davor markiert die Rolle. */
  .tile.role .tg {
    color: var(--ink);
    font-weight: 800;
  }
  .tile.role .tg::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    margin: 0 6px 1px 0;
    border-radius: 50%;
    background: var(--red);
    vertical-align: middle;
  }
  .tile.unknown {
    background: var(--paper-2);
    box-shadow: none;
    cursor: default;
  }
  .hint {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
</style>
