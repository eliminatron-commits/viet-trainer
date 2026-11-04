<script lang="ts">
  import { onMount } from 'svelte';
  import Button from '../lib/components/Button.svelte';
  import { onAudioStatus, play, type AudioStatus } from '../lib/audio/player';
  import { hapticsSupported } from '../lib/feedback';
  import { flushed, game, replaceSave, today, updateSettings } from '../lib/game.svelte';
  import { disablePush, enablePush, push, refreshPushStatus, reportToWorker, sendTestPush } from '../lib/push.svelte';
  import type { ThemeMode } from '../lib/logic/theme';
  import { exportSave, importSave } from '../lib/storage/persist';
  import { setThemeMode, theme } from '../lib/theme.svelte';

  let { onback, onreview }: { onback: () => void; onreview: () => void } = $props();

  const haptics = hapticsSupported();

  // Darstellung: „Automatisch“ stellt jederzeit die Standardzeiten wieder her (Nacht 20–9 Uhr).
  const themeOptions: { mode: ThemeMode; label: string }[] = [
    { mode: 'auto', label: 'Automatisch' },
    { mode: 'light', label: 'Tag' },
    { mode: 'dark', label: 'Nacht' },
  ];
  const themeHint = $derived(
    theme.mode === 'auto'
      ? `Nacht von 20 bis 9 Uhr, sonst Tag – gerade ${theme.dark ? 'Nacht' : 'Tag'}.`
      : `Immer ${theme.mode === 'dark' ? 'Nacht' : 'Tag'}. „Automatisch“ stellt die Zeiten 20–9 Uhr wieder her.`,
  );
  function chooseTheme(mode: ThemeMode) {
    if (mode === theme.mode) return;
    updateSettings({ theme: mode });
    setThemeMode(mode);
  }

  let dataMessage = $state('');
  let fileInput: HTMLInputElement | undefined = $state();

  onMount(() => {
    void refreshPushStatus();
    return onAudioStatus((s) => {
      if (audio.blocked && !s.blocked) soundMessage = 'Der Ton ist wieder da.';
      audio = s;
    });
  });

  // Ton-Test und Diagnose: Bleibt es auf dem iPhone still, zeigt die Zeile, was der Player erkannt hat.
  let audio = $state<AudioStatus>({ blocked: false, state: 'none', rebuilds: 0, issue: '' });
  let soundMessage = $state('');
  const audioStateText: Record<string, string> = {
    none: 'noch nicht gestartet',
    running: 'läuft',
    suspended: 'wartet auf Tippen',
    interrupted: 'unterbrochen',
    closed: 'geschlossen',
  };
  const audioDiag = $derived(
    [`Zustand: ${audioStateText[audio.state] ?? audio.state}`, `Neustarts: ${audio.rebuilds}`, audio.issue && `zuletzt: ${audio.issue}`]
      .filter(Boolean)
      .join(' · '),
  );

  async function testSound() {
    soundMessage = 'Spielt „cảm ơn“ …';
    try {
      await play('w062');
      soundMessage = 'Das war „cảm ơn“. Nichts gehört? Lautstärke prüfen und noch einmal tippen.';
    } catch {
      soundMessage = 'Der Ton war blockiert und wird neu gestartet – tippe noch einmal.';
    }
  }

  const statusText: Record<typeof push.status, string> = {
    checking: 'Wird geprüft …',
    unconfigured: 'In diesem Build nicht eingerichtet (Worker-Adresse fehlt).',
    'not-installed': 'Nur aus der installierten App: In Safari „Teilen → Zum Home-Bildschirm“, dann die App vom Home-Bildschirm öffnen.',
    denied: 'Mitteilungen sind blockiert. Erlaube sie in den iPhone-Einstellungen unter Mitteilungen → Việt-Trainer.',
    off: 'Aus.',
    on: 'An – morgens fällige Wiederholungen, abends nur, wenn das Tagesziel noch offen ist.',
  };

  function setTime(slot: 'morning' | 'evening', value: string) {
    if (!/^\d{2}:\d{2}$/.test(value)) return;
    updateSettings({ [slot]: value });
    void reportToWorker(game.save, today());
  }

  async function doExport() {
    await flushed();
    const json = exportSave(game.save);
    const name = `viet-trainer-${today()}.json`;
    const file = new File([json], name, { type: 'application/json' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        dataMessage = 'Export geteilt.';
        return;
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
      }
    }
    const url = URL.createObjectURL(file);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    dataMessage = 'Export gespeichert.';
  }

  async function doImport(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const next = importSave(await file.text());
      if (!confirm('Den aktuellen Fortschritt durch den importierten ersetzen?')) return;
      replaceSave(next);
      dataMessage = 'Fortschritt importiert.';
    } catch (err) {
      dataMessage = err instanceof Error ? err.message : String(err);
    }
  }
