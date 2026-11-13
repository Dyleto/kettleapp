import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router';
import { useAuth } from '@/shared/contexts/useAuth';
import { getDefaultRoleRoute } from '@/shared/config/routes';
import { ActionButton } from './ActionButton';
import { FullScreenState } from './FullScreenState';

/** Ce qu'on dit quand l'application a planté. Partagé avec `ErrorBoundary`,
 * qui attrape ce que le routeur ne voit pas : deux écrans pour la même
 * panne ne doivent pas la raconter différemment. */
export const CRASH_TITLE = 'Quelque chose a cassé';
export const CRASH_LINE =
  "Ce n'est pas toi. Recharge la page : si tu étais en pleine séance, elle est gardée sur ton appareil.";

/**
 * Deux écrans, parce que ce sont deux situations.
 *
 * Une adresse qui n'existe pas n'est pas une panne : y proposer « Recharger
 * la page » était faux deux fois — cela ne peut pas marcher, et cela laisse
 * croire que l'application est cassée alors qu'il suffit de repartir de
 * l'accueil. Une vraie erreur d'exécution, elle, se recharge utilement.
 *
 * La phrase du plantage ne promet que ce qui est vrai : la séance guidée
 * s'enregistre sur l'appareil à chaque série. Elle ne dit rien d'un
 * programme en cours d'écriture, dont la dernière seconde de frappe peut ne
 * pas être partie.
 */
export function RouteError() {
  const error = useRouteError();
  const navigate = useNavigate();
  const { user } = useAuth();

  const notFound = isRouteErrorResponse(error) && error.status === 404;

  // Une adresse inconnue n'a rien à signaler : seules les vraies erreurs
  // méritent la console.
  if (!notFound) console.error('Route error:', error);

  if (notFound) {
    return (
      <FullScreenState
        mood="oops"
        title="Cette page n'existe pas"
        line="L'adresse a peut-être changé, ou il en manque un bout."
        action={
          <ActionButton
            size="md"
            onClick={() =>
              navigate(getDefaultRoleRoute(user), { replace: true })
            }
          >
            Revenir à l'accueil
          </ActionButton>
        }
      />
    );
  }

  return (
    <FullScreenState
      mood="oops"
      title={CRASH_TITLE}
      line={CRASH_LINE}
      action={
        <ActionButton size="md" onClick={() => window.location.reload()}>
          Recharger
        </ActionButton>
      }
    />
  );
}
