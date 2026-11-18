import { useState } from 'react';
import { Box, chakra, Grid, HStack, Text, VStack } from '@chakra-ui/react';
import type { BlockType } from '@/shared/types';
import { formatName } from '@/domain/session/dose';
import { FORMAT_LINE, formatSketch, PALETTE } from '@/domain/session/format';
import { Strokes } from '@/kit';

interface FormatPaletteProps {
  onSelect: (type: BlockType) => void;
  /** « Annuler », sur grand écran. Dans une feuille, c'est la feuille qui
   * se ferme. */
  onCancel?: () => void;
  /** « Quel format ? » pour un bloc neuf, « Changer de format » pour un
   * bloc écrit. */
  title?: string;
  /** `card` dans la page, à l'endroit du bloc ; `sheet` dans une feuille
   * basse sur téléphone. */
  layout: 'card' | 'sheet';
}

/** Les huit formats d'une feuille de téléphone ; le reste se déplie. */
const SHEET_FIRST = 8;

/**
 * Le choix d'un format, dessiné.
 *
 * Le sélecteur alignait des tuiles de mots — « Max de tours en temps
 * limité », « Exos toutes les minutes » — qu'il fallait lire pour choisir,
 * et repliait sept formats derrière « Autres formats ». La maquette dessine
 * chaque format : l'EMOM qui repart, le Tabata qui alterne, l'échelle qui
 * monte et redescend. On reconnaît un format avant de lire son nom, et les
 * neuf tiennent sur un écran.
 *
 * Sur téléphone, la feuille montre huit formats en deux colonnes, sans
 * phrase ; le neuvième se déplie — la feuille tient sous le pouce.
 */
export const FormatPalette = ({
  onSelect,
  onCancel,
  title = 'Quel format ?',
  layout,
}: FormatPaletteProps) => {
  const [showAll, setShowAll] = useState(false);
  const inSheet = layout === 'sheet';
  const shown = inSheet && !showAll ? PALETTE.slice(0, SHEET_FIRST) : PALETTE;
  const hidden = PALETTE.slice(SHEET_FIRST);

  const tiles = (
    <Grid
      templateColumns={
        inSheet
          ? 'repeat(2, 1fr)'
          : { base: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }
      }
      gap={inSheet ? '8px' : '10px'}
    >
      {shown.map((type) => (
        <chakra.button
          key={type}
          type="button"
          onClick={() => onSelect(type)}
          display="flex"
          flexDirection="column"
          alignItems="stretch"
          gap={inSheet ? '6px' : '8px'}
          p={inSheet ? '12px' : '14px'}
          textAlign="left"
          bg={inSheet ? 'bg.surface' : 'bg.raised'}
          borderRadius="16px"
          _hover={{ boxShadow: 'inset 0 0 0 1.5px {colors.app.primary}' }}
          data-format={type}
        >
          <Strokes strokes={formatSketch(type)} height={inSheet ? 18 : 26} />
          <Text fontWeight="700" fontSize="15px">
            {formatName(type)}
          </Text>
          {!inSheet && (
            <Text fontSize="12.5px" color="fg.muted" lineHeight="1.35">
              {FORMAT_LINE[type]}
            </Text>
          )}
        </chakra.button>
      ))}
    </Grid>
  );

  if (inSheet)
    return (
      <VStack align="stretch" gap="12px" data-block-picker>
        {/* Sans titre dans la feuille d'un bloc : son en-tête dit déjà
            quel format on quitte. */}
        {title && (
          <Text as="h2" fontWeight="800" fontSize="20px">
            {title}
          </Text>
        )}
        {tiles}
        {!showAll && hidden.length > 0 && (
          <chakra.button
            type="button"
            alignSelf="center"
            minH="44px"
            fontSize="sm"
            color="fg.muted"
            onClick={() => setShowAll(true)}
          >
            {`${hidden.map(formatName).join(', ')} et les autres`}
          </chakra.button>
        )}
      </VStack>
    );

  return (
    <Box bg="bg.surface" borderRadius="20px" p="16px" data-block-picker>
      <HStack mb="12px">
        <Text fontWeight="700" fontSize="17px">
          {title}
        </Text>
        {onCancel && (
          <chakra.button
            type="button"
            ml="auto"
            minH="36px"
            fontSize="sm"
            color="fg.muted"
            onClick={onCancel}
          >
            Annuler
          </chakra.button>
        )}
      </HStack>
      {tiles}
    </Box>
  );
};
