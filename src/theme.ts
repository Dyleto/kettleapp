import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const customConfig = defineConfig({
  theme: {
    semanticTokens: {
      colors: {
        // Couleurs principales
        app: {
          primary: {
            DEFAULT: { value: '{colors.amber}' },
            hover: { value: '#DFB563' },
            active: { value: '#B3852F' },
            bg: { value: '#CF9F3F1A' },
            border: { value: '#CF9F3F4D' },
          },
          // States
          success: {
            DEFAULT: { value: '#3FA8A0' },
            hover: { value: '#55BBB3' },
            active: { value: '#33908A' },
          },
          error: { value: '#E2574C' },
        },

        /**
         * The ring on Chakra's own components.
         *
         * Chakra sets `--focus-ring-color` on the element, from this token: a
         * global rule cannot beat it on specificity. Without this override,
         * half the targets kept the default grey — measured
         * `rgb(161, 161, 170)` — next to the amber of the rest of the app.
         */
        gray: {
          focusRing: { value: '{colors.amber}' },
        },
        red: {
          focusRing: { value: '{colors.amber}' },
        },

        bg: {
          canvas: { value: '#17181B' },
          surface: { value: '#26282D' },
        },
        surface: {
          wall: { value: '#17181B' },
          card: { value: '#1E2024' },
        },

        fg: {
          DEFAULT: { value: '#ECE8DE' },
          muted: { value: '#A6A49A' },
        },

        /**
         * Effort has its own scale, and it crosses no action colour.
         *
         * Amber carried six meanings on its own: the brand, the primary
         * action, the active sort, the unread badge, the index letters and a
         * "Juste" rating. A hue that means six things no longer means much,
         * and it is the one that has to draw the eye.
         *
         * The rule now held: amber says only two things — "this is an action"
         * and "this is where you are". Effort is data: you do not click it,
         * it has no business in the brand palette.
         *
         * The scale is diverging, cold → warm, because the quantity is too:
         * too easy and too hard are two departures either side of just right.
         * The median green is not a moral "good", it is the middle of the
         * scale — and here the middle really is the target.
         *
         * These values dress 12 px text: all of them exceed 5.5:1 on the
         * app's lightest background.
         */
        effort: {
          easy: { value: '#7FA9E0' },
          target: { value: '#7FC08A' },
          hard: { value: '#EC8079' },
        },

        /**
         * A block type's accent: a family, not a severity.
         *
         * Work blocks used to carry the saturated red of an alert — the same
         * hue as "Supprimer" and as a "too hard" rating. A block's edge warns
         * of nothing: it says what species follows, work, rest or warm-up.
         *
         * The range is therefore the same in hue and half as saturated: the
         * three families are still told apart at a glance, but none of them
         * claims more attention than an alert deserves. Saturated red stays
         * with hard effort and with gestures that destroy.
         */
        block: {
          work: { value: '#B06A61' },
          rest: { value: '#57908A' },
          neutral: { value: '#585B61' },
        },

        session: {
          work: {
            DEFAULT: { value: '#E2574C' },
            fg: { value: '#EC8079' },
          },
          // The original teal (#4F8F8A) had a chroma of 0.067: below the
          // floor under which a colour reads as grey. The work / rest
          // distinction therefore rested on the red alone. 0.096 is the
          // maximum reachable for a teal at this lightness — beyond that it
          // tips into cyan, which the art direction does not want.
          rest: {
            DEFAULT: { value: '#3FA8A0' },
            fg: { value: '#8FCFC8' },
          },
        },
      },
    },
    tokens: {
      colors: {
        /** The brand's amber, at a single address. */
        amber: { value: '#CF9F3F' },
        brand: {
          50: { value: '#fffbeb' },
          100: { value: '#fef3c7' },
          200: { value: '#fde68a' },
          300: { value: '#fcd34d' },
          400: { value: '#fbbf24' },
          500: { value: '#f59e0b' },
          600: { value: '#d97706' },
          700: { value: '#b45309' },
          800: { value: '#92400e' },
          900: { value: '#78350f' },
          950: { value: '#451a03' },
        },
      },
    },
  },
  globalCss: {
    /**
     * The focus ring, at a single address.
     *
     * It was rewritten thirty-five times, and not always the same: the offset
     * was 1, 2 or 4 px depending on the place, and the navigation rail had
     * none at all — it kept the browser's default outline, which on a dark
     * background cannot be seen.
     *
     * Set here, it covers everything that takes focus, including what nobody
     * would have thought to dress.
     */
    ':root': {
      // A fallback for anything that is not a Chakra component: without it
      // the ring fell back to `currentColor` and took the text's colour.
      '--focus-ring-color': 'var(--chakra-colors-amber)',
      '--focus-ring-width': '2px',
      '--focus-ring-offset': '2px',
      '--focus-ring-style': 'solid',
    },
    '*:focus-visible': {
      outline: '2px solid',
      outlineColor: 'app.primary',
      outlineOffset: '2px',
    },
    'html, body': {
      backgroundColor: 'bg.canvas', // Utilise la valeur définie au-dessus
      color: 'fg',
    },
    'input, textarea, select': {
      fontSize: '16px !important', // Empêche le zoom auto sur iOS
    },
  },
});

export const system = createSystem(defaultConfig, customConfig);
