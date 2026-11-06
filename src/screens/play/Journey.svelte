<script lang="ts">
  import type { RegionId } from '../../content/types';
  import RegionHero from '../../lib/illustrations/RegionHero.svelte';
  import RegionScene from '../../lib/illustrations/RegionScene.svelte';
  import type { Mood } from '../../lib/mascot/Buffalo.svelte';
  import Trau from '../../lib/mascot/Trau.svelte';

  /**
   * Die Runde als Reise: Oben liegt die Szene der Region, noch unter Nebel. Darunter läuft der Weg (Striche wie die
   * Route im Lernpfad) zum Hero-Objekt der Region. Trâu geht mit jeder gelösten Aufgabe ein Stück weiter – fröhlich
   * hüpfend nach einer richtigen, mit hängendem Kopf nach einer falschen Antwort –, und hinter ihm lichtet sich der
   * Nebel: Der Ort bekommt Farbe. `done` zählt die gelöste Aufgabe schon mit, `position` (für Vorleser und Tests)
   * erst nach „Weiter“.
   */
  let {
    region,
    done,
    position,
    total,
    mood,
  }: { region: RegionId; done: number; position: number; total: number; mood: Mood } = $props();

  const DASHES = 22;
  const p = $derived(total > 0 ? Math.min(1, Math.max(0, done / total)) : 0);
</script>

<div
  class="journey"
  style:--p={p}
  role="progressbar"
  aria-label="Fortschritt der Runde"
  aria-valuemin="0"
  aria-valuemax={total}
  aria-valuenow={position}
>
  <div class="band">
    <RegionScene {region} />
    <div class="veil" aria-hidden="true"></div>
  </div>
  <div class="road" aria-hidden="true">
    {#each { length: DASHES } as _, i (i)}
      <span class="dash" class:passed={(i + 0.5) / DASHES <= p}></span>
    {/each}
  </div>
  <div class="goal" aria-hidden="true"><RegionHero {region} size={46} /></div>
  <div class="walker" aria-hidden="true"><Trau size={50} {mood} /></div>
</div>

<style>
  /* Maße: Trâu ist 50 px breit, das Ziel braucht rechts 56 px. Trâus Mitte läuft von 25 px bis Breite − 81 px. */
  .journey {
    --band: 84px;
    position: relative;
    padding-bottom: 6px;
  }
  .band {
    position: relative;
    height: var(--band);
    border-radius: 22px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    background: var(--paper-2);
  }
  .band :global(svg.scene) {
    height: 100%;
  }
  /* Nebel über dem noch nicht besuchten Teil: flache Papier-Lasur, weicht bis hinter Trâu zurück. */
  .veil {
    position: absolute;
    inset: 0 0 0 auto;
    width: calc(100% - (var(--p) * (100% - 106px) + 25px) - var(--p) * 81px);
    background: color-mix(in srgb, var(--paper) 64%, transparent);
    transition: width var(--dur-slow) var(--ease-out);
  }
  .road {
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 4px;
    margin: 12px 60px 0 4px;
  }
  .dash {
    width: 8px;
    height: 4px;
    border-radius: 2px;
    background: var(--ink-3);
    opacity: 0.55;
    transition:
      background-color var(--dur) var(--ease-out),
      opacity var(--dur) var(--ease-out);
  }
  .dash.passed {
    background: var(--red);
    opacity: 1;
  }
  /* Trâu und das Ziel stehen auf dem Weg und ragen vor die Szene. */
  .walker,
  .goal {
    position: absolute;
    bottom: 0;
    line-height: 0;
  }
  .walker {
    left: calc(var(--p) * (100% - 106px));
    transition: left var(--dur-slow) var(--ease-out);
  }
  .goal {
    right: 4px;
    bottom: 2px;
  }
  @media (max-height: 700px) {
    .journey {
      --band: 64px;
    }
  }
</style>
