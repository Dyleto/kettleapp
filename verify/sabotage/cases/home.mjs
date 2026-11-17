/** Les sabotages de `verify_home.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_home.mjs',
  cases: [
    {
      name: "la première fois n'est pas reconnue",
      edits: [
        {
          file: 'src/features/client/home/focus.ts',
          from: "  if (history.length === 0) return { kind: 'first', session: nextSession };\n",
          to: '',
        },
      ],
      falls: ['« Ta première séance », et comment ça marche'],
    },
    {
      name: 'la semaine pleine ne passe pas devant',
      edits: [
        {
          file: 'src/features/client/home/focus.ts',
          from: "  if (target > 0 && doneInWeek(history, today) >= target)\n    return { kind: 'full' };\n",
          to: '',
        },
      ],
      falls: ['« Tout est fait », sans pousser la séance suivante'],
    },
    {
      name: 'un jour sans conseil pousse la suivante du cycle',
      note: "Cascade attendue : « La faire aujourd'hui » n'existe que sur la carte du repos, et sans elle il n'y a rien à toucher.",
      edits: [
        {
          file: 'src/features/client/home/focus.ts',
          from: '  const later = laterThisWeek(sessions, today);',
          to: '  const later = undefined as ReturnType<typeof laterThisWeek>;',
        },
      ],
      falls: [
        '« Aujourd’hui, repos », et la séance du jeudi',
        '« La faire aujourd’hui » ouvre la fiche, sans lancer la séance',
      ],
    },
    {
      name: "aujourd'hui ne compte jamais parmi les jours qui restent",
      edits: [
        {
          file: 'src/features/client/home/focus.ts',
          from: '    .filter((d) => d > now || (d === now && !doneToday))',
          to: '    .filter((d) => d > now)',
        },
      ],
      falls: ['la semaine : rien de fait, aujourd’hui et samedi restent'],
    },
    {
      name: "le jour d'aujourd'hui n'est pas entouré",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '      today: day.key === today,',
          to: '      today: false,',
        },
      ],
      falls: [
        '→ les bulles : lundi conseillé sans alerte, jeudi entouré',
        '→ lundi coché, mardi entouré',
      ],
    },
    {
      name: 'un anneau même sans jour conseillé',
      edits: [
        {
          file: 'src/features/client/home/WeekCard.tsx',
          from: '      {target > 0 && (',
          to: '      {target >= 0 && (',
        },
      ],
      falls: ['pas d’anneau, seulement le compte'],
    },
    {
      name: "la suite s'annonce dès zéro",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '      {streak >= 2 && (',
          to: '      {streak >= 0 && (',
        },
      ],
      falls: ['pas de suite de semaines à annoncer'],
    },
    {
      name: 'la pastille de la suite ne mène nulle part',
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '          onClick={() => navigate(CLIENT_ROUTES.history)}',
          to: '          onClick={() => {}}',
        },
      ],
      falls: ['→ un toucher ouvre Progrès'],
    },
    {
      name: '« Démarrer » mène à la fiche',
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: "      state: { guided: 'start', from: 'today' },",
          to: '      state: null,',
        },
      ],
      falls: [
        '« Démarrer » ouvre la séance guidée sur son ouverture',
        '→ puis repart de l’ouverture, rien de coché',
      ],
    },
    {
      name: "la demande de démarrer reste dans l'historique",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '      navigate(location.pathname, { replace: true, state: null });',
          to: '      void 0;',
        },
      ],
      falls: ['→ recharger la fiche ne relance pas la séance'],
    },
    {
      name: "la bulle d'un jour fait ne s'ouvre pas",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '            onOpen: () => openCompleted(done),',
          to: '            onOpen: () => {},',
        },
      ],
      falls: ['la bulle d’un jour fait ouvre la séance faite'],
    },
    {
      name: "« La faire aujourd'hui » lance la séance",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '      onOpen={() => openSheet(focus.session)}',
          to: '      onOpen={() => startGuided(focus.session)}',
        },
      ],
      falls: ['« La faire aujourd’hui » ouvre la fiche, sans lancer la séance'],
    },
    {
      name: "le coach qui n'a pas lu ne se dit pas",
      edits: [
        {
          file: 'src/features/client/home/LastSessionCard.tsx',
          from: "            {!completed.viewedByCoach &&\n              `${coach.opening} ne l'a pas encore lue.`}",
          to: '            {null}',
        },
      ],
      falls: ['la dernière séance, son mot, et le coach qui ne l’a pas lue'],
    },
    {
      name: 'le mot du coach ne monte pas sur la carte',
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '      note={session.notes?.trim() || undefined}',
          to: '      note={undefined}',
        },
      ],
      falls: ['→ avec le mot du coach'],
    },
    {
      name: 'le prénom ne salue pas',
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: "  const greeting = firstName ? `Salut ${firstName}` : 'Salut';",
          to: "  const greeting = 'Salut';",
        },
      ],
      falls: ['l’écran s’appelle « Aujourd’hui », et salue par le prénom'],
    },
    {
      name: 'la séance commencée ne se voit pas',
      note: "Cascade attendue : sans la carte, rien de ce qu'elle porte ne se lit ni ne se touche.",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '  const main = resumeCard ? (',
          to: '  const main = false ? (',
        },
      ],
      falls: [
        '« En cours » remplace la séance du jour : la séance 2',
        '→ le bloc et la série où l’on s’est arrêté, et depuis quand',
        '→ la barre : le Tabata fait, deux séries sur sept du renfo',
        '« Reprendre » rouvre la séance au même endroit, sans redemander',
        'modifiée par le coach depuis : seulement « Recommencer »',
        '« Recommencer depuis le début » demande d’abord',
        '→ puis repart de l’ouverture, rien de coché',
      ],
    },
    {
      name: '« Reprendre » repose la question',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "          resumeSaved={guidedEntry === 'resume'}",
          to: '          resumeSaved={false}',
        },
      ],
      falls: [
        '« Reprendre » rouvre la séance au même endroit, sans redemander',
      ],
    },
    {
      name: 'la séance modifiée se reprend quand même',
      edits: [
        {
          file: 'src/features/client/home/unfinished.ts',
          from: '    changed: new Date(session.updatedAt).getTime() > since,',
          to: '    changed: false,',
        },
      ],
      falls: ['modifiée par le coach depuis : seulement « Recommencer »'],
    },
    {
      name: "recommencer n'efface rien",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '    restartProgress(session._id);\n',
          to: '',
        },
      ],
      falls: ['→ puis repart de l’ouverture, rien de coché'],
    },
    {
      name: 'recommencer sans demander',
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '      onLink={() => setConfirmRestart(true)}',
          to: '      onLink={() => restartGuided(unfinished.session)}',
        },
      ],
      falls: ['« Recommencer depuis le début » demande d’abord'],
    },
    {
      name: 'depuis quand ne se dit pas',
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '        unfinished.startedAt !== undefined\n',
          to: '        unfinished.startedAt === -1\n',
        },
      ],
      falls: ['→ le bloc et la série où l’on s’est arrêté, et depuis quand'],
    },
    {
      name: 'les tours passés ne comptent pas',
      edits: [
        {
          file: 'src/features/client/home/unfinished.ts',
          from: '      if (index < at) count.done += 1;',
          to: '      if (index < 0) count.done += 1;',
        },
      ],
      falls: ['→ la barre : le Tabata fait, deux séries sur sept du renfo'],
    },
  ],
};
