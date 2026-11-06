<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';

  /**
   * Markt: Obststand unter gestreifter Markise – Mangos, Drachenfrüchte und Wassermelone in flachen Körben,
   * eine Bananenstaude hängt vom Querbalken.
   * Aufbau: Markise fällt herab, Tisch steigt, die Früchte ploppen auf. Leben: die Markise flattert, die Bananen pendeln.
   * Nacht: eine Glühbirne über dem Stand leuchtet.
   */
  let { label = 'Obststand' }: { label?: string } = $props();

  const DAY = {
    back: '#FDE6CF',
    backShade: '#F1CFA8',
    red: '#DA251D',
    cream: '#FFF4E6',
    wood: '#9A5B2E',
    woodShade: '#6B3D1E',
    basket: '#C8854A',
    basketShade: '#A8692F',
    pink: '#E8477A',
    green: '#4DA05A',
    yellow: '#FFCD00',
    mango: '#E8A317',
    ground: '#D9C29A',
    groundShade: '#C6AC80',
  };
  const NIGHT: typeof DAY = {
    back: '#2A2F4A',
    backShade: '#232740',
    red: '#A8322A',
    cream: '#B8AE9A',
    wood: '#5E3A24',
    woodShade: '#3C2416',
    basket: '#7C5233',
    basketShade: '#5E3D24',
    pink: '#A8355C',
    green: '#2F6B3F',
    yellow: '#E8B93A',
    mango: '#B07A1E',
    ground: '#3B394F',
    groundShade: '#302E42',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  const STRIPES = Array.from({ length: 10 }, (_, i) => i * 44 - 12);
  /** Mangos von hinten (oben) nach vorn (unten) */
  const MANGOS = [[87, 127], [109, 128], [76, 141], [98, 140], [120, 142], [66, 154], [88, 154], [110, 154], [130, 156]] as const;
</script>

{#snippet basket(cx: number)}
  <path d="M{cx - 56} 160 C{cx - 50} 174 {cx + 50} 174 {cx + 56} 160 Z" fill={C.basket} />
  <path d="M{cx - 56} 160 C{cx - 50} 174 {cx + 50} 174 {cx + 56} 160 C{cx + 20} 168 {cx - 30} 168 {cx - 56} 160 Z" fill={C.basketShade} />
  <ellipse cx={cx} cy="160" rx="56" ry="5" fill={C.basketShade} />
{/snippet}

{#snippet dragonfruit(x: number, y: number, s: number)}
  <g transform="translate({x} {y}) scale({s})">
    <path d="M-12 -12 L-22 -20 L-10 -18 Z M10 -16 L20 -26 L16 -12 Z M-16 4 L-26 6 L-15 -3 Z M14 6 L24 2 L15 -3 Z M-2 -18 L0 -30 L5 -18 Z" fill={C.green} />
    <ellipse cx="0" cy="0" rx="16" ry="19" fill={C.pink} />
    <path d="M-7 -6 L-14 -12 L-4 -10 Z M6 2 L13 -4 L10 6 Z M-4 10 L-11 14 L-2 15 Z" fill={C.green} />
  </g>
{/snippet}

{#snippet slice(x: number, rot: number)}
  <g transform="translate({x} 160) rotate({rot})">
    <path d="M0 0 L-18 -34 Q0 -45 18 -34 Z" fill={C.green} />
    <path d="M0 -3 L-15 -32 Q0 -41 15 -32 Z" fill={C.red} />
    {#each [[-5, -24], [4, -26], [0, -15], [8, -32], [-9, -31]] as [sx, sy], i (i)}<circle cx={sx} cy={sy} r="1.5" fill={C.woodShade} />{/each}
  </g>
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.back} />

  <!-- Pfosten und Querbalken -->
  <g class="in in-fade" style="--e: 80">
    <rect y="72" width="400" height="26" fill={C.backShade} />
    <rect x="12" y="60" width="9" height="174" fill={C.wood} />
    <rect x="379" y="60" width="9" height="174" fill={C.wood} />
    <rect x="12" y="80" width="376" height="6" fill={C.woodShade} />
  </g>

  <!-- Glühbirne -->
  <g class="in in-drop" style="--e: 420">
    <g class="loop-sway origin-top" style="--t: 3.8s; --rot: 3">
      <rect x="249" y="84" width="2" height="10" fill={C.woodShade} />
      <rect x="246" y="92" width="8" height="6" rx="1" fill={C.woodShade} />
      {#if night}<Glow x={250} y={104} r={8} color={C.yellow} t={2.8} />{/if}
      <circle cx="250" cy="104" r="7" fill={night ? C.yellow : C.cream} />
    </g>
  </g>

  <!-- Bananenstaude pendelt am Balken -->
  <g class="in in-drop" style="--e: 520">
    <g class="loop-sway origin-top" style="--t: 2.9s; --rot: 6">
      <rect x="38" y="84" width="4" height="20" fill={C.woodShade} />
      {#each [-44, -22, 0, 22, 44] as a (a)}
        <path d="M0 0 C10 4 14 18 10 30 C9 33 6 33 6 30 C8 20 5 10 -2 4 Z" fill={C.yellow} transform="translate(40 102) rotate({a})" />
        <path d="M8.5 29 C9 32 6 33 6 30 Z" fill={C.green} transform="translate(40 102) rotate({a})" />
      {/each}
      <ellipse cx="40" cy="104" rx="6" ry="4" fill={C.green} />
    </g>
  </g>

  <!-- Markise mit flatternder Bogenkante -->
  <g class="in in-drop" style="--e: 0">
    {#each STRIPES as sx, i (sx)}<rect x={sx} y="0" width="44" height="72" fill={i % 2 ? C.cream : C.red} />{/each}
    <g class="loop-wave origin-top" style="--t: 1.9s; --rot: 1.2">
      {#each STRIPES as sx, i (sx)}
        <path d="M{sx} 60 L{sx + 44} 60 L{sx + 44} 71 A22 13 0 0 1 {sx} 71 Z" fill={i % 2 ? C.cream : C.red} />
      {/each}
    </g>
  </g>

  <!-- Boden und Tisch -->
  <g class="in in-rise" style="--e: 0">
    <rect y="230" width="400" height="30" fill={C.ground} />
    <rect y="246" width="400" height="4" fill={C.groundShade} />
  </g>
  <g class="in in-rise" style="--e: 140">
    <rect x="30" y="164" width="340" height="11" rx="2" fill={C.wood} />
    <rect x="36" y="175" width="328" height="57" fill={C.woodShade} />
    <rect x="36" y="194" width="328" height="3" fill={C.wood} />
    <rect x="36" y="214" width="328" height="3" fill={C.wood} />
  </g>

  <!-- Körbe mit Früchten -->
  <g class="in in-pop origin-bottom" style="--e: 380">
    {#each MANGOS as [mx, my], i (i)}
      <g transform="rotate({i % 2 ? 12 : -10} {mx} {my})">
        <ellipse cx={mx} cy={my} rx="13" ry="9.5" fill={C.mango} />
        <ellipse cx={mx + 1.6} cy={my - 1.4} rx="10.6" ry="7.4" fill={C.yellow} />
      </g>
    {/each}
    <path d="M98 119 C104 112 112 114 112 118 C106 118 102 120 98 119 Z" fill={C.green} />
    {@render basket(98)}
  </g>
  <g class="in in-pop origin-bottom" style="--e: 460">
    {@render dragonfruit(186, 138, 0.9)}
    {@render dragonfruit(218, 140, 0.9)}
    {@render dragonfruit(202, 118, 0.95)}
    {@render basket(202)}
  </g>
  <g class="in in-pop origin-bottom" style="--e: 540">
    {@render slice(282, -26)}
    {@render slice(306, 0)}
    {@render slice(330, 24)}
    {@render basket(306)}
  </g>
</Scene>
