<script lang="ts" module>
  /** Stab von (x1|y1) nach (x2|y2) mit Breite w – als Fläche, nicht als Kontur. */
  function bar(x1: number, y1: number, x2: number, y2: number, w: number): string {
    const l = Math.hypot(x2 - x1, y2 - y1);
    const nx = ((y1 - y2) / l) * (w / 2);
    const ny = ((x2 - x1) / l) * (w / 2);
    const p = (x: number, y: number) => `${+x.toFixed(2)} ${+y.toFixed(2)}`;
    return `M${p(x1 + nx, y1 + ny)}L${p(x2 + nx, y2 + ny)}L${p(x2 - nx, y2 - ny)}L${p(x1 - nx, y1 - ny)}Z`;
  }

  /** Ring um (cx|cy), Außenradius r, Breite w – mit fill-rule="evenodd" zeichnen. */
  function ring(cx: number, cy: number, r: number, w: number): string {
    const q = r - w;
    return (
      `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z` +
      `M${cx - q} ${cy}a${q} ${q} 0 1 0 ${2 * q} 0a${q} ${q} 0 1 0 ${-2 * q} 0Z`
    );
  }

  /** Fünfzackiger Stern: zehn Punkte im Uhrzeigersinn, erste Spitze oben. */
  function starPoints(cx: number, cy: number, outer: number, inner: number): [number, number][] {
    return Array.from({ length: 10 }, (_, i) => {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const r = i % 2 ? inner : outer;
      return [+(cx + r * Math.cos(a)).toFixed(2), +(cy + r * Math.sin(a)).toFixed(2)];
    });
  }
  const STAR = starPoints(28, 26, 17, 7.6);
  const starPath = (dx = 0, dy = 0) => `M${STAR.map(([x, y]) => `${x + dx} ${y + dy}`).join('L')}Z`;
  /** Rechte Hälfte jeder Zacke heller (Licht von rechts oben). */
  const STAR_FACETS = [0, 2, 4, 6, 8].map((i) => {
    const [ox, oy] = STAR[i]!;
    const [ix, iy] = STAR[i + 1]!;
    return `M28 26L${ox} ${oy}L${ix} ${iy}Z`;
  });

  /** Senkrechte Streben der Bogenbrücke: Bogen y = 38 − 60·t(1−t) über je 27 Einheiten. */
  const STRUTS = [5, 32].flatMap((x0) =>
    [5.5, 9.5, 13.5, 17.5, 21.5].map((dx) => {
      const t = dx / 27;
      return { x: x0 + dx, y: +(38 - 60 * t * (1 - t)).toFixed(2) };
    }),
  );

  /** Tropfen mit Spitze oben bei (x|y), halbe Breite w, Höhe h. */
  const drop = (x: number, y: number, w: number, h: number) =>
    `M${x} ${y} Q${x + w} ${y + h * 0.7} ${x} ${y + h} Q${x - w} ${y + h * 0.7} ${x} ${y} Z`;

  /** Blüte aus fünf Blättern um (cx|cy). */
  const petals = (cx: number, cy: number) =>
    [0, 1, 2, 3, 4].map((i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
      return { x: +(cx + 2.2 * Math.cos(a)).toFixed(2), y: +(cy + 2.2 * Math.sin(a)).toFixed(2) };
    });

  /** Sprechblase mit Zipfel unten links (Etappe 2). */
  const BUBBLE = 'M14 12 H50 Q55 12 55 17 V37 Q55 42 50 42 H30 L19 51 L21 42 H14 Q9 42 9 37 V17 Q9 12 14 12 Z';
  /** Stapel-Tasse (Etappe 1), x = Mitte. */
  const cup = (x: number) => ({
    body: `M${x - 9} 32 H${x + 9} L${x + 7} 45.5 Q${x} 50 ${x - 7} 45.5 Z`,
    shade: `M${x - 9} 32 H${x - 4.5} V46.8 Q${x - 6} 46.4 ${x - 7} 45.5 Z`,
    band: `M${x - 8.4} 36 H${x + 8.4} L${x + 8} 39 H${x - 8} Z`,
    bandShade: `M${x - 8.4} 36 H${x - 4.5} V39 H${x - 8} Z`,
  });
  /** Reisschale (Etappe 11), x = Mitte, h = Höhe des Reisbergs. */
  const riceBowl = (x: number, h: number) => ({
    x,
    h,
    body: `M${x - 9} 42 H${x + 9} Q${x + 8.4} 50.5 ${x} 50.5 Q${x - 8.4} 50.5 ${x - 9} 42 Z`,
    shade: `M${x - 9} 42 H${x - 4} Q${x - 4.6} 49.6 ${x - 1.5} 50.4 Q${x - 8.4} 50 ${x - 9} 42 Z`,
  });
</script>

<script lang="ts">
  import type { StageId } from '../../content/types';
  import type { RegionTone } from './RegionHero.svelte';

  /**
   * Vignette je Etappe: ein Gegenstand aus dem vietnamesischen Alltag, der das Thema trägt, auf einer
   * Scheibe in der Kartenfarbe der Region (wie Sonne mit Hof in den Szenen). Gleiche Stilregeln wie
   * Szenen und Hero-Objekte: flach, keine Konturen, Licht von rechts oben (Schattenseite links bzw.
   * links unten dunkler). Der Gegenstand darf oben aus der Scheibe ragen. Rein dekorativ.
   */
  let { stage, tone, size = 56 }: { stage: StageId; tone: RegionTone; size?: number } = $props();

  const C = {
    red: '#DA251D',
    redDeep: '#A8170F',
    redLight: '#F05A45',
    yellow: '#FFCD00',
    gold: '#D9A900',
    cream: '#F7EEDC',
    creamShade: '#DCC79F',
    rice: '#FFFDF6',
    wood: '#9A5B2E',
    woodDark: '#6B3D1E',
    woodLight: '#C8854A',
    green: '#4E9E6A',
    greenDark: '#2F6F4A',
    leaf: '#8CC79A',
    sea: '#2BB3A8',
    seaDark: '#1E7F78',
    blue: '#3A6FB5',
    blueDark: '#2A4F86',
    lotus: '#F6A5B8',
    lotusDark: '#D9788F',
    orange: '#F7964A',
    ink: '#3A3346',
    metal: '#C9D2D6',
    metalShade: '#8C989E',
    shadow: 'rgb(40 20 10 / 0.16)',
  };
</script>

