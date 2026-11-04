import { isDark, msUntilSwitch, type ThemeMode } from './logic/theme';
import { transitionTo } from './motion';

/**
 * Tag/Nacht der App: setzt `data-theme` am Wurzelelement (Tokens in tokens.css, Nachtszenen lesen `theme.dark`).
 * Im Automatik-Modus wechselt sie um 9:00 und 20:00 Uhr von selbst – auch, wenn die App gerade offen ist –
 * und prüft beim Zurückkehren aus dem Hintergrund nach (Timer schlafen dort).
 */
export const theme = $state({ mode: 'auto' as ThemeMode, dark: false });

/** Grundfarben für die Statusleiste (meta theme-color), wie --paper hell/dunkel. */
const BAR = { light: '#FBF5EC', dark: '#131A2E' };

let timer: ReturnType<typeof setTimeout> | undefined;

function apply(dark: boolean, animate: 'tap' | 'sky' | false): void {
  const root = document.documentElement;
  if (root.dataset.theme && dark === theme.dark) return;
  const set = () => {
    theme.dark = dark;
    root.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? BAR.dark : BAR.light);
  };
  if (!animate) return set();
  // Von Hand: Kreis vom Tippunkt; von selbst: vom Himmel oben rechts, wo Sonne und Mond stehen.
  transitionTo(set, 'theme', animate === 'sky' ? { x: innerWidth - 56, y: 80 } : undefined);
}

function refresh(animate: 'tap' | 'sky' | false): void {
  clearTimeout(timer);
  const now = new Date();
  apply(isDark(theme.mode, now), animate);
  if (theme.mode === 'auto') timer = setTimeout(() => refresh('sky'), msUntilSwitch(now) + 500);
}

/** Beim Start vor dem Einhängen der App: nach Uhrzeit, bis der Spielstand geladen ist. */
export function initTheme(): void {
  refresh(false);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') refresh('sky');
  });
}

/** Gespeicherten Modus übernehmen (nach dem Laden ohne, in den Einstellungen mit Übergang). */
export function setThemeMode(mode: ThemeMode, animate: 'tap' | false = 'tap'): void {
  theme.mode = mode;
  refresh(animate);
}
