<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';
  import Sky from '../Sky.svelte';

  /**
   * Unterwegs: der Zug fährt an der Küste entlang, hinter ihm Meer und Berge (wie am Hải-Vân-Pass).
   * Aufbau: Berge steigen, das Meer, der Damm mit den Gleisen, der Strand vorn. Leben: der Zug fährt
   * immer wieder durchs Bild, das Wasser glitzert. Nacht: erleuchtete Abteile und Frontlicht.
   * Bei reduzierter Bewegung steht der Zug ganz im Bild.
   */
  let { label = 'Zug an der Küste' }: { label?: string } = $props();

  const DAY = {
    sky: '#FDE6CF',
    far: '#B9DACF',
    rock: '#4E9E8F',
    rockShade: '#3B7F73',
    sea: '#2BB3A8',
    seaLight: '#79D3C8',
    bank: '#F6D9A8',
    bankShade: '#EBC487',
    rail: '#6B5A50',
    train: '#3D7CC9',
    trainShade: '#2E63A6',
    stripe: '#FFCD00',
    win: '#2E3A4F',
    loco: '#DA251D',
  };
  const NIGHT: typeof DAY = {
    sky: '#1B2442',
    far: '#28365A',
    rock: '#24545C',
    rockShade: '#183D43',
    sea: '#173E58',
    seaLight: '#4F72A0',
    bank: '#4C4A60',
    bankShade: '#3B394F',
    rail: '#2A2633',
    train: '#2A4F86',
    trainShade: '#203D69',
    stripe: '#D9AE2C',
    win: '#FFC14D',
    loco: '#A8322A',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);
  const CARS = [-5, 105, 215];
  /** Grasbüschel am Strand */
  const TUFTS = [[44, 222], [150, 228], [300, 220], [366, 226]] as const;
</script>

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />
  <Sky x={322} y={48} r={24} />

  <!-- ferne Kette und Berg am Meer, Schattenseite links -->
  <g class="in in-rise" style="--e: 60">
    <path d="M0 150 C30 136 50 118 84 120 C110 122 128 140 160 136 C196 132 214 110 250 112 C290 114 312 140 350 138 C372 137 388 128 400 126 L400 160 L0 160 Z" fill={C.far} />
  </g>
  <g class="in in-rise" style="--e: 140">
    <path d="M-20 162 C10 132 40 84 86 66 C110 56 126 72 140 90 C164 118 196 140 236 162 Z" fill={C.rock} />
    <path d="M-20 162 C10 132 40 84 86 66 C92 64 98 63 103 64 C76 82 54 124 40 162 Z" fill={C.rockShade} />
  </g>

  <!-- Meer mit Glitzern -->
  <g class="in in-rise" style="--e: 0">
    <rect y="156" width="400" height="44" fill={C.sea} />
    {#if night}
      {#each [[322, 166, 16], [316, 175, 24], [326, 184, 18]] as [mx, my, mr], i (my)}
        <g class="loop-shimmer" style="--t: {2.4 + i * 0.4}s; --d: {-i * 0.6}s; --dx: 5"><ellipse cx={mx} cy={my} rx={mr} ry="1.8" fill="#E9DEAF" /></g>
      {/each}
    {/if}
    <g class="loop-shimmer" style="--t: 3.1s"><ellipse cx="60" cy="168" rx="24" ry="2" fill={C.seaLight} /></g>
    <g class="loop-shimmer" style="--t: 3.6s; --d: -1.2s; --dx: -10"><ellipse cx="210" cy="176" rx="30" ry="2" fill={C.seaLight} /></g>
    <g class="loop-shimmer" style="--t: 2.9s; --d: -2s"><ellipse cx="360" cy="166" rx="20" ry="1.8" fill={C.seaLight} /></g>
  </g>

  <!-- Damm mit Gleis -->
  <g class="in in-rise" style="--e: 80">
    <rect y="190" width="400" height="18" fill={C.bankShade} />
    <rect y="186" width="400" height="5" fill={C.rail} />
  </g>

  <!-- Zug: drei Wagen und die Lok, fährt immer wieder durchs Bild -->
  <g class="in in-fade" style="--e: 420">
    <g class="loop-pass" style="--t: 10s; --dist: 840px">
      {#each CARS as cx (cx)}
        <rect x={cx} y="137" width="104" height="7" rx="3.5" fill={C.trainShade} />
        <rect x={cx} y="141" width="104" height="43" rx="6" fill={C.train} />
        <rect x={cx} y="172" width="104" height="12" rx="3" fill={C.trainShade} />
        <rect x={cx} y="165" width="104" height="5" fill={C.stripe} />
        {#each [10, 34, 58, 82] as wx (wx)}
          {#if night}<Glow x={cx + wx + 8} y={157} r={7} color={C.win} t={2.6} d={-(cx + wx) / 90} />{/if}
          <rect x={cx + wx} y="149" width="16" height="13" rx="3" fill={C.win} />
        {/each}
        <circle cx={cx + 20} cy="186" r="5" fill={C.rail} />
        <circle cx={cx + 84} cy="186" r="5" fill={C.rail} />
        <rect x={cx + 104} y="170" width="6" height="5" fill={C.rail} />
      {/each}
      <path d="M325 141 L388 141 C400 141 406 156 406 170 L406 184 L325 184 Z" fill={C.loco} />
      <rect x="325" y="165" width="81" height="5" fill={C.stripe} />
      <path d="M382 149 L394 149 C399 151 402 157 402 162 L382 162 Z" fill={C.win} />
      <rect x="336" y="149" width="16" height="13" rx="3" fill={C.win} />
      <circle cx="344" cy="186" r="5" fill={C.rail} />
      <circle cx="392" cy="186" r="5" fill={C.rail} />
      {#if night}<path d="M405 172 L480 160 L480 190 L405 178 Z" fill={C.stripe} opacity="0.35" />{/if}
    </g>
  </g>

  <!-- Strand vorn mit Grasbüscheln -->
  <g class="in in-rise" style="--e: 200">
    <path d="M0 214 C80 204 180 222 260 212 C320 205 370 210 400 206 L400 260 L0 260 Z" fill={C.bank} />
    <path d="M0 242 C90 234 170 248 250 244 C320 240 360 236 400 240 L400 260 L0 260 Z" fill={C.bankShade} />
  </g>
  <g class="in in-pop origin-bottom" style="--e: 560">
    {#each TUFTS as [gx, gy], i (gx)}
      <g class="loop-sway origin-bottom" style="--t: {2.6 + (i % 2) * 0.7}s; --d: {-i * 0.8}s; --rot: 6">
        <path d="M{gx - 8} {gy} L{gx - 12} {gy - 16} L{gx - 3} {gy} Z M{gx - 3} {gy} L{gx} {gy - 22} L{gx + 3} {gy} Z M{gx + 3} {gy} L{gx + 12} {gy - 14} L{gx + 8} {gy} Z" fill={C.rock} />
      </g>
    {/each}
  </g>
</Scene>
