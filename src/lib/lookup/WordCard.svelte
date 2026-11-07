<script lang="ts">
  import { content } from '../../content';
  import type { Sentence, Word } from '../../content/types';
  import { play } from '../audio/player';
  import Button from '../components/Button.svelte';
  import LivingWord from '../components/LivingWord.svelte';
  import ToneMark from '../components/ToneMark.svelte';
  import { game, toggleFavorite, today } from '../game.svelte';
  import { REGION_TONE } from '../illustrations/RegionHero.svelte';
  import { plantInfo, plantOf } from '../logic/field';
  import { glossSentence, roleNote, sentencesWith, syllableTones, TONE_LABEL } from '../logic/gloss';
  import { ripple } from '../ripple';
  import SpeakButton from '../../screens/play/SpeakButton.svelte';
  import { pushLookup } from './lookup.svelte';
  import RicePlant from './RicePlant.svelte';

  /**
   * Wortkarte: das Wort lebt auf (Tonzeichen fallen auf ihre Vokale), Aussprache und Bedeutung, im Satz die Rolle
   * („ich“/„du“ in diesem Gespräch), jeder Ton einzeln, der eigene Lernstand als Reispflanze und weitere Sätze damit.
   */
  let { word, from }: { word: Word; from?: Sentence } = $props();

  const day = today();
  const stage = $derived(content.stages.find((s) => s.id === word.stage));
  const region = $derived(content.regions.find((r) => r.id === stage?.region));
  const tone = $derived(region ? REGION_TONE[region.id] : 'paper');
  const note = $derived.by(() => {
    if (!from) return null;
    const part = glossSentence(from).find((p) => p.word?.id === word.id);
    return part ? roleNote(from, part) : null;
  });
  const tones = $derived(syllableTones(word.vn));
  const progress = $derived(game.save.items[word.id]);
  const plant = $derived(progress ? plantOf(progress, day) : null);
  const state = $derived(
    progress ? plantInfo(word.id, progress, day).state : `noch nicht gelernt${stage ? ` · kommt in Etappe ${Number(stage.id.slice(1))}: ${stage.title}` : ''}`,
  );
  const others = $derived(sentencesWith(word.id, content, from?.id));
  const fav = $derived(game.save.favorites.includes(word.id));

  function openSentence(s: Sentence) {
    play(s.id).catch(() => {});
    pushLookup({ kind: 'sentence', id: s.id });
  }
</script>

