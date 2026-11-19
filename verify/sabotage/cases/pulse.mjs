/** Les sabotages de `verify_pulse.mjs`. Voir `../run.mjs`. */
const PULSE = 'src/features/coach/components/SessionPulse.tsx';
const PASSAGES = 'src/features/coach/components/SessionPassages.tsx';
const PAGE = 'src/features/coach/pages/ClientDetails.tsx';
const ROW = 'src/features/workshop/components/ExerciseRow.tsx';
const TRACE = 'src/domain/history/exerciseTrace.ts';

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
    {
      name: 'la page ne passe plus les traces à l’atelier',
      edits: [
        {
          file: PAGE,
          from: '                  traces={exerciseTraces(activeSession, history)}\n',
          to: '',
        },
      ],
      falls: [
        'sous chaque exercice, les charges des derniers passages, qui montent',
        '→ une seule charge notée : la dernière fois',
        '→ le mot du client qui en parle, en corail quand il a fait mal',
        '→ ouverte, la ligne dit ce que les charges racontent',
      ],
    },
    {
      name: 'une charge qui monte n’a plus ses barres',
      edits: [
        {
          file: ROW,
          from: "    {trace.tone === 'up' && trace.loads.length > 1 ? (",
          to: '    {false ? (',
        },
      ],
      falls: [
        'sous chaque exercice, les charges des derniers passages, qui montent',
      ],
    },
    {
      name: 'le mot du client ne s’écrit plus sous l’exercice',
      edits: [
        { file: ROW, from: '      {trace.quote && (', to: '      {false && (' },
      ],
      falls: ['→ le mot du client qui en parle, en corail quand il a fait mal'],
    },
    {
      // Un mot dit dans la douleur se lit comme une charge qui monte.
      name: 'un mot dit dans la douleur n’inquiète plus',
      edits: [
        {
          file: TRACE,
          from: "    tone: worrying ? 'warn' : tone,",
          to: '    tone,',
        },
      ],
      falls: ['→ le mot du client qui en parle, en corail quand il a fait mal'],
    },
    {
      name: 'la ligne fermée raconte déjà les charges',
      edits: [
        {
          file: ROW,
          from: '      {lit && trace.insight && (',
          to: '      {trace.insight && (',
        },
      ],
      falls: ['→ ouverte, la ligne dit ce que les charges racontent'],
    },
    {
      // La place d'hier, et non le mouvement : le goblet lit les mountain
      // climbers de l'échauffement, les fentes lisent le swing.
      name: 'une ligne lit l’exercice qui était à sa place',
      edits: [
        {
          file: TRACE,
          from: '          entry: entriesOf(passage).filter((e) => idOf(e) === id)[occurrence],',
          to: '          entry: entriesOf(passage)[index],',
        },
      ],
      falls: [
        'sous chaque exercice, les charges des derniers passages, qui montent',
        '→ une seule charge notée : la dernière fois',
        '→ ouverte, la ligne dit ce que les charges racontent',
      ],
    },
  ],
};
