<script lang="ts">
  import { onMount } from 'svelte';
  import { routeDashes, type Dash, type Obstacle, type RouteStop } from '../logic/route';

  /**
   * Route im Lernpfad. Liegt hinter den Knoten und misst sie im Elternelement (`data-route-row`, `-node`, `-label`):
   * je Etappe eine gestrichelte S-Kurve von Knotenmitte zu Knotenmitte, die unter Knoten und Titeln aussetzt.
   * Der zurückgelegte Weg ist rot, der Weg voraus leise. Jeder Abschnitt setzt sich beim Sichtbarwerden Strich für
   * Strich zusammen; die Striche zur aktuellen Etappe laufen wie Wegweiser auf ihren Knoten zu.
   * Nur Flächen (abgerundete Rechtecke), keine Konturen.
   */
  let { stops }: { stops: RouteStop[] } = $props();

  const DASH = { length: 8, width: 4, pitch: 13 };
  const AIR = 4 + DASH.length / 2; // Luft zwischen Strich und Knoten bzw. Titel
  const SHADOW = 6; // Knopfkante unter dem Knoten
  const RING = 14; // pulsierender Ring des aktuellen Knotens

  let svg: SVGSVGElement;
  let segments = $state<Dash[][]>([]);
  const shown = $state<boolean[]>([]);

  const io =
    typeof IntersectionObserver === 'undefined'
      ? undefined
      : new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              shown[Number((e.target as SVGGElement).dataset.seg)] = true;
              io?.unobserve(e.target);
            }
          },
          { threshold: 0.5 },
        );

  function reveal(node: SVGGElement) {
    io?.observe(node);
    return { destroy: () => io?.unobserve(node) };
  }

  // Versätze kommen aus `stops`: offsetLeft/offsetTop sehen die translateX-Verschiebung der Zeilen nicht.
  function measure(): void {
    const host = svg?.parentElement;
    if (!host) return;
    const stations = [...host.querySelectorAll<HTMLElement>('[data-route-row]')].map((row, i) => {
      const node = row.querySelector<HTMLElement>('[data-route-node]')!;
      const label = row.querySelector<HTMLElement>('[data-route-label]')!;
      const dx = row.offsetLeft + (stops[i]?.x ?? 0);
      const center = { x: dx + node.offsetLeft + node.offsetWidth / 2, y: row.offsetTop + node.offsetTop + node.offsetHeight / 2 };
      // Die Knopfkante liegt nur unten: Kreis um sie halb nach unten verschoben.
      const r = node.offsetWidth / 2 + SHADOW / 2 + AIR + (stops[i]?.current ? RING : 0);
      const around: Obstacle[] = [
        { kind: 'circle', x: center.x, y: center.y + SHADOW / 2, r },
        {
          kind: 'box',
          x: dx + label.offsetLeft - AIR,
          y: row.offsetTop + label.offsetTop - AIR,
          w: label.offsetWidth + 2 * AIR,
          h: label.offsetHeight + 2 * AIR,
        },
      ];
      return { center, around };
    });
    segments = stations.slice(1).map((to, i) => {
      const from = stations[i]!;
      return routeDashes(from.center, to.center, DASH.pitch, [...from.around, ...to.around]);
    });
  }

  // Neu messen, wenn sich der Stand ändert (aktueller Knoten, Titelgewicht) …
  $effect(measure);

  // … und wenn sich Maße ändern (Schrift geladen, Titel bricht anders um, andere Breite).
  onMount(() => {
    const host = svg.parentElement!;
    const ro = new ResizeObserver(() => measure());
    ro.observe(host);
    for (const label of host.querySelectorAll('[data-route-label]')) ro.observe(label);
    return () => {
      ro.disconnect();
      io?.disconnect();
    };
  });
</script>

<svg bind:this={svg} class="route" aria-hidden="true">
  {#each segments as dashes, i (i)}
    {@const to = stops[i + 1]}
    <g class="seg" class:reached={to?.reached} class:lead={to?.current} data-seg={i} data-in={shown[i] ? '' : undefined} use:reveal>
      {#each dashes as d (d.k)}
        <g transform="translate({d.x.toFixed(1)} {d.y.toFixed(1)}) rotate({d.angle.toFixed(1)})">
          <g class="pop" style:--k={d.k}>
            <rect
              class="dash"
              x={-DASH.length / 2}
              y={-DASH.width / 2}
              width={DASH.length}
              height={DASH.width}
              rx={DASH.width / 2}
            />
          </g>
        </g>
      {/each}
    </g>
  {/each}
</svg>

<style>
  .route {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    overflow: visible;
    pointer-events: none;
  }
  .pop,
  .dash {
    transform-box: fill-box;
    transform-origin: center;
  }
  .dash {
    fill: var(--ink-3);
    opacity: 0.55;
  }
  .reached .dash {
    fill: var(--red);
    opacity: 1;
  }
  /* Aufbau: Strich für Strich, sobald der Abschnitt zur Hälfte sichtbar ist. */
  .seg:not([data-in]) .pop {
    opacity: 0;
  }
  .seg[data-in] .pop {
    animation: route-pop 460ms var(--ease-spring) both;
    animation-delay: calc(var(--k) * 70ms);
  }
  /* Wegweiser: eine Welle läuft die Striche entlang auf den aktuellen Knoten zu. */
  .lead .dash {
    animation: route-lead 1.8s var(--ease-out) infinite;
    animation-delay: calc(var(--k) * 160ms);
  }
  @keyframes route-pop {
    from {
      transform: scale(0);
      opacity: 0;
    }
  }
  @keyframes route-lead {
    0%,
    45%,
    100% {
      transform: scale(1);
    }
    20% {
      transform: scale(1.5, 1.3);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .seg:not([data-in]) .pop {
      opacity: 1;
    }
    .seg[data-in] .pop,
    .lead .dash {
      animation: none;
    }
  }
</style>
