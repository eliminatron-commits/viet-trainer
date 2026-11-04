<script lang="ts">
  import { theme } from '../theme.svelte';
  import Glow from './Glow.svelte';
  import Scene from './Scene.svelte';
  import Sky from './Sky.svelte';

  /**
   * Huế: die Thiên-Mụ-Pagode auf dem Hügel am Parfümfluss, ein Drachenboot, Lotus im Vordergrund.
   * Aufbau: Fluss steigt, der Turm wächst Stockwerk um Stockwerk, das Drachenboot gleitet herein, Lotus blüht auf.
   * Leben: Boot treibt und schaukelt, Wimpel flattert, Lotusblüten wiegen sich, Vögel queren (bei Tag).
   * Nacht: Mondschein mit Lichtsäule auf dem Fluss, erleuchtete Pagode, Laternen am Drachenboot, Glühwürmchen über dem Teich.
   */
  let { label = 'Thiên-Mụ-Pagode am Parfümfluss in Huế' }: { label?: string } = $props();

  const DAY = {
    sky: '#FDE6CF',
    cloud: '#FFF4E6',
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
    petal: '#FFF4E6',
    sun: '#FFCD00',
    /** Turmfenster: tags dunkel, nachts erleuchtet. */
    win: '#4F8E68',
  };
  const NIGHT: typeof DAY = {
    sky: '#18213D',
    cloud: '#273154',
    far: '#26324F',
    hill: '#1F4A3B',
    hillShade: '#15362B',
    stone: '#C9B98F',
    stoneShade: '#8C7E5E',
    tile: '#7A2A1E',
    river: '#14304A',
    riverLight: '#5A7AA0',
    red: '#E0352B',
    lotus: '#E59AB4',
    petal: '#F3E6EE',
    sun: '#FFD54A',
    win: '#FFCB5C',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

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
  /** Glühwürmchen über dem Lotusteich (nur nachts): x, y, Drift. */
  const fireflies = [
    [40, 214, 14],
    [104, 226, 18],
    [176, 212, 12],
    [226, 230, 16],
    [298, 216, 20],
    [372, 226, 12],
  ] as const;
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
      <path d="M0 -4 Q15 -8 15 -18 Q5 -14 0 -4 Z" fill={C.petal} />
      <path d="M0 -26 Q8 -14 0 -4 Q-8 -14 0 -26 Z" fill={C.lotus} />
      <path d="M0 -26 Q8 -14 0 -4 Z" fill={C.petal} />
    </g>
  </g>
{/snippet}

{#snippet leaf(x: number, y: number, rx: number)}
  <ellipse cx={x - 3} cy={y + 2.5} {rx} ry={rx * 0.36} fill={C.hillShade} />
  <ellipse cx={x} cy={y} {rx} ry={rx * 0.36} fill={C.hill} />
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />
  <Sky x={330} y={58} r={28} e={160} />

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
  {#if !night}
    <g class="loop-cross" style="--t: 17s; --d: -6s; --dist: 520px">
      <g transform="translate(-50 96) scale(0.7)">
        <g class="loop-flap"><path d="M0 0 Q6 -7 12 0 Q18 -7 24 0 Q18 -3 12 3 Q6 -3 0 0 Z" fill={C.hillShade} /></g>
      </g>
    </g>
  {/if}

  <!-- ferne Hügel des Hương-Tals -->
  <g class="in in-rise" style="--e: 60">
    <path d="M0 166 C30 150 60 146 90 156 C120 166 150 140 190 146 C230 152 260 160 300 150 C340 140 370 152 400 156 L400 190 L0 190 Z" fill={C.far} />
  </g>

  <!-- Fluss; nachts mit der Lichtsäule des Mondes -->
  <g class="in in-rise" style="--e: 0">
    <rect x="0" y="184" width="400" height="76" fill={C.river} />
    {#if night}
      {#each [[330, 190, 14], [326, 197, 20], [334, 204, 16], [328, 212, 24], [332, 221, 18]] as [mx, my, mr], i (my)}
        <g class="loop-shimmer" style="--t: {2.2 + i * 0.35}s; --d: {-i * 0.5}s; --dx: 5"><ellipse cx={mx} cy={my} rx={mr} ry="1.8" fill="#E9DEAF" /></g>
      {/each}
    {/if}
    <g class="loop-shimmer" style="--t: 3.2s"><ellipse cx="200" cy="196" rx="30" ry="2" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 2.8s; --d: -1.3s; --dx: -12"><ellipse cx="260" cy="190" rx="24" ry="1.8" fill={C.riverLight} /></g>
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

  <!-- Der Turm wächst Stockwerk um Stockwerk; nachts angestrahlt mit erleuchteten Fenstern -->
  {#if night}
    <g class="in in-fade" style="--e: 860"><Glow x={TOWER_X} y={118} r={15} color={C.win} t={3.6} /></g>
  {/if}
  {#each tiers as t, i (i)}
    <g class="in in-pop origin-bottom" style="--e: {320 + i * 70}">
      <rect x={t.x} y={t.y} width={t.w} height={t.h} fill={C.stone} />
      <rect x={t.x} y={t.y} width={t.w * 0.38} height={t.h} fill={C.stoneShade} />
      <path d="M{TOWER_X - 2.4} {t.y + t.h} L{TOWER_X - 2.4} {t.y + 5} Q{TOWER_X} {t.y + 2.5} {TOWER_X + 2.4} {t.y + 5} L{TOWER_X + 2.4} {t.y + t.h} Z" fill={C.win} />
      <path
        d="M{t.x - 5} {t.y + 1} Q{t.x - 1} {t.y} {t.x + 1} {t.y - 3} L{t.x + t.w - 1} {t.y - 3} Q{t.x + t.w + 1} {t.y} {t.x + t.w + 5} {t.y + 1} Z"
        fill={C.tile}
      />
    </g>
  {/each}
  <g class="in in-pop origin-bottom" style="--e: {320 + 7 * 70}">
    <path d="M{TOWER_X - 2} {tiers[6]!.y - 3} L{TOWER_X} {tiers[6]!.y - 15} L{TOWER_X + 2} {tiers[6]!.y - 3} Z" fill={C.stoneShade} />
  </g>

  <!-- Drachenboot gleitet herein, treibt und schaukelt; nachts mit Laternen -->
  <g class="in in-right" style="--e: 460">
    <g class="loop-drift" style="--t: 20s; --dx: 36">
      <g transform="translate(262 206) scale(0.78)">
        <ellipse cx="0" cy="8" rx="84" ry="5" fill={C.riverLight} />
        {#if night}<ellipse cx="-4" cy="10" rx="50" ry="4" fill={C.win} opacity="0.3" />{/if}
        <g class="loop-bob" style="--t: 3s; --rot: 1.5; --amp: 2">
          <g>
            <path d="M-36 -24 Q-30 -26 -28 -31 L18 -31 Q20 -26 26 -24 Z" fill={C.tile} />
            <rect x="-30" y="-24" width="50" height="18" fill={C.stone} />
            <rect x="-30" y="-24" width="16" height="18" fill={C.stoneShade} />
            <rect x="-20" y="-20" width="8" height="10" fill={night ? C.win : C.tile} />
            <rect x="0" y="-20" width="8" height="10" fill={night ? C.win : C.tile} />
            {#if night}
              {#each [-30, -6, 18] as lx, i (lx)}
                <Glow x={lx} y={-22} r={5} color={C.sun} t={2 + i * 0.4} d={-i * 0.6} />
                <ellipse cx={lx} cy="-22" rx="3.6" ry="4.4" fill={C.red} />
              {/each}
            {/if}
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

  {#if night}
    {#each fireflies as [fx, fy, dx], i (fx)}
      <g class="in in-fade" style="--e: {900 + i * 80}">
        <g class="loop-drift" style="--t: {5 + i * 0.8}s; --dx: {dx}; --d: {-i * 1.3}s">
          <g class="loop-twinkle" style="--t: {0.9 + (i % 3) * 0.4}s; --d: {-i * 0.3}s">
            <circle cx={fx} cy={fy} r="5" fill={C.sun} opacity="0.25" />
            <circle cx={fx} cy={fy} r="1.8" fill={C.sun} />
          </g>
        </g>
      </g>
    {/each}
  {/if}
</Scene>
