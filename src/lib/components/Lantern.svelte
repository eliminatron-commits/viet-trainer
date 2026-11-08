<script lang="ts" module>
  import type { Lantern as LanternState } from '../logic/calendar';

  /** Zustände, in denen die Laterne leuchtet. */
  export const LIT: LanternState[] = ['learned', 'goal', 'shield'];
</script>

<script lang="ts">
  /**
   * Laterne eines Tages (Laternen-Kalender, Wochenrückblick) in der Form der Hero-Laterne von Hội An, nur Flächen:
   * Kappen, Körper mit Schattenseite links, leuchtend gelbe Rippen und Quaste. Aus blass, gelernt orange, Tagesziel
   * rot, Streak-Schutz meerblau (Tokens `--lamp-*`). Die Zahl steht zwischen den Rippen (gemessen: ≥ 1,6 px Luft bei
   * 36 px). Größe über `--w` (Standard 36 px, alles skaliert mit). Steht sie in einem `.lights`-Behälter mit
   * `data-phase`, ist sie bei `wait` aus und geht bei `in` mit kurzem Flackern an – Verzögerung
   * `--i` × `--step` + `--lead` (Standard 24 ms und 120 ms).
   */
  let { state, num, string = true }: { state: LanternState; num?: number; string?: boolean } = $props();
</script>

<span class="lantern {state}">
  <svg viewBox="0 0 36 42" aria-hidden="true">
    {#if string}<rect x="17.25" y="0" width="1.5" height="6" class="cap" />{/if}
    <g>
      <rect x="12" y="5" width="12" height="4" rx="1.5" class="cap" />
      <ellipse cx="18" cy="20.5" rx="15" ry="12" class="off-body" />
      <path d="M18 8.9C9.9 8.9 3.4 14.1 3.4 20.5S9.9 32.1 18 32.1Q8.8 30 8.8 20.5T18 8.9Z" class="shade" />
      <rect x="13" y="31.5" width="10" height="3.5" rx="1.5" class="cap" />
      <path d="M16.5 35h3l1.2 6h-5.4z" class="cap" />
    </g>
    {#if LIT.includes(state)}
      <g class="lit">
        <rect x="12" y="5" width="12" height="4" rx="1.5" class="gold" />
        <ellipse cx="18" cy="20.5" rx="15" ry="12" class="body" />
        <path d="M18 8.9C9.9 8.9 3.4 14.1 3.4 20.5S9.9 32.1 18 32.1Q8.8 30 8.8 20.5T18 8.9Z" class="shade" />
        <path d="M9.7 10.6Q1.9 20.5 9.7 30.4Q5 20.5 9.7 10.6Z" class="gold" />
        <path d="M26.3 10.6Q34.1 20.5 26.3 30.4Q31 20.5 26.3 10.6Z" class="gold" />
        <rect x="13" y="31.5" width="10" height="3.5" rx="1.5" class="gold" />
        <path d="M16.5 35h3l1.2 6h-5.4z" class="gold" />
      </g>
    {/if}
  </svg>
  {#if num !== undefined}<span class="num">{num}</span>{/if}
</span>

<style>
  .lantern {
    position: relative;
    display: block;
    width: var(--w, 36px);
    height: calc(var(--w, 36px) * 42 / 36);
    --lamp: var(--lamp-off);
    --num: var(--ink-2);
  }
  /* Farbe je Zustand; Zahl je Fläche AA bei Tag und Nacht */
  .learned {
    --lamp: var(--lamp-learned);
    --num: var(--lamp-ink);
  }
  .goal {
    --lamp: var(--red);
    --num: var(--on-red);
  }
  .shield {
    --lamp: var(--lamp-shield);
    --num: var(--lamp-ink);
  }
  svg {
    display: block;
    width: 100%;
    height: 100%;
    overflow: visible;
  }
  .cap {
    fill: var(--ink-3);
  }
  .off-body {
    fill: var(--lamp-off);
  }
  .body {
    fill: var(--lamp);
  }
  .shade {
    fill: var(--lamp-shade);
  }
  .gold {
    fill: var(--yellow);
  }
  .future svg {
    opacity: 0.45;
  }
  .num {
    position: absolute;
    left: 0;
    right: 0;
    top: calc(var(--w, 36px) * 20.5 / 36);
    transform: translateY(-50%);
    text-align: center;
    font-size: calc(var(--w, 36px) / 3);
    font-weight: 800;
    line-height: 1;
    font-variant-numeric: tabular-nums;
    color: var(--num);
  }

  @media (prefers-reduced-motion: no-preference) {
    /* Anzünden: vor dem Sichtbarwerden aus, dann der Reihe nach mit kurzem Flackern; die Zahl wechselt erst danach */
    :global(.lights[data-phase='wait']) .lit {
      opacity: 0;
    }
    :global(.lights[data-phase='wait']) .num {
      color: var(--ink-2);
    }
    :global(.lights[data-phase='in']) .lit {
      animation: lamp-lit 460ms ease-out calc(var(--i, 0) * var(--step, 24ms) + var(--lead, 120ms)) both;
    }
    :global(.lights[data-phase='in']) .learned .num,
    :global(.lights[data-phase='in']) .goal .num,
    :global(.lights[data-phase='in']) .shield .num {
      animation: num-lit 460ms ease-out calc(var(--i, 0) * var(--step, 24ms) + var(--lead, 120ms)) both;
    }
  }
  @keyframes lamp-lit {
    0% {
      opacity: 0;
    }
    30% {
      opacity: 0.85;
    }
    45% {
      opacity: 0.4;
    }
    65%,
    100% {
      opacity: 1;
    }
  }
  @keyframes num-lit {
    0%,
    62% {
      color: var(--ink-2);
    }
    66% {
      color: var(--num);
    }
  }
</style>
