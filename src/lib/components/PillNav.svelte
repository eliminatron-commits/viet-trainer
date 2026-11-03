<script lang="ts" module>
  export type Tab = 'path' | 'training' | 'phrasebook' | 'profile';
</script>

<script lang="ts">
  let { active, onselect }: { active: Tab; onselect: (tab: Tab) => void } = $props();

  // Eigene 24er-Icons, gefüllte Flächen
  const tabs: { id: Tab; label: string; icon: string }[] = [
    {
      id: 'path',
      label: 'Lernpfad',
      icon: 'M12 2a6 6 0 0 0-6 6c0 4.2 6 10 6 10s6-5.8 6-10a6 6 0 0 0-6-6Zm0 8.5A2.5 2.5 0 1 1 12 5.5a2.5 2.5 0 0 1 0 5ZM4 20.5c0-.8 1.6-1.6 4-2l.9 1.1C7.1 20 6 20.4 6 20.6c0 .5 2.5 1.4 6 1.4s6-.9 6-1.4c0-.2-1.1-.6-2.9-1l.9-1.1c2.4.4 4 1.2 4 2C20 22.2 16.4 23 12 23s-8-.8-8-2.5Z',
    },
    {
      id: 'training',
      label: 'Training',
      icon: 'M13 2 4 13.5h6.2L9 22l9-11.5h-6.2L13 2Z',
    },
    {
      id: 'phrasebook',
      label: 'Sprachführer',
      icon: 'M4 3h12a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4h-5.5L6 21.5V18H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm3 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm4.5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z',
    },
    {
      id: 'profile',
      label: 'Profil',
      icon: 'M12 2.5a5 5 0 1 1 0 10 5 5 0 0 1 0-10ZM3 21c0-4 4-6.5 9-6.5s9 2.5 9 6.5v1H3v-1Z',
    },
  ];
</script>

<nav class="pill" aria-label="Hauptnavigation">
  {#each tabs as tab (tab.id)}
    <button
      class="item"
      class:active={tab.id === active}
      aria-label={tab.label}
      aria-current={tab.id === active ? 'page' : undefined}
      onclick={() => onselect(tab.id)}
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true"><path d={tab.icon} fill="currentColor" /></svg>
      <span class="label">{tab.label}</span>
    </button>
  {/each}
</nav>

<style>
  /* Feste Breite; die Tabs teilen sie per flex-grow. Der aktive wächst, die gelbe Pille fließt mit. */
  .pill {
    position: fixed;
    left: 50%;
    bottom: calc(var(--safe-bottom) + 12px);
    transform: translateX(-50%);
    width: min(384px, calc(100vw - 2 * var(--gutter)));
    display: flex;
    gap: 4px;
    padding: 6px;
    background: var(--ink);
    border-radius: var(--radius-pill);
    box-shadow: var(--shadow-float);
    z-index: 10;
    view-transition-name: pill-nav;
  }
  .item {
    flex: 1 1 0;
    min-width: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 52px;
    padding: 0 12px;
    border: 0;
    border-radius: var(--radius-pill);
    background: transparent;
    color: var(--paper);
    opacity: 0.7;
    overflow: hidden;
    cursor: pointer;
    transition:
      flex-grow var(--dur-slow) var(--ease-out),
      background-color var(--dur) var(--ease-out),
      color var(--dur) var(--ease-out),
      opacity var(--dur) var(--ease-out);
  }
  .item.active {
    flex-grow: 3;
    background: var(--yellow);
    color: var(--ink);
    opacity: 1;
  }
  .item svg {
    flex: none;
  }
  .active svg {
    animation: icon-hop 520ms var(--ease-spring);
  }
  .label {
    max-width: 0;
    margin-left: 0;
    opacity: 0;
    font-weight: 600;
    font-size: 15px;
    white-space: nowrap;
    transition:
      max-width var(--dur-slow) var(--ease-out),
      margin-left var(--dur-slow) var(--ease-out),
      opacity var(--dur-fast) var(--ease-out);
  }
  .active .label {
    max-width: 9em;
    margin-left: 8px;
    opacity: 1;
    transition-delay: 0ms, 0ms, 120ms;
  }
  @keyframes icon-hop {
    40% {
      transform: translateY(-5px) scale(1.12);
    }
  }
</style>
