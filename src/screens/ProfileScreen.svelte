<script lang="ts">
  import Button from '../lib/components/Button.svelte';
  import Card from '../lib/components/Card.svelte';
  import ChestReveal from '../lib/components/ChestReveal.svelte';
  import RewardIcon from '../lib/components/RewardIcon.svelte';
  import { game, today, toggleEquip, useBoost } from '../lib/game.svelte';
  import { ACCESSORIES } from '../lib/logic/accessories';
  import { ACHIEVEMENTS } from '../lib/logic/achievements';
  import { CHALLENGE_XP, challenge, challengeProgress } from '../lib/logic/challenges';
  import { boostActive, currentStreak, GROWTH_LEVELS, growthOf, levelInfo, MAX_SHIELDS } from '../lib/logic/rewards';
  import { learnedKeys } from '../lib/logic/session';
  import AccessoryIcon from '../lib/mascot/AccessoryIcon.svelte';
  import { arrivingByTab } from '../lib/motion';
  import LanternCalendar from './profile/LanternCalendar.svelte';
  import Passport from './profile/Passport.svelte';
  import TrauYard from './profile/TrauYard.svelte';

  let { onsettings }: { onsettings: () => void } = $props();

  const save = $derived(game.save);
  const info = $derived(levelInfo(save.xp));
  const growth = $derived(growthOf(info.level));
  const streak = $derived(currentStreak(save, today()));
  const stagesDone = $derived(Object.values(save.stages).filter((s) => s?.done).length);
  const unlocked = $derived(ACHIEVEMENTS.filter((a) => save.achievements[a.id]).length);
  const owned = $derived(new Set(save.inventory.accessories));

  // Uhr für die Restzeit eines laufenden XP-Boosts.
  let now = $state(new Date());
  $effect(() => {
    const t = setInterval(() => (now = new Date()), 15_000);
    return () => clearInterval(t);
  });
  const boostOn = $derived(boostActive(save, now));
  const boostLeft = $derived(
    boostOn ? Math.max(1, Math.ceil((Date.parse(save.inventory.boostUntil!) - now.getTime()) / 60_000)) : 0,
  );

  const GROWTH_TEXT = [
    `Trâu ist noch ein Kalb – ab Level ${GROWTH_LEVELS[1]} wächst er.`,
    `Trâu wird groß – ab Level ${GROWTH_LEVELS[2]} ist er ausgewachsen.`,
    'Trâu ist ausgewachsen.',
  ];

  /** Vietnamesische Namen (Nón lá, Khăn rằn) erkennt man an Ton- und Vokalzeichen; die übrigen sind deutsch und werden getrennt. */
  const isVietnamese = (name: string) => /[̛̣̀́̂̃̆̉]|đ/i.test(name.normalize('NFD'));

  let chestOpen = $state(false);
  /** Kleiderwechsel: Trâu freut sich im Hof. */
  let dressed = $state(0);

  function boost() {
    if (useBoost()) now = new Date();
  }
</script>

