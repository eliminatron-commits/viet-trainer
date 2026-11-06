<script lang="ts">
  import { onMount } from 'svelte';
  import type { SituationTag, Stage } from './content/types';
  import { onAudioStatus, retry } from './lib/audio/player';
  import NewsToast from './lib/components/NewsToast.svelte';
  import PillNav, { type Tab } from './lib/components/PillNav.svelte';
  import { game, initGame } from './lib/game.svelte';
  import { transitionTo, type Motion } from './lib/motion';
  import { applyUpdate, pwa } from './lib/pwa.svelte';
  import { setThemeMode } from './lib/theme.svelte';
  import PathScreen from './screens/PathScreen.svelte';
  import PhrasebookScreen from './screens/PhrasebookScreen.svelte';
  import SituationScreen from './screens/SituationScreen.svelte';
  import Play, { type PlayMode } from './screens/play/Play.svelte';
  import ProfileScreen from './screens/ProfileScreen.svelte';
  import ReviewScreen from './screens/ReviewScreen.svelte';
  import SettingsScreen from './screens/SettingsScreen.svelte';
  import StageScreen from './screens/StageScreen.svelte';
  import TrainingScreen from './screens/TrainingScreen.svelte';
  import type { CardTone } from './screens/training/ModeCarousel.svelte';

  type Screen = { name: 'tabs' } | { name: 'stage'; stage: Stage } | { name: 'play'; mode: PlayMode; card?: CardTone } | { name: 'settings' } | { name: 'review' } | { name: 'situation'; tag: SituationTag };

  let tab = $state<Tab>('path');
  let screen = $state<Screen>({ name: 'tabs' });
  /** Erhöht sich bei jedem Spielstart, damit „Boss“ nach „Session“ eine frische Play-Instanz bekommt. */
  let playRun = $state(0);

  // Jeder Ansichtswechsel beginnt oben. Gescrollt wird im Update, also vor dem neuen
  // View-Transition-Schnappschuss – sonst springt die Seite danach.
  const go = (next: Screen, motion: Motion) =>
    transitionTo(() => {
      scrollTo(0, 0);
      screen = next;
    }, motion);
  /** Startet eine Runde – als Kreis vom Tippunkt, oder aus einer Modus-Karte, die in ihrer Farbe zur Übung wächst (morph). */
  const start = (mode: PlayMode, card?: CardTone) => {
    playRun++;
    go({ name: 'play', mode, card }, card ? 'morph-open' : 'reveal');
  };

  // Tabs gleiten in Richtung des gewählten Tabs (Reihenfolge wie in der Pill-Navigation).
  const TAB_ORDER: Tab[] = ['path', 'training', 'phrasebook', 'profile'];
  const selectTab = (t: Tab) => {
    if (t === tab) return;
    const motion = TAB_ORDER.indexOf(t) > TAB_ORDER.indexOf(tab) ? 'tab-next' : 'tab-prev';
    transitionTo(() => {
      scrollTo(0, 0);
      tab = t;
    }, motion);
  };

  /** iOS hat den Ton blockiert und der Player konnte ihn nicht selbst retten – ein Tippen auf den Hinweis repariert ihn. */
  let audioBlocked = $state(false);

  onMount(() => {
    // Bis der Spielstand da ist, gilt die Uhrzeit; danach der gespeicherte Modus (ohne Übergang).
    void initGame().then(() => setThemeMode(game.save.settings.theme, false));
    return onAudioStatus((s) => (audioBlocked = s.blocked));
  });
</script>

{#if !game.ready}
  <div class="loading" aria-busy="true"></div>
{:else if screen.name === 'tabs'}
  {#if tab === 'path'}
    <PathScreen onopen={(stage) => go({ name: 'stage', stage }, 'morph-open')} />
  {:else if tab === 'training'}
    <TrainingScreen onstart={(verbsOnly, focus, card) => start({ kind: 'training', verbsOnly, focus }, card)} />
  {:else if tab === 'profile'}
    <ProfileScreen onsettings={() => go({ name: 'settings' }, 'push')} />
  {:else}
    <PhrasebookScreen onopen={(tag) => go({ name: 'situation', tag }, 'morph-open')} />
  {/if}
  <PillNav active={tab} onselect={selectTab} />
{:else if screen.name === 'stage'}
  {@const stage = screen.stage}
  <StageScreen
    {stage}
    onback={() => go({ name: 'tabs' }, 'morph-close')}
    onlearn={() => start({ kind: 'stage', stage })}
    onboss={() => start({ kind: 'boss', stage })}
  />
{:else if screen.name === 'play'}
  {#key playRun}
    <Play
      mode={screen.mode}
      card={screen.card}
      onexit={() => go({ name: 'tabs' }, 'sheet-down')}
      onboss={(stage) => start({ kind: 'boss', stage })}
    />
  {/key}
{:else if screen.name === 'situation'}
  <SituationScreen tag={screen.tag} onback={() => go({ name: 'tabs' }, 'morph-close')} />
{:else if screen.name === 'settings'}
  <SettingsScreen onback={() => go({ name: 'tabs' }, 'pop')} onreview={() => go({ name: 'review' }, 'push')} />
{:else}
  <ReviewScreen onback={() => go({ name: 'settings' }, 'pop')} />
{/if}

<!-- Fläche unter Uhr/Dynamic Island: gescrollter Inhalt verschwindet darunter statt die Statusleiste zu überlagern.
     Etappe und Situation sind randlos farbig und brauchen sie nicht. -->
{#if screen.name !== 'stage' && screen.name !== 'situation'}
  <div class="statusbar" aria-hidden="true"></div>
{/if}

<NewsToast active={game.ready && screen.name !== 'play'} />

{#if game.error}
  <div class="toast error" role="alert">{game.error}</div>
{/if}

{#if audioBlocked}
  <div class="toast" role="alert">
    <span>Der Ton hängt</span>
    <button onclick={retry}>Ton an</button>
  </div>
{/if}

{#if pwa.needRefresh}
  <div class="toast" role="status">
    <span>Neue Version verfügbar</span>
    <button onclick={applyUpdate}>Aktualisieren</button>
  </div>
{/if}

<style>
  .loading {
    min-height: 100dvh;
    background: var(--paper);
  }
  .statusbar {
    position: fixed;
    inset: 0 0 auto;
    height: var(--safe-top);
    background: var(--paper);
    z-index: 15;
    view-transition-name: statusbar;
  }
  .toast {
    position: fixed;
    top: calc(var(--safe-top) + 10px);
    left: var(--gutter);
    right: var(--gutter);
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 10px 10px 18px;
    border-radius: var(--radius-pill);
    background: var(--ink);
    color: var(--paper);
    box-shadow: var(--shadow-float);
    z-index: 20;
  }
  .toast.error {
    padding: 14px 18px;
    border-radius: 20px;
    background: var(--red-deep);
    color: var(--on-red);
  }
  .toast button {
    min-height: var(--tap);
    padding: 0 18px;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--yellow);
    color: var(--on-yellow);
    font-weight: 600;
  }
</style>
