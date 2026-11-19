/** Les sabotages de `verify_resume.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_resume.mjs',
  cases: [
    {
      name: "une séance commencée rouvre l'ouverture",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: "    steps.length === 0 ? 'empty' : started ? 'scene' : 'opening';",
          to: "    steps.length === 0 ? 'empty' : 'opening';",
        },
      ],
      falls: [
        "une séance rangée à l'ancien format reprend où elle en était",
        '→ on reprend après les deux exercices déjà cochés',
        "→ et la charge de l'ancien format s'affiche toujours",
        '→ à la première écriture, il passe au nouveau format',
        "→ en gardant ce qu'il portait",
        '« Reprendre » mène droit à la série, sans ouverture ni question',
        '→ le haut dit « Reprise au bloc 1 »',
        '→ et la séance n’a pas bougé',
      ],
    },
    {
      name: 'la reprise ne dit rien',
      edits: [
        {
          file: 'src/features/client/guided/GuidedScene.tsx',
          from: '        notice={state.resumed ? `Reprise au bloc ${resumedBlock}` : undefined}',
          to: '        notice={undefined}',
        },
      ],
      falls: [
        "une séance rangée à l'ancien format reprend où elle en était",
        '→ le haut dit « Reprise au bloc 1 »',
      ],
    },
    {
      name: 'le bandeau de reprise ne part jamais',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: "      () => act({ type: 'dismissResume' }),",
          to: '      () => {},',
        },
      ],
      falls: ['→ trois secondes, puis le bandeau s’efface'],
    },
    {
      name: 'recommencer laisse les séries cochées',
      edits: [
        {
          file: 'src/features/client/guided/sessionProgress.ts',
          from: '    done: [],\n    rounds: {},\n    skipped: [],',
          to: '    rounds: {},\n    skipped: [],',
        },
      ],
      falls: [
        "après « recommencer », plus rien n'est coché",
        '→ et le bloc le dit : zéro sur quatre',
        '→ le curseur est revenu sur le premier mouvement',
        '→ et la première se relit dans son champ',
        'après « recommencer », tout est à zéro',
        '→ et la barre de progression le dit',
        'on ne propose plus de reprendre une séance remise à zéro',
      ],
    },
  ],
};
