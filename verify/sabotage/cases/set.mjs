/** Les sabotages de `verify_set.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_set.mjs',
  cases: [
    {
      name: 'à zéro, rien ne se coche',
      edits: [
        {
          file: 'src/features/client/guided/scene/DurationRing.tsx',
          from: "      playCue('go');\n      onDone();",
          to: "      playCue('go');",
        },
      ],
      falls: [
        'à zéro, la série se coche seule',
        '→ et le mouvement suivant prend sa place',
      ],
    },
    {
      name: '« Remettre » ne remet rien',
      edits: [
        {
          file: 'src/features/client/guided/scene/SetHero.tsx',
          from: '          onReset={() => setLap(lap + 1)}',
          to: '          onReset={() => {}}',
        },
      ],
      falls: ['« Remettre à 2 min » repart d’un anneau plein'],
    },
    {
      name: "« Remettre » s'affiche avant le lancement",
      edits: [
        {
          file: 'src/features/client/guided/scene/DurationRing.tsx',
          from: '      {started && (',
          to: '      {(started || true) && (',
        },
      ],
      falls: ['→ sans proposer de remettre ce qui n’a pas bougé'],
    },
    {
      name: "l'anneau disparaît au profit de la dose écrite",
      edits: [
        {
          file: 'src/features/client/guided/scene/SetHero.tsx',
          from: '      {duration ? (\n        <DurationRing',
          to: '      {false ? (\n        <DurationRing',
        },
      ],
      falls: [
        'la corde à sauter attend une touche, anneau plein',
        'une touche le lance, et il décompte',
        '« Remettre à 2 min » repart d’un anneau plein',
        'à zéro, la série se coche seule',
        '→ et le mouvement suivant prend sa place',
      ],
    },
    {
      name: "rien n'est proposé d'après la dernière fois",
      edits: [
        {
          file: 'src/features/client/guided/load.ts',
          from: '  return heaviest(lastTime);\n};',
          to: '  return lastTime ? undefined : undefined;\n};',
        },
      ],
      falls: [
        'la charge de la dernière fois est proposée',
        '+ ajoute un kilo, et la légende le dit',
        '− en retire un',
        'un appui long avance de cinq en cinq',
      ],
    },
    {
      name: "la série suivante n'hérite pas de la charge notée",
      edits: [
        {
          file: 'src/features/client/guided/load.ts',
          from: "    if (typeof earlier === 'number' && earlier > 0) return earlier;",
          to: "    if (typeof earlier === 'number' && earlier < 0) return earlier;",
        },
      ],
      falls: ['la série suivante reprend la charge notée juste avant'],
    },
    {
      name: 'la légende ne compare plus',
      edits: [
        {
          file: 'src/features/client/guided/load.ts',
          from: "  if (gap === 0) return 'comme la dernière fois';",
          to: "  if (gap !== 0) return 'comme la dernière fois';",
        },
      ],
      falls: [
        'la charge de la dernière fois est proposée',
        '+ ajoute un kilo, et la légende le dit',
        '− en retire un',
      ],
    },
    {
      name: "l'appui long ne répète plus",
      note: 'La première assertion lit aussi la légende : elle tombe avec.',
      edits: [
        {
          file: 'src/features/client/guided/scene/NumberStepper.tsx',
          from: '    timer.current = setTimeout(repeat, HOLD_EVERY);',
          to: '',
        },
      ],
      falls: ['un appui long avance de cinq en cinq'],
    },
    {
      name: "« Série faite » n'enregistre plus la charge affichée",
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '    if (current && ownNoted === undefined && currentLoad !== undefined) {\n      writeLoad(current, currentLoad);\n    }\n',
          to: '',
        },
      ],
      falls: [
        '« Série faite » enregistre aussi la charge proposée, sans saisie',
      ],
    },
    {
      name: 'une charge effacée revient',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '      declined: next === undefined,',
          to: '      declined: false,',
        },
      ],
      falls: [
        'une charge effacée reste effacée',
        '→ et la série cochée n’en enregistre aucune',
      ],
    },
    {
      name: '« Série précédente » ne décoche rien',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: "                onClick={() => act({ type: 'undo', key: lastDone })}",
          to: '                onClick={() => {}}',
        },
      ],
      falls: ['« Série précédente » décoche la dernière série faite'],
    },
    {
      name: 'passer un exercice ne passe rien',
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: '      const skipped = [...state.skipped, exerciseKeyOf(current)];',
          to: '      const skipped = [...state.skipped];',
        },
      ],
      falls: [
        '« Passer cet exercice » mène au mouvement suivant',
        '→ sans cocher les séries passées',
      ],
    },
    {
      name: 'le champ « kg » revient sous la corde à sauter',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '    (!current.exercise.duration || heaviest(lastTimeOfCurrent) !== undefined);',
          to: '    (true || heaviest(lastTimeOfCurrent) !== undefined);',
        },
      ],
      falls: ['la corde à sauter n’a ni charge ni proposition d’en noter'],
    },
    {
      name: "« Noter une charge » n'ouvre rien",
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: "              onAskLoad={() =>\n                act({ type: 'askLoad', exerciseKey: exerciseKeyOf(current) })\n              }",
          to: '              onAskLoad={() => {}}',
        },
      ],
      falls: ['→ et le sélecteur apparaît vide'],
    },
    {
      name: 'les noms de la liste sont de nouveau coupés',
      edits: [
        {
          file: 'src/features/client/guided/scene/BlockSets.tsx',
          from: '              <Text fontSize="sm" color="fg.muted" minW={0}>\n                {e.name}',
          to: '              <Text fontSize="sm" color="fg.muted" minW={0} lineClamp={1} maxW="60px">\n                {e.name}',
        },
      ],
      falls: ['aucun nom de mouvement n’est rogné dans la liste'],
    },
    {
      name: 'le nombre de répétitions ne se touche plus',
      edits: [
        {
          file: 'src/features/client/guided/scene/SetHero.tsx',
          from: "    !!onRepsChange && prescribedReps !== undefined && unit === 'reps';",
          to: '    false;',
        },
      ],
      falls: [
        'le nombre prescrit se touche, et rien ne s’ouvre avant',
        '→ il ouvre son sélecteur, au prescrit',
        '→ deux de moins : 8, et l’écart se lit',
        'la série faite dit ce qui a été fait : 8 reps',
        '→ la série suivante repart du prescrit, sélecteur fermé',
      ],
    },
    {
      name: 'le sélecteur des répétitions est ouvert d’emblée',
      edits: [
        {
          file: 'src/features/client/guided/scene/SetHero.tsx',
          from: '  const [editingReps, setEditingReps] = useState(reps !== undefined);',
          to: '  const [editingReps, setEditingReps] = useState(true);',
        },
      ],
      // Ouvert d'emblée, le sélecteur prend la place de la dose en grand :
      // c'est aussi ce que garde la première assertion de la suite.
      falls: [
        'la série en cours se lit en grand : rang, nom, dose',
        'le nombre prescrit se touche, et rien ne s’ouvre avant',
        '→ la série suivante repart du prescrit, sélecteur fermé',
      ],
    },
    {
      name: 'les répétitions notées ne s’écrivent nulle part',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '                  ? (reps) => writeSet(current, { reps })',
          to: '                  ? () => {}',
        },
      ],
      falls: [
        '→ deux de moins : 8, et l’écart se lit',
        'la série faite dit ce qui a été fait : 8 reps',
      ],
    },
    {
      name: 'la série faite tait ses répétitions',
      edits: [
        {
          file: 'src/features/client/guided/scene/BlockSets.tsx',
          from: "    value?.reps != null ? `${value.reps} reps` : '',",
          to: "    '',",
        },
      ],
      falls: ['la série faite dit ce qui a été fait : 8 reps'],
    },
  ],
};