<main class="profile" class:arrive={arrivingByTab()}>
  <!-- Trâus Hof: streicheln, füttern, nachts schläft er. Die Kleiderkiste liegt direkt darunter, damit man ihn beim
       Anziehen sieht; danach Level. -->
  <TrauYard {dressed} />

  <section class="closet" aria-labelledby="kleider">
    <h2 id="kleider">Kleiderkiste <span class="count">{owned.size} / {ACCESSORIES.length}</span></h2>
    <ul class="wardrobe">
      {#each ACCESSORIES as a (a.id)}
        <li>
          {#if owned.has(a.id)}
            <button
              class="garment"
              class:on={save.inventory.equipped.includes(a.id)}
              aria-pressed={save.inventory.equipped.includes(a.id)}
              onclick={() => {
                toggleEquip(a.id);
                dressed++;
              }}
            >
              <AccessoryIcon id={a.id} size={38} />
              <span lang={isVietnamese(a.name) ? 'vi' : 'de'}>{a.name}</span>
            </button>
          {:else}
            <div class="garment locked" aria-label="Noch nicht gefunden">
              <svg viewBox="0 0 46 46" width="38" height="38" aria-hidden="true"
                ><circle cx="23" cy="23" r="18" fill="var(--paper-2)" /><path
                  d="M18 18a5 5 0 1 1 7 4.6c-1.3.6-2 1.4-2 2.9V27h-3v-1.7c0-2.5 1.2-4 3-4.9a2 2 0 1 0-2.7-2.4zM20 30h3v3h-3z"
                  fill="var(--ink-3)"
                /></svg
              >
              <span>Truhe</span>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="small">Je Platz eines · antippen zum An- und Ablegen. Neues gibt es in Truhen.</p>
  </section>

  <div class="hero">
    <h1>Level {info.level}</h1>
    <p class="growth">{GROWTH_TEXT[growth]}</p>
    <div class="meter" role="progressbar" aria-label="Fortschritt bis Level {info.level + 1}" aria-valuemin="0" aria-valuemax={info.span} aria-valuenow={info.into}>
      <div class="fill" style:width="{info.progress * 100}%"></div>
    </div>
    <p class="hint">{info.into} / {info.span} XP bis Level {info.level + 1}</p>
  </div>

  <div class="grid">
    <Card tone="lotus"><strong>{streak}</strong><span>Tage Serie</span></Card>
    <Card tone="lantern"><strong>{save.xp}</strong><span>XP gesamt</span></Card>
    <Card tone="sea"><strong>{learnedKeys(save).length}</strong><span>gelernt</span></Card>
    <Card tone="yellow"><strong>{stagesDone}</strong><span>Etappen geschafft</span></Card>
  </div>

  <!-- Je Tag eine Laterne aus dem Tagebuch: aus, gelernt, Tagesziel, Streak-Schutz -->
  <section aria-labelledby="kalender">
    <h2 id="kalender">Laternen-Kalender</h2>
    <LanternCalendar />
  </section>

  <section aria-labelledby="vorrat">
    <h2 id="vorrat">Vorrat</h2>
    {#if save.inventory.chests > 0}
      <div class="chest-row">
        <RewardIcon kind="chest" size={84} />
        <div>
          <p class="row-title">{save.inventory.chests === 1 ? 'Eine Truhe wartet' : `${save.inventory.chests} Truhen warten`}</p>
          <Button onclick={() => (chestOpen = true)}>Truhe öffnen</Button>
        </div>
      </div>
    {/if}
    <ul class="stock">
      <li>
        <RewardIcon kind="boost" size={44} />
        <div class="stock-text">
          <p class="row-title">XP-Boost <span class="count">× {save.inventory.xpBoosts}</span></p>
          <p class="small">{boostOn ? `Doppelte XP – noch ${boostLeft} Min.` : 'Doppelte XP für 15 Minuten'}</p>
        </div>
        <Button variant="secondary" disabled={boostOn || save.inventory.xpBoosts === 0} onclick={boost}>
          {boostOn ? 'Läuft' : 'Einsetzen'}
        </Button>
      </li>
      <li>
        <RewardIcon kind="shield" size={44} />
        <div class="stock-text">
          <p class="row-title">Streak-Schutz <span class="count">{save.streak.shields} / {MAX_SHIELDS}</span></p>
          <p class="small">Rettet die Serie an einem verpassten Tag – von selbst.</p>
        </div>
      </li>
    </ul>
    {#if save.inventory.chests === 0 && save.inventory.xpBoosts === 0 && save.streak.shields === 0}
      <p class="small">Truhen gibt es für jeden ersten Sieg über einen Boss.</p>
    {/if}
  </section>

  <section aria-labelledby="woche">
    <h2 id="woche">Diese Woche</h2>
    <p class="small">Je Challenge +{CHALLENGE_XP} XP · neue ab Montag</p>
    <ul class="challenges">
      {#each save.challenges.list as s (s.id)}
        {@const c = challenge(s.id)}
        {#if c}
          {@const p = challengeProgress(save, s.id)}
          <li class:done={s.done}>
            <div class="ch-head">
              <p class="row-title">{c.title}</p>
              <p class="count">{s.done ? 'geschafft' : `${p} / ${c.goal}`}</p>
            </div>
            <div class="bar" role="progressbar" aria-label={c.title} aria-valuemin="0" aria-valuemax={c.goal} aria-valuenow={p}>
              <div class="fill" style:width="{(p / c.goal) * 100}%"></div>
            </div>
          </li>
        {/if}
      {/each}
    </ul>
  </section>

  <!-- Erfolge als Stempel im Reisepass, Souvenirs je geschaffter Region -->
  <section aria-labelledby="erfolge">
    <h2 id="erfolge">Reisepass</h2>
    <p class="small">{unlocked} von {ACHIEVEMENTS.length} Stempeln</p>
    <Passport />
  </section>

  <Button variant="secondary" onclick={onsettings}>Einstellungen</Button>
</main>

{#if chestOpen}
  <ChestReveal onclose={() => (chestOpen = false)} />
{/if}

<style>
  .profile {
    padding: calc(var(--safe-top) + 20px) var(--gutter) calc(var(--safe-bottom) + 110px);
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;
  }
  .hero {
    display: grid;
    justify-items: center;
    gap: 8px;
  }
  .hero > .meter {
    justify-self: stretch;
  }
  /* Kleiderkiste kompakt unter dem Hof: zwei Reihen à vier. */
  .closet {
    gap: 8px;
    margin-top: -8px;
  }
  .closet h2 {
    font-size: 18px;
    margin: 0;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  .closet h2 .count {
    font-size: var(--fs-small);
  }
  h1 {
    font-size: var(--fs-h1);
    font-weight: 800;
  }
  h2 {
    font-size: var(--fs-h2);
    font-weight: 800;
    margin-bottom: 4px;
  }
  section {
    display: grid;
    gap: 10px;
  }
  .growth {
    font-weight: 600;
    text-align: center;
  }
  .meter,
  .bar {
    width: 100%;
    height: 12px;
    border-radius: 999px;
    background: var(--paper-2);
    overflow: hidden;
  }
  .fill {
    height: 100%;
    background: var(--red);
  }
  .bar .fill {
    background: var(--sea);
  }
  .done .bar .fill {
    background: var(--ok);
  }
  .hint,
  .small {
    color: var(--ink-2);
    font-size: var(--fs-small);
  }
  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  .grid strong {
    display: block;
    font-size: 28px;
    font-weight: 800;
  }
  .grid span {
    font-weight: 600;
  }
  .row-title {
    font-weight: 700;
  }
  .count {
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
    color: var(--ink-2);
    font-weight: 600;
  }
  .chest-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    border-radius: var(--radius-card);
    background: var(--tone-yellow);
    color: var(--ink);
    box-shadow: var(--shadow-card);
  }
  .chest-row > div {
    display: grid;
    gap: 10px;
    flex: 1;
  }
  .stock,
  .challenges,
  .wardrobe {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .stock {
    display: grid;
    gap: 10px;
  }
  .stock li {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 22px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
  }
  .stock-text {
    flex: 1;
    min-width: 0;
  }
  .stock :global(.btn) {
    width: auto;
    padding-inline: 16px;
  }
  .wardrobe {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }
  .garment {
    width: 100%;
    min-height: 74px;
    display: grid;
    justify-items: center;
    align-content: center;
    gap: 2px;
    padding: 6px 2px;
    border: 3px solid transparent;
    border-radius: 18px;
    background: var(--surface);
    color: var(--ink);
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    line-height: 1.15;
    text-align: center;
    hyphens: auto;
    overflow-wrap: anywhere;
    box-shadow: var(--shadow-card);
    cursor: pointer;
    transition: transform var(--dur-fast) var(--ease-out);
  }
  .garment:active:not(.locked) {
    transform: scale(0.94);
  }
  .garment.on {
    border-color: var(--red);
    background: var(--tone-yellow-soft);
  }
  .garment.locked {
    background: var(--paper-2);
    color: var(--ink-2);
    box-shadow: none;
    cursor: default;
  }
  .challenges {
    display: grid;
    gap: 10px;
  }
  .challenges li {
    display: grid;
    gap: 8px;
    padding: 14px 16px;
    border-radius: 22px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
  }
  .ch-head {
    display: flex;
    justify-content: space-between;
    gap: 10px;
  }
</style>
