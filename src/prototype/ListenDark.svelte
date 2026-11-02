<script lang="ts">
  import { onMount } from 'svelte';
  import { content } from '../content';
  import type { Stage } from '../content/types';
  import Button from '../lib/components/Button.svelte';
  import GlowOrb from '../lib/components/GlowOrb.svelte';
  import { play, stop } from '../lib/audio/player';

  let { stage, onfinish }: { stage: Stage; onfinish: () => void } = $props();

  // Prototyp: Hören → Deutsch mit einem Satz der Etappe
  const pool = $derived(content.sentences.filter((s) => s.stage === stage.id));
  const target = $derived(pool[0] ?? content.sentences[0]!);
  const options = $derived(
    [target, ...content.sentences.filter((s) => s.id !== target.id && s.stage === target.stage).slice(1, 4)].sort(
      (a, b) => a.de.length - b.de.length,
    ),
  );

  let picked = $state<string | null>(null);
  let playing = $state(false);

  async function listen() {
    playing = true;
    try {
      await play(target.id);
    } finally {
      playing = false;
    }
  }

  function answerState(id: string) {
    if (!picked) return 'idle';
    if (id === target.id) return 'right';
    return id === picked ? 'wrong' : 'dim';
  }

  onMount(() => {
    // Hörwelt: dunkles Thema inkl. Statusleisten-Farbe
    const meta = document.querySelector('meta[name="theme-color"]');
    document.body.dataset.theme = 'dark';
    meta?.setAttribute('content', '#120B0A');
    void listen(); // Hör-Aufgaben starten automatisch
    return () => {
      stop();
      delete document.body.dataset.theme;
      meta?.setAttribute('content', '#FBF5EC');
    };
  });
</script>

<main class="listen">
  <p class="kicker">Hör genau hin</p>
  <button class="orb" onclick={listen} aria-label="Noch einmal anhören">
    <GlowOrb size={230} />
  </button>
  <p class="status" aria-live="polite">{playing ? 'spielt …' : 'Tippe die Kugel zum Wiederholen'}</p>

  {#if picked}
    <p class="reveal" lang="vi">{target.vn}</p>
  {/if}

  <div class="answers">
    {#each options as o (o.id)}
      <Button variant="glow" state={answerState(o.id)} disabled={picked !== null} onclick={() => (picked = o.id)}>{o.de}</Button>
    {/each}
  </div>

  {#if picked}
    <Button onclick={onfinish}>Fertig</Button>
  {/if}
</main>

<style>
  .listen {
    min-height: 100dvh;
    padding: calc(var(--safe-top) + 24px) var(--gutter) calc(var(--safe-bottom) + 24px);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    background: radial-gradient(120% 60% at 50% 28%, var(--night-2) 0%, var(--night) 70%);
    color: var(--night-ink);
  }
  .kicker {
    font-size: var(--fs-h1);
    font-weight: 800;
    letter-spacing: -0.02em;
  }
  .orb {
    border: 0;
    padding: 0;
    margin: 18px 0 6px;
    background: transparent;
    border-radius: 50%;
    cursor: pointer;
  }
  .status {
    color: var(--night-ink-2);
    font-size: var(--fs-small);
    min-height: 1.4em;
  }
  .reveal {
    font-size: 26px;
    font-weight: 800;
    text-align: center;
    color: var(--glow-core);
  }
  .answers {
    width: 100%;
    display: grid;
    gap: 12px;
    margin-top: auto;
  }
</style>
