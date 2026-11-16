/** Les sabotages de `verify_sheet.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_sheet.mjs',
  cases: [
    {
      name: 'la dose repasse derrière le nom',
      edits: [
        {
          file: 'src/features/client/sheet/BlockDetailCard.tsx',
          from: '                minW="74px"',
          to: '                minW="74px"\n                order={2}',
        },
      ],
      falls: ['une ligne : la dose devant le nom'],
    },
    {
      name: "un Tabata sans répétitions n'a pas de dose",
      edits: [
        {
          file: 'src/domain/session/dose.ts',
          from: '          ? formatDuration(block.workDuration)\n',
          to: "          ? ''\n",
        },
      ],
      falls: ['un Tabata sans répétitions se dose au temps de travail'],
    },
    {
      name: 'le Tabata ne dit pas ses tours',
      edits: [
        {
          file: 'src/domain/session/dose.ts',
          from: "        block.rounds ? `${block.rounds}${NBSP}tours` : '',",
          to: "        '',",
        },
      ],
      falls: ['le Tabata : son format, puis ses réglages en pastilles'],
    },
    {
      name: "l'icône d'information sur toutes les lignes",
      edits: [
        {
          file: 'src/features/client/sheet/BlockDetailCard.tsx',
          from: '            {hasInstructions(entry) && (',
          to: '            {true && (',
        },
      ],
      falls: [
        'l’icône d’information seulement là où il y a quelque chose à lire',
      ],
    },
    {
      name: 'la dernière charge ne se dit pas',
      edits: [
        {
          file: 'src/domain/session/dose.ts',
          from: '  const load = heaviest(last?.sets);',
          to: '  const load = undefined as number | undefined;',
        },
      ],
      falls: [
        '→ dessous, le repos et la plus lourde série de la dernière fois',
      ],
    },
    {
      name: "le dessin du Tabata n'alterne pas",
      edits: [
        {
          file: 'src/features/client/sheet/BlockRhythm.tsx',
          from: '          {alternates && (',
          to: '          {false && (',
        },
      ],
      falls: ['→ son dessin alterne huit efforts et huit repos, plus bas'],
    },
    {
      name: "les traits d'une échelle sont tous égaux",
      edits: [
        {
          file: 'src/domain/session/drawing.ts',
          from: '      bars: scheme.map((reps) => Math.max(SHORTEST_RUNG, reps / top)),',
          to: '      bars: scheme.map(() => 1),',
        },
      ],
      falls: ['trois paliers, trois traits qui montent'],
    },
    {
      name: "le pied n'est plus collé en bas",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '        position="fixed"\n        left={0}',
          to: '        position="static"\n        left={0}',
        },
      ],
      falls: ['« Démarrer » reste dans l’écran quand la fiche défile'],
    },
    {
      name: 'le record ne monte pas dans la feuille',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '          record={records.get(instruction.exercise._id)}',
          to: '          record={undefined}',
        },
      ],
      falls: ['→ la dernière fois, et le record'],
    },
    {
      name: 'toucher le fond ne referme pas la consigne',
      note: "Cascade attendue : la feuille restée ouverte recouvre la ligne suivante, qu'on ne peut donc pas toucher.",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '          onClose={() => setInstruction(null)}',
          to: '          onClose={() => {}}',
        },
      ],
      falls: [
        'toucher le fond la referme',
        'un mouvement sans rien à lire s’ouvre quand même, et le dit',
      ],
    },
    {
      name: 'un mouvement sans consigne ouvre une feuille muette',
      edits: [
        {
          file: 'src/features/client/sheet/InstructionSheet.tsx',
          from: '      {!note && !description && !video && !lastLine && (',
          to: '      {false && (',
        },
      ],
      falls: ['un mouvement sans rien à lire s’ouvre quand même, et le dit'],
    },
    {
      name: 'une séance commencée dit encore « Démarrer »',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "          {started ? 'Reprendre' : 'Démarrer'}",
          to: "          {'Démarrer'}",
        },
      ],
      falls: ['commencée sur ce téléphone, elle dit « Reprendre »'],
    },
    {
      name: "la feuille ne propose pas aujourd'hui",
      edits: [
        {
          file: 'src/features/client/sheet/DeclareSheet.tsx',
          from: '  const [date, setDate] = useState(today);',
          to: "  const [date, setDate] = useState('2026-11-01');",
        },
      ],
      falls: ['la feuille dit à quoi elle sert, et propose aujourd’hui'],
    },
    {
      name: '« Annuler » ne referme pas la feuille',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '          onClose={() => setDeclaring(false)}',
          to: '          onClose={() => {}}',
        },
      ],
      falls: ['« Annuler » referme sans rien ouvrir'],
    },
    {
      name: '« Continuer » saute les charges',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "            setFlow('record');",
          to: "            setFlow('review');",
        },
      ],
      falls: ['« Continuer » mène à « Mes charges »'],
    },
    {
      name: "la date choisie n'arrive pas au ressenti",
      note: "Cascade attendue : la date n'arrive pas au ressenti, elle ne part donc pas.",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '          date={declaredDate}',
          to: '          date={undefined}',
        },
      ],
      falls: [
        'le ressenti garde la date choisie, déjà dépliée',
        '→ et c’est elle qui part avec le bilan',
      ],
    },
    {
      name: 'le ressenti garde la date mais la laisse repliée',
      edits: [
        {
          file: 'src/features/client/end/Feeling.tsx',
          from: '    () => !!date && date !== toDateInputValue(new Date())',
          to: '    () => false',
        },
      ],
      falls: ['le ressenti garde la date choisie, déjà dépliée'],
    },
    {
      name: "l'accueil ne dit pas d'où l'on vient",
      note: "Cascade attendue : sans « Aujourd'hui » sur le lien, il n'y a rien à toucher pour y revenir.",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: "      state: { from: 'today' },",
          to: '      state: null,',
        },
      ],
      falls: [
        'ouverte depuis l’accueil : « Aujourd’hui »',
        '→ et le lien y ramène',
      ],
    },
    {
      name: 'sur grand écran, le résumé passe à gauche',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: 'lg: \'"blocks head"\' }}',
          to: 'lg: \'"head blocks"\' }}',
        },
      ],
      falls: ['le résumé est à droite des blocs'],
    },
    {
      name: 'sur grand écran, le pied du téléphone reste',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "        display={{ base: 'block', lg: 'none' }}\n        position=\"fixed\"",
          to: '        display="block"\n        position="fixed"',
        },
      ],
      falls: ['« Démarrer » est dans le résumé, une seule fois'],
    },
  ],
};
