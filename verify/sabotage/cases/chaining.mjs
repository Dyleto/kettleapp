/** Les sabotages de `verify_chaining.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_chaining.mjs',
  cases: [
    {
      name: '« Palier fait » ne coche rien',
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '    const keys = rungSets(sets, rung).map((set) => set.key);',
          to: '    const keys: string[] = [];',
        },
      ],
      falls: [
        'les sept paliers sont cochés',
        "→ et c'est « Terminer » qui attend, pas un bilan déjà ouvert",
      ],
    },
    {
      name: "l'écran « Bloc suivant » ne se pose jamais",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: '        leavesBlock && targetBlock !== null',
          to: '        false && targetBlock !== null',
        },
      ],
      falls: [
        "→ l'écran « Bloc suivant » dit ce qui finit et ce qui vient",
        "l'écran « Bloc suivant » est là",
        'dix secondes de pause ne le font pas partir',
      ],
    },
    {
      name: "l'écran « Bloc suivant » ne part jamais seul",
      edits: [
        {
          file: 'src/features/client/guided/scene/NextBlock.tsx',
          from: 'useCountdown(SECONDS, { frozen, onComplete: onDone })',
          to: 'useCountdown(SECONDS, { frozen, onComplete: () => {} })',
        },
      ],
      falls: [
        '→ et il s’efface seul, sans un geste',
        "→ et le bloc sur lequel on arrive attend qu'on le lance",
        '→ il repart de là où il était, et s’efface',
      ],
    },
    {
      name: "toucher l'écran « Bloc suivant » n'enchaîne pas",
      edits: [
        {
          file: 'src/features/client/guided/scene/NextBlock.tsx',
          from: '      onClick={onDone}',
          to: '      onClick={undefined}',
        },
      ],
      falls: ['→ un toucher sur le nom du bloc suffit, sans attendre'],
    },
    {
      name: "la pause ne fige pas l'écran « Bloc suivant »",
      edits: [
        {
          file: 'src/features/client/guided/scene/NextBlock.tsx',
          from: 'useCountdown(SECONDS, { frozen, onComplete: onDone })',
          to: 'useCountdown(SECONDS, { frozen: false, onComplete: onDone })',
        },
      ],
      falls: ['dix secondes de pause ne le font pas partir'],
    },
    {
      name: 'le dernier geste du bloc ne dit pas ce qui vient',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '    ).length === 1;',
          to: '    ).length === 0;',
        },
      ],
      falls: ['→ le dernier geste du bloc annonce le bloc suivant'],
    },
  ],
};
