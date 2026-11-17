/** Les sabotages de `verify_ladder.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_ladder.mjs',
  cases: [
    {
      name: "« Palier fait » ne coche qu'un mouvement",
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '    const keys = rungSets(sets, rung).map((set) => set.key);',
          to: '    const keys = rungSets(sets, rung).map((set) => set.key).slice(0, 1);',
        },
      ],
      falls: [
        'un seul geste coche les deux mouvements du palier',
        '→ puis la marche suivante s’allume',
        'au dernier bloc, le dernier palier laisse « Terminer » : finir reste un geste',
        'à zéro, « Temps écoulé » présélectionne le palier en cours',
        '→ le palier et le temps se corrigent',
        '→ « Valider » retient trois paliers faits et 705 secondes',
        'le bilan envoie le résultat de l’échelle',
        "« J'arrête là » arrête le chrono et demande où l'on en est",
        'le dernier palier fait avant la limite : « Échelle bouclée »',
        '→ avec son temps, et son avance sur la limite',
        '→ « Continuer » retient sept paliers en 420 secondes',
      ],
    },
    {
      name: 'pas de repos entre deux paliers',
      note: "Le geste central : chaque palier reste à moitié fait, l'échelle ne monte plus, et tout ce qui suit tombe avec lui.",
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '    if (step.block.restBetweenRounds) setRest({ rung: rung + 1, bonus: 0 });',
          to: '',
        },
      ],
      falls: ['→ et le repos prescrit suit la fin du palier'],
    },
    {
      name: 'toucher une marche ne fait rien',
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '          onPick={waiting ? undefined : goToRung}',
          to: '          onPick={undefined}',
        },
      ],
      falls: [
        'toucher une marche y va : tout ce qui est dessous est fait',
        '« Palier précédent » redescend d’une marche',
        'au dernier bloc, le dernier palier laisse « Terminer » : finir reste un geste',
      ],
    },
    {
      name: 'le dernier palier du dernier bloc termine la séance tout seul',
      note: 'Les deux suivantes partaient de la marche touchée.',
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '      } else if (!isLastBlock) {',
          to: '      } else {',
        },
      ],
      falls: [
        'au dernier bloc, le dernier palier laisse « Terminer » : finir reste un geste',
      ],
    },
    {
      name: "le chrono ne bouge pas à l'écran",
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '      setReading(next);\n',
          to: '',
        },
      ],
      falls: ['le chrono descend depuis la limite'],
    },
    {
      name: 'à zéro, aucune feuille',
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: "        setEnding({ kind: 'timeUp', seconds: limit ?? 0 });",
          to: '',
        },
      ],
      falls: [
        'à zéro, « Temps écoulé » présélectionne le palier en cours',
        '→ le palier et le temps se corrigent',
        '→ « Valider » retient trois paliers faits et 705 secondes',
        'le bilan envoie le résultat de l’échelle',
      ],
    },
    {
      name: 'le palier choisi compte comme fait',
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '        onClick={() => onConfirm({ rungs: rung - 1, seconds })}',
          to: '        onClick={() => onConfirm({ rungs: rung, seconds })}',
        },
      ],
      falls: [
        '→ « Valider » retient trois paliers faits et 705 secondes',
        'le bilan envoie le résultat de l’échelle',
      ],
    },
    {
      name: "pas de « J'arrête là »",
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: '                {limit && running && (',
          to: '                {false && running && (',
        },
      ],
      falls: [
        "« J'arrête là » arrête le chrono et demande où l'on en est",
        '→ une fois lancé, « Palier fait » et « J’arrête là »',
      ],
    },
    {
      name: "l'échelle bouclée ouvre la feuille d'arrêt",
      edits: [
        {
          file: 'src/features/client/guided/scene/LadderBlock.tsx',
          from: "        setEnding({ kind: 'complete', seconds: elapsedSeconds() });",
          to: "        setEnding({ kind: 'stopped', seconds: elapsedSeconds() });",
        },
      ],
      falls: [
        'le dernier palier fait avant la limite : « Échelle bouclée »',
        '→ avec son temps, et son avance sur la limite',
        '→ « Continuer » retient sept paliers en 420 secondes',
      ],
    },
    {
      name: "le décompte de l'ouverture n'arme pas l'échelle",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: "  if (step.block.type === 'ladder' && step.block.durationMinutes)",
          to: '  if (false)',
        },
      ],
      falls: ["premier bloc : le décompte de l'ouverture a lancé le chrono"],
    },
    {
      name: "le bilan n'envoie pas l'échelle",
      edits: [
        {
          file: 'src/features/client/end/sending.ts',
          from: '  const ladderDone = toLadderDone(saved?.ladder);',
          to: '  const ladderDone: LadderDoneEntry[] = [];',
        },
      ],
      falls: ['le bilan envoie le résultat de l’échelle'],
    },
    {
      name: "l'enregistrement ne relit pas l'échelle",
      edits: [
        {
          file: 'src/features/client/guided/sessionProgress.ts',
          from: '      ladder: readLadder(stored.ladder),',
          to: '      ladder: {},',
        },
      ],
      falls: ['le bilan envoie le résultat de l’échelle'],
    },
  ],
};
