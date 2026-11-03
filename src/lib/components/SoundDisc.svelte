<script lang="ts">
  import { onMount } from 'svelte';
  import { level } from '../audio/player';
  import { reducedMotion } from '../motion';

  /**
   * Klangscheibe der Hör-Aufgaben: flache Sonne wie in den Illustrationen (Hof, Scheibe,
   * Schattensichel links – Licht von rechts oben). Der Hof wächst mit dem Audiopegel
   * (AnalyserNode), im Leerlauf atmet er langsam. Keine Verläufe, kein Glühen.
   */
  let { size = 200 }: { size?: number } = $props();

  let l = $state(0);

  onMount(() => {
    if (reducedMotion()) return;
    let raf = 0;
    let smooth = 0;
    const frame = (t: number) => {
      const target = level();
      smooth += (target - smooth) * (target > smooth ? 0.45 : 0.12);
      const idle = (Math.sin(t / 900) + 1) * 0.05;
      l = Math.max(smooth, idle);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<svg width={size} height={size} viewBox="0 0 200 200" aria-hidden="true">
  <circle cx="100" cy="100" r="62" fill="var(--sun-halo)" style:transform="scale({1 + l * 0.55})" />
  <circle cx="100" cy="100" r="56" fill="var(--yellow)" style:transform="scale({0.96 + l * 0.12})" />
  <path d="M100 44 A56 56 0 0 0 100 156 A44 56 0 0 1 100 44 Z" fill="var(--lantern)" style:transform="scale({0.96 + l * 0.12})" />
  <circle cx="100" cy="100" r="18" fill="var(--red)" style:transform="scale({0.9 + l * 0.5})" />
</svg>

<style>
  svg {
    display: block;
    overflow: visible;
  }
  circle,
  path {
    transform-origin: 100px 100px;
  }
</style>
