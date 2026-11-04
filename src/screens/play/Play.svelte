<script lang="ts" module>
  import type { Stage } from '../../content/types';

  export type PlayMode = { kind: 'stage'; stage: Stage } | { kind: 'boss'; stage: Stage } | { kind: 'training'; verbsOnly: boolean };
</script>

<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { Tween } from 'svelte/motion';
  import Button from '../../lib/components/Button.svelte';
  import Card from '../../lib/components/Card.svelte';
  import RegionScene from '../../lib/illustrations/RegionScene.svelte';
  import Buffalo from '../../lib/mascot/Buffalo.svelte';
  import { play } from '../../lib/audio/player';
  import { game, recordAnswer, recordBossWin, recordSeen, today } from '../../lib/game.svelte';
  import { bossReady, currentStage } from '../../lib/logic/path';
  import { reducedMotion } from '../../lib/motion';
  import { XP_PER_CORRECT } from '../../lib/logic/rewards';
  import {
    answerOf,
    BOSS_LIVES,
    buildBossSession,
    buildStageSession,
    buildTrainingBatch,
    optionText,
    type Task,
  } from '../../lib/logic/session';
  import { reportToWorker } from '../../lib/push.svelte';
  import ChoiceView, { type Opt } from './ChoiceView.svelte';
  import IntroCard from './IntroCard.svelte';
  import ListenView from './ListenView.svelte';

  let { mode, onexit, onboss }: { mode: PlayMode; onexit: () => void; onboss: (stage: Stage) => void } = $props();

  function build(): Task[] {
    if (mode.kind === 'stage') return buildStageSession(mode.stage, game.save, today());
    if (mode.kind === 'boss') return buildBossSession(mode.stage, game.save);
    return buildTrainingBatch(game.save, today(), mode.verbsOnly);
  }

  // Aufgaben enthalten nur unveränderliche Inhaltsobjekte → kein tiefes $state nötig.
  let tasks = $state.raw<Task[]>(build());
  let index = $state(0);
  let picked = $state<string | null>(null);
  let lives = $state(BOSS_LIVES);
  let round = $state({ right: 0, wrong: 0, xp: 0, levelUp: null as number | null, goal: false });
  let outcome = $state<null | 'done' | 'won' | 'lost'>(null);

  const task = $derived(tasks[index]);
  const answer = $derived(task ? answerOf(task) : null);
  const correct = $derived(picked !== null && picked === answer);
  const total = $derived(mode.kind === 'training' ? 12 : tasks.length);
  const position = $derived(mode.kind === 'training' ? index % 12 : index);

  // Ergebnis wie die Bestätigung im Vorbild: der Ort baut sich auf, der Büffel jubelt davor, die XP zählen hoch.
  const resultRegion = $derived(mode.kind === 'training' ? currentStage(game.save).region : mode.stage.region);
  const xpShown = new Tween(0, { duration: 1100, delay: 380, easing: cubicOut });

  function options(t: Task): Opt[] {
    if (t.kind === 'role') return t.options.map((w) => ({ id: w.id, text: w.vn, vi: true }));
    if (t.kind !== 'choice') return [];
    return t.options.map((o) => ({ id: o.id, text: optionText(o, t.mode), vi: t.mode === 'de2vn' }));
  }

  /** „vn – de“ der Lösung für die Rückmeldung. */
  function solution(t: Task): string {
    if (t.kind === 'choice') return `${t.item.vn} – ${t.item.de}`;
    if (t.kind === 'role') return `${t.answer.vn} – ${t.answer.de}`;
    return '';
  }

  function pick(id: string) {
    if (!task || picked || task.kind === 'intro') return;
    picked = id;
    const ok = id === answer;
    const result = recordAnswer(task.key, ok);
    if (ok) {
      round.right++;
      round.xp += XP_PER_CORRECT;
    } else {
      round.wrong++;
      if (mode.kind === 'boss') lives--;
    }
    if (result.levelUp) round.levelUp = result.levelUp;
    if (result.goalJustReached) {
      round.goal = true;
      void reportToWorker(game.save, today());
    }
    // Nach der Antwort die Lösung hören (Hör-Aufgaben haben sie schon gespielt).
    if (!(task.kind === 'choice' && task.mode === 'listen')) play(answer!).catch(() => {});
  }

  function finish(result: 'done' | 'won' | 'lost') {
    if (result === 'won' && mode.kind === 'boss') recordBossWin(mode.stage.id, lives);
    outcome = result;
    void xpShown.set(round.xp, reducedMotion() ? { duration: 0, delay: 0 } : undefined);
    void reportToWorker(game.save, today());
  }

  function next() {
    if (task?.kind === 'intro') recordSeen(task.key);
    picked = null;
    if (mode.kind === 'boss' && lives <= 0) return finish('lost');
    if (index + 1 < tasks.length) return void index++;
    if (mode.kind === 'training') {
      tasks = [...tasks, ...build()];
      return void index++;
    }
    finish(mode.kind === 'boss' ? 'won' : 'done');
  }

  /** Weiterspielen bzw. Boss erneut: neue Runde mit frischem Stand. */
  function again() {
    tasks = build();
    index = 0;
    picked = null;
    lives = BOSS_LIVES;
    round = { right: 0, wrong: 0, xp: 0, levelUp: null, goal: false };
    void xpShown.set(0, { duration: 0, delay: 0 });
    outcome = null;
  }

  function close() {
    if (mode.kind === 'training' && round.right + round.wrong > 0) return finish('done');
    onexit();
  }
