import { useCallback, useMemo } from 'react';
import { useProgramEditor } from '@/features/program/hooks/useProgramEditor';
import {
  useProgramAutoSave,
  type SaveState,
} from '@/features/program/hooks/useProgramAutoSave';
import { getBlockLabel } from '@/features/program/constants';
import { undoable } from '@/shared/components/undoable';
import type {
  BlockExercise,
  BlockType,
  ClientProgram,
  Exercise,
  Session,
  SessionBlock,
} from '@/shared/types';

/**
 * « Avec ses 3 exercices. », « Avec son exercice. », ou rien du tout.
 *
 * Le pluriel n'est pas une affaire de « s » collé à la fin : « Avec ses 1
 * bloc » ne se dit pas, et c'est ce que produisait la forme courte.
 */
const removedContents = (howMany: number, noun: string): string | undefined => {
  if (howMany === 0) return undefined;
  if (howMany === 1) return `Avec son ${noun}.`;
  return `Avec ses ${howMany} ${noun}s.`;
};

interface Params {
  /** Le programme tel que le serveur l'envoie, ou `undefined` pendant le
   * chargement. */
  serverProgram: ClientProgram | undefined;
  /** Envoie les séances et rend ce que le serveur a réellement enregistré. */
  save: (sessions: Session[]) => Promise<Session[]>;
  /** Le rang de séance affiché, lu dans l'URL. 1 pour la première. */
  sessionIndex?: string;
  /** Où mène l'ouverture d'une séance : l'appelant seul connaît sa route. */
  goToSession: (index: number) => void;
}

/**
 * L'atelier d'un programme : son état, son enregistrement, et ses gestes.
 *
 * Extrait parce que deux écrans l'ouvrent désormais — le programme d'un
 * client, et un modèle de programme — et que tout ce qui est ici est
 * rigoureusement le même des deux côtés. Les huit gestes portent chacun leur
 * filet d'annulation, et les recopier dans un second écran aurait donné deux
 * filets à tenir d'accord : celui qui aurait reçu la correction suivante, et
 * l'autre.
 *
 * Ce qui reste à l'appelant est ce qui diffère vraiment : d'où vient le
 * programme, où il s'enregistre, et vers quelle adresse mène l'ouverture
 * d'une séance. Rien d'autre — ni les blocs, ni les exercices, ni la fiche
 * d'un mouvement ne savent de qui est le programme qu'ils éditent.
 */
