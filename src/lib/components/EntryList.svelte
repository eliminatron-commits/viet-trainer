<script lang="ts">
  import { play } from '../audio/player';
  import { game, toggleFavorite } from '../game.svelte';
  import type { ItemId } from '../../content/types';
  import type { Entry } from '../logic/phrasebook';
  import Button from './Button.svelte';

  /**
   * Einträge des Sprachführers (Übersicht und Situation): Anzahl, Karten mit Anhören und Stern, „Mehr anzeigen“.
   * Gerendert werden nur die ersten `limit` – die Gesamtliste hat rund 800, das hält das Scrollen flüssig.
   */
  let {
    results,
    limit,
    onmore,
    empty,
  }: { results: Entry[]; limit: number; onmore: () => void; empty: string } = $props();

  const favs = $derived(new Set<ItemId>(game.save.favorites));
  const shown = $derived(results.slice(0, limit));
</script>

<p class="count" role="status">{results.length} {results.length === 1 ? 'Eintrag' : 'Einträge'}</p>

{#if results.length === 0}
  <p class="empty">{empty}</p>
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
    <Button variant="secondary" onclick={onmore}>Mehr anzeigen ({results.length - shown.length} weitere)</Button>
  {/if}
{/if}

<style>
  /* Auf Kartenflächen (Situation) setzt die Ansicht --list-ink auf --ink (Kontrast AA). */
  .count {
    color: var(--list-ink, var(--ink-2));
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .empty {
    padding: 24px 8px;
    color: var(--list-ink, var(--ink-2));
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
    box-shadow: 0 4px 0 var(--item-edge, var(--paper-2));
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