</script>

<main class="settings">
  <button class="back" onclick={onback} aria-label="Zurück">
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
  </button>
  <h1>Einstellungen</h1>

  <section class="group">
    <h2>Erinnerungen</h2>
    <p class="status" data-push-status={push.status}>{statusText[push.status]}</p>

    <div class="times">
      <label>
        <span>Morgens</span>
        <input type="time" step="300" value={game.save.settings.morning} onchange={(e) => setTime('morning', e.currentTarget.value)} />
      </label>
      <label>
        <span>Abends</span>
        <input type="time" step="300" value={game.save.settings.evening} onchange={(e) => setTime('evening', e.currentTarget.value)} />
      </label>
    </div>

    {#if push.status === 'off' || push.status === 'on'}
      <div class="buttons">
        <Button disabled={push.busy} onclick={() => enablePush(game.save, today())}>
          {push.status === 'on' ? 'Erneut anmelden' : 'Erinnerungen aktivieren'}
        </Button>
        {#if push.status === 'on'}
          <Button variant="secondary" disabled={push.busy} onclick={sendTestPush}>Test senden</Button>
          <Button variant="ghost" disabled={push.busy} onclick={disablePush}>Ausschalten</Button>
        {/if}
      </div>
    {/if}
    {#if push.message}<p class="message" role="status">{push.message}</p>{/if}
  </section>

  <section class="group">
    <h2>Ton</h2>
    <p class="status">Lerninhalte sind auch bei eingeschaltetem Stummschalter zu hören.</p>
    <div class="buttons">
      <Button variant="secondary" onclick={testSound}>Ton testen</Button>
    </div>
    {#if soundMessage}<p class="message" role="status">{soundMessage}</p>{/if}
    <p class="diag" data-audio-state={audio.state}>{audioDiag}</p>
  </section>

  <section class="group">
    <h2>Rückmeldung</h2>
    <button class="switch" role="switch" aria-checked={game.save.settings.sound} onclick={() => updateSettings({ sound: !game.save.settings.sound })}>
      <span class="label">
        <strong>Effekt-Klänge</strong>
        <span>Kurze Töne bei Antworten, Truhe und Level-up. Wörter und Sätze bleiben immer hörbar.</span>
      </span>
      <span class="track" aria-hidden="true"><span class="thumb"></span></span>
    </button>
    <button
      class="switch"
      role="switch"
      aria-checked={haptics && game.save.settings.haptics}
      disabled={!haptics}
      onclick={() => updateSettings({ haptics: !game.save.settings.haptics })}
    >
      <span class="label">
        <strong>Haptik</strong>
        <span>Ein leichtes Ticken bei Antworten.</span>
      </span>
      <span class="track" aria-hidden="true"><span class="thumb"></span></span>
    </button>
    {#if !haptics}<p class="status" data-haptics="unsupported">Auf diesem Gerät nicht verfügbar (iPhone ab iOS 18).</p>{/if}
  </section>

  <section class="group">
    <h2>Darstellung</h2>
    <div class="segments" role="radiogroup" aria-label="Darstellung">
      {#each themeOptions as o (o.mode)}
        <button role="radio" aria-checked={theme.mode === o.mode} class:on={theme.mode === o.mode} onclick={() => chooseTheme(o.mode)}>
          {o.label}
        </button>
      {/each}
    </div>
    <p class="status" data-theme-mode={theme.mode}>{themeHint}</p>
  </section>

  <section class="group">
    <h2>Fortschritt sichern</h2>
    <p class="status">Der Fortschritt liegt nur auf diesem Gerät. Ein Export ist deine Sicherung.</p>
    <div class="buttons">
      <Button variant="secondary" onclick={doExport}>Exportieren (JSON)</Button>
      <Button variant="ghost" onclick={() => fileInput?.click()}>Importieren …</Button>
      <input bind:this={fileInput} type="file" accept="application/json,.json" hidden onchange={doImport} />
    </div>
    {#if dataMessage}<p class="message" role="status">{dataMessage}</p>{/if}
  </section>

  <section class="group">
    <h2>Prüfmodus</h2>
    <p class="status">Für die Muttersprachlerin: noch ungeprüfte Wörter und Sätze anhören und beurteilen – passt oder unnatürlich, mit Notiz. Das Ergebnis lässt sich als Datei weitergeben.</p>
    <div class="buttons">
      <Button variant="secondary" onclick={onreview}>Prüfmodus öffnen</Button>
    </div>
  </section>
</main>

<style>
  .settings {
    min-height: 100dvh;
    padding: calc(var(--safe-top) + 12px) var(--gutter) calc(var(--safe-bottom) + 40px);
    display: grid;
    align-content: start;
    gap: 18px;
  }
  .back {
    width: var(--tap);
    height: var(--tap);
    margin-left: -10px;
    border: 0;
    background: transparent;
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
  }
  h2 {
    font-size: 20px;
    font-weight: 800;
  }
  .group {
    background: var(--surface);
    border-radius: var(--radius-card);
    padding: 20px;
    display: grid;
    gap: 14px;
    box-shadow: var(--shadow-card);
  }
  .status,
  .message {
    color: var(--ink-2);
  }
  .message {
    font-weight: 600;
    color: var(--ink);
  }
  .times {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .times label {
    display: grid;
    gap: 6px;
    font-weight: 600;
  }
  .times input {
    min-height: var(--tap);
    border: 0;
    border-radius: 14px;
    background: var(--paper-2);
    padding: 8px 12px;
    font: inherit;
    font-size: 20px;
    color: var(--ink);
  }
  .buttons {
    display: grid;
    gap: 10px;
  }
  .diag {
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  /* Schalter: ganze Zeile tippbar (≥ 44 px), flache Pille – Gelb = an. */
  .switch {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 16px;
    min-height: 56px;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }
  .switch:disabled {
    cursor: default;
    opacity: 0.55;
  }
  .switch .label {
    display: grid;
    gap: 2px;
  }
  .switch .label span {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .track {
    width: 56px;
    height: 32px;
    padding: 4px;
    border-radius: var(--radius-pill);
    background: var(--ink-3);
    transition: background-color var(--dur) var(--ease-out);
  }
  .thumb {
    display: block;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: var(--paper);
    transition:
      transform var(--dur) var(--ease-spring),
      background-color var(--dur) var(--ease-out);
  }
  .switch[aria-checked='true'] .track {
    background: var(--yellow);
  }
  .switch[aria-checked='true'] .thumb {
    transform: translateX(24px);
    background: var(--on-yellow);
  }
  .switch:active:not(:disabled) .thumb {
    transform: scale(0.9);
  }
  .switch[aria-checked='true']:active:not(:disabled) .thumb {
    transform: translateX(24px) scale(0.9);
  }
  /* Umschalter Automatisch / Tag / Nacht: die gelbe Pille gleitet zur Wahl. */
  .segments {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 4px;
    border-radius: var(--radius-pill);
    background: var(--paper-2);
  }
  .segments button {
    min-height: var(--tap);
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--ink);
    font-weight: 600;
    cursor: pointer;
    transition:
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out),
      transform var(--dur-fast) var(--ease-out);
  }
  .segments button:active {
    transform: scale(0.96);
  }
  .segments button.on {
    background: var(--yellow);
    color: var(--on-yellow);
  }
</style>
