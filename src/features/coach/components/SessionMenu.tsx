import { useRef, type ReactNode } from 'react';
import { HStack, IconButton, Menu, Portal, Text } from '@chakra-ui/react';
import { LuEllipsis } from 'react-icons/lu';
import { touchHitArea } from '@/kit';

/** Une entrée du menu d'une séance. */
export interface SessionMenuAction {
  value: string;
  label: string;
  icon?: ReactNode;
  onSelect: () => void;
  /** Pour « Supprimer » : la ligne est rouge, et toujours la dernière. */
  danger?: boolean;
}

const Items = ({ actions }: { actions: SessionMenuAction[] }) => (
  <Portal>
    <Menu.Positioner>
      <Menu.Content
        bg="bg.surface"
        borderWidth="1px"
        borderRadius="xl"
        padding={1}
        minW="240px"
      >
        {actions.map((action) => (
          <Menu.Item
            key={action.value}
            value={action.value}
            cursor="pointer"
            color={action.danger ? 'app.error.fg' : 'fg'}
            _hover={{ bg: action.danger ? 'app.error/12' : 'whiteAlpha.100' }}
            borderRadius="md"
          >
            <HStack gap={2}>
              {action.icon}
              <Text>{action.label}</Text>
            </HStack>
          </Menu.Item>
        ))}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
);

/**
 * Ce que le menu fait de l'entrée choisie : il la retient, et ne la lance
 * qu'une fois refermé.
 *
 * Lancée au clic, « Renommer » ouvrait le titre à l'écriture — puis le menu,
 * en se refermant, rendait le focus à son « ⋯ » : le champ perdait le focus
 * aussitôt, et se refermait avec. Le menu rend le focus d'abord ; l'entrée
 * le prend ensuite si elle en a besoin. Lu sur `onSelect` et non sur un
 * `onClick` d'entrée, qui ne voit pas une entrée choisie au clavier.
 */
const useChosenAction = (actions: SessionMenuAction[]) => {
  const chosen = useRef<(() => void) | null>(null);
  return {
    onSelect: ({ value }: { value: string }) => {
      chosen.current = actions.find((a) => a.value === value)?.onSelect ?? null;
    },
    onExitComplete: () => {
      const run = chosen.current;
      chosen.current = null;
      run?.();
    },
  };
};

/**
 * Le menu d'une séance — renommer, dupliquer, copier vers un client,
 * enregistrer comme modèle, supprimer —, par ses trois points.
 *
 * Les mêmes entrées s'ouvrent au clic droit sur une séance du rail
 * (`SessionContextMenu`) : deux portes, une seule liste. Dupliquer, copier
 * et supprimer vivaient en boutons au pied de la séance ouverte, côte à
 * côte, et « Supprimer » y était à un clic de « Dupliquer ».
 */
export const SessionMenu = ({
  label,
  actions,
}: {
  /** Le nom du bouton : « Menu de la séance 2 ». */
  label: string;
  actions: SessionMenuAction[];
}) => (
  <Menu.Root {...useChosenAction(actions)}>
    <Menu.Trigger asChild>
      <IconButton
        aria-label={label}
        title="Renommer, dupliquer, copier, enregistrer, supprimer"
        css={touchHitArea()}
        size="sm"
        variant="ghost"
        color="fg.muted"
      >
        <LuEllipsis size={18} />
      </IconButton>
    </Menu.Trigger>
    <Items actions={actions} />
  </Menu.Root>
);

/**
 * Les mêmes entrées, au clic droit sur ce qu'on enveloppe — une séance du
 * rail, qu'on vise sans l'ouvrir d'abord.
 *
 * Retour du terrain : « pouvoir faire clic droit supprimer sur la séance ».
 * Le clic droit est un geste de bureau, et c'est délibérément là qu'il
 * s'arrête : sur un écran tactile, l'appui long sert déjà à réordonner.
 */
export const SessionContextMenu = ({
  actions,
  children,
}: {
  actions: SessionMenuAction[];
  children: ReactNode;
}) => (
  <Menu.Root {...useChosenAction(actions)}>
    <Menu.ContextTrigger asChild>{children}</Menu.ContextTrigger>
    <Items actions={actions} />
  </Menu.Root>
);
