/** Les sabotages de `verify_pause.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_pause.mjs',
  cases: [
    {
      name: "l'horloge ignore la pause",
      edits: [
        {
          file: 'src/features/client/guided/useBlockClock.ts',
          from: '  const ticking = running && !paused;',
          to: '  const ticking = running;',
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
          file: 'src/features/client/guided/useCountdown.ts',
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
          file: 'src/features/client/guided/session.ts',
          from: "      return merge(t, { pause: clockRuns(state) ? 'resuming' : 'closed' });",
          to: "      return merge(t, { pause: 'closed' });",
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
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: "  useBackDismiss(sceneActive && state.pause === 'closed', () =>\n    act({ type: 'pause' })\n  );\n",
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
          file: 'src/features/client/guided/session.ts',
          from: "      if (state.pause === 'closed') return merge(t, { pause: 'open' });",
          to: "      if (state.pause === 'closed') return t;",
        },
      ],
      falls: ['→ et la rouvre'],
    },
    {
      name: 'toucher le fond ne reprend plus',
      edits: [
        {
          file: 'src/features/client/guided/scene/PauseSheet.tsx',
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
          file: 'src/features/client/guided/GuidedSession.tsx',
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
          file: 'src/features/client/guided/scene/PauseSheet.tsx',
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
          file: 'src/features/client/guided/session.ts',
          from: '      return next === -1 ? closed : goTo(closed, next);',
          to: '      return closed;',
        },
      ],
      falls: ['« Passer ce bloc » mène au bloc suivant'],
    },
    {
      name: 'le dernier bloc propose quand même de le passer',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: '              nextBlockIndex(state) === -1\n                ? undefined',
          to: '              false\n                ? undefined',
        },
      ],
      falls: ['au dernier bloc, la pause ne propose pas de le passer'],
    },
    {
      name: '« Terminer maintenant » ne termine plus',
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: "      return finish(merge(t, { pause: 'closed' }), false);",
          to: "      return merge(t, { pause: 'closed' });",
        },
      ],
      falls: ['« Terminer la séance maintenant » mène au bilan'],
    },
    {
      name: "la pause ne décale pas l'origine : le temps figé est perdu",
      edits: [
        {
          file: 'src/features/client/guided/useBlockClock.ts',
          from: '      originRef.current += now - frozenAtRef.current;\n',
          to: '',
        },
      ],
      falls: ['puis le tour repart d’où il était, sans rien perdre ni gagner'],
    },
  ],
};
