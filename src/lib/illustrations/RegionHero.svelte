<script lang="ts" module>
  import type { RegionId } from '../../content/types';

  /** Kartenfarbe je Region – Weiter-Karte, Regionskarte und Etappen-Ansicht teilen sie. */
  export type RegionTone = 'sea' | 'lantern' | 'lotus' | 'yellow' | 'paper';
  export const REGION_TONE: Record<RegionId, RegionTone> = {
    danang: 'sea',
    hoian: 'lantern',
    hue: 'lotus',
    hanoi: 'yellow',
    saigon: 'paper',
  };
</script>

<script lang="ts">
  /**
   * Hero-Objekt je Region – wie das Kajak im Vorbild: liegt schräg auf der Weiter-Karte, fliegt beim
   * Öffnen aufrecht und groß in die Etappen-Ansicht (View Transition `stage-hero`). Dieselben Stilregeln
   * wie die Szenen (flach, keine Konturen, Licht von rechts oben); lebt mit den Schleifen aus scene.css.
   */
  /** Ohne `size` füllt das Objekt seinen Container (Größe dann per CSS). */
  let { region, size }: { region: RegionId; size?: number } = $props();

  const labels: Record<RegionId, string> = {
    danang: 'Korbboot mit Ruder',
    hoian: 'Seidenlaterne',
    hue: 'Nón lá, der Kegelhut',
    hanoi: 'Roller mit Blumenkorb',
    saigon: 'Eiskaffee mit Phin',
  };

  const C = {
    boat: '#9A5B2E',
    boatDark: '#6B3D1E',
    boatLight: '#C8854A',
    seaLight: '#BFE9E4',
    red: '#DA251D',
    redDeep: '#A8170F',
    redLight: '#F05A45',
    yellow: '#FFCD00',
    hat: '#F2D27A',
    hatShade: '#D9B456',
    lotus: '#F6A5B8',
    cream: '#F3E3C3',
    green: '#4E9E8F',
    metal: '#B7C2C7',
    metalShade: '#8C989E',
    coffee: '#5A3220',
    ice: '#EAF6F8',
  };
  /** Radmitten des Rollers. */
  const wheels = [
    [52, 158],
    [154, 158],
  ] as const;
</script>

