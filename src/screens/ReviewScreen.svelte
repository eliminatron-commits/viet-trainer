<script lang="ts">
  import { content } from '../content';
  import type { ItemId } from '../content/types';
  import { play } from '../lib/audio/player';
  import Button from '../lib/components/Button.svelte';
  import { game, setReview } from '../lib/game.svelte';
  import {
    buildReviewExport,
    reviewEntries,
    reviewFileName,
    reviewProgress,
    visibleEntries,
    type ReviewFilter,
  } from '../lib/logic/review';
  import type { ReviewVerdict } from '../lib/storage/state';

  let { onback }: { onback: () => void } = $props();

  const entries = reviewEntries(content);

  let filter = $state<ReviewFilter>('open');
  /** Beurteilte Einträge bleiben im Filter „offen“ stehen, bis der Filter wechselt oder der Prüfmodus neu geöffnet wird. */
  let touched = $state<ReadonlySet<ItemId>>(new Set());
  let message = $state('');

  const review = $derived(game.save.review);
  const progress = $derived(reviewProgress(entries, review));
  const visible = $derived(visibleEntries(entries, review, filter, touched));

  const setFilter = (next: ReviewFilter) => {
    filter = next;
    touched = new Set();
  };

  function judge(id: ItemId, verdict: ReviewVerdict['verdict']) {
    touched = new Set(touched).add(id);
    // Erneutes Tippen auf dasselbe Urteil nimmt es zurück.
    if (review[id]?.verdict === verdict) setReview(id, null);
    else setReview(id, { verdict, note: '' });
  }

  const setNote = (id: ItemId, note: string) => setReview(id, { verdict: 'unnatural', note });

  async function doExport() {
    const now = new Date();
    const json = JSON.stringify(buildReviewExport(entries, review, now), null, 2);
    const name = reviewFileName(now);
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        message = 'Prüfung geteilt.';
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    message = 'Prüfung gespeichert.';
  }
</script>

<main class="review">
  <button class="back" onclick={onback} aria-label="Zurück">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
  </button>
  <h1>Prüfmodus</h1>
  <p class="intro">Für die Muttersprachlerin: Hör dir jeden Eintrag an und sag, ob er so natürlich klingt. Bei „unnatürlich“ gern eine Notiz dazu.</p>

  <section class="group">
    <p class="progress" data-done={progress.done} data-total={progress.total}>{progress.done} von {progress.total} beurteilt</p>
    <div class="meter" role="progressbar" aria-label="Beurteilt" aria-valuemin="0" aria-valuemax={progress.total} aria-valuenow={progress.done}>
      <div class="fill" style:width="{progress.total ? (progress.done / progress.total) * 100 : 0}%"></div>
    </div>
    <div class="segments" role="group" aria-label="Filter">
      <button aria-pressed={filter === 'open'} class:on={filter === 'open'} onclick={() => setFilter('open')}>Offen</button>
      <button aria-pressed={filter === 'all'} class:on={filter === 'all'} onclick={() => setFilter('all')}>Alle</button>
    </div>
    <Button variant="secondary" disabled={progress.done === 0} onclick={doExport}>Beurteilungen exportieren (JSON)</Button>
    {#if message}<p class="message" role="status">{message}</p>{/if}
  </section>

  {#if visible.length === 0}
    <p class="empty">Alles beurteilt. Danke!</p>
  {:else}
    <ul class="list">
      {#each visible as e (e.id)}
        {@const r = review[e.id]}
        <li class="item" data-id={e.id} data-verdict={r?.verdict ?? ''}>
          <div class="head">
            <button class="icon" aria-label="Anhören" onclick={() => play(e.id).catch(() => {})}>
              <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
                <path d="M4 9h4l5-4v14l-5-4H4zM15.5 8.5a5 5 0 0 1 0 7l-1.4-1.4a3 3 0 0 0 0-4.2zM18 6a8.5 8.5 0 0 1 0 12l-1.4-1.4a6.5 6.5 0 0 0 0-9.2z" fill="currentColor" />
              </svg>
            </button>
            <div class="text">
              <p class="vn" lang="vi">{e.vn}</p>
              {#if e.pron}<p class="pron">[{e.pron}]</p>{/if}
              <p class="de">{e.de}</p>
            </div>
          </div>
          <div class="verdicts">
            <button class="ok" aria-pressed={r?.verdict === 'ok'} onclick={() => judge(e.id, 'ok')}>Passt</button>
            <button class="bad" aria-pressed={r?.verdict === 'unnatural'} onclick={() => judge(e.id, 'unnatural')}>Unnatürlich</button>
          </div>
          {#if r?.verdict === 'unnatural'}
            <textarea
              aria-label="Notiz"
              placeholder="Was klingt komisch? Wie sagt man es?"
              rows="2"
              value={r.note}
              oninput={(ev) => setNote(e.id, ev.currentTarget.value)}
            ></textarea>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  .review {
    min-height: 100dvh;
    padding: calc(var(--safe-top) + 12px) var(--gutter) calc(var(--safe-bottom) + 40px);
    display: grid;
    align-content: start;
    gap: 18px;
  }
  .back {
    width: var(--tap);
    height: var(--tap);
    margin-left: -10px;
    border: 0;
    background: transparent;
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
  }
  .intro,
  .empty {
    color: var(--ink-2);
  }
  .empty {
    padding: 24px 8px;
    text-align: center;
  }
  .group {
    background: var(--surface);
    border-radius: var(--radius-card);
    padding: 20px;
    display: grid;
    gap: 14px;
    box-shadow: var(--shadow-card);
  }
  .progress {
    font-weight: 800;
    font-size: 20px;
  }
  .meter {
    height: 12px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--red);
  }
  .message {
    font-weight: 600;
  }

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

  .list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    gap: 12px;
  }
  .item {
    content-visibility: auto;
    contain-intrinsic-size: auto 190px;
    display: grid;
    gap: 12px;
    padding: 14px 16px 16px 10px;
    border-radius: 24px;
    background: var(--surface);
    box-shadow: 0 4px 0 var(--paper-2);
  }
  .head {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px;
    align-items: start;
  }
  .text {
    min-width: 0;
    padding-top: 4px;
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
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .icon:active {
    transform: scale(0.9);
  }

  .verdicts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    margin-left: 6px;
  }
  .verdicts button {
    min-height: 48px;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--paper-2);
    color: var(--ink);
    font-weight: 600;
    font-size: 16px;
    cursor: pointer;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .verdicts button:active {
    transform: scale(0.96);
  }
  .verdicts .ok[aria-pressed='true'] {
    background: var(--ok-soft);
    color: var(--ok);
    box-shadow: inset 0 0 0 2px var(--ok);
  }
  .verdicts .bad[aria-pressed='true'] {
    background: var(--bad-soft);
    color: var(--bad-ink);
    box-shadow: inset 0 0 0 2px var(--red);
  }
  textarea {
    margin-left: 6px;
    min-height: 72px;
    padding: 12px 14px;
    border: 0;
    border-radius: 16px;
    background: var(--paper-2);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-body);
    resize: none;
  }
  textarea::placeholder {
    color: var(--ink-2);
  }
</style>
