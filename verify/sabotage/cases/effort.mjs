/** Les sabotages de `verify_effort.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_effort.mjs',
  cases: [
    {
      name: "l'échelle s'affiche à l'envers",
      edits: [
        {
          file: 'src/features/client/end/EffortScale.tsx',
          from: '{EFFORT_LEVELS.map((level, i) => {',
          to: '{[...EFFORT_LEVELS].reverse().map((level, i) => {',
        },
      ],
      falls: [
        'les crans vont de « Trop facile » à « Trop dure »',
        'le visage de gauche se nomme « Trop facile »',
        'le visage de droite se nomme « Trop dure »',
        'il envoie 5, la valeur enregistrée pour « Trop dure »',
        "l'accueil relit « Trop dure » sur la séance qu'on vient d'envoyer",
      ],
    },
    {
      name: 'les numéros reviennent',
      edits: [
        {
          file: 'src/features/client/end/EffortScale.tsx',
          from: '                {FACES[level.value]}\n              </svg>',
          to: '                {FACES[level.value]}\n              </svg>\n              {i + 1}',
        },
      ],
      falls: ['aucun numéro ne les accompagne'],
    },
    {
      name: "« Juste » est coché d'avance",
      edits: [
        {
          file: 'src/features/client/end/EffortScale.tsx',
          from: 'const isSelected = level.value === value;',
          to: 'const isSelected = level.value === (value ?? 3);',
        },
      ],
      falls: ["rien n'est choisi d'avance"],
    },
    {
      name: 'la valeur envoyée est inversée',
      edits: [
        {
          file: 'src/features/client/end/EffortScale.tsx',
          from: 'onClick={() => onChange(level.value)}',
          to: 'onClick={() => onChange(6 - level.value)}',
        },
      ],
      falls: [
        'le visage de gauche se nomme « Trop facile »',
        'le visage de droite se nomme « Trop dure »',
        'il envoie 5, la valeur enregistrée pour « Trop dure »',
        "l'accueil relit « Trop dure » sur la séance qu'on vient d'envoyer",
      ],
    },
    {
      name: 'la ligne de sens disparaît',
      edits: [
        {
          file: 'src/features/client/end/EffortScale.tsx',
          from: 'Du plus facile au plus dur, comme {coach.inline} le lit.',
          to: 'Choisis.',
        },
      ],
      falls: ['→ une ligne dit dans quel sens lire'],
    },
    {
      name: 'le cran choisi ne se nomme plus',
      edits: [
        {
          file: 'src/features/client/end/EffortScale.tsx',
          from: '              {selected.label}\n',
          to: '',
        },
      ],
      falls: [
        'le visage de gauche se nomme « Trop facile »',
        'le visage de droite se nomme « Trop dure »',
      ],
    },
    {
      name: 'la flèche droite recule',
      edits: [
        {
          file: 'src/features/client/end/EffortScale.tsx',
          from: 'move(i, 1);',
          to: 'move(i, -1);',
        },
      ],
      falls: ['la flèche droite mène au cran plus dur'],
    },
    {
      name: "l'envoi n'attend plus de choix",
      edits: [
        {
          file: 'src/features/client/end/Feeling.tsx',
          from: '          disabled={effort === undefined}',
          to: '          disabled={false}',
        },
      ],
      falls: ["→ et l'envoi attend un choix"],
    },
  ],
};
