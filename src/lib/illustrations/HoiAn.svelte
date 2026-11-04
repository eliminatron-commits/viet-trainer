<script lang="ts">
  import Scene from './Scene.svelte';

  /**
   * Hội An: ockergelbe Altstadthäuser am Thu Bồn, Laternenketten, eine Ruderin im Sampan.
   * Aufbau: Fluss steigt, Häuser wachsen nacheinander, die Kette fällt herab, Laternen ploppen auf.
   * Leben: Laternen pendeln, das Boot gleitet und schaukelt, das Ruder zieht, Wellenlichter glitzern.
   */
  let { label = 'Laternen über der Altstadt von Hội An' }: { label?: string } = $props();

  const C = {
    sky: '#FDE6CF',
    cloud: '#FFF4E6',
    wall: '#F4B942',
    wallShade: '#D9952B',
    roof: '#C0532F',
    roofShade: '#8E3B22',
    wood: '#6B3D1E',
    shutter: '#4E9E8F',
    river: '#2BB3A8',
    riverLight: '#79D3C8',
    quay: '#F6D9A8',
    red: '#DA251D',
    yellow: '#FFCD00',
    pink: '#F6A5B8',
  };

  /** Laternen an der Kette: x, y auf der Kurve, Farbe, Ringfarbe. */
  const chain = [
    [30, 27, C.red, C.yellow],
    [85, 37, C.yellow, C.red],
    [140, 42, C.pink, C.red],
    [195, 44, C.red, C.yellow],
    [250, 42, C.yellow, C.red],
    [305, 36, C.pink, C.red],
    [360, 26, C.red, C.yellow],
  ] as const;
</script>

