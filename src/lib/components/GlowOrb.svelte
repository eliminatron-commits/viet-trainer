<script lang="ts">
  import { onMount } from 'svelte';
  import { level } from '../audio/player';
  import { reducedMotion } from '../motion';

  let { size = 220 }: { size?: number } = $props();

  // Pegel (0..1), weich geglättet; im Leerlauf atmet die Kugel langsam.
  let l = $state(0);

  onMount(() => {
    if (reducedMotion()) return;
    let raf = 0;
    let smooth = 0;
    const frame = (t: number) => {
      const target = level();
      smooth += (target - smooth) * (target > smooth ? 0.45 : 0.12);
      const idle = (Math.sin(t / 900) + 1) * 0.06;
      l = Math.max(smooth, idle);
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="orb" style:--size="{size}px" style:--l={l} aria-hidden="true">
  <div class="halo"></div>
  <div class="body"></div>
  <div class="core"></div>
</div>

<style>
  .orb {
    position: relative;
    width: var(--size);
    height: var(--size);
  }
  .orb > div {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    will-change: transform, opacity;
  }
  .halo {
    background: radial-gradient(circle, rgb(255 106 43 / 0.55) 0%, rgb(218 37 29 / 0.25) 40%, transparent 70%);
    transform: scale(calc(1.25 + var(--l) * 0.6));
    opacity: calc(0.55 + var(--l) * 0.45);
  }
  .body {
    inset: 14%;
    background: radial-gradient(circle at 42% 38%, var(--glow-core) 0%, var(--glow-mid) 38%, var(--glow-edge) 72%, #6e0f0a 100%);
    box-shadow:
      0 0 60px 10px rgb(255 106 43 / 0.45),
      0 0 140px 40px rgb(218 37 29 / 0.25);
    transform: scale(calc(0.92 + var(--l) * 0.18));
  }
  .core {
    inset: 32%;
    background: radial-gradient(circle at 45% 40%, #fffaf0 0%, rgb(255 210 122 / 0.7) 45%, transparent 75%);
    filter: blur(6px);
    opacity: calc(0.5 + var(--l) * 0.5);
    transform: scale(calc(0.9 + var(--l) * 0.35));
  }
</style>
