import { COACH_ROUTES } from '@/shared/config/routes';
import { LuUsers, LuDumbbell } from 'react-icons/lu';

/**
 * Les destinations de l'espace coach, à une seule adresse.
 *
 * Le rail de bureau et la barre d'onglets mobile les lisent tous deux ici :
 * une entrée ajoutée à l'un et oubliée à l'autre donnait un écran atteignable
 * au clavier mais introuvable au doigt.
 *
 * `end` sur « Mes clients » parce que sa route est le préfixe de toutes les
 * autres : sans lui, l'onglet resterait allumé jusque dans la bibliothèque.
 */
export const COACH_NAV_ITEMS = [
  { to: COACH_ROUTES.clients, label: 'Mes clients', icon: LuUsers, end: true },
  { to: COACH_ROUTES.exercises, label: 'Bibliothèque', icon: LuDumbbell },
];
