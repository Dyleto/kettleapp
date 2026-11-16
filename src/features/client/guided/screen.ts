import { useEffect } from 'react';
import { unlockSound } from '@/features/client/sound/sound';

/**
 * Ce que la séance guidée demande à l'appareil tant qu'elle est ouverte.
 *
 * Trois effets qui ne dépendent ni de l'étape ni de la scène, et qui vivaient
 * au milieu des quatorze états du composant de la séance.
 */

/**
 * Tout ce qui n'est pas la séance devient inerte.
 *
 * Le plein écran se posait par-dessus la page sans la neutraliser : quatre
 * tabulations suffisaient à en sortir, on atterrissait dans la barre
 * d'onglets et sur les boutons de la fiche dessous, et un lecteur d'écran
 * annonçait encore toute la page. D'où le portail hors de `#root`, sans quoi
 * la séance se neutraliserait avec le reste.
 *
 * `aria-hidden` en plus : un navigateur qui ne connaît pas `inert` (Safari
 * avant 15.5) garderait sinon toute la page dans l'arbre d'accessibilité.
 * Depuis que la fiche porte « Reprendre », un lecteur d'écran y aurait
 * annoncé deux boutons du même nom — celui de la pause et celui de la fiche.
 */
export const useInertRoot = () => {
  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;
    root.setAttribute('inert', '');
    root.setAttribute('aria-hidden', 'true');
    return () => {
      root.removeAttribute('inert');
      root.removeAttribute('aria-hidden');
    };
  }, []);
};

/**
 * L'écran reste allumé : sans cela il s'éteint entre deux exercices, et il
 * faut le déverrouiller les mains moites.
 *
 * Le verrou se perd quand l'onglet passe en arrière-plan ; il se redemande
 * au retour. Un refus — écran inactif, permission — n'est pas une erreur :
 * la séance continue, l'écran s'éteindra.
 */
export const useWakeLock = () => {
  useEffect(() => {
    if (!('wakeLock' in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    const requestLock = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinel = lock;
      } catch {
        // Refusé ou indisponible : tant pis.
      }
    };

    requestLock();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinel) {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', handleVisibility);
      sentinel?.release().catch(() => {});
    };
  }, []);
};

/**
 * La sortie audio s'ouvre à la première touche faite dans la séance.
 *
 * Un navigateur refuse tout son qu'aucun geste n'a autorisé, et le premier
 * bip est déclenché par l'horloge, pas par un doigt : sans cette ouverture,
 * il serait refusé. À l'échelle du document et en capture, parce que la
 * séance se dessine dans plusieurs portails et qu'un seul écouteur doit tous
 * les couvrir.
 */
export const useSoundUnlock = () => {
  useEffect(() => {
    document.addEventListener('click', unlockSound, true);
    document.addEventListener('keydown', unlockSound, true);
    return () => {
      document.removeEventListener('click', unlockSound, true);
      document.removeEventListener('keydown', unlockSound, true);
    };
  }, []);
};
