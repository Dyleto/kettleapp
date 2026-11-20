/** Les sabotages de `verify_progress.mjs`. Voir `../run.mjs`. */
const DOMAIN = 'src/domain/history/movements.ts';
const PIECES = 'src/features/client/progress/Movements.tsx';
const PAGE = 'src/features/client/progress/History.tsx';

const RECORDS =
  'deux records, les plus récents, la valeur en grand et ce qu’elle récompense';
const ROWS =
  'une ligne par mouvement chargé : la dernière charge, le nombre de séances, l’écart';
const CURVES = '→ une courbe chacun, sarcelle qui monte, bleue qui baisse';
const ORDER =
  'sur téléphone, les records et les mouvements passent avant le calendrier';
const SHEET =
  'un mouvement ouvre sa feuille : chaque passage, le plus récent d’abord, avec son format';
const BIG = '→ sa courbe en grand, et l’écart en tête';
const ESCAPE = '→ Échap la referme';
const RECORD_OPENS =
  'une carte de record ouvre la feuille de son mouvement, le record à sa date';
const SINGLE = 'un seul passage : la valeur seule, sans courbe ni écart';
const MORE = '→ au-delà de six mouvements, la liste se déplie à la demande';
const EMPTY = 'rien à montrer : le personnage, une phrase, et le programme';
const WIDE =
  'les records et les mouvements à gauche, le mois et les séances à droite';

export default {
  suite: 'verify_progress.mjs',
  cases: [
    {
      // Refaire 20 kg le 30 déplacerait le record du swing au 30 : il
      // passerait devant le goblet, et sa feuille le marquerait au 30.
      name: 'un record se date au dernier passage qui l’égale',
      edits: [
        {
          file: DOMAIN,
          from: '          if (load > known.best) {',
          to: '          if (load >= known.best) {',
        },
      ],
      falls: [RECORDS, RECORD_OPENS],
    },
    {
      name: 'les records ne se rangent plus par date',
      edits: [
        {
          file: DOMAIN,
          from: '    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at))',
          to: '    .sort(() => 0)',
        },
      ],
      falls: [RECORDS],
    },
    {
      name: 'l’écart se compte depuis le passage d’avant',
      edits: [
        {
          file: DOMAIN,
          from: '      delta: m.passages[m.passages.length - 1].load - m.passages[0].load,',
          to: '      delta:\n        m.passages[m.passages.length - 1].load -\n        m.passages[Math.max(0, m.passages.length - 2)].load,',
        },
      ],
      falls: [ROWS],
    },
    {
      name: 'les mouvements d’une séance s’affichent à rebours',
      edits: [
        {
          file: DOMAIN,
          from: '        (rank.get(a.exerciseId) ?? 0) - (rank.get(b.exerciseId) ?? 0)',
          to: '        (rank.get(b.exerciseId) ?? 0) - (rank.get(a.exerciseId) ?? 0)',
        },
      ],
      // La partie à un seul passage lit sa première ligne, « Mouvement 1 » :
      // elle tombe aussi, et c'est juste.
      falls: [ROWS, SINGLE],
    },
    {
      name: 'une baisse se dessine comme une hausse',
      edits: [
        {
          file: PIECES,
          from: '                    values={movement.passages.map((p) => p.load)}\n                    falling={movement.delta < 0}',
          to: '                    values={movement.passages.map((p) => p.load)}\n                    falling={false}',
        },
      ],
      falls: [CURVES],
    },
    {
      // Le document garde son ordre : seule la grille les intervertit.
      name: 'sur téléphone, les records et les mouvements passent sous le calendrier',
      edits: [
        {
          file: PAGE,
          from: '            <VStack align="stretch" gap="16px" minW={0}>\n              <Records',
          to: '            <VStack align="stretch" gap="16px" minW={0} order={{ base: 2, md: 0 }}>\n              <Records',
        },
      ],
      falls: [ORDER],
    },
    {
      name: 'la feuille lit les passages du plus ancien au plus récent',
      edits: [
        {
          file: PIECES,
          from: '  const passages = [...movement.passages].reverse();',
          to: '  const passages = movement.passages;',
        },
      ],
      falls: [SHEET, RECORD_OPENS],
    },
    {
      name: 'un passage perd le format de son bloc',
      edits: [
        {
          file: DOMAIN,
          from: '          format: formatName(block.type as BlockType),',
          to: "          format: '',",
        },
      ],
      falls: [SHEET, RECORD_OPENS],
    },
    {
      // Le goblet n'a atteint 26 kg qu'une fois : seul le swing, à 20 kg
      // deux fois, le montre.
      name: 'chaque passage qui égale le record se dit record',
      edits: [
        {
          file: PIECES,
          from: '              {passage.completedId === movement.recordId &&',
          to: '              {true &&',
        },
      ],
      falls: [RECORD_OPENS],
    },
    {
      name: 'la grande courbe perd son aire',
      edits: [
        {
          file: 'src/kit/Curve.tsx',
          from: "      {size === 'lg' && (\n        <polygon",
          to: '      {false && (\n        <polygon',
        },
      ],
      falls: [BIG],
    },
    {
      // Restée ouverte, la feuille recouvre la carte de record qu'on
      // touche ensuite.
      name: 'Échap ne referme plus la feuille',
      edits: [
        {
          file: PIECES,
          from: '  useSheetDismiss(true, onClose);\n',
          to: '',
        },
      ],
      falls: [ESCAPE, RECORD_OPENS],
    },
    {
      name: 'une carte de record ne s’ouvre plus',
      edits: [
        {
          file: PIECES,
          from: '            onClick={() => onOpen(record.exerciseId!)}',
          to: '            onClick={() => undefined}',
        },
      ],
      falls: [RECORD_OPENS],
    },
    {
      name: 'un seul passage montre un écart',
      edits: [
        {
          file: PIECES,
          from: '              {many && (',
          to: '              {true && (',
        },
      ],
      falls: [SINGLE],
    },
    {
      name: 'la liste ne se replie plus',
      edits: [
        { file: PIECES, from: 'const SHOWN = 6;', to: 'const SHOWN = 10;' },
      ],
      falls: [MORE],
    },
    {
      name: 'un historique vide n’accueille plus',
      edits: [
        {
          file: PAGE,
          from: '        {count === 0 ? (',
          to: '        {false ? (',
        },
      ],
      falls: [EMPTY],
    },
    {
      name: 'une seule colonne sur grand écran',
      edits: [
        {
          file: PAGE,
          from: "            templateColumns={{ base: '1fr', md: 'repeat(2, minmax(0, 1fr))' }}",
          to: '            templateColumns="1fr"',
        },
      ],
      falls: [WIDE],
    },
  ],
};
