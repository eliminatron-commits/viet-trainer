<script lang="ts">
  import Scene from './Scene.svelte';

  /**
   * Huế: die Thiên-Mụ-Pagode auf dem Hügel am Parfümfluss, ein Drachenboot, Lotus im Vordergrund.
   * Aufbau: Fluss steigt, der Turm wächst Stockwerk um Stockwerk, das Drachenboot gleitet herein, Lotus blüht auf.
   * Leben: Boot treibt und schaukelt, Wimpel flattert, Lotusblüten wiegen sich, Vögel queren.
   */
  let { label = 'Thiên-Mụ-Pagode am Parfümfluss in Huế' }: { label?: string } = $props();

  const C = {
    sky: '#FDE6CF',
    cloud: '#FFF4E6',
    sun: '#FFCD00',
    sunHalo: '#FFE58A',
    far: '#C5D6D4',
    hill: '#6FAE86',
    hillShade: '#4F8E68',
    stone: '#F3E3C3',
    stoneShade: '#D8BF94',
    tile: '#B5442C',
    river: '#3FA7B5',
    riverLight: '#8FD3D9',
    red: '#DA251D',
    lotus: '#F6A5B8',
  };

  /** Sieben Stockwerke des Phước-Duyên-Turms, von unten nach oben. */
  const TOWER_X = 96;
  const tiers = (() => {
    const out: { x: number; y: number; w: number; h: number }[] = [];
    let y = 158;
    for (let i = 0; i < 7; i++) {
      const w = 40 - i * 4.4;
      const h = 14 - i * 0.9;
      y -= h + 3;
      out.push({ x: TOWER_X - w / 2, y, w, h });
    }
    return out;
  })();
</script>