export const useProgramWorkshop = ({
  serverProgram,
  save,
  sessionIndex,
  goToSession,
}: Params) => {
  const { program, initialize, actions } = useProgramEditor(null);

  const {
    state: saveState,
    savedAt,
    flush,
  } = useProgramAutoSave({ program, serverProgram, initialize, save });

  const currentIndex = Math.max(0, (Number(sessionIndex) || 1) - 1);
  const activeSession = program?.sessions[currentIndex];

  // Tout le programme est en mémoire : « déjà dans ce programme » se calcule
  // sans une seule requête de plus.
  const inProgram = useMemo<Exercise[]>(() => {
    const byId = new Map<string, Exercise>();
    program?.sessions.forEach((s) =>
      s.blocks.forEach((b) =>
        b.exercises.forEach((ex) => byId.set(ex.exercise._id, ex.exercise))
      )
    );
    return [...byId.values()].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr', { sensitivity: 'base' })
    );
  }, [program]);

  const addSession = useCallback(() => {
    actions.addSession();
    goToSession((program?.sessions.length ?? 0) + 1);
  }, [actions, goToSession, program?.sessions.length]);

  /**
   * Supprimer une séance, avec de quoi la remettre.
   *
   * C'est la plus grande perte possible en un geste — une séance emporte tous
   * ses blocs — et c'est précisément pour cela que le filet vaut mieux que la
   * question : la question reçoit un « oui » réflexe dès la troisième fois,
   * quand la bannière attend huit secondes sans rien demander.
   *
   * N'importe quelle séance et non la seule ouverte : le rail permet de
   * supprimer au clic droit celle qu'on vise, sans l'ouvrir d'abord. Et on ne
   * déplace le coach que si c'est la séance qu'il regardait.
   */
  const removeSession = (sessionId: string) => {
    const sessions = program?.sessions ?? [];
    const index = sessions.findIndex((s) => s._id === sessionId);
    const removed = sessions[index];
    if (!removed) return;

    actions.removeSession(removed._id);
    if (index === currentIndex) goToSession(1);

    undoable({
      title: `Séance ${removed.order} supprimée`,
      description: removedContents(removed.blocks.length, 'bloc'),
      undo: () => {
        actions.insertSession(index, removed);
        goToSession(index + 1);
      },
    });
  };

  const duplicateSession = () => {
    if (!activeSession) return;
    actions.duplicateSession(activeSession._id);
    // La copie s'insère juste après l'original : on l'ouvre aussitôt, c'est
    // ce qui vient d'être créé pour être ajusté.
    goToSession(currentIndex + 2);
  };

  /**
   * Supprimer un bloc, avec de quoi le remettre.
   *
   * Il avait une confirmation, et elle part avec ce filet : garder les deux
   * reviendrait à poser une question ET à offrir un rattrapage, soit deux
   * gestes pour une seule erreur possible.
   */
  const removeBlock = (blockId: string) => {
    const index = activeSession?.blocks.findIndex((b) => b._id === blockId);
    const block =
      index !== undefined && index >= 0
        ? activeSession?.blocks[index]
        : undefined;
    if (!activeSession || !block || index === undefined) return;

    actions.removeBlock(activeSession._id, blockId);
    undoable({
      title: `Bloc ${getBlockLabel(block.type)} supprimé`,
      description: removedContents(block.exercises.length, 'exercice'),
      undo: () => actions.insertBlock(activeSession._id, index, block),
    });
  };

  /**
   * Retirer un exercice, avec de quoi le remettre.
   *
   * C'est le geste le plus fréquent de l'éditeur, et le seul qui ne demandait
   * rien. Une confirmation à chaque retrait serait insupportable ; une
   * bannière qui reste huit secondes ne coûte rien à qui ne s'est pas trompé.
   */
  const removeExercise = (blockId: string, index: number) => {
    const block = activeSession?.blocks.find((b) => b._id === blockId);
    const removed = block?.exercises[index];
    if (!activeSession || !block || !removed) return;

    actions.removeExercise(activeSession._id, blockId, index);
    undoable({
      title: `${removed.exercise.name} retiré`,
      description: `De ${getBlockLabel(block.type)}.`,
      undo: () =>
        actions.insertExercise(activeSession._id, blockId, index, removed),
    });
  };

  /**
   * Ce que l'atelier attend en propriétés, prêt à être étalé.
   *
   * Rendu d'un bloc plutôt que champ par champ : les deux écrans passent
   * exactement les mêmes, et les énumérer deux fois ramènerait la divergence
   * que ce hook existe pour empêcher.
   */
  const workshopProps = activeSession && {
    session: activeSession,
    inProgram,
    onRemoveSession: () => removeSession(activeSession._id),
    onDuplicateSession: duplicateSession,
    onUpdateSessionNotes: (notes: string) =>
      actions.updateSessionNotes(activeSession._id, notes),
    onUpdateSessionDays: (days: number[]) =>
      actions.updateSessionDays(activeSession._id, days),
    onAddBlock: (type: BlockType) => actions.addBlock(activeSession._id, type),
    onRemoveBlock: removeBlock,
    onUpdateBlock: (blockId: string, updates: Partial<SessionBlock>) =>
      actions.updateBlock(activeSession._id, blockId, updates),
    onReorderBlocks: (orderedIds: string[]) =>
      actions.reorderBlocks(activeSession._id, orderedIds),
    onAddExercise: (blockId: string, exercise: Exercise) =>
      actions.addExercise(activeSession._id, blockId, exercise),
    onRemoveExercise: removeExercise,
    onUpdateExercise: (
      blockId: string,
      index: number,
      updates: Partial<Omit<BlockExercise, 'exercise'>>
    ) => actions.updateExercise(activeSession._id, blockId, index, updates),
  };

  return {
    program,
    actions,
    activeSession,
    currentIndex,
    inProgram,
    workshopProps,
    addSession,
    removeSession,
    saveState: saveState as SaveState,
    savedAt,
    flush,
  };
};
