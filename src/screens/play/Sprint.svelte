<script lang="ts">
  import { onMount } from 'svelte';
  import type { WordId } from '../../content/types';
  import Button from '../../lib/components/Button.svelte';
  import Card from '../../lib/components/Card.svelte';
  import { answered, cue } from '../../lib/feedback';
  import { game, recordSprint, recordTask, takeNews, today, type News, type SprintOutcome } from '../../lib/game.svelte';
  import RegionScene from '../../lib/illustrations/RegionScene.svelte';
  import type { Mood } from '../../lib/mascot/Buffalo.svelte';
  import TrauRide from '../../lib/mascot/TrauRide.svelte';
  import { goalReached, levelInfo } from '../../lib/logic/rewards';
  import { answerOf, optionText, type Task } from '../../lib/logic/session';
  import { formatTime, raceTime, SPRINT_GOAL, SPRINT_PENALTY, sprintTasks, weekBest } from '../../lib/logic/sprint';
  import { reportToWorker } from '../../lib/push.svelte';
  import type { CardTone } from '../training/ModeCarousel.svelte';
  import RoundRewards from './RoundRewards.svelte';

  /**
   * Roller-Sprint: Trâu fährt auf dem Roller durch Hà Nội ins Ziel. Ampel Rot – Gelb – Grün, dann läuft die Uhr – nur
   * während der Antwort (die Rückmeldung danach zählt nicht), und nicht, solange die App im Hintergrund ist. Jede
   * richtige Antwort gibt Gas (ein Stück näher an die Zielfahne), jeder Fehler bremst und kostet SPRINT_PENALTY.
   * Kein „Weiter“: nach der Antwort kommt die nächste Aufgabe von selbst. Im Ziel: Zeit, Bestzeit gesamt und der Woche.
   * `card`: aus der Modus-Karte gestartet – die Ansicht ist das Gegenstück der wachsenden Karte (wie bei Play).
   */
  let { card, onexit }: { card?: CardTone; onexit: () => void } = $props();
  const CARD_COLOR: Record<CardTone, string> = { lantern: 'var(--lantern)', yellow: 'var(--tone-yellow)', sea: 'var(--sea)', lotus: 'var(--lotus)' };

  /** Rückmeldung, bevor die nächste Aufgabe kommt (ms): kurz bei richtig, länger bei falsch (Lösung ansehen). */
  const NEXT_RIGHT = 380;
  const NEXT_WRONG = 1000;
  /** Ampel: so lange je Licht (ms), dann Grün = los. */
  const LIGHT = 700;

  type Phase = 'ready' | 'race' | 'done';
  let phase = $state<Phase>('ready');
  /** Ampel: 0 Rot, 1 Gelb, 2 Grün */
  let light = $state(0);
  let tasks = $state.raw<Task[]>(sprintTasks(game.save, SPRINT_GOAL * 2));
  let index = $state(0);
  let right = $state(0);
  let mistakes = $state(0);
  let picked = $state<string | null>(null);
  let mood = $state<Mood>('idle');
  /** Gas (richtig) bzw. Bremse (falsch) – jeder Wechsel spielt die Bewegung neu. */
  let push = $state<{ n: number; kind: 'gas' | 'brake' | null }>({ n: 0, kind: null });
  /** Antwortzeit bisher (ms) und Beginn der laufenden Messung (performance.now(); null = Uhr steht). */
  let spent = 0;
  let since: number | null = null;
  /** angezeigte Zeit (ms) inklusive Strafzeit */
  let clock = $state(0);
  let xp = $state(0);
  let levelUp = $state<number | null>(null);
  let goal = $state(false);
  let news = $state<News[]>([]);
  let outcome = $state<(SprintOutcome & { ms: number }) | null>(null);

  const task = $derived(phase === 'race' ? tasks[index] : undefined);
  const answer = $derived(task ? answerOf(task) : null);
  const promptText = $derived(task?.kind === 'choice' ? (task.mode === 'vn2de' ? task.item.vn : task.item.de).trim() : '');
  /** Groß (40 px) nur, wenn es passt – gemessen bei 375: das breiteste erlaubte Wort (Wiedersehen) braucht 269 von 295 px */
  const big = $derived(promptText.length <= 16 && promptText.split(/\s+/).every((w) => w.length <= 11));
  const best = $derived(game.save.sprint.best);
  const thisWeek = $derived(weekBest(game.save.sprint, today()));

  let timers: ReturnType<typeof setTimeout>[] = [];
  const later = (ms: number, fn: () => void) => void timers.push(setTimeout(fn, ms));

  function startClock() {
    since = document.hidden ? null : performance.now();
  }
  function stopClock() {
    if (since === null) return;
    spent += performance.now() - since;
    since = null;
  }

  let frame = 0;
  function tickClock() {
    if (phase === 'race') clock = spent + (since === null ? 0 : performance.now() - since) + mistakes * SPRINT_PENALTY;
    frame = requestAnimationFrame(tickClock);
  }

  function countdown() {
    light = 0;
    later(LIGHT, () => (light = 1));
    later(2 * LIGHT, () => (light = 2));
    later(2 * LIGHT + 300, () => {
      phase = 'race';
      startClock();
    });
  }

  onMount(() => {
    countdown();
    frame = requestAnimationFrame(tickClock);
    // Im Hintergrund steht die Uhr; zurück in der App läuft sie weiter, sobald eine Aufgabe offen ist.
    const visibility = () => {
      if (document.hidden) stopClock();
      else if (phase === 'race' && picked === null && since === null) startClock();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => {
      timers.forEach(clearTimeout);
      cancelAnimationFrame(frame);
      document.removeEventListener('visibilitychange', visibility);
    };
  });

  function pick(id: string) {
    if (phase !== 'race' || picked || !task || task.kind !== 'choice') return;
    stopClock();
    picked = id;
    const ok = id === answer;
    const r = recordTask({ mode: task.mode, correct: ok, units: [{ key: task.key, correct: ok }] });
    xp += r.xp;
    if (r.levelUp) levelUp = r.levelUp;
    if (r.goalJustReached) {
      goal = true;
      void reportToWorker(game.save, today());
    }
    answered(ok);
    push = { n: push.n + 1, kind: ok ? 'gas' : 'brake' };
    if (ok) {
      right++;
      mood = 'happy';
    } else {
      mistakes++;
      mood = 'sad';
    }
    clock = spent + mistakes * SPRINT_PENALTY;
    if (right === SPRINT_GOAL) later(650, finish);
    else later(ok ? NEXT_RIGHT : NEXT_WRONG, next);
  }

  function next() {
    picked = null;
    mood = 'idle';
    if (index + 1 >= tasks.length) tasks = [...tasks, ...sprintTasks(game.save, SPRINT_GOAL, Math.random, tasks.at(-1)?.key as WordId)];
    index++;
    startClock();
  }

  function finish() {
    const ms = raceTime(spent, mistakes);
    const levelBefore = levelInfo(game.save.xp).level;
    const goalBefore = goalReached(game.save, today());
    const o = recordSprint(ms);
    const levelAfter = levelInfo(game.save.xp).level;
    if (levelAfter > levelBefore) levelUp = levelAfter;
    if (!goalBefore && goalReached(game.save, today())) goal = true;
    news = takeNews();
    outcome = { ...o, ms };
    clock = ms;
    phase = 'done';
    mood = 'cheer';
    if (levelUp) cue('levelup');
    void reportToWorker(game.save, today());
  }

  function again() {
    timers.forEach(clearTimeout);
    timers = [];
    tasks = sprintTasks(game.save, SPRINT_GOAL * 2);
    index = 0;
    right = 0;
    mistakes = 0;
    picked = null;
    mood = 'idle';
    push = { n: 0, kind: null };
    spent = 0;
    since = null;
    clock = 0;
    xp = 0;
    levelUp = null;
    goal = false;
    news = [];
    outcome = null;
    phase = 'ready';
    countdown();
  }

  function answerState(id: string) {
    if (!picked) return 'idle';
    if (id === answer) return 'right';
    return id === picked ? 'wrong' : 'dim';
  }
</script>

<main
  class="sprint"
  class:grown={!!card}
  style:view-transition-name={card ? 'stage-card' : undefined}
  style:--from={card ? CARD_COLOR[card] : undefined}
  data-phase={phase}
  data-task-kind={task?.kind}
  data-answer={answer}
>
  {#if phase !== 'done'}
    <header class="bar">
      <div
        class="course"
        style:--p={right / SPRINT_GOAL}
        role="progressbar"
        aria-label="Strecke bis ins Ziel"
        aria-valuemin="0"
        aria-valuemax={SPRINT_GOAL}
        aria-valuenow={right}
      >
        <div class="street"><RegionScene region="hanoi" /></div>
        <!-- Zielfahne: rote Flagge mit gelbem Stern -->
        <svg class="flag scene" data-phase="in" viewBox="0 0 40 80" aria-hidden="true">
          <rect x="4" y="6" width="4" height="72" rx="2" fill="var(--nav-bg)" />
          <g class="loop-sway origin-left" style="--t: 1.6s; --rot: 5">
            <path d="M8 8 L38 10 L38 34 L8 32 Z" fill="var(--red)" />
            <path d="M23 13 L25.4 19.2 L32 19.4 L26.8 23.4 L28.7 29.8 L23 26 L17.3 29.8 L19.2 23.4 L14 19.4 L20.6 19.2 Z" fill="var(--yellow)" />
          </g>
        </svg>
        <div class="rider" class:gas={push.kind === 'gas'} class:brake={push.kind === 'brake'}>
          {#key push.n}
            <div class="move">
              {#if push.kind === 'gas'}
                <span class="puff a"></span><span class="puff b"></span><span class="puff c"></span>
              {/if}
              <TrauRide size={88} {mood} />
            </div>
          {/key}
        </div>
      </div>
      <button class="close" onclick={onexit} aria-label="Sprint beenden">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
          ><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" /></svg
        >
      </button>
      <p class="clock" role="timer" aria-label="Zeit">{formatTime(clock)}</p>
      {#key mistakes}
        {#if mistakes > 0 && push.kind === 'brake'}<span class="penalty" aria-hidden="true">+{SPRINT_PENALTY / 1000} s</span>{/if}
      {/key}
      {#if phase === 'ready'}
        <div class="lights" role="status" aria-label={['Rot', 'Gelb', 'Grün – los!'][light]}>
          <span class="lamp red" class:on={light === 0}></span>
          <span class="lamp yellow" class:on={light === 1}></span>
          <span class="lamp green" class:on={light === 2}></span>
        </div>
      {/if}
    </header>

    {#if phase === 'ready'}
      <Card tone="yellow">
        <p class="kicker">Roller-Sprint</p>
        <h1 class="ready-title">{light === 2 ? 'Los!' : 'Gleich geht’s los'}</h1>
        <p>{SPRINT_GOAL} richtige Antworten bis ins Ziel. Jeder Fehler kostet {SPRINT_PENALTY / 1000} Sekunden.</p>
        {#if best !== null}<p class="times">Bestzeit {formatTime(best)}{thisWeek !== null ? ` · diese Woche ${formatTime(thisWeek)}` : ''}</p>{/if}
      </Card>
    {:else if task && task.kind === 'choice'}
      {#key index}
        <div class="task">
          <p class="kicker">{task.mode === 'vn2de' ? 'Was bedeutet das?' : 'Wie sagt man das?'}</p>
          <div class="prompt">
            <h1 lang={task.mode === 'vn2de' ? 'vi' : 'de'} class:long={!big}>{promptText}</h1>
          </div>
          <div class="answers">
            {#each task.options as o (o.id)}
              <Button
                variant="answer"
                state={answerState(o.id)}
                cheer={picked === o.id && o.id === answer}
                dataId={o.id}
                disabled={picked !== null}
                onclick={() => pick(o.id)}
              >
                <span lang={task.mode === 'de2vn' ? 'vi' : 'de'}>{optionText(o, task.mode)}</span>
              </Button>
            {/each}
          </div>
        </div>
      {/key}
    {/if}
  {:else if outcome}
    <section class="result">
      <div class="result-scene">
        <div class="scene-clip"><RegionScene region="hanoi" /></div>
        <div class="mascot"><TrauRide size={136} mood="cheer" /></div>
      </div>
      <Card tone="yellow">
        <p class="kicker">
          {outcome.first ? 'Erste Fahrt' : outcome.best ? 'Neue Bestzeit!' : outcome.week ? 'Bestzeit der Woche!' : 'Im Ziel'}
        </p>
        <h1 class="time">{formatTime(outcome.ms)}</h1>
        <p>{mistakes === 0 ? 'Ohne Fehler.' : `${mistakes} ${mistakes === 1 ? 'Fehler' : 'Fehler'}, +${(mistakes * SPRINT_PENALTY) / 1000} s`}</p>
        <dl class="records">
          <div><dt>Bestzeit</dt><dd>{best !== null ? formatTime(best) : '–'}</dd></div>
          <div><dt>Diese Woche</dt><dd>{thisWeek !== null ? formatTime(thisWeek) : '–'}</dd></div>
        </dl>
        <p class="xp">+{xp} XP</p>
      </Card>
      {#if levelUp}<p class="badge">Level {levelUp} erreicht!</p>{/if}
      {#if goal}<p class="badge">Tagesziel geschafft – deine Serie wächst.</p>{/if}
      <RoundRewards chest={false} {news} />
      <div class="actions">
        <Button onclick={again}>Nochmal fahren</Button>
        <Button variant="ghost" onclick={onexit}>Fertig</Button>
      </div>
    </section>
  {/if}
</main>

<style>
  .sprint {
    min-height: 100dvh;
    padding: calc(var(--safe-top) + 10px) var(--gutter) calc(var(--safe-bottom) + 40px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: var(--paper);
    position: relative;
    isolation: isolate;
    overflow-x: clip;
  }
  /* Aus der Modus-Karte gestartet: Schleier in der Kartenfarbe, der im wachsenden Fenster ausblendet (wie bei Play) */
  .sprint.grown::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 30;
    background: var(--from);
    pointer-events: none;
    animation: grow-veil 420ms ease-out 160ms both;
  }
  @keyframes grow-veil {
    to {
      opacity: 0;
      visibility: hidden;
    }
  }

  /* Strecke: Straße der Altstadt (Szene unten bündig, damit die Fahrbahn zu sehen ist), Trâu fährt zur Zielfahne. */
  .bar {
    position: relative;
  }
  .course {
    --band: 150px;
    --ride: 88px;
    --flag: 40px;
    position: relative;
    height: var(--band);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    background: var(--paper-2);
  }
  /* die vordere Spur gehört Trâu – dort fährt kein Szenen-Roller durch ihn hindurch; Gegenverkehr hinten bleibt */
  .street :global([data-lane='near']) {
    display: none;
  }
  .street :global(svg.scene) {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: auto;
    aspect-ratio: 400 / 260;
  }
  .flag {
    position: absolute;
    right: 10px;
    bottom: 14px;
    width: var(--flag);
    height: 80px;
    overflow: visible;
  }
  .rider {
    position: absolute;
    bottom: 2px;
    left: calc(4px + var(--p) * (100% - var(--ride) - var(--flag) - 18px));
    line-height: 0;
    transition: left var(--dur-slow) var(--ease-spring);
  }
  .move {
    position: relative;
  }
  /* Gas: kurzer Satz nach vorn, Abgaswölkchen hinten; Bremse: kippt zurück und wackelt. */
  .gas .move {
    animation: gas 480ms var(--ease-out);
  }
  .brake .move {
    animation: brake 520ms var(--ease-out);
  }
  @keyframes gas {
    30% {
      transform: translateX(6px) rotate(2deg);
    }
  }
  @keyframes brake {
    20% {
      transform: rotate(-6deg) translateX(-4px);
    }
    45% {
      transform: rotate(3deg);
    }
    70% {
      transform: rotate(-2deg);
    }
  }
  .puff {
    position: absolute;
    left: 2px;
    bottom: 18px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--paper);
    opacity: 0;
    animation: puff 600ms ease-out both;
  }
  .puff.b {
    width: 12px;
    height: 12px;
    bottom: 26px;
    animation-delay: 60ms;
  }
  .puff.c {
    width: 9px;
    height: 9px;
    bottom: 14px;
    animation-delay: 120ms;
  }
  @keyframes puff {
    0% {
      opacity: 0.9;
      transform: translateX(0) scale(0.6);
    }
    100% {
      opacity: 0;
      transform: translateX(-26px) scale(1.4);
    }
  }

  /* Knöpfe und Uhr über der Szene: Glasfläche (--glass), Tap-Ziel 44 px. */
  .close {
    position: absolute;
    top: 8px;
    left: 8px;
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--glass);
    display: grid;
    place-items: center;
    color: var(--ink);
    cursor: pointer;
  }
  .clock {
    position: absolute;
    top: 8px;
    right: 8px;
    min-width: 92px;
    padding: 8px 14px;
    border-radius: var(--radius-pill);
    background: var(--glass);
    color: var(--ink);
    font-size: 20px;
    font-weight: 800;
    text-align: center;
    font-variant-numeric: tabular-nums;
  }
  .penalty {
    position: absolute;
    top: 58px;
    right: 14px;
    padding: 4px 10px;
    border-radius: var(--radius-pill);
    background: var(--red);
    color: var(--on-red);
    font-weight: 800;
    animation: penalty 1000ms var(--ease-out) both;
  }
  @keyframes penalty {
    0% {
      opacity: 0;
      transform: translateY(-10px) scale(0.7);
    }
    15% {
      opacity: 1;
      transform: none;
    }
    80% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
  /* Ampel: drei flache Lichter in dunklem Gehäuse; an ist nur eines */
  .lights {
    position: absolute;
    left: 50%;
    top: 50%;
    translate: -50% -60%;
    display: flex;
    gap: 8px;
    padding: 8px 10px;
    border-radius: 16px;
    background: var(--nav-bg);
  }
  .lamp {
    width: 26px;
    height: 26px;
    border-radius: 50%;
    opacity: 0.25;
    transition: opacity var(--dur-fast) ease-out;
  }
  .lamp.on {
    opacity: 1;
  }
  .lamp.red {
    background: var(--red);
  }
  .lamp.yellow {
    background: var(--yellow);
  }
  .lamp.green {
    background: var(--go);
  }

  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .ready-title {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
    margin: 4px 0 8px;
  }
  .times {
    margin-top: 8px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  /* Aufgabe: knapp, damit es schnell geht – Wort oben, vier Antworten im Raster */
  .task {
    display: flex;
    flex-direction: column;
    gap: 14px;
    animation: task-in 220ms var(--ease-out) both;
  }
  @keyframes task-in {
    from {
      transform: translateX(28px);
      opacity: 0;
    }
  }
  .prompt {
    border-radius: var(--radius-lg);
    padding: 26px 20px;
    display: grid;
    place-items: center;
    text-align: center;
    background: var(--tone-yellow);
    box-shadow: var(--shadow-card);
  }
  .prompt h1 {
    font-size: 40px;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.02em;
    color: var(--ink);
  }
  .prompt h1.long {
    font-size: var(--fs-h2);
  }
  .answers {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  /* Gemessen: das breiteste Wort (Entschuldigung) braucht bei 17 px 130 von 133 px Kachelbreite (375 breit) –
     es bricht nie mitten im Wort; Silbentrennung nur als Netz */
  .answers :global(.btn) {
    height: 100%;
    padding: 12px 14px;
    font-size: 17px;
    overflow-wrap: break-word;
    hyphens: auto;
  }

  /* Ziel */
  .result {
    display: grid;
    gap: 16px;
    padding-top: 10px;
  }
  .result-scene {
    position: relative;
    margin-bottom: 40px;
  }
  .scene-clip {
    aspect-ratio: 400 / 230;
    border-radius: var(--radius-card);
    overflow: hidden;
    box-shadow: var(--shadow-card);
    animation: pop-in 560ms var(--ease-out) both;
  }
  .mascot {
    position: absolute;
    left: 50%;
    bottom: -48px;
    translate: -50% 0;
    z-index: 1;
    line-height: 0;
  }
  .result > :global(.card) {
    animation: pop-in 520ms var(--ease-spring) 240ms both;
  }
  .result > .badge,
  .result > :global(.news),
  .result > .actions {
    animation: rise-in 480ms var(--ease-out) 420ms both;
  }
  @keyframes pop-in {
    from {
      transform: scale(0.85) translateY(24px);
      opacity: 0;
    }
  }
  @keyframes rise-in {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
  }
  .time {
    font-size: 48px;
    font-weight: 800;
    line-height: 1.05;
    margin: 4px 0 6px;
    font-variant-numeric: tabular-nums;
  }
  .records {
    display: flex;
    gap: 24px;
    margin: 12px 0 4px;
  }
  .records dt {
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-muted);
  }
  .records dd {
    margin: 0;
    font-size: 20px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .xp {
    font-size: 22px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .badge {
    background: var(--surface);
    border-radius: 20px;
    padding: 14px 18px;
    font-weight: 600;
    box-shadow: var(--shadow-card);
  }
  .actions {
    display: grid;
    gap: 10px;
    margin-top: 10px;
  }

  @media (max-height: 700px) {
    .course {
      --band: 118px;
      --ride: 76px;
      --flag: 27px;
    }
    /* kleiner und tiefer, damit die Uhr sie nicht verdeckt */
    .flag {
      height: 54px;
      bottom: 8px;
    }
    /* kleinerer Roller: per scale (die Größe im SVG bleibt), unten links verankert */
    .rider {
      scale: calc(76 / 88);
      transform-origin: 0 100%;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .sprint.grown::before {
      display: none;
    }
    .gas .move,
    .brake .move,
    .task,
    .puff,
    .penalty {
      animation: none;
    }
    .puff {
      display: none;
    }
  }
</style>
