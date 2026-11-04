<script lang="ts" module>
  import type { AccessoryId } from '../logic/accessories';

  /** Ausschnitt (viewBox) je Accessoire für Symbole – in den Koordinaten des Büffels (200 × 200). */
  export const ACCESSORY_BOX: Record<AccessoryId, string> = {
    'non-la': '38 4 124 72',
    'mu-bao-hiem': '50 36 100 50',
    'kinh-ram': '56 72 88 30',
    'khan-ran': '56 122 88 44',
    chuong: '84 128 32 32',
    'vong-hoa': '54 122 92 38',
    'hoa-mai': '138 34 32 32',
    'den-long': '152 44 32 50',
  };
</script>

<script lang="ts">
  /**
   * Ein Accessoire für Trâu als SVG-Gruppe in den Koordinaten des Büffels (viewBox 0 0 200 200).
   * Gleiche Regeln wie die Illustrationen: nur Flächen, Licht von rechts oben (linke Hälfte dunkler).
   */
  let { id }: { id: AccessoryId } = $props();
  const uid = $props.id();

  const C = {
    straw: '#EBCB86',
    strawShade: '#D3AD66',
    strawDeep: '#B98F4A',
    yellow: '#FFCD00',
    yellowShade: '#E3AE00',
    red: '#DA251D',
    redShade: '#B81C15',
    dark: '#262B40',
    lens: '#3A4260',
    cream: '#F3E3C3',
    pink: '#F6A5B8',
    leaf: '#4E9A62',
    orange: '#E8891C',
  };

  // Blumenkette: Blüten entlang des Halstuchs (quadratische Kurve wie dessen Oberkante).
  const garland = [0.04, 0.22, 0.4, 0.6, 0.78, 0.96].map((t, i) => {
    const u = 1 - t;
    return { x: u * u * 62 + 2 * u * t * 100 + t * t * 138, y: u * u * 133 + 2 * u * t * 153 + t * t * 133, pink: i % 2 === 0 };
  });
  const petals = [0, 72, 144, 216, 288].map((a) => ({ dx: Math.sin((a * Math.PI) / 180), dy: -Math.cos((a * Math.PI) / 180) }));
</script>

{#if id === 'non-la'}
  <g class="acc">
    <path d="M100 8 L42 62 Q70 71 100 72 Z" fill={C.strawShade} />
    <path d="M100 8 L158 62 Q130 71 100 72 Z" fill={C.straw} />
    <path d="M42 62 Q100 80 158 62 Q100 73 42 62 Z" fill={C.strawDeep} />
    <path d="M78 30 L122 30 L126 34 L74 34 Z" fill={C.strawDeep} opacity="0.35" />
    <path d="M63 47 L137 47 L141 51 L59 51 Z" fill={C.strawDeep} opacity="0.35" />
  </g>
{:else if id === 'mu-bao-hiem'}
  <g class="acc">
    <path d="M56 76 C54 40 100 38 100 38 L100 76 Z" fill={C.yellowShade} />
    <path d="M144 76 C146 40 100 38 100 38 L100 76 Z" fill={C.yellow} />
    <path d="M94 39 Q100 38 106 39 L106 75 L94 75 Z" fill={C.red} />
    <path d="M54 72 Q100 86 146 72 L146 78 Q100 92 54 78 Z" fill={C.dark} />
  </g>
{:else if id === 'kinh-ram'}
  <g class="acc">
    <rect x="58" y="83" width="12" height="3.5" rx="1.75" fill={C.dark} />
    <rect x="130" y="83" width="12" height="3.5" rx="1.75" fill={C.dark} />
    <rect x="67" y="77" width="30" height="21" rx="9" fill={C.dark} />
    <rect x="103" y="77" width="30" height="21" rx="9" fill={C.dark} />
    <rect x="95" y="82" width="10" height="4" rx="2" fill={C.dark} />
    <path d="M76 81 L82 81 L76 94 L70 94 Z" fill={C.lens} />
    <path d="M112 81 L118 81 L112 94 L106 94 Z" fill={C.lens} />
  </g>
{:else if id === 'khan-ran'}
  <defs>
    <pattern id="ran-{uid}" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" fill={C.dark} />
      <rect width="4" height="4" fill={C.cream} />
      <rect x="4" y="4" width="4" height="4" fill={C.cream} />
    </pattern>
  </defs>
  <g class="acc">
    <path d="M60 127 Q100 146 140 127 L141 138 Q100 158 59 138 Z" fill="url(#ran-{uid})" />
    <path d="M115 140 L131 165 L114 159 Z" fill="url(#ran-{uid})" />
    <path d="M114 159 L131 165 L129 168 L112 162 Z" fill={C.dark} />
  </g>
{:else if id === 'chuong'}
  <g class="acc swing">
    <circle cx="100" cy="137" r="2.6" fill={C.yellowShade} />
    <path d="M100 138 Q90 138 90 148 L87 155 L100 155 Z" fill={C.yellowShade} />
    <path d="M100 138 Q110 138 110 148 L113 155 L100 155 Z" fill={C.yellow} />
    <circle cx="100" cy="157" r="3" fill={C.dark} />
  </g>
{:else if id === 'vong-hoa'}
  <g class="acc">
    {#each garland as f, i (i)}
      <ellipse cx={f.x - 5} cy={f.y + 3} rx="4" ry="2" fill={C.leaf} transform="rotate(-30 {f.x - 5} {f.y + 3})" />
      {#each petals as p, k (k)}
        <circle cx={f.x + p.dx * 4} cy={f.y + p.dy * 4} r="3.3" fill={f.pink ? C.pink : C.cream} />
      {/each}
      <circle cx={f.x} cy={f.y} r="2.2" fill={C.yellow} />
    {/each}
  </g>
{:else if id === 'hoa-mai'}
  <g class="acc">
    <ellipse cx="146" cy="58" rx="5" ry="2.4" fill={C.leaf} transform="rotate(30 146 58)" />
    {#each petals as p, k (k)}
      <circle cx={154 + p.dx * 5.5} cy={50 + p.dy * 5.5} r="4.6" fill={k < 2 ? C.yellowShade : C.yellow} />
    {/each}
    <circle cx="154" cy="50" r="2.8" fill={C.orange} />
    <circle cx="163" cy="40" r="3" fill={C.yellow} />
  </g>
{:else if id === 'den-long'}
  <g class="acc sway">
    <rect x="167.2" y="46" width="1.6" height="12" fill={C.dark} />
    <rect x="161" y="57" width="14" height="3.5" rx="1.5" fill={C.yellowShade} />
    <path d="M168 60 Q158 60 158 71 Q158 82 168 82 Z" fill={C.redShade} />
    <path d="M168 60 Q178 60 178 71 Q178 82 168 82 Z" fill={C.red} />
    <rect x="161" y="81" width="14" height="3.5" rx="1.5" fill={C.yellowShade} />
    <rect x="167" y="84" width="2" height="7" rx="1" fill={C.yellow} />
  </g>
{/if}

<style>
  g {
    transform-box: view-box;
  }
  .swing {
    transform-origin: 100px 136px;
    animation: swing 2.8s ease-in-out infinite;
  }
  .sway {
    transform-origin: 168px 46px;
    animation: swing 3.4s ease-in-out infinite;
  }
  @keyframes swing {
    0%,
    100% {
      transform: rotate(-6deg);
    }
    50% {
      transform: rotate(6deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    g {
      animation: none !important;
    }
  }
</style>
