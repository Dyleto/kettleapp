/** Les sabotages de `verify_template.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_template.mjs',
  cases: [
    {
      name: 'le titre redevient un paragraphe',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '<Text as="h1" fontSize="lg" fontWeight="bold">',
          to: '<Text fontSize="lg" fontWeight="bold">',
        },
      ],
      falls: ["l'écran porte le nom de son onglet"],
    },
    {
      name: "le titre ne porte plus le nom de l'onglet",
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '            Modèles\n          </Text>',
          to: '            Modèles de programme\n          </Text>',
        },
      ],
      falls: ["l'écran porte le nom de son onglet"],
    },
    {
      name: '« Créer » redevient bleu',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '            size="md"\n            onClick={submit}',
          to: '            size="md"\n            bg="blue.500"\n            onClick={submit}',
        },
      ],
      falls: ["« Créer » est à la couleur de l'application"],
    },
    {
      name: "le rail d'un modèle reparle d'un client",
      edits: [
        {
          file: 'src/features/coach/components/SessionRail.tsx',
          from: 'tracked={tracking !== undefined}',
          to: 'tracked',
        },
      ],
      falls: ["le rail d'un modèle ne dit rien de ce qu'un client aurait fait"],
    },
    {
      name: 'le rail ne dit plus rien à personne',
      edits: [
        {
          file: 'src/features/coach/components/SessionRail.tsx',
          from: '{tracked && (',
          to: '{tracked && false && (',
        },
      ],
      falls: ['→ et que son rail dit bien ce qui n’a jamais été fait'],
    },
    {
      name: 'la liste vide perd son personnage',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '            mood="hello"\n',
          to: '',
        },
      ],
      falls: ['→ avec le personnage'],
    },
    {
      name: 'la liste vide ne dit plus à quoi sert un modèle',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: 'title="Écris-le une fois"',
          to: 'title="Aucun modèle"',
        },
      ],
      falls: ['sans modèle, la liste dit à quoi ils servent'],
    },
  ],
};
