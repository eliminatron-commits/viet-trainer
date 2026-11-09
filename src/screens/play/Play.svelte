<script lang="ts" module>
  import type { Stage } from '../../content/types';
  import type { TrainingFocus } from '../../lib/logic/session';

  export type PlayMode =
    | { kind: 'stage'; stage: Stage }
    | { kind: 'boss'; stage: Stage }
    /** water: Gießrunde – nur die durstigen Einheiten, endet, wenn alle gegossen sind. */
    | { kind: 'training'; verbsOnly: boolean; focus: TrainingFocus; water?: boolean };
</script>

<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import Button from '../../lib/components/Button.svelte';
  import { openLookup, type LookupView } from '../../lib/lookup/lookup.svelte';
  import { ripple } from '../../lib/ripple';
  import Card from '../../lib/components/Card.svelte';
  import RegionScene from '../../lib/illustrations/RegionScene.svelte';
  import Trau from '../../lib/mascot/Trau.svelte';
  import { play } from '../../lib/audio/player';
  import { answered, cue } from '../../lib/feedback';
  import {
    game,
    recordBossLoss,
    recordBossWin,
    recordRoundEnd,
    recordSeen,
    recordTask,
    takeNews,
    today,
    type News,
  } from '../../lib/game.svelte';
  import { bossReady, currentStage, isDone } from '../../lib/logic/path';
  import { goalReached, levelInfo } from '../../lib/logic/rewards';
  import { nextRegion, tripAfterWin } from '../../lib/logic/trip';
  import { content } from '../../content';
  import type { RegionId } from '../../content/types';
  import type { ProgressKey } from '../../lib/storage/state';
  import type { TaskMode } from '../../lib/logic/stats';
  import { reducedMotion } from '../../lib/motion';
  import {
    answerOf,
    BOSS_LIVES,
    buildBossSession,
    buildStageSession,
    buildTrainingBatch,
    buildWateringBatch,
    optionText,
    thirstyKeys,
    type Task,
  } from '../../lib/logic/session';
  import { reportToWorker } from '../../lib/push.svelte';
  import BuildView from './BuildView.svelte';
  import ChoiceView, { type Opt } from './ChoiceView.svelte';
  import GapView from './GapView.svelte';
  import IntroCard from './IntroCard.svelte';
  import Journey from './Journey.svelte';
  import ListenView from './ListenView.svelte';
  import PairsView, { type PairsResult } from './PairsView.svelte';
  import RoundRewards from './RoundRewards.svelte';
  import type { CardTone } from '../training/ModeCarousel.svelte';

  /**
   * `card`: aus dieser Modus-Karte gestartet – die Ansicht ist das Gegenstück der wachsenden Karte (stage-card) und
   * geht in deren Farbe auf: ein Schleier in der Kartenfarbe blendet aus und gibt die Übung frei.
   */
  /** `ontrip`: nach dem Boss, der eine Region abschließt, fährt Trâu zur nächsten (Reise, components/Trip.svelte). */
  let {
    mode,
    card,
    onexit,
    onboss,
    ontrip,
  }: { mode: PlayMode; card?: CardTone; onexit: () => void; onboss: (stage: Stage) => void; ontrip: (from: RegionId) => void } = $props();
  const CARD_COLOR: Record<CardTone, string> = { lantern: 'var(--lantern)', yellow: 'var(--tone-yellow)', sea: 'var(--sea)', lotus: 'var(--lotus)' };

  /** Gießrunde läuft (nach dem Gießen geht es auf Wunsch als gewöhnliches Training weiter). */
  const startsWatering = () => mode.kind === 'training' && mode.water === true;
  let watering = $state(startsWatering());

  function build(): Task[] {
    if (mode.kind === 'stage') return buildStageSession(mode.stage, game.save, today());
    if (mode.kind === 'boss') return buildBossSession(mode.stage, game.save);
    if (watering) return buildWateringBatch(game.save, today(), mode.verbsOnly);
    return buildTrainingBatch(game.save, today(), mode.verbsOnly, Math.random, mode.focus);
  }

  // Aufgaben enthalten nur unveränderliche Inhaltsobjekte → kein tiefes $state nötig.
  const first = build();
  let tasks = $state.raw<Task[]>(first);
  // Training: Block, in dem der Fortschrittsbalken gerade läuft (Blöcke werden hinten angehängt).
  let blockStart = $state(0);
  let blockLen = $state(first.length);
  let index = $state(0);
  /** Gewählte Option bei Auswahl-Aufgaben (Auswahl, Rolle, Ton-Ninja). */
  let picked = $state<string | null>(null);
  /** Aufgelöst: Ergebnis und Lösungstext für die Rückmeldungsleiste. */
  let resolved = $state<null | { correct: boolean; text: string; vi: boolean }>(null);
  let lives = $state(BOSS_LIVES);
  /** trip: dieser Boss-Sieg hat diese Region abgeschlossen – die Reise zur nächsten steht an. */
  const freshRound = () => ({
    right: 0,
    wrong: 0,
    xp: 0,
    levelUp: null as number | null,
    goal: false,
    chest: false,
    trip: null as RegionId | null,
    news: [] as News[],
  });
  const regionName = (id: RegionId | null) => content.regions.find((r) => r.id === id)?.name ?? '';
  let round = $state(freshRound());
  let outcome = $state<null | 'done' | 'won' | 'lost'>(null);

  const task = $derived(tasks[index]);
  /** Nach der Antwort: was die Satzlupe bzw. Wortkarte zeigt (Paare haben mehrere Wörter, Einführung ist selbst eine). */
  const lens = $derived.by((): LookupView | null => {
    if (!task) return null;
    if (task.kind === 'choice') return 'words' in task.item ? { kind: 'sentence', id: task.item.id } : { kind: 'word', id: task.item.id };
    if (task.kind === 'build' || task.kind === 'gap') return { kind: 'sentence', id: task.item.id };
    if (task.kind === 'tone' || task.kind === 'twins') return { kind: 'word', id: task.word.id };
    if (task.kind === 'role') return { kind: 'word', id: task.answer.id };
    return null;
  });
  const answer = $derived(task ? answerOf(task) : null);
  const correct = $derived(resolved?.correct ?? false);
  const total = $derived(mode.kind === 'training' ? blockLen : tasks.length);
  const position = $derived(mode.kind === 'training' ? index - blockStart : index);

  // Ergebnis wie die Bestätigung im Vorbild: der Ort baut sich auf, der Büffel jubelt davor, die XP zählen hoch.
  const resultRegion = $derived(mode.kind === 'training' ? currentStage(game.save).region : mode.stage.region);
  const xpShown = new Tween(0, { duration: 1100, delay: 380, easing: cubicOut });

  function options(t: Task): Opt[] {
    if (t.kind === 'role') return t.options.map((w) => ({ id: w.id, text: w.vn, vi: true }));
    if (t.kind !== 'choice') return [];
    return t.options.map((o) => ({ id: o.id, text: optionText(o, t.mode), vi: t.mode === 'de2vn' }));
  }

  function toneOptions(t: Extract<Task, { kind: 'tone' }>): Opt[] {
    return t.options.map((o) => ({ id: o.id, text: o.vn, vi: true }));
  }

  /** Ton-Zwillinge: Bedeutungen zur Wahl, nach der Antwort steht die Schreibung daneben. */
  function twinOptions(t: Extract<Task, { kind: 'twins' }>): Opt[] {
    return t.options.map((w) => ({ id: w.id, text: w.de, vi: false, spell: w.vn.trim() }));
  }

  /** Buchungsart der Aufgabe (Statistik für Achievements und Challenges). */
  const modeOf = (t: Exclude<Task, { kind: 'intro' }>): TaskMode =>
    t.kind === 'choice' || t.kind === 'build' ? t.mode : t.kind;

  /** „vn – de“ der Lösung für die Rückmeldung. */
  function solution(t: Task): string {
    if (t.kind === 'choice' || t.kind === 'build' || t.kind === 'gap') return `${t.item.vn} – ${t.item.de}`;
    if (t.kind === 'role') return `${t.answer.vn} – ${t.answer.de}`;
    if (t.kind === 'tone' || t.kind === 'twins') return `${t.word.vn} – ${t.word.de}`;
    return '';
  }

  /**
   * Eine Aufgabe auflösen: buchen, Klang + Haptik, Boss-Leben, Rückmeldungsleiste, danach das Lösungs-Audio
   * (nur wo die Aufgabe die Lösung nicht schon gespielt hat: `audio`).
   */
  function settle(ok: boolean, units: { key: ProgressKey; correct: boolean }[], text: string, vi: boolean, audio?: string) {
    if (!task || resolved || task.kind === 'intro') return;
    const result = recordTask({ mode: modeOf(task), correct: ok, units });
    resolved = { correct: ok, text, vi };
    round.xp += result.xp;
    // Paare lösen sich verzögert auf (außerhalb der Geste); ihren Haptik-Tick gibt PairsView beim Tippen.
    answered(ok, task.kind !== 'pairs');
    if (ok) {
      round.right++;
    } else {
      round.wrong++;
      if (mode.kind === 'boss') lives--;
    }
    if (result.levelUp) round.levelUp = result.levelUp;
    if (result.goalJustReached) {
      round.goal = true;
      void reportToWorker(game.save, today());
    }
    // Nach der Antwort die Lösung hören – kurz nach dem Klang.
    if (audio) {
      const at = index;
      setTimeout(() => at === index && play(audio).catch(() => {}), 180);
    }
  }

  /** Auswahl, Rolle, Ton-Ninja, Ton-Zwillinge und Lückensatz: gewählte Option. */
  function pick(id: string) {
    if (!task || picked || task.kind === 'intro' || task.kind === 'pairs' || task.kind === 'build') return;
    picked = id;
    const ok = id === answer;
    const listens = task.kind === 'tone' || task.kind === 'twins' || (task.kind === 'choice' && task.mode === 'listen');
    // Lückensatz: danach der ganze Satz; Hör-Aufgaben haben die Lösung schon gespielt.
    const audio = task.kind === 'gap' ? task.item.id : listens ? undefined : answer!;
    settle(ok, [{ key: task.key, correct: ok }], solution(task), true, audio);
  }

  function onBuild(ok: boolean) {
    if (task?.kind !== 'build') return;
    settle(ok, [{ key: task.key, correct: ok }], solution(task), true, task.mode === 'build' ? task.item.id : undefined);
  }

  function onPairs(r: PairsResult) {
    if (task?.kind !== 'pairs') return;
    const n = task.words.length;
    const text = r.correct
      ? r.clean.length === n
        ? 'Alle Paare ohne Fehler.'
        : `Alle Paare gefunden, ${r.clean.length} von ${n} ohne Fehler.`
      : `Zeit abgelaufen – ${r.found} von ${n} Paaren gefunden.`;
    settle(r.correct, task.words.map((w) => ({ key: w.id, correct: r.clean.includes(w.id) })), text, false);
  }

  function finish(result: 'done' | 'won' | 'lost') {
    // Challenges am Rundenende können XP bringen – Level und Tagesziel davor und danach vergleichen.
    const levelBefore = levelInfo(game.save.xp).level;
    const goalBefore = goalReached(game.save, today());
    if (result === 'won' && mode.kind === 'boss') {
      const firstWin = !isDone(game.save, mode.stage.id);
      round.chest = recordBossWin(mode.stage.id, lives, BOSS_LIVES);
      round.trip = tripAfterWin(game.save, mode.stage, firstWin);
    } else if (result === 'lost') recordBossLoss();
    else recordRoundEnd();
    const levelAfter = levelInfo(game.save.xp).level;
    if (levelAfter > levelBefore) round.levelUp = levelAfter;
    if (!goalBefore && goalReached(game.save, today())) round.goal = true;
    // Was in der Runde neu erreicht wurde, zeigt das Ergebnis (außerhalb der Session käme es als Toast).
    round.news = takeNews();
    outcome = result;
    if (round.levelUp) cue('levelup');
    void xpShown.set(round.xp, reducedMotion() ? { duration: 0, delay: 0 } : undefined);
    void reportToWorker(game.save, today());
  }

  function next() {
    if (task?.kind === 'intro') recordSeen(task.key);
    picked = null;
    resolved = null;
    if (mode.kind === 'boss' && lives <= 0) return finish('lost');
    if (index + 1 < tasks.length) return void index++;
    if (mode.kind === 'training') {
      const more = build();
      if (more.length === 0) return finish('done');
      blockStart = tasks.length;
      blockLen = more.length;
      tasks = [...tasks, ...more];
      return void index++;
    }
    finish(mode.kind === 'boss' ? 'won' : 'done');
  }

  /** Weiterspielen bzw. Boss erneut: neue Runde mit frischem Stand. */
  function again() {
    tasks = build();
    blockStart = 0;
    blockLen = tasks.length;
    index = 0;
    picked = null;
    resolved = null;
    lives = BOSS_LIVES;
    round = freshRound();
    void xpShown.set(0, { duration: 0, delay: 0 });
    outcome = null;
  }

  /** Nach der Gießrunde: weiter als gewöhnliches Training (fällige zuerst, dann die schwächsten). */
  function keepTraining() {
    watering = false;
    again();
  }

  /** Durstige Pflanzen, die nach der Gießrunde noch übrig sind (beim Schließen vor dem Ende). */
  const stillThirsty = $derived(
    outcome && watering && mode.kind === 'training' ? thirstyKeys(game.save, today(), mode.verbsOnly).length : 0,
  );

  function close() {
    if (mode.kind === 'training' && round.right + round.wrong > 0) return finish('done');
    onexit();
  }
