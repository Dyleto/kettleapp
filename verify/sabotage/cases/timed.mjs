/** Les sabotages de `verify_timed.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_timed.mjs',
  cases: [
    {
      name: 'un EMOM sans nombre de tours retombe dans la liste',
      edits: [
        {
          file: 'src/features/client/guided/steps.ts',
          from: "    const unbounded =\n      (block.type === 'emom' || block.type === 'every') &&\n      block.rounds === undefined;",
          to: '    const unbounded = false;',
        },
      ],
      falls: [
        'il tourne, et ne dit pas « sur »',
        '→ sans points ni barre : il n’y a pas de fin à dessiner',
        'vingt-cinq minutes plus tard, le tour 26',
        '→ et la séance le sait',
        "la pause propose d'y mettre fin",
        '→ et on passe au bloc suivant',
      ],
    },
    {
      name: "« sur null » s'affiche",
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '  const roundLine = unbounded\n    ? `Tour ${shown.round}`',
          to: '  const roundLine = false\n    ? `Tour ${shown.round}`',
        },
      ],
      falls: [
        'il tourne, et ne dit pas « sur »',
        'vingt-cinq minutes plus tard, le tour 26',
      ],
    },
    {
      name: "la séance ne relève pas le tour d'un EMOM sans limite",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: '        return merge(t, { liveRound: action.round });',
          to: '        return t;',
        },
      ],
      falls: ['→ et la séance le sait'],
    },
    {
      name: 'la pause ne propose pas de terminer un EMOM sans limite',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: "              step.type === 'round' && step.rounds === null",
          to: '              false',
        },
      ],
      falls: [
        "la pause propose d'y mettre fin",
        '→ et on passe au bloc suivant',
      ],
    },
    {
      name: 'la pause propose de terminer tout bloc à tours',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: "              step.type === 'round' && step.rounds === null",
          to: "              step.type === 'round'",
        },
      ],
      falls: ['« Terminer le bloc » n’apparaît que sans limite'],
    },
    {
      name: "l'horloge finit un EMOM sans limite au premier tour",
      edits: [
        {
          file: 'src/features/client/guided/clock.ts',
          from: '  if (plan.rounds !== null && at >= period * plan.rounds) {',
          to: '  if (at >= period * (plan.rounds ?? 1)) {',
        },
      ],
      falls: [
        'vingt-cinq minutes plus tard, le tour 26',
        '→ et la séance le sait',
        "la pause propose d'y mettre fin",
      ],
    },
    {
      name: "un compteur de battements au lieu de l'heure",
      edits: [
        {
          file: 'src/features/client/guided/useBlockClock.ts',
          from: '        onBeatRef.current(Date.now() - originRef.current);',
          to: '        onBeatRef.current((countedRef.current += 250));',
        },
        {
          file: 'src/features/client/guided/useBlockClock.ts',
          from: '  const frozenAtRef = useRef<number | null>(null);',
          to: '  const frozenAtRef = useRef<number | null>(null);\n  const countedRef = useRef(0);',
        },
      ],
      falls: [
        "l'horloge dit le tour 4, quarante-deux secondes restantes",
        '→ et la séance est passée au tour 4 avec elle',
        "→ et l'horloge repart de là",
        'balayer vers la droite revient au tour précédent',
        'vingt-cinq minutes plus tard, le tour 26',
        '→ et la séance le sait',
      ],
    },
    {
      name: "la séance ne suit pas le tour de l'horloge",
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '    if (next.round !== previous.round) onRound(next.round);\n',
          to: '',
        },
      ],
      falls: [
        '→ et la séance est passée au tour 4 avec elle',
        'une consigne ouverte reste ouverte quand le tour change',
        '→ et la séance le sait',
      ],
    },
    {
      name: 'les trois dernières secondes ne se voient pas',
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: 'const hot = running && !shown.finished && shown.remaining <= 3;',
          to: 'const hot = running && !shown.finished && shown.remaining <= 0;',
        },
      ],
      falls: [
        'à trois secondes, il annonce le tour qui vient',
        '→ et le pied, ce qu’on va entendre',
        '→ le chiffre passe au corail',
      ],
    },
    {
      name: "le balayage recule au lieu d'avancer",
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: 'shift(dx < 0 ? 1 : -1);',
          to: 'shift(dx < 0 ? -1 : 1);',
        },
      ],
      falls: [
        'balayer vers la gauche part au début du tour suivant',
        "→ et l'horloge repart de là",
        'balayer vers la droite revient au tour précédent',
        'la flèche « Tour suivant » fait de même, pour qui ne balaie pas',
        '→ et la flèche du clavier aussi',
      ],
    },
    {
      name: 'le clavier ne recale rien',
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '      label="Tour suivant"\n      shortcut="next"',
          to: '      label="Tour suivant"\n      shortcut="previous"',
        },
      ],
      falls: ['→ et la flèche du clavier aussi'],
    },
    {
      name: "toucher l'écran met en pause même avant « Lancer »",
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '    if (running && Math.abs(dx) < TAP && Math.abs(dy) < TAP) onPause();',
          to: '    if (Math.abs(dx) < TAP && Math.abs(dy) < TAP) onPause();',
        },
      ],
      falls: ["avant « Lancer », toucher l'anneau n'ouvre rien"],
    },
    {
      name: "toucher l'écran ne met jamais en pause",
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '    if (running && Math.abs(dx) < TAP && Math.abs(dy) < TAP) onPause();',
          to: '    if (running && Math.abs(dx) < TAP && Math.abs(dy) < TAP) return;',
        },
      ],
      falls: ['horloge lancée, le même toucher ouvre la pause'],
    },
    {
      name: 'le fond du Tabata ne change pas au repos',
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: "          bg={resting ? 'session.restBg' : 'session.effortBg'}",
          to: '          bg="session.effortBg"',
        },
      ],
      falls: ['pendant le repos, il passe au sarcelle'],
    },
    {
      name: 'un tour qui passe referme la consigne',
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: '      return merge(t, { index: target }, { step: target });',
          to: '      return merge(t, { index: target, detail: null }, { step: target });',
        },
      ],
      falls: ['une consigne ouverte reste ouverte quand le tour change'],
    },
    {
      name: 'le dernier tour tombé, rien ne suit',
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '        clock.stop();\n        onFinish();',
          to: '        clock.stop();',
        },
      ],
      falls: ['le dernier tour tombé, la séance passe au bloc suivant'],
    },
    {
      name: 'plus de « Bloc précédent »',
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: '            {onPrevious && (',
          to: '            {false && onPrevious && (',
        },
      ],
      falls: [
        'un bloc qui attend propose de revenir',
        '→ et ramène au bloc d’avant',
      ],
    },
  ],
};
