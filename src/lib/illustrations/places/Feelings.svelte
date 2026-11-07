<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';
  import Sky, { MOON_SHINE } from '../Sky.svelte';

  /**
   * Gefühle: Lotusteich – eine große Lotusblüte, eine Knospe, Seerosenblätter, eine Libelle.
   * Aufbau: Wasser steigt, Blätter ploppen auf, die Blüte wächst aus dem Wasser. Leben: die Blüte atmet,
   * Ringe ziehen übers Wasser, die Knospe wiegt sich, die Libelle schwirrt.
   * Nacht: statt der Libelle treiben zwei Blütenlaternen mit Kerzenlicht.
   */
  let { label = 'Lotusteich' }: { label?: string } = $props();

  const DAY = {
    sky: '#FDE6CF',
    far: '#B9DACF',
    farShade: '#9CC7BA',
    water: '#2BB3A8',
    waterLight: '#79D3C8',
    pad: '#4DA05A',
    padShade: '#3B7F4A',
    petal: '#F7A8BC',
    petalShade: '#E57A98',
    gold: '#FFCD00',
    wing: '#FFF8EC',
    body: '#2E7DC4',
    red: '#DA251D',
  };
  const NIGHT: typeof DAY = {
    sky: '#1B2442',
    far: '#28365A',
    farShade: '#1F2B4A',
    water: '#173E58',
    waterLight: '#4F72A0',
    pad: '#2C5E3E',
    padShade: '#214A31',
    petal: '#C97C98',
    petalShade: '#9E5A76',
    gold: '#E8B93A',
    wing: '#CFC8B6',
    body: '#26558A',
    red: '#B8362C',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  const PETAL = 'M0 0 C-13 -10 -13 -36 0 -50 C13 -36 13 -10 0 0 Z';
  /** Seerosenblätter: x, y, Radius */
  const PADS = [
    [64, 150, 28],
    [304, 154, 32],
    [238, 214, 40],
    [84, 232, 46],
    [362, 236, 30],
  ] as const;
</script>

{#snippet lotus(x: number, y: number, s: number, e: number, d: number)}
  <g transform="translate({x} {y}) scale({s})">
    <g class="in in-grow" style="--e: {e}">
      <g class="loop-breathe origin-bottom" style="--t: 4.2s; --d: {d}s; --s: 1.04">
        <path d={PETAL} fill={C.petalShade} transform="rotate(-64) scale(0.82)" />
        <path d={PETAL} fill={C.petalShade} transform="rotate(64) scale(0.82)" />
        <path d={PETAL} fill={C.petalShade} transform="rotate(-24) scale(0.95)" />
        <path d={PETAL} fill={C.petalShade} transform="rotate(24) scale(0.95)" />
        <ellipse cx="0" cy="-38" rx="12" ry="5" fill={C.gold} />
        <path d={PETAL} fill={C.petal} transform="rotate(-42) scale(0.9)" />
        <path d={PETAL} fill={C.petal} transform="rotate(42) scale(0.9)" />
        <path d={PETAL} fill={C.petal} transform="scale(0.92 0.74)" />
      </g>
    </g>
  </g>
{/snippet}

{#snippet pad(px: number, py: number, r: number)}
  <ellipse cx={px} cy={py + 2} rx={r} ry={r * 0.28} fill={C.padShade} />
  <ellipse cx={px} cy={py} rx={r} ry={r * 0.28} fill={C.pad} />
  <path d="M{px} {py} L{px + r * 0.95} {py - r * 0.1} L{px + r * 0.95} {py + r * 0.12} Z" fill={C.water} />
{/snippet}

{#snippet floater(x: number, y: number, d: number)}
  <g class="loop-drift" style="--t: 14s; --d: {d}s; --dx: 14">
    <g class="loop-bob" style="--t: 2.8s; --d: {d / 3}s; --amp: 1.5; --rot: 3">
      <ellipse cx={x} cy={y + 8} rx="14" ry="2.5" fill={C.gold} opacity="0.35" />
      <Glow x={x} y={y - 8} r={8} color={C.gold} t={2.4} d={d} />
      <path d="M{x - 13} {y} L{x - 10} {y - 10} L{x - 5} {y - 4} L{x} {y - 13} L{x + 5} {y - 4} L{x + 10} {y - 10} L{x + 13} {y} Z" fill={C.red} />
      <ellipse cx={x} cy={y} rx="14" ry="4" fill={C.red} />
      <ellipse cx={x} cy={y - 12} rx="2.5" ry="4" fill={C.gold} />
    </g>
  </g>
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />
  <Sky x={320} y={46} r={22} />

  <!-- Ufer mit Bäumen in der Ferne -->
  <g class="in in-rise" style="--e: 80">
    <path d="M0 104 C20 88 44 86 60 96 C74 82 100 80 114 96 C132 86 152 88 166 100 C186 84 214 84 228 98 C246 88 270 90 282 102 C302 86 330 88 344 100 C360 90 384 90 400 98 L400 120 L0 120 Z" fill={C.far} />
    <rect y="108" width="400" height="12" fill={C.farShade} />
  </g>

  <!-- Wasser mit Glitzern -->
  <g class="in in-rise" style="--e: 0">
    <rect y="116" width="400" height="144" fill={C.water} />
    {#if night}
      {#each [[320, 128, 16], [314, 138, 24], [324, 148, 18]] as [mx, my, mr], i (my)}
        <g class="loop-shimmer" style="--t: {2.4 + i * 0.4}s; --d: {-i * 0.6}s; --dx: 5"><ellipse cx={mx} cy={my} rx={mr} ry="1.8" fill={MOON_SHINE} /></g>
      {/each}
    {/if}
    <g class="loop-shimmer" style="--t: 3.3s"><ellipse cx="170" cy="130" rx="26" ry="2" fill={C.waterLight} /></g>
    <g class="loop-shimmer" style="--t: 3.8s; --d: -1.4s; --dx: -10"><ellipse cx="330" cy="196" rx="24" ry="2" fill={C.waterLight} /></g>
    <g class="loop-shimmer" style="--t: 2.9s; --d: -0.7s"><ellipse cx="30" cy="190" rx="20" ry="1.8" fill={C.waterLight} /></g>
  </g>

  <!-- Seerosenblätter -->
  <g class="in in-pop" style="--e: 260">
    {#each PADS as [px, py, r] (px)}{@render pad(px, py, r)}{/each}
  </g>

  <!-- Ringe ziehen um die Blüte -->
  {#each [0, -1.6] as d (d)}
    <g class="loop-ring" style="--t: 3.2s; --d: {d}s">
      <path d="M96 186 A58 12 0 1 0 212 186 A58 12 0 1 0 96 186 Z M101 186 A53 9.5 0 1 1 207 186 A53 9.5 0 1 1 101 186 Z" fill={C.waterLight} fill-rule="evenodd" />
    </g>
  {/each}

  <!-- Knospe am Stiel wiegt sich -->
  <g class="in in-grow" style="--e: 520">
    <g class="loop-sway origin-bottom" style="--t: 3.6s; --rot: 4">
      <rect x="250" y="148" width="4" height="46" fill={C.padShade} />
      <path d="M252 152 C241 144 242 124 252 114 C262 124 263 144 252 152 Z" fill={C.petal} />
      <path d="M252 152 C241 144 242 124 252 114 C249 126 248 140 252 152 Z" fill={C.petalShade} />
    </g>
  </g>

  <!-- große Blüte auf ihrem Blatt, kleine Blüte rechts -->
  <g class="in in-pop" style="--e: 300">
    <ellipse cx="154" cy="188" rx="40" ry="10" fill={C.padShade} />
    <ellipse cx="154" cy="186" rx="40" ry="10" fill={C.pad} />
  </g>
  {@render lotus(154, 184, 1.15, 420, 0)}
  {@render lotus(306, 150, 0.6, 620, -1.8)}

  {#if night}
    {@render floater(64, 210, 0)}
    {@render floater(338, 222, -6)}
  {:else}
    <!-- Libelle schwirrt über dem Teich -->
    <g class="in in-fade" style="--e: 900">
      <g class="loop-drift" style="--t: 7s; --dx: 18">
        <g class="loop-bob" style="--t: 1.6s; --amp: 5; --rot: 4">
          <g transform="translate(214 84)">
            <g class="loop-flap" style="--t: 0.12s">
              <ellipse cx="-8" cy="-6" rx="10" ry="3.5" fill={C.wing} opacity="0.9" transform="rotate(20 -8 -6)" />
              <ellipse cx="8" cy="-6" rx="10" ry="3.5" fill={C.wing} opacity="0.9" transform="rotate(-20 8 -6)" />
            </g>
            <rect x="-2" y="-8" width="4" height="26" rx="2" fill={C.body} />
            <circle cx="0" cy="-9" r="3.5" fill={C.body} />
          </g>
        </g>
      </g>
    </g>
  {/if}
</Scene>
