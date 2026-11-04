<script lang="ts">
  import { content } from '../content';
  import { SITUATION_TAGS, type ItemId, type SituationTag } from '../content/types';
  import { play } from '../lib/audio/player';
  import Button from '../lib/components/Button.svelte';
  import Card from '../lib/components/Card.svelte';
  import { game, toggleFavorite } from '../lib/game.svelte';
  import { buildEntries, filterEntries, groupBySituation } from '../lib/logic/phrasebook';
  import { arrivingByTab } from '../lib/motion';

  const entries = buildEntries(content);
  const groups = groupBySituation(entries);
  const TONES = ['lotus', 'sea', 'lantern', 'yellow'] as const;
  /** Pro Seite gerenderte Einträge – die Gesamtliste hat rund 800, das hält das Scrollen auf dem iPhone flüssig. */
  const PAGE = 60;

  let query = $state('');
  let mode = $state<'all' | 'favorites'>('all');
  let situation = $state<SituationTag | null>(null);
  let limit = $state(PAGE);

  const favs = $derived(new Set<ItemId>(game.save.favorites));
  /** Ohne Suche, Favoritenfilter und Situation: die Situationskarten. */
  const overview = $derived(mode === 'all' && !situation && !query.trim());
  const results = $derived(
    overview ? [] : filterEntries(entries, { query, situation, only: mode === 'favorites' ? favs : null }),
  );
  const shown = $derived(results.slice(0, limit));

  const setQuery = (value: string) => {
    query = value;
    limit = PAGE;
  };
  const setMode = (next: 'all' | 'favorites') => {
    mode = next;
    situation = null;
    limit = PAGE;
  };
  const openSituation = (tag: SituationTag | null) => {
    situation = tag;
    limit = PAGE;
    scrollTo(0, 0);
  };
</script>

<main class="book" class:arrive={arrivingByTab()}>
  <header>
    <h1>Sprachführer</h1>
    <div class="search">
      <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
        <path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.3 4.3-1.4 1.4-4.3-4.3A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="currentColor" />
      </svg>
      <input
        type="search"
        aria-label="Suchen"
        placeholder="Suchen, auch ohne Akzente"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        enterkeyhint="search"
        value={query}
        oninput={(e) => setQuery(e.currentTarget.value)}
      />
      {#if query}
        <button class="clear" aria-label="Suche löschen" onclick={() => setQuery('')}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
            <path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" />
          </svg>
        </button>
      {/if}
    </div>
    <div class="segments" role="group" aria-label="Anzeige">
      <button aria-pressed={mode === 'all'} class:on={mode === 'all'} onclick={() => setMode('all')}>Alle</button>
      <button aria-pressed={mode === 'favorites'} class:on={mode === 'favorites'} onclick={() => setMode('favorites')}>Favoriten</button>
    </div>
  </header>

  <section aria-label="Einträge">
    {#if overview}
      <div class="cards">
        {#each groups as g, i (g.tag)}
          <Card tone={TONES[i % TONES.length] ?? 'lotus'} onclick={() => openSituation(g.tag)}>
            <strong class="sit">{g.label}</strong>
            <span class="sub">{g.entries.length} Einträge</span>
          </Card>
        {/each}
      </div>
    {:else}
      {#if situation}
        <div class="situation">
          <button class="back" onclick={() => openSituation(null)}>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
            Alle Situationen
          </button>
          <h2>{SITUATION_TAGS[situation]}</h2>
        </div>
      {/if}
      <p class="count" role="status">{results.length} {results.length === 1 ? 'Eintrag' : 'Einträge'}</p>

      {#if results.length === 0}
        <p class="empty">
          {mode === 'favorites' && !query.trim() ? 'Noch keine Favoriten. Tippe bei einem Eintrag auf den Stern.' : 'Nichts gefunden.'}
        </p>
      {:else}
        <ul class="list">
          {#each shown as e (e.id)}
            <li class="item" data-id={e.id}>
              <div class="text">
                <p class="vn" lang="vi">{e.vn}</p>
                {#if e.pron}<p class="pron">[{e.pron}]</p>{/if}
                <p class="de">{e.de}</p>
              </div>
              <div class="actions">
                <button class="icon" aria-label="Anhören" onclick={() => play(e.id).catch(() => {})}>
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                    <path d="M4 9h4l5-4v14l-5-4H4zM15.5 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18 6a8.5 8.5 0 0 1 0 12l-1.4-1.4a6.5 6.5 0 0 0 0-9.2z" fill="currentColor" />
                  </svg>
                </button>
                <button class="icon star" aria-label="Favorit" aria-pressed={favs.has(e.id)} onclick={() => toggleFavorite(e.id)}>
                  <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                    <path
                      d="M12 2.6l2.9 6.2 6.8.8-5 4.7 1.3 6.7L12 17.6l-6 3.4 1.3-6.7-5-4.7 6.8-.8z"
                      fill={favs.has(e.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </li>
          {/each}
        </ul>
        {#if results.length > shown.length}
          <Button variant="secondary" onclick={() => (limit += PAGE)}>Mehr anzeigen ({results.length - shown.length} weitere)</Button>
        {/if}
      {/if}
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
  h2 {
    font-size: var(--fs-h2);
    font-weight: 800;
  }

  .search {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 56px;
    padding: 0 6px 0 18px;
    border-radius: var(--radius-pill);
    background: var(--surface);
    color: var(--ink);
    box-shadow: 0 4px 0 var(--paper-2);
  }
  .search:focus-within {
    outline: 3px solid var(--red);
    outline-offset: 2px;
  }
  .search svg {
    flex: none;
  }
  .search input {
    flex: 1;
    min-width: 0;
    min-height: 52px;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-body);
    appearance: none;
  }
  .search input::placeholder {
    color: var(--ink-2);
  }
  .search input::-webkit-search-cancel-button {
    appearance: none;
    display: none;
  }
  .clear {
    flex: none;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
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
  .cards {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .sit {
    display: block;
    font-size: 20px;
    font-weight: 800;
  }
  .sub {
    display: block;
    margin-top: 2px;
    font-weight: 600;
    color: var(--ink-muted);
  }

  .situation {
    display: grid;
    gap: 6px;
    justify-items: start;
  }
  .back {
    min-height: var(--tap);
    padding: 0 16px 0 10px;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--paper-2);
    color: var(--ink);
    font-weight: 600;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }
  .count {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .empty {
    padding: 24px 8px;
    color: var(--ink-2);
    text-align: center;
  }

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 10px;
  }
  /* Nur sichtbare Einträge werden gelayoutet und gemalt – die Liste bleibt auch mit vielen Einträgen flüssig. */
  .item {
    content-visibility: auto;
    contain-intrinsic-size: auto 96px;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 8px;
    padding: 12px 8px 12px 18px;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: 0 4px 0 var(--paper-2);
  }
  .text {
    min-width: 0;
  }
  .vn {
    font-size: 20px;
    font-weight: 800;
    overflow-wrap: anywhere;
  }
  .pron {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .de {
    margin-top: 2px;
    color: var(--ink-2);
    overflow-wrap: anywhere;
  }
  .actions {
    display: flex;
    gap: 2px;
  }
  .icon {
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
    transition:
      background-color var(--dur) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .icon:active {
    transform: scale(0.9);
  }
  .star[aria-pressed='true'] {
    background: var(--yellow);
    color: var(--on-yellow);
  }
</style>
