<script lang="ts">
  import { onDestroy, untrack } from 'svelte';
  import { tick } from '../../lib/feedback';
  import { feedTrau, game, today } from '../../lib/game.svelte';
  import YardScene from '../../lib/illustrations/YardScene.svelte';
  import { canFeed, fedToday } from '../../lib/logic/yard';
  import type { Mood } from '../../lib/mascot/Buffalo.svelte';
  import Trau from '../../lib/mascot/Trau.svelte';
  import { reducedMotion } from '../../lib/motion';
  import { theme } from '../../lib/theme.svelte';

  /**
   * Trâus Hof im Profil: Trâu steht vor seinem Stelzenhaus. Antippen streichelt ihn (Hüpfer, Herzen), nachts schläft
   * er (Zzz) und wacht beim Antippen kurz auf. Ist das Tagesziel geschafft, liegt frisches Gras bereit: Antippen
   * wirft es ihm zu, er frisst (einmal am Tag). `dressed` zählt Kleiderwechsel – dann freut er sich auch.
   */
  let { dressed = 0 }: { dressed?: number } = $props();

  const day = today();
  const save = $derived(game.save);
  const feedable = $derived(canFeed(save, day));
  const fed = $derived(fedToday(save, day));
  const xpLeft = $derived(Math.max(0, save.dailyGoal - (save.today.date === day ? save.today.xp : 0)));

  let reaction = $state<null | 'happy' | 'eat'>(null);
  let hops = $state(0);
  let hearts = $state<number[]>([]);
  let flying = $state(false);
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const later = (fn: () => void, ms: number) => {
    const t = setTimeout(() => {
      timers.delete(t);
      fn();
    }, ms);
    timers.add(t);
  };
  onDestroy(() => timers.forEach(clearTimeout));

  /** Gras-Büschel: Tag/Nacht wie die Szene, das Band in Flaggenrot. */
  const GRASS_DAY = { blade: '#5E9E5A', light: '#8CC27A', tie: '#DA251D' };
  const GRASS_NIGHT: typeof GRASS_DAY = { blade: '#3A6F50', light: '#4F8C59', tie: '#B8362C' };
  const G = $derived(theme.dark ? GRASS_NIGHT : GRASS_DAY);

  const asleep = $derived(theme.dark && reaction === null);
  const mood: Mood = $derived(reaction ?? (asleep ? 'sleep' : 'idle'));
  let until = 0;

  function react(kind: 'happy' | 'eat', ms: number) {
    reaction = kind;
    hops++;
    until = Date.now() + ms;
    later(() => {
      if (Date.now() >= until) reaction = null;
    }, ms);
  }

  let heartId = 0;
  function burst() {
    const id = ++heartId;
    hearts = [...hearts, id];
    later(() => (hearts = hearts.filter((h) => h !== id)), 1500);
  }

  function pet() {
    tick();
    react('happy', theme.dark ? 2400 : 1300);
    burst();
  }

  function giveGrass() {
    if (!feedable || flying) return;
    tick();
    flying = true;
    later(
      () => {
        flying = false;
        if (feedTrau()) {
          react('eat', 2800);
          burst();
        }
      },
      reducedMotion() ? 0 : 620,
    );
  }

  // Neues Accessoire angelegt: Trâu freut sich.
  let seenDressed = untrack(() => dressed);
  $effect(() => {
    if (dressed !== seenDressed) {
      seenDressed = dressed;
      untrack(() => react('happy', 1200));
    }
  });

  const note = $derived(
    feedable
      ? 'Tagesziel geschafft – frisches Gras liegt bereit. Tipp es an!'
      : fed
        ? asleep
          ? 'Trâu ist satt und schläft. Gute Nacht!'
          : 'Trâu ist satt. Morgen gibt es wieder Gras.'
        : `Noch ${xpLeft} XP bis zum Tagesziel – dann gibt es frisches Gras.${asleep ? ' Trâu schläft schon.' : ''}`,
  );
</script>

