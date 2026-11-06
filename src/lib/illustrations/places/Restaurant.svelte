<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';

  /**
   * Restaurant: Garküche am Gehweg – dampfende Phở auf dem niedrigen Blechtisch, rote und blaue Plastikhocker,
   * Speisetafel an der Wand, Laternen unter der Decke.
   * Aufbau: Wand und Boden, Tafel, Tisch, die Schale ploppt auf, Hocker steigen, Laternen sinken herab.
   * Leben: Dampf steigt in drei versetzten Schwaden, die Laternen pendeln. Nacht: die Laternen leuchten.
   */
  let { label = 'Garküche' }: { label?: string } = $props();

  const DAY = {
    wall: '#F4CB7C',
    wallShade: '#E6B25F',
    red: '#DA251D',
    gold: '#FFCD00',
    table: '#6E7F8F',
    tableShade: '#4F5D6B',
    blue: '#2E7DC4',
    bowl: '#FFF8EC',
    bowlShade: '#E5D8BF',
    broth: '#E9A54B',
    herb: '#4DA05A',
    steam: '#FFFFFF',
    floor: '#C9B497',
    floorShade: '#B49D7E',
  };
  const NIGHT: typeof DAY = {
    wall: '#4B4262',
    wallShade: '#3B3450',
    red: '#C0352B',
    gold: '#F2C230',
    table: '#3F4B5E',
    tableShade: '#2B3443',
    blue: '#25578A',
    bowl: '#EDE3CC',
    bowlShade: '#C4B89C',
    broth: '#C98A3C',
    herb: '#3F7F4A',
    steam: '#B9BED6',
    floor: '#38374B',
    floorShade: '#2C2B3D',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);
</script>

