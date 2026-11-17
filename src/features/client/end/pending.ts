import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { CompletedSession, Session } from '@/shared/types';
import {
  clientService,
  type CompleteSessionPayload,
} from '@/features/client/common/client.service';
import type { CoachVoice } from '@/features/client/common/coach';
import {
  forgetProgress,
  readProgress,
  writeProgress,
  type PendingFeeling,
} from '@/features/client/guided/sessionProgress';
import { sessionName } from '@/domain/session/name';
import { queryKeys } from '@/shared/config/queryKeys';
import { toaster } from '@/shared/components/ui/toasterInstance';
import { isRefusal } from '@/shared/utils/queryState';
import { completionPayload } from './sending';

/**
 * Un bilan qui n'a pas pu partir, et qui part quand le réseau revient.
 *
 * Sans réseau, l'envoi du ressenti attendait en mémoire : React Query met
 * une requête en pause hors connexion. Le bouton tournait sans rien dire,
 * et quitter l'écran la perdait — ou pire, elle repartait plus tard sans
 * que personne n'efface l'enregistrement, qui aurait été renvoyé.
 *
 * Le ressenti est maintenant gardé sur l'appareil, dans l'enregistrement de
 * la séance, et il part seul : au retour du réseau, ou à la prochaine
 * ouverture de l'application.
 *
 * Deux gardes contre le doublon, qui ne se remplacent pas. Ici, deux envois
 * qui se croisent partagent la même requête. Mais une réponse perdue en
 * route — le serveur a enregistré, l'appareil ne l'a pas su — ne se voit
 * que du serveur : chaque essai porte la même clé d'envoi (`sendKeyFor`), et
 * il reconnaît ce qu'il a déjà.
 */

/**
 * Les envois en cours, par séance.
 *
 * Deux chemins envoient le même bilan : l'écran du ressenti, et le retour du
 * réseau. S'ils se croisent — on touche « Envoyer maintenant » à l'instant
 * où le réseau revient — ils partagent la même requête. Une séance comptée
 * deux fois fausserait la semaine.
 */
const inFlight = new Map<string, Promise<CompletedSession>>();

/** Envoie le bilan d'une séance, une seule fois à la fois. */
export const sendCompletion = (
  sessionId: string,
  payload: CompleteSessionPayload
): Promise<CompletedSession> => {
  const running = inFlight.get(sessionId);
  if (running) return running;
  const request = clientService
    .completeSession(sessionId, payload)
    .finally(() => inFlight.delete(sessionId));
  inFlight.set(sessionId, request);
  return request;
};

/**
 * Garde le ressenti pour le retour du réseau.
 *
 * La date est figée maintenant : partie le lendemain, la séance ne doit pas
 * changer de jour. Une date déjà choisie — « Ce n'était pas aujourd'hui » —
 * reste la sienne.
 */
export const queueFeeling = (
  sessionId: string,
  feeling: Omit<PendingFeeling, 'completedAt'> & { completedAt?: string },
  now: Date = new Date()
) =>
  writeProgress(sessionId, {
    pending: {
      ...feeling,
      completedAt: feeling.completedAt ?? now.toISOString(),
    },
  });

/** Ce qu'un envoi en attente a donné. */
export interface FlushOutcome {
  session: Session;
  /** Parti ; sinon, refusé par le serveur. */
  sent: boolean;
}

/**
 * Envoie les ressentis en attente, une séance après l'autre.
 *
 * Parti, l'enregistrement s'efface : c'est le seul moment où il le fait.
 * Refusé — la séance n'existe plus, une valeur hors bornes —, réessayer ne
 * changera rien : le ressenti en attente est retiré, la séance redevient
 * « à valider », et on peut le redire. Une coupure, ou un serveur en panne,
 * laisse tout en place et arrête la tournée : les suivantes n'auraient pas
 * plus de chance.
 */
export const flushPending = async (
  sessions: readonly Session[]
): Promise<FlushOutcome[]> => {
  const outcomes: FlushOutcome[] = [];
  for (const session of sessions) {
    const saved = readProgress(session._id);
    if (!saved?.pending) continue;
    try {
      await sendCompletion(
        session._id,
        completionPayload(saved, saved.pending, saved.performed)
      );
      forgetProgress(session._id);
      outcomes.push({ session, sent: true });
    } catch (error) {
      if (!isRefusal(error)) break;
      writeProgress(session._id, { pending: undefined });
      outcomes.push({ session, sent: false });
    }
  }
  return outcomes;
};

/**
 * Les ressentis en attente partent seuls : à l'ouverture, et à chaque
 * retour du réseau. Rend de quoi les envoyer tout de suite — « Envoyer
 * maintenant » sur l'accueil et sur la fiche.
 *
 * Monté une fois, dans `useClientSessions`, que seule la frontière de
 * l'espace client appelle : deux écouteurs du retour du réseau enverraient
 * deux fois, n'était le partage des requêtes en cours.
 */
export const usePendingSends = (
  sessions: readonly Session[],
  coach: CoachVoice
) => {
  const queryClient = useQueryClient();

  const flush = useCallback(async () => {
    // Le navigateur se sait hors connexion : une requête n'apprendrait
    // rien de plus, et chaque tentative coûte une coupure de plus à lire.
    if (!navigator.onLine) return [];
    const outcomes = await flushPending(sessions);
    if (outcomes.length === 0) return outcomes;
    void queryClient.invalidateQueries({
      queryKey: queryKeys.client.history.all(),
    });
    outcomes.forEach(({ session, sent }) =>
      toaster.create(
        sent
          ? {
              title: 'Séance envoyée',
              description: `${coach.opening} a reçu ton bilan de « ${sessionName(session)} ».`,
              type: 'success',
            }
          : {
              title: 'Ton bilan n’est pas parti',
              description: `« ${sessionName(session)} » reste sur ce téléphone : redis comment c’était depuis l’accueil.`,
              type: 'error',
            }
      )
    );
    return outcomes;
  }, [sessions, coach, queryClient]);

  useEffect(() => {
    if (sessions.length === 0) return;
    if (navigator.onLine) void flush();
    const onOnline = () => void flush();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [flush, sessions.length]);

  // Un geste demande une réponse : toucher « Envoyer maintenant » toujours
  // sans réseau ne laissait rien paraître, et l'on retouchait.
  return useCallback(async () => {
    const outcomes = await flush();
    if (outcomes.length === 0)
      toaster.create({
        title: 'Toujours pas de réseau',
        description:
          'Ton ressenti est gardé : il partira seul dès qu’il revient.',
        type: 'info',
      });
  }, [flush]);
};