<svg class="scene hero" data-phase="in" viewBox="0 0 200 200" width={size ?? '100%'} height={size ?? '100%'} role="img" aria-label={labels[region]}>
  {#if region === 'danang'}
    <!-- Thúng chai: rundes Korbboot, Ruder quer darüber, Wellenringe -->
    <g class="loop-ring" style="--t: 2.8s"><ellipse cx="100" cy="128" rx="84" ry="26" fill={C.seaLight} /></g>
    <g class="loop-ring" style="--t: 2.8s; --d: -1.4s"><ellipse cx="100" cy="128" rx="84" ry="26" fill={C.seaLight} /></g>
    <ellipse cx="100" cy="114" rx="72" ry="42" fill={C.boatDark} />
    <ellipse cx="100" cy="104" rx="72" ry="40" fill={C.boatLight} />
    <ellipse cx="100" cy="102" rx="63" ry="33" fill={C.boat} />
    <path d="M44 106 Q100 140 156 106 Q100 126 44 106 Z" fill={C.boatLight} />
    <path d="M52 94 Q100 120 148 94 Q100 110 52 94 Z" fill={C.boatDark} />
    <ellipse cx="100" cy="108" rx="44" ry="18" fill={C.boatDark} />
    <path d="M110 92 L128 70 L146 92 Z" fill={C.hat} />
    <path d="M110 92 L128 70 L128 92 Z" fill={C.hatShade} />
    <g class="loop-sway" style="--t: 2.2s; --rot: 6">
      <path d="M30 46 L36 40 L170 150 L164 156 Z" fill={C.boatLight} />
      <path d="M152 136 L176 140 L188 160 L168 168 L158 152 Z" fill={C.yellow} />
    </g>
  {:else if region === 'hoian'}
    <!-- Seidenlaterne: pendelt an ihrer Schnur -->
    <g class="loop-sway origin-top" style="--t: 2.6s; --rot: 6">
      <rect x="98" y="0" width="4" height="40" fill={C.boatDark} />
      <rect x="80" y="38" width="40" height="12" rx="4" fill={C.yellow} />
      <ellipse cx="100" cy="104" rx="50" ry="56" fill={C.red} />
      <path d="M100 48 Q50 54 50 104 Q50 154 100 160 Q66 150 66 104 Q66 58 100 48 Z" fill={C.redDeep} />
      <path d="M118 52 Q146 70 146 104 Q146 138 118 156 Q134 132 134 104 Q134 76 118 52 Z" fill={C.redLight} />
      <path d="M78 52 Q60 104 78 156 Q70 104 78 52 Z" fill={C.yellow} />
      <path d="M100 48 Q94 104 100 160 Q106 104 100 48 Z" fill={C.yellow} />
      <path d="M122 52 Q140 104 122 156 Q130 104 122 52 Z" fill={C.yellow} />
      <rect x="78" y="156" width="44" height="12" rx="4" fill={C.yellow} />
      <path d="M92 168 L108 168 L114 198 L86 198 Z" fill={C.yellow} />
      <rect x="88" y="176" width="24" height="4" fill={C.red} />
    </g>
  {:else if region === 'hue'}
    <!-- Nón lá: Kegelhut mit Kinnband, dreht sich sacht -->
    <g class="loop-sway origin-top" style="--t: 3.4s; --rot: 5">
      <path d="M60 136 Q100 200 140 136 L133 136 Q100 188 67 136 Z" fill={C.red} />
    </g>
    <ellipse cx="100" cy="134" rx="90" ry="26" fill={C.hatShade} />
    <path d="M10 130 L100 26 L190 130 Q100 158 10 130 Z" fill={C.hat} />
    <path d="M10 130 L100 26 L84 147 Q40 143 10 130 Z" fill={C.hatShade} />
    <path d="M40 96 Q100 116 160 96 L163 100 Q100 122 37 100 Z" fill={C.hatShade} />
    <path d="M66 66 Q100 78 134 66 L137 70 Q100 84 63 70 Z" fill={C.hatShade} />
    <path d="M24 116 Q100 140 176 116 L179 121 Q100 146 21 121 Z" fill={C.hatShade} />
    <circle cx="100" cy="27" r="4" fill={C.hatShade} />
  {:else if region === 'hanoi'}
    <!-- Roller mit Blumenkorb: Räder drehen, Blumen wippen -->
    {#each wheels as [cx, cy] (cx)}
      <circle {cx} {cy} r="24" fill={C.boatDark} />
      <circle {cx} {cy} r="12" fill={C.metal} />
      <g class="loop-spin" style="--t: 0.9s">
        <rect x={cx - 1.6} y={cy - 11} width="3.2" height="22" fill={C.metalShade} />
        <rect x={cx - 11} y={cy - 1.6} width="22" height="3.2" fill={C.metalShade} />
      </g>
    {/each}
    <!-- Blumenkorb auf dem Gepäckträger -->
    <g class="loop-sway origin-bottom" style="--t: 1.8s; --rot: 4">
      <rect x="10" y="78" width="44" height="30" rx="6" fill={C.boatDark} />
      <circle cx="16" cy="74" r="11" fill={C.lotus} />
      <circle cx="32" cy="66" r="12" fill={C.yellow} />
      <circle cx="48" cy="74" r="11" fill={C.lotus} />
      <circle cx="24" cy="56" r="8" fill={C.red} />
      <circle cx="42" cy="54" r="7" fill={C.lotus} />
      <path d="M50 62 Q66 48 70 56 Q62 62 52 70 Z" fill={C.green} />
      <path d="M12 64 Q-2 52 -4 62 Q4 66 12 72 Z" fill={C.green} />
    </g>
    <!-- Heckverkleidung über dem Hinterrad, Sitzbank, Trittbrett -->
    <path d="M22 132 Q20 104 52 100 L102 100 Q110 100 110 110 L110 136 Q110 144 102 144 L32 144 Q22 144 22 132 Z" fill={C.red} />
    <path d="M22 132 Q20 104 52 100 L62 100 Q40 108 40 144 L32 144 Q22 144 22 132 Z" fill={C.redDeep} />
    <path d="M34 100 Q34 86 50 86 L98 86 Q108 86 106 100 Z" fill={C.boatDark} />
    <rect x="104" y="132" width="34" height="12" rx="3" fill={C.redDeep} />
    <!-- Beinschild, Lenksäule, Schutzblech vorn -->
    <path d="M128 144 L140 144 Q160 108 154 56 L140 54 Q140 100 122 132 Z" fill={C.red} />
    <path d="M134 140 Q154 118 180 136 L176 144 Q156 130 140 150 Z" fill={C.red} />
    <rect x="128" y="44" width="44" height="10" rx="5" fill={C.boatDark} />
    <circle cx="160" cy="68" r="8" fill={C.yellow} />
  {:else}
    <!-- Cà phê sữa đá: Phin tropft in das Glas -->
    <rect x="58" y="62" width="84" height="8" rx="3" fill={C.metalShade} />
    <path d="M72 34 L128 34 L124 64 L76 64 Z" fill={C.metal} />
    <path d="M72 34 L88 34 L86 64 L76 64 Z" fill={C.metalShade} />
    <rect x="68" y="26" width="64" height="10" rx="4" fill={C.metal} />
    <rect x="94" y="16" width="12" height="12" rx="3" fill={C.metalShade} />
    <path d="M60 76 L140 76 L132 190 L68 190 Z" fill={C.ice} />
    <path d="M63 96 L137 96 L133 160 L67 160 Z" fill={C.coffee} />
    <path d="M67 160 L133 160 L132 190 L68 190 Z" fill={C.cream} />
    <rect x="76" y="104" width="22" height="20" rx="5" fill={C.ice} />
    <rect x="104" y="116" width="20" height="18" rx="5" fill={C.ice} />
    <rect x="84" y="134" width="18" height="16" rx="5" fill={C.ice} />
    <path d="M60 76 L72 76 L80 190 L68 190 Z" fill={C.metal} opacity="0.35" />
    <path d="M126 8 L134 10 L112 120 L104 118 Z" fill={C.yellow} />
    {#each [0, -0.55, -1.1] as d (d)}
      <g class="loop-drip" style="--t: 1.65s; --d: {d}s; --fall: 26px">
        <ellipse cx="100" cy="72" rx="2.6" ry="3.4" fill={C.coffee} />
      </g>
    {/each}
  {/if}
</svg>

<style>
  svg {
    display: block;
    overflow: visible;
  }
</style>
