import type { ReactElement } from 'react';
import { Box, Grid, Text, VStack } from '@chakra-ui/react';
import { useRef } from 'react';
import { EFFORT_LEVELS, EFFORT_ZONE_COLOR, getEffortLevel } from '../constants';

interface EffortScaleProps {
  /** `undefined` = rien de choisi. Jamais présélectionné : une valeur que
   *  personne n'a choisie ne doit pas pouvoir s'enregistrer comme une
   *  réponse. */
  value?: number;
  onChange: (value: number) => void;
}

/** Deux yeux ouverts, à la hauteur voulue. */
const Eyes = ({ y }: { y: number }) => (
  <>
    <circle cx="14" cy={y} r="1.6" fill="currentColor" stroke="none" />
    <circle cx="26" cy={y} r="1.6" fill="currentColor" stroke="none" />
  </>
);

/**
 * Le visage de chaque cran, rangé par valeur enregistrée.
 *
 * Cinq expressions qui se distinguent sans lire : des yeux plissés de
 * contentement, un sourire, un grand sourire, des sourcils froncés sur une
 * bouche droite, des yeux en croix. Le cran du milieu sourit le plus
 * franchement — c'est la cible, pas une note moyenne.
 */
const FACES: Record<number, ReactElement> = {
  1: <path d="M11 17q3 -3 6 0M23 17q3 -3 6 0M15 25q5 3 10 0" />,
  2: (
    <>
      <Eyes y={17} />
      <path d="M14 24q6 5 12 0" />
    </>
  ),
  3: (
    <>
      <Eyes y={17} />
      <path d="M12.5 23q7.5 8 15 0z" />
    </>
  ),
  4: (
    <>
      <path d="M11 13l5 2M29 13l-5 2M14 26h12" />
      <Eyes y={18} />
    </>
  ),
  5: (
    <>
      <path d="M12 15l4 4m0 -4l-4 4M24 15l4 4m0 -4l-4 4" />
      <circle cx="20" cy="27" r="3" />
    </>
  ),
};

/**
 * Les cinq crans du ressenti, du plus facile au plus dur.
 *
 * Elle se lisait dans l'autre sens, et avec des numéros : « 1 » y voulait
 * dire « Trop dure », alors que la valeur enregistrée pour ce cran est 5 et
 * que le coach lit la même échelle de « Trop facile » à « Trop dure ». Deux
 * personnes regardaient la même réponse sur deux échelles inversées, dont
 * une numérotée à rebours de ce qu'elle enregistre.
 *
 * Il n'y a plus de numéros — ce n'est pas une note — et plus qu'un sens,
 * celui des valeurs enregistrées. Un visage se reconnaît en fin de séance,
 * les mains moites, sans lire ; son nom s'écrit dessous dès qu'on le touche.
 *
 * Une échelle à cible centrale : « Juste » est au milieu. Rien n'est
 * présélectionné, parce qu'une valeur que le client n'a pas choisie irait
 * nourrir la tendance que son coach lit.
 */
export const EffortScale = ({ value, onChange }: EffortScaleProps) => {
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  const selected = getEffortLevel(value);

  const move = (from: number, delta: number) => {
    const next = Math.min(EFFORT_LEVELS.length - 1, Math.max(0, from + delta));
    onChange(EFFORT_LEVELS[next].value);
    refs.current[next]?.focus();
  };

  return (
    <VStack align="stretch" gap={3}>
      <Grid
        templateColumns="repeat(5, 1fr)"
        gap={2}
        role="radiogroup"
        aria-label="Difficulté de la séance"
        // La marge laisse au visage choisi la place de grandir et de monter
        // sans passer sous ce qui le précède.
        pt={2}
      >
        {EFFORT_LEVELS.map((level, i) => {
          const isSelected = level.value === value;
          const color = EFFORT_ZONE_COLOR[level.zone];
          return (
            <Box
              key={level.value}
              ref={(el: HTMLDivElement | null) => {
                refs.current[i] = el;
              }}
              role="radio"
              aria-checked={isSelected}
              aria-label={`${level.label} — ${level.description}`}
              // Une seule entrée au clavier : on tabule jusqu'à l'échelle, puis
              // on la parcourt aux flèches.
              tabIndex={isSelected || (!value && i === 0) ? 0 : -1}
              aspectRatio="1"
              display="grid"
              placeItems="center"
              borderRadius="button"
              cursor="pointer"
              bg={isSelected ? `${color}/20` : 'surface.card'}
              color={isSelected ? color : 'fg.muted'}
              transform={isSelected ? 'scale(1.12) translateY(-4px)' : 'none'}
              onClick={() => onChange(level.value)}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                  e.preventDefault();
                  move(i, 1);
                } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                  e.preventDefault();
                  move(i, -1);
                } else if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange(level.value);
                }
              }}
              _hover={{ color: isSelected ? color : 'fg' }}
              transition="transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1), background-color 150ms, color 150ms"
              _motionReduce={{ transition: 'none' }}
            >
              <svg
                width="66%"
                height="66%"
                viewBox="0 0 40 40"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                focusable="false"
              >
                <circle cx="20" cy="20" r="16" />
                {FACES[level.value]}
              </svg>
            </Box>
          );
        })}
      </Grid>

      {/* Hauteur réservée : choisir un visage ne doit pas faire sauter la
          boîte au moment de la touche. Avant le choix, la ligne dit dans
          quel sens se lit l'échelle — sans numéros ni noms sous les visages,
          c'est la seule chose qu'il reste à savoir. */}
      <VStack gap={0.5} minH="48px" justify="center" textAlign="center">
        {selected ? (
          <>
            <Text
              fontSize="19px"
              fontWeight="bold"
              lineHeight="1.2"
              color={EFFORT_ZONE_COLOR[selected.zone]}
            >
              {selected.label}
            </Text>
            <Text fontSize="13px" color="fg.muted">
              {selected.description}
            </Text>
          </>
        ) : (
          <Text fontSize="13px" color="fg.muted">
            Du plus facile au plus dur, comme ton coach le lit.
          </Text>
        )}
      </VStack>
    </VStack>
  );
};
