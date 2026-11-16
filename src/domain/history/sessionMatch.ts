import {
  BlockSnapshot,
  CompletedSession,
  Session,
  SessionBlock,
} from '@/shared/types';

/**
 * Cette séance a-t-elle déjà été faite — cette séance-là, pas son
 * identifiant ?
 *
 * L'écran du programme répondait avec `originalSessionId`, et cet identifiant
 * survit à une modification. Retour du terrain : « j'ai modifié mon programme
 * en changeant les séances plutôt qu'en les supprimant et en les recréant,
 * donc elles ont gardé le même id, et ça me met une séance comme terminée
 * alors que je ne l'ai jamais faite. »
 *
 * Un identifiant dit où une séance se trouve dans le programme. Il ne dit
 * rien de ce qu'elle contient. Un coach qui réécrit la séance 2 de fond en
 * comble laisse l'identifiant intact, et l'on annonce au client qu'il a déjà
 * fait quelque chose qui n'existait pas la semaine dernière.
 *
 * On compare donc le contenu. Chaque bilan porte `blocks` — un instantané de
 * la séance telle qu'elle était ce jour-là — qui est exactement ce qu'il
 * faut, et qui est déjà en main : rien à demander à l'API.
 */
export type SessionMatch =
  /** Même contenu qu'un bilan enregistré. `on` est le plus récent. */
  | { state: 'done'; on: Date }
  /** Faite sous une autre forme : l'identifiant correspond, le contenu
   * non. */
  | { state: 'changed' }
  /** Aucun bilan ne porte cet identifiant. */
  | { state: 'never' };

/**
 * Ce qui décrit le travail à faire, et rien d'autre.
 *
 * Deux séances sont la même séance quand ce qu'il y a à faire est le même. Ce
 * qui laisse dehors, délibérément :
 *
 *   — les noms et les étiquettes, sur la séance comme sur les blocs :
 *     renommer « Full body A » en « Full body » ne change rien à ce qu'on
 *     fait ;
 *   — les consignes du coach, pour la même raison — elles décrivent le
 *     comment, pas le quoi ;
 *   — tout ce qui a été réalisé (charges, tours bouclés) : c'est la réponse,
 *     pas la question.
 *
 * Un changement de charge, de répétitions ou de tours rompt bien la
 * correspondance, et c'est tout l'intérêt : le coach en a fait une autre
 * séance exprès.
 */
const doseOf = (block: SessionBlock | BlockSnapshot): string => {
  // C'est le tri qui porte la suite, et non le numéro.
  //
  // Le numéro y figurait aussi. Il n'ajoutait rien — l'atelier renumérote
  // de 1 à n à chaque retrait et à chaque déplacement, si bien que le numéro
  // est entièrement déterminé par la position — et il pouvait nuire : des
  // rangs devenus non contigus auraient fait lire « modifiée depuis » sur une
  // séance dont le travail n'a pas changé d'un gramme. Un sabotage l'a
  // montré, en retirant le champ sans qu'aucun test ne tombe.
  const exercises = [...block.exercises]
    .sort((a, b) => a.order - b.order)
    .map((ex) => {
      // L'exercice d'un instantané est un enregistrement sans type — il est
      // passé par l'API et en est revenu. Seule son identité est lue ici.
      const id =
        typeof ex.exercise === 'object' && ex.exercise !== null
          ? String((ex.exercise as { _id?: unknown })._id ?? '')
          : String(ex.exercise ?? '');
      return [
        id,
        ex.sets ?? '',
        ex.restBetweenSets ?? '',
        ex.reps ?? '',
        ex.duration ?? '',
        ex.customMetric
          ? `${ex.customMetric.value}${ex.customMetric.unit}`
          : '',
      ].join(':');
    })
    .join('|');

  return [
    block.type,
    block.durationMinutes ?? '',
    block.intervalMinutes ?? '',
    block.rounds ?? '',
    block.restBetweenRounds ?? '',
    block.workDuration ?? '',
    block.restDuration ?? '',
    (block.repsScheme ?? []).join(','),
    exercises,
  ].join(';');
};

/** La dose de toute la séance, ordre des blocs compris. */
export const sessionDose = (blocks: (SessionBlock | BlockSnapshot)[]): string =>
  [...blocks]
    .sort((a, b) => a.order - b.order)
    .map(doseOf)
    .join('\n');

/**
 * Quand cette séance a été faite pour la dernière fois sous la forme qu'elle
 * a aujourd'hui.
 *
 * Trois réponses, et c'est celle du milieu qui explique pourquoi il y en a
 * trois. Dire « jamais faite » d'une séance que le client a faite la semaine
 * dernière — sous une autre forme — serait vrai à la lettre et faux à
 * l'oreille. `changed` dit ce qui s'est réellement passé : tu l'as faite,
 * ce n'est plus la même.
 */
export const matchSession = (
  session: Session,
  history: CompletedSession[]
): SessionMatch => {
  const onThisId = history.filter((h) => h.originalSessionId === session._id);
  if (onThisId.length === 0) return { state: 'never' };

  const dose = sessionDose(session.blocks);
  const sameDose = onThisId.filter((h) => sessionDose(h.blocks ?? []) === dose);
  if (sameDose.length === 0) return { state: 'changed' };

  const latest = sameDose.reduce((best, h) =>
    new Date(h.completedAt) > new Date(best.completedAt) ? h : best
  );
  return { state: 'done', on: new Date(latest.completedAt) };
};

/** « Faite le 12 sept. », « Modifiée depuis », « Jamais faite ». */
export const matchLabel = (match: SessionMatch): string => {
  if (match.state === 'never') return 'Jamais faite';
  if (match.state === 'changed') return 'Modifiée depuis';
  return `Faite le ${new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
  }).format(match.on)}`;
};
