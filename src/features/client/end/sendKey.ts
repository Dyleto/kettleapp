import {
  readProgress,
  writeProgress,
} from '@/features/client/guided/sessionProgress';

/**
 * Une clé d'envoi neuve : trente-deux caractères hexadécimaux, ou un UUID.
 *
 * `randomUUID` n'existe que dans un contexte sûr — HTTPS, ou `localhost`.
 * Ouverte en HTTP depuis un téléphone du réseau local, en développement,
 * l'application doit envoyer quand même : `getRandomValues`, lui, existe
 * partout.
 */
export const newSendKey = (source: Crypto = globalThis.crypto): string =>
  typeof source.randomUUID === 'function'
    ? source.randomUUID()
    : Array.from(source.getRandomValues(new Uint8Array(16)), (byte) =>
        byte.toString(16).padStart(2, '0')
      ).join('');

/**
 * La clé d'envoi de cette séance : celle déjà posée, sinon une neuve,
 * gardée aussitôt.
 *
 * Gardée avant le premier envoi et non après : c'est quand la réponse se
 * perd que la clé sert, et l'appareil n'apprend alors rien — il ne saurait
 * pas qu'il fallait la garder. Elle s'efface avec l'enregistrement, quand le
 * serveur a le bilan.
 *
 * Sans stockage (navigation privée), elle vit le temps de cet envoi : il n'y
 * aura pas de renvoi, puisque rien n'est gardé pour lui.
 */
export const sendKeyFor = (
  sessionId: string,
  make: () => string = newSendKey
): string => {
  const kept = readProgress(sessionId)?.sendKey;
  if (kept) return kept;
  const sendKey = make();
  writeProgress(sessionId, { sendKey });
  return sendKey;
};
