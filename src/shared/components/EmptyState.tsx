import { ReactNode } from 'react';
import { Box, Text, VStack } from '@chakra-ui/react';
import { Mascot, type MascotMood } from './Mascot';

export interface EmptyStateProps {
  /** Ce qui manque, en une ligne. Pas « aucun résultat » : ce qui manque. */
  title: string;
  /** Pourquoi c'est vide, et ce qui va se passer. Facultatif si le titre suffit. */
  line?: string;
  /** Une action, quand il y en a une à proposer. */
  action?: ReactNode;
  /**
   * L'humeur du personnage. Sans elle, pas de personnage : c'est le cas dans
   * l'atelier du coach, où un écran vide est une étape de travail et non un
   * moment d'attente.
   */
  mood?: MascotMood;
  /**
   * `h1` quand l'état est tout ce que l'écran affiche — une panne, une page
   * introuvable. Un écran sans titre de premier niveau n'a pas de nom pour
   * un lecteur d'écran.
   */
  headingLevel?: 'h1' | 'h2';
}

/**
 * Un écran vide, écrit d'une seule façon.
 *
 * Le même état — « ton coach n'a pas encore écrit de programme » — se disait
 * de trois façons selon l'écran, dont une sèche : « Aucune séance dans le
 * programme. » Trois formulations laissent croire à trois situations
 * différentes, et la sèche laisse croire à une erreur.
 *
 * Le ton chaleureux est le bon : un programme vide n'est pas une panne, c'est
 * un moment normal de la relation avec un coach. C'est la version sèche qui
 * devait partir.
 *
 * Il n'a plus de cadre. Encadré de gris, il ressemblait à un message
 * d'erreur posé dans la page ; nu et centré, avec le personnage, il se lit
 * comme l'écran lui-même.
 */
export const EmptyState = ({
  title,
  line,
  action,
  mood,
  headingLevel = 'h2',
}: EmptyStateProps) => (
  <VStack gap={3} py={10} px={3} textAlign="center" data-state-screen>
    {mood && <Mascot mood={mood} />}
    <Text
      as={headingLevel}
      fontSize="24px"
      fontWeight="750"
      lineHeight="1.08"
      letterSpacing="-0.01em"
      fontStretch="90%"
    >
      {title}
    </Text>
    {line && (
      <Text color="fg.muted" fontSize="15px" maxW="300px" lineHeight="1.5">
        {line}
      </Text>
    )}
    {action && <Box pt={2}>{action}</Box>}
  </VStack>
);