<div class="band {tone}">
  <p class="kicker">{word.kind === 'particle' ? 'Partikel' : 'Wort'}{stage ? ` · Etappe ${Number(stage.id.slice(1))}` : ''}{region ? ` · ${region.name}` : ''}</p>
  <h2 id="lookup-title" tabindex="-1" class="vn" lang="vi" aria-label={word.vn}><LivingWord vn={word.vn} /></h2>
  {#if word.pron}<p class="pron">[{word.pron}]</p>{/if}
  <p class="de" class:long={word.de.length > 24}>{word.de}</p>
  {#if note}<p class="role">{note}</p>{/if}
  <SpeakButton id={word.id} label="Wort anhören" />
</div>

<div class="body">
  <section aria-labelledby="toene">
    <h3 id="toene">{tones.length > 1 ? 'Töne' : 'Ton'}</h3>
    <ul class="tones">
      {#each tones as t, i (i)}
        <li style:--i={i}>
          <span class="mark" aria-hidden="true"><span class="glyph">{t.vowel}<ToneMark tone={t.tone} class="tm {t.tone}{t.lift ? ' lift' : ''}" /></span></span>
          <span class="syl" lang="vi">{t.text}</span>
          <span class="tn"><strong lang="vi">{TONE_LABEL[t.tone].name}</strong> · {TONE_LABEL[t.tone].mark}</span>
        </li>
      {/each}
    </ul>
  </section>

  <section aria-labelledby="stand">
    <h3 id="stand">Dein Stand</h3>
    <div class="stand">
      <RicePlant stage={plant?.stage ?? 0} thirsty={plant?.thirsty ?? false} size={64} />
      <p>{state.charAt(0).toUpperCase() + state.slice(1)}</p>
    </div>
  </section>

  {#if others.length}
    <section aria-labelledby="saetze">
      <h3 id="saetze">{from ? 'Auch in diesen Sätzen' : 'In diesen Sätzen'}</h3>
      <ul class="others">
        {#each others as s (s.id)}
          <li>
            <button class="other" onclick={() => openSentence(s)} use:ripple>
              <span class="ov" lang="vi">{s.vn}</span>
              <span class="od">{s.de}</span>
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/if}

  <Button variant="secondary" onclick={() => toggleFavorite(word.id)}>{fav ? 'Gemerkt' : 'Merken'}</Button>
</div>

<style>
  .band {
    display: grid;
    justify-items: start;
    gap: 4px;
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
    margin-top: 8px;
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .pron {
    font-weight: 600;
    color: var(--ink-muted);
  }
  .de {
    font-size: var(--fs-h2);
    font-weight: 800;
    line-height: 1.2;
  }
  .de.long {
    font-size: 19px;
    font-weight: 700;
    line-height: 1.35;
  }
  .role {
    margin-top: 4px;
    padding: 6px 12px;
    border-radius: var(--radius-pill);
    background: var(--glass);
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .band :global(.speak) {
    margin-top: 10px;
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

  .body {
    display: grid;
    gap: 22px;
    padding: 20px var(--gutter) 0;
  }
  /* Abschnitte steigen nacheinander nach */
  .body > :global(*) {
    animation: rise 380ms var(--ease-out) both;
  }
  .body > :global(:nth-child(2)) {
    animation-delay: 70ms;
  }
  .body > :global(:nth-child(3)) {
    animation-delay: 140ms;
  }
  .body > :global(:nth-child(4)) {
    animation-delay: 210ms;
  }
  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(14px);
    }
  }
  section {
    display: grid;
    gap: 10px;
  }
  h3 {
    font-size: 20px;
    font-weight: 800;
  }
  .tones,
  .others {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 8px;
  }
  .tones li {
    display: grid;
    grid-template-columns: 52px auto 1fr;
    align-items: center;
    gap: 12px;
  }
  /* Der Vokal, der den Ton trägt, mit seinem Zeichen in Rot (wie beim lebendigen Wort) */
  .mark {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    background: var(--surface);
    display: grid;
    place-items: center;
  }
  /* etwas tiefer gesetzt: über dem Vokal bleibt Platz für das Tonzeichen */
  .glyph {
    position: relative;
    top: 0.14em;
    font-size: 26px;
    font-weight: 800;
    line-height: 1;
  }
  .glyph :global(.tm) {
    position: absolute;
    left: 50%;
    top: -0.2em;
    width: 0.42em;
    height: 0.42em;
    margin-left: -0.21em;
    fill: var(--red);
  }
  .glyph :global(.tm.lift) {
    top: -0.4em;
    margin-left: -0.08em;
  }
  .glyph :global(.tm.nang) {
    top: 0.9em;
    width: 0.26em;
    height: 0.26em;
    margin-left: -0.13em;
  }
  .syl {
    font-size: 22px;
    font-weight: 800;
  }
  .tn {
    color: var(--ink-2);
    font-weight: 600;
  }
  .tn strong {
    color: var(--ink);
    font-weight: 800;
  }
  .stand {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: 14px;
    padding: 10px 16px 10px 10px;
    border-radius: 24px;
    background: var(--surface);
  }
  .stand p {
    font-weight: 600;
  }
  .other {
    display: grid;
    gap: 2px;
    width: 100%;
    min-height: var(--tap);
    padding: 12px 16px;
    border: 0;
    border-radius: 20px;
    background: var(--surface);
    box-shadow: 0 4px 0 var(--paper-2);
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .other:active {
    transform: scale(0.98);
  }
  .ov {
    font-size: 18px;
    font-weight: 800;
  }
  .od {
    color: var(--ink-2);
  }
</style>
