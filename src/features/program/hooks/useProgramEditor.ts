import { useCallback, useState } from 'react';
import { newObjectId } from '@/shared/utils/objectId';
import {
  BlockExercise,
  BlockType,
  ClientProgram,
  Exercise,
  Session,
  SessionBlock,
} from '@/shared/types';
import { blockSupportsSets } from '@/features/program/constants';

type ExerciseUpdate = Partial<Omit<BlockExercise, 'exercise'>>;

const BLOCK_DEFAULTS: Record<BlockType, Partial<SessionBlock>> = {
  warmup: {},
  classic: {},
  chipper: {},
  // An EMOM is set in rounds and interval — never in total duration, which
  // neither its settings nor its summary read. A new block therefore showed
  // "sans limite" although a default had just been set on it.
  emom: { rounds: 10, intervalMinutes: 1 },
  amrap: { durationMinutes: 8 },
  timecap: { durationMinutes: 15 },
  every: { intervalMinutes: 3, rounds: 5 },
  tabata: { rounds: 8, workDuration: 20, restDuration: 10 },
  onoff: { rounds: 10, workDuration: 30, restDuration: 30 },
  pyramid: { repsScheme: [5, 10, 15, 20, 15, 10, 5], restBetweenRounds: 60 },
  ladder: { repsScheme: [5, 10, 15, 20], restBetweenRounds: 60 },
};

const getExerciseDefaults = (blockType: BlockType): Partial<BlockExercise> => {
  // L'échauffement accepte des séries mais n'en pose aucune : le cas courant
  // reste un passage unique. En poser trois par défaut ferait aussi passer le
  // mode guidé d'une page à trois à chaque nouvel échauffement. Ce test vient
  // donc avant celui des blocs à séries.
  if (blockType === 'warmup') return { reps: 10 };
  if (blockSupportsSets(blockType))
    return { sets: 3, reps: 10, restBetweenSets: 60 };
  if (['tabata', 'onoff'].includes(blockType)) return { reps: 5 };
  if (['pyramid', 'ladder'].includes(blockType)) return {};
  return { reps: 10 };
};

/**
 * L'état du programme pendant que le coach l'écrit.
 *
 * Tout vit en mémoire : ajouter un bloc, déplacer un exercice, dupliquer une
 * séance ne coûtent aucune requête. C'est `useProgramAutoSave` qui décide
 * quand envoyer, et lui seul — séparer les deux est ce qui permet au coach de
 * faire dix gestes d'affilée sans dix allers-retours.
 *
 * Les fonctions de retour (`restoreBlock`, `restoreExercise`) sont le chemin
 * inverse des filets d'annulation : elles remettent à leur rang, pas à la
 * fin.
 */
