import type { InboxItem } from '@/shared/types';
import { heaviest } from '@/domain/history/load';
import { loadsOf } from './feed';
import { stripAccents } from '@/shared/utils/formatters';

/**
 * L'exercice qu'une séance lue désigne au coach : celui qu'« Ajuster » doit
 * mettre en vue dans l'atelier.
 *
 * « Ajuster » ouvrait la séance, et le coach cherchait ensuite lui-même la
 * ligne dont le client parlait — « épaule un peu sensible sur les swings ».
 * La maquette demande l'atelier « le premier exercice concerné en vue ».
 */

/** Les mots d'un texte, sans accents ni capitales, au singulier grossier :
 * « swings » se lit « swing », « fentes » se lit « fente ». */
const words = (text: string): string[] =>
  stripAccents(text.toLowerCase())
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map((word) => word.replace(/[sx]$/, ''));

/**
 * Le mot du client cite-t-il cet exercice ?
 *
 * Par mot et non par nom entier : un client écrit « les swings », pas
 * « Kettlebell Swing ». Les mots de moins de quatre lettres ne comptent pas
 * — « row », « de », « à » se liraient dans n'importe quelle phrase.
 */
export const citesExercise = (note: string, exerciseName: string): boolean => {
  const said = new Set(words(note));
  return words(exerciseName).some((word) => word.length >= 4 && said.has(word));
};

/**
 * L'identifiant du mouvement concerné, ou rien.
 *
 * D'abord celui que le client cite : c'est de lui qu'il parle. Sinon le
 * premier dont la charge a baissé depuis le passage d'avant — ce qui a
 * changé dans le mauvais sens, et que la carte montre déjà en flèche
 * descendante. Sinon rien : l'atelier s'ouvre sur la séance, comme avant,
 * plutôt que de désigner un exercice au hasard.
 *
 * Dans l'ordre de la séance : deux exercices cités, c'est le premier qu'on
 * rencontre en la lisant.
 */
export const concernedExercise = ({
  completed,
  previous,
}: InboxItem): string | undefined => {
  const entries = completed.blocks.flatMap((block) => block.exercises);
  const note = completed.clientNotes?.trim();
  if (note) {
    const cited = entries.find(
      (entry) =>
        typeof entry.exercise?.name === 'string' &&
        citesExercise(note, entry.exercise.name)
    );
    if (typeof cited?.exercise?._id === 'string') return cited.exercise._id;
  }
  const before = loadsOf(previous);
  const dropped = entries.find((entry) => {
    const id = entry.exercise?._id;
    const load = heaviest(entry.performed?.sets);
    const was = typeof id === 'string' ? before.get(id) : undefined;
    return load !== undefined && was !== undefined && load < was;
  });
  return typeof dropped?.exercise?._id === 'string'
    ? dropped.exercise._id
    : undefined;
};
