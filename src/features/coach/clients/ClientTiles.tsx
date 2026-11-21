import { chakra, Grid, Text } from '@chakra-ui/react';
import type { ClientFilter, tileCounts } from '@/domain/clients/roster';

interface Tile {
  filter: ClientFilter;
  count: number;
  label: string;
  sub: string;
  color: string;
  /** Ce qu'entend un lecteur d'écran : la phrase entière. */
  said: string;
}

const tilesOf = (counts: ReturnType<typeof tileCounts>): Tile[] => [
  {
    filter: 'unread',
    count: counts.unreadSessions,
    label: 'à lire',
    sub:
      counts.unreadClients > 0
        ? `chez ${counts.unreadClients} client${counts.unreadClients > 1 ? 's' : ''}`
        : 'rien en attente',
    color: 'app.primary',
    said: `${counts.unreadSessions} séance${counts.unreadSessions > 1 ? 's' : ''} à lire`,
  },
  {
    filter: 'silent',
    count: counts.silent,
    label: 'à relancer',
    sub: '14 jours sans séance',
    color: 'session.work.fg',
    said: `${counts.silent} client${counts.silent > 1 ? 's' : ''} à relancer`,
  },
  {
    filter: 'misjudged',
    count: counts.misjudged,
    label: 'mal réglées',
    sub: 'deux fois de suite',
    color: 'effort.easy',
    said: `${counts.misjudged} séance${counts.misjudged > 1 ? 's' : ''} mal réglée${counts.misjudged > 1 ? 's' : ''}`,
  },
];

/**
 * Les trois chiffres de tête : où regarder avant de lire la liste.
 *
 * Chacun filtre la liste sur ce qu'il compte, et se touche de nouveau pour
 * retirer le filtre — les tuiles et les lignes comptent avec la même règle
 * (`passesFilter`), une tuile qui dit « 2 » montre deux lignes. Une tuile à
 * zéro ne filtre rien : elle afficherait une liste vide.
 *
 * « à lire » porte le contour ambre quand il y a à lire : c'est la tuile
 * qui appelle un geste, comme la carte mise en avant de l'accueil.
 */
export const ClientTiles = ({
  counts,
  filter,
  onFilter,
}: {
  counts: ReturnType<typeof tileCounts>;
  filter: ClientFilter | null;
  onFilter: (filter: ClientFilter | null) => void;
}) => (
  <Grid
    templateColumns="repeat(3, minmax(0, 1fr))"
    gap={{ base: '8px', md: '12px' }}
    role="group"
    aria-label="Filtrer la liste"
  >
    {tilesOf(counts).map((tile) => {
      const on = filter === tile.filter;
      const calling = tile.filter === 'unread' && tile.count > 0;
      return (
        <chakra.button
          key={tile.filter}
          type="button"
          aria-pressed={on}
          aria-label={`${tile.said} : filtrer la liste`}
          disabled={tile.count === 0}
          onClick={() => onFilter(on ? null : tile.filter)}
          display="flex"
          flexDirection="column"
          alignItems="flex-start"
          gap="2px"
          textAlign="left"
          minW={0}
          bg={on ? 'bg.raised' : 'surface.card'}
          borderRadius="22px"
          px={{ base: '12px', md: '18px' }}
          py={{ base: '12px', md: '16px' }}
          boxShadow={
            on
              ? `inset 0 0 0 2px {colors.${tile.color}}`
              : calling
                ? 'inset 0 0 0 1.5px rgba(207, 159, 63, 0.45)'
                : undefined
          }
          cursor={tile.count === 0 ? 'default' : 'pointer'}
          _hover={tile.count === 0 ? undefined : { bg: 'bg.raised' }}
          data-tile={tile.filter}
        >
          <Text
            fontFamily="heading"
            fontWeight="800"
            fontSize={{ base: '30px', md: '40px' }}
            lineHeight="0.95"
            fontVariantNumeric="tabular-nums"
            color={tile.count === 0 ? 'fg.muted' : tile.color}
            aria-hidden
          >
            {tile.count}
          </Text>
          <Text
            fontWeight="700"
            fontSize={{ base: 'sm', md: 'md' }}
            aria-hidden
            truncate
            maxW="full"
          >
            {tile.label}
          </Text>
          <Text fontSize="xs" color="fg.muted" aria-hidden lineClamp={2}>
            {tile.sub}
          </Text>
        </chakra.button>
      );
    })}
  </Grid>
);
