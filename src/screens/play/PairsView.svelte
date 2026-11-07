<script lang="ts" module>
  export interface PairsResult {
    /** Alle Paare vor Ablauf der Zeit gefunden. */
    correct: boolean;
    /** Wörter, die ohne Fehlversuch (auf beiden Seiten) gepaart wurden. */
    clean: string[];
    /** Gepaarte Wörter insgesamt. */
    found: number;
  }
</script>

<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../../lib/components/Button.svelte';
  import { tick } from '../../lib/feedback';
  import { shuffle, type Task } from '../../lib/logic/session';
  import { reducedMotion } from '../../lib/motion';

  /** Paare unter Zeitdruck: links vietnamesisch, rechts deutsch; je eine Kachel pro Seite tippen. */
  let { task, onresult }: { task: Extract<Task, { kind: 'pairs' }>; onresult: (r: PairsResult) => void } = $props();

  // Pro Aufgabe wird die Ansicht neu aufgebaut ({#key} in Play) – die Reihenfolge bleibt danach fest.
  const columns = $derived({
    vn: shuffle(task.words, Math.random),
    de: shuffle(task.words, Math.random),
  });
  const total = $derived(task.words.length);
  const seconds = $derived(task.seconds);

  let matched = $state<string[]>([]);
  let errors = $state<string[]>([]);
  let selVn = $state<string | null>(null);
  let selDe = $state<string | null>(null);
  let wrong = $state<{ vn: string; de: string } | null>(null);
  let elapsed = $state(0);
  let over = $state(false);
  let timers: ReturnType<typeof setTimeout>[] = [];

  const remaining = $derived(Math.max(0, seconds - elapsed));
  const hurry = $derived(remaining <= 10);

  function finish(correct: boolean, delay: number) {
    if (over) return;
    over = true;
    const clean = matched.filter((id) => !errors.includes(id));
    const found = matched.length;
    timers.push(setTimeout(() => onresult({ correct, clean, found }), delay));
  }

  function tap(side: 'vn' | 'de', id: string) {
    if (over || matched.includes(id)) return;
    wrong = null;
    if (side === 'vn') selVn = selVn === id ? null : id;
    else selDe = selDe === id ? null : id;
    if (!selVn || !selDe) return;
    // Haptik hier, in der Geste: ein Tick je Paar (richtig wie falsch).
    tick();
    if (selVn === selDe) {
      matched = [...matched, selVn];
      if (matched.length === total) finish(true, reducedMotion() ? 0 : 700); // Ausblenden abwarten – ohne Bewegung sofort
    } else {
      errors = [...new Set([...errors, selVn, selDe])];
      wrong = { vn: selVn, de: selDe };
      timers.push(setTimeout(() => (wrong = null), 520));
    }
    selVn = selDe = null;
  }

  type TileState = 'idle' | 'right' | 'wrong' | 'dim';
  function tileState(side: 'vn' | 'de', id: string): TileState {
    if (matched.includes(id)) return 'right';
    if (wrong && wrong[side] === id) return 'wrong';
    return over ? 'dim' : 'idle';
  }

  // Zeit läuft nur, solange die App sichtbar ist.
  onMount(() => {
    let last = performance.now();
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(now - last, 250);
      last = now;
      if (!over && !document.hidden) {
        elapsed += dt / 1000;
        if (elapsed >= seconds) finish(false, 0);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  });
</script>

<p class="kicker">Finde die Paare</p>
<div class="timer" class:hurry role="timer" aria-label="Verbleibende Zeit">
  <div class="track"><div class="fill" style:width="{(remaining / seconds) * 100}%"></div></div>
  <span class="sec">{Math.ceil(remaining)} s</span>
</div>

<div class="board answers">
  <div class="col">
    {#each columns.vn as w (w.id)}
      <div class="cell" class:sel={selVn === w.id} class:gone={matched.includes(w.id)}>
        <Button variant="answer" state={tileState('vn', w.id)} dataId="vn:{w.id}" disabled={over || matched.includes(w.id)} onclick={() => tap('vn', w.id)}>
          <span lang="vi">{w.vn.trim()}</span>
        </Button>
      </div>
    {/each}
  </div>
  <div class="col">
    {#each columns.de as w (w.id)}
      <div class="cell" class:sel={selDe === w.id} class:gone={matched.includes(w.id)}>
        <Button variant="answer" state={tileState('de', w.id)} dataId="de:{w.id}" disabled={over || matched.includes(w.id)} onclick={() => tap('de', w.id)}>
          <span lang="de">{w.de.trim()}</span>
        </Button>
      </div>
    {/each}
  </div>
</div>

<style>
  .kicker {
    font-weight: 600;
    color: var(--ink-2);
  }
  .timer {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .track {
    flex: 1;
    height: 14px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    border-radius: 999px;
    background: var(--sea);
  }
  .hurry .fill {
    background: var(--red);
  }
  .sec {
    min-width: 3ch;
    text-align: right;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
  .hurry .sec {
    color: var(--bad-ink);
  }
  .board {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    align-items: start;
  }
  .col {
    display: grid;
    gap: 10px;
    min-width: 0;
  }
  .cell :global(.btn) {
    min-height: 56px;
    padding: 10px 12px;
    font-size: 17px;
    overflow-wrap: anywhere;
  }
  /* Angetippte Kachel wartet auf ihr Gegenstück */
  .cell.sel :global(.btn.answer) {
    background: var(--sea-soft);
    box-shadow: 0 4px 0 var(--sea);
    outline: 3px solid var(--sea);
    outline-offset: -3px;
  }
  /* Richtiges Paar rastet grün ein und blendet dann ab; der Platz bleibt stehen. */
  .gone {
    pointer-events: none;
    animation: vanish 420ms var(--ease-out) 380ms forwards;
  }
  @keyframes vanish {
    to {
      opacity: 0;
      transform: scale(0.9);
    }
  }
</style>
