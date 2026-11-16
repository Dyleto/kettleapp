/** Les sabotages de `verify_header.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_header.mjs',
  cases: [
    {
      name: 'les segments se regroupent de nouveau par format',
      edits: [
        {
          file: 'src/features/client/guided/outline.ts',
          from: "    const order = step.type === 'rest' ? last?.order : step.block.order;",
          to: "    const order =\n      step.type === 'rest'\n        ? last?.order\n        : ((step.block as unknown as { type: number }).type ?? step.block.order);",
        },
      ],
      falls: [
        'trois blocs, trois segments, même quand deux ont le même format',
        'le repos entre deux blocs garde le nom du bloc qu’il termine',
      ],
    },
    {
      name: "le compteur d'écrans revient",
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '            </HStack>\n            <Box\n              display="none"\n              flexShrink={0}\n              mt={-1}',
          to: '            </HStack>\n            <Text fontSize="xs">{index + 1} / {steps.length}</Text>\n            <Box\n              display="none"\n              flexShrink={0}\n              mt={-1}',
        },
      ],
      falls: ['plus aucun compteur d’écrans'],
    },
    {
      name: 'le rang du bloc ne suit plus',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '                Bloc {segmentIndex + 1} sur {segments.length}',
          to: '                Bloc 1 sur {segments.length}',
        },
      ],
      falls: ['on passe au bloc 2', 'un bloc nommé par le coach porte son nom'],
    },
    {
      name: 'le titre ignore le nom libre',
      edits: [
        {
          file: 'src/features/client/guided/outline.ts',
          from: '): string => block.label?.trim() || getBlockLabel(block.type);',
          to: '): string => getBlockLabel(block.type);',
        },
      ],
      falls: [
        'un bloc nommé par le coach porte son nom',
        '→ chacun sous son nom',
        'le repos entre deux blocs garde le nom du bloc qu’il termine',
      ],
    },
    {
      name: 'un repos prend le nom de son format',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '  const currentTitle = titledStep\n    ? blockTitle(titledStep.block)\n    : step.blockLabel;',
          to: "  const currentTitle =\n    step.type === 'rest' || !titledStep\n      ? step.blockLabel\n      : blockTitle(titledStep.block);",
        },
      ],
      falls: ['le repos entre deux blocs garde le nom du bloc qu’il termine'],
    },
    {
      name: 'le bloc en cours ne se remplit plus',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '                    : sets.length > 0\n                      ? doneInBlock / sets.length',
          to: '                    : sets.length > 0\n                      ? 0',
        },
      ],
      falls: ['le bloc en cours se remplit au prorata, en ambre'],
    },
    {
      name: 'un bloc fini reste ambre',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: "                          : isDone\n                            ? 'session.rest'\n                            : 'app.primary'",
          to: "                          : 'app.primary'",
        },
      ],
      falls: ['→ le bloc fini est plein, en sarcelle'],
    },
    {
      name: 'la barre se lit de nouveau en étapes',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: 'aria-valuetext={`${position} — ${step.blockLabel}`}',
          to: 'aria-valuetext={`Étape ${index + 1} sur ${steps.length} — ${step.blockLabel}`}',
        },
      ],
      falls: ['la barre se lit en blocs et en tours'],
    },
  ],
};
