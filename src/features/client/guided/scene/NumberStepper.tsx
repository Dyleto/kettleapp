import { useEffect, useRef } from 'react';
import { Box, Input, Text } from '@chakra-ui/react';
import { useNumberDraft } from '@/shared/hooks/useNumberDraft';

interface NumberStepperProps {
  /** Le nombre affiché — noté, ou proposé. */
  value?: number;
  onChange: (next?: number) => void;
  /** Le pas d'un bouton : ce que devient la valeur, `delta` en plus. */
  step: (value: number | undefined, delta: number) => number | undefined;
  /** « kg », « reps ». */
  unit: string;
  /** Une charge se tape « 22,5 » ; un nombre de répétitions, non. */
  decimals: boolean;
  /** Les noms des deux boutons : « Un kilo de moins », « Un kilo de plus ». */
  stepLabels: [string, string];
  /** « comme la dernière fois », « 2 de moins que prescrit ». */
  legend?: string;
  /** Le nom du champ pour un lecteur d'écran : le mouvement et la série. */
  label: string;
}

/** Après ce délai, un appui devient un appui long. */
const HOLD_DELAY = 450;
/** Pendant un appui long, la charge avance de ce pas à ce rythme. */
const HOLD_STEP = 5;
const HOLD_EVERY = 350;

/**
 * Un bouton − ou + du sélecteur.
 *
 * Un appui court fait un kilo, un appui long cinq, et se répète tant qu'on
 * garde le doigt : passer de 20 à 40 kg ne doit pas coûter vingt touches.
 * Le clavier passe par `click`, dont `detail` vaut zéro quand aucun pointeur
 * ne l'a déclenché — sans ce tri, une touche au doigt compterait deux fois.
 */
const StepButton = ({
  label,
  sign,
  onStep,
}: {
  label: string;
  sign: 1 | -1;
  onStep: (delta: number) => void;
}) => {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  // La répétition relit le pas à chaque coup. Elle gardait celui du moment
  // où le doigt s'était posé, donc la charge de ce moment-là : un appui long
  // donnait « 30 » et s'y arrêtait, quelle que soit sa durée. Le banc l'a
  // vu en tenant le bouton une seconde.
  const latest = useRef(onStep);
  useEffect(() => {
    latest.current = onStep;
  });

  const stop = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => stop, []);

  const repeat = () => {
    held.current = true;
    latest.current(sign * HOLD_STEP);
    timer.current = setTimeout(repeat, HOLD_EVERY);
  };

  return (
    <Box
      as="button"
      aria-label={label}
      w="60px"
      h="60px"
      flexShrink={0}
      borderRadius="18px"
      bg="bg.canvas"
      display="grid"
      placeItems="center"
      fontSize="28px"
      fontWeight="bold"
      lineHeight="1"
      userSelect="none"
      css={{ touchAction: 'manipulation' }}
      onPointerDown={() => {
        held.current = false;
        stop();
        timer.current = setTimeout(repeat, HOLD_DELAY);
      }}
      onPointerUp={() => {
        stop();
        if (!held.current) onStep(sign);
      }}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onClick={(event: React.MouseEvent) => {
        if (event.detail === 0) onStep(sign);
      }}
    >
      {sign > 0 ? '+' : '−'}
    </Box>
  );
};

/**
 * Un nombre de la série, réglé au pouce : la charge, ou les répétitions
 * faites.
 *
 * Un champ de saisie demandait d'ouvrir le clavier à chaque série, mains
 * moites, pour taper une valeur qui était le plus souvent celle de la série
 * d'avant. Le nombre est maintenant proposé, en grand, et se corrige d'une
 * unité par touche. Toucher le nombre ouvre quand même le clavier
 * numérique : « 22,5 » s'y tape, avec une virgule ou un point.
 *
 * Le nombre entier est sélectionné à la touche : on tape la nouvelle valeur
 * par-dessus l'ancienne, au lieu de l'ajouter derrière.
 *
 * Né pour la charge ; les répétitions l'ont rejoint (C4) plutôt que d'en
 * avoir une seconde copie, qui aurait divergé à la première retouche.
 */
export const NumberStepper = ({
  value,
  onChange,
  step: stepValue,
  unit,
  decimals,
  stepLabels,
  legend,
  label,
}: NumberStepperProps) => {
  const { text, onText, onLeave } = useNumberDraft({
    value,
    onChange,
    decimals,
  });
  const step = (delta: number) => {
    onLeave();
    onChange(stepValue(value, delta));
  };
  // Le champ vient de prendre le focus : le relâchement du doigt qui suit
  // ne doit pas défaire la sélection.
  const justFocused = useRef(false);

  return (
    <Box
      display="grid"
      gridTemplateColumns="60px 1fr 60px"
      alignItems="center"
      gap="10px"
      bg="bg.surface"
      borderRadius="card"
      p={2}
    >
      <StepButton label={stepLabels[0]} sign={-1} onStep={step} />
      <Box textAlign="center" minW={0}>
        <Box
          display="flex"
          alignItems="baseline"
          justifyContent="center"
          gap={1.5}
        >
          <Input
            aria-label={label}
            inputMode={decimals ? 'decimal' : 'numeric'}
            value={text}
            placeholder="—"
            onChange={(event) => onText(event.target.value)}
            onBlur={onLeave}
            // Tout le nombre est sélectionné dès le focus, et non une frame
            // plus tard : la sélection différée arrivait après la première
            // touche, et « 22,5 » tapé d'un trait donnait « 2,5 ». Le banc
            // l'a vu, en tapant caractère par caractère. Le relâchement du
            // doigt qui suit la touche placerait le curseur et défairait la
            // sélection : on l'en empêche, une fois.
            onFocus={(event) => {
              event.currentTarget.select();
              justFocused.current = true;
            }}
            onMouseUp={(event) => {
              if (!justFocused.current) return;
              justFocused.current = false;
              event.preventDefault();
            }}
            w="4.2ch"
            h="auto"
            p={0}
            border="none"
            bg="transparent"
            textAlign="right"
            fontFamily="heading"
            // Exclu de la règle qui ramène les champs à 16 px contre le zoom
            // d'iOS (voir `theme.ts`) : au-dessus de 16 px, iOS ne zoome pas.
            data-big-number=""
            fontSize="42px"
            fontWeight="800"
            fontStretch="76%"
            fontVariantNumeric="tabular-nums"
            lineHeight="1"
            _focusVisible={{ outline: 'none', boxShadow: 'none' }}
          />
          <Text fontWeight="bold" fontSize="17px">
            {unit}
          </Text>
        </Box>
        {legend && (
          <Text fontSize="12.5px" color="fg.muted" mt="2px">
            {legend}
          </Text>
        )}
      </Box>
      <StepButton label={stepLabels[1]} sign={1} onStep={step} />
    </Box>
  );
};
