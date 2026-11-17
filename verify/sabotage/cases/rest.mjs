/** Les sabotages de `verify_rest.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_rest.mjs',
  cases: [
    {
      name: "« + 15 s » n'ajoute rien",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: 'bonus: state.rest.bonus + 15',
          to: 'bonus: state.rest.bonus + 0',
        },
      ],
      falls: ['« + 15 s » rallonge le repos de quinze secondes'],
    },
    {
      name: "la carte n'applique pas le rallongement",
      edits: [
        {
          file: 'src/features/client/guided/scene/RestHero.tsx',
          from: '    if (more > 0) extend(more);\n',
          to: '',
        },
      ],
      falls: ['« + 15 s » rallonge le repos de quinze secondes'],
    },
    {
      name: 'la charge suivante ne se règle plus pendant le repos',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '  const loadStepper = current && showLoad && (',
          to: '  const loadStepper = current && false && (',
        },
      ],
      falls: [
        'la charge de la série suivante se règle pendant le repos',
        '→ la série suivante revient en grand, avec la charge réglée',
      ],
    },
    {
      name: 'le repos ne finit plus de lui-même',
      edits: [
        {
          file: 'src/features/client/guided/scene/RestHero.tsx',
          from: "      playCue('go');\n      onDone();",
          to: "      playCue('go');",
        },
      ],
      falls: [
        'à zéro, la carte de repos s’efface d’elle-même',
        '→ et la série suivante est là',
      ],
    },
    {
      name: 'ce qui vient perd sa charge',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '                    currentLoad !== undefined\n',
          to: '                    false\n',
        },
      ],
      falls: ['→ et ce qui vient, avec sa charge'],
    },
    {
      name: 'le pied de série reste pendant le repos',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '      {rest ? (\n        // Le repos : rallonger',
          to: '      {rest && false ? (\n        // Le repos : rallonger',
        },
      ],
      falls: [
        'pendant le repos, aucun bouton ne coche la série suivante',
        '« + 15 s » rallonge le repos de quinze secondes',
        '« Passer » termine le repos',
        '→ la série suivante revient en grand, avec la charge réglée',
      ],
    },
    {
      name: "la carte repousse la liste hors de l'écran",
      edits: [
        {
          file: 'src/features/client/guided/scene/RestHero.tsx',
          from: '      borderRadius="card"\n      p={4}',
          to: '      borderRadius="card"\n      p={4}\n      minH="900px"',
        },
      ],
      falls: ['la série suivante reste lisible dans la liste, sous le repos'],
    },
    {
      name: "un repos est inventé là où rien n'est prescrit",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: '      return current.restAfter\n        ? merge(marked, {',
          to: '      return true\n        ? merge(marked, {',
        },
        {
          file: 'src/features/client/guided/session.ts',
          from: '              duration: current.restAfter,\n',
          to: '              duration: current.restAfter ?? 30,\n',
        },
      ],
      falls: ["un bloc sans repos prescrit n'affiche aucune carte de repos"],
    },
    {
      name: '« + 15 s » n’allonge plus le repos entre deux blocs',
      edits: [
        {
          file: 'src/features/client/guided/scene/BetweenBlocks.tsx',
          from: 'onClick={() => setBonus((more) => more + 15)}',
          to: 'onClick={() => setBonus((more) => more + 0)}',
        },
      ],
      falls: ['« + 15 s » le rallonge aussi'],
    },
    {
      name: 'le repos entre deux blocs ne dit plus ce qui vient',
      edits: [
        {
          file: 'src/features/client/guided/scene/BetweenBlocks.tsx',
          from: "nextTitle={step.nextExerciseName ?? ''}",
          to: 'nextTitle=""',
        },
      ],
      falls: ['→ et annonce ce qui vient'],
    },
    {
      name: '« Passer » ne quitte plus le repos entre deux blocs',
      edits: [
        {
          file: 'src/features/client/guided/scene/BetweenBlocks.tsx',
          from: '            onClick={onDone}',
          to: '            onClick={() => {}}',
        },
      ],
      falls: ['« Passer » mène au bloc suivant'],
    },
    {
      name: 'la fin du repos entre deux blocs ne mène nulle part',
      edits: [
        {
          file: 'src/features/client/guided/scene/BetweenBlocks.tsx',
          from: '          onDone={onDone}',
          to: '          onDone={() => {}}',
        },
      ],
      falls: ['à zéro, le bloc suivant vient de lui-même'],
    },
  ],
};
