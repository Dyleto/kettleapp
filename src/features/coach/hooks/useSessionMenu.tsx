import {
  LuCopy,
  LuLayoutGrid,
  LuPencil,
  LuTrash2,
  LuUsers,
} from 'react-icons/lu';
import type { Session } from '@/shared/types';
import type { SessionMenuAction } from '@/features/coach/components/SessionMenu';

interface Params {
  onRename: (sessionId: string) => void;
  onDuplicate: (sessionId: string) => void;
  onRemove: (sessionId: string) => void;
  /** Absents dans un modèle : ni copie vers un client, ni modèle d'un
   * modèle. */
  onCopy?: (sessionId: string) => void;
  onSaveAsTemplate?: (sessionId: string) => void;
}

/**
 * Le menu d'une séance, construit une fois pour ses deux portes : le « ⋯ »
 * de l'en-tête, et le clic droit sur une séance du rail.
 *
 * Il ne sait rien des feuilles qu'ouvrent « Copier vers un client… » et
 * « Enregistrer comme modèle » : la page du client les tient
 * (`useSessionSheets`), et celle d'un modèle n'en a pas. Les y mettre ici
 * aurait fait importer les modèles par le coach, et le coach par les
 * modèles.
 */
export const useSessionMenu = ({
  onRename,
  onDuplicate,
  onRemove,
  onCopy,
  onSaveAsTemplate,
}: Params) => {
  const actionsFor = (
    session: Session,
    { rename = true }: { rename?: boolean } = {}
  ): SessionMenuAction[] => {
    // Les entrées absentes — renommer depuis l'en-tête qui le fait déjà,
    // copier et enregistrer dans un modèle — valent `false` et partent.
    const all: (SessionMenuAction | false | undefined)[] = [
      rename && {
        value: 'rename',
        label: 'Renommer',
        icon: <LuPencil size={14} />,
        onSelect: () => onRename(session._id),
      },
      {
        value: 'duplicate',
        label: 'Dupliquer',
        icon: <LuCopy size={14} />,
        onSelect: () => onDuplicate(session._id),
      },
      onCopy && {
        value: 'copy',
        label: 'Copier vers un client…',
        icon: <LuUsers size={14} />,
        onSelect: () => onCopy(session._id),
      },
      onSaveAsTemplate && {
        value: 'template',
        label: 'Enregistrer comme modèle',
        icon: <LuLayoutGrid size={14} />,
        onSelect: () => onSaveAsTemplate(session._id),
      },
      {
        value: 'remove',
        label: `Supprimer la séance ${session.order}`,
        icon: <LuTrash2 size={14} />,
        danger: true,
        onSelect: () => onRemove(session._id),
      },
    ];
    return all.filter((action): action is SessionMenuAction => !!action);
  };

  return { actionsFor };
};
