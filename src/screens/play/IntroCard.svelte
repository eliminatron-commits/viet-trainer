<script lang="ts">
  import { onMount } from 'svelte';
  import type { Word } from '../../content/types';
  import Button from '../../lib/components/Button.svelte';
  import { play } from '../../lib/audio/player';
  import SpeakButton from './SpeakButton.svelte';

  let { word, onnext }: { word: Word; onnext: () => void } = $props();

  onMount(() => {
    play(word.id).catch(() => {});
  });
</script>

<p class="kicker">{word.kind === 'particle' ? 'Neue Partikel' : 'Neues Wort'}</p>
<div class="card">
  <h1 lang="vi">{word.vn}</h1>
  {#if word.pron}<p class="pron">[{word.pron}]</p>{/if}
  <SpeakButton id={word.id} />
  <p class="de">{word.de}</p>
</div>
<div class="next">
  <Button onclick={onnext}>Weiter</Button>
</div>

<style>
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .card {
    background: var(--tone-yellow);
    border-radius: var(--radius-lg);
    padding: 34px 22px 28px;
    display: grid;
    justify-items: center;
    gap: 8px;
    text-align: center;
    box-shadow: var(--shadow-card);
  }
  h1 {
    font-size: 52px;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }
  .pron {
    color: var(--ink-muted);
    font-weight: 600;
  }
  .de {
    margin-top: 10px;
    font-size: var(--fs-h2);
    font-weight: 800;
  }
  .next {
    margin-top: auto;
  }
</style>
