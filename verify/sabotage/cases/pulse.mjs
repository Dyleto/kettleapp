/** Les sabotages de `verify_pulse.mjs`. Voir `../run.mjs`. */
const PULSE = 'src/features/coach/components/SessionPulse.tsx';
const PASSAGES = 'src/features/coach/components/SessionPassages.tsx';
const PAGE = 'src/features/coach/pages/ClientDetails.tsx';

export default {
  suite: 'verify_pulse.mjs',
  cases: [
    {
      name: 'le pouls ne dit plus depuis quand',
      edits: [
        {
          file: PULSE,
          from: '          {headline.since && ` ${headline.since}`}.',
          to: '          .',
        },
      ],
      falls: [
        'le pouls, sous l’en-tête : les passages, les cinq points, la dérive et depuis quand',
      ],
    },
    {
      name: 'le pouls ne compte plus les passages',
      edits: [
        {
          file: PULSE,
          from: "          {pulse.passages} passage{pulse.passages > 1 ? 's' : ''}",
          to: "          {''}",
        },
      ],
      falls: [
        'le pouls, sous l’en-tête : les passages, les cinq points, la dérive et depuis quand',
      ],
    },
    {
      // Les deux formes du pouls le portent : la carte et la phrase du
      // téléphone.
      name: 'le dernier mot du client disparaît',
      edits: [
        {
          file: 'src/domain/history/pulse.ts',
          from: '  const worded = [...passages].reverse().find((c) => c.clientNotes?.trim());',
          to: '  const worded = undefined as CompletedSession | undefined;',
        },
      ],
      falls: [
        '→ le dernier mot du client',
        'le pouls tient en une phrase et cinq points',
      ],
    },
    {
      name: 'la douleur ne dit plus où',
      edits: [
        {
          file: 'src/domain/history/pulse.ts',
          from: "  `${TAG_NOUN[tag]}${site ? ` · ${site}` : ''}${count > 1 ? ` × ${count}` : ''}`;",
          to: "  `${TAG_NOUN[tag]}${count > 1 ? ` × ${count}` : ''}`;",
        },
      ],
      falls: ['→ les étiquettes, la douleur avec son endroit'],
    },
    {
      name: 'le pouls tait ce qui reste à lire',
      edits: [
        {
          file: PULSE,
          from: '            {pulse.unread > 0 && (',
          to: '            {false && (',
        },
      ],
      falls: ['→ et ce qui reste à lire'],
    },
    {
      name: 'sur grand écran, le pouls ouvre une feuille qui double la colonne',
      edits: [
        {
          file: PAGE,
          from: '                      onOpen={isWide ? undefined : () => setPassagesOpen(true)}',
          to: '                      onOpen={() => setPassagesOpen(true)}',
        },
      ],
      falls: [
        'sur grand écran, il ne s’ouvre pas : la colonne de droite tient les passages',
      ],
    },
    {
      name: 'une séance jamais faite a un pouls vide',
      edits: [
        {
          file: PULSE,
          from: '  if (pulse.passages === 0) return null;\n',
          to: '',
        },
      ],
      falls: ['une séance jamais faite n’a pas de pouls'],
    },
    {
      name: 'la feuille ne montre que trois passages',
      edits: [
        {
          file: PASSAGES,
          from: '        <SessionPassages history={history} limit={5} />',
          to: '        <SessionPassages history={history} limit={3} />',
        },
      ],
      falls: ['le pouls ouvre les passages en feuille, faute de colonne'],
    },
    {
      name: 'un passage pas encore lu ne le dit plus',
      edits: [
        {
          file: PASSAGES,
          from: "                {!completed.viewedByCoach && ' · à lire'}",
          to: "                {''}",
        },
      ],
      falls: ['→ un passage pas encore lu le dit'],
    },
    {
      name: '« Tous les ressentis » mène à la liste des clients',
      edits: [
        {
          file: PAGE,
          from: '            onJournal={() => navigate(COACH_ROUTES.clientJournal(clientId!))}',
          to: '            onJournal={() => navigate(COACH_ROUTES.clients)}',
        },
      ],
      falls: ['→ et mène à tous les ressentis du client'],
    },
    {
      name: 'sur téléphone, le pouls garde toute sa carte',
      edits: [
        {
          file: PAGE,
          from: '                      compact={!!isPhone}',
          to: '                      compact={false}',
        },
      ],
      falls: ['le pouls tient en une phrase et cinq points'],
    },
  ],
};
