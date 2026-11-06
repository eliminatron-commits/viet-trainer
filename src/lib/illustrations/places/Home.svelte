<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';

  /**
   * Zuhause: Hängematte (võng) im Zimmer, daneben der Standventilator, das Fenster steht mit grünen Läden offen,
   * draußen Bananenblätter.
   * Aufbau: Wand und Boden, Fenster, Lampe, Hängematte und Ventilator. Leben: die Hängematte schaukelt,
   * der Ventilator dreht sich, die Blätter draußen wiegen sich. Nacht: Mond und Sterne im Fenster, die Lampe leuchtet.
   */
  let { label = 'Hängematte am Fenster' }: { label?: string } = $props();

  const DAY = {
    wall: '#FBDCC0',
    wallShade: '#F0C3A0',
    floor: '#D98B5F',
    floorShade: '#C27A50',
    shutter: '#2BA98C',
    shutterShade: '#1F8A71',
    outside: '#BFE3F0',
    leaf: '#4DA05A',
    red: '#DA251D',
    yellow: '#FFCD00',
    fan: '#5B6B7A',
    blade: '#FFF8EC',
    wood: '#8A5530',
  };
  const NIGHT: typeof DAY = {
    wall: '#4B3F5A',
    wallShade: '#3C3249',
    floor: '#5A3A34',
    floorShade: '#4A2F2A',
    shutter: '#1F5C55',
    shutterShade: '#174640',
    outside: '#1B2442',
    leaf: '#2C5E3E',
    red: '#A8322A',
    yellow: '#E8B93A',
    fan: '#3A4556',
    blade: '#CFC8B6',
    wood: '#4E3423',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);
</script>

<Scene {label}>
  <!-- Wand, Sockel und Fliesenboden -->
  <g class="in in-fade" style="--e: 0">
    <rect width="400" height="198" fill={C.wall} />
    <rect y="190" width="400" height="8" fill={C.wallShade} />
  </g>
  <g class="in in-rise" style="--e: 0">
    <rect y="196" width="400" height="64" fill={C.floor} />
    {#each [214, 238] as fy (fy)}<rect y={fy} width="400" height="3" fill={C.floorShade} />{/each}
    {#each [40, 120, 200, 280, 360] as fx (fx)}<rect x={fx} y="198" width="3" height="62" fill={C.floorShade} />{/each}
  </g>

  <!-- offenes Fenster mit Läden; draußen Bananenblätter, nachts Mond und Sterne -->
  <g class="in in-fade" style="--e: 140">
    <rect x="246" y="34" width="128" height="116" rx="3" fill={C.wood} />
    <rect x="256" y="44" width="108" height="96" fill={C.outside} />
    {#if night}
      <circle cx="336" cy="66" r="11" fill={C.blade} />
      {#each [[272, 58], [296, 76], [350, 96], [282, 92]] as [sx, sy], i (i)}
        <g class="loop-twinkle" style="--t: {1.8 + i * 0.5}s; --d: {-i * 0.6}s"><circle cx={sx} cy={sy} r="1.4" fill={C.yellow} /></g>
      {/each}
    {/if}
    <g class="loop-sway origin-bottom" style="--t: 3.4s; --rot: 4">
      <path d="M300 140 C292 116 270 100 256 96 L256 124 C270 126 286 132 300 140 Z" fill={C.leaf} />
    </g>
    <g class="loop-sway origin-bottom" style="--t: 4.1s; --d: -1.3s; --rot: 5">
      <path d="M330 140 C334 112 350 92 364 84 L364 112 C352 118 340 128 330 140 Z" fill={C.leaf} />
    </g>
    <rect x="308" y="44" width="4" height="96" fill={C.wood} />
    <rect x="240" y="148" width="140" height="7" fill={C.wallShade} />
    <rect x="216" y="34" width="30" height="116" rx="2" fill={C.shutter} />
    <rect x="374" y="34" width="30" height="116" rx="2" fill={C.shutter} />
    {#each [44, 58, 72, 86, 100, 114, 128] as sy (sy)}
      <rect x="221" y={sy} width="20" height="5" rx="1" fill={C.shutterShade} />
      <rect x="379" y={sy} width="20" height="5" rx="1" fill={C.shutterShade} />
    {/each}
  </g>

  <!-- Wandlampe -->
  <g class="in in-drop" style="--e: 260">
    <rect x="120" y="24" width="8" height="12" fill={C.wood} />
    {#if night}<Glow x={124} y={46} r={14} color={C.yellow} t={3.2} />{/if}
    <path d="M110 50 L138 50 L132 34 L116 34 Z" fill={C.yellow} />
  </g>

  <!-- Hängematte an zwei Haken, schaukelt -->
  <g class="in in-fade" style="--e: 300">
    <circle cx="34" cy="92" r="4" fill={C.wood} />
    <circle cx="214" cy="92" r="4" fill={C.wood} />
  </g>
  <g class="in in-rise" style="--e: 380">
    <g class="loop-sway origin-top" style="--t: 3.8s; --rot: 2.5">
      <path d="M32 91 L70 140 L64 146 L31 95 Z" fill={C.wood} />
      <path d="M216 91 L178 140 L184 146 L217 95 Z" fill={C.wood} />
      <path d="M60 140 C76 202 172 202 188 140 C170 170 78 170 60 140 Z" fill={C.red} />
      <path d="M64 150 C82 194 166 194 184 150 L182 156 C164 198 84 198 66 156 Z" fill={C.yellow} />
      <path d="M72 166 C92 196 156 196 176 166 L173 172 C152 200 96 200 75 172 Z" fill={C.yellow} />
    </g>
  </g>

  <!-- Standventilator -->
  <g class="in in-rise" style="--e: 460">
    <ellipse cx="318" cy="240" rx="28" ry="7" fill={C.fan} />
    <rect x="315" y="168" width="6" height="72" fill={C.fan} />
    <circle cx="318" cy="160" r="32" fill={C.blade} opacity="0.3" />
    <path d="M318 126 A34 34 0 1 1 317.9 126 Z M318 130 A30 30 0 1 0 318.1 130 Z" fill={C.fan} fill-rule="evenodd" />
    <g transform="translate(318 160)">
      <g class="loop-spin" style="--t: 0.7s">
        <!-- unsichtbarer Kreis: Drehpunkt (Mitte der Füllbox) = Nabe -->
        <circle r="31" fill="none" />
        {#each [0, 120, 240] as a (a)}<ellipse cx="0" cy="-15" rx="9" ry="15" fill={C.blade} transform="rotate({a})" />{/each}
      </g>
    </g>
    <circle cx="318" cy="160" r="6" fill={C.fan} />
  </g>
</Scene>
