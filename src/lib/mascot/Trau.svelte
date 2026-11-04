<script lang="ts">
  import { game } from '../game.svelte';
  import { growthOf, levelInfo } from '../logic/rewards';
  import Buffalo, { type Mood } from './Buffalo.svelte';

  /** Trâu, wie er im Spielstand gerade ist: so groß wie das Level, mit den angelegten Accessoires. */
  let { size = 160, mood = 'idle', tappable = false }: { size?: number; mood?: Mood; tappable?: boolean } = $props();
</script>

<Buffalo {size} {mood} {tappable} growth={growthOf(levelInfo(game.save.xp).level)} wear={game.save.inventory.equipped} />
