<script lang="ts">
  import { theme } from '../theme.svelte';
  import Glow from './Glow.svelte';
  import Scene from './Scene.svelte';
  import Sky from './Sky.svelte';

  /**
   * Trâus Hof (Profil): Stelzenhaus (nhà sàn) mit Strohdach vor Reisterrassen und fernen Hügeln, Bananenstaude,
   * Heuhaufen und gestampfter Hof. Unten in der Mitte bleibt Platz für Trâu (liegt als HTML darüber).
   * Aufbau: Hof und Felder steigen, Hügel folgen, das Haus ploppt auf, Staude und Heu wachsen.
   * Leben: Wolken ziehen, Rauch steigt aus dem Dach, Blätter wiegen sich, Wasser in den Feldern glitzert.
   * Nacht: Mond, erleuchtete Fenster, Glühwürmchen über den Feldern.
   */
  let { label = 'Trâus Hof: Stelzenhaus vor Reisfeldern' }: { label?: string } = $props();

  const DAY = {
    sky: '#FDE6CF',
    cloud: '#FFF4E6',
    far: '#B9DACF',
    field: '#8CC27A',
    fieldDeep: '#5E9E5A',
    paddy: '#C4E8DC',
    wood: '#B5773F',
    woodShade: '#8A5428',
    thatch: '#E2B25A',
    thatchShade: '#C4913A',
    win: '#5A3A22',
    ground: '#EBD3A2',
    groundShade: '#DDBE86',
    leaf: '#4E8F45',
  };
  const NIGHT: typeof DAY = {
    sky: '#1B2442',
    cloud: '#2A3459',
    far: '#28365A',
    field: '#2F5446',
    fieldDeep: '#22403A',
    paddy: '#4F72A0',
    wood: '#5E3D27',
    woodShade: '#43291A',
    thatch: '#7D6838',
    thatchShade: '#5F4E2A',
    win: '#FFC14D',
    ground: '#4C4A60',
    groundShade: '#3B394F',
    leaf: '#244A3A',
  };
  const LAMP = '#FFC14D';
  /** Wasser in den Feldern: x, y, Breite. */
  const PADDIES: [number, number, number][] = [
    [210, 156, 54],
    [300, 152, 40],
    [250, 182, 70],
    [360, 178, 30],
  ];
  const FIREFLIES: [number, number][] = [
    [196, 150],
    [238, 138],
    [276, 160],
    [322, 146],
    [362, 156],
    [216, 170],
  ];
  /** Bananenblätter: Drehung, Größe, Versatz der Schleife. */
  const LEAVES: [number, number, number][] = [
    [-38, 1.2, 0],
    [28, 0.9, -1.1],
    [-70, 1, -2.2],
    [62, 1.1, -0.6],
  ];
  /** Rauch: x, y, Radius, Versatz. */
  const SMOKE: [number, number, number, number][] = [
    [96, 56, 5, 0],
    [101, 44, 6.5, -1.2],
    [95, 30, 8, -2.4],
  ];
  const TUFTS: [number, number][] = [
    [22, 246],
    [58, 254],
    [342, 250],
    [380, 242],
  ];
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);
</script>

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />
  <Sky x={334} y={52} r={24} />

  <!-- Wolken gleiten herein und ziehen -->
  <g class="in in-left" style="--e: 140">
    <g class="loop-drift" style="--t: 28s; --dx: 20">
      <path d="M168 50 C168 40 184 36 190 44 C194 35 212 36 213 48 C222 48 225 58 216 59 L172 59 C163 59 161 51 168 50 Z" fill={C.cloud} />
    </g>
  </g>

  <!-- ferne Hügel -->
  <g class="in in-rise" style="--e: 60">
    <path
      d="M0 132 C22 120 40 104 62 108 C84 112 92 128 116 126 C142 124 154 100 182 102 C210 104 222 126 248 124 C272 122 286 108 310 110 C334 112 352 128 376 126 C388 125 396 120 400 118 L400 160 L0 160 Z"
      fill={C.far}
    />
  </g>

  <!-- Reisterrassen mit glitzerndem Wasser; nachts Glühwürmchen darüber -->
  <g class="in in-rise" style="--e: 120">
    <path d="M0 150 C80 140 160 146 240 142 C300 139 360 144 400 140 L400 200 L0 200 Z" fill={C.field} />
    <path d="M0 176 C90 166 180 174 270 168 C330 164 370 168 400 166 L400 204 L0 204 Z" fill={C.fieldDeep} />
    {#each PADDIES as [px, py, pw], i (px)}
      <g class="loop-shimmer" style="--t: {2.6 + i * 0.5}s; --d: {-i * 0.7}s; --dx: 6">
        <rect x={px - pw / 2} y={py} width={pw} height="2.6" rx="1.3" fill={C.paddy} />
      </g>
    {/each}
    {#if night}
      {#each FIREFLIES as [fx, fy], i (fx)}
        <g class="loop-twinkle" style="--t: {1.6 + (i % 3) * 0.7}s; --d: {-i * 0.5}s">
          <Glow x={fx} y={fy} r={2.4} color={LAMP} t={1.8 + i * 0.3} />
          <circle cx={fx} cy={fy} r="1.6" fill={LAMP} />
        </g>
      {/each}
    {/if}
  </g>

  <!-- Hof: gestampfte Erde mit hellerem Pfad -->
  <g class="in in-rise" style="--e: 0">
    <path d="M0 198 C100 192 220 196 400 192 L400 260 L0 260 Z" fill={C.ground} />
    <path d="M150 260 C176 236 196 220 230 206 L262 206 C236 222 222 240 214 260 Z" fill={C.groundShade} />
  </g>

  <!-- Heuhaufen um seinen Stab -->
  <g class="in in-grow" style="--e: 380">
    <rect x="309" y="140" width="3" height="66" fill={C.woodShade} />
    <path d="M282 208 C282 178 296 160 311 158 C326 160 340 178 340 208 Z" fill={C.thatch} />
    <path d="M282 208 C282 178 296 160 311 158 C302 168 296 186 298 208 Z" fill={C.thatchShade} />
    <path d="M300 160 L311 150 L322 160 Z" fill={C.thatchShade} />
  </g>

  <!-- Bananenstaude rechts, die Blätter wiegen sich -->
  <g class="in in-grow" style="--e: 440">
    <rect x="364" y="122" width="10" height="86" rx="4" fill={C.fieldDeep} />
    {#each LEAVES as [rot, k, d] (rot)}
      <g transform="translate(369 124) rotate({rot})">
        <g class="loop-sway origin-bottom" style="--t: {3 + k}s; --rot: 5; --d: {d}s">
          <path d="M0 0 C-10 -14 -9 -40 0 -54 C9 -40 10 -14 0 0 Z" fill={C.leaf} transform="scale({k})" />
        </g>
      </g>
    {/each}
  </g>

  <!-- Stelzenhaus (nhà sàn): Schattenseite links, Strohdach, Leiter; nachts leuchten die Fenster -->
  <g class="in in-pop origin-bottom" style="--e: 260">
    {#each [28, 60, 92, 124] as x (x)}<rect {x} y="148" width="7" height="58" fill={C.woodShade} />{/each}
    <rect x="20" y="144" width="124" height="8" fill={C.wood} />
    <rect x="30" y="104" width="104" height="42" fill={C.wood} />
    <rect x="30" y="104" width="18" height="42" fill={C.woodShade} />
    {#each [62, 100] as x (x)}
      {#if night}<Glow x={x + 9} y={122} r={10} color={LAMP} t={3.4} d={x / 50} />{/if}
      <rect {x} y="114" width="18" height="17" rx="2" fill={C.win} />
    {/each}
    <path d="M10 108 L46 66 L120 66 L156 108 Z" fill={C.thatch} />
    <path d="M10 108 L46 66 L58 66 L28 108 Z" fill={C.thatchShade} />
    <rect x="44" y="64" width="78" height="5" rx="2.5" fill={C.thatchShade} />
    <!-- Leiter zur Plattform -->
    <rect x="146" y="150" width="3" height="56" fill={C.woodShade} />
    <rect x="158" y="150" width="3" height="56" fill={C.woodShade} />
    {#each [160, 172, 184, 196] as y (y)}<rect x="146" {y} width="15" height="3" fill={C.woodShade} />{/each}
  </g>

  <!-- Rauch aus dem Dach (Küchenfeuer) -->
  <g class="in in-fade" style="--e: 700">
    {#each SMOKE as [sx, sy, sr, d] (sy)}
      <g class="loop-bob" style="--t: 2.8s; --amp: 5; --rot: 0; --d: {d}s">
        <circle cx={sx} cy={sy} r={sr} fill={C.cloud} opacity="0.85" />
      </g>
    {/each}
  </g>

  <!-- Reisbüschel im Vordergrund -->
  <g class="in in-rise" style="--e: 200">
    {#each TUFTS as [gx, gy] (gx)}
      <path d="M{gx - 9} {gy} L{gx - 4} {gy - 16} L{gx} {gy - 4} L{gx + 4} {gy - 18} L{gx + 9} {gy} Z" fill={C.fieldDeep} />
    {/each}
  </g>
</Scene>
