<script lang="ts">
  import type { Stage } from './content/types';
  import PillNav, { type Tab } from './lib/components/PillNav.svelte';
  import Card from './lib/components/Card.svelte';
  import { transitionTo } from './lib/motion';
  import { applyUpdate, pwa } from './lib/pwa.svelte';
  import Home from './prototype/Home.svelte';
  import StageDetail from './prototype/StageDetail.svelte';
  import QuizLight from './prototype/QuizLight.svelte';
  import ListenDark from './prototype/ListenDark.svelte';
  import MascotPick from './prototype/MascotPick.svelte';

  type Screen = { name: 'tabs' } | { name: 'stage' | 'quiz' | 'listen'; stage: Stage };

  let tab = $state<Tab>('path');
  let screen = $state<Screen>({ name: 'tabs' });

  const go = (next: Screen) => transitionTo(() => (screen = next));
</script>

{#if screen.name === 'tabs'}
  {#if tab === 'path'}
    <Home hidden={false} onopen={(stage) => go({ name: 'stage', stage })} />
  {:else if tab === 'profile'}
    <MascotPick />
  {:else}
    <main class="placeholder">
      <Card tone={tab === 'training' ? 'sea' : 'lotus'}>
        <h1>{tab === 'training' ? 'Training' : 'Sprachführer'}</h1>
        <p>Kommt in Phase {tab === 'training' ? 2 : 3}.</p>
      </Card>
    </main>
  {/if}
  <PillNav active={tab} onselect={(t) => transitionTo(() => (tab = t))} />
{:else if screen.name === 'stage'}
  <StageDetail
    stage={screen.stage}
    onback={() => go({ name: 'tabs' })}
    onstart={() => go({ name: 'quiz', stage: (screen as { stage: Stage }).stage })}
  />
{:else if screen.name === 'quiz'}
  <QuizLight
    stage={screen.stage}
    onclose={() => go({ name: 'tabs' })}
    onnext={() => go({ name: 'listen', stage: (screen as { stage: Stage }).stage })}
  />
{:else}
  <ListenDark stage={screen.stage} onfinish={() => go({ name: 'tabs' })} />
{/if}

{#if pwa.needRefresh}
  <div class="update" role="status">
    <span>Neue Version verfügbar</span>
    <button onclick={applyUpdate}>Aktualisieren</button>
  </div>
{/if}

<style>
  .placeholder {
    padding: calc(var(--safe-top) + 20px) var(--gutter);
  }
  .placeholder h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
  }
  .update {
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
  .update button {
    min-height: var(--tap);
    padding: 0 18px;
    border: 0;
    border-radius: var(--radius-pill);
    background: var(--yellow);
    color: var(--ink);
    font-weight: 600;
  }
</style>
