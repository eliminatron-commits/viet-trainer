<script lang="ts">
  import { tick } from 'svelte';
  import { tick as haptic } from '../feedback';
  import { game, today } from '../game.svelte';
  import { weekRecap } from '../logic/recap';
  import Trau from '../mascot/Trau.svelte';
  import { reducedMotion } from '../motion';
  import { closeRecap, recap } from '../recap.svelte';
  import { theme } from '../theme.svelte';
  import Button from './Button.svelte';
  import Lantern from './Lantern.svelte';
  import LanternHalo from './LanternHalo.svelte';

  /**
   * Wochenrückblick „Deine Woche“ als Doppelseite in einem Blatt von unten (Papier-Schleier dahinter). Seite 1: die
   * Laternenkette der Woche (gehen nacheinander an, nachts mit Lichthöfen), Lerntage, Tagesziele, hochzählende XP und
   * Trâu. Seite 2: neue Wörter, Aufgaben, Anteil richtig, Runden und die Challenges der Woche. Umblättern wie im
   * Reisepass (Pfeil oder Wischen, die Seite dreht sich um den Rücken). Schließen per Knopf, Schleier oder Escape;
   * der Fokus bleibt im Blatt.
   */
  const r = $derived(recap.week ? weekRecap(game.save, recap.week, today()) : null);
  let page = $state(0);
  /** Umblättern: die obere Seite (0) dreht sich weg bzw. zurück, die andere liegt darunter. */
  let turning = $state<'away' | 'back' | null>(null);
  let closing = $state(false);
  let sheet = $state<HTMLElement | null>(null);
  const LAST = 1;

  // Neu geöffnet: erste Seite, Fokus auf den Titel, die Seite dahinter scrollt nicht mit.
  $effect.pre(() => {
    if (recap.week) {
      page = 0;
      turning = null;
    }
  });
  $effect(() => {
    if (!recap.week || !sheet) return;
    const el = sheet;
    void tick().then(() => el.querySelector<HTMLElement>('#recap-title-0')?.focus({ preventScroll: true }));
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = 'hidden';
    return () => {
      root.style.overflow = prev;
    };
  });

  function close() {
    if (closing) return;
    if (reducedMotion()) return closeRecap();
    closing = true;
    setTimeout(() => {
      closing = false;
      closeRecap();
    }, 240);
  }
  let turnTimer = 0;
  function go(to: number) {
    if (to < 0 || to > LAST || to === page) return;
    const forward = to > page;
    page = to;
    haptic();
    if (!reducedMotion()) {
      turning = forward ? 'away' : 'back';
      clearTimeout(turnTimer);
      turnTimer = window.setTimeout(() => (turning = null), TURN);
    }
    void tick().then(() => sheet?.querySelector<HTMLElement>(`#recap-title-${to}`)?.focus({ preventScroll: true }));
  }

  // XP zählen hoch, sobald das Blatt steht (reduzierte Bewegung: gleich der Endwert).
  let shownXp = $state(0);
  $effect(() => {
    const target = r?.xp ?? 0;
    if (reducedMotion()) {
      shownXp = target;
      return;
    }
    shownXp = 0;
    const t0 = performance.now() + 520;
    let raf = requestAnimationFrame(function step(t) {
      const u = Math.min(1, Math.max(0, (t - t0) / 900));
      shownXp = Math.round(target * (1 - (1 - u) ** 3));
      if (u < 1) raf = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(raf);
  });

  // Wischen: waagerecht blättert.
  let startX: number | null = null;
  function down(e: PointerEvent) {
    startX = e.clientX;
  }
  function up(e: PointerEvent) {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 44) go(page + (dx < 0 ? 1 : -1));
  }

  // Blättern wie im Buch (Rücken links): vorwärts dreht Seite 1 weg, rückwärts dreht sie zurück. Beide Seiten liegen
  // immer in derselben Zelle – die höhere bestimmt die Höhe, das Blatt springt nicht.
  const TURN = 560;
  const visible = (i: number) => i === page || (turning !== null && i <= 1);

  function onkeydown(e: KeyboardEvent) {
    if (!recap.week) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    } else if (e.key === 'Tab' && sheet) {
      const all = [...sheet.querySelectorAll<HTMLElement>('button:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!all.length) return;
      const first = all[0]!;
      const last = all.at(-1)!;
      if (e.shiftKey && (document.activeElement === first || !sheet.contains(document.activeElement))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }

  const n = (v: number, one: string, many: string) => (v === 1 ? one : many);
</script>

<svelte:window {onkeydown} />

{#if r}
  <div class="recap" class:closing>
    <div class="scrim" aria-hidden="true" onclick={close}></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-labelledby="recap-title-{page}" data-week={r.monday} bind:this={sheet}>
      <button class="glass close" onclick={close} aria-label="Schließen">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
          ><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" /></svg
        >
      </button>

      <div
        class="book"
        role="group"
        aria-roledescription="Doppelseite"
        aria-label="Seite {page + 1} von {LAST + 1}"
        onpointerdown={down}
        onpointerup={up}
        onpointercancel={() => (startX = null)}
      >
          <section
            class="page first"
            class:hidden={!visible(0)}
            class:away={turning === 'away'}
            class:back={turning === 'back'}
            data-page="0"
            inert={page !== 0}
          >
            <p class="kicker">{r.current ? 'Diese Woche bisher' : 'Deine Woche'}</p>
              <h2 id="recap-title-0" tabindex="-1">{r.title}</h2>
              <ol class="chain lights" data-phase="in" aria-label="Lerntage">
                {#each r.days as d, i (d.date)}
                  <li style:--i={i} aria-label="{d.weekday} {d.day}.: {d.lantern === 'goal' ? 'Tagesziel' : d.lantern === 'learned' ? 'gelernt' : d.lantern === 'shield' ? 'Streak-Schutz' : d.lantern === 'future' ? 'noch nicht da' : 'nicht gelernt'}">
                    <svg class="cord" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"
                      ><path d="M0 .6Q50 12.6 100 .6V2.2Q50 14.2 0 2.2Z" /></svg
                    >
                    {#if theme.dark && (d.lantern === 'goal' || d.lantern === 'learned')}<LanternHalo state={d.lantern} />{/if}
                    <span class="hang"><Lantern state={d.lantern} num={d.day} /></span>
                    <span class="wd" class:today={d.today} aria-hidden="true">{d.weekday}</span>
                  </li>
                {/each}
              </ol>
              <dl class="big">
                <div><dt>{n(r.learned, 'Lerntag', 'Lerntage')}</dt><dd>{r.learned}</dd></div>
                <div><dt>{n(r.goals, 'Tagesziel', 'Tagesziele')}</dt><dd>{r.goals}</dd></div>
                <div>
                  <dt>XP</dt>
                  <dd data-value={r.xp}><span aria-hidden="true">{shownXp}</span><span class="sr">{r.xp}</span></dd>
                </div>
              </dl>
              <p class="note">
                {#if r.shields > 0}{r.shields === 1 ? 'Einen Tag' : `${r.shields} Tage`} hat der Streak-Schutz gerettet.{/if}
              </p>
              <div class="trau"><Trau size={150} mood={r.goals > 0 ? 'cheer' : 'happy'} /></div>
          </section>
          <section class="page" class:hidden={!visible(1)} data-page="1" inert={page !== 1}>
            <p class="kicker">{r.current ? 'Diese Woche bisher' : 'Deine Woche'}</p>
              <h2 id="recap-title-1" tabindex="-1">Gelernt</h2>
              <dl class="grid">
                <div><dt>{n(r.newWords, 'neues Wort', 'neue Wörter')}</dt><dd>{r.newWords}</dd></div>
                <div><dt>{n(r.tasks, 'Aufgabe', 'Aufgaben')}</dt><dd>{r.tasks}</dd></div>
                <div><dt>richtig</dt><dd>{r.share === null ? '–' : `${r.share} %`}</dd></div>
                <div><dt>{n(r.rounds, 'Runde', 'Runden')}</dt><dd>{r.rounds}</dd></div>
              </dl>
              <h3>Challenges</h3>
              {#if r.challenges}
                <ul class="challenges">
                  {#each r.challenges as c (c.id)}
                    <li class:done={c.done}>
                      <div class="ch-head">
                        <p class="ch-title">{c.title}</p>
                        <p class="count">{c.done ? 'geschafft' : `${c.progress} / ${c.goal}`}</p>
                      </div>
                      <div class="bar" role="progressbar" aria-label={c.title} aria-valuemin="0" aria-valuemax={c.goal} aria-valuenow={c.progress}>
                        <div class="fill" style:width="{(c.progress / c.goal) * 100}%"></div>
                      </div>
                    </li>
                  {/each}
                </ul>
              {:else}
                <p class="note">Für diese Woche nicht festgehalten.</p>
              {/if}
          </section>
      </div>

      <div class="nav">
        <button class="turn" onclick={() => go(page - 1)} disabled={page === 0} aria-label="Vorige Seite">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
        </button>
        <Button onclick={() => (page < LAST ? go(page + 1) : close())}>{page < LAST ? 'Weiter' : 'Fertig'}</Button>
      </div>
    </div>
  </div>
{/if}

<style>
  .recap {
    position: fixed;
    inset: 0;
    z-index: 35;
    display: grid;
    align-items: end;
  }
  .scrim {
    position: absolute;
    inset: 0;
    background: var(--scrim);
    touch-action: none;
    animation: fade 260ms var(--ease-out) both;
  }
  .sheet {
    position: relative;
    display: grid;
    gap: 12px;
    max-height: calc(100dvh - var(--safe-top) - 12px);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 18px var(--gutter) calc(var(--safe-bottom) + 20px);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    background: var(--paper);
    box-shadow: var(--shadow-float);
    animation: sheet-up 420ms var(--ease-out) both;
  }
  .closing .scrim {
    animation: fade-out 240ms var(--ease-out) forwards;
  }
  .closing .sheet {
    animation: sheet-down 240ms cubic-bezier(0.5, 0, 0.75, 0) forwards;
  }
  /* Schließen sitzt in der Ecke der Seite */
  .close {
    position: absolute;
    z-index: 4;
    top: 22px;
    right: calc(var(--gutter) + 6px);
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--glass);
    color: var(--ink);
    display: grid;
    place-items: center;
    cursor: pointer;
  }

  /* Doppelseite: zwei Seiten übereinander in einer Zelle; die obere dreht sich um den Rücken links. */
  .book {
    display: grid;
    touch-action: pan-y;
  }
  .page {
    grid-area: 1 / 1;
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 18px 18px 18px 28px;
    border-radius: 6px 24px 24px 6px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
    transform-origin: left center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .page.hidden {
    visibility: hidden;
  }
  .page.first {
    z-index: 2;
  }
  .page.away {
    animation: turn-away 560ms var(--ease-out) forwards;
  }
  .page.back {
    animation: turn-back 560ms var(--ease-out) both;
  }
  .kicker {
    padding-right: 44px;
  }
  /* Rücken: dunklerer Streifen links */
  .page::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 12px;
    border-radius: 6px 0 0 6px;
    background: var(--paper-2);
  }
  .kicker {
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  h2 {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
    outline: none;
  }
  h3 {
    font-size: 18px;
    font-weight: 800;
    margin-top: 6px;
  }

  /* Laternenkette der Woche */
  /* Laternen so groß, wie sieben nebeneinander Platz haben (höchstens 46 px) */
  .chain {
    --step: 110ms;
    --lead: 420ms;
    container-type: inline-size;
    display: grid;
    grid-template-columns: repeat(7, minmax(0, 1fr));
    list-style: none;
    margin: 6px -6px 0;
    padding: 0;
  }
  .chain li {
    --w: min(46px, calc(100cqw / 7 - 6px));
    --hy: calc(6.5px + var(--w) * 20.5 / 36);
    position: relative;
    height: calc(6.5px + var(--w) * 42 / 36 + 24px);
  }
  .cord {
    position: absolute;
    z-index: 2;
    inset: 0 0 auto;
    width: 100%;
    height: 10px;
    fill: var(--ink-3);
  }
  .hang {
    position: absolute;
    z-index: 3;
    top: 6.5px;
    left: calc(50% - var(--w) / 2);
    transform-origin: 50% 0;
  }
  .wd {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    text-align: center;
    color: var(--ink-2);
    font-size: 13px;
    font-weight: 700;
  }
  .wd.today {
    color: var(--ink);
  }
  .wd.today::after {
    content: '';
    display: block;
    width: 6px;
    height: 6px;
    margin: 1px auto 0;
    border-radius: 50%;
    background: var(--red);
  }

  .big,
  .grid {
    display: grid;
    gap: 8px;
    margin: 0;
  }
  .big {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-top: 4px;
  }
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .big div,
  .grid div {
    display: flex;
    flex-direction: column-reverse;
    justify-content: flex-end;
    padding: 10px 12px;
    border-radius: 18px;
    background: var(--paper-2);
  }
  dd {
    margin: 0;
    font-size: 28px;
    font-weight: 800;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  dt {
    color: var(--ink-2);
    font-size: 13px;
    font-weight: 600;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
  .note {
    min-height: 20px;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
  }
  .trau {
    align-self: center;
    margin-top: auto;
  }

  .challenges {
    display: grid;
    gap: 8px;
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .challenges li {
    display: grid;
    gap: 6px;
    padding: 10px 12px;
    border-radius: 18px;
    background: var(--paper-2);
  }
  .ch-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
  .ch-title {
    font-size: var(--fs-small);
    font-weight: 700;
  }
  .count {
    white-space: nowrap;
    color: var(--ink-2);
    font-size: var(--fs-small);
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .done .count {
    color: var(--ok);
    font-weight: 700;
  }
  .bar {
    height: 10px;
    border-radius: 999px;
    background: var(--surface);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--sea);
  }
  .done .fill {
    background: var(--ok);
  }

  .nav {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nav > :global(.btn) {
    flex: 1;
  }
  .turn {
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--yellow);
    color: var(--on-yellow);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .turn:disabled {
    background: var(--disabled-bg);
    color: var(--disabled-ink);
    cursor: default;
  }

  @media (max-height: 760px) {
    .sheet {
      gap: 10px;
      padding-top: 12px;
    }
    .close {
      top: 16px;
    }
    .page {
      gap: 8px;
      padding: 14px 14px 14px 24px;
    }
    dd {
      font-size: 24px;
    }
    .big div,
    .grid div {
      padding: 8px 10px;
    }
    .big,
    .grid,
    .challenges {
      gap: 6px;
    }
    .challenges li {
      gap: 5px;
      padding: 8px 10px;
    }
    h3 {
      margin-top: 2px;
    }
  }
  @keyframes turn-away {
    to {
      transform: perspective(1400px) rotateY(-100deg);
    }
  }
  @keyframes turn-back {
    from {
      transform: perspective(1400px) rotateY(-100deg);
    }
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
  }
  @keyframes fade-out {
    to {
      opacity: 0;
    }
  }
  @keyframes sheet-up {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes sheet-down {
    to {
      transform: translateY(100%);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .scrim,
    .sheet {
      animation: none !important;
    }
  }
</style>