{#snippet pine(x: number, y: number, s: number)}
  <g transform="translate({x} {y}) scale({s})">
    <path d="M0 -34 L11 -16 L6 -16 L14 0 L-14 0 L-6 -16 L-11 -16 Z" fill={C.hill} />
    <path d="M0 -34 L0 0 L-14 0 L-6 -16 L-11 -16 Z" fill={C.hillShade} />
  </g>
{/snippet}

{#snippet lotusFlower(x: number, y: number, s: number, d: number)}
  <g transform="translate({x} {y}) scale({s})">
    <g class="loop-sway origin-bottom" style="--t: 3.4s; --d: {d}s; --rot: 5">
      <rect x="-1" y="-6" width="2" height="16" fill={C.hillShade} />
      <path d="M0 -4 Q-15 -8 -15 -18 Q-5 -14 0 -4 Z" fill={C.lotus} />
      <path d="M0 -4 Q15 -8 15 -18 Q5 -14 0 -4 Z" fill={C.cloud} />
      <path d="M0 -26 Q8 -14 0 -4 Q-8 -14 0 -26 Z" fill={C.lotus} />
      <path d="M0 -26 Q8 -14 0 -4 Z" fill={C.cloud} />
    </g>
  </g>
{/snippet}

{#snippet leaf(x: number, y: number, rx: number)}
  <ellipse cx={x - 3} cy={y + 2.5} {rx} ry={rx * 0.36} fill={C.hillShade} />
  <ellipse cx={x} cy={y} {rx} ry={rx * 0.36} fill={C.hill} />
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />

  <g class="in in-rise" style="--e: 160">
    <g class="loop-breathe" style="--t: 5s; --s: 1.1"><circle cx="330" cy="58" r="44" fill={C.sunHalo} /></g>
    <circle cx="330" cy="58" r="28" fill={C.sun} />
  </g>
  <g class="in in-left" style="--e: 120">
    <g class="loop-drift" style="--t: 28s; --dx: 20">
      <path d="M180 46 C182 38 196 36 200 42 C204 34 220 36 220 48 C228 48 230 58 220 58 L184 58 C174 58 172 48 180 46 Z" fill={C.cloud} />
    </g>
  </g>
  <g class="in in-right" style="--e: 200">
    <g class="loop-drift" style="--t: 36s; --dx: 16; --d: -12s">
      <path d="M28 70 C30 62 42 60 46 66 C50 60 62 62 62 70 C68 70 70 78 62 78 L32 78 C24 78 22 70 28 70 Z" fill={C.cloud} />
    </g>
  </g>
  <g class="loop-cross" style="--t: 17s; --d: -6s; --dist: 520px">
    <g transform="translate(-50 96) scale(0.7)">
      <g class="loop-flap"><path d="M0 0 Q6 -7 12 0 Q18 -7 24 0 Q18 -3 12 3 Q6 -3 0 0 Z" fill={C.hillShade} /></g>
    </g>
  </g>

  <!-- ferne Hügel des Hương-Tals -->
  <g class="in in-rise" style="--e: 60">
    <path d="M0 166 C30 150 60 146 90 156 C120 166 150 140 190 146 C230 152 260 160 300 150 C340 140 370 152 400 156 L400 190 L0 190 Z" fill={C.far} />
  </g>

  <!-- Fluss -->
  <g class="in in-rise" style="--e: 0">
    <rect x="0" y="184" width="400" height="76" fill={C.river} />
    <g class="loop-shimmer" style="--t: 3.2s"><ellipse cx="200" cy="196" rx="30" ry="2" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 2.8s; --d: -1.3s; --dx: -12"><ellipse cx="340" cy="190" rx="24" ry="1.8" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 3.6s; --d: -0.5s"><ellipse cx="90" cy="214" rx="28" ry="2" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 3s; --d: -2s; --dx: -8"><ellipse cx="300" cy="226" rx="26" ry="2" fill={C.riverLight} /></g>
  </g>

  <!-- Hügel mit Pinien am linken Ufer -->
  <g class="in in-rise" style="--e: 120">
    <path d="M-10 188 C10 170 40 158 80 156 C120 154 150 164 176 178 L192 188 Z" fill={C.hill} />
    <path d="M-10 188 C10 170 40 158 70 156.5 C50 162 32 174 22 188 Z" fill={C.hillShade} />
    {@render pine(30, 174, 1)}
    {@render pine(150, 172, 0.9)}
    {@render pine(170, 180, 0.7)}
  </g>

  <!-- Der Turm wächst Stockwerk um Stockwerk -->
  {#each tiers as t, i (i)}
    <g class="in in-pop origin-bottom" style="--e: {320 + i * 70}">
      <rect x={t.x} y={t.y} width={t.w} height={t.h} fill={C.stone} />
      <rect x={t.x} y={t.y} width={t.w * 0.38} height={t.h} fill={C.stoneShade} />
      <path d="M{TOWER_X - 2.4} {t.y + t.h} L{TOWER_X - 2.4} {t.y + 5} Q{TOWER_X} {t.y + 2.5} {TOWER_X + 2.4} {t.y + 5} L{TOWER_X + 2.4} {t.y + t.h} Z" fill={C.hillShade} />
      <path
        d="M{t.x - 5} {t.y + 1} Q{t.x - 1} {t.y} {t.x + 1} {t.y - 3} L{t.x + t.w - 1} {t.y - 3} Q{t.x + t.w + 1} {t.y} {t.x + t.w + 5} {t.y + 1} Z"
        fill={C.tile}
      />
    </g>
  {/each}
  <g class="in in-pop origin-bottom" style="--e: {320 + 7 * 70}">
    <path d="M{TOWER_X - 2} {tiers[6]!.y - 3} L{TOWER_X} {tiers[6]!.y - 15} L{TOWER_X + 2} {tiers[6]!.y - 3} Z" fill={C.stoneShade} />
  </g>

  <!-- Drachenboot gleitet herein, treibt und schaukelt -->
  <g class="in in-right" style="--e: 460">
    <g class="loop-drift" style="--t: 20s; --dx: 36">
      <g transform="translate(262 206) scale(0.78)">
        <ellipse cx="0" cy="8" rx="84" ry="5" fill={C.riverLight} />
        <g class="loop-bob" style="--t: 3s; --rot: 1.5; --amp: 2">
          <g>
            <path d="M-36 -24 Q-30 -26 -28 -31 L18 -31 Q20 -26 26 -24 Z" fill={C.tile} />
            <rect x="-30" y="-24" width="50" height="18" fill={C.stone} />
            <rect x="-30" y="-24" width="16" height="18" fill={C.stoneShade} />
            <rect x="-20" y="-20" width="8" height="10" fill={C.tile} />
            <rect x="0" y="-20" width="8" height="10" fill={C.tile} />
            <path d="M-70 -6 L60 -6 Q74 -8 80 -22 L85 -20 Q80 -2 66 4 L-64 4 Q-72 0 -70 -6 Z" fill={C.red} />
            <path d="M-66 -2 L62 -2 L60 0.5 L-64 0.5 Z" fill={C.sun} />
            <path d="M78 -20 Q82 -37 93 -34 Q98 -30 91 -26 Q86 -24 85 -18 Z" fill={C.sun} />
            <path d="M-70 -6 Q-83 -10 -80 -24 Q-74 -16 -66 -8 Z" fill={C.sun} />
            <rect x="40" y="-34" width="1.6" height="28" fill={C.tile} />
            <g class="loop-wave origin-left" style="--t: 0.9s; --rot: 10"><path d="M41.6 -34 L56 -30 L41.6 -26 Z" fill={C.sun} /></g>
          </g>
        </g>
      </g>
    </g>
  </g>

  <!-- Lotusteich im Vordergrund -->
  <g class="in in-rise" style="--e: 260">
    {@render leaf(26, 246, 34)}
    {@render leaf(118, 252, 40)}
    {@render leaf(212, 244, 30)}
    {@render leaf(300, 252, 42)}
    {@render leaf(386, 244, 30)}
  </g>
  <g class="in in-pop origin-bottom" style="--e: 680">{@render lotusFlower(70, 238, 1.1, 0)}</g>
  <g class="in in-pop origin-bottom" style="--e: 760">{@render lotusFlower(250, 236, 0.9, -1.2)}</g>
  <g class="in in-pop origin-bottom" style="--e: 840">{@render lotusFlower(350, 240, 1, -2.1)}</g>
</Scene>
