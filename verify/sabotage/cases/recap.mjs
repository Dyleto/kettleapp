/** Les sabotages de `verify_recap.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_recap.mjs',
  cases: [
    {
      name: 'la fin ne nomme plus la séance',
      edits: [
        {
          file: 'src/features/client/end/EndFlow.tsx',
          from: '        title={sessionName(session)}',
          to: '        title="Séance"',
        },
      ],
      falls: ['→ et nomme la séance'],
    },
    {
      name: 'le record se mesure à la dernière fois',
      edits: [
        {
          file: 'src/domain/history/records.ts',
          from: '      const previous = best.get(ex.exercise._id);',
          to: '      const previous = heaviest(lastPerformance?.get(ex.exercise._id)?.sets);',
        },
      ],
      falls: ['un vrai record : les fentes, deux kilos au-dessus du meilleur'],
    },
    {
      name: 'un mouvement neuf fait un record',
      edits: [
        {
          file: 'src/domain/history/records.ts',
          from: '      if (previous !== undefined && load > previous)',
          to: '      if (load > (previous ?? 0))',
        },
      ],
      falls: [
        'le seul mouvement qui a un passé fait le record',
        "→ aucun des trois autres n'est compté parmi les records",
      ],
    },
    {
      name: 'la régularité ne se dit jamais',
      edits: [
        {
          file: 'src/domain/history/records.ts',
          from: "  return steady ? { kind: 'steady' } : null;",
          to: '  return steady ? null : null;',
        },
      ],
      falls: ['« Régularité tenue », sans record inventé'],
    },
    {
      name: 'une séance arrêtée passe pour terminée',
      edits: [
        {
          file: 'src/features/client/end/Celebration.tsx',
          from: '  const partial = recap.setsTotal > 0 && recap.setsDone < recap.setsTotal;',
          to: '  const partial = recap.setsTotal < 0;',
        },
      ],
      falls: [
        '« Séance arrêtée », sans confettis',
        '→ les séries et tours sur le total, sans tonnage inventé',
        '→ « Ce qui est fait est fait », et pas de record',
      ],
    },
    {
      name: 'pas de confettis',
      edits: [
        {
          file: 'src/features/client/end/Celebration.tsx',
          from: '      {!partial && (',
          to: '      {false && !partial && (',
        },
      ],
      falls: ['→ avec ses confettis'],
    },
    {
      name: 'les tours bouclés ne sont jamais une tuile',
      edits: [
        {
          file: 'src/features/client/end/Celebration.tsx',
          from: ') : recap.rounds > 0 ? (',
          to: ') : recap.rounds < 0 ? (',
        },
      ],
      falls: [
        'aucune charge notée : la troisième tuile compte les tours bouclés',
      ],
    },
    {
      name: "« OK » ne ramène pas à l'écran de fin",
      stale: 'le motif correspond 0 fois dans SessionScreen.tsx',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "        onContinue={() => setFlow('celebrate')}",
          to: "        onContinue={() => setFlow('review')}",
        },
      ],
      falls: ['→ et « OK » ramène à l’écran de fin'],
    },
  ],
};
