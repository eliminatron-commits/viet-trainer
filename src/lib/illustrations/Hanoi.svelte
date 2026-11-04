<script lang="ts">
  import Scene from './Scene.svelte';

  /**
   * Hà Nội: schmale Röhrenhäuser der Altstadt mit Balkonen, Kabelbündeln und Flagge; unten fließt der Rollerverkehr.
   * Aufbau: Straße steigt, Häuser wachsen nacheinander, Kabel fallen herab, Pflanzen und Flagge ploppen auf.
   * Leben: Roller fahren in beiden Richtungen durch (einer mit Blumenkorb), die Flagge weht, Wolken ziehen.
   */
  let { label = 'Roller in der Altstadt von Hà Nội' }: { label?: string } = $props();

  const C = {
    sky: '#FDE6CF',
    cloud: '#FFF4E6',
    yellow: '#F7C548',
    yellowShade: '#DCA62E',
    pink: '#F6A5B8',
    pinkShade: '#DD8399',
    mint: '#9FD8CF',
    mintShade: '#73BBB1',
    wood: '#6B3D1E',
    green: '#4E9E8F',
    road: '#8F8177',
    walk: '#EAD9C2',
    red: '#DA251D',
    star: '#FFCD00',
  };

  /** Röhrenhäuser von links: x, Breite, Dachhöhe, Farbe, Schatten. */
  const houses = [
    [0, 74, 70, C.pink, C.pinkShade],
    [74, 82, 52, C.yellow, C.yellowShade],
    [156, 76, 84, C.mint, C.mintShade],
    [232, 88, 60, C.pink, C.pinkShade],
    [320, 80, 76, C.yellow, C.yellowShade],
  ] as const;
  const GROUND = 208;
  /** Balkonpflanzen: x, y. */
  const plants = [
    [22, 110],
    [118, 132],
    [196, 124],
    [278, 100],
    [356, 156],
  ] as const;
</script>

