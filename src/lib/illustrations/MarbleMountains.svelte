<script lang="ts">
  import { theme } from '../theme.svelte';
  import Glow from './Glow.svelte';
  import Scene from './Scene.svelte';
  import Sky, { MOON_SHINE } from './Sky.svelte';

  /**
   * Đà Nẵng: Thúng-chai-Korbboote vor den Marmorbergen (Ngũ Hành Sơn) – Referenz für alle Szenen.
   * Aufbau: Meer steigt, Berge wachsen daraus, Sonne bzw. Mond geht auf, Boote gleiten herein, die Pagode ploppt auf.
   * Leben: Hof atmet, Wolken ziehen, Vögel queren (bei Tag), Wellenlichter glitzern, Boote schaukeln, der Fischer rudert.
   * Nacht: Mondpfad auf dem Meer, Laterne am Fischerboot, erleuchtete Pagode, Lichter der Stadt hinter den Bergen.
   */
  let { label = 'Korbboote vor den Marmorbergen' }: { label?: string } = $props();

  const DAY = {
    sky: '#FDE6CF',
    cloud: '#FFF4E6',
    far: '#B9DACF',
    rock: '#4E9E8F',
    rockShade: '#3B7F73',
    roof: '#DA251D',
    sea: '#2BB3A8',
    seaLight: '#79D3C8',
    sand: '#F6D9A8',
    sandShade: '#EBC487',
    boat: '#9A5B2E',
    boatDark: '#6B3D1E',
    boatLight: '#C8854A',
    hat: '#F2D27A',
    hatShade: '#D9B456',
    skin: '#C98A5E',
  };
  const NIGHT: typeof DAY = {
    sky: '#1B2442',
    cloud: '#2A3459',
    far: '#28365A',
    rock: '#24545C',
    rockShade: '#183D43',
    roof: '#B8362C',
    sea: '#173E58',
    seaLight: '#4F72A0',
    sand: '#4C4A60',
    sandShade: '#3B394F',
    boat: '#5E3A24',
    boatDark: '#3C2416',
    boatLight: '#7C5233',
    hat: '#B7A26C',
    hatShade: '#8E7C4F',
    skin: '#8A5E43',
  };
  const LAMP = '#FFC14D';
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);
</script>

