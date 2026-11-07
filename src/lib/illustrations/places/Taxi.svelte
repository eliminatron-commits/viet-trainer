<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Scene from '../Scene.svelte';
  import Sky from '../Sky.svelte';

  /**
   * Taxi & Grab: Taxi mit Dachschild fährt durch die Stadt.
   * Aufbau: Häuserzeile steigt, Straße, das Taxi fährt von links herein. Leben: Räder drehen sich,
   * die Fahrbahnmarkierung zieht vorbei, der Wagen federt. Nacht: Fenster leuchten, Scheinwerferkegel.
   */
  let { label = 'Taxi in der Stadt' }: { label?: string } = $props();

  const DAY = {
    sky: '#FDE6CF',
    city: '#B9DACF',
    cityShade: '#9CC7BA',
    win: '#8DB8AB',
    road: '#59606F',
    line: '#F6E7C8',
    curb: '#D8C6A8',
    car: '#2BB3A8',
    carShade: '#1F8A80',
    glass: '#2E3A4F',
    sign: '#FFCD00',
    wheel: '#2B2B33',
    hub: '#C9CED8',
    light: '#FFF1B8',
  };
  const NIGHT: typeof DAY = {
    sky: '#1B2442',
    city: '#28365A',
    cityShade: '#1F2B4A',
    win: '#FFC14D',
    road: '#262B3A',
    line: '#8C8A7A',
    curb: '#3B394F',
    car: '#17807A',
    carShade: '#11605C',
    glass: '#151C2C',
    sign: '#F2C230',
    wheel: '#14161D',
    hub: '#7D8494',
    light: '#FFF1B8',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  /** Häuserzeile: x, Breite, Oberkante, dunkler? */
  const HOUSES = [
    [-6, 58, 92, false],
    [52, 46, 66, true],
    [98, 70, 102, false],
    [168, 52, 78, true],
    [220, 64, 110, false],
    [284, 44, 88, true],
    [328, 78, 114, false],
  ] as const;
</script>

{#snippet wheel(cx: number)}
  <path d="M{cx - 21} 213 A21 21 0 0 1 {cx + 21} 213 Z" fill={C.carShade} />
  <circle cx={cx} cy="213" r="17" fill={C.wheel} />
  <circle cx={cx} cy="213" r="7.5" fill={C.hub} />
  <g transform="translate({cx} 213)">
    <g class="loop-spin" style="--t: 0.45s">
      <rect x="-6.5" y="-1.3" width="13" height="2.6" fill={C.wheel} />
      <rect x="-1.3" y="-6.5" width="2.6" height="13" fill={C.wheel} />
    </g>
  </g>
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />
  <Sky x={330} y={46} r={24} />

  <!-- Häuserzeile mit Fenstern; nachts brennt Licht in einigen -->
  <g class="in in-rise" style="--e: 80">
    {#each HOUSES as [hx, hw, top, dark], h (hx)}
      <rect x={hx} y={top} width={hw} height={180 - top} fill={dark ? C.cityShade : C.city} />
      {#each Array.from({ length: Math.floor((170 - top - 10) / 17) }, (_, r) => r) as r (r)}
        {#each Array.from({ length: Math.floor((hw - 8) / 14) }, (_, c) => c) as c (c)}
          {@const lit = !night || (h * 7 + r * 3 + c * 5) % 4 === 0}
          {#if lit}
            <g class={night ? 'loop-twinkle' : ''} style="--t: {2.4 + ((r + c) % 3) * 0.7}s; --d: {-(h + r + c) * 0.5}s">
              <rect x={hx + 8 + c * 14} y={top + 10 + r * 17} width="6" height="8" rx="1" fill={night ? C.win : dark ? C.city : C.win} />
            </g>
          {/if}
        {/each}
      {/each}
    {/each}
  </g>

  <!-- Gehweg und Straße mit vorbeiziehender Markierung -->
  <g class="in in-rise" style="--e: 0">
    <rect y="172" width="400" height="16" fill={C.curb} />
    <rect y="186" width="400" height="74" fill={C.road} />
    <g class="loop-cross" style="--t: 0.5s; --dist: -64px">
      {#each Array.from({ length: 8 }, (_, k) => k) as k (k)}
        <rect x={k * 64} y="246" width="34" height="5" rx="2.5" fill={C.line} />
      {/each}
    </g>
  </g>

  <!-- Taxi fährt herein, federt; Räder drehen sich -->
  <g class="in in-left" style="--e: 320; --from: 440">
    <ellipse cx="216" cy="232" rx="104" ry="5" fill={C.wheel} opacity="0.35" />
    {#if night}<path d="M320 186 L400 166 L400 226 L320 197 Z" fill={C.light} opacity="0.3" />{/if}
    <g class="loop-bob" style="--t: 0.42s; --amp: 1.2; --rot: 0.4">
      <!-- Karosserie gespiegelt (um x = 216): lange Motorhaube vorn rechts, in Fahrtrichtung -->
      <g transform="translate(432 0) scale(-1 1)">
        <rect x="214" y="133" width="44" height="15" rx="4" fill={C.sign} />
        {#each [219, 229, 239, 249] as sx (sx)}<rect x={sx} y="137" width="5" height="3.5" fill={C.glass} />{/each}
        {#each [224, 234, 244] as sx (sx)}<rect x={sx} y="140.5" width="5" height="3.5" fill={C.glass} />{/each}
        <rect x="230" y="147" width="12" height="3" fill={C.carShade} />
        <path
          d="M112 204 C112 190 120 182 136 180 L170 178 L194 154 C199 149 206 147 214 147 L262 147 C272 147 280 152 286 160 L302 178 C314 180 320 188 320 200 L320 208 C320 212 316 214 312 214 L118 214 C114 214 112 211 112 208 Z"
          fill={C.car}
        />
        <path d="M112 200 L320 200 L320 208 C320 212 316 214 312 214 L118 214 C114 214 112 211 112 208 Z" fill={C.carShade} />
        <path d="M200 158 C203 154 207 153 212 153 L238 153 L238 178 L180 178 Z" fill={C.glass} />
        <path d="M244 153 L262 153 C268 153 273 156 277 161 L291 178 L244 178 Z" fill={C.glass} />
        <rect x="240" y="180" width="2.5" height="30" fill={C.carShade} />
        <rect x="222" y="186" width="10" height="3" rx="1.5" fill={C.carShade} />
        <rect x="268" y="186" width="10" height="3" rx="1.5" fill={C.carShade} />
      </g>
      <!-- Scheinwerfer vorn (rechts), Rücklicht hinten (links) -->
      <rect x="311" y="185" width="9" height="7" rx="2" fill={C.light} />
      <rect x="112" y="185" width="6" height="7" rx="2" fill={C.sign} />
    </g>
    {@render wheel(154)}
    {@render wheel(272)}
  </g>
</Scene>
