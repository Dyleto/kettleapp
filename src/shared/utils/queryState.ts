import axios from 'axios';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Une requête qui n'a rien à montrer et qui n'est pas en train de chercher.
 *
 * `isError` ne suffit pas, et c'est le piège. Quand l'appareil passe hors
 * connexion, React Query met la requête en pause au lieu de la faire
 * échouer : elle n'est ni en erreur ni en chargement, elle n'a simplement
 * pas de donnée. Un écran qui ne regardait que `isLoading` et `isError`
 * tombait alors sur son état vide — « Pas encore de programme » pour un
 * client sans réseau.
 *
 * À l'inverse, une relecture qui échoue alors qu'on a déjà une donnée n'est
 * pas une indisponibilité : `isError` est vrai, mais il y a toujours quelque
 * chose à afficher, et l'effacer pour montrer une panne serait une
 * régression. C'est donc l'absence de donnée qui décide, pas l'erreur.
 */
export const isUnavailable = (
  query: Pick<UseQueryResult, 'data' | 'isLoading'>
): boolean => query.data === undefined && !query.isLoading;

/** Le code que le serveur a renvoyé, quand il a répondu quelque chose. Une
 * coupure de réseau n'en porte aucun : c'est ce qui la distingue d'un refus. */
const statusOf = (error: unknown): number | undefined =>
  axios.isAxiosError(error) ? error.response?.status : undefined;

/**
 * Le serveur a répondu, et il a dit que la chose n'existe pas.
 *
 * Ce n'est pas une panne : proposer « Réessayer » devant un client supprimé
 * ou un lien périmé promet un résultat qui ne viendra jamais.
 */
export const isNotFound = (error: unknown): boolean => statusOf(error) === 404;

/**
 * Le serveur a répondu non — 400 à 499.
 *
 * Redemander ne changera pas sa réponse. React Query retentait pourtant
 * trois fois, en doublant l'attente : mesuré, une adresse de client inconnue
 * tournait sept secondes avant de dire quoi que ce soit.
 */
export const isRefusal = (error: unknown): boolean => {
  const status = statusOf(error);
  return status !== undefined && status >= 400 && status < 500;
};
