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
         * L'anneau sur les composants de Chakra.
         *
         * Chakra pose `--focus-ring-color` sur l'élément, à partir de ce
         * jeton : une règle globale ne peut pas le battre en spécificité.
         * Sans cette surcharge, la moitié des cibles gardaient le gris par
         * défaut — mesuré `rgb(161, 161, 170)` — à côté de l'ambre du reste
         * de l'application.
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
         * L'effort a son échelle, et elle ne croise aucune couleur d'action.
         *
         * L'ambre portait à elle seule six significations : la marque,
         * l'action principale, le tri actif, la pastille de non-lu, les
         * lettres d'index et une note « Juste ». Une teinte qui veut dire six
         * choses ne veut plus dire grand-chose, et c'est elle qui doit
         * attirer l'œil.
         *
         * La règle tenue désormais : l'ambre ne dit que deux choses — « ceci
         * est une action » et « vous êtes ici ». L'effort est une donnée : on
         * ne le clique pas, il n'a rien à faire dans la palette de marque.
         *
         * L'échelle est divergente, froid → chaud, parce que la quantité
         * l'est aussi : trop facile et trop dur sont deux écarts de part et
         * d'autre du juste. Le vert médian n'est pas un « bien » moral, c'est
         * le milieu de l'échelle — et ici le milieu est vraiment la cible.
         *
         * Ces valeurs habillent du texte de 12 px : toutes dépassent 5,5:1
         * sur le fond le plus clair de l'application.
         */
        effort: {
          easy: { value: '#7FA9E0' },
          target: { value: '#7FC08A' },
          hard: { value: '#EC8079' },
        },

        /**
         * L'accent d'un type de bloc : une famille, pas une gravité.
         *
         * Les blocs de travail portaient le rouge saturé d'une alerte — la
         * même teinte que « Supprimer » et qu'une note « trop dur ». La
         * tranche d'un bloc n'avertit de rien : elle dit quelle espèce suit,
         * travail, repos ou échauffement.
         *
         * La gamme est donc la même en teinte et deux fois moins saturée :
         * les trois familles se distinguent toujours d'un coup d'œil, mais
         * aucune ne réclame plus d'attention qu'une alerte n'en mérite. Le
         * rouge saturé reste à l'effort dur et aux gestes qui détruisent.
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
          // Le sarcelle d'origine (#4F8F8A) avait un chroma de 0,067 : sous le
          // plancher en dessous duquel une couleur se lit comme un gris. La
          // distinction travail / repos ne tenait donc plus qu'au rouge.
          // 0,096 est le maximum atteignable pour un sarcelle à cette
          // clarté — au-delà il bascule vers le cyan, dont la direction
          // artistique ne veut pas.
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
     * L'anneau de focus, à une seule adresse.
     *
     * Il a été réécrit trente-cinq fois, et pas toujours de la même façon :
     * le décalage valait 1, 2 ou 4 px selon l'endroit, et le rail de
     * navigation n'en avait aucun — il gardait le contour par défaut du
     * navigateur, invisible sur un fond sombre.
     *
     * Posé ici, il couvre tout ce qui prend le focus, y compris ce à quoi
     * personne n'aurait pensé à l'habiller.
     */
    ':root': {
      // Un repli pour tout ce qui n'est pas un composant Chakra : sans lui
      // l'anneau retombait sur `currentColor` et prenait la couleur du
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

/**
 * Le thème, prêt à être posé par `<Provider>`.
 *
 * `createSystem(defaultConfig, …)` et non un système nu : Kettle étend les
 * jetons de Chakra, il ne les remplace pas. Partir de zéro obligerait à
 * redéfinir des échelles entières — espacements, rayons, tailles de police —
 * qui n'ont aucune raison de différer.
 */
export const system = createSystem(defaultConfig, customConfig);
