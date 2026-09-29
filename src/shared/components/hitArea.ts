import type { SystemStyleObject } from '@chakra-ui/react';

/**
 * The question asked is not "is the screen small", it is "what is pointing".
 * A 900 px tablet is driven by a finger, and so is a 1280 px laptop with a
 * touchscreen; width does not say so. `(hover: none)` does.
 */
export const TACTILE = '@media (hover: none)';

/**
 * Extends a control's touchable area to 44 px without touching its visible
 * size.
 *
 * In-place editing makes the app dense and readable, but it mechanically
 * produces targets the size of their text: 96 % of the editor's controls fell
 * under 44 px on mobile, some at 24 × 16. Rather than enlarging the
 * typography — which would destroy the density — we lay a centred transparent
 * rectangle over the control, and it receives the finger.
 *
 * Two neighbouring controls cannot each claim 44 px when they are spaced less
 * than that apart: their zones overlap, and the last one in the DOM wins.
 * Hence two sizes in the app:
 *
 *   44 px — isolated controls: calendar cells, list rows, bottom-of-screen
 *           buttons, effort scale steps.
 *   32 px — the editor's gutters and inline values under a mouse, where
 *           controls follow each other 8 px apart. That is above the WCAG
 *           2.5.8 floor (24 px), and it is the maximum reachable at that
 *           spacing.
 *
 * That spacing is not a fatality: `hitAreaTactile`, below, gives back the
 * 44 px everywhere the layout first pushes the neighbours apart for touch.
 */
export const hitArea = (size = 44): SystemStyleObject => ({
  position: 'relative',
  _after: {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    minWidth: `${size}px`,
    minHeight: `${size}px`,
    width: '100%',
    height: '100%',
    // Captures the pointer only: invisible, and never in the flow.
    pointerEvents: 'auto',
  },
});

/**
 * The same zone, but accounting for a finger.
 *
 * The editor's 32 px is a mouse compromise: at a cursor's precision it is
 * enough. Under a finger it is not — and the reason capping it at 32
 * (neighbouring controls 8 px apart) is not a fatality, it is a layout. Where
 * controls are pushed apart for touch, the zone can take its 44 px back
 * without covering its neighbour.
 *
 * Hence this variant rather than a change to `hitArea`: it only applies where
 * the neighbours have first been pushed apart.
 */
export const hitAreaTactile = (souris = 32): SystemStyleObject => ({
  ...hitArea(souris),
  [TACTILE]: {
    '&::after': {
      minWidth: '44px',
      minHeight: '44px',
    },
  },
});

/**
 * The gap to put between two controls whose zones are 44 px.
 *
 * Three 24 px pictograms spaced 8 apart cannot carry three 44 px zones: they
 * overlap, and the last one in the DOM receives the finger — so "Supprimer"
 * instead of "Changer l'unité". 24 + 20 puts 44 px between two centres: the
 * zones touch without ever crossing.
 *
 * We push apart rather than enlarge, and that is a measured choice: with
 * 40 px boxes the gutter went from 103 to 136 px wide, the editor's row broke
 * into two levels and doubled in height — 36 px to 77. The spacing costs 9 px
 * of width and keeps the editor readable.
 */
export const ecartTactile: SystemStyleObject = {
  [TACTILE]: { gap: '20px' },
};

/**
 * The minimum vertical spacing of a list of controls under a finger.
 *
 * The same rule the other way: two rows following each other 36 px apart
 * cannot each carry a 44 px zone.
 */
export const pasTactile: SystemStyleObject = {
  [TACTILE]: { minHeight: '44px' },
};
