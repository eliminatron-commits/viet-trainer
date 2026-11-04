<script lang="ts">
  import Scene from './Scene.svelte';

  /**
   * Sài Gòn: Skyline am Saigon-Fluss mit Lotusknospen-Turm und Stufenturm, ein Baukran, Fähre, Palmen.
   * Aufbau: Fluss steigt, die Türme wachsen aus dem Boden, der Kran ploppt auf, die Fähre gleitet herein.
   * Leben: Kranarm schwenkt, Fähre und Boote treiben, Palmen wiegen sich, Wellenlichter glitzern.
   */
  let { label = 'Skyline von Sài Gòn am Fluss' }: { label?: string } = $props();

  const C = {
    sky: '#FDE6CF',
    cloud: '#FFF4E6',
    sun: '#FFCD00',
    sunHalo: '#FFE58A',
    far: '#C9D6E3',
    glass: '#8FB8C9',
    glassShade: '#6E9AAF',
    cream: '#F3E3C3',
    creamShade: '#D8BF94',
    river: '#2B9DB3',
    riverLight: '#8FD3D9',
    red: '#DA251D',
    palm: '#4E9E8F',
    palmShade: '#3B7F73',
  };
  const BANK = 184;

  /** Mittelhohe Blöcke: x, Breite, Oberkante, Glas oder Stein. */
  const blocks = [
    [8, 34, 132, 'cream'],
    [44, 30, 112, 'glass'],
    [182, 36, 124, 'cream'],
    [222, 26, 140, 'glass'],
    [292, 34, 118, 'cream'],
    [356, 40, 136, 'glass'],
  ] as const;
</script>

