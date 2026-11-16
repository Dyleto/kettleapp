/** Les sabotages de `verify_week.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_week.mjs',
  cases: [
    {
      name: "l'envoi revient à l'accueil comme avant",
      note: "Cascade attendue : sans l'écran, rien de ce qu'il dit ne se lit. Restent vertes « pas de suite à annoncer », qui constate une absence, et le retour à l'accueil, où l'envoi saboté mène déjà.",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "                  setFlow('week');",
          to: '                  navigate(CLIENT_ROUTES.today);',
        },
      ],
      falls: [
        'l’envoi mène à « Ta semaine »',
        'l’anneau compte la séance qu’on vient de faire',
        '→ et les mots disent ce qu’il reste',
        'le jour d’aujourd’hui est coché, les jours conseillés marqués',
        'trois séances sur trois : « Semaine pleine. »',
        '→ et la suite compte cette semaine avec les trois d’avant',
      ],
    },
    {
      name: 'la séance envoyée ne compte pas dans la semaine',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '      after: doneInWeek(withThis),',
          to: '      after: doneInWeek(history),',
        },
      ],
      falls: [
        'l’anneau compte la séance qu’on vient de faire',
        '→ et les mots disent ce qu’il reste',
        'trois séances sur trois : « Semaine pleine. »',
      ],
    },
    {
      name: "le jour de la séance n'est pas coché",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '      doneDays: daysDone(withThis),',
          to: '      doneDays: daysDone(history),',
        },
      ],
      falls: ['le jour d’aujourd’hui est coché, les jours conseillés marqués'],
    },
    {
      name: "la suite ignore la semaine qu'on vient de remplir",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '      streak: weekStreak(withThis, target),',
          to: '      streak: weekStreak(history, target),',
        },
      ],
      falls: ['→ et la suite compte cette semaine avec les trois d’avant'],
    },
    {
      name: "la suite s'annonce dès zéro",
      edits: [
        {
          file: 'src/features/client/end/Week.tsx',
          from: '        {streak >= 2 && (',
          to: '        {streak >= 0 && (',
        },
      ],
      falls: ['pas de suite de semaines à annoncer'],
    },
    {
      name: "une semaine pleine n'est dite qu'au-delà",
      edits: [
        {
          file: 'src/features/client/end/Week.tsx',
          from: '  const full = target > 0 && after >= target;',
          to: '  const full = target > 0 && after > target;',
        },
      ],
      falls: ['trois séances sur trois : « Semaine pleine. »'],
    },
    {
      name: '« Terminer » ne mène nulle part',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '        <Week {...week} onFinish={() => navigate(CLIENT_ROUTES.today)} />',
          to: '        <Week {...week} onFinish={() => {}} />',
        },
      ],
      falls: ['« Terminer » revient à l’accueil'],
    },
  ],
};
