<script module lang="ts">
  import type { Plant } from '../../lib/logic/field';
  /** Feld beim letzten Verlassen (nur im Speicher): Beim nächsten Besuch wächst daraus, was sich getan hat. */
  let lastSeen: Map<string, Plant> | null = null;
</script>

<script lang="ts">
  import { onDestroy, onMount, untrack } from 'svelte';
  import { tick } from '../../lib/feedback';
  import { game, today } from '../../lib/game.svelte';
  import Glow from '../../lib/illustrations/Glow.svelte';
  import Scene from '../../lib/illustrations/Scene.svelte';
  import Sky from '../../lib/illustrations/Sky.svelte';
  import { FIELD, fieldChanges, fieldOrder, fieldSlots, nearestSlot, plantInfo, plantOf, plantShape, restingShape, type Change, type PlantInfo } from '../../lib/logic/field';
  import { reducedMotion } from '../../lib/motion';
  import type { ProgressKey } from '../../lib/storage/state';
  import { theme } from '../../lib/theme.svelte';

  /**
   * Reisfeld im Training: eine Reispflanze je gelernter Einheit, über das ganze Feld in versetzten Reihen
   * (Perspektive: hinten kleiner), nach Wuchs sortiert – vorne Setzlinge, hinten das goldene Band der reifen.
   * Wuchs nach SRS-Box, fällige Pflanzen sind fahl und lassen Blattspitzen und Rispen hängen.
   * Kommt man zurück (etwa aus dem Training), fallen Tropfen auf jede gegossene Pflanze: Sie richtet sich federnd
   * auf und wächst; neue Setzlinge sprießen. Antippen: die Pflanze hüpft und nennt Wort und Zustand, Wasser zieht Ringe.
   * Leben: Böen laufen als Welle durchs Feld, das Wasser glitzert, nachts Glühwürmchen.
   * `focus` blendet alle anderen Pflanzen ab (z. B. nur Verben); `info` = die zuletzt angetippte Pflanze;
   * `report` = was sich seit dem letzten Besuch getan hat (z. B. „3 neu gepflanzt · 16 gegossen“), sonst null.
   */
  let {
    keys,
    focus = null,
    info = $bindable(null),
    report = $bindable(null),
  }: { keys: ProgressKey[]; focus?: ReadonlySet<string> | null; info?: PlantInfo | null; report?: string | null } = $props();

  const DAY = {
    sky: '#FDE6CF',
    far: '#B9DACF',
    dike: '#D9B98A',
    dikeShade: '#C39E6A',
    water: '#B3DDD6',
    waterLight: '#EEF8F3',
    sprout: '#8CC65A',
    leaf: '#57A04C',
    leafShade: '#3B7A3B',
    grain: '#D5D56A',
    gold: '#EBB83A',
    goldShade: '#C48C22',
    dry: '#A8B27C',
    dryShade: '#8A945F',
  };
  const NIGHT: typeof DAY = {
    sky: '#1B2442',
    far: '#28365A',
    dike: '#4C4A60',
    dikeShade: '#3B394F',
    water: '#2B416B',
    waterLight: '#7090C2',
    sprout: '#4F8C59',
    leaf: '#3A6F50',
    leafShade: '#28503D',
    grain: '#9A9C58',
    gold: '#B78F3D',
    goldShade: '#8C6C2B',
    dry: '#6C735A',
    dryShade: '#565C49',
  };
  const LAMP = '#FFC14D';
  const night = $derived(theme.dark);
  const C = $derived(night ? NIGHT : DAY);

  /** Glitzerbänder auf dem Wasser: x, y, Breite. */
  const SHIMMER: [number, number, number][] = [
    [60, 122, 34],
    [170, 132, 46],
    [262, 120, 30],
    [110, 168, 52],
    [300, 176, 40],
    [40, 214, 36],
    [214, 222, 58],
    [356, 232, 30],
  ];
  /** Spiegelung von Sonne bzw. Mond unter dem Himmelskörper. */
  const GLINT: [number, number][] = [
    [116, 30],
    [124, 22],
    [132, 14],
  ];
  /** Tropfen je gegossener Pflanze: Versatz x (× Pflanzengröße), Höhenversatz, Verzögerung in ms. */
  const DROPS: [number, number, number][] = [
    [-5, 0, 0],
    [0.5, -6, 90],
    [5.5, -2, 45],
  ];
  const FIREFLIES: [number, number][] = [
    [48, 150],
    [120, 128],
    [196, 160],
    [262, 138],
    [330, 166],
    [372, 132],
  ];

  const day = today();
  const plants = $derived(new Map(keys.map((k) => [k, plantOf(game.save.items[k]!, day)] as const)));
  /** Pflanzreihenfolge (nach Wuchs) – Index j im Feld gehört zu order[j]. */
  const order = $derived(fieldOrder(keys, plants));
  const slots = $derived(fieldSlots(order.length));
  /** Reihen von hinten nach vorn (Malreihenfolge), je mit den Indizes ihrer Pflanzen. */
  const rows = $derived.by(() => {
    const out: { row: number; ids: number[] }[] = [];
    slots.forEach((s, i) => (out[s.row] ??= { row: s.row, ids: [] }).ids.push(i));
    return out.filter(Boolean).reverse();
  });
  const rowCount = $derived(rows.length ? rows[0]!.row + 1 : 0);

  // Was sich seit dem letzten Besuch getan hat, wächst nach dem Aufbau der Szene (Tropfen → aufrichten).
  // Das Gießen zieht als eine Welle von links nach rechts übers Feld.
  const DROP = 420;
  const GROW = 760;
  const diff: Change[] = untrack(() => fieldChanges(lastSeen, plants));
  const changes = reducedMotion() ? [] : diff;
  /** erst wenn die letzte Reihe gewachsen ist (Aufbau: 180 ms + 34 ms je Reihe + 760 ms) */
  const START = untrack(() => 180 + rowCount * 34 + 760 + 80);
  const SWEEP = Math.min(1300, 300 + changes.length * 40);
  const moving = untrack(
    () =>
      new Map(
        changes.map((c) => {
          const s = slots[order.indexOf(c.key)];
          const across = s ? (s.x - FIELD.left) / (FIELD.right - FIELD.left) : 0;
          return [c.key as string, { c, at: START + SWEEP * across }];
        }),
      ),
  );
  const END = START + SWEEP + DROP + GROW + 100;
  let clock = $state(-1);

  onMount(() => {
    if (!moving.size) return;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      clock = t - t0;
      if (clock < END) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  });
  onMount(() => {
    const count = (f: (c: Change) => boolean) => diff.filter(f).length;
    const parts = [
      [count((c) => !c.from), 'neu gepflanzt'],
      [count((c) => !!c.from?.thirsty && !c.to.thirsty), 'gegossen'],
      [count((c) => !!c.from && c.to.stage > c.from.stage), 'gewachsen'],
    ] as const;
    const text = parts.filter(([n]) => n > 0).map(([n, what]) => `${n} ${what}`);
    report = text.length ? text.join(' · ') : null;
  });
  onDestroy(() => (lastSeen = new Map(plants)));

  const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
  const easeOut = (u: number) => 1 - (1 - u) ** 3;
  /** federnd: schießt kurz über das Ziel hinaus (Blätter schnellen hoch) */
  const easeBack = (u: number) => 1 + 2.4 * (u - 1) ** 3 + 1.4 * (u - 1) ** 2;

  function paint(stage: number, thirsty: boolean) {
    if (thirsty) return { light: C.dry, shade: C.dryShade, head: C.dryShade };
    if (stage < 2.5) return { light: C.sprout, shade: C.leaf, head: C.grain };
    if (stage < 4.5) return { light: C.leaf, shade: C.leafShade, head: C.grain };
    return { light: C.gold, shade: C.goldShade, head: C.goldShade };
  }

  function resting(key: string) {
    const p = plants.get(key as ProgressKey)!;
    return { shape: restingShape(p), paint: paint(p.stage, p.thirsty) };
  }

  function moved(key: string, now: number) {
    const { c, at } = moving.get(key)!;
    const from = c.from ?? { stage: 0, thirsty: false };
    const u = clamp01((now - at - (c.watered ? DROP : 0)) / GROW);
    const stage = from.stage + (c.to.stage - from.stage) * easeOut(u);
    const d0 = from.thirsty ? 1 : 0;
    const droop = d0 + ((c.to.thirsty ? 1 : 0) - d0) * easeBack(u);
    return { shape: plantShape(stage, droop), paint: paint(u < 0.5 && c.from ? c.from.stage : c.to.stage, u < 0.3 ? from.thirsty : c.to.thirsty) };
  }

  // Antippen: Pflanze hüpft und nennt sich; Wasser zieht Ringe. Tastatur geht die Pflanzen der Reihe nach durch.
  let picked: number | null = null;
  let splashes = $state<{ id: number; x: number; y: number; k: number }[]>([]);
  let splashId = 0;
  let art: HTMLButtonElement;

  function splash(x: number, y: number, k: number) {
    if (reducedMotion()) return;
    const id = ++splashId;
    splashes = [...splashes, { id, x, y, k }];
    setTimeout(() => (splashes = splashes.filter((s) => s.id !== id)), 900);
  }

  function pick(e: MouseEvent) {
    if (!keys.length) return;
    let j: number | null;
    if (e.detail === 0) j = ((picked ?? -1) + 1) % keys.length;
    else {
      const r = art.getBoundingClientRect();
      const x = ((e.clientX - r.left) / r.width) * 400;
      const y = ((e.clientY - r.top) / r.height) * 260;
      j = nearestSlot(slots, x, y);
      if (j === null) {
        if (y > FIELD.back - 4) {
          tick();
          splash(x, y, 0.8);
        }
        return;
      }
    }
    tick();
    picked = j;
    info = plantInfo(order[j]!, game.save.items[order[j]!]!, day);
    const s = slots[j]!;
    splash(s.x, s.y, s.k);
    if (!reducedMotion())
      art.querySelector(`[data-plant="${j}"]`)?.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.16, 0.84)' }, { transform: 'scale(0.92, 1.14)' }, { transform: 'scale(1)' }],
        { duration: 560, easing: 'ease-out' },
      );
  }

  /** Flacher Ring (zwei Ellipsen, gerade-ungerade gefüllt – keine Kontur). */
  const ring = (rx: number, ry: number) =>
    `M${-rx} 0a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z` +
    `M${-rx * 0.72} 0a${rx * 0.72} ${ry * 0.72} 0 1 0 ${rx * 1.44} 0a${rx * 0.72} ${ry * 0.72} 0 1 0 ${-rx * 1.44} 0Z`;

  const thirsty = $derived([...plants.values()].filter((p) => p.thirsty).length);
  const label = $derived(
    keys.length === 0
      ? 'Reisfeld, noch leer'
      : `Reisfeld mit ${keys.length} ${keys.length === 1 ? 'Pflanze' : 'Pflanzen'}, ${thirsty} durstig. Antippen zeigt eine Pflanze.`,
  );