</script>

<main
  class="play"
  class:grown={!!card}
  style:view-transition-name={card ? 'stage-card' : undefined}
  style:--from={card ? CARD_COLOR[card] : undefined}
  data-mode={mode.kind}
  data-focus={mode.kind === 'training' ? (mode.water ? 'water' : mode.focus) : undefined}
  data-task-kind={task?.kind} data-answer={answer} data-outcome={outcome}>
  {#if outcome}
    <section class="result">
      <div class="result-scene">
        <div class="scene-clip"><RegionScene region={resultRegion} /></div>
        <div class="mascot"><Trau size={130} mood={outcome === 'lost' ? 'sad' : 'cheer'} /></div>
      </div>
      {#if outcome === 'won' && round.trip}
        <Card tone="yellow">
          <p class="kicker">Boss besiegt</p>
          <h1><span lang="vi">{regionName(round.trip)}</span> geschafft!</h1>
          <p>{lives} von {BOSS_LIVES} Leben übrig. Trâu reist weiter nach <span lang="vi">{regionName(nextRegion(round.trip))}</span>.</p>
        </Card>
      {:else if outcome === 'won'}
        <Card tone="yellow">
          <p class="kicker">Boss besiegt</p>
          <h1>Etappe geschafft!</h1>
          <p>{lives} von {BOSS_LIVES} Leben übrig. Die nächste Etappe ist frei.</p>
        </Card>
      {:else if outcome === 'lost'}
        <Card tone="lotus">
          <p class="kicker">Keine Leben mehr</p>
          <h1>Knapp daneben.</h1>
          <p>Übe die Etappe noch eine Runde und versuch es dann wieder.</p>
        </Card>
      {:else}
        <Card tone="sea">
          <p class="kicker">
            {watering ? (stillThirsty ? 'Gießen unterbrochen' : 'Feld gegossen') : mode.kind === 'training' ? 'Training beendet' : 'Runde geschafft'}
          </p>
          <h1>{round.right} von {round.right + round.wrong} richtig</h1>
          <p class="xp">+{Math.round(xpShown.current)} XP</p>
        </Card>
      {/if}

      {#if round.levelUp}<p class="badge">Level {round.levelUp} erreicht!</p>{/if}
      {#if round.goal}<p class="badge">Tagesziel geschafft – deine Serie wächst.</p>{/if}
      <RoundRewards chest={round.chest} news={round.news} />

      <div class="actions">
        {#if mode.kind === 'stage'}
          {#if bossReady(game.save, mode.stage.id) && !game.save.stages[mode.stage.id]?.done}
            <Button onclick={() => onboss((mode as { stage: Stage }).stage)}>Zum Bosskampf</Button>
            <Button variant="secondary" onclick={again}>Weiterspielen</Button>
          {:else}
            <Button onclick={again}>Weiterspielen</Button>
          {/if}
        {:else if outcome === 'lost'}
          <Button onclick={again}>Nochmal kämpfen</Button>
        {:else if watering && stillThirsty}
          <Button onclick={again}>Weiter gießen</Button>
        {:else if watering}
          <Button onclick={keepTraining}>Weiter trainieren</Button>
        {/if}
        {#if round.trip}
          {@const from = round.trip}
          <Button onclick={() => ontrip(from)}>Mit dem Zug nach <span lang="vi">{regionName(nextRegion(from))}</span></Button>
        {:else}
          <Button variant="ghost" onclick={onexit}>Fertig</Button>
        {/if}
      </div>
    </section>
  {:else if task}
    <!-- Die Runde als Reise; Schließen und Leben liegen als Glasknöpfe auf der Szene. Neuer Trainingsblock = neue Reise. -->
    <header class="bar">
      {#key blockStart}
        <Journey
          region={resultRegion}
          done={position + (resolved ? 1 : 0)}
          {position}
          {total}
          mood={resolved ? (correct ? 'happy' : 'sad') : 'idle'}
        />
      {/key}
      <button class="close" onclick={close} aria-label={mode.kind === 'training' ? 'Training beenden' : 'Session verlassen'}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"
          ><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" /></svg
        >
      </button>
      {#if mode.kind === 'boss'}
        <div class="lives" role="img" aria-label="{lives} von {BOSS_LIVES} Leben">
          {#each { length: BOSS_LIVES } as _, i (i)}
            <svg viewBox="0 0 24 24" width="22" height="22" class:lost={i >= lives} aria-hidden="true"
              ><path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z" fill="currentColor" /></svg
            >
          {/each}
        </div>
      {/if}
    </header>

    {#if mode.kind === 'boss' && index === 0 && !resolved}
      <p class="boss-title">Bosskampf · {mode.stage.title}</p>
    {/if}

    {#key index}
      <div class="task">
      {#if task.kind === 'intro'}
        <IntroCard word={task.word} onnext={next} />
      {:else if task.kind === 'role'}
        <ChoiceView
          kicker="Du sprichst mit …"
          prompt={task.role.label}
          promptVi={false}
          question={task.mode === 'self' ? 'Wie sagst du „ich“?' : 'Wie sagst du „du“?'}
          tone="sea"
          options={options(task)}
          answerId={answer!}
          {picked}
          onpick={pick}
        />
      {:else if task.kind === 'pairs'}
        <PairsView {task} onresult={onPairs} />
      {:else if task.kind === 'build'}
        <BuildView {task} done={resolved !== null} onresult={onBuild} />
      {:else if task.kind === 'gap'}
        <GapView {task} {picked} onpick={pick} />
      {:else if task.kind === 'tone'}
        <ListenView
          kicker="Ton-Ninja: Was hörst du?"
          audioId={task.word.id}
          reveal={task.word.vn}
          options={toneOptions(task)}
          answerId={answer!}
          {picked}
          onpick={pick}
        />
      {:else if task.kind === 'twins'}
        <ListenView
          kicker="Ton-Zwillinge: Was bedeutet das?"
          audioId={task.word.id}
          reveal={task.word.vn}
          options={twinOptions(task)}
          answerId={answer!}
          {picked}
          onpick={pick}
        />
      {:else if task.mode === 'listen'}
        <ListenView audioId={task.item.id} reveal={task.item.vn} options={options(task)} answerId={answer!} {picked} onpick={pick} />
      {:else if task.mode === 'vn2de'}
        <ChoiceView
          kicker={'kind' in task.item && task.item.kind === 'particle' ? 'Wofür steht das?' : 'Was bedeutet das?'}
          prompt={task.item.vn}
          promptVi={true}
          pron={'pron' in task.item ? task.item.pron : undefined}
          audioId={task.item.id}
          autoplay
          tone="lotus"
          options={options(task)}
          answerId={answer!}
          {picked}
          onpick={pick}
        />
      {:else}
        <ChoiceView
          kicker="Wie sagt man das?"
          prompt={task.item.de}
          promptVi={false}
          tone="lantern"
          options={options(task)}
          answerId={answer!}
          {picked}
          onpick={pick}
        />
      {/if}
      </div>
    {/key}

    {#if resolved}
      <footer class="feedback" class:ok={correct} role="status">
        <span class="fb-trau"><Trau size={52} mood={correct ? 'happy' : 'sad'} /></span>
        <p class="verdict">{correct ? 'Richtig!' : 'Nicht ganz.'}</p>
        <p class="solution" lang={resolved.vi ? 'vi' : 'de'}>{resolved.text}</p>
        {#if lens}
          <button class="lens" onclick={() => openLookup(lens)} use:ripple>
            <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"
              ><path d="M10.5 3a7.5 7.5 0 0 1 5.9 12.1l4.8 4.8-1.4 1.4-4.8-4.8A7.5 7.5 0 1 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" fill="currentColor" /></svg
            >{lens.kind === 'sentence' ? 'Wort für Wort' : 'Zum Wort'}
          </button>
        {/if}
        <div class="go" class:wide={!lens}>
          <Button variant={correct ? 'secondary' : 'primary'} onclick={next}>Weiter</Button>
        </div>
      </footer>
    {/if}
  {:else}
    <section class="result">
      <Card tone="paper">
        <h1>Noch nichts zu üben</h1>
        <p>Lerne zuerst ein paar Wörter im Lernpfad.</p>
      </Card>
      <Button variant="ghost" onclick={onexit}>Zurück</Button>
    </section>
  {/if}
</main>

<style>
  .play {
    min-height: 100dvh;
    padding: calc(var(--safe-top) + 10px) var(--gutter) calc(var(--safe-bottom) + 200px);
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: var(--paper);
    position: relative;
    isolation: isolate;
    /* Sternenregen nahe am Rand darf nicht seitlich scrollbar machen */
    overflow-x: clip;
  }
  /* Aus einer Modus-Karte gestartet: Schleier in der Kartenfarbe, der im wachsenden Fenster ausblendet */
  .play.grown::before {
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
  @media (prefers-reduced-motion: reduce) {
    .play.grown::before {
      display: none;
    }
  }
  .bar {
    position: relative;
  }
  /* Knöpfe über der Szene: Glasfläche (--glass), Tap-Ziel 44 px. */
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
  .lives {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 2px;
    padding: 7px 10px;
    border-radius: var(--radius-pill);
    background: var(--glass);
    color: var(--red);
  }
  .lives .lost {
    color: var(--ink-3);
    opacity: 0.45;
  }
  .boss-title {
    font-weight: 800;
    color: var(--bad-ink);
  }
  /* Rückmeldung nach der Antwort – kompakt, damit sie möglichst keine Antwortkachel deckt (P6-10, gemessen bei
     375×667 und 440×956): Trâu links neben Urteil und Lösung, darunter Lupe und „Weiter“ nebeneinander. */
  .feedback {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 12px var(--gutter) calc(var(--safe-bottom) + 12px);
    background: var(--bad-soft);
    color: var(--ink);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    display: grid;
    grid-template-columns: 52px auto minmax(0, 1fr);
    column-gap: 10px;
    row-gap: 6px;
    align-items: center;
    animation: rise var(--dur) var(--ease-out);
    z-index: 5;
  }
  .fb-trau {
    grid-row: 1 / 3;
    grid-column: 1;
    display: flex;
  }
  .verdict,
  .solution {
    grid-column: 2 / 4;
    min-width: 0;
  }
  .lens {
    grid-row: 3;
    grid-column: 1 / 3;
    justify-self: start;
  }
  .go {
    grid-row: 3;
    grid-column: 3;
  }
  .go.wide {
    grid-column: 1 / -1;
  }
  .feedback.ok {
    background: var(--ok-soft);
  }
  /* Neue Aufgabe gleitet von rechts herein, die Antworten folgen einen Takt später. */
  .task {
    display: flex;
    flex-direction: column;
    gap: 16px;
    animation: task-in 420ms var(--ease-out) both;
  }
  .task :global(.answers),
  .task :global(.next) {
    animation: answers-in 460ms var(--ease-out) 90ms both;
  }
  @keyframes task-in {
    from {
      transform: translateX(48px);
      opacity: 0;
    }
  }
  @keyframes answers-in {
    from {
      transform: translateY(28px);
      opacity: 0;
    }
  }
  .verdict {
    font-weight: 800;
    font-size: 20px;
  }
  /* Satzlupe bzw. Wortkarte zur gerade gelösten Aufgabe */
  .lens {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: var(--tap);
    padding: 0 14px 0 12px;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--glass);
    color: var(--ink);
    font: inherit;
    font-size: var(--fs-small);
    font-weight: 700;
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .lens:active {
    transform: scale(0.95);
  }
  .solution {
    font-weight: 600;
  }
  .result {
    display: grid;
    gap: 16px;
    padding-top: 10px;
  }
  .result-scene {
    position: relative;
    margin-bottom: 30px;
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
    bottom: -52px;
    translate: -50% 0;
    z-index: 1;
  }
  .result > :global(.card) {
    animation: pop-in 520ms var(--ease-spring) 240ms both;
  }
  .result > .badge,
  .result > :global(.chest-card),
  .result > :global(.news),
  .result > .actions {
    animation: rise-in 480ms var(--ease-out) 420ms both;
  }
  .result > .actions {
    animation-delay: 520ms;
  }
  @keyframes rise-in {
    from {
      transform: translateY(24px);
      opacity: 0;
    }
  }
  .xp {
    font-size: 22px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  @keyframes pop-in {
    from {
      transform: scale(0.85) translateY(24px);
      opacity: 0;
    }
  }
  .result h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
    margin: 4px 0 8px;
  }
  .kicker {
    font-weight: 600;
    font-size: var(--fs-small);
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
  @keyframes rise {
    from {
      transform: translateY(100%);
    }
  }
</style>