{#snippet lantern(x: number, len: number, e: number, d: number)}
  <g class="in in-drop" style="--e: {e}">
    <g class="loop-sway origin-top" style="--t: 3.6s; --d: {d}s; --rot: 4">
      <rect x={x - 1} y="-4" width="2" height={len + 4} fill={C.tableShade} />
      <g transform="translate({x} {len + 20})">
        {#if night}<Glow x={0} y={0} r={17} color={C.gold} t={3} d={d} />{/if}
        <ellipse cx="0" cy="0" rx="17" ry="21" fill={C.red} />
        <rect x="-9" y="-25" width="18" height="7" rx="2" fill={C.gold} />
        <rect x="-9" y="18" width="18" height="7" rx="2" fill={C.gold} />
        <path d="M-2.5 25 L2.5 25 L4 42 L-4 42 Z" fill={C.gold} />
      </g>
    </g>
  </g>
{/snippet}

{#snippet stool(x: number, color: string)}
  <!-- niedriger Plastikhocker, vorn offen zwischen den Beinen -->
  <rect x={x + 4} y="196" width="68" height="10" rx="4" fill={color} />
  <path d="M{x + 8} 206 L{x + 68} 206 L{x + 76} 250 L{x} 250 Z" fill={color} />
  <path d="M{x + 18} 250 C{x + 18} 228 {x + 58} 228 {x + 58} 250 Z" fill={C.floorShade} />
  <ellipse cx={x + 38} cy="201" rx="11" ry="2.2" fill={C.floorShade} />
{/snippet}

{#snippet wisp(x: number, d: number)}
  <g transform="translate({x} 114)">
    <g class="loop-steam origin-bottom" style="--t: 3.3s; --d: {d}s; --rise: 26">
      <path d="M-2 0 C-12 -10 6 -18 -3 -30 C-9 -38 -1 -46 -3 -54 C9 -45 7 -37 8 -29 C14 -17 -1 -10 8 0 Z" fill={C.steam} opacity="0.92" />
    </g>
  </g>
{/snippet}

<Scene {label}>
  <!-- Wand mit gekachelter Sockelzone -->
  <g class="in in-fade" style="--e: 0">
    <rect width="400" height="192" fill={C.wall} />
    <rect y="150" width="400" height="42" fill={C.wallShade} />
  </g>

  <!-- Speisetafel -->
  <g class="in in-fade" style="--e: 200">
    <rect x="24" y="30" width="106" height="84" rx="8" fill={C.tableShade} />
    <rect x="38" y="44" width="52" height="8" rx="4" fill={C.gold} />
    {#each [70, 54, 64, 46] as w, i (i)}
      <rect x="38" y={64 + i * 12} width={w} height="5" rx="2.5" fill={C.bowl} />
      <rect x="112" y={64 + i * 12} width="8" height="5" rx="2.5" fill={C.gold} />
    {/each}
  </g>

  {@render lantern(296, 18, 300, 0)}
  {@render lantern(352, 36, 380, -1.4)}

  <!-- Boden -->
  <g class="in in-rise" style="--e: 0">
    <rect y="190" width="400" height="70" fill={C.floor} />
    <rect y="214" width="400" height="3" fill={C.floorShade} />
    <rect y="240" width="400" height="3" fill={C.floorShade} />
  </g>

  <!-- niedriger Blechtisch -->
  <g class="in in-rise" style="--e: 140">
    <ellipse cx="200" cy="242" rx="124" ry="6" fill={C.floorShade} />
    <rect x="98" y="190" width="8" height="50" fill={C.tableShade} />
    <rect x="294" y="190" width="8" height="50" fill={C.tableShade} />
    <path d="M96 170 L304 170 L316 184 L84 184 Z" fill={C.table} />
    <rect x="84" y="184" width="232" height="8" fill={C.tableShade} />
  </g>

  <!-- Phở: Schale mit Brühe, Nudeln, Kräutern, Chili; Stäbchen schräg darüber -->
  <g class="in in-pop origin-bottom" style="--e: 420">
    <rect x="184" y="165" width="32" height="8" rx="2" fill={C.bowlShade} />
    <path d="M144 128 C146 156 168 170 200 170 C232 170 254 156 256 128 Z" fill={C.bowl} />
    <path d="M144 128 C146 156 168 170 200 170 C182 166 161 152 159 128 Z" fill={C.bowlShade} />
    <path d="M145 137 Q200 152 255 137 L253.6 144 Q200 160 146.4 144 Z" fill={C.blue} />
    <ellipse cx="200" cy="128" rx="56" ry="11" fill={C.bowl} />
    <ellipse cx="200" cy="128.5" rx="50" ry="8" fill={C.broth} />
    <ellipse cx="190" cy="129" rx="20" ry="3.6" fill={C.bowl} />
    <ellipse cx="216" cy="126.5" rx="12" ry="2.8" fill={C.bowl} />
    <ellipse cx="176" cy="125" rx="7" ry="2.4" fill={C.herb} transform="rotate(-18 176 125)" />
    <ellipse cx="224" cy="130" rx="7" ry="2.4" fill={C.herb} transform="rotate(14 224 130)" />
    <ellipse cx="204" cy="123.5" rx="5" ry="2" fill={C.herb} transform="rotate(-6 204 123.5)" />
    <circle cx="196" cy="131" r="2.3" fill={C.red} />
    <circle cx="232" cy="125" r="2.3" fill={C.red} />
    <circle cx="166" cy="130" r="2" fill={C.red} />
    <rect x="0" y="-1.8" width="96" height="3.6" rx="1.8" fill={C.tableShade} transform="translate(210 129) rotate(-21)" />
    <rect x="0" y="-1.8" width="92" height="3.6" rx="1.8" fill={C.tableShade} transform="translate(216 131) rotate(-17)" />
  </g>

  <!-- Dampf -->
  <g class="in in-fade" style="--e: 900">
    {@render wisp(176, 0)}
    {@render wisp(200, -1.1)}
    {@render wisp(224, -2.2)}
  </g>

  <!-- Hocker vorn -->
  <g class="in in-rise" style="--e: 260">{@render stool(26, C.red)}</g>
  <g class="in in-rise" style="--e: 320">{@render stool(298, C.blue)}</g>
</Scene>