{#snippet palmTree(x: number, s: number, d: number)}
  <g transform="translate({x} 258) scale({s})">
    <path d="M-3 0 Q-6 -30 2 -58 L6 -58 Q0 -30 3 0 Z" fill={C.creamShade} />
    <g transform="translate(4 -58)">
      <g class="loop-sway origin-bottom" style="--t: 3.6s; --d: {d}s; --rot: 4">
        <path d="M0 0 Q-20 -14 -38 -4 Q-20 -8 0 4 Z" fill={C.palmShade} />
        <path d="M0 0 Q-14 -24 -30 -26 Q-14 -18 0 4 Z" fill={C.palmShade} />
        <path d="M0 0 Q20 -14 38 -4 Q20 -8 0 4 Z" fill={C.palm} />
        <path d="M0 0 Q14 -24 30 -26 Q14 -18 0 4 Z" fill={C.palm} />
        <path d="M0 2 Q2 -20 -4 -34 Q6 -20 4 2 Z" fill={C.palm} />
        <circle cx="0" cy="2" r="4" fill={C.creamShade} />
      </g>
    </g>
  </g>
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />

  <g class="in in-rise" style="--e: 120">
    <g class="loop-breathe" style="--t: 4.8s; --s: 1.1"><circle cx="336" cy="50" r="40" fill={C.sunHalo} /></g>
    <circle cx="336" cy="50" r="25" fill={C.sun} />
  </g>
  <g class="in in-left" style="--e: 160">
    <g class="loop-drift" style="--t: 24s; --dx: 18">
      <path d="M30 50 C32 42 46 40 50 46 C54 38 70 40 70 52 C78 52 80 62 70 62 L34 62 C24 62 22 52 30 50 Z" fill={C.cloud} />
    </g>
  </g>
  <g class="in in-right" style="--e: 220">
    <g class="loop-drift" style="--t: 34s; --dx: 14; --d: -7s">
      <path d="M200 30 C202 22 214 20 218 26 C222 20 234 22 234 30 C240 30 242 38 234 38 L204 38 C196 38 194 30 200 30 Z" fill={C.cloud} />
    </g>
  </g>

  <!-- ferne Stadt -->
  <g class="in in-rise" style="--e: 40">
    <path d="M0 {BANK} L0 150 L22 150 L22 138 L40 138 L40 156 L70 156 L70 130 L96 130 L96 146 L120 146 L120 160 L170 160 L170 136 L196 136 L196 150 L230 150 L230 128 L250 128 L250 146 L286 146 L286 134 L312 134 L312 152 L340 152 L340 140 L372 140 L372 154 L400 154 L400 {BANK} Z" fill={C.far} />
  </g>

  <!-- Blöcke wachsen aus dem Boden -->
  {#each blocks as [x, w, top, kind], i (x)}
    <g class="in in-grow" style="--e: {120 + i * 50}">
      <rect {x} y={top} width={w} height={BANK - top} fill={kind === 'glass' ? C.glass : C.cream} />
      <rect {x} y={top} width={w * 0.34} height={BANK - top} fill={kind === 'glass' ? C.glassShade : C.creamShade} />
      {#each { length: Math.floor((BANK - top - 10) / 12) } as _, r (r)}
        <rect x={x + w * 0.42} y={top + 8 + r * 12} width={w * 0.5} height="3" fill={C.cloud} />
      {/each}
    </g>
  {/each}

  <!-- Stufenturm -->
  <g class="in in-grow" style="--e: 300">
    <rect x="124" y="70" width="40" height={BANK - 70} fill={C.glass} />
    <rect x="124" y="70" width="14" height={BANK - 70} fill={C.glassShade} />
    <rect x="130" y="48" width="28" height="24" fill={C.glass} />
    <rect x="130" y="48" width="10" height="24" fill={C.glassShade} />
    <rect x="136" y="30" width="16" height="20" fill={C.glass} />
    <rect x="136" y="30" width="6" height="20" fill={C.glassShade} />
    <rect x="143" y="12" width="2" height="20" fill={C.glassShade} />
    {#each { length: 9 } as _, r (r)}<rect x="142" y={80 + r * 11} width="18" height="3" fill={C.cloud} />{/each}
  </g>

  <!-- Lotusknospen-Turm mit Landeplattform -->
  <g class="in in-grow" style="--e: 380">
    <path d="M250 {BANK} L254 84 Q262 52 270 84 L274 {BANK} Z" fill={C.cream} />
    <path d="M250 {BANK} L254 84 Q258 66 262 60 Q259 80 260 {BANK} Z" fill={C.creamShade} />
    <ellipse cx="276" cy="96" rx="15" ry="4" fill={C.red} />
    <rect x="262" y="96" width="8" height="4" fill={C.creamShade} />
    {#each { length: 7 } as _, r (r)}<rect x="263" y={110 + r * 10} width="9" height="2.5" fill={C.cloud} />{/each}
  </g>

  <!-- Baukran: Arm schwenkt langsam -->
  <g class="in in-grow" style="--e: 520">
    <rect x="194" y="70" width="5" height={BANK - 70} fill={C.sun} />
    {#each { length: 9 } as _, r (r)}<rect x="194" y={78 + r * 12} width="5" height="2" fill={C.creamShade} />{/each}
  </g>
  <g class="in in-pop" style="--e: 760">
    <g class="loop-sway" style="--t: 6s; --rot: 7; transform-origin: 36% 50%">
      <rect x="166" y="66" width="80" height="5" fill={C.sun} />
      <rect x="168" y="71" width="12" height="8" fill={C.creamShade} />
      <rect x="232" y="71" width="1.5" height="30" fill={C.palmShade} />
      <rect x="228" y="100" width="10" height="7" fill={C.red} />
    </g>
  </g>

  <!-- Fluss -->
  <g class="in in-rise" style="--e: 0">
    <rect x="0" y={BANK} width="400" height="56" fill={C.river} />
    <g class="loop-shimmer" style="--t: 3s"><ellipse cx="80" cy="196" rx="28" ry="2" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 3.5s; --d: -1.6s; --dx: -12"><ellipse cx="250" cy="206" rx="34" ry="2.2" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 2.7s; --d: -0.8s"><ellipse cx="360" cy="194" rx="22" ry="1.8" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 3.2s; --d: -2.2s; --dx: -8"><ellipse cx="170" cy="226" rx="26" ry="2" fill={C.riverLight} /></g>
  </g>

  <!-- Fähre gleitet herein -->
  <g class="in in-left" style="--e: 460">
    <g class="loop-drift" style="--t: 22s; --dx: 60">
      <g transform="translate(150 212)">
        <ellipse cx="0" cy="7" rx="54" ry="4" fill={C.riverLight} />
        <g class="loop-bob" style="--t: 2.9s; --rot: 1.5; --amp: 2">
          <g>
            <rect x="-26" y="-22" width="44" height="12" rx="2" fill={C.cloud} />
            <rect x="-26" y="-22" width="14" height="12" rx="2" fill={C.cream} />
            {#each [-8, 2, 12] as wx (wx)}<rect x={wx - 3} y="-19" width="6" height="5" fill={C.glassShade} />{/each}
            <path d="M-46 -10 L44 -10 Q40 2 30 4 L-36 4 Q-44 2 -46 -10 Z" fill={C.red} />
            <rect x="-42" y="-10" width="84" height="3" fill={C.cloud} />
          </g>
        </g>
      </g>
    </g>
  </g>
  <g class="in in-right" style="--e: 560">
    <g transform="translate(320 228) scale(0.6)">
      <g class="loop-bob" style="--t: 2.4s; --d: -1s; --rot: 4">
        <path d="M-30 -6 L30 -6 Q26 4 18 6 L-18 6 Q-26 4 -30 -6 Z" fill={C.creamShade} />
        <path d="M-6 -6 L-6 -26 L14 -8 Z" fill={C.cloud} />
      </g>
    </g>
  </g>

  <!-- Uferpromenade mit Palmen -->
  <g class="in in-rise" style="--e: 240">
    <path d="M0 238 L400 236 L400 260 L0 260 Z" fill={C.cream} />
    <rect x="0" y="236" width="400" height="4" fill={C.creamShade} />
  </g>
  <g class="in in-rise" style="--e: 420">{@render palmTree(26, 1.25, 0)}</g>
  <g class="in in-rise" style="--e: 500">{@render palmTree(380, 1.1, -1.4)}</g>
</Scene>