{#snippet boat(fisher: boolean, onWater: boolean)}
  {#if onWater}<ellipse cx="0" cy="13" rx="40" ry="6" fill={C.seaLight} />{:else}<ellipse cx="0" cy="17" rx="38" ry="6" fill={C.sandShade} />{/if}
  {#if fisher}
    {#if night}
      <!-- Laterne am Bug, ihr Licht liegt warm auf dem Wasser -->
      <ellipse cx="-30" cy="14" rx="16" ry="3" fill={LAMP} opacity="0.35" />
      <rect x="-31" y="-34" width="2" height="34" fill={C.boatDark} />
      <Glow x={-30} y={-30} r={7} color={LAMP} />
      <rect x="-34" y="-34" width="8" height="9" rx="2" fill={LAMP} />
    {/if}
    <rect x="-9" y="-24" width="18" height="22" rx="7" fill={C.roof} />
    <circle cx="0" cy="-27" r="6" fill={C.skin} />
    <path d="M-17 -27 L0 -42 L17 -27 Z" fill={C.hat} />
    <path d="M0 -42 L17 -27 L0 -27 Z" fill={C.hatShade} />
    <g class="loop-sway" style="--t: 1.6s; --rot: 9; transform-origin: 0 0">
      <path d="M8 -14 L40 18 L36 21 L5 -11 Z" fill={C.boatDark} />
    </g>
  {/if}
  <path d="M-32 0 C-32 20 32 20 32 0 Z" fill={C.boat} />
  <path d="M-29 7 C-18 14 18 14 29 7 C18 11 -18 11 -29 7 Z" fill={C.boatLight} />
  <path d="M-23 13 C-12 17 12 17 23 13 C12 15.5 -12 15.5 -23 13 Z" fill={C.boatLight} />
  <ellipse cx="0" cy="0" rx="32" ry="6.5" fill={C.boatDark} />
  <ellipse cx="0" cy="0.5" rx="27" ry="4" fill={C.boat} />
{/snippet}

{#snippet bird(x: number, y: number, s: number, t: number, d: number)}
  <g class="loop-cross" style="--t: {t}s; --d: {d}s; --dist: 520px">
    <g transform="translate({x} {y}) scale({s})">
      <g class="loop-flap" style="--d: {d / 7}s">
        <path d="M0 0 Q6 -7 12 0 Q18 -7 24 0 Q18 -3 12 3 Q6 -3 0 0 Z" fill={C.rockShade} />
      </g>
    </g>
  </g>
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />

  <!-- Sonne bzw. Mond mit Sternen -->
  <Sky x={318} y={62} r={30} />

  <!-- Wolken gleiten herein und ziehen -->
  <g class="in in-left" style="--e: 120">
    <g class="loop-drift" style="--t: 26s; --dx: 22">
      <path d="M40 58 C40 46 58 42 64 50 C68 40 88 40 90 54 C100 54 104 66 94 68 L44 68 C34 68 32 58 40 58 Z" fill={C.cloud} />
    </g>
  </g>
  <g class="in in-right" style="--e: 200">
    <g class="loop-drift" style="--t: 34s; --dx: 18; --d: -9s">
      <path d="M220 34 C222 26 236 24 240 30 C244 24 258 26 258 36 C264 36 266 44 258 44 L224 44 C216 44 214 36 220 34 Z" fill={C.cloud} />
    </g>
  </g>

  {#if !night}
    {@render bird(-60, 70, 0.8, 15, -3)}
    {@render bird(-90, 92, 0.6, 19, -11)}
  {/if}

  <!-- ferne Hügelkette, nachts mit den Lichtern der Stadt -->
  <g class="in in-rise" style="--e: 80">
    <path
      d="M0 158 C14 150 24 132 40 130 C54 128 60 146 76 144 C92 142 98 120 118 122 C140 124 150 150 176 148 C200 146 210 128 232 130 C254 132 262 150 286 150 C306 150 318 134 340 136 C362 138 380 152 400 150 L400 182 L0 182 Z"
      fill={C.far}
    />
    {#if night}
      {#each [[18, 168], [36, 174], [214, 170], [226, 176], [322, 164], [352, 172], [376, 168], [392, 176]] as [lx, ly], i (lx)}
        <g class="loop-twinkle" style="--t: {1.4 + (i % 3) * 0.6}s; --d: {-i * 0.4}s"><circle cx={lx} cy={ly} r="1.4" fill={LAMP} /></g>
      {/each}
    {/if}
  </g>

  <!-- Marmorberge: Kalksteinkegel, Schattenseite links – wachsen aus dem Meer -->
  <g class="in in-rise" style="--e: 160">
    <path d="M52 182 C54 146 62 104 90 86 C108 74 122 86 128 100 C136 86 152 78 168 88 C188 100 194 146 198 182 Z" fill={C.rock} />
    <path d="M52 182 C54 146 62 104 90 86 C96 82 101 80 106 80 C88 96 80 140 84 182 Z" fill={C.rockShade} />
    <path d="M128 100 C132 118 134 150 132 182 L120 182 C122 150 122 122 128 100 Z" fill={C.rockShade} />
    <circle cx="150" cy="96" r="9" fill={C.rockShade} />
    <circle cx="160" cy="102" r="7" fill={C.rockShade} />
  </g>
  <g class="in in-rise" style="--e: 240">
    <path d="M232 182 C236 158 246 128 268 122 C290 116 302 144 308 182 Z" fill={C.rock} />
    <path d="M232 182 C236 158 246 128 268 122 C258 136 254 160 256 182 Z" fill={C.rockShade} />
    <circle cx="284" cy="128" r="7" fill={C.rockShade} />
  </g>

  <!-- kleine Pagode auf dem Gipfel ploppt auf, nachts erleuchtet -->
  <g class="in in-pop origin-bottom" style="--e: 620">
    <g transform="translate(104 72)">
      {#if night}<Glow x={0} y={2} r={8} color={LAMP} t={3.2} />{/if}
      <rect x="-5" y="0" width="10" height="14" fill={C.boatDark} />
      {#if night}<rect x="-2.5" y="3" width="5" height="7" fill={LAMP} />{/if}
      <path d="M-14 1 Q-8 0 -7 -4 L7 -4 Q8 0 14 1 Q0 -1.5 -14 1 Z" fill={C.roof} />
      <rect x="-3.5" y="-11" width="7" height="7" fill={C.boatDark} />
      <path d="M-11 -10 Q-6 -11 -5 -14.5 L5 -14.5 Q6 -11 11 -10 Q0 -12.5 -11 -10 Z" fill={C.roof} />
      <path d="M-1.4 -14.5 L1.4 -14.5 L0 -22 Z" fill={C.roof} />
    </g>
  </g>

  <!-- Meer mit glitzernden Wellenlichtern; nachts liegt der Mondpfad darauf -->
  <g class="in in-rise" style="--e: 0">
    <rect x="0" y="180" width="400" height="48" fill={C.sea} />
    {#if night}
      {#each [[318, 189, 16], [312, 197, 24], [322, 206, 19], [314, 216, 30]] as [mx, my, mr], i (my)}
        <g class="loop-shimmer" style="--t: {2.4 + i * 0.4}s; --d: {-i * 0.6}s; --dx: 5"><ellipse cx={mx} cy={my} rx={mr} ry="1.8" fill={MOON_SHINE} /></g>
      {/each}
    {/if}
    <g class="loop-shimmer" style="--t: 3.1s"><ellipse cx="60" cy="190" rx="26" ry="2" fill={C.seaLight} /></g>
    <g class="loop-shimmer" style="--t: 3.7s; --d: -1.2s; --dx: -12"><ellipse cx="230" cy="202" rx="34" ry="2.2" fill={C.seaLight} /></g>
    <g class="loop-shimmer" style="--t: 2.8s; --d: -2s"><ellipse cx="350" cy="188" rx="22" ry="1.8" fill={C.seaLight} /></g>
    <g class="loop-shimmer" style="--t: 3.4s; --d: -0.6s; --dx: -8"><ellipse cx="120" cy="214" rx="30" ry="2" fill={C.seaLight} /></g>
  </g>

  <!-- Boote gleiten herein, treiben und schaukeln -->
  <g class="in in-right" style="--e: 420">
    <g class="loop-drift" style="--t: 14s; --dx: 10">
      <g transform="translate(300 194) scale(0.62)">
        <g class="loop-bob" style="--t: 2.6s; --d: -1.1s; --rot: 4"><g>{@render boat(false, true)}</g></g>
      </g>
    </g>
  </g>
  <g class="in in-left" style="--e: 340">
    <g class="loop-drift" style="--t: 18s; --dx: 14; --d: -6s">
      <g transform="translate(176 200) scale(0.95)">
        <g class="loop-bob" style="--t: 3.2s; --rot: 3; --amp: 3"><g>{@render boat(true, true)}</g></g>
      </g>
    </g>
  </g>

  <!-- Strand im Vordergrund -->
  <g class="in in-rise" style="--e: 300">
    <path d="M0 222 C90 208 220 236 400 214 L400 260 L0 260 Z" fill={C.sand} />
    <path d="M0 246 C70 238 140 252 220 250 C300 248 350 240 400 244 L400 260 L0 260 Z" fill={C.sandShade} />
  </g>
  <g class="in in-left" style="--e: 520">
    <g transform="translate(70 232) scale(1.25)">{@render boat(false, false)}</g>
  </g>
</Scene>
