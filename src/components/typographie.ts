import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * A capital on the first letter — and on the first letter only.
 *
 * `Intl.DateTimeFormat('fr-FR')` renders "mardi 30 août 2025" in lower case,
 * which is correct: French capitalises neither days nor months. A capital was
 * still needed at the start of a sentence, and three places did it with
 * `textTransform="capitalize"` — which capitalises *every word*. You read
 * "Mardi 30 Août 2025", and "Juillet 2025 — Septembre 2025" on the calendar
 * header.
 *
 * `::first-letter` does exactly what was meant: the block's first letter and
 * nothing else. It follows the text if its language or format changes, which
 * a capital baked into the string would not.
 */
export const majusculeInitiale: SystemStyleObject = {
  '&::first-letter': { textTransform: 'uppercase' },
};
