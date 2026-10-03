import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * Une majuscule à la première lettre — et à la première seulement.
 *
 * `Intl.DateTimeFormat('fr-FR')` rend « mardi 30 août 2025 » en minuscules, et
 * c'est correct : le français ne capitalise ni les jours ni les mois. Il
 * fallait quand même une majuscule en début de phrase, et trois endroits la
 * posaient avec `textTransform="capitalize"` — qui capitalise *chaque mot*. On
 * lisait « Mardi 30 Août 2025 », et « Juillet 2025 — Septembre 2025 » en tête
 * du calendrier.
 *
 * `::first-letter` fait exactement ce qu'on voulait dire : la première lettre
 * du bloc et rien d'autre. Elle suit le texte si sa langue ou son format
 * change, ce qu'une majuscule cuite dans la chaîne ne ferait pas.
 */
export const initialCapital: SystemStyleObject = {
  '&::first-letter': { textTransform: 'uppercase' },
};
