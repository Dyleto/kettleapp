import { Box, chakra, Input, Portal, Text, VStack } from '@chakra-ui/react';
import type { Session } from '@/shared/types';
import { ActionButton, Sheet } from '@/kit';
import {
  InlineText,
  SuggestedDaysPicker,
  useSheetDismiss,
} from '@/features/workshop';
import type { SessionMenuAction } from './SessionMenu';

interface SessionSheetProps {
  session: Session;
  onRename: (name?: string) => void;
  onDays: (days: number[]) => void;
  onNotes: (notes: string) => void;
  /** Ce que le menu de la séance offre d'autre : dupliquer, copier,
   * enregistrer comme modèle, supprimer. */
  actions: SessionMenuAction[];
  /** « + mot pour Sarah » ; sans prénom, « pour ton client ». */
  clientFirstName?: string;
  /** Le nom prêt à la frappe : la séance vient d'être créée. */
  focusName?: boolean;
  onClose: () => void;
}

/** Un champ facultatif de la feuille, dans une case : sur téléphone, une
 * invitation sans cadre ne se voyait pas comme un champ. */
const Field = ({ children }: { children: React.ReactNode }) => (
  <Box bg="bg.raised" borderRadius="16px" px="16px" py="10px" fontSize="sm">
    {children}
  </Box>
);

/**
 * La séance ouverte, sur téléphone : son nom, ses jours, le mot d'avant
 * séance et ce que son menu offre, dans une feuille ouverte par le « ⋯ » de
 * la barre du haut.
 *
 * Sur grand écran, ces réglages vivent dans l'en-tête de la séance — un
 * titre, une pastille, un menu. À 390 px, l'en-tête prenait une ligne et
 * demie au-dessus de la bande de séances, pour des réglages qu'on touche une
 * fois par séance, et ses pastilles se visaient. La maquette les range ici,
 * en grand, sous le pouce.
 *
 * Une action choisie referme la feuille d'abord : « Copier vers un
 * client… » ouvre sa propre fenêtre, et deux feuilles empilées se
 * refermaient l'une l'autre au retour du téléphone.
 */
export const SessionSheet = ({
  session,
  onRename,
  onDays,
  onNotes,
  actions,
  clientFirstName,
  focusName = false,
  onClose,
}: SessionSheetProps) => {
  useSheetDismiss(true, onClose);
  const nameLabel = `Nom de la séance ${session.order}`;

  return (
    <Portal>
      <Sheet label={`Régler la séance ${session.order}`} onDismiss={onClose}>
        <Input
          autoFocus={focusName}
          aria-label={nameLabel}
          defaultValue={session.name ?? ''}
          placeholder={`Séance ${session.order}`}
          onChange={(e) =>
            onRename(e.target.value.trim() ? e.target.value : undefined)
          }
          // La case des autres champs de la feuille : sans elle, le nom se
          // lisait comme un titre, et rien ne disait qu'il s'écrit.
          size="lg"
          h="52px"
          bg="bg.raised"
          borderWidth={0}
          borderRadius="16px"
          fontSize="18px"
          fontWeight="700"
        />

        <VStack align="stretch" gap="8px">
          <Text
            fontSize="xs"
            fontWeight="700"
            letterSpacing="0.08em"
            textTransform="uppercase"
            color="fg.muted"
            aria-hidden
          >
            Jours conseillés
          </Text>
          <SuggestedDaysPicker
            value={session.suggestedDays}
            onChange={onDays}
          />
        </VStack>

        <Field>
          <InlineText
            value={session.notes}
            onChange={(notes) => onNotes(notes ?? '')}
            addLabel={`+ mot pour ${clientFirstName ?? 'ton client'}, affiché avant la séance`}
            ariaLabel="Note de la séance"
            fontSize="sm"
            multiline
          />
        </Field>

        <VStack
          align="stretch"
          gap={0}
          bg="bg.raised"
          borderRadius="16px"
          overflow="hidden"
        >
          {actions.map((action) => (
            <chakra.button
              key={action.value}
              type="button"
              display="flex"
              alignItems="center"
              gap="12px"
              minH="52px"
              px="16px"
              textAlign="left"
              fontWeight="600"
              color={action.danger ? 'app.error' : 'fg'}
              borderTopWidth="1px"
              borderColor="line"
              _first={{ borderTopWidth: 0 }}
              onClick={() => {
                onClose();
                action.onSelect();
              }}
            >
              {action.icon}
              {action.label}
            </chakra.button>
          ))}
        </VStack>

        <ActionButton size="md" w="full" onClick={onClose}>
          C’est bon
        </ActionButton>
      </Sheet>
    </Portal>
  );
};
