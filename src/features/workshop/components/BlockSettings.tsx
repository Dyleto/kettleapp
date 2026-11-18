import { Fragment, type ReactNode } from 'react';
import { Box, Text } from '@chakra-ui/react';
import type { SessionBlock } from '@/shared/types';
import { formatDuration } from '@/shared/utils/formatters';
import { BlockPill, StaticPill } from './BlockPill';
import { InlineSequence } from './InlineValue';
import { Stepper } from './Stepper';

/**
 * Les réglages d'un bloc s'écrivent comme les durées de la carte : « 90 s »
 * saisi se relit « 1 min 30 s », comme partout ailleurs. Le coach édite dans
 * l'unité dans laquelle il pense, et relit dans l'orthographe du produit.
 */
const inMinutes = (minutes: number) => formatDuration(minutes * 60);
const seconds = (value?: number) =>
  value === undefined ? '—' : formatDuration(value);
const NBSP = '\u00A0';
const tours = (n: number) => `${n}${NBSP}tour${n > 1 ? 's' : ''}`;

type Update = (updates: Partial<SessionBlock>) => void;
/** `pill` : le réglage ouvert dans l'en-tête, prêt à la frappe. `sheet` :
 * en grand dans la feuille du téléphone. */
type Size = 'pill' | 'sheet';

/** Un réglage de bloc : ce que dit sa pastille, et comment il se règle. */
interface Setting {
  key: string;
  /** Pour qui ne voit pas, et c'est aussi le nom de son champ. */
  label: string;
  display: string;
  edit: (size: Size) => ReactNode;
}

/** Une limite de temps, vide pour « sans limite » : chipper, TimeCap,
 * échelle. */
const limitSetting = (block: SessionBlock, onUpdate: Update): Setting => ({
  key: 'limit',
  label: 'Limite de temps en minutes',
  display: block.durationMinutes
    ? `limite ${inMinutes(block.durationMinutes)}`
    : 'sans limite',
  edit: (size) => (
    <Stepper
      kind="minutes"
      noun="la limite"
      value={block.durationMinutes}
      onChange={(v) => onUpdate({ durationMinutes: v })}
      ariaLabel="Limite de temps en minutes"
      label="Limite"
      format={inMinutes}
      emptyLabel="sans limite"
      note="vide = sans limite"
      clearable
      startOpen={size === 'pill'}
      size={size === 'pill' ? 'row' : 'sheetSmall'}
    />
  ),
});

/** Le nombre de tours. Vide, l'EMOM tourne sans fin ; un Tabata, lui, en
 * a toujours. */
const roundsSetting = (
  block: SessionBlock,
  onUpdate: Update,
  optional: boolean
): Setting => ({
  key: 'rounds',
  label: 'Nombre de tours',
  display: block.rounds
    ? tours(block.rounds)
    : optional
      ? 'sans limite'
      : '— tours',
  edit: (size) => (
    <Stepper
      kind="rounds"
      value={block.rounds}
      onChange={(v) => onUpdate({ rounds: v })}
      ariaLabel="Nombre de tours"
      label="Tours"
      unit="tours"
      emptyLabel={optional ? 'sans limite' : '—'}
      note={optional ? 'vide = sans limite' : undefined}
      clearable={optional}
      startOpen={size === 'pill'}
      size={size === 'pill' ? 'row' : 'sheetSmall'}
    />
  ),
});

/**
 * Les réglages que chaque format lit, dans l'ordre de la maquette.
 *
 * Quatre formes seulement : rien · une valeur · des valeurs composées · une
 * suite. Un échauffement et un bloc classique n'en ont pas : leurs réglages
 * sont sur chaque exercice.
 */
