<script lang="ts">
  import ChestReveal from '../../lib/components/ChestReveal.svelte';
  import { newsText } from '../../lib/components/NewsToast.svelte';
  import RewardIcon from '../../lib/components/RewardIcon.svelte';
  import Button from '../../lib/components/Button.svelte';
  import type { News } from '../../lib/game.svelte';

  /**
   * Belohnungen auf dem Ergebnis einer Runde: die Truhe nach dem ersten Sieg über einen Boss
   * und alles, was in der Runde neu erreicht wurde (Erfolge, Challenges, Streak-Schutz).
   */
  let { chest, news }: { chest: boolean; news: News[] } = $props();

  let revealing = $state(false);
  let opened = $state(false);
</script>

{#if chest}
  <div class="chest-card" class:opened>
    <RewardIcon kind="chest" size={84} open={opened} />
    <div>
      <p class="title">{opened ? 'Truhe geöffnet' : 'Eine Truhe für den Sieg!'}</p>
      {#if !opened}
        <Button onclick={() => (revealing = true)}>Truhe öffnen</Button>
      {:else}
        <p class="small">Was drin war, findest du im Profil.</p>
      {/if}
    </div>
  </div>
{/if}

{#each news as n, i (i)}
  {@const t = newsText(n)}
  <div class="news">
    <RewardIcon kind={n.kind === 'shield' ? 'shield' : 'medal'} size={36} />
    <p><span class="small">{t.kicker}</span><span class="title">{t.title}</span></p>
  </div>
{/each}

{#if revealing}
  <ChestReveal
    onclose={() => {
      revealing = false;
      opened = true;
    }}
  />
{/if}

<style>
  .chest-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: var(--radius-card);
    background: var(--tone-yellow);
    color: var(--ink);
    box-shadow: var(--shadow-card);
  }
  .chest-card.opened {
    background: var(--surface);
  }
  .chest-card > div {
    display: grid;
    gap: 10px;
    flex: 1;
  }
  .news {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--surface);
    border-radius: 20px;
    padding: 12px 16px;
    box-shadow: var(--shadow-card);
  }
  .title {
    display: block;
    font-weight: 800;
  }
  .small {
    display: block;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
</style>
