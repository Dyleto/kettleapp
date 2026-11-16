/** Les sabotages de `verify_loads.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_loads.mjs',
  cases: [
    {
      name: 'un toucher ne note rien',
      edits: [
        {
          file: 'src/features/client/end/Loads.tsx',
          from: '    if (proposed !== undefined) onSets(withWeight(noted, index, proposed));',
          to: '',
        },
      ],
      falls: [
        'un toucher note la série à la charge proposée, celle d’avant',
        '→ et le sélecteur s’ouvre pour la corriger',
      ],
    },
    {
      name: "une série après une série vide s'ouvre",
      note: 'La correction partait de la charge notée au toucher : sans elle, « un kilo de plus » part de rien.',
      edits: [
        {
          file: 'src/features/client/end/Loads.tsx',
          from: '            <SetChip key={index} disabled label={setName(row, index)}>',
          to: '            <SetChip key={index} label={setName(row, index)}>',
        },
      ],
      falls: [
        'aux fentes : la première notée, la deuxième à noter, la troisième fermée',
      ],
    },
    {
      name: '« Même charge » ne recopie rien',
      edits: [
        {
          file: 'src/features/client/end/loadEntry.ts',
          from: '  if (weight === undefined) return [...sets];',
          to: '  if (weight !== null) return [...sets];',
        },
      ],
      falls: ['« Même charge pour les trois séries » recopie la première'],
    },
    {
      name: 'la corde à sauter réclame une charge',
      edits: [
        {
          file: 'src/features/client/end/Loads.tsx',
          from: '      !row.exercise.duration ||',
          to: '      true ||',
        },
      ],
      falls: ['→ sans la corde à sauter, qui ne se pèse pas'],
    },
    {
      name: "« OK » mène au ressenti au lieu de l'écran de fin",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "          onDone={() => setFlow('celebrate')}",
          to: "          onDone={() => setFlow('review')}",
        },
      ],
      falls: ['« OK » ramène à l’écran de fin'],
    },
    {
      name: '« Continuer » ramène à la séance',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "          onDone={() => setFlow('review')}\n          onBack={() => setFlow('idle')}",
          to: "          onDone={() => setFlow('idle')}\n          onBack={() => setFlow('idle')}",
        },
      ],
      falls: ['« Continuer » mène au ressenti'],
    },
  ],
};
