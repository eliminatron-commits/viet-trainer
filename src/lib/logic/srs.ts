import type { DateKey, ItemProgress, ProgressKey } from '../storage/state';

/** Wiederholungsabstand in Tagen je Box 1–5. */
export const INTERVALS = [1, 2, 4, 8, 16] as const;

/** Kalendertag + n Tage. Rechnet in UTC, damit Sommerzeitwechsel keinen Tag verschlucken. */
export function addDays(day: DateKey, n: number): DateKey {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export const isDue = (p: ItemProgress, today: DateKey) => p.due <= today;

/** Erstes Zeigen (Vorstellkarte): zählt als gesehen, plant aber noch nichts ein. */
export function markSeen(p: ItemProgress | undefined, today: DateKey): ItemProgress {
  if (p) return { ...p, seen: p.seen + 1 };
  return { box: 1, due: today, seen: 1, right: 0, wrong: 0 };
}

/**
 * Datumsbasiertes Leitner-Verfahren.
 * - Erste richtige Antwort: Box 1, morgen wieder.
 * - Richtig und fällig: eine Box höher, Abstand laut INTERVALS.
 * - Richtig, aber noch nicht fällig (z. B. zweimal in einer Session): nur Statistik.
 * - Falsch: eine Box tiefer (nicht zurück auf 1), morgen wieder.
 */
export function answerItem(p: ItemProgress | undefined, correct: boolean, today: DateKey): ItemProgress {
  const base = p ?? { box: 1, due: today, seen: 0, right: 0, wrong: 0 };
  const next: ItemProgress = { ...base, seen: base.seen + 1 };
  if (!correct) {
    next.wrong++;
    next.box = Math.max(1, base.box - 1) as ItemProgress['box'];
    next.due = addDays(today, 1);
    return next;
  }
  next.right++;
  if (base.right === 0) {
    next.box = 1;
    next.due = addDays(today, INTERVALS[0]);
  } else if (isDue(base, today)) {
    next.box = Math.min(5, base.box + 1) as ItemProgress['box'];
    next.due = addDays(today, INTERVALS[next.box - 1]!);
  }
  return next;
}

/**
 * Anzahl fälliger Einheiten für heute und die folgenden Tage (kumulativ: fällig an oder vor dem Tag).
 * Die App meldet das beim Session-Ende an den Push-Worker für die Morgen-Erinnerung.
 */
export function dueForecast(
  items: Partial<Record<ProgressKey, ItemProgress>>,
  today: DateKey,
  days = 14,
): Record<DateKey, number> {
  const out: Record<DateKey, number> = {};
  const dues = Object.values(items).map((p) => p!.due);
  for (let i = 0; i < days; i++) {
    const day = addDays(today, i);
    out[day] = dues.filter((d) => d <= day).length;
  }
  return out;
}
