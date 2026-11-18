import { COACH_ROUTES } from '@/shared/config/routes';
import { LuBookOpen, LuInbox, LuLayoutGrid, LuUsers } from 'react-icons/lu';
import type { NavEntry } from '@/kit';

/**
 * Les destinations de l'espace coach, à une seule adresse.
 *
 * Le rail et la barre d'onglets les lisent tous deux ici : une entrée
 * ajoutée à l'un et oubliée à l'autre donnait un écran atteignable au
 * clavier mais introuvable au doigt.
 *
 * « À lire » d'abord, et seul à porter un compteur : c'est ce que le coach
 * vient faire en ouvrant Kettle. `end` sur lui parce que sa route est le
 * préfixe de toutes les autres — sans lui, l'onglet resterait allumé jusque
 * dans les exercices.
 *
 * Les libellés nomment ce qu'on y trouve, sans possessif ni métaphore :
 * « Mes clients » et « Bibliothèque » demandaient chacun un instant de
 * traduction, et un onglet se lit en passant.
 */
export const coachNavItems = (unread: number): NavEntry[] => [
  {
    to: COACH_ROUTES.inbox,
    label: 'À lire',
    icon: LuInbox,
    end: true,
    count: unread,
  },
  { to: COACH_ROUTES.clients, label: 'Clients', icon: LuUsers },
  { to: COACH_ROUTES.templates, label: 'Modèles', icon: LuLayoutGrid },
  { to: COACH_ROUTES.exercises, label: 'Exercices', icon: LuBookOpen },
];
