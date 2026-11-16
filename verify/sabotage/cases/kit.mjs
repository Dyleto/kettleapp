/** Les sabotages de `verify_kit.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_kit.mjs',
  cases: [
    {
      name: 'la planche demande un compte',
      note: "Sans compte, la planche renvoie à la connexion : aucune pièce ne s'y lit, et rien ne s'y ouvre ni ne s'y focalise. Cascade attendue.",
      edits: [
        {
          file: 'src/shared/config/routes.ts',
          from: "  ...(import.meta.env.DEV ? ['/kit'] : []),",
          to: '',
        },
      ],
      falls: [
        'la planche se lit sans compte',
        'chaque pièce a sa place sur la planche',
        'cinq tons de pastille, cinq fonds distincts, aux deux tailles',
        'une bulle coupée tient en deux lignes',
        'les cinq humeurs du personnage, plus celles des deux états',
        'le personnage se balance',
        'la feuille s’ouvre, et toucher le fond la referme',
        'le bouton focalisé au clavier porte un anneau ambre',
        'la feuille apparaît sans monter',
        'le personnage ne se balance plus',
      ],
    },
    {
      name: 'deux tons de pastille se confondent',
      edits: [
        {
          file: 'src/kit/Chip.tsx',
          from: "  teal: 'session.rest/18',",
          to: "  teal: 'bg.surface',",
        },
      ],
      falls: ['cinq tons de pastille, cinq fonds distincts, aux deux tailles'],
    },
    {
      name: 'une bulle ne se coupe plus',
      edits: [
        {
          file: 'src/kit/Bubble.tsx',
          from: '      lineClamp={clamp}',
          to: '      lineClamp={undefined}',
        },
      ],
      falls: ['une bulle coupée tient en deux lignes'],
    },
    {
      name: 'l’anneau de focus perd son ambre',
      note: 'Le bouton est un composant Chakra : son anneau vient du jeton `focusRing` de sa palette, et recouvre la règle globale `*:focus-visible`.',
      edits: [
        {
          file: 'src/theme.ts',
          from: "        gray: {\n          focusRing: { value: '{colors.amber}' },",
          to: "        gray: {\n          focusRing: { value: '{colors.fg.muted}' },",
        },
      ],
      falls: ['le bouton focalisé au clavier porte un anneau ambre'],
    },
    {
      name: 'la feuille monte même quand on demande moins d’animations',
      edits: [
        {
          file: 'src/kit/Sheet.tsx',
          from: '      animation="sheetRise 380ms cubic-bezier(0.22, 1, 0.36, 1)"\n      _motionReduce={{ animation: \'none\' }}',
          to: '      animation="sheetRise 380ms cubic-bezier(0.22, 1, 0.36, 1)"',
        },
      ],
      falls: ['la feuille apparaît sans monter'],
    },
    {
      name: 'le personnage se balance même quand on demande moins d’animations',
      edits: [
        {
          file: 'src/kit/Mascot.tsx',
          from: "        '& svg, & .mascot-eyes': { animation: 'none' },",
          to: "        '& .mascot-eyes': { animation: 'none' },",
        },
      ],
      falls: ['le personnage ne se balance plus'],
    },
  ],
};
