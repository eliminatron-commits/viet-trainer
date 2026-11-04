<script lang="ts" module>
  import type { News } from '../game.svelte';

  /** Text einer Neuigkeit (auch für das Ergebnis einer Session). */
  export function newsText(n: News): { kicker: string; title: string } {
    if (n.kind === 'achievement') return { kicker: 'Neuer Erfolg', title: n.title };
    if (n.kind === 'challenge') return { kicker: `Challenge geschafft · +${n.xp} XP`, title: n.title };
    return {
      kicker: 'Streak-Schutz eingesetzt',
      title: n.days === 1 ? 'Ein verpasster Tag – deine Serie lebt.' : `${n.days} verpasste Tage – deine Serie lebt.`,
    };
  }
</script>

<script lang="ts">
  import { game } from '../game.svelte';
  import RewardIcon from './RewardIcon.svelte';

  /**
   * Meldet Neuigkeiten (Erfolg, Challenge, Streak-Schutz) außerhalb einer Session: eine nach der anderen,
   * oben eingeblendet, nach kurzer Zeit oder auf Tippen weg. In einer Session sammelt das Ergebnis sie ein.
   */
  let { active }: { active: boolean } = $props();

  // Kommen viele auf einmal (z. B. erster Start mit Phase 3), gibt es eine gebündelte Meldung statt einer langen Kette.
  const batch = $derived(active ? game.news.slice(0, game.news.length > 2 ? game.news.length : 1) : []);
  const item = $derived(batch.length === 1 ? batch[0] : undefined);
  const dismiss = () => game.news.splice(0, batch.length);

  $effect(() => {
    if (batch.length === 0) return;
    const t = setTimeout(dismiss, batch.length > 1 ? 5000 : 3600);
    return () => clearTimeout(t);
  });
</script>

<div role="status">
  {#if item}
    {@const t = newsText(item)}
    {#key item}
      <button class="news" onclick={dismiss}>
        <RewardIcon kind={item.kind === 'shield' ? 'shield' : 'medal'} size={40} />
        <span>
          <span class="kicker">{t.kicker}</span>
          <span class="title">{t.title}</span>
        </span>
      </button>
    {/key}
  {:else if batch.length > 1}
    <button class="news" onclick={dismiss}>
      <RewardIcon kind="medal" size={40} />
      <span>
        <span class="kicker">{batch.length} Neuigkeiten</span>
        <span class="title many">{batch.map((n) => newsText(n).title).join(' · ')}</span>
      </span>
    </button>
  {/if}
</div>

<style>
  .news {
    position: fixed;
    top: calc(var(--safe-top) + 10px);
    left: var(--gutter);
    right: var(--gutter);
    z-index: 20;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border: 0;
    border-radius: 24px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    text-align: left;
    box-shadow: var(--shadow-float);
    animation: drop-in 520ms var(--ease-spring);
    cursor: pointer;
  }
  .kicker {
    display: block;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  .title {
    display: block;
    font-weight: 800;
  }
  .many {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  @keyframes drop-in {
    from {
      transform: translateY(-140%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .news {
      animation: none;
    }
  }
</style>
