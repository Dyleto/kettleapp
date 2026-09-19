import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * Une majuscule à l'initiale — et à l'initiale seulement.
 *
 * `Intl.DateTimeFormat('fr-FR')` rend « mardi 30 août 2025 » en minuscules,
 * ce qui est correct : le français n'a pas de majuscule aux jours ni aux
 * mois. Restait à en poser une en début de phrase, et trois endroits le
 * faisaient avec `textTransform="capitalize"` — qui capitalise *chaque mot*.
 * On lisait « Mardi 30 Août 2025 », et « Juillet 2025 — Septembre 2025 » sur
 * l'en-tête du calendrier.
 *
 * `::first-letter` fait exactement ce qui était visé : la première lettre du
 * bloc, et rien d'autre. Elle suit le texte s'il change de langue ou de
 * format, ce qu'une majuscule posée dans la chaîne ne ferait pas.
 */
export const majusculeInitiale: SystemStyleObject = {
  '&::first-letter': { textTransform: 'uppercase' },
};
