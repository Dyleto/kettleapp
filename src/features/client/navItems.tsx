import { CLIENT_ROUTES } from '@/shared/config/routes';
import { LuHouse, LuListChecks, LuHistory } from 'react-icons/lu';

/**
 * Les destinations de l'espace client, à une seule adresse.
 *
 * Le rail de bureau et la barre d'onglets mobile les lisent tous deux ici :
 * une entrée ajoutée à l'un et oubliée à l'autre donnait un écran atteignable
 * au clavier mais introuvable au doigt.
 *
 * `end` sur « Aujourd'hui » parce que sa route est le préfixe de toutes les
 * autres : sans lui, l'onglet resterait allumé jusque dans l'historique.
 */
export const CLIENT_NAV_ITEMS = [
  { to: CLIENT_ROUTES.today, label: "Aujourd'hui", icon: LuHouse, end: true },
  { to: CLIENT_ROUTES.program, label: 'Programme', icon: LuListChecks },
  { to: CLIENT_ROUTES.history, label: 'Historique', icon: LuHistory },
];
