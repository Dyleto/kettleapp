/** Les sabotages de `verify_journal.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/coach/pages/ClientJournal.tsx';
const DOMAIN = 'src/domain/history/journal.ts';
const READ = 'src/features/coach/hooks/useReadOnOpen.ts';
const SUMMARY = 'src/features/coach/journal/JournalSummary.tsx';
const CALENDAR = 'src/kit/MonthCalendar.tsx';

const POINTS = 'cinq points, et la phrase de la série en cours';
const RHYTHM =
  '→ le rythme : depuis quand, combien par semaine, et cette semaine';
const TAGS = '→ les étiquettes et leur compte, la douleur d’abord';
const TABS =
  'la bascule dit le volet ouvert, et « Programme » mène à l’atelier';
const FILTER = '« Douleur × 1 » ne laisse que la séance qui la porte';
const ALL = '→ « Tout afficher » rend toutes les séances';
const NOT_ON_SCREEN =
  'ouvrir l’écran ne lit rien : la séance non lue garde son point';
const ON_OPEN = '→ ouvrir une séance la lit, elle seule, et son point tombe';
const COLORS = 'une pastille pleine par séance, à la couleur de son effort';
const MONTHS =
  '→ il ouvre sur le mois de la dernière séance, et ses flèches parcourent les mois';
const DAY_OPENS = '→ une pastille ouvre sa séance, qui devient lue';
const NO_HEALTH =
  'la carte dit pourquoi ses ressentis n’ont ni étiquette ni mot';
const OVERFLOW = '→ rien ne déborde de l’écran';

export default {
  suite: 'verify_journal.mjs',
  cases: [
    {
      // L'ancien journal : tout l'historique lu dès l'ouverture de l'écran.
      // La séance d'à côté, ouverte ensuite, n'envoie rien, mais la lecture
      // est déjà partie ; le calendrier, lui, ne voit pas la différence.
      name: 'l’écran lit tout à son ouverture',
      edits: [
        {
          file: PAGE,
          from: "import { useMemo, useState } from 'react';",
          to: "import { useEffect, useMemo, useState } from 'react';",
        },
        {
          file: PAGE,
          from: '  const readOnOpen = useReadOnOpen(clientId!);\n',
          to: '  const readOnOpen = useReadOnOpen(clientId!);\n  useEffect(() => history.forEach(readOnOpen), [history, readOnOpen]);\n',
        },
      ],
      falls: [NOT_ON_SCREEN, ON_OPEN],
    },
    {
      name: 'ouvrir une séance ne la lit pas',
      edits: [
        {
          file: READ,
          from: '      if (completed.viewedByCoach) return;',
          to: '      if (completed.viewedByCoach || completed) return;',
        },
      ],
      falls: [ON_OPEN, DAY_OPENS],
    },
    {
      // Le serveur l'enregistre, l'écran ne le montre pas : le point reste.
      name: 'la lecture ne corrige pas l’historique affiché',
      edits: [
        {
          file: READ,
          from: '                  c._id === completed._id ? { ...c, viewedByCoach: true } : c',
          to: '                  c',
        },
      ],
      falls: [ON_OPEN],
    },
    {
      name: 'une pastille ouvre sa séance sans la lire',
      edits: [
        {
          file: PAGE,
          from: '                  if (completed) open(completed);',
          to: '                  if (completed) setOpenId(completed._id);',
        },
      ],
      falls: [DAY_OPENS],
    },
    {
      name: 'un ancien bilan est sauté dans les points',
      edits: [
        {
          file: DOMAIN,
          from: '  const zones = byDate(history)\n    .slice(-WINDOW)',
          to: '  const zones = byDate(history.filter((c) => c.feedback))\n    .slice(-WINDOW)',
        },
      ],
      falls: [POINTS],
    },
    {
      name: 'la série ne compte que la dernière séance',
      edits: [
        {
          file: DOMAIN,
          from: 'i >= 0 && zones[i] === last; i--',
          to: 'i >= zones.length - 1 && zones[i] === last; i--',
        },
      ],
      falls: [POINTS],
    },
    {
      name: 'le rythme regarde huit semaines',
      edits: [
        {
          file: DOMAIN,
          from: 'const RHYTHM_WEEKS = 4;',
          to: 'const RHYTHM_WEEKS = 8;',
        },
      ],
      falls: [RHYTHM],
    },
    {
      name: 'la semaine oublie son objectif',
      edits: [{ file: DOMAIN, from: '    target > 0\n', to: '    false\n' }],
      falls: [RHYTHM],
    },
    {
      name: 'la douleur n’est plus la première étiquette',
      edits: [
        {
          file: DOMAIN,
          from: "        Number(b.tag === 'pain') - Number(a.tag === 'pain') ||\n",
          to: '',
        },
      ],
      falls: [TAGS],
    },
    {
      name: 'la bascule ne dit plus le volet ouvert',
      edits: [
        {
          file: 'src/features/coach/components/ClientTabs.tsx',
          from: "    aria-current={current ? 'page' : undefined}",
          to: '    aria-current={undefined}',
        },
      ],
      falls: [TABS],
    },
    {
      name: 'une étiquette ne filtre plus',
      edits: [
        {
          file: PAGE,
          from: '  const visible = withTag(history, tag);',
          to: '  const visible = withTag(history, null);',
        },
      ],
      falls: [FILTER],
    },
    {
      name: '« Tout afficher » ne rend rien',
      edits: [
        {
          file: PAGE,
          from: '                    onClick={() => setTag(null)}',
          to: '                    onClick={() => undefined}',
        },
      ],
      falls: [ALL],
    },
    {
      name: 'les pastilles perdent leur couleur',
      edits: [
        {
          file: CALENDAR,
          from: "              bg={mark.zone ? EFFORT_ZONE_COLOR[mark.zone] : 'bg.raised'}",
          to: '              bg="bg.raised"',
        },
      ],
      falls: [COLORS],
    },
    {
      // Il ouvre sur le mois en cours : novembre, vide, et les pastilles
      // d'août ne sont plus là où la suite les cherche — leurs couleurs
      // comme celle du 30, qui s'ouvre.
      name: 'le calendrier ouvre sur le mois en cours',
      edits: [
        { file: DOMAIN, from: '    start: newest,', to: '    start: current,' },
      ],
      falls: [COLORS, MONTHS, DAY_OPENS],
    },
    {
      name: 'le refus de partage se tait',
      edits: [
        {
          file: SUMMARY,
          from: '      {!sharesHealthData ? (',
          to: '      {false ? (',
        },
      ],
      falls: [NO_HEALTH],
    },
    {
      name: 'les jours du calendrier débordent sur téléphone',
      edits: [
        {
          file: CALENDAR,
          from: "            w: 'full',\n            maxW: '44px',",
          to: "            w: '52px',\n            maxW: '52px',",
        },
      ],
      falls: [OVERFLOW],
    },
  ],
};
