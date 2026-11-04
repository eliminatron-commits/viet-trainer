<script lang="ts">
  import { cue, tick } from '../feedback';
  import { game, openChest, toggleEquip } from '../game.svelte';
  import { accessory } from '../logic/accessories';
  import type { ChestPrize } from '../logic/chest';
  import { BOOST_MINUTES } from '../logic/rewards';
  import AccessoryIcon from '../mascot/AccessoryIcon.svelte';
  import Button from './Button.svelte';
  import RewardIcon from './RewardIcon.svelte';

  /**
   * Truhe öffnen: die lackierte Truhe wartet, auf Tippen springt der Deckel auf, hinter ihr wächst ein
   * flacher Lichthof (wie die Sonne in den Szenen) und der Inhalt steigt heraus.
   */
  let { onclose }: { onclose: () => void } = $props();

  let prize = $state<ChestPrize | null>(null);

  function open() {
    if (prize) return;
    prize = openChest();
    if (prize) {
      cue('chest');
      tick();
    }
  }

  const acc = $derived(prize?.kind === 'accessory' ? accessory(prize.id) : undefined);
  const worn = $derived(prize?.kind === 'accessory' && game.save.inventory.equipped.includes(prize.id));
</script>

<div class="veil" role="dialog" aria-modal="true" aria-label="Truhe">
  <div class="sheet" data-prize={prize?.kind ?? ''}>
    <div class="stage">
      <div class="halo" class:on={prize}></div>
      {#if prize}
        <div class="prize">
          {#if prize.kind === 'accessory'}
            <AccessoryIcon id={prize.id} size={110} />
          {:else}
            <RewardIcon kind={prize.kind} size={96} />
          {/if}
        </div>
      {/if}
      <div class="chest"><RewardIcon kind="chest" size={170} open={prize !== null} /></div>
    </div>

    {#if !prize}
      <p class="kicker">Belohnung</p>
      <h2>Eine Truhe für dich</h2>
      <Button onclick={open}>Öffnen</Button>
    {:else}
      <div class="text">
        {#if prize.kind === 'accessory'}
          <p class="kicker">Neues Accessoire</p>
          <h2 lang="vi">{acc?.name}</h2>
          <p>Für Trâu – im Profil kannst du es jederzeit an- und ablegen.</p>
        {:else if prize.kind === 'boost'}
          <p class="kicker">XP-Boost</p>
          <h2>Doppelte XP</h2>
          <p>{BOOST_MINUTES} Minuten lang zählt jede richtige Antwort doppelt. Setz ihn im Profil ein, wann du willst.</p>
        {:else}
          <p class="kicker">Streak-Schutz</p>
          <h2>Deine Serie ist sicher</h2>
          <p>Verpasst du einen Tag, rettet er deine Serie – ganz von selbst.</p>
        {/if}
      </div>
      <div class="actions">
        {#if prize.kind === 'accessory' && !worn}
          <Button onclick={() => toggleEquip((prize as { id: string }).id)}>Gleich anlegen</Button>
        {/if}
        <Button variant={prize.kind === 'accessory' && !worn ? 'ghost' : 'primary'} onclick={onclose}>Weiter</Button>
      </div>
    {/if}
  </div>
</div>

<style>
  .veil {
    position: fixed;
    inset: 0;
    z-index: 30;
    background: var(--scrim);
    display: grid;
    align-items: end;
    animation: fade-in var(--dur) var(--ease-out);
  }
  .sheet {
    background: var(--paper);
    color: var(--ink);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    padding: 18px var(--gutter) calc(var(--safe-bottom) + 22px);
    display: grid;
    gap: 10px;
    text-align: center;
    animation: rise var(--dur-slow) var(--ease-out);
  }
  .stage {
    position: relative;
    height: 230px;
    display: grid;
    place-items: end center;
  }
  .chest {
    position: relative;
    z-index: 1;
    animation: wobble 2.4s var(--ease-out) 600ms infinite;
  }
  [data-prize]:not([data-prize='']) .chest {
    animation: none;
  }
  .halo {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 168px;
    aspect-ratio: 1;
    translate: -50% -50%;
    border-radius: 50%;
    background: var(--sun-halo);
    opacity: 0;
    scale: 0.2;
    box-shadow:
      0 0 0 16px color-mix(in srgb, var(--sun-halo) 45%, transparent),
      0 0 0 30px color-mix(in srgb, var(--sun-halo) 22%, transparent);
    transition:
      scale 700ms var(--ease-spring),
      opacity 300ms var(--ease-out);
  }
  .halo.on {
    opacity: 1;
    scale: 1;
  }
  .prize {
    position: absolute;
    left: 50%;
    top: 4px;
    translate: -50% 0;
    z-index: 2;
    animation: prize-up 760ms var(--ease-spring) 140ms both;
  }
  .kicker {
    font-weight: 600;
    font-size: var(--fs-small);
    color: var(--ink-2);
  }
  h2 {
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.1;
  }
  .text {
    display: grid;
    gap: 6px;
    animation: fade-in 400ms var(--ease-out) 300ms both;
  }
  .actions {
    display: grid;
    gap: 10px;
    margin-top: 8px;
  }
  @keyframes fade-in {
    from {
      opacity: 0;
    }
  }
  @keyframes rise {
    from {
      transform: translateY(100%);
    }
  }
  @keyframes prize-up {
    from {
      transform: translateY(120px) scale(0.4);
      opacity: 0;
    }
  }
  @keyframes wobble {
    0%,
    60%,
    100% {
      transform: rotate(0);
    }
    66% {
      transform: rotate(-4deg);
    }
    74% {
      transform: rotate(4deg);
    }
    82% {
      transform: rotate(-2deg);
    }
    90% {
      transform: rotate(1deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .chest,
    .prize,
    .text,
    .sheet,
    .veil {
      animation: none;
    }
  }
</style>
