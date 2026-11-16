/** Les sabotages de `verify_pause.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_pause.mjs',
  cases: [
    {
      name: "l'horloge ignore la pause",
      edits: [
        {
          file: 'src/features/client/components/guided/Timer.tsx',
          from: '    frozen,\n',
          to: '',
        },
      ],
      falls: [
        "l'horloge du tour s'est figée pendant la pause",
        "→ pendant lequel l'horloge reste figée",
        'puis le tour repart d’où il était, sans rien perdre ni gagner',
        '→ et la scène est restée sur le même tour',
      ],
    },
    {
      name: "le dégel ne recule pas l'échéance",
      edits: [
        {
          file: 'src/features/client/useCountdown.ts',
          from: '      endAtRef.current = thawedDeadline(\n        endAtRef.current,\n        frozenAtRef.current,\n        Date.now()\n      );',
          to: '      endAtRef.current = endAtRef.current + 0;',
        },
      ],
      falls: ['puis le tour repart d’où il était, sans rien perdre ni gagner'],
    },
    {
      name: 'la reprise saute le décompte',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '      setResuming(true);\n      return;\n',
          to: '',
        },
      ],
      falls: [
        'reprendre un bloc chronométré passe par le décompte',
        "→ pendant lequel l'horloge reste figée",
        'puis le tour repart d’où il était, sans rien perdre ni gagner',
      ],
    },
    {
      name: "le retour du téléphone n'ouvre plus la pause",
      note: "Sans décompte, l'horloge repart trois secondes plus tôt : le temps mesuré depuis la reprise l'accuse aussi.",
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '  useBackDismiss(sceneActive && !showPause, () => setShowPause(true));\n',
          to: '',
        },
      ],
      falls: [
        'le retour ouvre la pause',
        '→ sans quitter la séance',
        'un second retour la referme',
        '→ et un troisième la rouvre, sans jamais quitter',
        '→ et la rouvre',
      ],
    },
    {
      name: "Échap n'ouvre plus la pause",
      note: "Le retour quitte alors la séance : Échap n'a plus de scène où rouvrir.",
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '      setShowPause((open) => !open);',
          to: '      setShowPause(false);',
        },
      ],
      falls: ['→ et la rouvre'],
    },
    {
      name: 'toucher le fond ne reprend plus',
      edits: [
        {
          file: 'src/features/client/components/scene/PauseSheet.tsx',
          from: '<Sheet label="Pause" onDismiss={onResume}>',
          to: '<Sheet label="Pause">',
        },
      ],
      falls: ['toucher le fond reprend la séance'],
    },
    {
      name: 'la pause compte en étapes',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '      : positionLabel(\n          session,',
          to: '      : `Étape ${index + 1} sur ${steps.length}` || positionLabel(\n          session,',
        },
      ],
      falls: [
        'la pause dit où l’on en est, en blocs et en tours',
        '→ et non en étapes',
      ],
    },
    {
      name: '« Reprendre » perd son emphase',
      edits: [
        {
          file: 'src/features/client/components/scene/PauseSheet.tsx',
          from: '      <ActionButton w="full" onClick={onResume}>',
          to: '      <ActionButton tone="ghost" w="full" onClick={onResume}>',
        },
      ],
      falls: ['« Reprendre » est le bouton principal, en ambre'],
    },
    {
      name: '« Passer ce bloc » ne change pas de bloc',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '                  goTo(nextBlockIndex);\n',
          to: '',
        },
      ],
      falls: ['« Passer ce bloc » mène au bloc suivant'],
    },
    {
      name: 'le dernier bloc propose quand même de le passer',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: 'nextBlockIndex === -1\n                ? undefined',
          to: 'false\n                ? undefined',
        },
      ],
      falls: ['au dernier bloc, la pause ne propose pas de le passer'],
    },
    {
      name: '« Terminer maintenant » ne termine plus',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '              setShowPause(false);\n              onFinish();',
          to: '              setShowPause(false);',
        },
      ],
      falls: ['« Terminer la séance maintenant » mène au bilan'],
    },
    {
      name: "la pause ne décale pas l'origine : le temps figé est perdu",
      stale: 'le motif correspond 0 fois dans TimedBlock.tsx',
      edits: [
        {
          file: 'src/features/client/components/scene/TimedBlock.tsx',
          from: '      frozenAtRef.current = Date.now();\n    };',
          to: '    };',
        },
      ],
      falls: ['puis le tour repart d’où il était, sans rien perdre ni gagner'],
    },
    {
      name: "l'horloge ne se fige pas pendant la pause",
      stale: 'le motif correspond 0 fois dans TimedBlock.tsx',
      edits: [
        {
          file: 'src/features/client/components/scene/TimedBlock.tsx',
          from: '  const ticking = running && !paused;',
          to: '  const ticking = running;',
        },
      ],
      falls: [
        "l'horloge du tour s'est figée pendant la pause",
        '→ et la scène est restée sur le même tour',
        "→ pendant lequel l'horloge reste figée",
        'puis le tour repart d’où il était, sans rien perdre ni gagner',
      ],
    },
  ],
};
