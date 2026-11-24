/** Les sabotages de `verify_chipper.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_chipper.mjs',
  cases: [
    {
      name: 'un chipper borné se coche sans chrono',
      edits: [
        {
          file: 'src/features/client/guided/chipper.ts',
          from: "  (block.type === 'chipper' || block.type === 'timecap') &&",
          to: "  false && (block.type === 'chipper' || block.type === 'timecap') &&",
        },
      ],
      falls: [
        "premier bloc : le décompte de l'ouverture a lancé le chrono",
        '→ le rang se lit en mouvements, la limite à côté',
        'le chrono descend depuis la limite',
        'à zéro, « Temps écoulé » propose le mouvement en cours',
        '→ il se corrige d’une touche',
        '→ « Valider » retient deux mouvements faits et la limite',
        'le bilan envoie le résultat du chipper',
        'second bloc : le chrono attend « Lancer », et rien ne se coche avant',
        'la dernière série arrête le chrono : quatre mouvements en 40 s',
        '→ et la puce reste arrêtée sur ce temps',
        'la puce se lit dans la scène, entière',
      ],
    },
    {
      name: "« C'est parti » n'arme pas un chipper borné",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: '  if (isCappedList(step.block)) return step.block.order;',
          to: '',
        },
      ],
      falls: ["premier bloc : le décompte de l'ouverture a lancé le chrono"],
    },
    {
      name: 'la puce du chipper ne descend pas',
      edits: [
        {
          file: 'src/features/client/guided/scene/ChipperBlock.tsx',
          from: '      setReading(next);\n',
          to: '',
        },
      ],
      falls: [
        'le chrono descend depuis la limite',
        '→ et la puce reste arrêtée sur ce temps',
      ],
    },
    {
      name: 'la limite du chipper ne tombe jamais',
      edits: [
        {
          file: 'src/features/client/guided/scene/ChipperBlock.tsx',
          from: '        setTimeUp(true);',
          to: '',
        },
      ],
      falls: [
        'à zéro, « Temps écoulé » propose le mouvement en cours',
        '→ il se corrige d’une touche',
        '→ « Valider » retient deux mouvements faits et la limite',
        'le bilan envoie le résultat du chipper',
      ],
    },
    {
      name: '« Temps écoulé » propose toujours le premier mouvement',
      edits: [
        {
          file: 'src/features/client/guided/scene/ChipperBlock.tsx',
          from: '    movementReached(step.sets, done)',
          to: '    1',
        },
      ],
      falls: ['à zéro, « Temps écoulé » propose le mouvement en cours'],
    },
    {
      name: '« Valider » ne coche pas les mouvements qui précèdent',
      edits: [
        {
          file: 'src/features/client/guided/scene/ChipperBlock.tsx',
          from: '              done: doneBefore(step.sets, state.done, movement),',
          to: '              done: state.done,',
        },
      ],
      falls: ['→ « Valider » retient deux mouvements faits et la limite'],
    },
    {
      name: "la dernière série n'arrête pas le chrono",
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '      if (exhausted(done, state.skipped)) capped.onListEnd(done);',
          to: '',
        },
      ],
      falls: [
        'la dernière série arrête le chrono : quatre mouvements en 40 s',
        '→ et la puce reste arrêtée sur ce temps',
      ],
    },
    {
      name: 'un chipper borné se coche avant « Lancer »',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '      ) : current && capped?.waiting ? (',
          to: '      ) : current && false ? (',
        },
      ],
      falls: [
        'second bloc : le chrono attend « Lancer », et rien ne se coche avant',
        'la dernière série arrête le chrono : quatre mouvements en 40 s',
        '→ et la puce reste arrêtée sur ce temps',
      ],
    },
    {
      name: "le bilan n'envoie pas le chipper",
      edits: [
        {
          file: 'src/features/client/end/sending.ts',
          from: '  const chipperDone = toChipperDone(saved?.chipper);',
          to: '  const chipperDone: ChipperDoneEntry[] = [];',
        },
      ],
      falls: ['le bilan envoie le résultat du chipper'],
    },
    {
      name: "l'appareil oublie le résultat du chipper",
      edits: [
        {
          file: 'src/features/client/guided/sessionProgress.ts',
          from: '      chipper: readChipper(stored.chipper),',
          to: '      chipper: {},',
        },
      ],
      // Chaque écriture repart de cette lecture. Au second bloc, la série
      // cochée réécrit juste après le résultat, et l'efface. « Valider »
      // restait vert : il écrivait en dernier. Une écriture le suit
      // désormais, et l'efface aussi — la passe H1 l'a vu tomber.
      falls: [
        'le bilan envoie le résultat du chipper',
        'la dernière série arrête le chrono : quatre mouvements en 40 s',
        '→ « Valider » retient deux mouvements faits et la limite',
      ],
    },
    {
      name: 'à plat, la puce du chipper disparaît',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '          {capped?.chip}',
          to: '',
        },
      ],
      falls: ['la puce se lit dans la scène, entière'],
    },
    {
      name: 'la limite ne se lit pas à côté du rang',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '              aside={capped?.limitLabel}',
          to: '',
        },
      ],
      falls: ['→ le rang se lit en mouvements, la limite à côté'],
    },
  ],
};