const settingsOf = (block: SessionBlock, onUpdate: Update): Setting[] => {
  switch (block.type) {
    case 'warmup':
    case 'classic':
      return [];

    /*
     * L'EMOM porte son intervalle, et c'est ce qui en fait un E2MOM.
     *
     * Retour du terrain : « quand je fais des EMOM ou des E2MOM, je ne peux
     * pas régler de durée. » L'intervalle n'existait que sur le type
     * « Every », replié derrière les formats rares ; un coach qui cherchait
     * un E2MOM atterrissait sur l'EMOM et s'y trouvait coincé.
     */
    case 'every':
    case 'emom':
      return [
        roundsSetting(block, onUpdate, true),
        {
          key: 'interval',
          label: 'Intervalle en minutes',
          display: `toutes les ${inMinutes(block.intervalMinutes ?? 1)}`,
          edit: (size) => (
            <Stepper
              kind="minutes"
              noun="l’intervalle"
              value={block.intervalMinutes ?? 1}
              onChange={(v) => onUpdate({ intervalMinutes: v ?? 1 })}
              ariaLabel="Intervalle en minutes"
              label="Toutes les"
              format={inMinutes}
              note="durée d’un tour"
              startOpen={size === 'pill'}
              size={size === 'pill' ? 'row' : 'sheetSmall'}
            />
          ),
        },
      ];

    case 'amrap':
      return [
        {
          key: 'duration',
          label: 'Durée en minutes',
          display: block.durationMinutes
            ? inMinutes(block.durationMinutes)
            : 'sans limite',
          edit: (size) => (
            <Stepper
              kind="minutes"
              value={block.durationMinutes}
              onChange={(v) => onUpdate({ durationMinutes: v })}
              ariaLabel="Durée en minutes"
              label="Durée"
              format={inMinutes}
              emptyLabel="sans limite"
              note="vide = sans limite"
              clearable
              startOpen={size === 'pill'}
              size={size === 'pill' ? 'row' : 'sheetSmall'}
            />
          ),
        },
      ];

    case 'timecap':
    case 'chipper':
      return [limitSetting(block, onUpdate)];

    // Des secondes, pas des minutes : c'est ce que lit le minuteur de la
    // séance guidée.
    case 'tabata':
    case 'onoff':
      return [
        roundsSetting(block, onUpdate, false),
        {
          key: 'workRest',
          label: 'Travail et repos',
          display: `${seconds(block.workDuration)} / ${seconds(block.restDuration)}`,
          edit: (size) => (
            <>
              <Stepper
                kind="duration"
                noun="le travail"
                value={block.workDuration}
                onChange={(v) => onUpdate({ workDuration: v })}
                ariaLabel="Durée de travail en secondes"
                label="Travail"
                format={formatDuration}
                note="de travail"
                startOpen={size === 'pill'}
                size={size === 'pill' ? 'row' : 'sheetSmall'}
              />
              <Stepper
                kind="duration"
                noun="le repos"
                value={block.restDuration}
                onChange={(v) => onUpdate({ restDuration: v })}
                ariaLabel="Durée de repos en secondes"
                label="Repos"
                format={formatDuration}
                note="de repos"
                size={size === 'pill' ? 'row' : 'sheetSmall'}
              />
            </>
          ),
        },
      ];

    case 'ladder':
      return [
        {
          key: 'scheme',
          label: 'Paliers de répétitions',
          display: block.repsScheme?.length
            ? block.repsScheme.join(' · ')
            : 'aucun palier',
          edit: (size) => (
            <Box>
              {size === 'sheet' && (
                <Text fontSize="sm" color="fg.muted" mb={1}>
                  Paliers
                </Text>
              )}
              <InlineSequence
                value={block.repsScheme}
                onChange={(v) => onUpdate({ repsScheme: v })}
                ariaLabel="Paliers de répétitions"
                startOpen={size === 'pill'}
              />
            </Box>
          ),
        },
        // La limite, réglée comme sur un chipper : la séance guidée en tire
        // un compte à rebours, et le bilan le palier atteint et le temps.
        // Vide, l'échelle reste une suite de paliers à cocher.
        limitSetting(block, onUpdate),
        {
          key: 'rest',
          label: 'Repos entre paliers en secondes',
          display: block.restBetweenRounds
            ? `repos ${formatDuration(block.restBetweenRounds)}`
            : 'sans repos',
          edit: (size) => (
            <Stepper
              kind="rest"
              noun="le repos"
              value={block.restBetweenRounds}
              onChange={(v) => onUpdate({ restBetweenRounds: v })}
              ariaLabel="Repos entre paliers en secondes"
              label="Repos"
              format={formatDuration}
              emptyLabel="sans repos"
              note="entre deux paliers"
              clearable
              startOpen={size === 'pill'}
              size={size === 'pill' ? 'row' : 'sheetSmall'}
            />
          ),
        },
      ];
  }
};

interface BlockSettingsProps {
  block: SessionBlock;
  onUpdate: Update;
  /**
   * `pills` : des pastilles à toucher, dans l'en-tête. `static` : les mêmes
   * pastilles, muettes — sur téléphone, c'est l'en-tête entier qui ouvre
   * les réglages. `sheet` : les réglages en grand, dans cette feuille.
   */
  layout: 'pills' | 'static' | 'sheet';
}

/**
 * Les réglages d'un bloc, là où ils se lisent.
 *
 * Une seule liste par format, rendue de trois façons : les trois disent la
 * même chose, et une pastille ne peut pas annoncer un réglage que la
 * feuille ne propose pas.
 */
export const BlockSettings = ({
  block,
  onUpdate,
  layout,
}: BlockSettingsProps) => {
  const settings = settingsOf(block, onUpdate);
  if (layout === 'sheet')
    return (
      <>
        {settings.map((s) => (
          <Fragment key={s.key}>{s.edit('sheet')}</Fragment>
        ))}
      </>
    );
  return (
    <>
      {settings.map((s) =>
        layout === 'static' ? (
          <StaticPill key={s.key}>{s.display}</StaticPill>
        ) : (
          <BlockPill key={s.key} label={s.label} display={s.display}>
            {() => s.edit('pill')}
          </BlockPill>
        )
      )}
    </>
  );
};
