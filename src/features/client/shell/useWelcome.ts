import { useState } from 'react';
import { useMatch } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { clientService } from '@/features/client/common/client.service';
import { queryKeys } from '@/shared/config/queryKeys';
import storage from '@/shared/utils/storage';
import { CLIENT_ROUTES } from '@/shared/config/routes';

/** La marque « déjà vues », sur cet appareil. */
export const WELCOME_SEEN_KEY = 'kettle:welcome-seen';

/**
 * Faut-il montrer les cartes de bienvenue ?
 *
 * Trois conditions, et chacune a sa raison.
 *
 * - Pas encore vues sur cet appareil : la maquette veut une marque locale,
 *   sans rien demander à l'API.
 * - Un coach au moins : sans lui — un compte créé sans invitation —, la
 *   première carte annoncerait un programme que personne ne prépare.
 * - Aucune séance faite : la marque est locale, et un client qui s'entraîne
 *   depuis des mois les aurait vues sur chaque nouveau téléphone, et sur
 *   l'ancien au jour de cette version. Ce sont des cartes de premier jour.
 *
 * Et seulement sur « Aujourd'hui », où arrive un client qui vient
 * d'accepter son invitation. Ailleurs — « Mon compte » surtout —, la
 * question demanderait le programme, et `verify_states` veut qu'on puisse
 * s'y rendre sans lui pendant une panne.
 *
 * Tant que le programme et l'historique chargent, on attend plutôt que de
 * montrer la question du partage, que les cartes viendraient recouvrir.
 * Une panne de l'un ou l'autre passe les cartes : elles ne valent pas un
 * écran d'erreur.
 */
export const useWelcome = () => {
  const [seen, setSeen] = useState(
    () => storage.getItem(WELCOME_SEEN_KEY) === '1'
  );
  const onToday = !!useMatch({ path: CLIENT_ROUTES.today, end: true });
  const asking = !seen && onToday;
  const program = useQuery({
    queryKey: queryKeys.client.program.get(),
    queryFn: clientService.getProgram,
    enabled: asking,
  });
  const history = useQuery({
    queryKey: queryKeys.client.history.all(),
    queryFn: clientService.getHistory,
    enabled: asking,
  });

  const done = () => {
    storage.setItem(WELCOME_SEEN_KEY, '1');
    setSeen(true);
  };

  const state: 'waiting' | 'show' | 'skip' = !asking
    ? 'skip'
    : program.isLoading || history.isLoading
      ? 'waiting'
      : (program.data?.coaches.length ?? 0) > 0 && history.data?.length === 0
        ? 'show'
        : 'skip';

  return { state, done };
};
