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

const JOURNAL = 'src/domain/history/journal.ts';
const ROWS_DOMAIN = 'src/domain/history/sessionRow.ts';
const LIST_PIECES = 'src/features/client/progress/SessionList.tsx';
const CALENDAR =
  'toujours là : une pastille par séance, à la couleur de son effort, sur le mois de la dernière';
const NO_FUTURE =
  '→ ses flèches s’arrêtent au mois en cours : pas de mois futur';
const DAY_OPENS = '→ une pastille ouvre sa séance';
const TWO = 'la pastille d’un jour à deux séances ouvre la liste des deux';
const EACH = '→ et chacune s’ouvre de là';
const LIST =
  'une ligne par séance, la plus récente d’abord : son nom, sa date, ce qu’il y a à savoir, son ressenti';
const ROW_OPENS = '→ une ligne ouvre sa séance';

const DETAIL = 'src/features/client/progress/CompletedDetail.tsx';
const CORRECT = 'src/features/client/progress/CorrectFlow.tsx';
const SHEET_NAMED =
  'sur téléphone, une séance s’ouvre en feuille, nommée par sa date';
const FEELING = '→ son ressenti : le visage, le mot, et ce qu’il veut dire';
const REPLY =
  '→ ton mot, et sous lui la réponse de Julie, que l’ouvrir marque lue';
const DONE =
  '→ ce que tu as fait, mouvement par mouvement : le format et la dose, le fait en face';
const RECORD_ONCE = '→ un record se marque sur la seule séance qui l’a établi';
const ARROW = '→ une charge plus lourde que la fois d’avant porte sa flèche';
const LEGACY = 'un ancien bilan montre ses cinq axes, sans visage ni moyenne';
const LEGACY_LOADS =
  '→ « Corriger » rouvre ses charges, et s’enregistre de là : aucun ressenti à inventer';
const LEGACY_BACK =
  '→ rien de changé : rien n’est envoyé, et la séance revient';
const PLACEHOLDER = 'le panneau attend une séance, et dit ce qu’il montrera';
const PANEL =
  'une ligne ouvre sa séance dans le panneau, à droite de la liste, sans feuille';
const CURRENT = '→ la ligne ouverte le dit';
const REOPEN =
  '« Corriger » rouvre tes charges, puis ton ressenti tel que tu l’as laissé, date comprise';
const SENT =
  '→ n’envoie que ce qui a changé : une charge, le ressenti tel quel, et la date';
const CORRECTED =
  '→ la séance revient corrigée : à sa nouvelle date, avec sa charge, et « Corrigée le »';

