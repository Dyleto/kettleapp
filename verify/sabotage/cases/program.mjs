/** Les sabotages de `verify_program.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/client/program/Program.tsx';
const CARD = 'src/domain/session/programCard.ts';

const LIST =
  'les séances dans l’ordre du coach, nommées, et leur compte en tête';
const SUNDAY =
  'une séance faite telle qu’elle est porte le jour : « Faite dimanche »';
const TODAY = '→ conseillée ce jour-ci : « À faire aujourd’hui »';
const CHANGED =
  '→ remaniée depuis qu’elle a été faite : « Modifiée depuis ta dernière fois »';
const LINE = 'une carte dit sa durée, ses blocs et ses mouvements distincts';
const COMPOSITION =
  '→ sa composition, un segment par bloc, l’échauffement à part';
const DAYS =
  '→ et ses jours conseillés, que le lecteur d’écran entend en entier';
const OPENS = 'une carte ouvre la fiche de sa séance';
const LOADING = 'six cartes fantômes, et pas « Ton programme arrive »';
const RUNNING = 'une séance commencée sur ce téléphone dit « En cours »';
const COLUMNS = 'les cartes passent sur deux colonnes';
const NOW_DONE = '→ et dit maintenant qu’elle est faite';

export default {
  suite: 'verify_program.mjs',
  cases: [
    {
      // Le retour du terrain : l'identifiant seul, qui survit à une
      // réécriture, annonçait faite une séance jamais vue.
      name: 'une séance se reconnaît à son identifiant, plus à son contenu',
      edits: [
        {
          file: 'src/domain/history/sessionMatch.ts',
          from: '  const sameDose = onThisId.filter((h) => sessionDose(h.blocks ?? []) === dose);',
          to: '  const sameDose = onThisId;',
        },
      ],
      falls: [CHANGED],
    },
    {
      name: 'l’état ignore l’historique',
      edits: [
        {
          file: CARD,
          from: '  const match = matchSession(session, history);',
          to: '  const match = matchSession(session, []);',
        },
      ],
      falls: [SUNDAY, CHANGED, NOW_DONE],
    },
    {
      name: 'le conseil du jour se tait',
      edits: [
        {
          file: CARD,
          from: '  if (session.suggestedDays?.includes(mondayIndex(now)))',
          to: '  if (false)',
        },
      ],
      falls: [TODAY],
    },
    {
      name: 'une séance de la semaine se date au lieu de dire son jour',
      edits: [
        {
          file: CARD,
          from: '  if (days < 7) return `Faite ${WEEKDAY_FULL[mondayIndex(on)]}`;\n',
          to: '',
        },
      ],
      falls: [SUNDAY],
    },
    {
      name: 'une séance laissée en cours ne le dit pas',
      edits: [
        {
          file: CARD,
          from: "  if (local) return { tone: 'local', label: LOCAL_LABEL[local] };",
          to: "  if (false) return { tone: 'local', label: LOCAL_LABEL[local!] };",
        },
      ],
      falls: [RUNNING],
    },
    {
      name: 'les exercices se comptent par ligne et non par mouvement',
      edits: [
        {
          file: CARD,
          from: "    plural(distinctExerciseCount(session), 'exercice'),",
          to: "    plural(session.blocks.length, 'exercice'),",
        },
      ],
      falls: [LINE],
    },
    {
      name: 'la carte perd sa composition',
      edits: [
        {
          file: PAGE,
          from: '      <Composition blocks={session.blocks} />\n',
          to: '',
        },
      ],
      falls: [COMPOSITION],
    },
    {
      name: 'tous les blocs prennent la couleur du travail',
      edits: [
        {
          file: 'src/kit/Composition.tsx',
          from: '          bg={BLOCK_ACCENT_COLOR[getBlockAccent(block.type)]}',
          to: '          bg={BLOCK_ACCENT_COLOR.work}',
        },
      ],
      falls: [COMPOSITION],
    },
    {
      name: 'les jours conseillés ne se disent plus en entier',
      edits: [
        {
          file: 'src/features/client/program/SuggestedDays.tsx',
          from: '      aria-label={`Conseillée ${formatSuggestedDays(valid)}`}',
          to: '      aria-label={undefined}',
        },
      ],
      falls: [DAYS],
    },
    {
      name: 'le compte des séances disparaît de l’en-tête',
      edits: [
        {
          file: PAGE,
          from: '          {!isLoading && count > 0 && (',
          to: '          {false && (',
        },
      ],
      falls: [LIST],
    },
    {
      // L'ancien écran : vide le temps de la requête, il annonçait qu'il
      // n'y avait pas de programme.
      name: 'le chargement passe pour un programme vide',
      edits: [
        {
          file: PAGE,
          from: '        {isLoading ? (',
          to: '        {false ? (',
        },
      ],
      falls: [LOADING],
    },
    {
      name: 'une seule colonne sur grand écran',
      edits: [
        {
          file: PAGE,
          from: "            templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }}\n            gap={{ base: '12px', md: '16px' }}",
          to: "            templateColumns=\"1fr\"\n            gap={{ base: '12px', md: '16px' }}",
        },
      ],
      falls: [COLUMNS],
    },
    {
      name: 'une carte ne mène plus à sa séance',
      edits: [
        {
          file: PAGE,
          from: '                onOpen={() => navigate(CLIENT_ROUTES.sessionById(session._id))}',
          to: '                onOpen={() => navigate(CLIENT_ROUTES.program)}',
        },
      ],
      falls: [OPENS],
    },
  ],
};
