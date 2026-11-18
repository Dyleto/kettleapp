import { useState } from 'react';
import { chakra, HStack, Input } from '@chakra-ui/react';
import type { Session } from '@/shared/types';
import { sessionName } from '@/domain/session/name';
import { daysChip, durationLabel } from '@/domain/session/rail';
import { Chip } from '@/kit';
import { BlockPill, SuggestedDaysPicker } from '@/features/workshop';
import { SessionMenu, type SessionMenuAction } from './SessionMenu';

interface SessionTitleProps {
  session: Session;
  onRename: (name?: string) => void;
  /** Ouvert à l'écriture dès qu'il paraît : la séance vient d'être créée,
   * ou « Renommer » vient d'être choisi. */
  startOpen?: boolean;
  onDone?: () => void;
}

/**
 * Le titre de la séance, qui est son nom — et qui s'édite là où il se lit.
 *
 * Vide, la séance s'appelle « Séance 3 » : le titre ne montre jamais un
 * « + nom » à la place d'un titre. Chaque frappe part aussitôt, comme
 * partout dans l'atelier ; Échap rend le nom d'avant.
 */
const SessionTitle = ({
  session,
  onRename,
  startOpen = false,
  onDone,
}: SessionTitleProps) => {
  const [editing, setEditing] = useState(startOpen);
  const [before, setBefore] = useState(session.name);
  const label = `Nom de la séance ${session.order}`;
  const stop = () => {
    setEditing(false);
    onDone?.();
  };

  if (editing)
    return (
      <Input
        autoFocus
        aria-label={label}
        defaultValue={session.name ?? ''}
        placeholder={`Séance ${session.order}`}
        onFocus={(e) => e.target.select()}
        onChange={(e) =>
          onRename(e.target.value.trim() ? e.target.value : undefined)
        }
        onBlur={stop}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            stop();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            onRename(before);
            stop();
          }
        }}
        size="sm"
        maxW="320px"
        fontSize="20px"
        fontWeight="800"
      />
    );

  return (
    <chakra.button
      type="button"
      aria-label={label}
      onClick={() => {
        setBefore(session.name);
        setEditing(true);
      }}
      textAlign="left"
      fontSize="20px"
      fontWeight="800"
      lineHeight="1.2"
      minW={0}
      textDecoration="underline"
      textDecorationColor="transparent"
      textUnderlineOffset="4px"
      _hover={{ textDecorationColor: 'var(--chakra-colors-fg-muted)' }}
    >
      {sessionName(session)}
    </chakra.button>
  );
};

interface SessionHeaderProps {
  session: Session;
  onRename: (name?: string) => void;
  onDays: (days: number[]) => void;
  /** Le menu de la séance : renommer en tête, puis ce que la page offre. */
  actions: SessionMenuAction[];
  onRenamed?: () => void;
  /** Le nombre de « Renommer » demandés : chacun rouvre le titre à
   * l'écriture. */
  renameRequest?: number;
}

/**
 * L'en-tête de la séance ouverte, partagé par le programme d'un client et
 * par un modèle : son nom, sa durée, ses jours, et son menu.
 *
 * Les deux pages en écrivaient chacune une copie — « Séance 2 » en titre,
 * « + nom » à côté —, les jours se cochaient sur une rangée de sept
 * pastilles posée sous le titre, et dupliquer, copier ou supprimer
 * attendaient en boutons au pied de la séance. La maquette les rassemble ici
 * : la durée qu'elle demande, une pastille des jours qui s'ouvre sur place,
 * et un « ⋯ » pour le reste.
 */
export const SessionHeader = ({
  session,
  onRename,
  onDays,
  actions,
  onRenamed,
  renameRequest = 0,
}: SessionHeaderProps) => (
  <HStack gap="10px" rowGap="8px" wrap="wrap" align="center" mb={4}>
    <SessionTitle
      // Remonté à chaque « Renommer » : il s'ouvre alors à l'écriture.
      key={renameRequest}
      session={session}
      onRename={onRename}
      startOpen={renameRequest > 0}
      onDone={onRenamed}
    />
    <Chip tone="amber">{durationLabel(session)}</Chip>
    <BlockPill
      tone="outline"
      label="Jours conseillés"
      display={daysChip(session.suggestedDays)}
    >
      {() => (
        <SuggestedDaysPicker value={session.suggestedDays} onChange={onDays} />
      )}
    </BlockPill>
    <HStack ml="auto">
      <SessionMenu
        label={`Menu de la séance ${session.order}`}
        actions={actions}
      />
    </HStack>
  </HStack>
);
