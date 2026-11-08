<script lang="ts">
  /**
   * Lichthof einer leuchtenden Laterne (nur nachts zeigen): zwei flache, durchscheinende Scheiben wie `Glow.svelte`,
   * sacht pulsierend; ein Lerntag hat einen kleineren, leiseren Hof. Größe folgt `--w` (wie die Laterne), Lage über
   * `--hx`/`--hy` (Mitte des Laternenkörpers) im positionierten Eltern-Element, Ebene `--hz`. In einem `.lights`-Behälter
   * wächst er beim Anzünden kurz nach seiner Laterne.
   */
  let { state }: { state: 'goal' | 'learned' } = $props();
</script>

<span class="halo {state}" aria-hidden="true"><span class="pulse"><span class="disc"></span><span class="disc"></span></span></span>

<style>
  .halo {
    position: absolute;
    z-index: var(--hz, 1);
    left: var(--hx, 50%);
    top: var(--hy, 50%);
    width: 0;
    height: 0;
    --s: calc(var(--w, 36px) / 36);
  }
  .pulse {
    position: absolute;
  }
  .disc {
    position: absolute;
    border-radius: 50%;
    background: var(--lamp-glow);
  }
  .disc:first-child {
    width: calc(50 * var(--s));
    height: calc(50 * var(--s));
    left: calc(-25 * var(--s));
    top: calc(-25 * var(--s));
    opacity: 0.13;
  }
  .disc:last-child {
    width: calc(33 * var(--s));
    height: calc(33 * var(--s));
    left: calc(-16.5 * var(--s));
    top: calc(-16.5 * var(--s));
    opacity: 0.26;
  }
  .learned .disc:first-child {
    display: none;
  }
  .learned .disc:last-child {
    width: calc(42 * var(--s));
    height: calc(42 * var(--s));
    left: calc(-21 * var(--s));
    top: calc(-21 * var(--s));
    opacity: 0.2;
  }
  @media (prefers-reduced-motion: no-preference) {
    .pulse {
      animation: lamp-glow 2.6s ease-in-out var(--d, 0s) infinite alternate;
    }
    :global(.lights[data-phase='wait']) .halo {
      opacity: 0;
    }
    :global(.lights[data-phase='in']) .halo {
      animation: halo-in 600ms var(--ease-out) calc(var(--i, 0) * var(--step, 24ms) + var(--lead, 120ms) + 100ms) both;
    }
  }
  @keyframes lamp-glow {
    from {
      transform: scale(0.88);
      opacity: 0.7;
    }
    to {
      transform: scale(1.08);
      opacity: 1;
    }
  }
  @keyframes halo-in {
    from {
      transform: scale(0.3);
      opacity: 0;
    }
  }
</style>
