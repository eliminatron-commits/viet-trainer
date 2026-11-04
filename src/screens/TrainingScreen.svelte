<script lang="ts">
  import Button from '../lib/components/Button.svelte';
  import { arrivingByTab } from '../lib/motion';
  import Card from '../lib/components/Card.svelte';
  import { game, today } from '../lib/game.svelte';
  import { learnedKeys } from '../lib/logic/session';
  import { isDue } from '../lib/logic/srs';

  let { onstart }: { onstart: (verbsOnly: boolean) => void } = $props();

  let verbsOnly = $state(false);
  const day = today();
  const keys = $derived(learnedKeys(game.save, verbsOnly));
  const due = $derived(keys.filter((k) => isDue(game.save.items[k]!, day)).length);
</script>

<main class="training" class:arrive={arrivingByTab()}>
  <h1>Training</h1>
  <p class="lead">Endlos wiederholen, was du schon kannst – fällige Einheiten zuerst.</p>

  <Card tone="sea">
    <p class="kicker">{verbsOnly ? 'Nur Verben' : 'Alles Gelernte'}</p>
    <p class="big">{keys.length}</p>
    <p>{keys.length === 1 ? 'Einheit' : 'Einheiten'} · davon {due} fällig</p>
  </Card>

  <label class="switch">
    <input type="checkbox" bind:checked={verbsOnly} />
    <span>Nur Verben</span>
  </label>

  <Button disabled={keys.length === 0} onclick={() => onstart(verbsOnly)}>Training starten</Button>
  {#if keys.length === 0}
    <p class="hint">Noch nichts gelernt – spiel zuerst eine Etappe im Lernpfad.</p>
  {/if}
</main>

<style>
  .training {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    gap: 18px;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .lead,
  .hint {
    color: var(--ink-2);
  }
  .kicker {
    font-weight: 600;
    font-size: var(--fs-small);
  }
  .big {
    font-size: var(--fs-hero);
    font-weight: 800;
    line-height: 1.1;
  }
  .switch {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: var(--tap);
    font-weight: 600;
  }
  .switch input {
    width: 24px;
    height: 24px;
    accent-color: var(--red);
  }
</style>
