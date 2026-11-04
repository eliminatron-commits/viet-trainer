<script lang="ts">
  import { onMount, type Snippet } from 'svelte';

  /**
   * Rahmen aller Orts-Szenen (viewBox 400×260). Stilregeln: keine Konturen, nur Flächen;
   * ≤ 14 Farben pro Szene als Konstanten-Objekt `C`; Licht von rechts oben (Schattenseiten links
   * dunkler); Horizont im oberen Drittel bis zur Mitte; Vordergrund unten groß, Ferne blasser und kühler.
   * Bewegung (styles/scene.css): Beim ersten Sichtbarwerden baut sich die Szene auf, danach lebt sie
   * in Schleifen – nur solange sie sichtbar ist.
   */
  let { label, children }: { label: string; children: Snippet } = $props();

  let svg: SVGSVGElement;
  let phase = $state<'wait' | 'in'>('wait');
  let visible = $state(true);

  onMount(() => {
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry!.isIntersecting;
        if (visible) phase = 'in';
      },
      { threshold: 0.1 },
    );
    io.observe(svg);
    return () => io.disconnect();
  });
</script>

<svg
  bind:this={svg}
  class="scene"
  class:paused={!visible}
  data-phase={phase}
  viewBox="0 0 400 260"
  role="img"
  aria-label={label}
  preserveAspectRatio="xMidYMid slice"
>
  {@render children()}
</svg>

<style>
  svg {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
