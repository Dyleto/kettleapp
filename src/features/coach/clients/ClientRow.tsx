import {
  Avatar,
  Box,
  chakra,
  Grid,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { Client, Tag } from '@/shared/types';
import { Chip, type ChipTone, Ring } from '@/kit';
import { getEffortLevel } from '@/domain/history/effort';
import {
  clientName,
  statusLine,
  type StatusTone,
} from '@/domain/clients/roster';
import { visibleTags } from '@/domain/clients/tags';
import { EffortDots } from '../components/EffortDots';
import { TagChip } from './Tags';

const TEXT_COLOR: Record<StatusTone, string> = {
  amber: 'app.primary',
  coral: 'session.work.fg',
  blue: 'effort.easy',
  green: 'fg.muted',
  muted: 'fg.muted',
};
const CHIP_TONE: Record<StatusTone, ChipTone | null> = {
  amber: 'amber',
  coral: 'coral',
  blue: 'blue',
  green: 'green',
  muted: null,
};

/**
 * La semaine en anneau : les séances faites sur les jours conseillés du
 * programme. Sans jour conseillé, pas d'objectif, et un tiret plutôt qu'un
 * anneau vide qui dirait « rien fait ».
 */
const WeekRing = ({ client }: { client: Client }) =>
  client.weekTarget > 0 ? (
    <Box
      role="img"
      aria-label={`${client.weekDone} séance${client.weekDone > 1 ? 's' : ''} sur ${client.weekTarget} cette semaine`}
      data-week={`${client.weekDone}/${client.weekTarget}`}
    >
      <Ring
        part={Math.min(1, client.weekDone / client.weekTarget)}
        size={36}
        stroke={16}
        color="var(--chakra-colors-session-rest)"
      >
        <Text
          fontSize="11px"
          fontWeight="700"
          fontVariantNumeric="tabular-nums"
          aria-hidden
        >
          {client.weekDone}/{client.weekTarget}
        </Text>
      </Ring>
    </Box>
  ) : (
    <Text
      color="fg.muted"
      w="36px"
      textAlign="center"
      aria-label="Pas d’objectif de semaine"
      data-week="none"
    >
      —
    </Text>
  );

/** Les derniers ressentis en points, du plus ancien au plus récent ; aucun,
 * rien — un rang de points éteints dirait cinq séances qui n'ont pas eu lieu.
 * La case vide reste : sur grand écran, elle tient sa colonne. */
const Pulse = ({ efforts }: { efforts: readonly number[] }) =>
  efforts.length > 0 ? (
    <EffortDots
      zones={efforts.map((effort) => getEffortLevel(effort)?.zone ?? null)}
    />
  ) : (
    <Box aria-hidden />
  );

/**
 * Une ligne de la liste : qui, sa semaine, ses derniers ressentis, et ce
 * qui l'attend.
 *
 * Sur téléphone, la ligne d'état sous le nom, l'anneau et les points à
 * droite ; sur grand écran, des colonnes, pour balayer « ce qui attend »
 * sans lire les noms. L'état se dit en couleur sur téléphone et en pastille
 * sur grand écran, comme dans la maquette.
 *
 * Toucher la ligne fait ce que dit `onOpen` (l'atelier, ou l'aperçu à côté
 * sur grand écran) ; le double-clic ouvre toujours l'atelier.
 */
export const ClientRow = ({
  client,
  tags,
  now,
  selected = false,
  onOpen,
  onOpenProgram,
}: {
  client: Client;
  /** Les étiquettes du coach : la ligne montre celles du client. */
  tags: readonly Tag[];
  now: Date;
  selected?: boolean;
  onOpen: () => void;
  onOpenProgram: () => void;
}) => {
  const name = clientName(client);
  const status = statusLine(client, now);
  const chip = CHIP_TONE[status.tone];
  const { shown, more } = visibleTags(client.tagIds, tags);
  return (
    <chakra.button
      type="button"
      onClick={onOpen}
      onDoubleClick={onOpenProgram}
      aria-current={selected ? 'true' : undefined}
      w="full"
      textAlign="left"
      borderTopWidth="1px"
      borderColor="line"
      _first={{ borderTopWidth: 0 }}
      bg={selected ? 'bg.raised' : undefined}
      boxShadow={selected ? 'inset 3px 0 0 {colors.app.primary}' : undefined}
      _hover={{ bg: 'bg.raised' }}
      px={{ base: '16px', md: '18px' }}
      py="13px"
      data-client-row={client._id}
      data-status={status.tone}
    >
      <Grid
        alignItems={{ base: 'start', md: 'center' }}
        columnGap={{ base: '12px', md: '14px' }}
        templateColumns={{
          base: '34px minmax(0, 1fr) auto',
          md: '34px minmax(0, 1fr) 56px 84px minmax(0, 1.3fr)',
        }}
      >
        <Avatar.Root size="sm" w="34px" h="34px">
          <Avatar.Fallback name={name} />
          {client.picture && <Avatar.Image alt="" src={client.picture} />}
        </Avatar.Root>

        <VStack align="start" gap="6px" minW={0}>
          {/* Le nom, puis trois étiquettes au plus et « + 2 » : au-delà,
              la ligne passerait sur trois rangs. */}
          <HStack gap="6px" wrap="wrap" maxW="full" data-row-tags>
            <Text fontWeight="700" fontSize="16px" truncate maxW="full">
              {name}
            </Text>
            {shown.map((tag) => (
              <TagChip key={tag._id} name={tag.name} />
            ))}
            {more > 0 && <Chip tone="outline">+ {more}</Chip>}
          </HStack>
          <Text
            display={{ base: 'block', md: 'none' }}
            fontSize="sm"
            color={TEXT_COLOR[status.tone]}
            data-status-line
          >
            {status.text}
          </Text>
        </VStack>

        {/* Sur téléphone, l'anneau au-dessus des points, à droite ; sur
            grand écran, chacun sa colonne — la pile s'efface
            (`display: contents`) et ses deux enfants prennent place dans
            la grille. Un seul anneau, un seul rang de points. */}
        <VStack display={{ base: 'flex', md: 'contents' }} gap="6px">
          <WeekRing client={client} />
          <Pulse efforts={client.recentEfforts} />
        </VStack>
        <Box
          display={{ base: 'none', md: 'flex' }}
          justifyContent="flex-end"
          minW={0}
          data-status-cell
        >
          {chip ? (
            <Chip tone={chip}>{status.text}</Chip>
          ) : (
            // Une ligne, coupée : « nouveau suivi · programme à écrire »
            // passait sur trois lignes à 1 280 px et faisait d'une ligne
            // de la liste la plus haute de toutes. Le texte entier reste
            // dans `title`.
            <Text
              fontSize="sm"
              color="fg.muted"
              textAlign="right"
              truncate
              title={status.text}
            >
              {status.text}
            </Text>
          )}
        </Box>
      </Grid>
    </chakra.button>
  );
};