export const useProgramEditor = (initialProgram: ClientProgram | null) => {
  const [program, setProgram] = useState<ClientProgram | null>(initialProgram);

  const initialize = useCallback((data: ClientProgram) => {
    setProgram(data);
  }, []);

  // ─── Sessions ──────────────────────────────────────────────────────────────

  const addSession = useCallback(() => {
    setProgram((prev) => {
      if (!prev) return null;
      const newSession: Session = {
        _id: newObjectId(),
        order: prev.sessions.length + 1,
        blocks: [],
        // Des chaînes ISO, comme celles que l'API renvoie : une séance
        // composée ici doit avoir exactement la forme de celle qui revient,
        // sans quoi l'enregistrement comparerait deux formes différentes.
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return { ...prev, sessions: [...prev.sessions, newSession] };
    });
  }, []);

  const removeSession = useCallback((sessionId: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions
          .filter((s) => s._id !== sessionId)
          .map((s, i) => ({ ...s, order: i + 1 })),
      };
    });
  }, []);

  /**
   * Remet une séance à son rang — le chemin de retour du filet d'annulation.
   */
  const insertSession = useCallback((index: number, session: Session) => {
    setProgram((prev) => {
      if (!prev) return null;
      const sessions = [...prev.sessions];
      sessions.splice(Math.min(index, sessions.length), 0, session);
      return {
        ...prev,
        sessions: sessions.map((s, i) => ({ ...s, order: i + 1 })),
      };
    });
  }, []);

  /**
   * « La séance 4, c'est la 2 en plus lourd » est le geste central de la
   * construction d'un programme. Coût serveur nul : tout le programme est
   * déjà en mémoire et l'enregistrement groupé s'en charge, exactement comme
   * pour une séance vide.
   */
  const duplicateSession = useCallback((sessionId: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      const index = prev.sessions.findIndex((s) => s._id === sessionId);
      if (index === -1) return prev;

      const source = prev.sessions[index];
      const copy: Session = {
        ...source,
        _id: newObjectId(),
        // Des identifiants neufs jusqu'aux blocs : deux séances ne peuvent pas
        // partager la clé d'un bloc, le glisser-déposer s'y perdrait.
        blocks: source.blocks.map((block) => ({
          ...block,
          _id: newObjectId(),
          exercises: block.exercises.map((ex) => ({ ...ex })),
        })),
        // Des chaînes ISO, comme celles que l'API renvoie : une séance
        // composée ici doit avoir exactement la forme de celle qui revient,
        // sans quoi l'enregistrement comparerait deux formes différentes.
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const sessions = [
        ...prev.sessions.slice(0, index + 1),
        copy,
        ...prev.sessions.slice(index + 1),
      ].map((s, i) => ({ ...s, order: i + 1 }));

      return { ...prev, sessions };
    });
  }, []);

  const reorderSessions = useCallback((orderedSessionIds: string[]) => {
    setProgram((prev) => {
      if (!prev) return null;
      const byId = new Map(prev.sessions.map((s) => [s._id, s]));
      const reordered = orderedSessionIds
        .map((id) => byId.get(id))
        .filter((s): s is Session => s !== undefined)
        .map((s, index) => ({ ...s, order: index + 1 }));
      return { ...prev, sessions: reordered };
    });
  }, []);

  /**
   * Le nom libre de la séance.
   *
   * Sans rognage des espaces : le champ envoie au fil de la frappe, et couper
   * l'espace final à chaque caractère rendait impossible d'en taper un.
   * « Full body A » devenait « FullbodyA ». Le nettoyage appartient à la
   * frontière — à l'envoi vers le serveur — pas à la frappe.
   */
  const updateSessionName = useCallback((sessionId: string, name?: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s._id === sessionId ? { ...s, name } : s
        ),
      };
    });
  }, []);

  const updateSessionNotes = useCallback((sessionId: string, notes: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) =>
          s._id === sessionId ? { ...s, notes } : s
        ),
      };
    });
  }, []);

  const updateSessionDays = useCallback(
    (sessionId: string, suggestedDays: number[]) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) =>
            s._id === sessionId
              ? {
                  ...s,
                  suggestedDays: [...new Set(suggestedDays)].sort(
                    (a, b) => a - b
                  ),
                }
              : s
          ),
        };
      });
    },
    []
  );

  // ─── Blocks ────────────────────────────────────────────────────────────────

  const addBlock = useCallback((sessionId: string, type: BlockType) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s._id !== sessionId) return s;
          const newBlock: SessionBlock = {
            _id: newObjectId(),
            type,
            order: s.blocks.length + 1,
            exercises: [],
            ...BLOCK_DEFAULTS[type],
          };
          return { ...s, blocks: [...s.blocks, newBlock] };
        }),
      };
    });
  }, []);

  const removeBlock = useCallback((sessionId: string, blockId: string) => {
    setProgram((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        sessions: prev.sessions.map((s) => {
          if (s._id !== sessionId) return s;
          return {
            ...s,
            blocks: s.blocks
              .filter((b) => b._id !== blockId)
              .map((b, i) => ({ ...b, order: i + 1 })),
          };
        }),
      };
    });
  }, []);

  /**
   * Remet un bloc à sa place — le chemin de retour du filet d'annulation.
   *
   * Un bloc emporte ses exercices en partant : il revient donc entier, tel
   * qu'il était, et à son rang. Le remettre en dernier déplacerait
   * l'échauffement après l'AMRAP.
   */
  const insertBlock = useCallback(
    (sessionId: string, index: number, block: SessionBlock) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            const blocks = [...s.blocks];
            blocks.splice(Math.min(index, blocks.length), 0, block);
            return {
              ...s,
              blocks: blocks.map((b, i) => ({ ...b, order: i + 1 })),
            };
          }),
        };
      });
    },
    []
  );

  const updateBlock = useCallback(
    (sessionId: string, blockId: string, updates: Partial<SessionBlock>) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            return {
              ...s,
              blocks: s.blocks.map((b) =>
                b._id === blockId ? { ...b, ...updates } : b
              ),
            };
          }),
        };
      });
    },
    []
  );

  // ─── Exercises ─────────────────────────────────────────────────────────────

  const updateBlockExercises = useCallback(
    (
      sessionId: string,
      blockId: string,
      updater: (exercises: BlockExercise[]) => BlockExercise[]
    ) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            return {
              ...s,
              blocks: s.blocks.map((b) => {
                if (b._id !== blockId) return b;
                return { ...b, exercises: updater(b.exercises) };
              }),
            };
          }),
        };
      });
    },
    []
  );

  const addExercise = useCallback(
    (sessionId: string, blockId: string, exercise: Exercise) => {
      setProgram((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          sessions: prev.sessions.map((s) => {
            if (s._id !== sessionId) return s;
            return {
              ...s,
              blocks: s.blocks.map((b) => {
                if (b._id !== blockId) return b;
                const newExercise: BlockExercise = {
                  exercise,
                  order: b.exercises.length + 1,
                  ...getExerciseDefaults(b.type),
                };
                return { ...b, exercises: [...b.exercises, newExercise] };
              }),
            };
          }),
        };
      });
    },
    []
  );

  const removeExercise = useCallback(
    (sessionId: string, blockId: string, index: number) => {
      updateBlockExercises(sessionId, blockId, (exs) =>
        exs
          .filter((_, i) => i !== index)
          .map((e, i) => ({ ...e, order: i + 1 }))
      );
    },
    [updateBlockExercises]
  );

  /**
   * Remet un exercice à sa place — le chemin de retour du filet d'annulation.
   *
   * À sa place, pas à la fin : un exercice retiré par erreur du milieu d'un
   * bloc n'a pas changé d'avis sur son rang, et le voir réapparaître en
   * dernier obligerait à un déplacement de plus.
   */
  const insertExercise = useCallback(
    (
      sessionId: string,
      blockId: string,
      index: number,
      exercise: BlockExercise
    ) => {
      updateBlockExercises(sessionId, blockId, (exs) => {
        const suivants = [...exs];
        suivants.splice(Math.min(index, suivants.length), 0, exercise);
        return suivants.map((e, i) => ({ ...e, order: i + 1 }));
      });
    },
    [updateBlockExercises]
  );

  const updateExercise = useCallback(
    (
      sessionId: string,
      blockId: string,
      index: number,
      updates: ExerciseUpdate
    ) => {
      updateBlockExercises(sessionId, blockId, (exs) =>
        exs.map((e, i) => (i === index ? { ...e, ...updates } : e))
      );
    },
    [updateBlockExercises]
  );

  const reorderBlocks = useCallback(
    (sessionId: string, orderedBlockIds: string[]) => {
      setProgram((prev) => {
        if (!prev) return null;

        return {
          ...prev,
          sessions: prev.sessions.map((session) => {
            if (session._id !== sessionId) return session;

            const blockById = new Map(session.blocks.map((b) => [b._id, b]));
            const reordered = orderedBlockIds
              .map((id) => blockById.get(id))
              .filter((block): block is SessionBlock => block !== undefined)
              .map((block, index) => ({ ...block, order: index + 1 }));

            return { ...session, blocks: reordered };
          }),
        };
      });
    },
    []
  );

  return {
    program,
    initialize,
    actions: {
      addSession,
      removeSession,
      insertSession,
      duplicateSession,
      reorderSessions,
      updateSessionName,
      updateSessionNotes,
      updateSessionDays,
      addBlock,
      removeBlock,
      insertBlock,
      updateBlock,
      addExercise,
      removeExercise,
      insertExercise,
      updateExercise,
      reorderBlocks,
    },
  };
};
