import { Box, HStack } from '@chakra-ui/react';

/** Ce qu'un point dit : fait, en cours, ou à venir. */
export type DotMark = 'done' | 'now' | 'todo';

/**
 * Une rangée de points : faits en sarcelle, celui en cours en ambre cerclé,
 * le reste en creux.
 *
 * Partagée par la série en cours et les blocs chronométrés : les deux disent
 * « où j'en suis » de la même façon, et une seconde écriture aurait fini par
 * le dire autrement. Les marques viennent de l'appelant parce que l'ordre
 * n'est pas toujours celui de la rangée : une série passée laisse un creux
 * entre deux points faits. Au-delà de douze points la rangée ne tient plus
 * sur un téléphone — c'est à l'appelant de passer à une barre.
 */
export const Dots = ({ marks }: { marks: DotMark[] }) => (
  <HStack gap={2} aria-hidden>
    {marks.map((mark, i) => (
      <Box
        key={i}
        w="14px"
        h="14px"
        borderRadius="full"
        flexShrink={0}
        data-mark={mark}
        bg={
          mark === 'done'
            ? 'session.rest'
            : mark === 'now'
              ? 'app.primary'
              : 'bg.surface'
        }
        boxShadow={
          mark === 'now'
            ? '0 0 0 4px rgba(207, 159, 63, 0.25)'
            : mark === 'done'
              ? 'none'
              : 'inset 0 0 0 1.5px {colors.line}'
        }
      />
    ))}
  </HStack>
);
