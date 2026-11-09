<script lang="ts">
  import { onMount } from 'svelte';
  import type { RegionId } from '../../content/types';
  import { rideProgress, TRIP, TUNNEL_HALF, tunnelCenter } from '../logic/trip';
  import type { Mood } from '../mascot/Buffalo.svelte';
  import Trau from '../mascot/Trau.svelte';
  import { reducedMotion } from '../motion';
  import { theme } from '../theme.svelte';
  import Glow from './Glow.svelte';
  import RegionScene from './RegionScene.svelte';
  import Sky, { MOON_SHINE } from './Sky.svelte';

  /**
   * Die Fahrt zur nächsten Region (Reise, `components/Trip.svelte`). Drei deckungsgleiche Ebenen (viewBox 400×260,
   * slice wie jede Szene): hinten die Küste, dazwischen der neue Ort (`arrived` hängt ihn ein – er baut sich dann auf),
   * vorn ein Tunnel, Gleise und der Zug mit Trâu im Fenster. Die Kamera fährt mit: der Zug steht, die Welt zieht
   * vorbei (Parallaxe), alles nach demselben Geschwindigkeitsprofil (`rideProgress`: anfahren, gleiten, bremsen).
   * Mitten im Gleiten fährt der Zug durch einen Tunnel: dessen dunkles Inneres liegt hinter dem Zug und deckt Küste
   * und Ort ganz – dort wechselt die Küste zum neuen Ort. Bei reduzierter Bewegung steht der Zug gleich angekommen im Bild.
   */
  let { to, arrived, mood = 'idle' }: { to: RegionId; arrived: boolean; mood?: Mood } = $props();

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

  /** Parallaxe: Anteil der Gleis-Strecke, den die Ebene zurücklegt. */
  const FAR = 0.08;
  const MID = 0.42;
  const LEN = TRIP.dist + 520;

  /** Das Tunnel-Innere deckt das Bild zur Zeit `cover` ganz: seine Mitte liegt dann über der Bildmitte. */
  const MX = tunnelCenter();

  /** Abgerundetes Rechteck als Pfad (für Löcher per evenodd). */
  const rr = (x: number, y: number, w: number, h: number, r: number) =>
    `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

  /** Wagen von −110 bis 250, Fenster 40×34; im vordersten schaut Trâu hinaus. */
  const WINDOWS = [196, 144, 92, 40, -12, -64];
  const WIN = { y: 166, w: 40, h: 34 };
  const carBody = [rr(-110, 158, 360, 60, 8), ...WINDOWS.map((x) => rr(x, WIN.y, WIN.w, WIN.h, 6))].join(' ');
  /** Trâu: Kopf (viewBox 200) 0,36-fach, Lotus knapp unter der Fensteroberkante, Kinn auf dem Sims. */
  const RIDER = { size: 72, x: 216 - 36, y: WIN.y + 2 - 37 * 0.36 };
  const WHEELS = [-80, -30, 170, 220, 280, 326];

  /** Palmen am Strand (mittlere Ebene): Lage, Höhe, Neigung. */
  const PALMS = Array.from({ length: 13 }, (_, i) => {
    const x = 30 + i * 102 + ((i * 37) % 41);
    return { x, h: 84 + ((i * 23) % 26), lean: i % 3 === 0 ? -10 : 9 + (i % 2) * 5 };
  });
  /** Grasbüschel und Kilometersteine an der Böschung (vorderste Ebene). */
  const TUFTS = Array.from({ length: Math.ceil(LEN / 150) }, (_, i) => 40 + i * 150 + ((i * 53) % 70));
  const POSTS = Array.from({ length: Math.ceil(LEN / 430) }, (_, i) => 120 + i * 430);
  /** Tunnel: Inneres von A bis B (deckt das Bild zur Zeit `cover` mit Rand ganz), Lampen an der Wand. */
  const TA = MX - TUNNEL_HALF;
  const TB = MX + TUNNEL_HALF;
  const LAMPS = Array.from({ length: 8 }, (_, i) => TA + 40 + i * 80);

  const palm = (x: number, h: number, lean: number) => {
    const tx = x + lean;
    const ty = 224 - h;
    return {
      trunk: `M${x - 3.6} 226Q${x - 1.5 + lean * 0.3} ${226 - h * 0.5} ${tx - 1.6} ${ty}L${tx + 1.6} ${ty}Q${x + 2.5 + lean * 0.3} ${226 - h * 0.5} ${x + 3.6} 226Z`,
      tx,
      ty,
    };
  };
  /** Wedel als Blattform von der Krone (tx|ty) zur Spitze (+dx|+dy): oben gewölbt, unten flacher, Spitze hängt. */
  const frond = (tx: number, ty: number, dx: number, dy: number, w = 8) => {
    const len = Math.hypot(dx, dy);
    const [nx, ny] = [-dy / len, dx / len];
    const side = dx < 0 ? -1 : 1;
    const [mx, my] = [tx + dx * 0.5, ty + dy * 0.5 - 4];
    return `M${tx} ${ty}Q${mx + nx * w * side} ${my + ny * w * side} ${tx + dx} ${ty + dy}Q${mx - nx * w * 0.35 * side} ${my - ny * w * 0.35 * side} ${tx} ${ty + 3}Z`;
  };
  /** Krone: drei Wedel links (Schattenseite), drei rechts (Licht von rechts oben). */
  const CROWN = [
    [-34, 12, 0],
    [-30, -4, 0],
    [-14, -14, 0],
    [12, -15, 1],
    [30, -5, 1],
    [35, 13, 1],
  ] as const;

  let far = $state<SVGGElement>();
  let mid = $state<SVGGElement>();
  let near = $state<SVGGElement>();
  let tunnel = $state<SVGGElement>();
  let wheels = $state<SVGGElement>();

  onMount(() => {
    const N = 60;
    const frames = (f: (p: number) => string) =>
      Array.from({ length: N + 1 }, (_, i) => ({ transform: f(rideProgress(i / N)), offset: i / N }));
    const layers: [Element | undefined, (p: number) => string][] = [
      [far, (p) => `translateX(${-p * TRIP.dist * FAR}px)`],
      [mid, (p) => `translateX(${-p * TRIP.dist * MID}px)`],
      [near, (p) => `translateX(${-p * TRIP.dist}px)`],
      [tunnel, (p) => `translateX(${-p * TRIP.dist}px)`],
    ];
    // Räder drehen sich passend zur Strecke (Radius 6).
    const turn = (p: number) => `rotate(${(p * TRIP.dist * 180) / (Math.PI * 6)}deg)`;
    const spokes = [...(wheels?.querySelectorAll('.wheel') ?? [])];
    const all: [Element, (p: number) => string][] = [
      ...layers.filter((l): l is [Element, (p: number) => string] => !!l[0]),
      ...spokes.map((w) => [w, turn] as [Element, (p: number) => string]),
    ];
    if (reducedMotion()) {
      for (const [el, f] of all) (el as SVGGElement).style.transform = f(1);
      return;
    }
    const anims = all.map(([el, f]) => el.animate(frames(f), { duration: TRIP.ride, delay: TRIP.start, fill: 'both' }));
    return () => anims.forEach((a) => a.cancel());
  });
</script>

<div class="ride" style:--start="{TRIP.start}ms" style:--ride="{TRIP.ride}ms">
  <!-- hinten: die Küste -->
  <svg class="scene layer" data-phase="in" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <rect width="400" height="260" fill={C.sky} />
    <Sky x={286} y={40} r={20} e={0} />
    <g bind:this={far}>
      <path
        d="M-20 124 C10 110 40 92 74 94 C100 96 120 114 152 110 C188 106 206 84 242 86 C282 88 304 114 342 112 C366 111 384 100 410 98 C440 96 462 114 494 110 C530 106 548 84 584 86 C624 88 646 114 684 112 L700 132 L-20 132 Z"
        fill={C.far}
      />
      <path d="M96 132 C120 104 146 76 178 68 C196 64 208 76 220 90 C236 108 254 122 276 132 Z" fill={C.rock} />
      <path d="M96 132 C120 104 146 76 178 68 C183 67 188 67 192 68 C170 82 150 108 140 132 Z" fill={C.rockShade} />
      <path d="M470 132 C490 110 510 92 534 88 C548 86 558 96 568 108 C580 120 592 126 610 132 Z" fill={C.rock} />
      <path d="M470 132 C490 110 510 92 534 88 C538 87 541 87 544 88 C526 98 512 114 504 132 Z" fill={C.rockShade} />
    </g>
    <rect y="128" width="400" height="84" fill={C.sea} />
    {#if night}
      {#each [[282, 136, 16], [276, 144, 24], [286, 152, 18]] as [mx, my, mr], i (my)}
        <g class="loop-shimmer" style="--t: {2.4 + i * 0.4}s; --d: {-i * 0.6}s; --dx: 5"><ellipse cx={mx} cy={my} rx={mr} ry="1.8" fill={MOON_SHINE} /></g>
      {/each}
    {/if}
    <g class="loop-shimmer" style="--t: 3.1s"><ellipse cx="96" cy="138" rx="24" ry="2" fill={C.seaLight} /></g>
    <g class="loop-shimmer" style="--t: 3.6s; --d: -1.2s; --dx: -10"><ellipse cx="196" cy="148" rx="30" ry="2" fill={C.seaLight} /></g>
    <g class="loop-shimmer" style="--t: 2.9s; --d: -2s"><ellipse cx="330" cy="140" rx="20" ry="1.8" fill={C.seaLight} /></g>
    <path d="M0 196 C90 188 190 200 280 192 C330 188 370 192 400 190 L400 262 L0 262 Z" fill={C.bank} />
    <g bind:this={mid}>
      {#each PALMS as p, i (p.x)}
        {@const t = palm(p.x, p.h, p.lean)}
        <path d={t.trunk} fill={C.bankShade} />
        <g class="loop-sway origin-bottom" style="--t: {3 + (i % 3) * 0.6}s; --d: {-i * 0.7}s; --rot: 3">
          {#each CROWN as [dx, dy, lit] (dx)}
            <path d={frond(t.tx, t.ty, dx, dy)} fill={lit ? C.rock : C.rockShade} />
          {/each}
          <circle cx={t.tx - 2.5} cy={t.ty + 4} r="3" fill={C.rail} />
          <circle cx={t.tx + 2.8} cy={t.ty + 4.5} r="3" fill={C.rail} />
        </g>
      {/each}
    </g>
  </svg>

  <!-- dazwischen: der neue Ort (baut sich beim Einhängen auf) -->
  {#if arrived}
    <div class="layer arrive" aria-hidden="true"><RegionScene region={to} /></div>
  {/if}

  <!-- vorn: Tunnel (hinter dem Zug), Gleise, Zug -->
  <svg class="scene layer" data-phase="in" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
    <defs>
      <pattern id="ride-sleepers" width="22" height="8" patternUnits="userSpaceOnUse" x="0" y="226">
        <rect width="9" height="5" rx="1.5" fill={C.rail} />
      </pattern>
      <clipPath id="ride-window"><rect x={WINDOWS[0]} y={WIN.y} width={WIN.w} height={WIN.h} rx="6" /></clipPath>
    </defs>

    <!-- Tunnel: Felsflanke mit Portal, dunkles Inneres mit Lampen, Ausfahrt – dahinter wechselt der Ort -->
    <g bind:this={tunnel}>
      <path d="M{TA - 130} 226 C{TA - 108} 168 {TA - 74} 84 {TA - 30} -20 L{TA + 4} -20 L{TA + 4} 226 Z" fill={C.rock} />
      <path d="M{TA - 130} 226 C{TA - 108} 168 {TA - 74} 84 {TA - 30} -20 L{TA - 8} -20 C{TA - 50} 84 {TA - 80} 168 {TA - 98} 226 Z" fill={C.rockShade} />
      <rect x={TA} y="-20" width={TB - TA} height="246" fill={C.rail} />
      {#each LAMPS as x (x)}
        <Glow x={x + 7} y={124} r={9} color={C.stripe} t={1.8} d={-x / 120} />
        <rect x={x} y="121" width="14" height="6" rx="3" fill={C.stripe} />
      {/each}
      <path d="M{TB - 4} -20 L{TB + 34} -20 C{TB + 76} 84 {TB + 106} 168 {TB + 128} 226 L{TB - 4} 226 Z" fill={C.rock} />
      <rect x={TA - 6} y="92" width="13" height="134" rx="4" fill={C.bankShade} />
      <rect x={TB - 7} y="92" width="13" height="134" rx="4" fill={C.bankShade} />
    </g>

    <g bind:this={near}>
      <rect x="-60" y="224" width={LEN + 120} height="40" fill={C.bankShade} />
      <rect x="-60" y="226" width={LEN + 120} height="6" fill="url(#ride-sleepers)" />
      <rect x="-60" y="221" width={LEN + 120} height="4" rx="2" fill={C.rail} />
      {#each TUFTS as x (x)}
        <path d="M{x - 8} 256 L{x - 12} 244 L{x - 3} 256 Z M{x - 3} 256 L{x} 240 L{x + 3} 256 Z M{x + 3} 256 L{x + 12} 246 L{x + 8} 256 Z" fill={C.rock} />
      {/each}
      {#each POSTS as x (x)}
        <rect x={x} y="238" width="9" height="16" rx="3" fill={C.bank} />
        <rect x={x} y="238" width="9" height="5" rx="2" fill={C.loco} />
      {/each}
    </g>

    <!-- Zug: Wagen mit Trâu im Fenster, dahinter die Lok; schaukelt sacht, solange er fährt.
         Etwas links der Mitte, damit die Lok auch im engen Ausschnitt (hohe Bühne) ganz im Bild ist. -->
    <g transform="translate(-20 0)">
    <g class="train">
      <rect x="-110" y={WIN.y} width="360" height={WIN.h} fill={C.win} />
      <g clip-path="url(#ride-window)">
        <svg x={RIDER.x} y={RIDER.y} width={RIDER.size} height={RIDER.size} viewBox="0 0 {RIDER.size} {RIDER.size}" overflow="visible">
          <Trau size={RIDER.size} {mood} />
        </svg>
      </g>
      <path d={carBody} fill={C.train} fill-rule="evenodd" />
      <rect x="-110" y="152" width="360" height="9" rx="4.5" fill={C.trainShade} />
      <rect x="-110" y="204" width="360" height="5" fill={C.stripe} />
      <rect x="-110" y="210" width="360" height="9" rx="3" fill={C.trainShade} />
      {#if night}
        {#each WINDOWS.slice(1) as x (x)}<Glow x={x + 20} y={WIN.y + 17} r={13} color={C.win} t={2.6} d={-x / 90} />{/each}
      {/if}
      <rect x="250" y="206" width="8" height="5" fill={C.rail} />
      <path d="M256 158 L326 158 C340 158 348 176 348 192 L348 218 L256 218 Z" fill={C.loco} />
      <rect x="256" y="204" width="92" height="5" fill={C.stripe} />
      <path d="M326 166 L336 166 C341 168 344 176 344 184 L326 184 Z" fill={C.win} />
      <rect x="282" y="166" width="30" height="24" rx="5" fill={C.win} />
      {#if night}<path d="M347 196 L430 184 L430 214 L347 202 Z" fill={C.stripe} opacity="0.35" />{/if}
      <g bind:this={wheels}>
        {#each WHEELS as x (x)}
          <g class="wheel">
            <circle cx={x} cy="219" r="6" fill={C.rail} />
            <circle cx={x} cy="216" r="1.6" fill={C.bankShade} />
          </g>
        {/each}
      </g>
    </g>
    </g>
  </svg>
</div>

<style>
  .ride {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  .layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .arrive > :global(svg) {
    width: 100%;
    height: 100%;
  }
  /* Der Zug schaukelt sacht, solange er fährt (gerade Zahl von Durchgängen: endet in Ruhelage). */
  .train {
    animation: rock 300ms ease-in-out var(--start) 16 alternate both;
  }
  .wheel {
    transform-box: fill-box;
    transform-origin: center;
  }
  @keyframes rock {
    to {
      transform: translateY(-0.9px);
    }
  }
</style>
