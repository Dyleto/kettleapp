import { createContext, useContext } from 'react';
import type { ClientCoach } from '@/shared/types';

/** Comment nommer le coach du client, selon la place du mot dans la phrase. */
export interface CoachVoice {
  /** Placé en cours de phrase : « Envoyer à Julie », « Envoyer à ton
   * coach ». */
  inline: string;
  /** En tête de phrase : « Julie verra… », « Ton coach verra… ». */
  opening: string;
}

const UNNAMED: CoachVoice = { inline: 'ton coach', opening: 'Ton coach' };

/**
 * Le nom sous lequel les écrans du client parlent de son coach.
 *
 * Le client lisait « ton coach » partout : « Envoyer à ton coach », « Ton
 * coach ne l'a pas encore lue ». La maquette nomme — « Envoyer à Julie » —
 * parce que c'est à quelqu'un qu'on envoie, pas à une fonction.
 *
 * Le prénom, quand il n'y a qu'un coach et qu'il en a un. Avec deux coachs,
 * en nommer un seul serait faux une fois sur deux, et « Julie et Marc
 * verront ton ressenti » ne dit pas lequel répondra : on revient à « ton
 * coach ». Sans prénom — un compte créé avec une adresse seule —, de même.
 */
export const coachVoice = (
  coaches: readonly ClientCoach[] = []
): CoachVoice => {
  const name = coaches.length === 1 ? coaches[0].firstName.trim() : '';
  return name ? { inline: name, opening: name } : UNNAMED;
};

/**
 * Le nom du coach, pour tout ce qui s'affiche sous le programme du client.
 *
 * Un contexte et non une propriété : une quinzaine d'écrans le disent, du
 * ressenti à la scène d'un AMRAP, et le faire descendre de main en main à
 * travers la séance guidée aurait ajouté un paramètre à chaque étage pour un
 * mot. Hors du programme — la connexion, le compte — rien ne le fournit, et
 * l'on y lit « ton coach ».
 */
export const CoachVoiceContext = createContext<CoachVoice>(UNNAMED);

/** Comment nommer le coach, ici. */
export const useCoachVoice = (): CoachVoice => useContext(CoachVoiceContext);
