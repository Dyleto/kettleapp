import { useCallback, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { decideUpdate } from '@/shared/updatePolicy';
import { hasUnsavedWork } from '@/shared/hooks/useUnsavedWork';

/**
 * À quelle fréquence demander au serveur s'il y a du neuf.
 *
 * Le navigateur ne vérifie de lui-même qu'au chargement de la page : un
 * onglet laissé ouvert — ce que fait un coach pendant une séance d'écriture —
 * ne découvrait jamais la nouvelle version. Une minute est assez fin pour
 * qu'un correctif arrive sans qu'on y pense, et c'est une requête
 * conditionnelle sur un fichier de quelques kilo-octets.
 */
const CHECK_INTERVAL = 60 * 1000;

interface AppUpdate {
  /** Une nouvelle version attend, et quelque chose empêche de la prendre. */
  pending: boolean;
  /** Prendre la nouvelle version maintenant : la page se recharge. */
  reload: () => void;
}

/**
 * Prend les nouvelles versions sans qu'on ait à recharger à la main.
 *
 * Ce qui ne marchait pas : `registerType: 'autoUpdate'` ne pose
 * `skipWaiting` que dans le service worker. L'enregistrement, lui, était la
 * forme nue que le plugin injecte faute de mieux — un `register('/sw.js')` au
 * chargement, sans vérification ensuite et sans rechargement de la page en
 * cours. La nouvelle version n'arrivait donc qu'au prochain F5.
 *
 * `clientsClaim` donnait aussi la main au nouveau service worker sur une page
 * qui continuait d'exécuter l'ancien paquet : avec dix-neuf routes en
 * `React.lazy`, l'ancienne page demandant son ancien morceau haché pouvait
 * recevoir un 404. `main.tsx` le répare déjà — il écoute `vite:preloadError`
 * et recharge une fois — mais c'est une réparation après coup, que la personne
 * voit passer. D'où `registerType: 'prompt'` : le nouveau service worker
 * attend, l'ancien continue de servir ses propres morceaux, et c'est nous qui
 * choisissons le moment. Il n'y a plus rien à réparer.
 *
 * Le moment, c'est `decideUpdate` qui le dit — et il refuse de recharger
 * par-dessus une frappe non enregistrée.
 */
export const useAppUpdate = (): AppUpdate => {
  /** L'enregistrement, gardé pour pouvoir le réinterroger. */
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, r) {
      setRegistration(r ?? null);
    },
  });

  /** Ce qui change quand l'onglet revient au premier plan, et rien d'autre. */
  const [visible, setVisible] = useState(
    () => typeof document === 'undefined' || !document.hidden
  );

  useEffect(() => {
    const onVisibility = () => setVisible(!document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // ── Demander s'il y a du neuf ────────────────────────────────────────────
  //
  // Le navigateur ne redemande pas de lui-même tant que la page reste
  // ouverte. On interroge donc à intervalle, et au retour sur l'onglet — ce
  // second cas évite d'attendre jusqu'à une minute après être revenu, et
  // c'est le moment où quelqu'un reprend le travail.
  //
  // L'intervalle est nettoyé : sans cela, chaque rechargement à chaud en
  // développement en empilerait un de plus.
  useEffect(() => {
    if (!registration) return;
    const check = () => void registration.update();
    const timer = setInterval(check, CHECK_INTERVAL);
    if (visible) check();
    return () => clearInterval(timer);
  }, [registration, visible]);

  const reload = useCallback(() => {
    void updateServiceWorker(true);
  }, [updateServiceWorker]);

  // `hasUnsavedWork()` se lit ici et non en dépendance : c'est un registre de
  // module, il ne déclenche pas de rendu. La décision est donc reprise à
  // chaque rendu, et ce qui la fait changer — une version qui arrive, un
  // onglet qui revient, une frappe qui part — en provoque un.
  const decision = decideUpdate({
    needRefresh,
    unsaved: hasUnsavedWork(),
    visible,
  });

  useEffect(() => {
    if (decision === 'reload') reload();
  }, [decision, reload]);

  return { pending: decision === 'ask', reload };
};
