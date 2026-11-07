<script lang="ts">
  import { cubicOut } from 'svelte/easing';
  import { content } from '../../content';
  import { tick as haptic } from '../../lib/feedback';
  import { game } from '../../lib/game.svelte';
  import RegionHero from '../../lib/illustrations/RegionHero.svelte';
  import { ACHIEVEMENTS, metricValue } from '../../lib/logic/achievements';
  import { passportPages, stampDate, stampStyle } from '../../lib/logic/passport';
  import { isDone, regionDone } from '../../lib/logic/path';
  import { levelInfo } from '../../lib/logic/rewards';
  import { reducedMotion } from '../../lib/motion';

  /**
   * Reisepass im Profil. Zugeklappt der rote Einband mit gelbem Stern. Aufgeschlagen kommen zuerst die Souvenirs
   * (Hero-Objekt je geschaffter Region auf dem Regal), dann die Erfolge als Stempel, sechs je Seite. Blättern per
   * Wischen oder Pfeil: vorwärts dreht sich die Seite um den Rücken weg, rückwärts dreht sie sich zurück. Gestempelte
   * Erfolge knallen beim Aufschlagen der Seite aufs Papier. Ein Stempel zeigt angetippt, wofür es ihn gibt.
   */
  const save = $derived(game.save);
  const pages = passportPages();
  /** −1 = Einband, 0 = Souvenirs, 1… = Stempelseiten. */
  let page = $state(-1);
  let dir = $state<1 | -1>(1);
  let selected = $state<string | null>(null);
  const LAST = pages.length;
  const earned = $derived(ACHIEVEMENTS.filter((a) => save.achievements[a.id]).length);
  const regions = $derived(content.regions.filter((r) => regionDone(save, r.id)).length);
  /** Stempelfarben: semantische Töne, AA auf Papier bei Tag und Nacht. */
  const INKS = ['--bad-ink', '--ok', '--ink-2', '--ink'] as const;
  /** Längstes Wort des Titels: bestimmt die Schriftgröße im Stempel (passt immer hinein). */
  const longest = (t: string) => Math.max(...t.split(/\s+/).map((w) => w.length));
  const stagesDone = $derived(content.stages.filter((s) => isDone(save, s.id)).length);

  function go(to: number) {
    if (to < -1 || to > LAST || to === page) return;
    dir = to > page ? 1 : -1;
    page = to;
    selected = null;
    haptic();
  }

  // Wischen: waagerecht blättert, senkrecht scrollt die Seite weiter (touch-action: pan-y).
  let startX: number | null = null;
  function down(e: PointerEvent) {
    startX = e.clientX;
  }
  function up(e: PointerEvent) {
    if (startX === null) return;
    const dx = e.clientX - startX;
    startX = null;
    if (Math.abs(dx) > 44) go(page + (dx < 0 ? 1 : -1));
  }

  // Blättern wie im Buch (Rücken links): vorwärts dreht die alte Seite weg, rückwärts dreht die neue zurück.
  const TURN = 560;
  const swing = (u: number) => `transform: perspective(1400px) rotateY(${-100 * u}deg); z-index: 2;`;
  function leave(_node: Element) {
    if (reducedMotion()) return { duration: 0 };
    return dir === 1 ? { duration: TURN, easing: cubicOut, css: (_t: number, u: number) => swing(u) } : { duration: TURN, css: () => 'z-index: 0;' };
  }
  function enter(_node: Element) {
    if (reducedMotion() || dir === 1) return { duration: 0 };
    return { duration: TURN, easing: cubicOut, css: (_t: number, u: number) => swing(u) };
  }

  const detail = $derived.by(() => {
    const a = ACHIEVEMENTS.find((x) => x.id === selected);
    if (!a) return page === 0 ? 'Jede geschaffte Region bringt ihr Souvenir mit.' : 'Tipp einen Stempel an, um zu sehen, wofür es ihn gibt.';
    const got = save.achievements[a.id];
    return got
      ? `${a.title}: ${a.desc} Gestempelt am ${stampDate(got)}.`
      : `${a.title}: ${a.desc} Stand: ${Math.min(metricValue(save, a.metric), a.goal)} von ${a.goal}.`;
  });