export default {
  suite: 'verify_progress.mjs',
  cases: [
    {
      // Refaire 20 kg le 30 déplacerait le record du swing au 30 : il
      // passerait devant le goblet, et sa feuille le marquerait au 30.
      // Le record change de séance : le détail des deux le dit aussi, et
      // ses lignes se lisent entières (H1).
      name: 'un record se date au dernier passage qui l’égale',
      edits: [
        {
          file: DOMAIN,
          from: '          if (load > known.best) {',
          to: '          if (load >= known.best) {',
        },
      ],
      falls: [RECORDS, RECORD_OPENS, DONE, RECORD_ONCE, ARROW],
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
      // Sans la garde, le calendrier se monte avant l'historique : ce cas
      // garde aussi `MonthCalendar`, qui doit suivre un nouveau `start`.
      // Sans cela, trois parties du calendrier tombaient avec lui.
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
          from: "              md: 'repeat(2, minmax(0, 1fr))',\n              xl: 'repeat(2, minmax(0, 1fr)) 360px',",
          to: "              md: '1fr',\n              xl: '1fr',",
        },
      ],
      // Sur une colonne, le panneau passe sous la liste, et non plus à
      // côté : il tombe avec.
      falls: [WIDE, PANEL],
    },
    {
      name: 'le calendrier s’ouvre sur l’avenir',
      edits: [
        {
          file: JOURNAL,
          from: '    last: newest > current ? newest : current,',
          to: '    last: new Date(current.getFullYear() + 1, current.getMonth()),',
        },
      ],
      falls: [NO_FUTURE],
    },
    {
      name: 'les pastilles perdent leur zone',
      edits: [
        {
          file: JOURNAL,
          from: '          zone: level?.zone ?? null,',
          to: '          zone: null,',
        },
      ],
      falls: [CALENDAR],
    },
    {
      // Une pastille à une séance ouvre la liste d'un jour, au lieu de la
      // séance.
      name: 'une pastille n’ouvre plus sa séance',
      edits: [
        {
          file: PAGE,
          from: '                  if (ofDay.length === 1) open(ofDay[0]);',
          to: '                  if (ofDay.length === 1) setDay(picked);',
        },
      ],
      falls: [DAY_OPENS],
    },
    {
      // L'ancien calendrier : la plus récente du jour, l'autre perdue.
      name: 'un jour à deux séances n’ouvre que la dernière',
      edits: [
        {
          file: PAGE,
          from: '                  else if (ofDay.length > 1) setDay(picked);',
          to: '                  else if (ofDay.length > 1) open(ofDay[0]);',
        },
      ],
      falls: [TWO, EACH],
    },
    {
      name: 'un jour à deux séances ne le dit pas',
      edits: [
        {
          file: JOURNAL,
          from: '        sessions.length > 1',
          to: '        false',
        },
      ],
      falls: [TWO],
    },
    {
      name: 'la réponse du coach ne se dit plus sur la ligne',
      edits: [
        {
          file: ROWS_DOMAIN,
          from: '  if (last) mentions.push(`${last.firstName} a répondu`);\n',
          to: '',
        },
      ],
      falls: [LIST],
    },
    {
      name: 'une séance remaniée depuis ne le dit plus',
      edits: [
        {
          file: ROWS_DOMAIN,
          from: "  if (sinceThen(completed, sessions).state === 'changed')",
          to: '  if (false)',
        },
      ],
      falls: [LIST],
    },
    {
      name: 'une correction ne se dit plus',
      edits: [
        {
          file: ROWS_DOMAIN,
          from: '  if (completed.editedAt)',
          to: '  if (false)',
        },
      ],
      falls: [LIST],
    },
    {
      name: 'la ligne perd son ressenti',
      edits: [
        {
          file: LIST_PIECES,
          from: '      <EffortPill effort={completed.feedback?.effort} />\n',
          to: '',
        },
      ],
      falls: [LIST],
    },
    {
      name: 'la liste se lit du plus ancien au plus récent',
      edits: [
        {
          file: PAGE,
          from: '        (a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)',
          to: '        (a, b) => Date.parse(a.completedAt) - Date.parse(b.completedAt)',
        },
      ],
      falls: [LIST],
    },
    {
      // Les lignes du jour à deux séances sont les mêmes : elles tombent
      // avec.
      // La ligne est la seule porte vers le détail d'une séance : tout ce
      // qui s'y lit tombe avec elle. La liste n'en comptait que deux, écrite
      // avant que Progrès ait son détail (F2) ; la passe H1 l'a complétée.
      name: 'une ligne n’ouvre plus sa séance',
      edits: [
        {
          file: LIST_PIECES,
          from: '        onOpen={() => onOpen(completed)}',
          to: '        onOpen={() => undefined}',
        },
      ],
      falls: [
        EACH,
        ROW_OPENS,
        SHEET_NAMED,
        FEELING,
        REPLY,
        DONE,
        RECORD_ONCE,
        ARROW,
        LEGACY,
        LEGACY_LOADS,
        LEGACY_BACK,
        PANEL,
        CURRENT,
        REOPEN,
        SENT,
        CORRECTED,
      ],
    },
    {
      // La correction attend la feuille par son nom pour la relire : elle
      // tombe avec.
      name: 'la feuille d’une séance perd son nom',
      edits: [
        {
          file: DETAIL,
          from: '        label={`${titleOf(detail.completed)} · ${detailDate(detail.completed.completedAt)}`}',
          to: '        label="Séance"',
        },
      ],
      falls: [SHEET_NAMED, CORRECTED],
    },
    {
      name: 'le ressenti ne dit plus ce qu’il veut dire',
      edits: [
        {
          file: DETAIL,
          from: '                « {level.description} »',
          to: '',
        },
      ],
      falls: [FEELING],
    },
    {
      name: 'le détail ne montre plus la réponse du coach',
      edits: [
        {
          file: DETAIL,
          from: '              {replyLine(reply)}',
          to: "              {''}",
        },
      ],
      falls: [REPLY],
    },
    {
      name: 'ouvrir une séance ne marque plus sa réponse lue',
      edits: [
        {
          file: DETAIL,
          from: '    if (self && hasUnread(completed.replies)) markRead(completed._id);',
          to: '    if (false) markRead(completed._id);',
        },
      ],
      falls: [REPLY],
    },
    {
      // La flèche se vérifie sur la ligne entière, format compris (H1).
      name: 'une ligne perd le format de son bloc',
      edits: [
        {
          file: DETAIL,
          from: "              const sub = [line.format, line.dose].filter(Boolean).join(' · ');",
          to: "              const sub = [line.dose].filter(Boolean).join(' · ');",
        },
      ],
      falls: [DONE, CORRECTED, ARROW],
    },
    {
      name: 'chaque passage qui égale un record le porte',
      edits: [
        {
          file: DETAIL,
          from: '          .filter((m) => m.recordId === completed._id)',
          to: '          .filter((m) => completed.blocks.some((b) => b.exercises.some((e) => e.exercise?._id === m.exerciseId && e.performed?.sets?.some((set) => set.weight === m.best))))',
        },
      ],
      falls: [DONE, RECORD_ONCE],
    },
    {
      name: 'le record ne se dit plus sur sa ligne',
      edits: [
        {
          file: DETAIL,
          from: '                    {record && <Chip tone="amber">Record</Chip>}',
          to: '',
        },
      ],
      falls: [DONE],
    },
    {
      name: 'la flèche d’une charge qui monte disparaît',
      edits: [
        {
          file: DETAIL,
          from: '                      {line.up && !record && (',
          to: '                      {false && (',
        },
      ],
      falls: [ARROW],
    },
    {
      // Le retour au détail se reconnaît à ses axes : il tombe avec.
      name: 'un ancien bilan ne montre plus ses axes',
      edits: [
        {
          file: DETAIL,
          from: '        completed.metrics && <LegacyMetrics metrics={completed.metrics} />',
          to: '        null',
        },
      ],
      falls: [LEGACY, LEGACY_BACK],
    },
    {
      name: 'un ancien bilan demande un ressenti',
      edits: [
        {
          file: CORRECT,
          from: '  const legacy = !completed.feedback;',
          to: '  const legacy = false;',
        },
      ],
      falls: [LEGACY_LOADS, LEGACY_BACK],
    },
    {
      // Sans visage, « Enregistrer » attend : rien ne part.
      name: '« Corriger » repart d’un ressenti vide',
      edits: [
        {
          file: CORRECT,
          from: '        effort: completed.feedback?.effort,',
          to: '        effort: undefined,',
        },
      ],
      falls: [REOPEN, SENT, CORRECTED],
    },
    {
      name: '« Corriger » oublie la date enregistrée',
      edits: [
        {
          file: CORRECT,
          from: '      date={recordedDay}\n',
          to: '',
        },
      ],
      falls: [REOPEN, SENT, CORRECTED],
    },
    {
      // Les séries que le client n'a pas regardées repartiraient, et
      // réécriraient ce qui est enregistré.
      name: 'une correction renvoie toutes les charges',
      edits: [
        {
          file: CORRECT,
          from: '    const changed = changedPerformed(original, performed);',
          to: '    const changed = changedPerformed({}, performed);',
        },
      ],
      falls: [SENT],
    },
    {
      name: 'le détail ne dit plus qu’une séance a été corrigée',
      edits: [
        {
          file: DETAIL,
          from: '      {completed.editedAt && (',
          to: '      {false && (',
        },
      ],
      falls: [CORRECTED],
    },
    {
      // Elle recouvre aussi « Mes charges » d'un ancien bilan, dont
      // « Enregistrer » ne reçoit plus le toucher.
      name: 'la feuille reste ouverte par-dessus la correction',
      edits: [
        {
          file: PAGE,
          from: '      {opened && !wide && !correcting && (',
          to: '      {opened && !wide && (',
        },
      ],
      falls: [REOPEN, SENT, CORRECTED, LEGACY_BACK],
    },
    {
      name: 'sur grand écran, une séance s’ouvre en feuille',
      edits: [
        {
          file: PAGE,
          from: '  const wide = useBreakpointValue({ base: false, xl: true }) ?? false;',
          to: '  const wide = false;',
        },
      ],
      falls: [PLACEHOLDER, PANEL, CURRENT],
    },
    {
      name: 'la ligne ouverte ne se marque plus',
      edits: [
        {
          file: LIST_PIECES,
          from: "      aria-current={open ? 'true' : undefined}",
          to: '',
        },
      ],
      falls: [CURRENT],
    },
  ],
};
