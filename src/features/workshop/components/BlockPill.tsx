import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { chakra, HStack } from '@chakra-ui/react';
import { touchHitArea } from '@/kit';
import { useOutsideDismiss } from '@/shared/hooks/useOutsideDismiss';

/** L'habillage d'une pastille : ambre pour un réglage, contour pour un
 * nom — la maquette les distingue ainsi. */
const LOOK = {
  amber: { bg: 'app.primary.bg', color: 'app.primary.fg', boxShadow: 'none' },
  outline: {
    bg: 'transparent',
    color: 'fg.muted',
    boxShadow: 'inset 0 0 0 1.5px {colors.line}',
  },
} as const;

const pillStyle = (tone: keyof typeof LOOK) => ({
  ...LOOK[tone],
  display: 'inline-flex',
  alignItems: 'center',
  px: '11px',
  py: '4px',
  borderRadius: 'full',
  fontSize: '13px',
  fontWeight: '600',
  lineHeight: '1.25',
  whiteSpace: 'nowrap',
  // L'en-tête s'écrit en capitales espacées ; une pastille se lit comme
  // une valeur, pas comme un titre.
  textTransform: 'none',
  letterSpacing: 'normal',
  fontVariantNumeric: 'tabular-nums',
});

/** Une pastille qui ne fait que dire : l'en-tête d'un bloc sur téléphone,
 * où c'est l'en-tête entier qui ouvre les réglages. */
export const StaticPill = ({
  tone = 'amber',
  children,
}: {
  tone?: keyof typeof LOOK;
  children: ReactNode;
}) => <chakra.span {...pillStyle(tone)}>{children}</chakra.span>;

interface BlockPillProps {
  /** Le nom du réglage pour qui ne voit pas : « Nombre de tours ». */
  label: string;
  /** Ce qui se lit dans la pastille : « 10 tours », « sans limite ». */
  display: string;
  tone?: keyof typeof LOOK;
  /** Ouverte dès qu'elle paraît : le menu du bloc vient de la demander. */
  initiallyOpen?: boolean;
  /** Prévenu quand elle se referme, quelle qu'en soit la raison. */
  onClose?: () => void;
  /** Le réglage, une fois la pastille touchée. Reçoit de quoi la
   * refermer, pour un champ qui sait quand il a fini. */
  children: (close: () => void) => ReactNode;
}

/**
 * Un réglage de bloc en pastille, qui s'ouvre là où il se lit.
 *
 * L'en-tête d'un bloc portait ses réglages en nombres soulignés au fil
 * d'une phrase — « 10 tours toutes les 1 min » — qu'on ne savait pas
 * cliquables avant de les survoler. La maquette en fait des pastilles, une
 * par réglage : on voit d'un coup d'œil ce qui se règle, et le toucher
 * l'ouvre sur place, sans fenêtre. Un clic ailleurs ou Échap la referme.
 */
export const BlockPill = ({
  label,
  display,
  tone = 'amber',
  initiallyOpen = false,
  onClose,
  children,
}: BlockPillProps) => {
  const [open, setOpen] = useState(initiallyOpen);
  const [refocus, setRefocus] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLButtonElement>(null);

  /**
   * Le focus revient à la pastille quand il était dans son réglage : au
   * clavier, Échap ne doit pas renvoyer en haut de la page.
   *
   * Lu sur le document et rendu par un effet, sans toucher aux références
   * ici : cette fonction est passée au réglage pendant le rendu.
   */
  const close = useCallback(() => {
    const active = document.activeElement;
    setRefocus(!!active?.closest('[data-pill-open]'));
    setOpen(false);
    onClose?.();
  }, [onClose]);
  useOutsideDismiss(rootRef, open, close);
  useEffect(() => {
    if (!open && refocus) pillRef.current?.focus();
  }, [open, refocus]);

  if (open)
    return (
      <HStack
        ref={rootRef}
        data-pill-open
        gap="8px"
        wrap="wrap"
        textTransform="none"
        letterSpacing="normal"
        fontWeight="normal"
      >
        {children(close)}
      </HStack>
    );

  return (
    <chakra.button
      ref={pillRef}
      type="button"
      aria-label={`${label} : ${display}`}
      aria-expanded={false}
      onClick={() => {
        setRefocus(false);
        setOpen(true);
      }}
      {...pillStyle(tone)}
      _hover={{ filter: 'brightness(1.15)' }}
      css={touchHitArea()}
    >
      {display}
    </chakra.button>
  );
};
