<script lang="ts">
  import { theme } from '../../theme.svelte';
  import Glow from '../Glow.svelte';
  import Scene from '../Scene.svelte';

  /**
   * Gesundheit: Apotheke an der Straße – grünes Schild, offener Laden mit Regalen voller Schachteln und Fläschchen,
   * Glastheke, am Haus das grüne Kreuz.
   * Aufbau: Fassade, Schild, Regale füllen sich, das Kreuz ploppt auf. Leben: das Kreuz pulsiert und sendet Ringe aus.
   * Nacht: der Laden ist hell erleuchtet, das Kreuz leuchtet.
   */
  let { label = 'Apotheke' }: { label?: string } = $props();

  const DAY = {
    facade: '#F4EEDF',
    facadeShade: '#E4DAC2',
    green: '#2EA86B',
    greenShade: '#1F8752',
    plate: '#FFFFFF',
    win: '#3A4256',
    shelf: '#9A6B44',
    red: '#DA251D',
    yellow: '#FFCD00',
    blue: '#2E7DC4',
    glass: '#BFE3E8',
    ground: '#D8C6A8',
    groundShade: '#C4AF8C',
  };
  const NIGHT: typeof DAY = {
    facade: '#3F4560',
    facadeShade: '#333950',
    green: '#2EBF78',
    greenShade: '#1E8A55',
    plate: '#D9E7DE',
    win: '#F3D79A',
    shelf: '#7A5236',
    red: '#B8362C',
    yellow: '#E8B93A',
    blue: '#2E64A0',
    glass: '#8FB4BC',
    ground: '#3B394F',
    groundShade: '#302E42',
  };
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  /** Waren je Regalbrett: x, Breite, Höhe, Farbe (Schlüssel), Fläschchen? */
  type Ware = [number, number, number, 'red' | 'yellow' | 'blue' | 'plate' | 'green', boolean];
  const UPPER: Ware[] = [
    [70, 20, 22, 'red', false],
    [92, 14, 16, 'yellow', false],
    [110, 10, 20, 'blue', true],
    [124, 24, 18, 'plate', false],
    [152, 16, 24, 'green', false],
    [172, 10, 18, 'red', true],
    [186, 22, 20, 'yellow', false],
    [212, 14, 14, 'blue', false],
    [230, 10, 22, 'plate', true],
    [244, 22, 18, 'red', false],
    [270, 18, 22, 'blue', false],
  ];
  const LOWER: Ware[] = [
    [68, 26, 18, 'yellow', false],
    [98, 10, 22, 'red', true],
    [112, 18, 14, 'blue', false],
    [134, 22, 20, 'plate', false],
    [160, 12, 16, 'green', false],
    [176, 10, 22, 'yellow', true],
    [190, 24, 18, 'red', false],
    [218, 16, 22, 'blue', false],
    [238, 20, 16, 'plate', false],
    [262, 10, 20, 'green', true],
    [276, 18, 18, 'yellow', false],
  ];
  const CROSS = 'M-8 -24 L8 -24 L8 -8 L24 -8 L24 8 L8 8 L8 24 L-8 24 L-8 8 L-24 8 L-24 -8 L-8 -8 Z';
</script>

{#snippet shelf(wares: Ware[], top: number)}
  {#each wares as [x, w, h, color, bottle] (x)}
    {#if bottle}
      <rect x={x} y={top - h} width={w} height={h} rx="3" fill={C[color]} />
      <rect x={x + 2} y={top - h - 5} width={w - 4} height="6" rx="1.5" fill={C.shelf} />
    {:else}
      <rect x={x} y={top - h} width={w} height={h} rx="1.5" fill={C[color]} />
    {/if}
  {/each}
  <rect x="60" y={top} width="240" height="5" fill={C.shelf} />
{/snippet}

<Scene {label}>
  <!-- Fassade und Schild -->
  <g class="in in-fade" style="--e: 0">
    <rect width="400" height="210" fill={C.facade} />
    <rect y="20" width="400" height="36" fill={C.green} />
    <rect y="52" width="400" height="4" fill={C.greenShade} />
    {#each [[40, 44], [92, 26], [126, 58], [192, 34], [234, 50]] as [bx, bw] (bx)}
      <rect x={bx} y="31" width={bw} height="12" rx="6" fill={C.plate} />
    {/each}
  </g>

  <!-- offener Laden: Rollgitter oben, Regale, Glastheke -->
  <g class="in in-fade" style="--e: 160">
    <rect x="54" y="62" width="252" height="12" fill={C.facadeShade} />
    {#each [65, 69] as ry (ry)}<rect x="54" y={ry} width="252" height="1.5" fill={C.shelf} />{/each}
    {#if night}<Glow x={180} y={138} r={50} color={C.win} t={4} />{/if}
    <rect x="60" y="74" width="240" height="136" fill={C.win} />
  </g>
  <g class="in in-rise" style="--e: 320">{@render shelf(UPPER, 108)}</g>
  <g class="in in-rise" style="--e: 400">{@render shelf(LOWER, 146)}</g>
  <g class="in in-rise" style="--e: 480">
    <rect x="76" y="160" width="208" height="8" rx="2" fill={C.shelf} />
    <rect x="80" y="168" width="200" height="42" fill={C.glass} />
    <rect x="96" y="186" width="22" height="16" rx="2" fill={C.red} opacity="0.7" />
    <rect x="128" y="190" width="14" height="12" rx="2" fill={C.blue} opacity="0.7" />
    <rect x="236" y="184" width="26" height="18" rx="2" fill={C.yellow} opacity="0.7" />
    <rect x="80" y="174" width="200" height="3" fill={C.plate} opacity="0.6" />
  </g>

  <!-- Gehweg mit Stufe, Topfpflanze -->
  <g class="in in-rise" style="--e: 0">
    <rect y="208" width="400" height="52" fill={C.ground} />
    <rect x="44" y="208" width="272" height="9" fill={C.facadeShade} />
    <rect y="238" width="400" height="4" fill={C.groundShade} />
  </g>
  <g class="in in-pop origin-bottom" style="--e: 560">
    <ellipse cx="26" cy="176" rx="13" ry="22" fill={C.green} />
    <ellipse cx="14" cy="188" rx="9" ry="14" fill={C.greenShade} />
    <path d="M10 196 L42 196 L38 218 L14 218 Z" fill={C.shelf} />
  </g>

  <!-- grünes Kreuz am Haus: pulsiert, sendet Ringe -->
  <g class="in in-pop" style="--e: 640">
    <rect x="306" y="96" width="24" height="6" fill={C.greenShade} />
    <rect x="326" y="66" width="68" height="68" rx="14" fill={C.plate} />
    <g transform="translate(360 100)">
      <g class="loop-ring" style="--t: 2.4s">
        <path d={CROSS} fill={C.green} opacity="0.45" />
      </g>
      {#if night}<Glow x={0} y={0} r={20} color={C.green} t={1.2} />{/if}
      <g class="loop-breathe" style="--t: 1.2s; --s: 1.07"><path d={CROSS} fill={C.green} /></g>
    </g>
  </g>
</Scene>
