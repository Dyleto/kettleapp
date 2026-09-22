/**
 * A local day key, "2026-03-07".
 *
 * `toISOString()` shifts to UTC: a session recorded at 10 pm in Paris would
 * land on the previous day in the grid. So we read the date as the coach's
 * browser displays it.
 */
export const dayKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/** "lundi 7 mars" — the selected day's header. */
export const formatDayLabel = (key: string): string => {
  const [year, month, day] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(year, month - 1, day));
};

// ─── The week's vocabulary ─────────────────────────────────────────────────
// Monday = 0 everywhere in the app: the French week does not start on Sunday,
// and `Date.getDay()` does.

/** The calendar's seven letters — compact, but L/M/M and S/D blur together. */
export const WEEKDAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;

/** Three letters: what is needed once a day must be chosen, not merely read. */
export const WEEKDAY_SHORT = [
  'Lun',
  'Mar',
  'Mer',
  'Jeu',
  'Ven',
  'Sam',
  'Dim',
] as const;

export const WEEKDAY_FULL = [
  'lundi',
  'mardi',
  'mercredi',
  'jeudi',
  'vendredi',
  'samedi',
  'dimanche',
] as const;

/** Monday = 0: the French week does not start on Sunday. */
export const mondayIndex = (date: Date): number => (date.getDay() + 6) % 7;

/** The Monday of the week containing `from`, at local midnight. */
export const startOfWeek = (from: Date): Date => {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  d.setDate(d.getDate() - mondayIndex(d));
  return d;
};

/**
 * "le lundi", "le lundi et le jeudi", "le lundi, le mercredi et le vendredi".
 * Nothing at all when no day is suggested — the absence of a suggestion does
 * not announce itself, it stays silent.
 */
export const formatSuggestedDays = (days?: number[]): string => {
  const valid = [...new Set(days ?? [])]
    .filter((d) => Number.isInteger(d) && d >= 0 && d <= 6)
    .sort((a, b) => a - b);
  if (valid.length === 0) return '';
  const names = valid.map((d) => `le ${WEEKDAY_FULL[d]}`);
  if (names.length === 1) return names[0];
  return `${names.slice(0, -1).join(', ')} et ${names[names.length - 1]}`;
};