<div class="yard">
  <div class="scene"><YardScene /></div>
  {#if asleep}
    <div class="zzz" aria-hidden="true"><span>z</span><span>z</span><span>Z</span></div>
  {/if}
  <div class="hearts" aria-hidden="true">
    {#each hearts as h (h)}
      {#each [-1, 0, 1] as k (k)}
        <svg class="heart" style:--k={k} viewBox="0 0 24 24"
          ><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z" /></svg
        >
      {/each}
    {/each}
  </div>
  <button class="trau" onclick={pet} aria-label={asleep ? 'Trâu wecken' : 'Trâu streicheln'}>
    {#key hops}<Trau size={120} {mood} />{/key}
  </button>
  {#if feedable}
    <button class="grass" class:flying onclick={giveGrass} aria-label="Trâu mit frischem Gras füttern">
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M10 40 C8 28 6 18 4 8 C10 16 14 26 18 38 Z" fill={G.blade} />
        <path d="M18 40 C18 26 20 14 24 4 C26 16 26 28 26 40 Z" fill={G.light} />
        <path d="M30 40 C30 28 34 18 42 8 C40 20 38 30 36 40 Z" fill={G.blade} />
        <path d="M14 40 C14 30 13 22 12 14 C16 22 19 30 22 40 Z" fill={G.light} />
        <rect x="9" y="30" width="30" height="6" rx="3" fill={G.tie} />
        <ellipse cx="24" cy="42" rx="17" ry="4" fill={G.blade} />
      </svg>
    </button>
  {/if}
</div>
<p class="note" role="status">{note}</p>

<style>
  /* Container-Einheiten (cqw): alles skaliert mit der Breite des Hofs. */
  .yard {
    position: relative;
    container-type: inline-size;
    aspect-ratio: 400 / 260;
    border-radius: var(--radius-card);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    background: var(--paper-2);
  }
  .scene {
    position: absolute;
    inset: 0;
  }
  .trau {
    position: absolute;
    left: 46cqw;
    bottom: 1cqw;
    width: 30cqw;
    height: 30cqw;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .trau :global(svg.buffalo) {
    width: 100%;
    height: 100%;
  }
  /* Frisches Gras: wippt einladend; angetippt fliegt es Trâu ins Maul. */
  .grass {
    position: absolute;
    left: 30cqw;
    bottom: 3cqw;
    width: 15cqw;
    height: 15cqw;
    min-width: var(--tap);
    min-height: var(--tap);
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    animation: grass-wiggle 1.6s var(--ease-out) infinite;
    transform-origin: 50% 100%;
  }
  .grass svg {
    width: 100%;
    height: 100%;
  }
  .grass.flying {
    animation: grass-fly 620ms var(--ease-out) forwards;
  }
  @keyframes grass-wiggle {
    0%,
    60%,
    100% {
      transform: rotate(0);
    }
    70% {
      transform: rotate(-9deg);
    }
    82% {
      transform: rotate(7deg);
    }
    92% {
      transform: rotate(-3deg);
    }
  }
  @keyframes grass-fly {
    40% {
      transform: translate(10cqw, -10cqw) rotate(20deg) scale(0.9);
    }
    to {
      transform: translate(22cqw, -4cqw) rotate(30deg) scale(0.3);
      opacity: 0;
    }
  }
  /* Herzen steigen über Trâus Kopf auf. */
  .hearts {
    position: absolute;
    left: 61cqw;
    bottom: 26cqw;
    width: 0;
    height: 0;
  }
  .heart {
    position: absolute;
    width: 6cqw;
    height: 6cqw;
    left: calc(var(--k) * 6cqw - 3cqw);
    fill: var(--red);
    animation: heart-up 1.4s var(--ease-out) both;
    animation-delay: calc((var(--k) + 1) * 90ms);
  }
  .heart:nth-child(2) {
    fill: var(--lotus);
  }
  @keyframes heart-up {
    from {
      transform: translateY(4cqw) scale(0.3);
      opacity: 0;
    }
    25% {
      opacity: 1;
    }
    to {
      transform: translateY(-12cqw) rotate(calc(var(--k) * 14deg)) scale(1);
      opacity: 0;
    }
  }
  /* Nachts: Zzz steigen aus dem schlafenden Trâu. */
  .zzz {
    position: absolute;
    left: 70cqw;
    bottom: 24cqw;
    color: var(--ink);
    font-weight: 800;
    pointer-events: none;
  }
  .zzz span {
    position: absolute;
    font-size: calc(3.4cqw + var(--n, 0) * 1.2cqw);
    animation: zzz 3.6s ease-in-out infinite;
  }
  .zzz span:nth-child(2) {
    --n: 1;
    animation-delay: 1.2s;
  }
  .zzz span:nth-child(3) {
    --n: 2;
    animation-delay: 2.4s;
  }
  @keyframes zzz {
    from {
      transform: translate(0, 0);
      opacity: 0;
    }
    20% {
      opacity: 1;
    }
    to {
      transform: translate(6cqw, -12cqw);
      opacity: 0;
    }
  }
  .note {
    margin-top: 10px;
    font-weight: 600;
    text-align: center;
    color: var(--ink-2);
  }
  @media (prefers-reduced-motion: reduce) {
    .grass,
    .grass.flying,
    .heart,
    .zzz span {
      animation: none;
    }
    .heart {
      display: none;
    }
    .zzz span:nth-child(2) {
      transform: translate(3cqw, -5cqw);
    }
    .zzz span:nth-child(3) {
      transform: translate(6cqw, -10cqw);
    }
  }
</style>
