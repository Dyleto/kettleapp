import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import { SessionBlock } from '@/types';
import { InlineSequence, InlineValue } from './InlineValue';
import { formatDuration } from '@/utils/formatters';

interface BlockConfigInlineProps {
  block: SessionBlock;
  onUpdate: (updates: Partial<SessionBlock>) => void;
}

/**
 * Les réglages de bloc s'écrivent comme les durées de la fiche.
 *
 * Ces champs portaient leur unité collée par une espace ordinaire — « 5 s »,
 * « 12 min » —, soit une convention de plus pour la même grandeur. Le coach
 * édite toujours dans l'unité où il pense, mais relit dans l'écriture du
 * produit : « 90 s » posé se relit « 1 min 30 s », comme partout ailleurs.
 */
const enMinutes = (minutes: number) => formatDuration(minutes * 60);

const Sep = ({ children }: { children: string }) => (
  <Text as="span" fontSize="sm" color="fg.muted">
    {children}
  </Text>
);

/**
 * Les réglages d'un bloc, éditables là où ils se lisent — dans l'en-tête.
 *
 * Quatre formes seulement : rien · une valeur · des valeurs composées · une
 * séquence. L'état d'édition reprend exactement les mots de l'état de lecture,
 * seuls les nombres s'encadrent. Jamais de popover, jamais de modale.
 */
export const BlockConfigInline = ({
  block,
  onUpdate,
}: BlockConfigInlineProps) => {
  switch (block.type) {
    // ── Rien à régler ──
    case 'warmup':
    case 'classic':
      return null;

    // ── Une valeur ──
    /*
     * L'EMOM porte son intervalle, et c'est ce qui en fait un E2MOM.
     *
     * Retour du terrain : « quand je fais les EMOM ou E2MOM, je ne peux pas
     * mettre de durée ». C'était exact — l'intervalle n'existait que sur le
     * type « Every », replié derrière les sept formats rares, tandis que
     * l'EMOM, lui, était proposé d'emblée. Un coach qui cherche un E2MOM
     * tombe donc sur l'EMOM et s'y retrouve coincé.
     *
     * Le mode guidé lit déjà `intervalMinutes` pour tous les blocs à tours,
     * EMOM compris : il n'y avait que le réglage à ouvrir.
     */
    case 'every':
    case 'emom':
      return (
        <HStack gap={1}>
          <InlineValue
            value={block.rounds}
            onChange={(v) => onUpdate({ rounds: v })}
            suffix="tours"
            emptyLabel="sans limite"
            ariaLabel="Nombre de tours"
            min={1}
            clearable
          />
          <Sep>toutes les</Sep>
          <InlineValue
            value={block.intervalMinutes ?? 1}
            onChange={(v) => onUpdate({ intervalMinutes: v ?? 1 })}
            suffix="min"
            format={enMinutes}
            ariaLabel="Intervalle en minutes"
            min={1}
          />
        </HStack>
      );
    case 'amrap':
      return (
        <InlineValue
          value={block.durationMinutes}
          onChange={(v) => onUpdate({ durationMinutes: v })}
          suffix="min"
          format={enMinutes}
          emptyLabel="sans limite"
          ariaLabel="Durée en minutes"
          min={1}
          clearable
        />
      );
    case 'timecap':
    case 'chipper':
      return (
        <HStack gap={1}>
          <InlineValue
            value={block.durationMinutes}
            onChange={(v) => onUpdate({ durationMinutes: v })}
            suffix="min"
            format={enMinutes}
            emptyLabel="sans limite"
            ariaLabel="Limite de temps en minutes"
            min={1}
            clearable
          />
          {block.durationMinutes !== undefined && <Sep>max</Sep>}
        </HStack>
      );

    // ── Valeurs composées ──
    case 'tabata':
    case 'onoff':
      return (
        <HStack gap={1}>
          <InlineValue
            value={block.rounds}
            onChange={(v) => onUpdate({ rounds: v })}
            emptyLabel="—"
            ariaLabel="Nombre de tours"
            min={1}
          />
          <Sep>×</Sep>
          {/* Secondes, pas minutes : c'est ce que lit le minuteur du mode
              guidé, et c'est ce que corrige p11-8. */}
          <InlineValue
            value={block.workDuration}
            onChange={(v) => onUpdate({ workDuration: v })}
            suffix="s"
            format={formatDuration}
            emptyLabel="—"
            ariaLabel="Durée de travail en secondes"
            min={1}
          />
          <Sep>/</Sep>
          <InlineValue
            value={block.restDuration}
            onChange={(v) => onUpdate({ restDuration: v })}
            suffix="s"
            format={formatDuration}
            emptyLabel="—"
            ariaLabel="Durée de repos en secondes"
          />
        </HStack>
      );

    // ── Une séquence ──
    case 'pyramid':
    case 'ladder':
      return (
        // Une pyramide peut faire treize paliers : la séquence doit pouvoir
        // se replier et passer à la ligne au lieu d'élargir l'en-tête.
        <Flex gap={2} align="baseline" wrap="wrap" rowGap={1} minW={0}>
          <Box minW={0}>
            <InlineSequence
              value={block.repsScheme}
              onChange={(v) => onUpdate({ repsScheme: v })}
              ariaLabel="Paliers de répétitions"
            />
          </Box>
          <HStack gap={1} flexShrink={0}>
            {/* « repos aucun » ne se dit pas : quand le réglage est vide, la
                valeur porte la phrase entière. */}
            {block.restBetweenRounds !== undefined && <Sep>repos</Sep>}
            <InlineValue
              value={block.restBetweenRounds}
              onChange={(v) => onUpdate({ restBetweenRounds: v })}
              suffix="s"
              format={formatDuration}
              emptyLabel="sans repos"
              ariaLabel="Repos entre paliers en secondes"
              width="72px"
              clearable
            />
          </HStack>
        </Flex>
      );
  }
};
