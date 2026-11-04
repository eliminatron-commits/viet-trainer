<script lang="ts" module>
  export type Mood = 'idle' | 'happy' | 'sad' | 'cheer';
</script>

<script lang="ts">
  /**
   * Maskottchen Trâu (Wasserbüffel). Lebt dauerhaft (Atmen, Blinzeln, Ohren, Blick, Lotus) und reagiert:
   * happy = Hüpfer mit ^^-Augen, sad = Kopf und Ohren hängen, cheer = Doppelhüpfer, Lotus dreht sich.
   * Reaktionen spielen beim Einhängen bzw. Stimmungswechsel; `tappable` lässt ihn beim Antippen hüpfen.
   * Alles CSS an SVG-Gruppen (transform-box: view-box, Ursprünge in viewBox-Einheiten).
   * Er wächst mit dem Level (growth: 0 Kalb mit Hornstummeln und kleinem Körper, 1 jung, 2 ausgewachsen)
   * und trägt Accessoires (wear, je Platz eines). Wachstum und Accessoires sitzen in inneren Gruppen mit
   * SVG-transform, damit sie die CSS-Bewegungen der äußeren Gruppen nicht überschreiben.
   */
  import { accessory, type AccessoryId, type AccessorySlot } from '../logic/accessories';
  import type { Growth } from '../logic/rewards';
  import Accessory from './Accessory.svelte';

  let {
    size = 160,
    mood = 'idle',
    tappable = false,
    growth = 2,
    wear = [],
  }: { size?: number; mood?: Mood; tappable?: boolean; growth?: Growth; wear?: readonly string[] } = $props();

  const HORN = [0.42, 0.72, 1] as const;
  const BODY = [0.86, 0.94, 1] as const;
  /** Getragenes Accessoire je Platz. */
  const on = $derived(
    Object.fromEntries(wear.flatMap((id) => (accessory(id) ? [[accessory(id)!.slot, id as AccessoryId]] : []))) as Partial<
      Record<AccessorySlot, AccessoryId>
    >,
  );
  const scaleAt = (x: number, y: number, k: number) => `translate(${x} ${y}) scale(${k}) translate(${-x} ${-y})`;

  let tapHop = $state(false);
  const joyful = $derived(mood === 'happy' || mood === 'cheer' || tapHop);

  function tap() {
    if (!tappable) return;
    tapHop = false;
    requestAnimationFrame(() => (tapHop = true));
  }

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

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<svg
  class="buffalo {mood}"
  class:tap-hop={tapHop}
  class:tappable
  viewBox="0 0 200 200"
  width={size}
  height={size}
  aria-hidden="true"
  onclick={tap}
  onanimationend={(e) => {
    if (e.animationName.includes('hop')) tapHop = false;
  }}
