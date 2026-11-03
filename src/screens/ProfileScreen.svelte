<script lang="ts">
  import Button from '../lib/components/Button.svelte';
  import Card from '../lib/components/Card.svelte';
  import { game, today } from '../lib/game.svelte';
  import { currentStreak, levelInfo } from '../lib/logic/rewards';
  import { learnedKeys } from '../lib/logic/session';
  import Buffalo from '../lib/mascot/Buffalo.svelte';

  let { onsettings }: { onsettings: () => void } = $props();

  const info = $derived(levelInfo(game.save.xp));
  const streak = $derived(currentStreak(game.save, today()));
  const stagesDone = $derived(Object.values(game.save.stages).filter((s) => s?.done).length);
</script>

<main class="profile">
  <div class="hero">
    <Buffalo size={150} tappable />
    <h1>Level {info.level}</h1>
    <div class="meter" role="progressbar" aria-label="Fortschritt bis Level {info.level + 1}" aria-valuemin="0" aria-valuemax={info.span} aria-valuenow={info.into}>
      <div class="fill" style:width="{info.progress * 100}%"></div>
    </div>
    <p class="hint">{info.into} / {info.span} XP bis Level {info.level + 1}</p>
  </div>

  <div class="grid">
    <Card tone="lotus"><strong>{streak}</strong><span>Tage Serie</span></Card>
    <Card tone="lantern"><strong>{game.save.xp}</strong><span>XP gesamt</span></Card>
    <Card tone="sea"><strong>{learnedKeys(game.save).length}</strong><span>gelernt</span></Card>
    <Card tone="yellow"><strong>{stagesDone}</strong><span>Etappen geschafft</span></Card>
  </div>

  <Button variant="secondary" onclick={onsettings}>Einstellungen</Button>
</main>

<style>
  .profile {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    gap: 20px;
  }
  .hero {
    display: grid;
    justify-items: center;
    gap: 8px;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
  }
  .meter {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--red);
  }
  .hint {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .grid strong {
    display: block;
    font-size: 28px;
    font-weight: 800;
  }
  .grid span {
    font-weight: 600;
  }
</style>
