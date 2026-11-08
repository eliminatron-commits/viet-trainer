<script lang="ts">
  import type { BriefItem, BriefTarget } from '../logic/brief';
  import RicePlant from '../lookup/RicePlant.svelte';
  import { ripple } from '../ripple';
  import ProgressRing from './ProgressRing.svelte';
  import RewardIcon from './RewardIcon.svelte';

  /**
   * Was heute ansteht (Trâus Tagesblick): je Punkt eine große, ganz tippbare Zeile in ihrer Kartenfarbe – Reisfeld
   * (meer), Tagesziel (laterne, Ring mit dem Stand), Wochen-Challenge (lotus, Medaille und Balken). Darunter der
   * Weg als gelbe Pille; Antippen führt direkt hin.
   */
  let { items, onfollow }: { items: BriefItem[]; onfollow: (target: BriefTarget) => void } = $props();
</script>

<ul class="items">
  {#each items as it, n (it.kind)}
    <li style:--n={n}>
      <button class="item {it.kind}" data-kind={it.kind} onclick={() => onfollow(it.target)} use:ripple>
        <span class="icon" aria-hidden="true">
          {#if it.kind === 'water'}
            <RicePlant stage={4} thirsty size={54} />
          {:else if it.kind === 'goal'}
            <ProgressRing value={it.progress ?? 0} size={44} stroke={6} track="var(--surface)" label="" />
          {:else}
            <RewardIcon kind="medal" size={40} />
          {/if}
        </span>
        <span class="text">
          <strong>{it.title}</strong>
          <span class="detail">{it.detail}</span>
          {#if it.kind === 'challenge' && it.progress !== null}
            <span class="bar" aria-hidden="true"><span class="fill" style:width="{it.progress * 100}%"></span></span>
          {/if}
          <span class="go">{it.action}<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8.6 19.4 16 12 8.6 4.6 10 3.2 18.8 12 10 20.8z" fill="currentColor" /></svg></span>
        </span>
      </button>
    </li>
  {/each}
</ul>

<style>
  .items {
    display: grid;
    gap: 10px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .item {
    position: relative;
    overflow: hidden;
    width: 100%;
    display: grid;
    grid-template-columns: 48px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    padding: 12px 14px;
    border: 0;
    border-radius: 22px;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .item:active {
    transform: scale(0.98);
  }
  .water {
    background: var(--sea-soft);
  }
  .goal {
    background: var(--lantern-soft);
  }
  .challenge {
    background: var(--lotus-soft);
  }
  .icon {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
  }
  .text {
    display: grid;
    gap: 3px;
    min-width: 0;
  }
  strong {
    font-weight: 800;
    line-height: 1.25;
  }
  .detail {
    color: var(--ink-muted);
    font-size: var(--fs-small);
    font-weight: 600;
    line-height: 1.3;
  }
  .bar {
    height: 8px;
    margin: 4px 0 2px;
    border-radius: 999px;
    background: var(--surface);
    overflow: hidden;
  }
  .fill {
    display: block;
    height: 100%;
    background: var(--sea);
  }
  .go {
    justify-self: start;
    display: inline-flex;
    align-items: center;
    gap: 2px;
    margin-top: 6px;
    padding: 5px 8px 5px 12px;
    border-radius: var(--radius-pill);
    background: var(--yellow);
    color: var(--on-yellow);
    font-size: var(--fs-small);
    font-weight: 700;
  }
  /* Die Punkte steigen nacheinander herein, sobald das Blatt steht */
  @media (prefers-reduced-motion: no-preference) {
    li {
      animation: item-in 420ms var(--ease-out) calc(360ms + var(--n) * 90ms) both;
    }
  }
  @keyframes item-in {
    from {
      transform: translateY(18px);
      opacity: 0;
    }
  }
</style>
