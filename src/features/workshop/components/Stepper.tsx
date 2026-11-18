import { Box, chakra, HStack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';
import { TOUCH } from '@/kit';
import { stepped, type StepKind } from '@/domain/session/doseEdit';
import { InlineValue } from './InlineValue';

/** Ce que « − » et « + » disent à qui ne les voit pas. */
const NOUN: Record<StepKind, string> = {
  sets: 'les séries',
  reps: 'les répétitions',
  duration: 'la durée',
  rest: 'le repos',
  custom: 'la mesure',
};

interface StepperProps {
  kind: StepKind;
  value?: number;
  onChange: (value?: number) => void;
  /** Le nom du champ, pour la saisie au clavier : « Répétitions — Goblet
   * Squat ». C'est aussi ce que le banc vise. */
  ariaLabel: string;
  /** « Reps », « Durée » : ce qui se lit devant, sur une ligne. */
  label?: string;
  /** « reps », « tours » : ce qui suit le nombre, dans la feuille. */
  unit?: string;
  /** « par tour », « par série » : sous le nombre, dans la feuille. */
  note?: string;
  emptyLabel?: string;
  format?: (value: number) => string;
  decimals?: boolean;
  clearable?: boolean;
  startOpen?: boolean;
  /** Ce qui suit le nombre et se règle avec lui : l'unité d'une mesure
   * libre. */
  trailing?: ReactNode;
  /** `row` dans la ligne ouverte, `sheet` en grand dans la feuille,
   * `sheetSmall` pour un réglage secondaire de la feuille. */
  size?: 'row' | 'sheet' | 'sheetSmall';
}

/** Un « − » ou un « + ». */
const StepButton = ({
  label,
  onClick,
  size,
  children,
}: {
  label: string;
  onClick: () => void;
  size: StepperProps['size'];
  children: string;
}) => {
  const box =
    size === 'sheet' ? '60px' : size === 'sheetSmall' ? '44px' : '30px';
  return (
    <chakra.button
      type="button"
      aria-label={label}
      onClick={onClick}
      w={box}
      h={box}
      flexShrink={0}
      display="grid"
      placeItems="center"
      borderRadius={size === 'row' ? '9px' : size === 'sheet' ? '18px' : '13px'}
      bg={size === 'row' ? 'bg.raised' : 'bg.canvas'}
      color="fg"
      fontWeight="bold"
      fontSize={
        size === 'sheet' ? '28px' : size === 'sheetSmall' ? '22px' : '17px'
      }
      lineHeight="1"
      _hover={{ bg: 'whiteAlpha.200' }}
      // 30 px sous une souris, 44 sous un doigt : la ligne ouverte se règle
      // aussi sur une tablette.
      css={
        size === 'row'
          ? { [TOUCH]: { width: '44px', height: '44px' } }
          : undefined
      }
    >
      {children}
    </chakra.button>
  );
};

/**
 * Un réglage qu'on pousse : « − 12 + ».
 *
 * Les valeurs de l'atelier se tapaient toutes au clavier : sur un
 * téléphone, passer de 12 à 15 répétitions, c'était viser un nombre de
 * 22 px, attendre le clavier, effacer, taper, refermer. Les − et + font le
 * pas courant d'une touche ; le nombre reste un champ pour le reste —
 * Entrée valide, Échap rend la valeur d'avant.
 */
export const Stepper = ({
  kind,
  value,
  onChange,
  ariaLabel,
  label,
  unit,
  note,
  emptyLabel,
  format,
  decimals,
  clearable,
  startOpen,
  trailing,
  size = 'row',
}: StepperProps) => {
  const minus = (
    <StepButton
      label={`Diminuer ${NOUN[kind]}`}
      onClick={() => onChange(stepped(kind, value, -1))}
      size={size}
    >
      −
    </StepButton>
  );
  const plus = (
    <StepButton
      label={`Augmenter ${NOUN[kind]}`}
      onClick={() => onChange(stepped(kind, value, 1))}
      size={size}
    >
      +
    </StepButton>
  );
  const field = (
    <InlineValue
      value={value}
      onChange={onChange}
      ariaLabel={ariaLabel}
      emptyLabel={emptyLabel}
      format={format}
      decimals={decimals}
      clearable={clearable}
      startOpen={startOpen}
      min={kind === 'rest' || kind === 'custom' ? 0 : 1}
      width={size === 'row' ? '52px' : '96px'}
      fontSize={
        size === 'sheet' ? '42px' : size === 'sheetSmall' ? '30px' : 'md'
      }
    />
  );

  if (size === 'row')
    return (
      <HStack
        gap="8px"
        bg="bg.canvas"
        borderRadius="13px"
        py="4px"
        pl="12px"
        pr="5px"
        fontSize="13px"
        color="fg.muted"
      >
        {label && <Text as="span">{label}</Text>}
        {minus}
        <Box minW="30px" textAlign="center">
          {field}
        </Box>
        {trailing}
        {plus}
      </HStack>
    );

  return (
    <Box
      display="grid"
      gridTemplateColumns={size === 'sheet' ? '60px 1fr 60px' : '44px 1fr 44px'}
      alignItems="center"
      gap="10px"
      bg="bg.raised"
      borderRadius={size === 'sheet' ? '24px' : '18px'}
      p={size === 'sheet' ? '8px' : '6px'}
    >
      {minus}
      <Box textAlign="center" minW={0}>
        <HStack justify="center" align="baseline" gap="6px" wrap="wrap">
          {field}
          {unit && (
            <Text as="span" fontWeight="bold">
              {unit}
            </Text>
          )}
          {trailing}
        </HStack>
        {note && (
          <Text fontSize="12.5px" color="fg.muted" mt="2px">
            {note}
          </Text>
        )}
      </Box>
      {plus}
    </Box>
  );
};
