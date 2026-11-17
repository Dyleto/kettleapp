/** Les sabotages de `verify_wide.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_wide.mjs',
  cases: [
    {
      name: 'le grand écran garde une seule colonne',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '      css={{ [WIDE]: WIDE_LAYOUT }}',
          to: '      css={{}}',
        },
      ],
      falls: [
        'la série à gauche, le bloc entier à droite',
        '→ « Série faite » sous la série, dans l’écran',
      ],
    },
    {
      name: 'le plan de la séance ne s’affiche pas',
      edits: [
        {
          file: 'src/features/client/guided/scene/SessionOutline.tsx',
          from: "      css={{ [WIDE]: { display: 'flex' } }}",
          to: '      css={{}}',
        },
      ],
      falls: [
        'le plan de la séance dit le bloc fait et celui en cours',
        '→ et les raccourcis du clavier',
      ],
    },
    {
      name: 'le plan de la séance s’affiche au téléphone',
      edits: [
        {
          file: 'src/features/client/guided/scene/SessionOutline.tsx',
          from: '      display="none"',
          to: '      display="flex"',
        },
      ],
      falls: ['la série au-dessus du bloc, et pas de plan'],
    },
    {
      name: 'le plan donne le bloc en cours pour fait',
      edits: [
        {
          file: 'src/features/client/guided/scene/SessionOutline.tsx',
          from: "          const state = i < current ? 'done' : i === current ? 'now' : 'todo';",
          to: "          const state = i <= current ? 'done' : 'todo';",
        },
      ],
      falls: ['le plan de la séance dit le bloc fait et celui en cours'],
    },
    {
      name: 'Espace ne valide rien',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: '      else pressMarked(intent);',
          to: "      else if (intent !== 'primary') pressMarked(intent);",
        },
      ],
      falls: [
        'Espace coche la série en cours',
        '→ et, pendant le repos, le passe',
        '← revient sur la série précédente',
        'Espace lance le bloc, puis franchit son décompte',
      ],
    },
    {
      name: 'P ne met pas en pause',
      edits: [
        {
          file: 'src/features/client/guided/keys.ts',
          from: "      return 'pause';",
          to: '      return null;',
        },
      ],
      falls: [
        'P met en pause',
        '→ et la pause ouverte, Espace ne coche rien derrière elle',
      ],
    },
    {
      name: 'la pause ouverte laisse passer les touches',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: '      if (!intent || overlayOpen()) return;',
          to: '      if (!intent) return;',
        },
      ],
      falls: ['→ et la pause ouverte, Espace ne coche rien derrière elle'],
    },
    {
      name: 'un champ ne garde pas Espace',
      edits: [
        {
          file: 'src/features/client/guided/keys.ts',
          from: "  if (target?.isContentEditable || TYPING.has(target?.tagName ?? ''))\n    return null;\n",
          to: '',
        },
      ],
      falls: ['dans un champ, Espace s’écrit et ne coche rien'],
    },
    {
      name: '→ ne passe rien',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '            <FooterLink shortcut="next" onClick={skipExercise}>',
          to: '            <FooterLink onClick={skipExercise}>',
        },
      ],
      falls: ['→ passe l’exercice en cours'],
    },
    {
      name: 'un décompte fixe passe pour invisible',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: '      el.getClientRects().length > 0 &&',
          to: '      el.offsetParent !== null &&',
        },
      ],
      falls: ['Espace lance le bloc, puis franchit son décompte'],
    },
    {
      name: 'le temps d’un EMOM reste à la taille du téléphone',
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '              wideSize={460}',
          to: '',
        },
      ],
      falls: ['le temps en grand, à gauche des doses'],
    },
  ],
};
