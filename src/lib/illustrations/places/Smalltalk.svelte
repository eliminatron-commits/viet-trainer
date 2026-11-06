<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';

  /**
   * Smalltalk: Trà đá am Straßenrand – zwei Leute auf niedrigen Plastikhockern unter einem Baum,
   * zwischen ihnen zwei Gläser Eistee.
   * Aufbau: Wand und Gehweg, Baumkrone, Hocker und Leute steigen, die Gläser ploppen auf.
   * Leben: abwechselnd ploppt über beiden eine Sprechblase auf (Gespräch), die Köpfe nicken, das Laub atmet.
   * Nacht: eine Glühbirne hängt leuchtend im Baum.
   */
  let { label = 'Eistee am Straßenrand' }: { label?: string } = $props();

  const DAY = {
    wall: '#F6E3B4',
    wallShade: '#E9CD92',
    leaf: '#4DA05A',
    leafShade: '#3B7F4A',
    trunk: '#8A6A4E',
    red: '#DA251D',
    blue: '#2E7DC4',
    tea: '#D9862F',
    cream: '#FFF8EC',
    ink: '#2B2B33',
    skin: '#C98A5E',
    pants: '#4A4E6A',
    ground: '#D8C6A8',
    groundShade: '#C4AF8C',
  };
  const NIGHT: typeof DAY = {
    wall: '#4A4560',
    wallShade: '#3A3650',
    leaf: '#2C5E3E',
    leafShade: '#214A31',
    trunk: '#4E3D30',
    red: '#A8322A',
    blue: '#26558A',
    tea: '#A8692F',
    cream: '#E8E0CC',
    ink: '#14161D',
    skin: '#8A5E43',
    pants: '#2C2F45',
    ground: '#3B394F',
    groundShade: '#302E42',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  const BACK = [
    [10, 8, 42],
    [92, -6, 46],
    [172, 4, 38],
    [252, -10, 42],
    [334, 2, 40],
    [408, -8, 42],
  ] as const;
  const FRONT = [
    [44, 22, 34],
    [124, 12, 38],
    [206, 20, 30],
    [286, 10, 34],
    [366, 18, 32],
  ] as const;
</script>

<!-- Sitzende Person auf niedrigem Hocker, Blick nach rechts (rechte Person = gespiegelt) -->
{#snippet sitter(stool: string, shirt: string, bun: boolean, e: number, talk: number)}
  <g class="in in-rise" style="--e: {e}">
    <rect x="72" y="196" width="64" height="9" rx="4" fill={stool} />
    <path d="M76 205 L132 205 L139 244 L69 244 Z" fill={stool} />
    <path d="M86 244 C86 225 122 225 122 244 Z" fill={C.groundShade} />
    <path d="M92 186 C92 180 98 178 104 178 L132 174 C140 173 145 178 144 186 L142 238 L131 238 L132 192 L104 198 C96 199 92 194 92 186 Z" fill={C.pants} />
    <ellipse cx="140" cy="240" rx="9" ry="3.5" fill={C.ink} />
    <path d="M90 190 L86 152 C85 140 94 134 104 134 C114 134 120 141 120 152 L118 190 Z" fill={shirt} />
    <path d="M108 140 C116 148 124 158 132 168 L126 174 C118 166 110 156 102 148 Z" fill={shirt} />
    <circle cx="131" cy="171" r="5" fill={C.skin} />
    <rect x="99" y="124" width="10" height="12" fill={C.skin} />
    <g class="loop-bob" style="--t: 2.2s; --d: {talk}s; --amp: 1; --rot: 3">
      {#if bun}<circle cx="92" cy="107" r="7" fill={C.ink} />{/if}
      <circle cx="106" cy="116" r="13" fill={C.skin} />
      <path d="M93 115 C92 102 102 96 112 98 C118 99 121 104 120 110 C114 106 104 106 98 118 {bun ? 'L96 130 C92 128 91 121 93 115' : ''} Z" fill={C.ink} />
    </g>
  </g>
  <!-- Sprechblase über dem Kopf -->
  <g class="in in-fade" style="--e: {e + 600}">
    <g class="loop-talk origin-bottom" style="--t: 4.4s; --d: {talk}s">
      <rect x="118" y="56" width="48" height="30" rx="15" fill={C.cream} />
      <path d="M128 82 L118 98 L140 84 Z" fill={C.cream} />
      {#each [130, 142, 154] as dx (dx)}<circle cx={dx} cy="71" r="3.2" fill={C.ink} />{/each}
    </g>
  </g>
{/snippet}

{#snippet glass(x: number, d: number)}
  <path d="M{x - 7} 192 L{x + 7} 192 L{x + 8} 172 L{x - 8} 172 Z" fill={C.cream} opacity="0.85" />
  <path d="M{x - 6.3} 190.5 L{x + 6.3} 190.5 L{x + 7} 177 L{x - 7} 177 Z" fill={C.tea} />
  <g class="loop-bob" style="--t: 1.8s; --d: {d}s; --amp: 1.5; --rot: 8">
    <rect x={x - 5} y="176" width="5" height="5" rx="1" fill={C.cream} />
    <rect x={x + 0.5} y="179" width="4.5" height="4.5" rx="1" fill={C.cream} />
  </g>
{/snippet}

<Scene {label}>
  <!-- Hauswand und Gehweg -->
  <g class="in in-fade" style="--e: 0">
    <rect width="400" height="204" fill={C.wall} />
    <rect y="150" width="400" height="54" fill={C.wallShade} />
  </g>
  <g class="in in-rise" style="--e: 0">
    <rect y="200" width="400" height="60" fill={C.ground} />
    <rect y="200" width="400" height="6" fill={C.groundShade} />
  </g>

  <!-- Baum: Stamm und Krone, das Laub atmet -->
  <g class="in in-rise" style="--e: 60">
    <rect x="16" y="20" width="24" height="186" rx="6" fill={C.trunk} />
  </g>
  <g class="in in-drop" style="--e: 120">
    {#each BACK as [lx, ly, lr], i (i)}
      <g class="loop-breathe" style="--t: {4 + (i % 3) * 0.7}s; --d: {-i * 0.9}s; --s: 1.04"><circle cx={lx} cy={ly} r={lr} fill={C.leafShade} /></g>
    {/each}
    {#each FRONT as [lx, ly, lr], i (i)}
      <g class="loop-breathe" style="--t: {4.6 + (i % 2) * 0.8}s; --d: {-i * 1.3}s; --s: 1.05"><circle cx={lx} cy={ly} r={lr} fill={C.leaf} /></g>
    {/each}
  </g>

  <!-- Glühbirne im Baum -->
  <g class="in in-drop" style="--e: 500">
    <g class="loop-sway origin-top" style="--t: 3.6s; --rot: 3">
      <rect x="199" y="40" width="2" height="22" fill={C.ink} />
      {#if night}<Glow x={200} y={68} r={7} color={C.cream} t={3} />{/if}
      <circle cx="200" cy="68" r="6.5" fill={C.cream} />
    </g>
  </g>

  <!-- Tischchen mit zwei Gläsern Eistee -->
  <g class="in in-rise" style="--e: 300">
    <rect x="182" y="196" width="4" height="42" fill={C.trunk} />
    <rect x="214" y="196" width="4" height="42" fill={C.trunk} />
    <rect x="176" y="191" width="48" height="6" rx="2" fill={C.trunk} />
  </g>
  <g class="in in-pop origin-bottom" style="--e: 640">
    {@render glass(190, 0)}
    {@render glass(210, -0.9)}
  </g>

  {@render sitter(C.red, C.blue, false, 220, 0)}
  <g transform="translate(400 0) scale(-1 1)">{@render sitter(C.blue, C.red, true, 280, -2.2)}</g>
</Scene>