</script>

<main class="play" data-task-kind={task?.kind} data-answer={answer} data-outcome={outcome}>
  {#if outcome}
    <section class="result">
      <div class="result-scene">
        <div class="scene-clip"><RegionScene region={resultRegion} /></div>
        <div class="mascot"><Buffalo size={130} mood={outcome === 'lost' ? 'sad' : 'cheer'} /></div>
      </div>
      {#if outcome === 'won'}
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
          <p class="kicker">{mode.kind === 'training' ? 'Training beendet' : 'Runde geschafft'}</p>
          <h1>{round.right} von {round.right + round.wrong} richtig</h1>
          <p class="xp">+{Math.round(xpShown.current)} XP</p>
        </Card>
      {/if}

      {#if round.levelUp}<p class="badge">Level {round.levelUp} erreicht!</p>{/if}
      {#if round.goal}<p class="badge">Tagesziel geschafft – deine Serie wächst.</p>{/if}

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
        {/if}
        <Button variant="ghost" onclick={onexit}>Fertig</Button>
      </div>
    </section>
  {:else if task}
    <header class="bar">
      <button class="close" onclick={close} aria-label={mode.kind === 'training' ? 'Training beenden' : 'Session verlassen'}>
        <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"
          ><path d="m6.4 5 5.6 5.6L17.6 5 19 6.4 13.4 12l5.6 5.6-1.4 1.4-5.6-5.6L6.4 19 5 17.6l5.6-5.6L5 6.4z" fill="currentColor" /></svg
        >
      </button>
      <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax={total} aria-valuenow={position}>
        <div class="fill" style:width="{(position / total) * 100}%"></div>
      </div>
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

    {#if mode.kind === 'boss' && index === 0 && !picked}
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

    {#if picked}
      <footer class="feedback" class:ok={correct} role="status">
        <div class="verdict-row">
          <Buffalo size={64} mood={correct ? 'happy' : 'sad'} />
          <div>
            <p class="verdict">{correct ? 'Richtig!' : 'Nicht ganz.'}</p>
            <p class="solution" lang="vi">{solution(task)}</p>
          </div>
        </div>
        <Button variant={correct ? 'secondary' : 'primary'} onclick={next}>Weiter</Button>
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
  }
  .bar {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .close {
    width: var(--tap);
    height: var(--tap);
    margin-left: -10px;
    border: 0;
    background: transparent;
    display: grid;
    place-items: center;
    color: inherit;
    opacity: 0.7;
    cursor: pointer;
  }
  .progress {
    flex: 1;
    height: 14px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--sea);
    border-radius: 999px;
    transition: width var(--dur) var(--ease-out);
  }
  .lives {
    display: flex;
    gap: 2px;
    color: var(--red);
  }
  .lives .lost {
    color: var(--paper-2);
  }
  .boss-title {
    font-weight: 800;
    color: var(--red-deep);
  }
  .feedback {
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    padding: 18px var(--gutter) calc(var(--safe-bottom) + 18px);
    background: var(--bad-soft);
    color: var(--ink);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    display: grid;
    gap: 8px;
    animation: rise var(--dur) var(--ease-out);
    z-index: 5;
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
  .verdict-row {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: -6px 0 6px -6px;
  }
  .verdict {
    font-weight: 800;
    font-size: 20px;
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
    background: #fff;
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
