import { COACH_ROUTES } from '@/shared/config/routes';
import { LuUsers, LuDumbbell, LuLayoutTemplate } from 'react-icons/lu';

/**
 * Les destinations de l'espace coach, à une seule adresse.
 *
 * Le rail de bureau et la barre d'onglets mobile les lisent tous deux ici :
 * une entrée ajoutée à l'un et oubliée à l'autre donnait un écran atteignable
 * au clavier mais introuvable au doigt.
 *
 * `end` sur « Clients » parce que sa route est le préfixe de toutes les
 * autres : sans lui, l'onglet resterait allumé jusque dans les exercices.
 *
 * Les libellés nomment ce qu'on y trouve, sans possessif ni métaphore :
 * « Mes clients » et « Bibliothèque » demandaient chacun un instant de
 * traduction, et un onglet se lit en passant.
 */
export const COACH_NAV_ITEMS = [
  { to: COACH_ROUTES.clients, label: 'Clients', icon: LuUsers, end: true },
  {
    to: COACH_ROUTES.templates,
    label: 'Modèles',
    icon: LuLayoutTemplate,
  },
  { to: COACH_ROUTES.exercises, label: 'Exercices', icon: LuDumbbell },
];
