<script lang="ts">
  import Card from '../lib/components/Card.svelte';
  import Gecko from '../lib/mascot/Gecko.svelte';
  import Buffalo from '../lib/mascot/Buffalo.svelte';

  let choice = $state<'gecko' | 'buffalo' | null>(null);
</script>

<main class="pick">
  <p class="kicker">Stil-Prototyp · Entscheidung</p>
  <h1>Wer begleitet dich durch Vietnam?</h1>

  <div class="grid">
    <Card tone={choice === 'gecko' ? 'yellow' : 'paper'} onclick={() => (choice = 'gecko')}>
      <div class="opt">
        <Gecko size={140} />
        <h2 lang="vi">Thạch sùng</h2>
        <p>Der Hausgecko. Klein, flink, sitzt abends an jeder Wand.</p>
      </div>
    </Card>
    <Card tone={choice === 'buffalo' ? 'yellow' : 'paper'} onclick={() => (choice = 'buffalo')}>
      <div class="opt">
        <Buffalo size={140} />
        <h2 lang="vi">Trâu</h2>
        <p>Der Wasserbüffel. Geduldig, stark, Arbeiter der Reisfelder.</p>
      </div>
    </Card>
  </div>

  {#if choice}
    <p class="note">Gewählt: {choice === 'gecko' ? 'Gecko' : 'Wasserbüffel'} – sag Claude Bescheid, dann wird es festgehalten.</p>
  {/if}
</main>

<style>
  .pick {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    gap: 16px;
  }
  .kicker {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  .grid {
    display: grid;
    gap: 14px;
  }
  .opt {
    display: grid;
    justify-items: center;
    text-align: center;
    gap: 6px;
  }
  h2 {
    font-size: var(--fs-h2);
    font-weight: 800;
  }
  .note {
    font-weight: 600;
    text-align: center;
  }
</style>
