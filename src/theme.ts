import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

const customConfig = defineConfig({
  theme: {
    /**
     * Les deux mouvements du personnage.
     *
     * Il se balance de quelques degrés et cligne des yeux toutes les quatre
     * secondes : c'est ce qui fait qu'un écran vide a l'air d'attendre
     * quelqu'un plutôt que d'être en panne. Le clignement tient dans les six
     * derniers centièmes du cycle, sans quoi les yeux passeraient le plus
     * clair de leur temps à moitié fermés.
     *
     * Ils sont déclarés ici et non dans le composant : une animation écrite
     * dans une balise `<style>` par personnage serait émise autant de fois
     * qu'il y a de personnages à l'écran.
     */
    keyframes: {
      mascotSway: {
        '0%, 100%': { transform: 'rotate(-3deg)' },
        '50%': { transform: 'rotate(3deg)' },
      },
      mascotBlink: {
        '0%, 94%, 100%': { transform: 'scaleY(1)' },
        '97%': { transform: 'scaleY(0.1)' },
      },
      // La feuille basse monte et dépasse à peine avant de se poser : c'est
      // ce léger rebond qui la fait lire comme un objet qu'on a tiré, pas
      // comme un panneau qui apparaît.
      sheetRise: {
        '0%': { transform: 'translateY(100%)' },
        '70%': { transform: 'translateY(-6px)' },
        '100%': { transform: 'translateY(0)' },
      },
      scrimFade: {
        from: { opacity: 0 },
        to: { opacity: 1 },
      },
    },
    semanticTokens: {
      colors: {
        // Couleurs principales
        app: {
          primary: {
            DEFAULT: { value: '{colors.amber}' },
            // L'ambre en texte, quand il se pose sur sa propre teinte : une
            // pastille ambre porte un fond ambre à 16 %, et le texte de la
            // marque n'y tient que 5,1:1. Celui-ci y tient 7,0:1 — mesurés
            // sur `surface.card`.
            fg: { value: '#E9BE62' },
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
          // Ce qui se pose par-dessus une feuille : un menu, la bannière
          // « Annuler ». Il fallait un troisième palier, sans quoi un menu
          // ouvert sur une feuille se fondait dans elle.
          raised: { value: '#31343A' },
        },
        surface: {
          wall: { value: '#17181B' },
          card: { value: '#1E2024' },
        },
        // Le filet qui sépare deux zones d'une même carte. Une bordure prise
        // dans `whiteAlpha` changeait de teinte selon le fond qu'elle
        // traversait ; celle-ci est la même partout.
        line: { value: '#2F3238' },

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
          /**
           * Le fond de la scène, selon ce qu'on y fait.
           *
           * Le chrono changeait de couleur au repos, pas l'écran : à deux
           * mètres, téléphone posé au sol, un chiffre sarcelle et un chiffre
           * crème se ressemblent. Un fond entier ne se confond pas. Les deux
           * teintes sont assez sombres pour garder le texte lisible : mesuré
           * 11:1 sur l'une comme sur l'autre.
           */
          effortBg: { value: '#3B2A12' },
          restBg: { value: '#12322F' },
        },
      },
    },
    tokens: {
      /**
       * Deux polices, et plus aucune police de code.
       *
       * L'application héritait de la police du système : une typographie
       * différente sur chaque appareil, et la chasse fixe pour toutes les
       * doses, qui donnait à un programme de sport l'allure d'un fichier de
       * configuration. La police de titre porte les titres et les grands
       * chiffres ; l'autre porte tout ce qui se lit de près.
       *
       * Elles sont servies par l'application elle-même (`@fontsource`) et
       * non par un tiers : une police chargée ailleurs transmet l'adresse du
       * visiteur à cet ailleurs, et ne s'affiche pas hors connexion — or la
       * séance guidée doit fonctionner sans réseau.
       */
      fonts: {
        heading: {
          value:
            "'Bricolage Grotesque Variable', 'Trebuchet MS', system-ui, sans-serif",
        },
        body: {
          value: "'Figtree Variable', 'Segoe UI', system-ui, sans-serif",
        },
      },
      /**
       * Les rayons du produit, nommés par ce qu'ils arrondissent.
       *
       * Ils valaient `md` ou `lg` selon l'humeur, soit 6 ou 8 px : assez
       * pour ne pas être carré, trop peu pour être un parti pris. Les nommer
       * par rôle évite qu'une carte et un bouton voisins s'arrondissent
       * différemment sans raison.
       */
      radii: {
        card: { value: '24px' },
        button: { value: '22px' },
        field: { value: '17px' },
        sheet: { value: '30px' },
      },
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
      fontFamily: 'body',
    },
    // Un titre se reconnaît à sa balise, pas au composant qui l'a posé. La
    // recette `Heading` porte bien la police de titre, mais les titres de
    // page sont presque tous des `<Text as="h1">` : mesuré sur l'accueil du
    // client, aucun titre ne la prenait, et le navigateur ne la téléchargeait
    // même pas.
    'h1, h2, h3, h4': {
      fontFamily: 'heading',
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
