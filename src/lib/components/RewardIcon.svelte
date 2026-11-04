<script lang="ts">
  /** Flache Symbole für Belohnungen: Truhe (lackiert, mit Goldbeschlag), XP-Boost, Streak-Schutz, Medaille. */
  let {
    kind,
    size = 48,
    open = false,
    locked = false,
  }: { kind: 'chest' | 'boost' | 'shield' | 'medal'; size?: number; open?: boolean; locked?: boolean } = $props();
</script>

{#if kind === 'chest'}
  <svg class="chest" class:open viewBox="0 0 120 100" width={size} height={size * (100 / 120)} aria-hidden="true">
    <rect x="10" y="44" width="100" height="48" rx="8" fill="var(--red)" />
    <path d="M18 44 h12 v48 h-12 a8 8 0 0 1 -8 -8 v-32 a8 8 0 0 1 8 -8z" fill="var(--red-deep)" />
    <rect x="10" y="84" width="100" height="8" rx="4" fill="var(--red-deep)" />
    <rect x="52" y="44" width="16" height="48" fill="var(--yellow)" />
    {#if open}
      <!-- aufgeklappt: die Innenseite des Deckels steht hinter der Truhe -->
      <g class="lid-open">
        <path d="M12 46 L4 10 Q60 2 116 10 L108 46 Z" fill="var(--red-deep)" />
        <path d="M52 46 L51 5 L69 5 L68 46 Z" fill="var(--yellow)" />
      </g>
      <rect x="10" y="40" width="100" height="10" rx="4" fill="var(--red-deep)" />
    {:else}
      <path d="M10 48 L10 34 Q10 14 60 14 Q110 14 110 34 L110 48 Z" fill="var(--red)" />
      <path d="M10 48 L10 34 Q10 18 32 15 L32 48 Z" fill="var(--red-deep)" />
      <rect x="52" y="14.5" width="16" height="33.5" fill="var(--yellow)" />
      <rect x="53" y="40" width="14" height="16" rx="4" fill="var(--ink)" />
      <circle cx="60" cy="47" r="2.6" fill="var(--yellow)" />
    {/if}
  </svg>
{:else if kind === 'boost'}
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <circle cx="24" cy="24" r="22" fill="var(--lantern)" />
    <path d="M27 6 L12 27 h10 l-3 15 L36 20 h-11 z" fill="var(--yellow)" />
  </svg>
{:else if kind === 'shield'}
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <path d="M24 3 L42 9 V23 C42 34 34 41 24 45 C14 41 6 34 6 23 V9 Z" fill="var(--sea)" />
    <path d="M24 3 L24 45 C14 41 6 34 6 23 V9 Z" fill="var(--sea-soft)" opacity="0.35" />
    <path d="M24 13 l3 6.3 7 .7-5.2 4.7 1.5 6.9L24 28.1l-6.3 3.5 1.5-6.9-5.2-4.7 7-.7z" fill="var(--yellow)" />
  </svg>
{:else}
  <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
    <path d="M14 2 h8 l4 14 h-8z M26 2 h8 l-4 14 h-8z" fill={locked ? 'var(--disabled-ink)' : 'var(--red)'} opacity={locked ? 0.35 : 1} />
    <circle cx="24" cy="29" r="17" fill={locked ? 'var(--disabled-ink)' : 'var(--yellow)'} opacity={locked ? 0.22 : 1} />
    <path
      d="M24 18 l3.2 6.6 7.3.8-5.4 5 1.5 7.2L24 34l-6.6 3.6 1.5-7.2-5.4-5 7.3-.8z"
      fill={locked ? 'var(--ink-3)' : 'var(--red)'}
    />
  </svg>
{/if}

<style>
  svg {
    display: block;
    flex: none;
  }
  .chest {
    overflow: visible;
  }
  /* Deckel klappt nach hinten auf: die Innenseite wächst aus der Kante nach oben */
  .lid-open {
    transform-box: view-box;
    transform-origin: 60px 46px;
    animation: lid-open 560ms var(--ease-spring) both;
  }
  @keyframes lid-open {
    from {
      transform: scaleY(0.15);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .lid-open {
      animation: none;
    }
  }
</style>
