<script lang="ts">
  /** Maskottchen-Entwurf B: Trâu (Wasserbüffel) – geduldiger Arbeiter der Reisfelder. */
  let { size = 160 }: { size?: number } = $props();

  const C = {
    body: '#56618A',
    shade: '#434D72',
    muzzle: '#A3ACC6',
    dark: '#262B40',
    horn: '#F3E3C3',
    hornShade: '#DEC79C',
    ear: '#F6A5B8',
    lotus: '#F6A5B8',
    lotusDeep: '#E7809A',
    scarf: '#DA251D',
    star: '#FFCD00',
  };
</script>

<svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="Wasserbüffel-Maskottchen">
  <!-- Körper & Beine -->
  <ellipse cx="100" cy="150" rx="52" ry="36" fill={C.shade} />
  {#each [70, 88, 112, 130] as x (x)}
    <rect x={x - 8} y="164" width="16" height="26" rx="7" fill={C.body} />
    <rect x={x - 8} y="182" width="16" height="9" rx="4" fill={C.dark} />
  {/each}
  <!-- Hörner (Schattenseite links) -->
  <path d="M64 80 C28 74 18 44 38 28 C36 48 50 64 76 66 Z" fill={C.horn} />
  <path d="M64 80 C28 74 18 44 38 28 C30 50 40 66 66 72 Z" fill={C.hornShade} />
  <path d="M136 80 C172 74 182 44 162 28 C164 48 150 64 124 66 Z" fill={C.horn} />
  <!-- Ohren -->
  <ellipse cx="52" cy="96" rx="15" ry="8" fill={C.body} transform="rotate(-20 52 96)" />
  <ellipse cx="53" cy="96" rx="9" ry="4" fill={C.ear} transform="rotate(-20 53 96)" />
  <ellipse cx="148" cy="96" rx="15" ry="8" fill={C.body} transform="rotate(20 148 96)" />
  <ellipse cx="147" cy="96" rx="9" ry="4" fill={C.ear} transform="rotate(20 147 96)" />
  <!-- Kopf -->
  <ellipse cx="100" cy="96" rx="46" ry="42" fill={C.body} />
  <path d="M86 58 C92 66 108 66 114 58 C110 70 90 70 86 58 Z" fill={C.shade} />
  <!-- Lotus auf dem Kopf -->
  <ellipse cx="100" cy="50" rx="6" ry="13" fill={C.lotus} />
  <ellipse cx="91" cy="55" rx="5" ry="11" fill={C.lotusDeep} transform="rotate(-30 91 55)" />
  <ellipse cx="109" cy="55" rx="5" ry="11" fill={C.lotusDeep} transform="rotate(30 109 55)" />
  <!-- Augen -->
  <circle cx="82" cy="88" r="10" fill="#fff" />
  <circle cx="118" cy="88" r="10" fill="#fff" />
  <circle cx="84" cy="90" r="6.5" fill={C.dark} />
  <circle cx="116" cy="90" r="6.5" fill={C.dark} />
  <circle cx="82" cy="87" r="2.2" fill="#fff" />
  <circle cx="114" cy="87" r="2.2" fill="#fff" />
  <!-- Schnauze -->
  <ellipse cx="100" cy="116" rx="30" ry="20" fill={C.muzzle} />
  <ellipse cx="90" cy="114" rx="4" ry="5.5" fill={C.dark} />
  <ellipse cx="110" cy="114" rx="4" ry="5.5" fill={C.dark} />
  <path d="M92 126 Q100 132 108 126 Q100 129 92 126 Z" fill={C.dark} />
  <!-- Halstuch -->
  <path d="M62 128 Q100 146 138 128 L139 137 Q100 156 61 137 Z" fill={C.scarf} />
  <path d="M116 140 L130 162 L115 157 Z" fill={C.scarf} />
  <path d="M121 146 l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4Z" fill={C.star} />
</svg>