</script>

<div class="field">
  <button class="art" bind:this={art} aria-label={label} onclick={pick} disabled={keys.length === 0}>
    <Scene label="Reisfeld">
      <rect width="400" height="260" fill={C.sky} />
      <Sky x={334} y={46} r={22} />

      <!-- ferne Hügel -->
      <g class="in in-rise" style="--e: 40">
        <path
          d="M0 96 C30 86 52 72 80 76 C108 80 118 96 146 94 C178 92 192 70 226 72 C258 74 270 94 300 92 C326 90 340 80 362 82 C380 84 392 90 400 92 L400 116 L0 116 Z"
          fill={C.far}
        />
      </g>

      <!-- Wasserfläche zwischen den Dämmen, mit Spiegelung und Glitzern -->
      <g class="in in-fade" style="--e: 0">
        <rect y="106" width="400" height="148" fill={C.water} />
        {#each GLINT as [w, dy], i (dy)}
          <g class="loop-shimmer" style="--t: {2.2 + i * 0.4}s; --d: {-i * 0.6}s; --dx: 4">
            <rect x={334 - w / 4} y={117 + i * 5} width={w / 2} height="2" rx="1" fill={C.waterLight} />
          </g>
        {/each}
        {#each SHIMMER as [sx, sy, sw], i (sx)}
          <g class="loop-shimmer" style="--t: {2.8 + (i % 3) * 0.6}s; --d: {-i * 0.55}s; --dx: 7">
            <rect x={sx - sw / 2} y={sy} width={sw} height="2.4" rx="1.2" fill={C.waterLight} />
          </g>
        {/each}
      </g>

      <!-- hinterer Damm -->
      <g class="in in-rise" style="--e: 80">
        <path d="M0 106 C120 101 250 108 400 102 L400 111 C250 116 120 109 0 113 Z" fill={C.dike} />
      </g>

      <!-- Pflanzen, Reihe für Reihe von hinten nach vorn; jede Reihe wächst beim Aufbau aus dem Wasser -->
      {#each rows as r (r.row)}
        <g class="in in-grow" style="--e: {180 + r.row * 34}">
          <g class="loop-gust origin-bottom" style="--d: {(rowCount - r.row) * 0.09}s">
            {#each r.ids as j (order[j])}
              {@const s = slots[j]!}
              {@const key = order[j]!}
              {@const look = moving.has(key) ? moved(key, clock) : resting(key)}
              <g transform="translate({s.x} {s.y}) rotate({s.tilt}) scale({s.k})">
                <g class="plant" class:dim={focus !== null && !focus.has(key)} data-plant={j}>
                  <path d={look.shape.shade} fill={look.paint.shade} />
                  <path d={look.shape.light} fill={look.paint.light} />
                  {#if look.shape.head}<path d={look.shape.head} fill={look.paint.head} />{/if}
                </g>
              </g>
            {/each}
          </g>
        </g>
      {/each}

      <!-- Gießen: Tropfen fallen als Striche in die Pflanze, ein Ring läuft übers Wasser -->
      {#each changes as c (c.key)}
        {#if c.watered}
          {@const j = order.indexOf(c.key)}
          {@const s = slots[j]}
          {#if s}
            {@const top = plantShape(Math.max(c.from?.stage ?? 0, c.to.stage), 0).top * s.k}
            {@const at = moving.get(c.key)!.at}
            {@const size = 0.55 + 0.45 * s.k}
            <g transform="translate({s.x} {s.y})">
              {#each DROPS as [dx, dy, lag] (dx)}
                <rect
                  class="drop"
                  x={dx * s.k - 0.9 * size}
                  y={-top - 7 * size + dy * size}
                  width={1.8 * size}
                  height={6.5 * size}
                  rx={0.9 * size}
                  fill={C.waterLight}
                  style="--at: {at + lag}ms; --fall: {top * 0.55 + 5}px"
                />
              {/each}
              <path class="splash" d={ring(9 * s.k, 2.6 * s.k)} fill={C.waterLight} fill-rule="evenodd" style="--at: {at + DROP}ms" />
            </g>
          {/if}
        {/if}
      {/each}

      {#each splashes as sp (sp.id)}
        <g transform="translate({sp.x} {sp.y})">
          <path class="splash" d={ring(9 * sp.k, 2.6 * sp.k)} fill={C.waterLight} fill-rule="evenodd" style="--at: 0ms" />
        </g>
      {/each}

      <!-- vorderer Damm -->
      <g class="in in-rise" style="--e: 120">
        <path d="M0 249 C140 245 260 251 400 246 L400 260 L0 260 Z" fill={C.dike} />
        <path d="M0 255 C150 252 270 257 400 253 L400 260 L0 260 Z" fill={C.dikeShade} />
      </g>

      {#if night}
        <g class="in in-fade" style="--e: 900">
          {#each FIREFLIES as [fx, fy], i (fx)}
            <g class="loop-bob" style="--t: {3 + (i % 3) * 0.8}s; --amp: 6; --rot: 0; --d: {-i * 0.7}s">
              <g class="loop-twinkle" style="--t: {1.6 + (i % 3) * 0.7}s; --d: {-i * 0.5}s">
                <Glow x={fx} y={fy} r={2.4} color={LAMP} t={1.8 + i * 0.3} />
                <circle cx={fx} cy={fy} r="1.6" fill={LAMP} />
              </g>
            </g>
          {/each}
        </g>
      {/if}
    </Scene>
  </button>
</div>

<style>
  .art {
    display: block;
    width: 100%;
    aspect-ratio: 400 / 260;
    padding: 0;
    border: 0;
    background: var(--paper-2);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .art:disabled {
    cursor: default;
  }
  .art :global(svg) {
    pointer-events: none;
  }
  .plant {
    transform-box: fill-box;
    transform-origin: 50% 100%;
    transition: opacity var(--dur-slow) var(--ease-out);
  }
  .plant.dim {
    opacity: 0.22;
  }
  .drop {
    opacity: 0;
    animation: drop-fall 420ms ease-in both;
    animation-delay: var(--at);
  }
  @keyframes drop-fall {
    from {
      transform: translateY(calc(var(--fall) * -1));
      opacity: 0;
    }
    25%,
    85% {
      opacity: 1;
    }
    to {
      transform: translateY(0);
      opacity: 0;
    }
  }
  .splash {
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    animation: splash 820ms var(--ease-out) both;
    animation-delay: var(--at);
  }
  @keyframes splash {
    from {
      transform: scale(0.3);
      opacity: 0;
    }
    6% {
      opacity: 0.95;
    }
    to {
      transform: scale(1.7);
      opacity: 0;
    }
  }
</style>
