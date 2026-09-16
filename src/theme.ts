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
          // États
          success: {
            DEFAULT: { value: '#3FA8A0' },
            hover: { value: '#55BBB3' },
            active: { value: '#33908A' },
          },
          error: { value: '#E2574C' },
        },

        /**
         * L'anneau de ses propres composants.
         *
         * Chakra pose `--focus-ring-color` sur l'élément, depuis ce jeton :
         * une règle globale ne peut pas la battre en spécificité. Sans cette
         * reprise, la moitié des cibles gardait le gris par défaut — mesuré
         * `rgb(161, 161, 170)` — à côté de l'ambre du reste de l'application.
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
         * Le ressenti a sa propre échelle, et elle ne croise aucune couleur
         * d'action.
         *
         * L'ambre portait six sens à lui seul : la marque, l'action
         * principale, le tri actif, le non-lu, les lettres d'index et le
         * ressenti « Juste ». Une teinte qui veut dire six choses ne veut plus
         * dire grand-chose, et c'est celle qui doit attirer l'œil.
         *
         * La règle tenue désormais : l'ambre ne dit que deux choses — « c'est
         * une action » et « c'est là que tu es ». Le ressenti, lui, est une
         * donnée : on ne clique pas dessus, il n'a rien à faire dans la
         * palette de marque.
         *
         * L'échelle est divergente, froid → chaud, parce que la grandeur l'est
         * aussi : trop facile et trop dure sont deux écarts de part et d'autre
         * du juste. Le vert médian n'est pas un « bien » moral, c'est le
         * milieu de l'échelle — et ici le milieu est effectivement la cible.
         *
         * Ces valeurs habillent du texte de 12 px : toutes dépassent 5,5:1 sur
         * le fond le plus clair de l'application.
         */
        effort: {
          easy: { value: '#7FA9E0' },
          target: { value: '#7FC08A' },
          hard: { value: '#EC8079' },
        },

        /**
         * L'accent d'un type de bloc : une famille, pas une gravité.
         *
         * Les blocs d'effort portaient le rouge saturé de l'alerte — la même
         * teinte que « Supprimer » et qu'un ressenti « trop dure ». Un liseré
         * de bloc ne prévient de rien : il dit de quelle espèce est ce qui
         * suit, travail, repos ou échauffement.
         *
         * La gamme est donc la même en teinte et moitié moins saturée : on
         * distingue toujours les trois familles d'un coup d'œil, mais aucune
         * ne réclame plus l'attention qu'une alerte mérite. Le rouge saturé
         * reste au ressenti difficile et aux gestes qui détruisent.
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
          // Le teal d'origine (#4F8F8A) avait une chroma de 0,067 : sous le
          // plancher en deçà duquel une couleur se lit comme un gris. La
          // distinction effort / repos ne reposait donc que sur le rouge.
          // 0,096 est le maximum atteignable pour un teal à cette clarté —
          // au-delà on bascule dans le cyan, ce que la DA ne veut pas.
          rest: {
            DEFAULT: { value: '#3FA8A0' },
            fg: { value: '#8FCFC8' },
          },
        },
      },
    },
    tokens: {
      colors: {
        /** L'ambre de la marque, à une seule adresse. */
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
     * L'anneau de focus, à une seule adresse.
     *
     * Il était réécrit trente-cinq fois, et pas toujours pareil : l'offset
     * valait 1, 2 ou 4 px selon l'endroit, et le rail de navigation n'en
     * avait aucun — il gardait le contour par défaut du navigateur, qui sur
     * fond sombre ne se voit pas.
     *
     * Posé ici, il couvre tout ce qui prend le focus, y compris ce qu'on
     * n'aurait pas pensé à habiller.
     */
    ':root': {
      // Valeur de repli pour ce qui n'est pas un composant Chakra : sans
      // elle, l'anneau tombait sur `currentColor` et prenait la couleur du
      // texte.
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
