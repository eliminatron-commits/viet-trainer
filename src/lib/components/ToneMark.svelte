<script lang="ts">
  import type { Tone } from '../logic/tones';

  /** Tonzeichen als flache Fläche (Farbe = currentColor). ngang hat kein Zeichen und zeichnet nichts. */
  let { tone, class: cls = '' }: { tone: Tone; class?: string } = $props();
</script>

{#if tone !== 'ngang'}
  <svg class={cls} viewBox="0 0 20 20" aria-hidden="true"
    >{#if tone === 'sac'}<rect x="7.8" y="1.5" width="4.4" height="17" rx="2.2" transform="rotate(38 10 10)" />{:else if tone === 'huyen'}<rect
        x="7.8"
        y="1.5"
        width="4.4"
        height="17"
        rx="2.2"
        transform="rotate(-38 10 10)"
      />{:else if tone === 'hoi'}<path
        d="M5.2 7.4a4.8 4.8 0 1 1 7.6 3.9c-1.1.8-1.4 1.3-1.4 2.4v1.6H8.1v-1.9c0-2 .8-3.1 2.3-4.2a1.6 1.6 0 1 0-2.6-1.6z"
      />{:else if tone === 'nga'}<path
        d="M1.6 12.2c1.8-4 4.4-5.4 7.3-3.4l1.7 1.2c1.3.9 2.4.6 3.4-1.1l.7-1.2 3.2 1.6-.8 1.3c-2 3.8-4.6 4.7-7.4 2.8L8 10.2c-1.3-.9-2.4-.6-3.4 1.2l-.6 1.1z"
      />{:else}<circle cx="10" cy="10" r="5" />{/if}</svg
  >
{/if}
