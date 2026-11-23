import type {
  Announcements,
  ScreenReaderInstructions,
  UniqueIdentifier,
} from '@dnd-kit/core';
import { dragAnnouncement, MOVE_INSTRUCTIONS } from '@/domain/session/order';

/**
 * Ce que les trois glisser de l'atelier — le rail, la bande, les blocs —
 * disent à un lecteur d'écran, en français.
 *
 * La bibliothèque parlait anglais : « Picked up draggable item… », et une
 * consigne qui promettait Espace et les flèches à un clavier qu'aucun
 * capteur n'écoutait (relevé en E7b). Les phrases sont dans `domain` ; ici,
 * seulement le branchement sur ses rendez-vous.
 *
 * `ids` est l'ordre au moment du glisser : les positions s'y lisent, et le
 * nom de ce qu'on déplace reste celui d'avant — une séance 2 posée en
 * quatrième s'annonce encore « Séance 2 », celle qu'on a prise.
 */
export const dragSpeech = (
  kind: keyof typeof MOVE_INSTRUCTIONS,
  ids: readonly string[],
  nameOf: (id: string) => string
): {
  announcements: Announcements;
  screenReaderInstructions: ScreenReaderInstructions;
} => {
  const rank = (id: UniqueIdentifier) => ids.indexOf(String(id)) + 1;
  const total = ids.length;
  const name = (id: UniqueIdentifier) => nameOf(String(id));
  return {
    screenReaderInstructions: { draggable: MOVE_INSTRUCTIONS[kind] },
    announcements: {
      onDragStart: ({ active }) =>
        dragAnnouncement(
          'start',
          name(active.id),
          rank(active.id),
          rank(active.id),
          total
        ),
      onDragOver: ({ active, over }) =>
        over
          ? dragAnnouncement(
              'over',
              name(active.id),
              rank(active.id),
              rank(over.id),
              total
            )
          : undefined,
      onDragEnd: ({ active, over }) =>
        dragAnnouncement(
          'end',
          name(active.id),
          rank(active.id),
          over ? rank(over.id) : rank(active.id),
          total
        ),
      onDragCancel: ({ active }) =>
        dragAnnouncement(
          'cancel',
          name(active.id),
          rank(active.id),
          rank(active.id),
          total
        ),
    },
  };
};
