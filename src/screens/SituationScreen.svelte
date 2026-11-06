<script lang="ts">
  import { content } from '../content';
  import { SITUATION_TAGS, type SituationTag } from '../content/types';
  import EntryList from '../lib/components/EntryList.svelte';
  import SearchField from '../lib/components/SearchField.svelte';
  import PlaceScene from '../lib/illustrations/PlaceScene.svelte';
  import { buildEntries, filterEntries } from '../lib/logic/phrasebook';
  import { PLACE_TONE } from '../lib/logic/places';

  /**
   * Situation des Sprachführers als Vollbild: die Kachel ist zum Fenster gewachsen (morph-open, `stage-card`),
   * oben baut sich der Ort auf, darunter Titel, Suche in der Situation und die Einträge.
   */
  let { tag, onback }: { tag: SituationTag; onback: () => void } = $props();

  const PAGE = 60;
  const all = buildEntries(content);
  const name = $derived(SITUATION_TAGS[tag]);

  let query = $state('');
  let limit = $state(PAGE);
  const results = $derived(filterEntries(all, { query, situation: tag }));
</script>

<section class="detail" data-tone={PLACE_TONE[tag]} style:view-transition-name="stage-card">
  <div class="band"><PlaceScene {tag} /></div>
  <button class="back" onclick={onback} aria-label="Zurück">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
  </button>

  <p class="kicker">Sprachführer · Situation</p>
  <h1 style:view-transition-name="stage-title">{name}</h1>

  <SearchField
    value={query}
    label="In {name} suchen"
    placeholder="In {name} suchen"
    oninput={(v) => {
      query = v;
      limit = PAGE;
    }}
  />
  <div class="entries">
    <EntryList {results} {limit} onmore={() => (limit += PAGE)} empty="Nichts gefunden." />
  </div>
</section>

<style>
  /* Fläche je Ort (wie die Kachel), Einträge als weiße Karten darauf. */
  .detail {
    --bg: var(--lantern);
    --band: calc(var(--safe-top) + clamp(150px, 27vh, 250px));
    /* Text auf der Kartenfläche in voller Schriftfarbe: --ink-muted erreicht dort nicht überall AA */
    --list-ink: var(--ink);
    --item-edge: transparent;
    position: relative;
    min-height: 100dvh;
    background: var(--bg);
    padding: 0 var(--gutter) calc(var(--safe-bottom) + 32px);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .detail[data-tone='sea'] {
    --bg: var(--sea);
  }
  .detail[data-tone='lotus'] {
    --bg: var(--lotus);
  }
  .detail[data-tone='yellow'] {
    --bg: var(--tone-yellow);
  }
  .band {
    height: var(--band);
    margin: 0 calc(-1 * var(--gutter)) 4px;
  }
  .back {
    position: absolute;
    top: calc(var(--safe-top) + 8px);
    left: calc(var(--gutter) - 6px);
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--glass);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    box-shadow: var(--shadow-card);
  }
  .kicker {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink);
    margin-bottom: -8px;
  }
  h1 {
    font-size: var(--fs-hero);
    font-weight: 800;
    line-height: 1.05;
    letter-spacing: -0.02em;
  }
  .entries {
    display: grid;
    gap: 14px;
  }
</style>