{#snippet scooter(body: string, shirt: string, helmet: string, flowers: boolean)}
  <circle cx="-14" cy="0" r="6.5" fill={C.wood} />
  <circle cx="17" cy="0" r="6.5" fill={C.wood} />
  <circle cx="-14" cy="0" r="2.4" fill={C.walk} />
  <circle cx="17" cy="0" r="2.4" fill={C.walk} />
  {#if flowers}
    <rect x="-26" y="-14" width="14" height="9" rx="2" fill={C.wood} />
    <circle cx="-24" cy="-16" r="4" fill={C.pink} />
    <circle cx="-18" cy="-19" r="4.5" fill={C.star} />
    <circle cx="-13" cy="-16" r="4" fill={C.pink} />
    <circle cx="-21" cy="-22" r="3.5" fill={C.red} />
  {/if}
  <path d="M-21 -6 L-4 -6 Q2 -14 10 -15 L16 -15 L23 -3 Q23 1 17 1 L-14 1 Q-22 1 -21 -6 Z" fill={body} />
  <rect x="-15" y="-10" width="15" height="4" rx="2" fill={C.wood} />
  <rect x="14" y="-22" width="2.4" height="9" fill={C.wood} />
  <rect x="10" y="-23" width="8" height="2.4" rx="1" fill={C.wood} />
  <!-- Fahrer -->
  <path d="M-10 -10 L-2 -10 L2 -28 L-6 -30 Z" fill={shirt} />
  <path d="M0 -26 L13 -22 L12 -19 L-1 -22 Z" fill={shirt} />
  <circle cx="-1" cy="-34" r="6" fill={helmet} />
  <rect x="-2" y="-14" width="6" height="12" rx="2" fill={C.wood} />
{/snippet}

<Scene {label}>
  <rect width="400" height="260" fill={C.sky} />

  <g class="in in-left" style="--e: 140">
    <g class="loop-drift" style="--t: 26s; --dx: 20">
      <path d="M40 40 C42 32 56 30 60 36 C64 28 80 30 80 42 C88 42 90 52 80 52 L44 52 C34 52 32 42 40 40 Z" fill={C.cloud} />
    </g>
  </g>
  <g class="in in-right" style="--e: 200">
    <g class="loop-drift" style="--t: 32s; --dx: 16; --d: -10s">
      <path d="M270 28 C272 20 284 18 288 24 C292 18 304 20 304 28 C310 28 312 36 304 36 L274 36 C266 36 264 28 270 28 Z" fill={C.cloud} />
    </g>
  </g>

  <!-- Straße und Gehweg -->
  <g class="in in-rise" style="--e: 0">
    <rect x="0" y="216" width="400" height="44" fill={C.road} />
    {#each [20, 100, 180, 260, 340] as x (x)}<rect {x} y="237" width="40" height="3" rx="1.5" fill={C.walk} />{/each}
  </g>
  <g class="in in-rise" style="--e: 40">
    <rect x="0" y={GROUND} width="400" height="9" fill={C.walk} />
  </g>

  <!-- Röhrenhäuser wachsen nacheinander aus dem Boden -->
  {#each houses as [x, w, top, color, shade], i (x)}
    <g class="in in-grow" style="--e: {90 + i * 70}">
      <rect {x} y={top} width={w} height={GROUND - top} fill={color} />
      <rect {x} y={top} width="6" height={GROUND - top} fill={shade} />
      <rect x={x - 2} y={top - 6} width={w + 4} height="8" rx="2" fill={shade} />
      <!-- Stockwerke: hohe Fenster mit Läden, darunter Balkone -->
      {#each { length: Math.floor((GROUND - top - 40) / 40) } as _, f (f)}
        {@const fy = top + 14 + f * 40}
        <rect x={x + w / 2 - 15} y={fy} width="30" height="24" rx="2" fill={C.green} />
        <rect x={x + w / 2 - 10} y={fy + 3} width="20" height="21" fill={C.wood} />
        <rect x={x + 8} y={fy + 26} width={w - 12} height="4" fill={C.wood} />
        <rect x={x + 8} y={fy + 30} width={w - 12} height="3" fill={shade} />
      {/each}
      <!-- Laden im Erdgeschoss -->
      <rect x={x + 10} y={GROUND - 26} width={w - 16} height="26" fill={C.wood} />
      <rect x={x + 6} y={GROUND - 32} width={w - 8} height="6" fill={shade} />
    </g>
  {/each}

  <!-- Pflanzen auf den Balkonen -->
  {#each plants as [x, y], i (x)}
    <g class="in in-pop origin-bottom" style="--e: {520 + i * 60}">
      <g class="loop-sway origin-bottom" style="--t: {3 + i * 0.3}s; --d: {-i}s; --rot: 3">
        <circle cx={x} cy={y} r="6" fill={C.green} />
        <circle cx={x + 7} cy={y + 2} r="5" fill={C.green} />
        <circle cx={x + 3} cy={y - 5} r="4" fill={C.pink} />
      </g>
    </g>
  {/each}

  <!-- Flagge am Balkon -->
  <g class="in in-pop" style="--e: 640">
    <rect x="150" y="76" width="2" height="34" fill={C.wood} transform="rotate(-24 151 110)" />
    <g transform="translate(138 78) rotate(-24)">
      <g class="loop-wave origin-left" style="--t: 1.1s; --rot: 8">
        <rect x="0" y="0" width="30" height="20" fill={C.red} />
        <path d="M15 4 L16.5 8.6 L21.3 8.6 L17.4 11.4 L18.9 16 L15 13.2 L11.1 16 L12.6 11.4 L8.7 8.6 L13.5 8.6 Z" fill={C.star} />
      </g>
    </g>
  </g>

  <!-- Kabelbündel hängen herab -->
  <g class="in in-drop" style="--e: 440">
    <path d="M0 84 Q200 124 400 78 L400 81 Q200 127 0 87 Z" fill={C.wood} />
    <path d="M0 94 Q190 128 400 92 L400 94.5 Q190 130.5 0 96.5 Z" fill={C.wood} />
  </g>

  <!-- Rollerverkehr: vorne nach rechts, hinten nach links -->
  <g class="in in-fade" style="--e: 160">
    <g class="loop-cross" style="--t: 8s; --d: -3s; --dist: -540px">
      <g transform="translate(470 226) scale(-0.78 0.78)">{@render scooter(C.mint, C.yellow, C.cloud, false)}</g>
    </g>
    <g class="loop-cross" style="--t: 11s; --d: -8s; --dist: -540px">
      <g transform="translate(470 226) scale(-0.78 0.78)">{@render scooter(C.yellow, C.red, C.mint, false)}</g>
    </g>
    <g class="loop-cross" style="--t: 7s; --d: -1s; --dist: 540px">
      <g transform="translate(-70 248)">{@render scooter(C.red, C.mint, C.star, true)}</g>
    </g>
    <g class="loop-cross" style="--t: 9.5s; --d: -6.2s; --dist: 540px">
      <g transform="translate(-70 248)">{@render scooter(C.green, C.pink, C.cloud, false)}</g>
    </g>
  </g>
</Scene>
