<script lang="ts">
  import { onMount } from 'svelte';
  import type { Stage } from './content/types';
  import Card from './lib/components/Card.svelte';
  import PillNav, { type Tab } from './lib/components/PillNav.svelte';
  import { game, initGame } from './lib/game.svelte';
  import { transitionTo } from './lib/motion';
  import { applyUpdate, pwa } from './lib/pwa.svelte';
  import PathScreen from './screens/PathScreen.svelte';
  import Play, { type PlayMode } from './screens/play/Play.svelte';
  import ProfileScreen from './screens/ProfileScreen.svelte';
  import SettingsScreen from './screens/SettingsScreen.svelte';
  import StageScreen from './screens/StageScreen.svelte';
  import TrainingScreen from './screens/TrainingScreen.svelte';

  type Screen = { name: 'tabs' } | { name: 'stage'; stage: Stage } | { name: 'play'; mode: PlayMode } | { name: 'settings' };

  let tab = $state<Tab>('path');
  let screen = $state<Screen>({ name: 'tabs' });
  /** Erhöht sich bei jedem Spielstart, damit „Boss“ nach „Session“ eine frische Play-Instanz bekommt. */
  let playRun = $state(0);

  // Jeder Ansichtswechsel beginnt oben (der Lernpfad scrollt beim Einhängen selbst zur aktuellen Etappe).
  // Gescrollt wird im Update, also vor dem neuen View-Transition-Schnappschuss – sonst springt die Seite danach.
  const go = (next: Screen, morph = false) =>
    transitionTo(
      () => {
        scrollTo(0, 0);
        screen = next;
      },
      { morph },
    );
  const start = (mode: PlayMode) => {
    playRun++;
    go({ name: 'play', mode });
  };

  onMount(() => {
    void initGame();
  });
</script>

{#if !game.ready}
  <div class="loading" aria-busy="true"></div>
{:else if screen.name === 'tabs'}
  {#if tab === 'path'}
    <PathScreen onopen={(stage) => go({ name: 'stage', stage }, true)} />
  {:else if tab === 'training'}
    <TrainingScreen onstart={(verbsOnly) => start({ kind: 'training', verbsOnly })} />
  {:else if tab === 'profile'}
    <ProfileScreen onsettings={() => go({ name: 'settings' })} />
  {:else}
    <main class="placeholder">
      <Card tone="lotus">
        <h1>Sprachführer</h1>
        <p>Kommt mit dem nächsten Update.</p>
      </Card>
    </main>
  {/if}
  <PillNav
    active={tab}
    onselect={(t) =>
      transitionTo(() => {
        scrollTo(0, 0);
        tab = t;
      })}
  />
{:else if screen.name === 'stage'}
  {@const stage = screen.stage}
  <StageScreen
    {stage}
    onback={() => go({ name: 'tabs' }, true)}
    onlearn={() => start({ kind: 'stage', stage })}
    onboss={() => start({ kind: 'boss', stage })}
  />
{:else if screen.name === 'play'}
  {#key playRun}
    <Play
      mode={screen.mode}
      onexit={() => go({ name: 'tabs' })}
      onboss={(stage) => start({ kind: 'boss', stage })}
    />
  {/key}
{:else}
  <SettingsScreen onback={() => go({ name: 'tabs' })} />
{/if}

<!-- Fläche unter Uhr/Dynamic Island: gescrollter Inhalt verschwindet darunter statt die Statusleiste zu überlagern.
     Die Etappen-Ansicht ist randlos farbig und braucht sie nicht. -->
{#if screen.name !== 'stage'}
  <div class="statusbar" aria-hidden="true"></div>
{/if}

{#if game.error}
  <div class="toast error" role="alert">{game.error}</div>
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
  .placeholder {
    padding: calc(var(--safe-top) + 20px) var(--gutter);
  }
  .placeholder h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
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
    color: var(--ink);
    font-weight: 600;
  }
</style>
