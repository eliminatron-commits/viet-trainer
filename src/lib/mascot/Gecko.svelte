<script lang="ts">
  /** Maskottchen-Entwurf A: Thạch sùng (Hausgecko) – sitzt an jeder vietnamesischen Hauswand. */
  let { size = 160 }: { size?: number } = $props();

  const C = {
    body: '#7CC9A0',
    shade: '#5DAF85',
    belly: '#D4F1DF',
    spot: '#4FA67B',
    eye: '#231A15',
    cheek: '#F6A5B8',
    scarf: '#DA251D',
    star: '#FFCD00',
  };
</script>

<svg viewBox="0 0 200 200" width={size} height={size} role="img" aria-label="Gecko-Maskottchen">
  <!-- Schwanz, eingerollt -->
  <path d="M118 150 C150 160 182 146 176 114 C172 94 146 94 144 110 C143 120 154 124 158 116 C163 128 152 142 116 160 Z" fill={C.shade} />
  <!-- Körper -->
  <ellipse cx="100" cy="138" rx="38" ry="40" fill={C.body} />
  <ellipse cx="100" cy="146" rx="23" ry="27" fill={C.belly} />
  <circle cx="74" cy="124" r="4" fill={C.spot} />
  <circle cx="128" cy="130" r="5" fill={C.spot} />
  <!-- Beine mit Haftzehen -->
  {#each [-1, 1] as side (side)}
    <ellipse cx={100 + side * 30} cy="172" rx="15" ry="9" fill={C.body} />
    {#each [-9, 0, 9] as t (t)}
      <circle cx={100 + side * 30 + t} cy="180" r="4.5" fill={C.shade} />
    {/each}
    <ellipse cx={100 + side * 36} cy="140" rx="8" ry="14" fill={C.body} transform="rotate({side * -24} {100 + side * 36} 140)" />
    {#each [-6, 0, 6] as t (t)}
      <circle cx={100 + side * 42 + t * 0.4} cy={152 + Math.abs(t) * 0.3} r="3.6" fill={C.shade} />
    {/each}
  {/each}
  <!-- Kopf -->
  <circle cx="76" cy="62" r="19" fill={C.body} />
  <circle cx="124" cy="62" r="19" fill={C.body} />
  <ellipse cx="100" cy="80" rx="54" ry="40" fill={C.body} />
  <circle cx="100" cy="52" r="4" fill={C.spot} />
  <circle cx="112" cy="46" r="3" fill={C.spot} />
  <!-- Augen -->
  <circle cx="76" cy="64" r="14" fill={C.eye} />
  <circle cx="124" cy="64" r="14" fill={C.eye} />
  <circle cx="71" cy="58" r="5" fill="#fff" />
  <circle cx="119" cy="58" r="5" fill="#fff" />
  <circle cx="80" cy="70" r="2" fill="#fff" />
  <circle cx="128" cy="70" r="2" fill="#fff" />
  <!-- Wangen & Lächeln -->
  <ellipse cx="62" cy="90" rx="8" ry="4.5" fill={C.cheek} />
  <ellipse cx="138" cy="90" rx="8" ry="4.5" fill={C.cheek} />
  <path d="M86 92 Q100 104 114 92 Q100 98 86 92 Z" fill={C.eye} />
  <!-- Halstuch -->
  <path d="M60 108 Q100 124 140 108 L141 117 Q100 134 59 117 Z" fill={C.scarf} />
  <path d="M118 118 L134 140 L118 135 Z" fill={C.scarf} />
  <path d="M124 124 l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4Z" fill={C.star} />
</svg>
