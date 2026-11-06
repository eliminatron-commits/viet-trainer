<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';
  import Sky from '../Sky.svelte';

  /**
   * Familie: Wohnhaus mit offenen Fensterläden, davor die Wäscheleine mit Hemd, Kleid, Kinderhemd und Söckchen –
   * große und kleine Kleider einer Familie. Bougainvillea fällt vom Vordach.
   * Aufbau: Haus steigt, Leine spannt sich, die Kleider fallen an ihre Klammern. Leben: die Wäsche weht.
   * Nacht: Fenster und Tür sind erleuchtet.
   */
  let { label = 'Wohnhaus mit Wäscheleine' }: { label?: string } = $props();

  const DAY = {
    sky: '#FDE6CF',
    wall: '#F7C948',
    wallShade: '#E3AE2F',
    shutter: '#2BA98C',
    shutterShade: '#1F8A71',
    wood: '#7A4A2A',
    win: '#3A3A45',
    red: '#DA251D',
    blue: '#2E7DC4',
    pink: '#F28BA6',
    ground: '#E8D2AE',
    groundShade: '#D6BB90',
    plant: '#4DA05A',
  };
  const NIGHT: typeof DAY = {
    sky: '#1B2442',
    wall: '#6A5A3A',
    wallShade: '#544629',
    shutter: '#1F5C55',
    shutterShade: '#174640',
    wood: '#4A2F1E',
    win: '#FFC14D',
    red: '#A8322A',
    blue: '#26558A',
    pink: '#A86A7E',
    ground: '#3E3C50',
    groundShade: '#323043',
    plant: '#2F6B3F',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  /** T-Shirt, oben mittig an der Leine (0|0). */
  const SHIRT = 'M-14 0 L14 0 L32 11 L25 27 L17 23 L17 56 L-17 56 L-17 23 L-25 27 L-32 11 Z';
</script>

{#snippet pins(dx: number)}
  <rect x={-dx - 2} y="-4" width="4" height="9" rx="1.5" fill={C.wood} />
  <rect x={dx - 2} y="-4" width="4" height="9" rx="1.5" fill={C.wood} />
{/snippet}

{#snippet hanging(x: number, y: number, e: number, t: number, d: number, rot: number, kind: 'shirt' | 'dress' | 'kid' | 'socks')}
  <g transform="translate({x} {y})">
    <g class="in in-drop" style="--e: {e}">
      <g class="loop-sway origin-top" style="--t: {t}s; --d: {d}s; --rot: {rot}">
        {#if kind === 'shirt'}
          <path d={SHIRT} fill={C.blue} />
          <path d="M-7 0 L7 0 L0 7 Z" fill={C.sky} />
          {@render pins(10)}
        {:else if kind === 'dress'}
          <path d="M-9 0 L9 0 L12 16 L27 66 L-27 66 L-12 16 Z" fill={C.pink} />
          <rect x="-13" y="15" width="26" height="5" rx="2" fill={C.red} />
          {@render pins(7)}
        {:else if kind === 'kid'}
          <g transform="scale(0.62)"><path d={SHIRT} fill={C.red} /></g>
          <path d="M-4.5 0 L4.5 0 L0 4.5 Z" fill={C.sky} />
          {@render pins(6)}
        {:else}
          <path d="M-11 0 L-4 0 L-4 12 L1 15 L1 20 L-11 20 Z" fill={C.wall} />
          <path d="M4 0 L11 0 L11 12 L16 15 L16 20 L4 20 Z" fill={C.wall} />
          <rect x="-9.5" y="-4" width="4" height="8" rx="1.5" fill={C.wood} />
          <rect x="5.5" y="-4" width="4" height="8" rx="1.5" fill={C.wood} />
        {/if}
      </g>
    </g>
  </g>
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />
  <Sky x={346} y={44} r={22} />

  <!-- Wohnhaus: rotes Vordach, oben Fenster mit Läden und Blumenkasten, unten die offene Tür -->
  <g class="in in-rise" style="--e: 60">
    <rect x="-10" y="30" width="226" height="180" fill={C.wall} />
    <rect x="-10" y="38" width="226" height="8" fill={C.wallShade} />
    <path d="M-10 22 L214 22 L226 38 L-10 38 Z" fill={C.red} />
    <!-- Fenster -->
    {#if night}<Glow x={100} y={86} r={30} color={C.win} t={3.4} />{/if}
    <rect x="62" y="58" width="76" height="58" rx="3" fill={C.win} />
    <rect x="98" y="58" width="4" height="58" fill={C.wallShade} />
    <rect x="34" y="56" width="26" height="62" rx="2" fill={C.shutter} />
    <rect x="140" y="56" width="26" height="62" rx="2" fill={C.shutter} />
    {#each [66, 78, 90, 102] as sy (sy)}
      <rect x="38" y={sy} width="18" height="4" rx="1" fill={C.shutterShade} />
      <rect x="144" y={sy} width="18" height="4" rx="1" fill={C.shutterShade} />
    {/each}
    <rect x="54" y="116" width="92" height="6" fill={C.wallShade} />
    <!-- Tür -->
    {#if night}<Glow x={110} y={176} r={26} color={C.win} t={3.8} d={-1} />{/if}
    <rect x="74" y="144" width="72" height="66" fill={C.win} />
    <rect x="60" y="142" width="14" height="68" fill={C.wood} />
    <rect x="146" y="142" width="14" height="68" fill={C.wood} />
    <rect x="66" y="138" width="88" height="6" fill={C.wallShade} />
  </g>

  <!-- Blumenkasten am Fenster -->
  <g class="in in-pop origin-bottom" style="--e: 420">
    <ellipse cx="78" cy="106" rx="9" ry="7" fill={C.plant} />
    <ellipse cx="98" cy="104" rx="10" ry="8" fill={C.plant} />
    <ellipse cx="120" cy="106" rx="9" ry="7" fill={C.plant} />
    <circle cx="84" cy="101" r="3.5" fill={C.red} />
    <circle cx="104" cy="99" r="3.5" fill={C.red} />
    <circle cx="116" cy="102" r="3" fill={C.red} />
    <rect x="68" y="108" width="64" height="10" rx="3" fill={C.wood} />
  </g>

  <!-- Bougainvillea fällt vom Vordach -->
  <g class="in in-pop" style="--e: 520">
    <g class="loop-sway origin-top" style="--t: 4.4s; --rot: 3">
      <ellipse cx="200" cy="44" rx="16" ry="10" fill={C.plant} />
      <ellipse cx="210" cy="60" rx="9" ry="12" fill={C.plant} />
      {#each [[192, 40, 4.5], [204, 36, 4], [212, 46, 4.5], [200, 52, 4], [212, 60, 4], [207, 72, 3.5], [186, 50, 3.5]] as [fx, fy, fr], i (i)}
        <circle cx={fx} cy={fy} r={fr} fill={C.pink} />
      {/each}
    </g>
  </g>

  <!-- Boden -->
  <g class="in in-rise" style="--e: 0">
    <rect y="208" width="400" height="52" fill={C.ground} />
    <rect y="238" width="400" height="4" fill={C.groundShade} />
  </g>

  <!-- Topfpflanze vor dem Haus -->
  <g class="in in-pop origin-bottom" style="--e: 460">
    <ellipse cx="30" cy="184" rx="14" ry="20" fill={C.plant} />
    <ellipse cx="18" cy="194" rx="9" ry="13" fill={C.plant} />
    <path d="M14 200 L46 200 L42 222 L18 222 Z" fill={C.red} />
  </g>

  <!-- Bambusstange und Leine -->
  <g class="in in-grow" style="--e: 380">
    <rect x="366" y="78" width="7" height="140" rx="3" fill={C.wood} />
    <ellipse cx="369.5" cy="218" rx="12" ry="3" fill={C.groundShade} />
  </g>
  <g class="in in-fade" style="--e: 560">
    <path d="M214 95 Q290 112 369 87 L369 89.6 Q290 114.6 214 97.6 Z" fill={C.wood} />
  </g>

  <!-- Wäsche: Hemd, Kleid, Kinderhemd, Söckchen – Höhen folgen dem Durchhang der Leine -->
  {@render hanging(241, 101, 640, 3.2, 0, 5, 'shirt')}
  {@render hanging(283, 103, 720, 3.6, -1.2, 4, 'dress')}
  {@render hanging(322, 100, 800, 2.8, -0.6, 6, 'kid')}
  {@render hanging(347, 95, 880, 2.4, -1.6, 7, 'socks')}
</Scene>
