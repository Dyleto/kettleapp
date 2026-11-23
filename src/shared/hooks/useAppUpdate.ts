import { useCallback, useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { decideUpdate } from '@/shared/updatePolicy';
import {
  flushUnsavedWork,
  hasUnsavedWork,
  isBusy,
  useUnsavedWorkChanges,
} from '@/shared/hooks/useUnsavedWork';

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
  /**
   * « Maintenant » : envoie tout de suite ce qui attend. Le rechargement
   * suit de lui-même, dès que le registre dit que plus rien n'est à perdre
   * — recharger avant, ce serait perdre ce qu'on vient d'envoyer.
   */
  installNow: () => void;
}

/** Ce que le banc appelle pour simuler une nouvelle version, en
 * développement seulement : un service worker ne s'y met pas à jour. */
declare global {
  interface Window {
    __kettleNewVersion?: () => void;
  }
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
    needRefresh: [swNeedsRefresh],
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

  // ── Une version simulée, pour le banc ────────────────────────────────────
  //
  // En développement, aucun service worker ne s'installe : sans cette porte,
  // le bandeau et ses règles ne s'éprouveraient que sur la production.
  // Absente du paquet de production — `import.meta.env.DEV` y vaut `false`.
  const [simulated, setSimulated] = useState(false);
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    window.__kettleNewVersion = () => setSimulated(true);
    return () => {
      delete window.__kettleNewVersion;
    };
  }, []);
  const needRefresh = swNeedsRefresh || simulated;

  const reload = useCallback(() => {
    if (!simulated) {
      void updateServiceWorker(true);
      return;
    }
    // Un tour plus tard, comme en production, où le rechargement attend que
    // le nouveau service worker ait pris la main. Immédiat, il était annulé
    // par le retour d'historique que fait la sortie d'une séance : la
    // version simulée ne s'installait jamais à la fin d'une séance.
    setTimeout(() => window.location.reload(), 0);
  }, [simulated, updateServiceWorker]);

  // Le registre se lit ici, mais son abonnement redessine ce hook à chaque
  // changement : une frappe qui part, une séance qui se ferme. Sans lui, la
  // décision n'était reprise qu'au prochain rendu de hasard.
  useUnsavedWorkChanges();
  const decision = decideUpdate({
    needRefresh,
    unsaved: hasUnsavedWork(),
    busy: isBusy(),
    visible,
  });

  useEffect(() => {
    if (decision === 'reload') reload();
  }, [decision, reload]);

  return { pending: decision === 'ask', installNow: flushUnsavedWork };
};