{#snippet lantern(x: number, y: number, s: number, body: string, ring: string, t: number, d: number)}
  <g transform="translate({x} {y}) scale({s})">
    <g class="loop-sway origin-top" style="--t: {t}s; --d: {d}s; --rot: 7">
      <rect x="-0.8" y="0" width="1.6" height="8" fill={C.wood} />
      <rect x="-5" y="7" width="10" height="3.5" rx="1" fill={ring} />
      <ellipse cx="0" cy="20" rx="10" ry="11" fill={body} />
      <path d="M-4 10 Q-9.5 20 -4 30 Q-6.5 20 -4 10 Z" fill={ring} />
      <path d="M4 10 Q9.5 20 4 30 Q6.5 20 4 10 Z" fill={ring} />
      <rect x="-5" y="29.5" width="10" height="3.5" rx="1" fill={ring} />
      <path d="M-1.5 33 L1.5 33 L2.5 42 L-2.5 42 Z" fill={ring} />
    </g>
  </g>
{/snippet}

{#snippet door(x: number, y: number, w: number, h: number)}
  <rect {x} {y} width={w} height={h} fill={C.wood} />
  {#each { length: Math.round(w / 19) } as _, i (i)}
    <rect x={x + 3 + i * ((w - 3) / Math.round(w / 19))} y={y + 3} width={(w - 3) / Math.round(w / 19) - 3} height={h - 3} rx="1.5" fill={C.shutter} />
  {/each}
{/snippet}

{#snippet windows(xs: number[], y: number)}
  {#each xs as x (x)}
    <rect x={x - 3} {y} width="24" height="26" rx="2" fill={C.shutter} />
    <rect x={x} y={y + 3} width="18" height="20" fill={C.wood} />
  {/each}
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />

  <g class="in in-left" style="--e: 100">
    <g class="loop-drift" style="--t: 24s; --dx: 18">
      <path d="M232 70 C234 62 248 60 252 66 C256 58 272 60 272 72 C280 72 282 82 272 82 L236 82 C226 82 224 72 232 70 Z" fill={C.cloud} />
    </g>
  </g>
  <g class="in in-right" style="--e: 160">
    <g class="loop-drift" style="--t: 30s; --dx: 14; --d: -8s">
      <path d="M30 82 C32 74 44 72 48 78 C52 72 64 74 64 82 C70 82 72 90 64 90 L34 90 C26 90 24 82 30 82 Z" fill={C.cloud} />
    </g>
  </g>

  <!-- Fluss zuerst: die Häuser wachsen an seinem Ufer -->
  <g class="in in-rise" style="--e: 0">
    <rect x="0" y="188" width="400" height="50" fill={C.river} />
    <g class="loop-shimmer" style="--t: 3.3s"><ellipse cx="70" cy="200" rx="26" ry="2" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 2.9s; --d: -1.4s; --dx: -12"><ellipse cx="300" cy="212" rx="32" ry="2.2" fill={C.riverLight} /></g>
    <g class="loop-shimmer" style="--t: 3.6s; --d: -0.7s"><ellipse cx="190" cy="226" rx="24" ry="1.8" fill={C.riverLight} /></g>
    <!-- Spiegelungen der Laternen -->
    <g class="loop-shimmer" style="--t: 2.4s; --d: -1s; --dx: 4"><ellipse cx="22" cy="196" rx="5" ry="1.6" fill={C.red} /></g>
    <g class="loop-shimmer" style="--t: 2.7s; --dx: 4"><ellipse cx="128" cy="196" rx="5" ry="1.6" fill={C.yellow} /></g>
    <g class="loop-shimmer" style="--t: 2.2s; --d: -0.4s; --dx: 4"><ellipse cx="336" cy="196" rx="5" ry="1.6" fill={C.pink} /></g>
  </g>

  <!-- Haus A -->
  <g class="in in-rise" style="--e: 60">
    <rect x="0" y="114" width="96" height="76" fill={C.wall} />
    <rect x="0" y="114" width="96" height="6" fill={C.wallShade} />
    <path d="M-8 118 Q16 112 22 96 L74 96 Q80 112 104 118 Z" fill={C.roof} />
    <path d="M-8 118 Q16 112 22 96 L34 96 Q30 110 14 118 Z" fill={C.roofShade} />
    {@render windows([14, 60], 128)}
    <rect x="0" y="156" width="96" height="5" fill={C.wood} />
    {@render door(30, 166, 34, 24)}
  </g>

  <!-- Haus B, höher und vorgezogen: Schattenseite links -->
  <g class="in in-rise" style="--e: 130">
    <rect x="96" y="98" width="112" height="92" fill={C.wall} />
    <rect x="96" y="98" width="112" height="6" fill={C.wallShade} />
    <rect x="96" y="104" width="7" height="86" fill={C.wallShade} />
    <path d="M86 102 Q112 96 120 78 L184 78 Q192 96 216 102 Z" fill={C.roof} />
    <path d="M86 102 Q112 96 120 78 L132 78 Q128 94 110 102 Z" fill={C.roofShade} />
    {@render windows([114, 142, 172], 112)}
    <rect x="100" y="146" width="104" height="6" fill={C.wood} />
    {#each [108, 124, 140, 156, 172, 188] as x (x)}<rect {x} y="138" width="3" height="9" fill={C.wood} />{/each}
    <rect x="100" y="136" width="104" height="3" fill={C.wood} />
    <!-- Bougainvillea über dem Balkon -->
    <circle cx="104" cy="134" r="8" fill={C.pink} />
    <circle cx="116" cy="130" r="7" fill={C.pink} />
    <circle cx="110" cy="142" r="6" fill={C.pink} />
    <circle cx="103" cy="152" r="5" fill={C.pink} />
    {@render door(116, 160, 76, 30)}
  </g>

  <!-- Haus C -->
  <g class="in in-rise" style="--e: 200">
    <rect x="208" y="120" width="92" height="70" fill={C.wall} />
    <rect x="208" y="120" width="92" height="6" fill={C.wallShade} />
    <path d="M200 124 Q222 118 228 102 L280 102 Q286 118 308 124 Z" fill={C.roof} />
    <path d="M200 124 Q222 118 228 102 L240 102 Q236 116 220 124 Z" fill={C.roofShade} />
    {@render windows([222, 266], 132)}
    {@render door(236, 164, 38, 26)}
  </g>

  <!-- Haus D -->
  <g class="in in-rise" style="--e: 270">
    <rect x="300" y="106" width="100" height="84" fill={C.wall} />
    <rect x="300" y="106" width="100" height="6" fill={C.wallShade} />
    <rect x="300" y="112" width="6" height="78" fill={C.wallShade} />
    <path d="M292 110 Q316 104 324 88 L384 88 Q390 104 412 110 Z" fill={C.roof} />
    <path d="M292 110 Q316 104 324 88 L336 88 Q332 102 314 110 Z" fill={C.roofShade} />
    {@render windows([318, 360], 120)}
    <rect x="300" y="152" width="100" height="5" fill={C.wood} />
    {@render door(322, 162, 56, 28)}
  </g>

  <!-- Laternen unter den Traufen -->
  {#each [[22, 118, C.red, C.yellow, 0], [128, 104, C.yellow, C.red, 1], [336, 112, C.pink, C.red, 2]] as [x, y, body, ring, i] (x)}
    <g class="in in-pop origin-top" style="--e: {640 + Number(i) * 70}">
      {@render lantern(Number(x), Number(y), 0.75, String(body), String(ring), 2.6 + Number(i) * 0.3, -Number(i) * 0.8)}
    </g>
  {/each}

  <!-- Ruderin im Sampan gleitet über den Fluss -->
  <g class="in in-left" style="--e: 480">
    <g class="loop-drift" style="--t: 22s; --dx: 70">
      <g transform="translate(170 210)">
        <ellipse cx="0" cy="8" rx="56" ry="4" fill={C.riverLight} />
        <g class="loop-bob" style="--t: 2.8s; --rot: 2; --amp: 2">
          <g>
            <g class="loop-sway" style="--t: 1.5s; --rot: 10; transform-origin: 0 0">
              <path d="M33 -27 L64 10 L61 12 L30 -25 Z" fill={C.wood} />
            </g>
            <rect x="22" y="-34" width="12" height="25" rx="5" fill={C.pink} />
            <path d="M15 -33 L28 -46 L41 -33 Z" fill={C.quay} />
            <path d="M15 -33 L28 -46 L28 -33 Z" fill={C.wallShade} />
            <path d="M-50 -10 L50 -10 Q44 4 30 6 L-30 6 Q-44 4 -50 -10 Z" fill={C.wood} />
            <path d="M-48 -10 L48 -10 L46 -6 L-46 -6 Z" fill={C.roof} />
          </g>
        </g>
      </g>
    </g>
  </g>

  <!-- Kai im Vordergrund -->
  <g class="in in-rise" style="--e: 220">
    <path d="M0 236 L400 230 L400 260 L0 260 Z" fill={C.quay} />
    <path d="M0 246 L400 240 L400 260 L0 260 Z" fill={C.wallShade} />
  </g>
  <g class="in in-pop origin-bottom" style="--e: 560">
    <rect x="344" y="222" width="22" height="14" rx="3" fill={C.roof} />
    <circle cx="350" cy="214" r="10" fill={C.shutter} />
    <circle cx="362" cy="216" r="8" fill={C.shutter} />
    <circle cx="356" cy="206" r="7" fill={C.shutter} />
  </g>

  <!-- Laternenkette fällt herab, die Laternen ploppen nacheinander auf -->
  <g class="in in-drop" style="--e: 300">
    <path d="M0 20 Q200 70 400 16 L400 19.5 Q200 73.5 0 23.5 Z" fill={C.wood} />
  </g>
  {#each chain as [x, y, body, ring], i (x)}
    <g class="in in-pop origin-top" style="--e: {520 + i * 55}">
      {@render lantern(x, y, 1, body, ring, 2.2 + (i % 3) * 0.35, -i * 0.45)}
    </g>
  {/each}
</Scene>
