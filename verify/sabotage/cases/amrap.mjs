/** Les sabotages de `verify_amrap.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_amrap.mjs',
  cases: [
    {
      name: 'le rond compte avant « Lancer »',
      stale:
        "« « Valider » termine la séance, et le constat compte trois tours » n'est plus un libellé de la suite",
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: '              if (!running) return;\n',
          to: '',
        },
      ],
      falls: [
        '→ et un toucher ne compte rien',
        'une fois lancé, chaque toucher compte un tour',
        'un appui long retire un tour, sans en rajouter au relâchement',
        '→ « Retirer un tour » fait de même, pour qui ne peut pas appuyer longtemps',
        '→ préremplie de ce qui a été tapé, avec l’objectif',
        'le score se corrige dans la feuille',
        '« Valider » termine la séance, et le constat compte trois tours',
      ],
    },
    {
      name: "le relâchement d'un appui long rajoute le tour retiré",
      stale:
        "« « Valider » termine la séance, et le constat compte trois tours » n'est plus un libellé de la suite",
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: '              if (heldRef.current) {\n                heldRef.current = false;\n                return;\n              }\n',
          to: '',
        },
      ],
      falls: [
        'un appui long retire un tour, sans en rajouter au relâchement',
        '→ « Retirer un tour » fait de même, pour qui ne peut pas appuyer longtemps',
        '→ préremplie de ce qui a été tapé, avec l’objectif',
        'le score se corrige dans la feuille',
        '« Valider » termine la séance, et le constat compte trois tours',
      ],
    },
    {
      name: "l'objectif du coach n'est pas lu",
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: '  const target = roundTarget(step.block.notes);',
          to: '  const target = roundTarget(undefined);',
        },
      ],
      falls: [
        "l'objectif du coach, « viser 5-6 tours », encadre deux repères",
        '→ préremplie de ce qui a été tapé, avec l’objectif',
      ],
    },
    {
      name: 'la puce ne bouge pas',
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: '      previousRef.current = next;\n      setReading(next);',
          to: '      previousRef.current = next;',
        },
      ],
      falls: [
        'la puce descend avec le temps',
        'à trois secondes, la puce passe au corail',
        'il monte',
      ],
    },
    {
      name: 'les trois dernières secondes ne se voient pas',
      note: 'Le chrono qui monte passe par la même lecture : il reste figé lui aussi.',
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: 'const hot = running && !!duration && reading.seconds <= 3;',
          to: 'const hot = running && !!duration && reading.seconds <= 0;',
        },
      ],
      falls: ['à trois secondes, la puce passe au corail'],
    },
    {
      name: 'à zéro, aucune feuille',
      stale:
        "« « Valider » termine la séance, et le constat compte trois tours » n'est plus un libellé de la suite",
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: '        clock.stop();\n        setEnding(true);\n        return;',
          to: '        clock.stop();\n        return;',
        },
      ],
      falls: [
        'à zéro, la feuille « Temps écoulé » demande le score',
        '→ préremplie de ce qui a été tapé, avec l’objectif',
        'le score se corrige dans la feuille',
        '« Valider » termine la séance, et le constat compte trois tours',
      ],
    },
    {
      name: "à zéro, l'AMRAP passe la main de lui-même",
      note: 'Sans feuille, rien pour corriger le score : il reste à deux.',
      stale:
        "« « Valider » termine la séance, et le constat compte trois tours » n'est plus un libellé de la suite",
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: '        clock.stop();\n        setEnding(true);\n        return;',
          to: '        clock.stop();\n        onDone();\n        return;',
        },
      ],
      falls: [
        'à zéro, la feuille « Temps écoulé » demande le score',
        '→ préremplie de ce qui a été tapé, avec l’objectif',
        "→ et la séance n'a pas bougé d'elle-même",
        'le score se corrige dans la feuille',
        '« Valider » termine la séance, et le constat compte trois tours',
      ],
    },
    {
      name: 'sans durée, le chrono ne monte pas',
      edits: [
        {
          file: 'src/features/client/guided/amrap.ts',
          from: '    return { seconds: Math.floor(at / 1000), finished: false };',
          to: '    return { seconds: 0, finished: false };',
        },
      ],
      falls: ['il monte'],
    },
    {
      name: 'sans durée, pas de « Terminer le bloc »',
      edits: [
        {
          file: 'src/features/client/components/scene/AmrapBlock.tsx',
          from: '            {!duration && running && (',
          to: '            {false && running && (',
        },
      ],
      falls: [
        '« Terminer le bloc » est là, sous le rond',
        '→ et demande le score',
      ],
    },
    {
      name: "le décompte de l'ouverture n'arme pas l'AMRAP",
      stale: 'le motif correspond 0 fois dans GuidedSession.tsx',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: "          if (step.type === 'round' || isLoop)",
          to: "          if (step.type === 'round')",
        },
      ],
      falls: [
        'il monte',
        '« Terminer le bloc » est là, sous le rond',
        '→ et demande le score',
      ],
    },
  ],
};
