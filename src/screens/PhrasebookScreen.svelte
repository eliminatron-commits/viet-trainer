<script lang="ts" module>
  import type { SituationTag } from '../content/types';
  /** Zuletzt geöffnete Situation samt Scrollstand: dorthin schrumpft sie beim Zurückgehen (überlebt das Neu-Einhängen). */
  let returnTo: { tag: SituationTag; scroll: number } | null = null;
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import { content } from '../content';
  import type { ItemId } from '../content/types';
  import EntryList from '../lib/components/EntryList.svelte';
  import SearchField from '../lib/components/SearchField.svelte';
  import { game } from '../lib/game.svelte';
  import PlaceScene from '../lib/illustrations/PlaceScene.svelte';
  import { buildEntries, filterEntries, groupBySituation } from '../lib/logic/phrasebook';
  import { PLACE_TONE } from '../lib/logic/places';
  import { arrivingByTab } from '../lib/motion';
  import { ripple } from '../lib/ripple';

  /**
   * Sprachführer: oben Suche und Alle/Favoriten; ohne Suche die Situationen als Orte – jede Kachel zeigt ihren
   * lebenden Ort und wächst beim Antippen zur Situation (morph-open, `stage-card`).
   */
  let { onopen }: { onopen: (tag: SituationTag) => void } = $props();

  const entries = buildEntries(content);
  const groups = groupBySituation(entries);
  const PAGE = 60;

  let query = $state('');
  let mode = $state<'all' | 'favorites'>('all');
  let limit = $state(PAGE);

  const favs = $derived(new Set<ItemId>(game.save.favorites));
  /** Ohne Suche und Favoritenfilter: die Orte. */
  const overview = $derived(mode === 'all' && !query.trim());
  const results = $derived(overview ? [] : filterEntries(entries, { query, only: mode === 'favorites' ? favs : null }));

  const setQuery = (value: string) => {
    query = value;
    limit = PAGE;
  };
  const setMode = (next: 'all' | 'favorites') => {
    mode = next;
    limit = PAGE;
  };

  // Genau ein Element heißt `stage-card`: die Kachel der Situation, die geöffnet wird bzw. wurde.
  let opening = $state<SituationTag | null>(returnTo?.tag ?? null);
  function open(tag: SituationTag) {
    opening = tag;
    returnTo = { tag, scroll: scrollY };
    onopen(tag);
  }

  // Zurück aus der Situation: Scrollstand wiederherstellen, bevor der neue Schnappschuss entsteht,
  // damit die Situation in ihre Kachel zurückschrumpft.
  const motionOnArrival = document.documentElement.dataset.vt ?? '';
  onMount(() => {
    if (motionOnArrival === 'morph-close' && returnTo) scrollTo(0, returnTo.scroll);
  });
</script>

<main class="book" class:arrive={arrivingByTab()}>
  <header>
    <h1>Sprachführer</h1>
    <SearchField value={query} oninput={setQuery} />
    <div class="segments" role="group" aria-label="Anzeige">
      <button aria-pressed={mode === 'all'} class:on={mode === 'all'} onclick={() => setMode('all')}>Alle</button>
      <button aria-pressed={mode === 'favorites'} class:on={mode === 'favorites'} onclick={() => setMode('favorites')}>Favoriten</button>
    </div>
  </header>

  <section aria-label={overview ? 'Situationen' : 'Einträge'}>
    {#if overview}
      <div class="places">
        {#each groups as g (g.tag)}
          <button
            class="place {PLACE_TONE[g.tag]}"
            data-situation={g.tag}
            style:view-transition-name={opening === g.tag ? 'stage-card' : undefined}
            onclick={() => open(g.tag)}
            use:ripple
          >
            <span class="scene" aria-hidden="true"><PlaceScene tag={g.tag} /></span>
            <span class="body">
              <span class="name" style:view-transition-name={opening === g.tag ? 'stage-title' : undefined}>{g.label}</span>
              <span class="sub">{g.entries.length} Einträge</span>
            </span>
          </button>
        {/each}
      </div>
    {:else}
      <EntryList
        {results}
        {limit}
        onmore={() => (limit += PAGE)}
        empty={mode === 'favorites' && !query.trim() ? 'Noch keine Favoriten. Tippe bei einem Eintrag auf den Stern.' : 'Nichts gefunden.'}
      />
    {/if}
  </section>
</main>

<style>
  .book {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    gap: 18px;
    align-content: start;
  }
  header {
    display: grid;
    gap: 14px;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
  }

  /* Alle / Favoriten: die gelbe Pille markiert die Wahl (wie Einstellungen → Darstellung). */
  .segments {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius-pill);
    background: var(--paper-2);
  }
  .segments button {
    min-height: var(--tap);
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--ink);
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .segments button:active {
    transform: scale(0.96);
  }
  .segments button.on {
    background: var(--yellow);
    color: var(--on-yellow);
  }

  section {
    display: grid;
    gap: 14px;
    align-content: start;
  }

  /* Orte: Szene randlos oben in der Kachel (wie die Regionskarten im Lernpfad), darunter Name und Anzahl. */
  .places {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .place {
    display: grid;
    grid-template-rows: auto 1fr;
    padding: 0;
    border: 0;
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
    overflow: hidden;
    position: relative;
    color: var(--ink);
    text-align: left;
    font: inherit;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .place:active {
    transform: scale(0.97);
  }
  .scene {
    display: block;
    aspect-ratio: 400 / 260;
  }
  .body {
    display: grid;
    align-content: start;
    gap: 2px;
    padding: 10px 14px 16px;
  }
  .name {
    font-size: 20px;
    font-weight: 800;
    line-height: 1.15;
    text-wrap: balance;
  }
  .sub {
    font-weight: 600;
    color: var(--ink); /* --ink-muted erreicht auf Meer und nachts nicht überall AA */
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
</style>