<svg class="vignette" viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" style:--disc="var(--{tone === 'paper' ? 'paper-2' : tone === 'yellow' ? 'tone-yellow-soft' : `${tone}-soft`})">
  <circle class="disc" cx="32" cy="36" r="25" />
  {#if stage === 'e01'}
    <!-- Ich & du: zwei Teeschalen, deren Dampf sich trifft -->
    <ellipse cx="32" cy="50" rx="23" ry="3.5" fill={C.shadow} />
    {#each [19, 45] as x (x)}
      {@const c = cup(x)}
      <path d={c.body} fill={C.cream} />
      <path d={c.shade} fill={C.creamShade} />
      <path d={c.band} fill={C.blue} />
      <path d={c.bandShade} fill={C.blueDark} />
      <ellipse cx={x} cy="32" rx="9" ry="2.4" fill={C.woodLight} />
    {/each}
    <path d="M19 27 Q15 22 20 18 Q24 14 23 9 Q28 14 24 19 Q21 23 22 27 Z" fill={C.cream} />
    <path d="M45 27 Q49 22 44 18 Q40 14 41 9 Q36 14 40 19 Q43 23 42 27 Z" fill={C.cream} />
  {:else if stage === 'e02'}
    <!-- Ja, nein, was?: Sprechblase mit Fragezeichen -->
    <ellipse cx="26" cy="56" rx="14" ry="2.6" fill={C.shadow} />
    <path d={BUBBLE} fill={C.creamShade} transform="translate(-2 2)" />
    <path d={BUBBLE} fill={C.cream} />
    <path
      d="M26.5 23.5 Q26.5 17 32 17 Q37.5 17 37.5 22.3 Q37.5 25.6 34.4 27.3 Q33.6 27.8 33.6 29.6 V30.5 H30.2 V29.2 Q30.2 25.8 32.6 24.6 Q34.2 23.8 34.2 22.4 Q34.2 20.3 32 20.3 Q29.8 20.3 29.8 23.5 Z"
      fill={C.red}
    />
    <circle cx="31.9" cy="35" r="2.2" fill={C.red} />
  {:else if stage === 'e03'}
    <!-- Die wichtigsten Verben: Fahrrad -->
    <ellipse cx="32" cy="55" rx="25" ry="2.6" fill={C.shadow} />
    <path d={ring(17, 43, 10.5, 3)} fill={C.ink} fill-rule="evenodd" />
    <path d={ring(47, 43, 10.5, 3)} fill={C.ink} fill-rule="evenodd" />
    <circle cx="17" cy="43" r="2" fill={C.metalShade} />
    <circle cx="47" cy="43" r="2" fill={C.metalShade} />
    <path d={bar(17, 43, 30, 43, 2.6)} fill={C.redDeep} />
    <path d={bar(17, 43, 26, 28, 2.6)} fill={C.redDeep} />
    <path d={bar(26, 28, 30, 43, 2.8)} fill={C.red} />
    <path d={bar(26, 29, 43, 29, 2.8)} fill={C.red} />
    <path d={bar(30, 43, 43, 30, 3)} fill={C.red} />
    <path d={bar(43, 27, 47, 43, 2.6)} fill={C.metalShade} />
    <path d={bar(43, 28, 41.5, 21, 2.4)} fill={C.metalShade} />
    <path d={bar(38.5, 21, 45.5, 20, 2.6)} fill={C.ink} />
    <path d={bar(26, 28, 25.4, 24.5, 2.2)} fill={C.metalShade} />
    <ellipse cx="25" cy="24" rx="4.6" ry="1.9" fill={C.ink} />
    <circle cx="30" cy="43" r="3" fill={C.metal} />
    <path d={bar(30, 43, 33, 47.5, 2)} fill={C.metalShade} />
    <path d={bar(31.2, 47.8, 35.2, 47.8, 2)} fill={C.ink} />
  {:else if stage === 'e04'}
    <!-- Essen & Trinken: dampfende Phở mit Stäbchen -->
    <ellipse cx="32" cy="55" rx="19" ry="2.6" fill={C.shadow} />
    <path d="M26 49 H38 L37.2 53 H26.8 Z" fill={C.creamShade} />
    <path d="M9 33 H55 Q54 46 41 50.5 H23 Q10 46 9 33 Z" fill={C.cream} />
    <path d="M9 33 H19 Q20 45 27 50.5 H23 Q10 46 9 33 Z" fill={C.creamShade} />
    <path d="M9.6 37.5 H54.4 Q54.1 39.3 53.6 40.5 H10.4 Q9.9 39.3 9.6 37.5 Z" fill={C.blue} />
    <path d="M9.6 37.5 H19.4 Q19.6 39.3 19.9 40.5 H10.4 Q9.9 39.3 9.6 37.5 Z" fill={C.blueDark} />
    <ellipse cx="32" cy="33" rx="23" ry="5" fill={C.woodLight} />
    <path d="M14 33 Q22 30.5 29 32.5 Q36 34.5 44 31.5 Q47 30.8 50 32 Q44 34 37 35.2 Q29 36 22 35 Q17 34.4 14 33 Z" fill={C.cream} />
    <ellipse cx="24" cy="31.4" rx="4.2" ry="1.5" fill={C.woodDark} />
    <ellipse cx="40" cy="31" rx="4" ry="1.4" fill={C.woodDark} />
    <ellipse cx="31" cy="30.4" rx="2.6" ry="1.1" fill={C.green} transform="rotate(-20 31 30.4)" />
    <ellipse cx="46" cy="33" rx="2.4" ry="1" fill={C.green} transform="rotate(15 46 33)" />
    <circle cx="19" cy="33.4" r="1.1" fill={C.red} />
    <circle cx="35" cy="34.6" r="1.1" fill={C.red} />
    <path d={bar(34, 33, 55, 8, 2.4)} fill={C.woodDark} />
    <path d={bar(38, 33.5, 59, 11, 2.4)} fill={C.wood} />
    <path d="M18 26 Q14 21 19 17 Q23 13 21 8 Q27 13 22 18 Q19 22 21 26 Z" fill={C.cream} />
    <path d="M27 25 Q24 21 28 18 Q31 15 30 11 Q34 15 30.5 18.5 Q28 21 29.5 25 Z" fill={C.cream} />
  {:else if stage === 'e05'}
    <!-- Zahlen & Geld: aufgefächerte Polymer-Scheine -->
    <ellipse cx="32" cy="54" rx="22" ry="2.6" fill={C.shadow} />
    {#each [{ rot: -18, y: 27, f: C.green, s: C.greenDark }, { rot: -6, y: 26, f: C.lotus, s: C.lotusDark }, { rot: 7, y: 25, f: C.blue, s: C.blueDark }] as n, i (i)}
      <g transform="rotate({n.rot} 32 38)">
        <rect x="11" y={n.y} width="42" height="22" rx="3" fill={n.f} />
        <path d="M14 {n.y} H20 V{n.y + 22} H14 Q11 {n.y + 22} 11 {n.y + 19} V{n.y + 3} Q11 {n.y} 14 {n.y} Z" fill={n.s} />
        <ellipse cx="41" cy={n.y + 11} rx="5" ry="6" fill={n.s} />
        {#if i === 2}
          <rect x="22.5" y={n.y + 4} width="7" height="10" rx="2" fill={C.cream} opacity="0.55" />
          <rect x="24" y={n.y + 16} width="12" height="2.4" rx="1.2" fill={C.cream} />
          <rect x="44" y={n.y + 2.5} width="6" height="2.4" rx="1.2" fill={C.cream} />
        {/if}
      </g>
    {/each}
  {:else if stage === 'e06'}
    <!-- Uhrzeit & Tage: Wandkalender, heute markiert -->
    <ellipse cx="32" cy="56" rx="18" ry="2.6" fill={C.shadow} />
    <rect x="12" y="14" width="40" height="40" rx="5" fill={C.creamShade} />
    <rect x="14" y="12" width="40" height="40" rx="5" fill={C.cream} />
    <path d="M19 12 H49 Q54 12 54 17 V22 H14 V17 Q14 12 19 12 Z" fill={C.red} />
    <rect x="21" y="8" width="3" height="8" rx="1.5" fill={C.ink} />
    <rect x="44" y="8" width="3" height="8" rx="1.5" fill={C.ink} />
    {#each [26, 33, 40] as y, r (y)}
      {#each [18, 26.6, 35.2, 43.8] as x, c (x)}
        <rect {x} {y} width="6" height="5" rx="1.2" fill={r === 1 && c === 2 ? C.red : C.creamShade} />
      {/each}
    {/each}
  {:else if stage === 'e07'}
    <!-- Familie & Anreden: Entenmutter mit zwei Küken -->
    <ellipse cx="32" cy="52" rx="26" ry="3" fill={C.shadow} />
    {#each [8, 19] as x (x)}
      <g transform="translate({x} 41)">
        <ellipse cx="0" cy="4" rx="5.6" ry="4.2" fill={C.gold} />
        <ellipse cx="0.6" cy="3.4" rx="5" ry="3.6" fill={C.yellow} />
        <circle cx="3.6" cy="-2.2" r="3.4" fill={C.yellow} />
        <path d="M6.4 -2.6 L9.6 -1.6 L6.4 -0.4 Z" fill={C.orange} />
        <circle cx="4.4" cy="-3" r="0.8" fill={C.ink} />
      </g>
    {/each}
    <path d="M27 38 L21 30 L32 34 Z" fill={C.cream} />
    <ellipse cx="38" cy="41" rx="13" ry="8.6" fill={C.creamShade} />
    <ellipse cx="39" cy="40" rx="12.4" ry="8" fill={C.cream} />
    <ellipse cx="46.5" cy="31" rx="4.2" ry="7" fill={C.cream} />
    <circle cx="48" cy="23" r="6" fill={C.cream} />
    <path d="M53 21.6 Q60 21.6 60 24 Q60 26 53 25.6 Z" fill={C.orange} />
    <circle cx="49.4" cy="21.6" r="1.1" fill={C.ink} />
    <path d="M30 39 Q36 34 45 38 Q41 46 32 45 Q28 43 30 39 Z" fill={C.creamShade} />
  {:else if stage === 'e08'}
    <!-- Unterwegs: Xích lô (Fahrradrikscha) -->
    <ellipse cx="32" cy="55" rx="26" ry="2.6" fill={C.shadow} />
    <path d={ring(14, 48, 6.5, 2.2)} fill={C.ink} fill-rule="evenodd" />
    <path d={ring(46, 44.5, 9.5, 2.6)} fill={C.ink} fill-rule="evenodd" />
    <circle cx="46" cy="44.5" r="1.8" fill={C.metalShade} />
    <path d={bar(28, 41, 46, 44.5, 2.6)} fill={C.metalShade} />
    <path d={bar(42, 27, 46, 44.5, 2.4)} fill={C.metalShade} />
    <path d={bar(29, 26, 37, 27.6, 2.2)} fill={C.ink} />
    <ellipse cx="42" cy="25.8" rx="4.4" ry="1.8" fill={C.ink} />
    <path d={bar(5, 46, 15, 46, 2.2)} fill={C.metalShade} />
    <path d="M7 36 H24 V25 Q24 21 28 21 H30 V43 H11 Q7 43 7 40 Z" fill={C.red} />
    <path d="M7 36 H11.5 V43 H11 Q7 43 7 40 Z" fill={C.redDeep} />
    <rect x="9" y="33" width="15" height="4" rx="2" fill={C.cream} />
    <path d="M30 23 Q30 11 18 11 Q9 11 6.4 20 L10 21 Q12 14.8 18 14.8 Q26.2 14.8 26.2 23 Z" fill={C.green} />
    <path d="M18 11 Q9 11 6.4 20 L10 21 Q12 14.8 18 14.8 Z" fill={C.greenDark} />
  {:else if stage === 'e09'}
    <!-- Wo ist was?: Wegweiser -->
    <ellipse cx="32" cy="56" rx="14" ry="2.6" fill={C.shadow} />
    <rect x="30" y="14" width="4.4" height="42" rx="1.2" fill={C.wood} />
    <rect x="30" y="14" width="1.8" height="42" fill={C.woodDark} />
    <path d="M34 15 H50 L56 21 L50 27 H34 Z" fill={C.redDeep} transform="translate(-1.5 1.5)" />
    <path d="M34 15 H50 L56 21 L50 27 H34 Z" fill={C.red} />
    <rect x="37" y="19.8" width="12" height="2.4" rx="1.2" fill={C.cream} />
    <path d="M30 31 H14 L8 37 L14 43 H30 Z" fill={C.gold} transform="translate(-1.5 1.5)" />
    <path d="M30 31 H14 L8 37 L14 43 H30 Z" fill={C.yellow} />
    <rect x="15" y="35.8" width="12" height="2.4" rx="1.2" fill={C.woodDark} />
    <path d="M23 56 Q25 49 27 56 Q29 48 31 56 Q34 49 36 56 Q38 50 41 56 Z" fill={C.green} />
  {:else if stage === 'e10'}
    <!-- Wie ist es?: Handspiegel aus Lack -->
    <ellipse cx="32" cy="57" rx="11" ry="2.4" fill={C.shadow} />
    <path d="M28.6 40 H35.4 L34.6 56 Q32 57.6 29.4 56 Z" fill={C.redDeep} />
    <rect x="29" y="48" width="6" height="2.2" fill={C.yellow} />
    <circle cx="30.5" cy="27.5" r="18" fill={C.redDeep} />
    <circle cx="32" cy="26" r="18" fill={C.red} />
    <circle cx="32" cy="26" r="13.4" fill={C.metal} />
    <path d="M18.6 26 A13.4 13.4 0 0 0 45.4 26 A13.4 13.4 0 0 1 18.6 26 Z" fill={C.metalShade} />
    <path d={bar(35, 16.5, 41, 22.5, 2.8)} fill={C.cream} />
    <path d={bar(34, 22, 37.5, 25.5, 2)} fill={C.cream} />
    {#each [0, 1, 2, 3, 4, 5, 6, 7] as k (k)}
      <circle cx={32 + 15.8 * Math.cos((k * Math.PI) / 4)} cy={26 + 15.8 * Math.sin((k * Math.PI) / 4)} r="1.1" fill={C.yellow} />
    {/each}
  {:else if stage === 'e11'}
    <!-- Sehr, viel, wenig: drei Schalen, wenig bis übervoll Reis -->
    <ellipse cx="32" cy="54" rx="27" ry="2.6" fill={C.shadow} />
    {#each [riceBowl(12, 1.6), riceBowl(32, 6), riceBowl(52, 12.5)] as b (b.x)}
      <ellipse cx={b.x} cy="42" rx="8" ry={b.h} fill={C.rice} />
      <rect x={b.x - 3} y="49.6" width="6" height="2.4" rx="1" fill={C.blueDark} />
      <path d={b.body} fill={C.blue} />
      <path d={b.shade} fill={C.blueDark} />
    {/each}
    <ellipse cx="45" cy="38" rx="1.4" ry="0.8" fill={C.rice} />
    <ellipse cx="59" cy="36" rx="1.4" ry="0.8" fill={C.rice} />
  {:else if stage === 'e12'}
    <!-- Auf dem Markt: Tragestange mit zwei Obstkörben -->
    <ellipse cx="32" cy="56" rx="27" ry="2.4" fill={C.shadow} />
    <path d="M4 21 Q32 15 60 21 L60 23.6 Q32 17.6 4 23.6 Z" fill={C.woodLight} />
    {#each [11, 53] as x (x)}
      <path d={bar(x, 22, x - 7, 37, 1.2)} fill={C.woodDark} />
      <path d={bar(x, 22, x + 7, 37, 1.2)} fill={C.woodDark} />
      <circle cx={x - 3.4} cy="35" r="3.8" fill={x < 32 ? C.yellow : C.green} />
      <circle cx={x + 3.2} cy="34.6" r="3.6" fill={x < 32 ? C.red : C.orange} />
      <path d="M{x - 8} 38 H{x + 8} L{x + 6} 54 H{x - 6} Z" fill={C.wood} />
      <path d="M{x - 8} 38 H{x - 4} L{x - 3} 54 H{x - 6} Z" fill={C.woodDark} />
      <path d="M{x - 7.4} 43 H{x + 7.4} L{x + 7.2} 45 H{x - 7.2} Z" fill={C.woodLight} />
      <path d="M{x - 6.8} 48.4 H{x + 6.8} L{x + 6.6} 50.4 H{x - 6.6} Z" fill={C.woodLight} />
      <rect x={x - 8.6} y="36.6" width="17.2" height="3" rx="1.5" fill={C.woodDark} />
    {/each}
  {:else if stage === 'e13'}
    <!-- Denken & Fühlen: Bodhi-Blatt in Herzform -->
    <ellipse cx="30" cy="57" rx="12" ry="2.4" fill={C.shadow} />
    <g transform="rotate(-16 32 36)">
      <path d="M32 20 C36 12 52 10 53 24 C54 34 42 42 35 50 Q33 53 32 59 Z" fill={C.green} />
      <path d="M32 20 C28 12 12 10 11 24 C10 34 22 42 29 50 Q31 53 32 59 Z" fill={C.greenDark} />
      <path d={bar(32, 20, 32, 56, 1.4)} fill={C.leaf} />
      {#each [{ y: 28, dx: 11, dy: 6 }, { y: 36, dx: 14, dy: 6 }, { y: 44, dx: 8, dy: 4 }] as { y, dx, dy } (y)}
        <path d={bar(32, y, 32 - dx, y - dy, 1)} fill={C.leaf} />
        <path d={bar(32, y, 32 + dx, y - dy, 1)} fill={C.leaf} />
      {/each}
      <path d={bar(32, 21, 34, 11, 2)} fill={C.woodDark} />
    </g>
  {:else if stage === 'e14'}
    <!-- Reden & Fragen: zwei Sprechblasen im Wechsel -->
    <ellipse cx="34" cy="57" rx="18" ry="2.4" fill={C.shadow} />
    <path d="M30 29 H53 Q57 29 57 33 V45 Q57 49 53 49 H51 L54 56 L44 49 H30 Q26 49 26 45 V33 Q26 29 30 29 Z" fill={C.gold} transform="translate(-1.5 1.5)" />
    <path d="M30 29 H53 Q57 29 57 33 V45 Q57 49 53 49 H51 L54 56 L44 49 H30 Q26 49 26 45 V33 Q26 29 30 29 Z" fill={C.yellow} />
    <rect x="31" y="35" width="20" height="2.4" rx="1.2" fill={C.woodDark} />
    <rect x="31" y="41" width="13" height="2.4" rx="1.2" fill={C.woodDark} />
    <path d="M11 12 H35 Q39 12 39 16 V28 Q39 32 35 32 H21 L11 39 L14 32 H11 Q7 32 7 28 V16 Q7 12 11 12 Z" fill={C.seaDark} transform="translate(-1.5 1.5)" />
    <path d="M11 12 H35 Q39 12 39 16 V28 Q39 32 35 32 H21 L11 39 L14 32 H11 Q7 32 7 28 V16 Q7 12 11 12 Z" fill={C.sea} />
    {#each [15, 23, 31] as x (x)}
      <circle cx={x} cy="22" r="2.4" fill={C.cream} />
    {/each}
  {:else if stage === 'e15'}
    <!-- Richtig oder falsch: Balkenwaage -->
    <ellipse cx="32" cy="57" rx="14" ry="2.4" fill={C.shadow} />
    <path d="M22 56 Q22 51 32 51 Q42 51 42 56 Z" fill={C.woodDark} />
    <rect x="30.2" y="15" width="3.6" height="37" fill={C.wood} />
    <rect x="30.2" y="15" width="1.4" height="37" fill={C.woodDark} />
    <path d={bar(9, 19, 55, 19, 3)} fill={C.wood} />
    <circle cx="32" cy="15" r="3.2" fill={C.yellow} />
    {#each [12, 52] as x (x)}
      <path d={bar(x, 19, x - 7, 36, 1)} fill={C.metalShade} />
      <path d={bar(x, 19, x + 7, 36, 1)} fill={C.metalShade} />
      <path d="M{x - 9} 36 H{x + 9} Q{x + 8} 43 {x} 43 Q{x - 8} 43 {x - 9} 36 Z" fill={C.yellow} />
      <path d="M{x - 9} 36 H{x - 4} Q{x - 4} 42 {x - 1} 43 Q{x - 8} 43 {x - 9} 36 Z" fill={C.gold} />
      <ellipse cx={x} cy="36" rx="9" ry="1.6" fill={C.gold} />
    {/each}
    <circle cx="12" cy="32.6" r="3.4" fill={C.red} />
    <rect x="48" y="30.4" width="8" height="5.6" rx="1.2" fill={C.ink} />
  {:else if stage === 'e16'}
    <!-- Kleine Wörter, große Wirkung: Chili -->
    <ellipse cx="30" cy="55" rx="15" ry="2.6" fill={C.shadow} />
    <path d="M40 17 Q50 22 46 32 Q41 44 16 51 Q13 51.5 14 49 Q30 40 33 30 Q35 22 40 17 Z" fill={C.redDeep} transform="translate(-1.6 1.6)" />
    <path d="M40 17 Q50 22 46 32 Q41 44 16 51 Q13 51.5 14 49 Q30 40 33 30 Q35 22 40 17 Z" fill={C.red} />
    <path d="M43 21 Q47.4 24.6 45.4 31 Q44 34.6 41.6 37 Q43.6 31 43 21 Z" fill={C.redLight} />
    <path d="M36 16.6 Q40.6 12 46 15 Q47.6 19 43 20.4 Q38.4 20.6 36 16.6 Z" fill={C.green} />
    <path d="M42 15 Q42 8 47 6 L48.4 7.8 Q44.4 9.8 44.6 15.2 Z" fill={C.greenDark} />
  {:else if stage === 'e17'}
    <!-- Verbinden: Bogenbrücke über den Fluss (Trường Tiền) -->
    <ellipse cx="32" cy="48" rx="26" ry="6.4" fill={C.sea} />
    <rect x="16" y="47" width="10" height="1.6" rx="0.8" fill={C.cream} opacity="0.7" />
    <rect x="38" y="50" width="12" height="1.6" rx="0.8" fill={C.cream} opacity="0.7" />
    {#each [3.6, 30.5, 57.4] as x (x)}
      <rect {x} y="40" width="3" height="8" fill={C.metalShade} />
    {/each}
    {#each [5, 32] as x0 (x0)}
      <path d="M{x0} 38 Q{x0 + 13.5} 8 {x0 + 27} 38 H{x0 + 23.5} Q{x0 + 13.5} 15 {x0 + 3.5} 38 Z" fill={C.metal} />
      <path d="M{x0} 38 Q{x0 + 4} 28 {x0 + 8} 25 Q{x0 + 6} 30.4 {x0 + 3.5} 38 Z" fill={C.metalShade} />
    {/each}
    {#each STRUTS as s (s.x)}
      <rect x={s.x - 0.6} y={s.y} width="1.2" height={38 - s.y} fill={C.metal} />
    {/each}
    <rect x="3" y="37.6" width="58" height="3.2" rx="1.2" fill={C.metalShade} />
  {:else if stage === 'e18'}
    <!-- Nehmen & Geben: rote Glücksumschläge (lì xì) -->
    <ellipse cx="32" cy="56" rx="18" ry="2.6" fill={C.shadow} />
    <g transform="rotate(14 40 34)">
      <rect x="28" y="14" width="24" height="36" rx="3" fill={C.redDeep} />
      <circle cx="40" cy="35" r="5" fill={C.gold} />
    </g>
    <g transform="rotate(-8 28 36)">
      <rect x="15" y="16" width="26" height="38" rx="3" fill={C.red} />
      <path d="M18 16 H21 V54 H18 Q15 54 15 51 V19 Q15 16 18 16 Z" fill={C.redDeep} />
      <path d="M15 22 L28 30 L41 22 V19 Q41 16 38 16 H18 Q15 16 15 19 Z" fill={C.redDeep} />
      <circle cx="28" cy="39" r="6.5" fill={C.yellow} />
      <circle cx="28" cy="39" r="3.8" fill={C.red} />
      <circle cx="28" cy="39" r="1.8" fill={C.yellow} />
    </g>
  {:else if stage === 'e19'}
    <!-- Körper & Gesundheit: Trinkkokosnuss mit Halm -->
    <ellipse cx="32" cy="57" rx="15" ry="2.6" fill={C.shadow} />
    <path d="M14 37 Q14 56 32 56 Q50 56 50 37 Q50 28 42 24 H22 Q14 28 14 37 Z" fill={C.green} />
    <path d="M14 37 Q14 56 32 56 Q22 53 21 37 Q21 29 26 24 H22 Q14 28 14 37 Z" fill={C.greenDark} />
    <path d="M22 24 L32 13 L42 24 Z" fill={C.cream} />
    <path d="M22 24 L32 13 L29.6 24 Z" fill={C.creamShade} />
    <path d={bar(33, 16, 42, 3, 3)} fill={C.cream} />
    <path d={bar(36, 11.66, 38.6, 7.9, 3)} fill={C.red} />
    <path d={bar(39.8, 6.2, 41.4, 3.9, 3)} fill={C.red} />
  {:else if stage === 'e20'}
    <!-- Dinge im Alltag: Thermoskanne mit Blumen (phích) -->
    <ellipse cx="32" cy="57" rx="14" ry="2.6" fill={C.shadow} />
    <path d="M41 22 H46 Q49.4 22 49.4 25.4 V39.6 Q49.4 43 46 43 H41 V39.6 H45.6 V25.4 H41 Z" fill={C.metalShade} />
    <rect x="22" y="17" width="20" height="34" rx="3" fill={C.red} />
    <path d="M25 17 H28 V51 H25 Q22 51 22 48 V20 Q22 17 25 17 Z" fill={C.redDeep} />
    {#each [{ cx: 35, cy: 29 }, { cx: 30, cy: 40 }] as { cx, cy } (cx)}
      {#each petals(cx, cy) as p, i (i)}
        <circle cx={p.x} cy={p.y} r="1.9" fill={C.cream} />
      {/each}
      <circle {cx} {cy} r="1.4" fill={C.yellow} />
    {/each}
    <rect x="21" y="48" width="22" height="7" rx="2" fill={C.metalShade} />
    <rect x="21" y="48" width="22" height="2.2" fill={C.metal} />
    <rect x="23.5" y="11" width="17" height="7" rx="2" fill={C.metal} />
    <rect x="23.5" y="11" width="4" height="7" fill={C.metalShade} />
    <rect x="26" y="6" width="12" height="6" rx="2.6" fill={C.redDeep} />
    <rect x="30" y="3.6" width="4" height="3" rx="1.2" fill={C.ink} />
  {:else if stage === 'e21'}
    <!-- Lernen & Arbeiten: Schulheft und Bleistift -->
    <ellipse cx="32" cy="57" rx="20" ry="2.4" fill={C.shadow} />
    <g transform="rotate(-10 30 34)">
      <rect x="17" y="13" width="31" height="40" rx="3" fill={C.cream} />
      <rect x="13" y="15" width="32" height="40" rx="3" fill={C.blueDark} />
      <rect x="15" y="13" width="32" height="40" rx="3" fill={C.blue} />
      <path d="M18 13 H21 V53 H18 Q15 53 15 50 V16 Q15 13 18 13 Z" fill={C.blueDark} />
      <rect x="24" y="20" width="18" height="11" rx="2" fill={C.cream} />
      <rect x="27" y="23.4" width="12" height="1.6" rx="0.8" fill={C.creamShade} />
      <rect x="27" y="26.6" width="8" height="1.6" rx="0.8" fill={C.creamShade} />
    </g>
    <g transform="rotate(-42 38 40)">
      <rect x="20" y="37.8" width="32" height="4.4" fill={C.yellow} />
      <rect x="20" y="40" width="32" height="2.2" fill={C.gold} />
      <rect x="17" y="37.8" width="3.4" height="4.4" fill={C.metalShade} />
      <path d="M13.6 37.8 H17 V42.2 H13.6 Q12.4 42.2 12.4 40 Q12.4 37.8 13.6 37.8 Z" fill={C.lotus} />
      <path d="M52 37.8 L58.6 40 L52 42.2 Z" fill={C.woodLight} />
      <path d="M56.2 39.2 L58.6 40 L56.2 40.8 Z" fill={C.ink} />
    </g>
  {:else if stage === 'e22'}
    <!-- Sprache & Ausdruck: Kalligrafie-Rolle und Pinsel -->
    <ellipse cx="32" cy="58" rx="16" ry="2.4" fill={C.shadow} />
    <rect x="18" y="12" width="20" height="40" fill={C.red} />
    <rect x="18" y="12" width="3" height="40" fill={C.redDeep} />
    <rect x="15" y="9.6" width="26" height="3.2" rx="1.6" fill={C.woodDark} />
    <rect x="15" y="51" width="26" height="3.4" rx="1.7" fill={C.woodDark} />
    <path d="M22 20.4 Q28 17.4 35 18.6 Q35.8 20.6 34 21.2 Q28.4 20.4 23.2 22.6 Q21.4 22.2 22 20.4 Z" fill={C.ink} />
    <path d="M28.6 20.6 Q30.8 30 29.8 39.6 Q29.2 45 24.8 46.2 Q23.4 45.8 24.4 44.6 Q27 42.2 27.2 38 Q27.6 30 26.4 21.6 Z" fill={C.ink} />
    <circle cx="33.6" cy="34" r="1.9" fill={C.ink} />
    <g transform="rotate(32 47 34)">
      <rect x="45" y="12" width="3.6" height="30" rx="1.8" fill={C.woodLight} />
      <rect x="45" y="12" width="1.4" height="30" rx="0.7" fill={C.wood} />
      <rect x="44.6" y="40" width="4.4" height="3.4" rx="1" fill={C.woodDark} />
      <path d="M44.8 43 H48.8 Q49.4 49.6 46.8 54 Q44.2 49.6 44.8 43 Z" fill={C.ink} />
    </g>
  {:else if stage === 'e23'}
    <!-- Wann & wie oft: Wecker -->
    <ellipse cx="32" cy="57" rx="16" ry="2.4" fill={C.shadow} />
    <path d={bar(23, 47, 19, 55.4, 3)} fill={C.ink} />
    <path d={bar(41, 47, 45, 55.4, 3)} fill={C.ink} />
    <circle cx="19" cy="17" r="6.4" fill={C.metalShade} />
    <circle cx="45" cy="17" r="6.4" fill={C.metal} />
    <rect x="30.6" y="10" width="2.8" height="8" rx="1.2" fill={C.ink} />
    <circle cx="30.5" cy="36.5" r="17" fill={C.redDeep} />
    <circle cx="32" cy="35" r="17" fill={C.red} />
    <circle cx="32" cy="35" r="13" fill={C.cream} />
    <rect x="31" y="23.6" width="2" height="3.4" rx="1" fill={C.ink} />
    <rect x="31" y="43" width="2" height="3.4" rx="1" fill={C.ink} />
    <rect x="20.6" y="34" width="3.4" height="2" rx="1" fill={C.ink} />
    <rect x="40" y="34" width="3.4" height="2" rx="1" fill={C.ink} />
    <path d={bar(32, 35, 32, 26.5, 2.2)} fill={C.ink} />
    <path d={bar(32, 35, 38.5, 38.5, 2.2)} fill={C.ink} />
    <circle cx="32" cy="35" r="1.8" fill={C.red} />
  {:else if stage === 'e24'}
    <!-- Zuhause: schmales Röhrenhaus mit Balkon -->
    <ellipse cx="32" cy="57.6" rx="17" ry="2.2" fill={C.shadow} />
    <rect x="18" y="10" width="28" height="47" fill={C.sea} />
    <rect x="18" y="10" width="4" height="47" fill={C.seaDark} />
    <rect x="16.5" y="7.6" width="31" height="4" rx="1" fill={C.cream} />
    <rect x="25" y="14.6" width="6" height="9" rx="1" fill={C.green} />
    <rect x="33" y="14.6" width="6" height="9" rx="1" fill={C.green} />
    <rect x="17" y="26" width="30" height="2.4" fill={C.cream} />
    <rect x="26" y="29" width="12" height="12" rx="1" fill={C.woodDark} />
    {#each [22.5, 41.5] as x (x)}
      <circle cx={x} cy="33.4" r="3.2" fill={C.green} />
      <rect x={x - 2} y="35.4" width="4" height="3.4" fill={C.redDeep} />
    {/each}
    <rect x="20" y="36" width="24" height="1.6" fill={C.ink} />
    {#each [21, 25, 29, 33, 37, 41] as x (x)}
      <rect {x} y="36" width="1.2" height="5" fill={C.ink} />
    {/each}
    <rect x="17" y="41" width="30" height="2.4" fill={C.cream} />
    <rect x="21" y="43.4" width="22" height="2.6" fill={C.red} />
    <rect x="23" y="46" width="18" height="11" fill={C.metal} />
    {#each [48.4, 51.4, 54.4] as y (y)}
      <rect x="23" {y} width="18" height="1" fill={C.metalShade} />
    {/each}
  {:else if stage === 'e25'}
    <!-- Tun & Lassen: Gießkanne über einem Setzling -->
    <ellipse cx="32" cy="57" rx="22" ry="2.4" fill={C.shadow} />
    <path d="M9 47 H21 L19.6 56 H10.4 Z" fill={C.redDeep} />
    <path d="M15 47 Q14 40 9 38 Q15 37.6 16 44 Q17 38 22 37 Q18 40.6 16.4 47 Z" fill={C.green} />
    {#each [{ x: 14, y: 30 }, { x: 18, y: 33 }, { x: 11, y: 34.4 }] as { x, y }, i (i)}
      <path d={drop(x, y, 1.4, 3.4)} fill={C.blue} />
    {/each}
    <path d="M30 14 Q30 9 36 9 H44 Q50 9 50 14 V20 H46.4 V14 Q46.4 12.6 44 12.6 H36 Q33.6 12.6 33.6 14 V20 H30 Z" fill={C.seaDark} />
    <path d="M28 19 H52 L50 46 H30 Z" fill={C.sea} />
    <path d="M28 19 H33 L34 46 H30 Z" fill={C.seaDark} />
    <path d={bar(30, 40, 16, 25, 3.6)} fill={C.sea} />
    <path d="M12 21 L19 24 L16 30 Z" fill={C.seaDark} />
    <rect x="27" y="17.6" width="26" height="3" rx="1.4" fill={C.seaDark} />
  {:else if stage === 'e26'}
    <!-- Werkeln & Ordnen: Holzkiste und Hammer -->
    <ellipse cx="30" cy="57" rx="23" ry="2.4" fill={C.shadow} />
    <rect x="8" y="34" width="34" height="22" rx="1.5" fill={C.woodLight} />
    <rect x="8" y="34" width="4" height="22" fill={C.wood} />
    <rect x="8" y="41" width="34" height="1.4" fill={C.wood} />
    <rect x="8" y="48" width="34" height="1.4" fill={C.wood} />
    <rect x="7" y="33" width="36" height="2.6" rx="1" fill={C.wood} />
    <rect x="16.4" y="27" width="1.6" height="7" fill={C.metalShade} />
    <rect x="15" y="26" width="4.4" height="1.8" rx="0.8" fill={C.metalShade} />
    <rect x="24.4" y="29" width="1.6" height="5" fill={C.metalShade} />
    <rect x="23" y="28" width="4.4" height="1.8" rx="0.8" fill={C.metalShade} />
    <g transform="rotate(28 48 34)">
      <rect x="46" y="22" width="4.4" height="34" rx="2.2" fill={C.woodDark} />
      <rect x="38" y="15" width="20" height="8" rx="1.6" fill={C.metalShade} />
      <rect x="38" y="15" width="20" height="2.8" rx="1.2" fill={C.metal} />
    </g>
  {:else if stage === 'e27'}
    <!-- Wetter & Jahreszeiten: Sonne hinter einer Regenwolke -->
    <circle cx="41" cy="20" r="14" fill={C.yellow} opacity="0.35" />
    <circle cx="41" cy="20" r="9.6" fill={C.yellow} />
    {#each [{ x: 18, y: 45 }, { x: 28, y: 48 }, { x: 38, y: 45 }, { x: 23, y: 53 }, { x: 33, y: 54 }] as { x, y }, i (i)}
      <path d={drop(x, y, 2, 5)} fill={C.blue} />
    {/each}
    <path d="M14 40 Q8 40 8 34 Q8 28 15 28 Q16 20 25 20 Q32 20 34 26 Q36 24 40 24 Q47 24 47 31 Q53 31 53 36 Q53 40 48 40 Z" fill={C.metalShade} transform="translate(-1.6 1.6)" />
    <path d="M14 40 Q8 40 8 34 Q8 28 15 28 Q16 20 25 20 Q32 20 34 26 Q36 24 40 24 Q47 24 47 31 Q53 31 53 36 Q53 40 48 40 Z" fill={C.metal} />
  {:else if stage === 'e28'}
    <!-- Natur & Farben: Kokospalme auf einer Sandbank -->
    <ellipse cx="32" cy="54" rx="21" ry="4.6" fill={C.creamShade} />
    <ellipse cx="33" cy="53" rx="19" ry="3.8" fill={C.cream} />
    <path d="M28 54 Q27 38 35 22 L38 23.4 Q31.5 38 32.5 54 Z" fill={C.woodLight} />
    <path d="M28 54 Q27 38 35 22 L36 22.5 Q29.4 38 29.8 54 Z" fill={C.wood} />
    {#each [{ x1: 28.3, y1: 48, x2: 32.5, y2: 48.3 }, { x1: 28.5, y1: 42, x2: 32.6, y2: 42.6 }, { x1: 29.6, y1: 36, x2: 33.6, y2: 37 }, { x1: 31.6, y1: 30, x2: 35.4, y2: 31.4 }] as r, i (i)}
      <path d={bar(r.x1, r.y1, r.x2, r.y2, 1.2)} fill={C.wood} />
    {/each}
    <path d="M37 22 Q24 21 14 32 Q26 25 37 22 Z" fill={C.greenDark} />
    <path d="M37 22 Q27 9 12 13 Q28 15 37 22 Z" fill={C.greenDark} />
    <path d="M37 22 Q38 9 47 5 Q41 13 37 22 Z" fill={C.green} />
    <path d="M37 22 Q48 11 60 18 Q48 17 37 22 Z" fill={C.green} />
    <path d="M37 22 Q51 21 57 34 Q48 25 37 22 Z" fill={C.green} />
    <circle cx="35" cy="25" r="2.6" fill={C.wood} />
    <circle cx="39.4" cy="25.4" r="2.6" fill={C.woodDark} />
  {:else if stage === 'e29'}
    <!-- Reisen: Koffer mit Riemen und Anhänger -->
    <ellipse cx="32" cy="57" rx="20" ry="2.4" fill={C.shadow} />
    <path d="M26 18 V13 Q26 10 29 10 H37 Q40 10 40 13 V18 H36.6 V13.4 H29.4 V18 Z" fill={C.ink} />
    <rect x="10.4" y="19.6" width="42" height="35" rx="5" fill={C.seaDark} />
    <rect x="12" y="18" width="42" height="35" rx="5" fill={C.sea} />
    <rect x="21" y="18" width="4" height="35" fill={C.woodDark} />
    <rect x="41" y="18" width="4" height="35" fill={C.woodDark} />
    <path d="M28 33 L33 26 L38 33 Z" fill={C.yellow} />
    <rect x="27" y="38" width="12" height="2.4" rx="1.2" fill={C.cream} />
    <path d={bar(47, 21, 50, 29, 1)} fill={C.ink} />
    <rect x="47" y="28" width="7" height="9" rx="1.4" fill={C.red} transform="rotate(-12 50.5 32.5)" />
  {:else if stage === 'e30'}
    <!-- Stark & schwach: Bambus, biegsam und fest -->
    <ellipse cx="32" cy="58" rx="16" ry="2.2" fill={C.shadow} />
    {#each [{ x: 22, top: 14, rot: -6 }, { x: 33, top: 8, rot: 0 }, { x: 43, top: 20, rot: 8 }] as c (c.x)}
      <g transform="rotate({c.rot} {c.x} 58)">
        <rect x={c.x - 2.6} y={c.top} width="5.2" height={58 - c.top} rx="2" fill={c.x === 33 ? C.green : C.leaf} />
        <rect x={c.x - 2.6} y={c.top} width="2" height={58 - c.top} rx="1" fill={C.greenDark} />
        {#each [0, 1, 2, 3, 4] as k (k)}
          {#if c.top + 9 + k * 10 < 56}
            <rect x={c.x - 3.2} y={c.top + 9 + k * 10} width="6.4" height="1.6" rx="0.8" fill={C.greenDark} />
          {/if}
        {/each}
      </g>
    {/each}
    <path d="M33 18 Q42 9 54 12 Q43 15 33 18 Z" fill={C.green} />
    <path d="M33 26 Q41 23 49 28 Q40 28 33 26 Z" fill={C.leaf} />
    <path d="M22 24 Q14 16 6 18 Q14 22 22 24 Z" fill={C.greenDark} />
  {:else if stage === 'e31'}
    <!-- Feiern & Liebe: Sternlaterne zum Mondfest -->
    <ellipse cx="38" cy="57" rx="14" ry="2.4" fill={C.shadow} />
    <path d={bar(30, 30, 50, 57, 2.4)} fill={C.woodLight} />
    <path d={starPath(-1.6, 1.6)} fill={C.redDeep} />
    <path d={starPath()} fill={C.red} />
    {#each STAR_FACETS as d, i (i)}
      <path {d} fill={C.redLight} />
    {/each}
    <circle cx="28" cy="26" r="4.6" fill={C.yellow} />
    {#each [STAR[4]!, STAR[6]!] as [x, y], i (i)}
      <path d="M{x - 1.6} {y} H{x + 1.6} L{x + 1} {y + 7} H{x - 1} Z" fill={C.yellow} />
    {/each}
  {:else if stage === 'e32'}
    <!-- Ärger & Streit: Kessel, der überkocht -->
    <ellipse cx="32" cy="57.4" rx="19" ry="2.4" fill={C.shadow} />
    <path d="M20 33 Q20 18 32 18 Q44 18 44 33 H41 Q41 21.4 32 21.4 Q23 21.4 23 33 Z" fill={C.ink} />
    <path d="M49 44 L57 33 L60 35 L53 49 Z" fill={C.metalShade} />
    <path d="M14 55 Q12 38 22 32 H42 Q52 38 50 55 Z" fill={C.metal} />
    <path d="M14 55 Q12 38 22 32 H26 Q19 40 20 55 Z" fill={C.metalShade} />
    <rect x="13" y="53" width="38" height="3" rx="1.4" fill={C.ink} />
    <g transform="rotate(-14 32 31) translate(0 -3)">
      <path d="M21 32 Q32 24 43 32 Z" fill={C.metalShade} />
      <circle cx="32" cy="26.4" r="2.4" fill={C.ink} />
    </g>
    {#each [{ cx: 59, cy: 27, r: 3 }, { cx: 62, cy: 21, r: 2.2 }, { cx: 20, cy: 21, r: 3.2 }, { cx: 15, cy: 15, r: 2.6 }, { cx: 11, cy: 9.6, r: 2 }] as { cx, cy, r }, i (i)}
      <circle {cx} {cy} {r} fill={C.metal} />
    {/each}
  {:else if stage === 'e33'}
    <!-- Wie im Film: Filmklappe -->
    <ellipse cx="32" cy="57" rx="21" ry="2.4" fill={C.shadow} />
    <rect x="9.6" y="28.6" width="44" height="27" rx="2.5" fill={C.redDeep} />
    <rect x="11" y="27" width="44" height="27" rx="2.5" fill={C.red} />
    <rect x="16" y="35" width="18" height="2.4" rx="1.2" fill={C.cream} />
    <rect x="16" y="41" width="26" height="2.4" rx="1.2" fill={C.cream} opacity="0.7" />
    <rect x="16" y="47" width="12" height="2.4" rx="1.2" fill={C.cream} opacity="0.7" />
    <rect x="11" y="21" width="44" height="6" fill={C.ink} />
    {#each [0, 1, 2, 3, 4] as k (k)}
      <path d="M{15 + k * 9} 21 h4.6 l-3 6 h-4.6 Z" fill={C.cream} />
    {/each}
    <g transform="rotate(-20 11 20)">
      <rect x="11" y="14" width="44" height="6" rx="1" fill={C.ink} />
      {#each [0, 1, 2, 3, 4] as k (k)}
        <path d="M{13 + k * 9} 14 h4.6 l3 6 h-4.6 Z" fill={C.cream} />
      {/each}
    </g>
    <circle cx="12.4" cy="20.4" r="2" fill={C.metalShade} />
  {/if}
</svg>

<style>
  .vignette {
    display: block;
    overflow: visible;
  }
  .disc {
    fill: var(--disc);
  }
</style>
