/** Build-Stand für die Versionszeile in den Einstellungen – vite.config.ts setzt __APP_BUILD__ beim Bauen. */
export interface BuildInfo {
  version: string;
  commit: string;
  /** ISO-Zeitpunkt des Builds */
  time: string;
}

declare const __APP_BUILD__: BuildInfo | undefined;

export const BUILD: BuildInfo = typeof __APP_BUILD__ === 'undefined' ? { version: 'dev', commit: '', time: '' } : __APP_BUILD__;

const STAMP = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });

/** „Version 2.0.0 · 05.11.2026, 18:20 · 7ed930e“ – Zeit in Berliner Ortszeit. */
export function buildLabel(b: BuildInfo): string {
  return [`Version ${b.version}`, b.time && STAMP.format(new Date(b.time)), b.commit].filter(Boolean).join(' · ');
}