>
  <g class="whole">
    <!-- Körper & Beine -->
    <g class="body">
      <g transform={scaleAt(100, 191, BODY[growth])}>
        <ellipse cx="100" cy="150" rx="52" ry="36" fill={C.shade} />
        {#each [70, 88, 112, 130] as x (x)}
          <rect x={x - 8} y="164" width="16" height="26" rx="7" fill={C.body} />
          <rect x={x - 8} y="182" width="16" height="9" rx="4" fill={C.dark} />
        {/each}
      </g>
    </g>

    <g class="head">
      <!-- Hörner (Schattenseite links) -->
      <g transform={scaleAt(70, 74, HORN[growth])}>
        <path d="M64 80 C28 74 18 44 38 28 C36 48 50 64 76 66 Z" fill={C.horn} />
        <path d="M64 80 C28 74 18 44 38 28 C30 50 40 66 66 72 Z" fill={C.hornShade} />
      </g>
      <g transform={scaleAt(130, 74, HORN[growth])}>
        <path d="M136 80 C172 74 182 44 162 28 C164 48 150 64 124 66 Z" fill={C.horn} />
        {#if on.horn}<Accessory id={on.horn} />{/if}
      </g>
      <!-- Ohren -->
      <g class="ear ear-l">
        <ellipse cx="52" cy="96" rx="15" ry="8" fill={C.body} transform="rotate(-20 52 96)" />
        <ellipse cx="53" cy="96" rx="9" ry="4" fill={C.ear} transform="rotate(-20 53 96)" />
      </g>
      <g class="ear ear-r">
        <ellipse cx="148" cy="96" rx="15" ry="8" fill={C.body} transform="rotate(20 148 96)" />
        <ellipse cx="147" cy="96" rx="9" ry="4" fill={C.ear} transform="rotate(20 147 96)" />
      </g>
      <!-- Kopf -->
      <ellipse cx="100" cy="96" rx="46" ry="42" fill={C.body} />
      <path d="M86 58 C92 66 108 66 114 58 C110 70 90 70 86 58 Z" fill={C.shade} />
      <!-- Lotus auf dem Kopf – oder, was er dort trägt -->
      {#if on.head}
        <Accessory id={on.head} />
      {:else}
        <g class="lotus">
          <ellipse cx="100" cy="50" rx="6" ry="13" fill={C.lotus} />
          <ellipse cx="91" cy="55" rx="5" ry="11" fill={C.lotusDeep} transform="rotate(-30 91 55)" />
          <ellipse cx="109" cy="55" rx="5" ry="11" fill={C.lotusDeep} transform="rotate(30 109 55)" />
        </g>
      {/if}
      <!-- Augen -->
      {#if joyful}
        <path d="M71 93 Q82 77 93 93 Q82 85 71 93 Z" fill={C.dark} />
        <path d="M107 93 Q118 77 129 93 Q118 85 107 93 Z" fill={C.dark} />
      {:else}
        <g class="eyes">
          <circle cx="82" cy="88" r="10" fill="#fff" />
          <circle cx="118" cy="88" r="10" fill="#fff" />
          <g class="pupils">
            <circle cx="84" cy="90" r="6.5" fill={C.dark} />
            <circle cx="116" cy="90" r="6.5" fill={C.dark} />
            <circle cx="82" cy="87" r="2.2" fill="#fff" />
            <circle cx="114" cy="87" r="2.2" fill="#fff" />
          </g>
        </g>
      {/if}
      {#if mood === 'sad'}
        <!-- traurige Brauen: innen hochgezogen -->
        <g class="brows">
          <path d="M70 77.5 L90 71 L91 74.5 L71.5 81 Z" fill={C.dark} />
          <path d="M130 77.5 L110 71 L109 74.5 L128.5 81 Z" fill={C.dark} />
        </g>
      {/if}
      {#if on.face}<Accessory id={on.face} />{/if}
      <!-- Schnauze -->
      <ellipse cx="100" cy="116" rx="30" ry="20" fill={C.muzzle} />
      <ellipse cx="90" cy="114" rx="4" ry="5.5" fill={C.dark} />
      <ellipse cx="110" cy="114" rx="4" ry="5.5" fill={C.dark} />
      {#if joyful}
        <path d="M88 123 Q100 140 112 123 Q100 129 88 123 Z" fill={C.dark} />
        <path d="M95 129.5 Q100 135 105 129.5 Q100 131 95 129.5 Z" fill={C.ear} />
      {:else}
        <path d="M92 126 Q100 132 108 126 Q100 129 92 126 Z" fill={C.dark} />
      {/if}
      <!-- Halstuch (das karierte Khăn rằn ersetzt es, Glöckchen und Blumenkette kommen darüber) -->
      {#if on.neck === 'khan-ran'}
        <Accessory id="khan-ran" />
      {:else}
        <path d="M62 128 Q100 146 138 128 L139 137 Q100 156 61 137 Z" fill={C.scarf} />
        <path d="M116 140 L130 162 L115 157 Z" fill={C.scarf} />
        <path d="M121 146 l1.6 3.4 3.7.4-2.8 2.5.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.8-2.5 3.7-.4Z" fill={C.star} />
        {#if on.neck}<Accessory id={on.neck} />{/if}
      {/if}
    </g>
  </g>
</svg>

<style>
  .buffalo {
    display: block;
    overflow: visible;
  }
  .tappable {
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  g {
    transform-box: view-box;
  }

  /* Leerlauf – läuft immer */
  .whole {
    transform-origin: 100px 190px;
  }
  .body {
    transform-origin: 100px 190px;
    animation: breathe 3.6s ease-in-out infinite;
  }
  .head {
    transform-origin: 100px 135px;
    animation: bob 3.6s ease-in-out infinite;
  }
  .eyes {
    transform-origin: 100px 89px;
    animation: blink 5.2s infinite;
  }
  .pupils {
    animation: glance 9s ease-in-out infinite;
  }
  .ear-l {
    transform-origin: 64px 95px;
    animation: ear-l 6.4s ease-in-out infinite;
  }
  .ear-r {
    transform-origin: 136px 95px;
    animation: ear-r 6.4s ease-in-out -3.1s infinite;
  }
  .lotus {
    transform-origin: 100px 63px;
    animation: sway 4.2s ease-in-out infinite;
  }

  /* Reaktionen */
  .happy .whole,
  .tap-hop .whole {
    animation: hop 700ms var(--ease-out);
  }
  .cheer .whole {
    animation: hop 700ms var(--ease-out) 2;
  }
  .cheer .lotus {
    animation: spin 900ms var(--ease-out) 300ms;
  }
  .sad .head {
    animation: droop 500ms var(--ease-out) forwards;
  }
  .sad .ear-l {
    animation: ear-droop-l 500ms var(--ease-out) forwards;
  }
  .sad .ear-r {
    animation: ear-droop-r 500ms var(--ease-out) forwards;
  }
  .sad .pupils {
    transform: translateY(2.5px);
    animation: none;
  }

  @keyframes breathe {
    50% {
      transform: scale(1.025, 1.04);
    }
  }
  @keyframes bob {
    50% {
      transform: translateY(-1.6px);
    }
  }
  @keyframes blink {
    0%,
    92%,
    96%,
    100% {
      transform: scaleY(1);
    }
    94% {
      transform: scaleY(0.08);
    }
  }
  @keyframes glance {
    0%,
    38%,
    92%,
    100% {
      transform: translate(0, 0);
    }
    44%,
    60% {
      transform: translate(2.5px, -0.5px);
    }
    66%,
    84% {
      transform: translate(-2px, 0.5px);
    }
  }
  @keyframes ear-l {
    0%,
    78%,
    100% {
      transform: rotate(0);
    }
    82% {
      transform: rotate(-16deg);
    }
    86% {
      transform: rotate(5deg);
    }
    90% {
      transform: rotate(-9deg);
    }
    94% {
      transform: rotate(0);
    }
  }
  @keyframes ear-r {
    0%,
    78%,
    100% {
      transform: rotate(0);
    }
    82% {
      transform: rotate(16deg);
    }
    86% {
      transform: rotate(-5deg);
    }
    90% {
      transform: rotate(9deg);
    }
    94% {
      transform: rotate(0);
    }
  }
  @keyframes sway {
    0%,
    100% {
      transform: rotate(-6deg);
    }
    50% {
      transform: rotate(6deg);
    }
  }
  @keyframes hop {
    0% {
      transform: none;
    }
    16% {
      transform: scale(1.08, 0.9);
    }
    42% {
      transform: translateY(-22px) scale(0.95, 1.06);
    }
    68% {
      transform: scale(1.06, 0.93);
    }
    84% {
      transform: scale(0.98, 1.02);
    }
    100% {
      transform: none;
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  .brows {
    animation: brows-in 400ms var(--ease-out) both;
  }
  @keyframes brows-in {
    from {
      transform: translateY(4px);
      opacity: 0;
    }
  }
  @keyframes droop {
    40% {
      transform: translateY(5px) rotate(4deg);
    }
    to {
      transform: translateY(5px) rotate(-6deg);
    }
  }
  @keyframes ear-droop-l {
    to {
      transform: rotate(-42deg);
    }
  }
  @keyframes ear-droop-r {
    to {
      transform: rotate(42deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    g {
      animation: none !important;
    }
  }
</style>
