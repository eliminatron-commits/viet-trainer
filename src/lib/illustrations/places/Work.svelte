<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';

  /**
   * Arbeit: Schreibtisch am Fenster – aufgeklappter Laptop, rote Tasse mit Dampf, Notizbuch, Wanduhr,
   * draußen die Stadt.
   * Aufbau: Wand und Fenster, der Tisch steigt, der Laptop klappt auf, Tasse und Heft ploppen auf.
   * Leben: Zeilen tippen sich ein, der Cursor blinkt, der Minutenzeiger läuft, der Tee dampft.
   * Nacht: der Bildschirm leuchtet, in der Stadt brennen Lichter.
   */
  let { label = 'Laptop am Fenster' }: { label?: string } = $props();

  const DAY = {
    wall: '#C4DFD7',
    wallShade: '#AACFC3',
    desk: '#C8854A',
    deskShade: '#9A5B2E',
    body: '#6E7F8F',
    bodyShade: '#4F5D6B',
    screen: '#2E3A4F',
    lineA: '#79D3C8',
    lineB: '#FFCD00',
    red: '#DA251D',
    cream: '#FFF8EC',
    outside: '#FDE6CF',
    city: '#B9DACF',
  };
  const NIGHT: typeof DAY = {
    wall: '#2F3B50',
    wallShade: '#26304A',
    desk: '#7C5233',
    deskShade: '#5E3D24',
    body: '#4A5668',
    bodyShade: '#343E4E',
    screen: '#1A2233',
    lineA: '#79D3C8',
    lineB: '#FFCD00',
    red: '#A8322A',
    cream: '#D9D2C0',
    outside: '#1B2442',
    city: '#28365A',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  const LINES = [70, 92, 54, 80, 40, 64];
  const T = 6;
  /** Häuser im Fenster: x, Oberkante, Breite */
  const TOWERS = [[32, 70, 30], [62, 54, 22], [84, 82, 26], [110, 60, 20], [130, 76, 22]] as const;
</script>

{#snippet wisp(x: number, d: number)}
  <g transform="translate({x} 136)">
    <g class="loop-steam origin-bottom" style="--t: 3.4s; --d: {d}s; --rise: 12">
      <path d="M-2 0 C-10 -8 5 -14 -2 -24 C-7 -30 -1 -36 -2 -42 C8 -35 6 -29 7 -23 C12 -14 -1 -8 7 0 Z" fill={C.cream} opacity="0.92" />
    </g>
  </g>
{/snippet}

<Scene {label}>
  <rect width="400" height="176" fill={C.wall} />
  <rect y="150" width="400" height="26" fill={C.wallShade} />

  <!-- Fenster mit Stadt; nachts Lichter -->
  <g class="in in-fade" style="--e: 80">
    <rect x="24" y="24" width="136" height="116" rx="4" fill={C.body} />
    <rect x="32" y="32" width="120" height="100" fill={C.outside} />
    {#each TOWERS as [bx, top, bw] (bx)}
      <rect x={bx} y={top} width={bw} height={132 - top} fill={C.city} />
      {#if night}
        {#each [0, 1, 2] as r (r)}
          {#if top + 8 + r * 14 < 126}
            <g class="loop-twinkle" style="--t: {2 + ((bx + r) % 3) * 0.6}s; --d: {-(bx / 10 + r)}s">
              <rect x={bx + 5} y={top + 8 + r * 14} width="5" height="6" rx="1" fill={C.lineB} />
            </g>
          {/if}
        {/each}
      {/if}
    {/each}
    <rect x="90" y="32" width="4" height="100" fill={C.body} />
    <rect x="32" y="80" width="120" height="4" fill={C.body} />
    <rect x="18" y="138" width="148" height="7" fill={C.bodyShade} />
  </g>

  <!-- Wanduhr: der Minutenzeiger läuft -->
  <g class="in in-pop" style="--e: 260">
    <circle cx="364" cy="48" r="26" fill={C.bodyShade} />
    <circle cx="364" cy="48" r="22" fill={C.cream} />
    {#each [0, 90, 180, 270] as a (a)}<rect x="362.5" y="29" width="3" height="5" fill={C.bodyShade} transform="rotate({a} 364 48)" />{/each}
    <rect x="362.5" y="36" width="3" height="14" rx="1.5" fill={C.bodyShade} transform="rotate(60 364 48)" />
    <g transform="translate(364 48)">
      <g class="loop-spin" style="--t: 10s">
        <circle r="18" fill="none" />
        <rect x="-1.2" y="-17" width="2.4" height="18" rx="1.2" fill={C.red} />
      </g>
    </g>
    <circle cx="364" cy="48" r="3" fill={C.bodyShade} />
  </g>

  <!-- Schreibtisch -->
  <g class="in in-rise" style="--e: 0">
    <rect y="170" width="400" height="12" fill={C.desk} />
    <rect y="182" width="400" height="78" fill={C.deskShade} />
    <rect y="200" width="400" height="3" fill={C.desk} />
  </g>

  <!-- Laptop: Zeilen tippen sich ein -->
  <g class="in in-grow" style="--e: 300">
    {#if night}<Glow x={214} y={118} r={34} color={C.lineA} t={4.2} />{/if}
    <rect x="140" y="70" width="148" height="98" rx="6" fill={C.body} />
    <rect x="148" y="78" width="132" height="82" rx="2" fill={C.screen} />
    {#each LINES as w, i (i)}
      <g class="loop-type origin-left" style="--t: {T}s; --d: {i * 0.6 - T}s">
        <rect x="158" y={88 + i * 11} width={w} height="5" rx="2.5" fill={i % 3 === 1 ? C.lineB : C.lineA} />
      </g>
    {/each}
    <g class="loop-twinkle" style="--t: 0.5s"><rect x="158" y="152" width="7" height="3" rx="1" fill={C.lineB} /></g>
    <path d="M128 166 L300 166 L312 178 L116 178 Z" fill={C.bodyShade} />
    <rect x="196" y="166" width="36" height="3" rx="1.5" fill={C.body} />
  </g>

  <!-- Notizbuch mit Stift -->
  <g class="in in-pop origin-bottom" style="--e: 440">
    <rect x="40" y="160" width="72" height="11" rx="2" fill={C.cream} />
    <rect x="46" y="153" width="66" height="8" rx="2" fill={C.lineA} />
    <rect x="52" y="148" width="54" height="4" rx="2" fill={C.red} transform="rotate(-6 79 150)" />
  </g>

  <!-- Tasse mit Dampf -->
  <g class="in in-pop origin-bottom" style="--e: 520">
    <path d="M348 148 C364 148 364 166 348 166 L348 161 C357 161 357 153 348 153 Z" fill={C.red} />
    <rect x="320" y="140" width="32" height="32" rx="6" fill={C.red} />
    <rect x="320" y="140" width="32" height="5" rx="2.5" fill={C.deskShade} />
  </g>
  <g class="in in-fade" style="--e: 900">
    {@render wisp(330, 0)}
    {@render wisp(344, -1.7)}
  </g>
</Scene>
