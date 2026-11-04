<script lang="ts" module>
  export interface Opt {
    id: string;
    text: string;
    /** Vietnamesischer Text (lang="vi"). */
    vi: boolean;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../lib/components/Button.svelte';
  import SpeakButton from './SpeakButton.svelte';
  import { play } from '../../lib/audio/player';

  let {
    kicker,
    prompt,
    promptVi,
    question,
    pron,
    audioId,
    autoplay = false,
    tone = 'lotus',
    options,
    answerId,
    picked,
    onpick,
  }: {
    kicker: string;
    prompt: string;
    promptVi: boolean;
    /** Zusatzfrage unter dem Prompt (Rollen-Quiz). */
    question?: string;
    pron?: string;
    /** Anhören-Knopf (nur wenn das Audio die Lösung nicht verrät). */
    audioId?: string;
    autoplay?: boolean;
    tone?: 'lotus' | 'lantern' | 'sea';
    options: Opt[];
    answerId: string;
    picked: string | null;
    onpick: (id: string) => void;
  } = $props();

  function answerState(id: string) {
    if (!picked) return 'idle';
    if (id === answerId) return 'right';
    return id === picked ? 'wrong' : 'dim';
  }

  onMount(() => {
    if (autoplay && audioId) play(audioId).catch(() => {});
  });
</script>

<p class="kicker">{kicker}</p>
<div class="prompt {tone}">
  <h1 lang={promptVi ? 'vi' : 'de'} class:long={prompt.length > 18} class:longer={prompt.length > 40}>{prompt}</h1>
  {#if pron}<p class="pron">[{pron}]</p>{/if}
  {#if question}<p class="question">{question}</p>{/if}
  {#if audioId}<SpeakButton id={audioId} />{/if}
</div>

<div class="answers">
  {#each options as o (o.id)}
    <Button
      variant="answer"
      state={answerState(o.id)}
      cheer={picked === o.id && o.id === answerId}
      dataId={o.id}
      disabled={picked !== null}
      onclick={() => onpick(o.id)}
    >
      <span lang={o.vi ? 'vi' : 'de'}>{o.text}</span>
    </Button>
  {/each}
</div>

<style>
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .prompt {
    border-radius: var(--radius-lg);
    padding: 30px 22px 24px;
    display: grid;
    justify-items: center;
    gap: 6px;
    text-align: center;
    box-shadow: var(--shadow-card);
  }
  .lotus { background: var(--lotus); }
  .lantern { background: var(--lantern); }
  .sea { background: var(--sea); }
  h1 {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
  }
  h1.long {
    font-size: var(--fs-h1);
  }
  h1.longer {
    font-size: var(--fs-h2);
  }
  .pron {
    color: rgb(35 26 21 / 0.7);
    font-weight: 600;
  }
  .question {
    font-weight: 600;
    font-size: 18px;
  }
  .answers {
    display: grid;
    gap: 12px;
  }
</style>
