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
          from: 'tracked={history !== undefined}\n                history={history ?? []}\n                onSelect={() => onSelect(index)}\n                sortable={!!onReorder}\n                actions=',
          to: 'tracked\n                history={history ?? []}\n                onSelect={() => onSelect(index)}\n                sortable={!!onReorder}\n                actions=',
        },
      ],
      falls: ["le rail d'un modèle ne dit rien de ce qu'un client aurait fait"],
    },
    {
      name: 'le rail ne dit plus rien à personne',
      edits: [
        {
          file: 'src/features/coach/components/SessionRail.tsx',
          from: '  const line = railLine(session, { tracked, done });',
          to: '  const line = railLine(session, { tracked: false, done });',
        },
      ],
      falls: ['→ et que son rail dit bien ce qui n’a jamais été fait'],
    },
    {
      // Le menu ne demande plus à la page si elle a de quoi copier.
      name: '« Copier vers un client… » s’offre aussi dans un modèle',
      edits: [
        {
          file: 'src/features/coach/hooks/useSessionMenu.tsx',
          from: "      onCopy && {\n        value: 'copy',",
          to: "      {\n        value: 'copy',",
        },
      ],
      falls: [
        "le menu d'une séance de modèle ne propose pas « copier vers un client »",
      ],
    },
    {
      name: '« Copier vers un client… » disparaît partout',
      edits: [
        {
          file: 'src/features/coach/hooks/useSessionMenu.tsx',
          from: "      onCopy && {\n        value: 'copy',",
          to: "      false && {\n        value: 'copy',",
        },
      ],
      falls: ['→ alors que celui d’un client la propose'],
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
