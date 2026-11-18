/** Les sabotages de `verify_palette.mjs`. Voir `../run.mjs`. */
const TAB = 'src/features/coach/components/ClientProgramTab.tsx';
const FORMAT = 'src/domain/session/format.ts';

export default {
  suite: 'verify_palette.mjs',
  cases: [
    {
      // Le Tabata ne se distingue plus d'un bloc de travail continu.
      name: 'le dessin du Tabata perd son repos',
      edits: [
        {
          file: FORMAT,
          from: "      return times(4, stroke('work', 1, 2), stroke('rest', 0.55));",
          to: "      return times(4, stroke('work', 1, 2), stroke('work', 0.55));",
        },
      ],
      falls: ['neuf formats, chacun dessiné, sans « Every »'],
    },
    {
      name: '« Every » revient dans la palette',
      edits: [
        {
          file: FORMAT,
          from: "  'timecap',\n];",
          to: "  'timecap',\n  'every',\n];",
        },
      ],
      // Sur téléphone, le neuvième et le dixième se déplient ensemble, sous
      // « TimeCap, Every et les autres » : le geste attendu n'existe plus.
      falls: [
        'neuf formats, chacun dessiné, sans « Every »',
        'huit formats sous le pouce, et TimeCap se déplie',
      ],
    },
    {
      name: 'la palette ne se replie plus',
      edits: [
        {
          file: TAB,
          from: '              onCancel={closeBlockSelector}\n',
          to: '',
        },
      ],
      falls: ['→ « Annuler » la replie'],
    },
    {
      // Le bloc est créé, mais il faut encore chercher son « + exercice ».
      name: 'le bloc créé n’ouvre pas son « + exercice »',
      edits: [
        {
          file: TAB,
          from: '    else setPickingBlockId(id);',
          to: '    else void id;',
        },
      ],
      falls: [
        'choisir un format crée le bloc en fin de séance, son « + exercice » ouvert',
        '→ l’exercice choisi s’y place',
      ],
    },
    {
      // L'identifiant rendu n'est plus celui du bloc : l'écran ouvre le
      // « + exercice » d'un bloc qui n'existe pas.
      name: 'l’ajout d’un bloc rend un autre identifiant que le sien',
      edits: [
        {
          file: 'src/features/workshop/hooks/useProgramEditor.ts',
          from: '            _id: id,',
          to: '            _id: newObjectId(),',
        },
      ],
      falls: [
        'choisir un format crée le bloc en fin de séance, son « + exercice » ouvert',
        '→ l’exercice choisi s’y place',
        '→ choisir crée le bloc et ouvre le tiroir de ses exercices',
      ],
    },
    {
      name: 'sur téléphone, la feuille montre les neuf formats d’emblée',
      edits: [
        {
          file: 'src/features/workshop/components/FormatPalette.tsx',
          from: 'const SHEET_FIRST = 8;',
          to: 'const SHEET_FIRST = 9;',
        },
      ],
      falls: ['huit formats sous le pouce, et TimeCap se déplie'],
    },
    {
      name: 'sur téléphone, le bloc créé n’ouvre pas son tiroir',
      edits: [
        {
          file: TAB,
          from: '    if (isMobile) setSelectorBlockId(id);\n    else setPickingBlockId(id);',
          to: '    if (!isMobile) setPickingBlockId(id);',
        },
      ],
      falls: ['→ choisir crée le bloc et ouvre le tiroir de ses exercices'],
    },
    {
      // « 2, 4 6-8 » : seuls les tirets séparent, et il ne reste qu'un palier.
      name: 'les paliers ne se lisent qu’entre tirets',
      edits: [
        {
          file: 'src/domain/session/rungs.ts',
          from: '    .split(/[^0-9]+/)',
          to: '    .split(/-/)',
        },
      ],
      falls: ['virgules, espaces et tirets se lisent, et le rappel le dit'],
    },
    {
      // La frappe s'ajoute au bout des paliers d'avant.
      name: 'le champ des paliers s’ouvre sans sélectionner',
      edits: [
        {
          file: 'src/features/workshop/components/InlineValue.tsx',
          from: "          // les paliers au lieu de s'ajouter au bout.\n          onFocus={(e) => e.target.select()}\n",
          to: "          // les paliers au lieu de s'ajouter au bout.\n",
        },
      ],
      falls: ['virgules, espaces et tirets se lisent, et le rappel le dit'],
    },
  ],
};