</script>

<div class="passport">
  <div
    class="book"
    role="group"
    aria-roledescription="Reisepass"
    aria-label={page === -1 ? 'Reisepass, zugeklappt' : `Seite ${page + 1} von ${LAST + 1}`}
    onpointerdown={down}
    onpointerup={up}
    onpointercancel={() => (startX = null)}
  >
    {#key page}
      <div class="page" class:cover={page === -1} in:enter out:leave>
        {#if page === -1}
          <button class="cover-btn" onclick={() => go(0)}>
            <svg class="star" viewBox="0 0 24 24" aria-hidden="true"
              ><path d="m12 2 2.9 6.6 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 20.9l1.6-7L2 9.2l7.1-.6Z" /></svg
            >
            <span class="cover-title">Reisepass</span>
            <span class="cover-sub">Alex &amp; Trâu · Việt Nam</span>
            <span class="cover-count">{earned} von {ACHIEVEMENTS.length} Stempeln · {regions} von {content.regions.length} Souvenirs</span>
            <span class="cover-open">Aufschlagen</span>
          </button>
        {:else if page === 0}
          <h3>Personalien</h3>
          <dl class="info">
            <div><dt>Reisender</dt><dd>Alex</dd></div>
            <div><dt>Begleiter</dt><dd>Trâu · Level {levelInfo(save.xp).level}</dd></div>
            <div><dt>Unterwegs seit</dt><dd>{stampDate(save.createdAt.slice(0, 10))}</dd></div>
            <div><dt>Etappen</dt><dd>{stagesDone} von {content.stages.length}</dd></div>
          </dl>
          <h3 class="later">Souvenirs</h3>
          <div class="shelf">
            {#each content.regions as r, n (r.id)}
              <div class="obj" class:got={regionDone(save, r.id)} style:--n={n}><RegionHero region={r.id} /></div>
            {/each}
          </div>
          <div class="plank" aria-hidden="true"></div>
          <div class="names">
            {#each content.regions as r (r.id)}
              <span lang="vi" class:got={regionDone(save, r.id)}>{regionDone(save, r.id) ? r.name : '?'}</span>
            {/each}
          </div>
        {:else}
          {@const from = (page - 1) * 6 + 1}
          <h3>Stempel {from}–{from + pages[page - 1]!.length - 1}</h3>
          <ul class="stamps">
            {#each pages[page - 1]! as a, i (a.id)}
              {@const got = save.achievements[a.id]}
              {@const s = stampStyle(a.id)}
              <li>
                <button
                  class="stamp"
                  class:got
                  style:--rot="{got ? s.rot : 0}deg"
                  style:--i={i}
                  style:--stamp="var({INKS[s.ink]})"
                  aria-pressed={selected === a.id}
                  aria-label="{a.title}: {got ? `gestempelt am ${stampDate(got)}` : 'noch offen'}"
                  onclick={() => (selected = selected === a.id ? null : a.id)}
                >
                  <span class="ink">
                    <svg viewBox="0 0 120 120" aria-hidden="true">
                      {#if s.shape === 0}
                        <circle cx="60" cy="60" r="56" class="fg" /><circle cx="60" cy="60" r="50" class="bg" />
                        <circle cx="60" cy="60" r="46" class="fg" /><circle cx="60" cy="60" r="43" class="bg inner" />
                      {:else if s.shape === 1}
                        <rect x="6" y="8" width="108" height="104" rx="18" class="fg" /><rect x="12" y="14" width="96" height="92" rx="13" class="bg" />
                        <rect x="16" y="18" width="88" height="84" rx="10" class="fg" /><rect x="19" y="21" width="82" height="78" rx="8" class="bg inner" />
                      {:else}
                        <path d="M38 4h44l34 34v44l-34 34H38L4 82V38Z" class="fg" /><path d="M40.5 10h39L110 40.5v39L79.5 110h-39L10 79.5v-39Z" class="bg" />
                        <path d="M42 14h36l28 28v36l-28 28H42L14 78V42Z" class="fg" /><path d="M43.3 17h33.4L103 43.3v33.4L76.7 103H43.3L17 76.7V43.3Z" class="bg inner" />
                      {/if}
                    </svg>
                    <span class="t" lang="de" style:--w={got ? longest(a.title) : 1} style:--words={got ? a.title.split(/\s+/).length : 1}
                      >{got ? a.title : '?'}</span
                    >
                    <span class="d">{got ? stampDate(got) : `${Math.min(metricValue(save, a.metric), a.goal)} / ${a.goal}`}</span>
                  </span>
                </button>
              </li>
            {/each}
          </ul>
        {/if}
        {#if page >= 0}<p class="folio" aria-hidden="true">{page + 1}</p>{/if}
      </div>
    {/key}
  </div>

  {#if page >= 0}
    <div class="nav">
      <button class="turn" onclick={() => go(page - 1)} aria-label={page === 0 ? 'Reisepass zuklappen' : 'Vorige Seite'}>
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4-1.4 1.4L5.2 12 14 3.2z" fill="currentColor" /></svg>
      </button>
      <div class="dots" aria-hidden="true">
        {#each { length: LAST + 1 } as _, i (i)}<span class:on={i === page}></span>{/each}
      </div>
      <button class="turn" onclick={() => go(page + 1)} disabled={page === LAST} aria-label="Nächste Seite">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M8.6 19.4 16 12 8.6 4.6 10 3.2 18.8 12 10 20.8z" fill="currentColor" /></svg>
      </button>
    </div>
    <p class="detail" role="status">{detail}</p>
  {/if}
</div>

<style>
  .book {
    display: grid;
    min-height: 330px;
    touch-action: pan-y;
  }
  /* Eine Seite: Papier mit Rücken links (dunklerer Streifen), dreht sich um den Rücken. */
  .page {
    grid-area: 1 / 1;
    position: relative;
    display: grid;
    align-content: start;
    gap: 12px;
    padding: 18px 18px 30px 30px;
    border-radius: 6px 24px 24px 6px;
    background: var(--surface);
    box-shadow: var(--shadow-card);
    transform-origin: left center;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
  .page::before {
    content: '';
    position: absolute;
    inset: 0 auto 0 0;
    width: 12px;
    border-radius: 6px 0 0 6px;
    background: var(--paper-2);
  }
  .page.cover {
    padding: 0;
    background: var(--red);
  }
  .page.cover::before {
    background: var(--red-deep);
  }
  .cover-btn {
    width: 100%;
    height: 100%;
    border: 0;
    border-radius: inherit;
    background: transparent;
    color: var(--on-red);
    display: grid;
    align-content: center;
    justify-items: center;
    gap: 6px;
    padding: 24px 18px 24px 30px;
    font: inherit;
    cursor: pointer;
  }
  .star {
    width: 64px;
    height: 64px;
    fill: var(--yellow);
    margin-bottom: 6px;
  }
  .cover-title {
    font-size: 30px;
    font-weight: 800;
    letter-spacing: 0.18em;
    text-transform: uppercase;
  }
  .cover-sub {
    font-weight: 600;
  }
  .cover-count {
    font-size: var(--fs-small);
    margin-top: 8px;
  }
  .cover-open {
    margin-top: 14px;
    padding: 8px 18px;
    border-radius: var(--radius-pill);
    background: var(--red-deep);
    font-weight: 800;
  }
  h3 {
    font-size: 18px;
    font-weight: 800;
  }
  /* Souvenirs auf dem Regal */
  .shelf,
  .names {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 6px;
  }
  .shelf {
    align-items: end;
    margin-top: 4px;
  }
  h3.later {
    margin-top: 8px;
  }
  /* Personalien wie im Pass: kleine Bezeichnung über dem Eintrag, zwei Spalten. */
  .info {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 14px;
    margin: 0;
  }
  .info dt {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--ink-2);
  }
  .info dd {
    margin: 2px 0 0;
    font-weight: 800;
  }
  .obj {
    width: 100%;
    aspect-ratio: 1;
  }
  /* Noch nicht geschafft: nur der Umriss als flacher Schatten. */
  .obj:not(.got) {
    filter: brightness(0);
    opacity: 0.12;
  }
  :global(:root[data-theme='dark']) .obj:not(.got) {
    filter: brightness(0) invert(1);
    opacity: 0.14;
  }
  .obj.got {
    animation: souvenir-in 600ms var(--ease-spring) both;
    animation-delay: calc(200ms + var(--n, 0) * 90ms);
  }
  .plank {
    height: 10px;
    margin: -14px -4px 0;
    border-radius: 5px;
    background: var(--lantern);
  }
  .names span {
    font-size: 11px;
    font-weight: 700;
    text-align: center;
    color: var(--ink-2);
  }
  .names span.got {
    color: var(--ink);
  }
  /* Stempel: drei Spalten, sechs je Seite */
  .stamps {
    list-style: none;
    margin: 0;
    padding: 0;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px 8px;
  }
  .stamp {
    container-type: inline-size;
    width: 100%;
    aspect-ratio: 1;
    padding: 0;
    border: 0;
    background: transparent;
    color: var(--ink-2);
    font: inherit;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .stamp.got {
    color: var(--stamp);
  }
  .stamp[aria-pressed='true'] .ink {
    scale: 1.08;
  }
  /* Titel und Datum als ein Block mittig im Stempel: mehr Zeilen wachsen nach oben und unten. */
  .ink {
    position: relative;
    display: grid;
    place-items: center;
    align-content: center;
    gap: 3cqw;
    width: 100%;
    height: 100%;
    rotate: var(--rot);
    transition: scale var(--dur-fast) var(--ease-out);
  }
  .ink svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .fg {
    fill: currentColor;
  }
  .bg {
    fill: var(--surface);
  }
  /* Offener Stempel: nur der Umriss verblasst, Text bleibt lesbar (AA) */
  .stamp:not(.got) .ink svg {
    opacity: 0.4;
  }
  .t,
  .d {
    position: relative;
    max-width: 62%;
    text-align: center;
    line-height: 1.05;
  }
  /* Größe aus der Stempelbreite (cqw): das längste Wort füllt höchstens 60 % davon, mit Luft zur inneren Linie. */
  .t {
    font-size: min(9.5cqw, calc(80cqw / var(--w)), calc(25cqw / var(--words)));
    font-weight: 800;
    text-transform: uppercase;
  }
  .stamp:not(.got) .t {
    font-size: 20cqw;
  }
  .d {
    font-size: 8.6cqw;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }
  /* Beim Aufschlagen der Seite knallen die Stempel nacheinander aufs Papier. */
  .stamp.got .ink {
    animation: stamp-down 460ms var(--ease-out) both;
    animation-delay: calc(260ms + var(--i) * 120ms);
  }
  @keyframes stamp-down {
    0% {
      scale: 1.8;
      opacity: 0;
    }
    55% {
      scale: 0.92;
      opacity: 1;
    }
    75% {
      scale: 1.03;
    }
    100% {
      scale: 1;
    }
  }
  @keyframes souvenir-in {
    from {
      transform: translateY(-30px) scale(0.6);
      opacity: 0;
    }
  }
  .folio {
    position: absolute;
    right: 18px;
    bottom: 10px;
    font-size: 12px;
    font-weight: 700;
    color: var(--ink-2);
  }
  .nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 12px;
  }
  .turn {
    width: var(--tap);
    height: var(--tap);
    border: 0;
    border-radius: 50%;
    background: var(--surface);
    color: var(--ink);
    box-shadow: var(--shadow-card);
    display: grid;
    place-items: center;
    cursor: pointer;
  }
  .turn:disabled {
    background: var(--disabled-bg);
    color: var(--disabled-ink);
    box-shadow: none;
    cursor: default;
  }
  .dots {
    display: flex;
    gap: 6px;
  }
  .dots span {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--paper-2);
    transition: width var(--dur) var(--ease-out);
  }
  .dots span.on {
    width: 22px;
    border-radius: 4px;
    background: var(--red);
  }
  .detail {
    margin-top: 10px;
    min-height: 2.6em;
    font-size: var(--fs-small);
    font-weight: 600;
    color: var(--ink-2);
    text-align: center;
  }
  @media (prefers-reduced-motion: reduce) {
    .stamp.got .ink,
    .obj.got {
      animation: none;
    }
  }
</style>
