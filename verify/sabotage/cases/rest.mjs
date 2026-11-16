/** Les sabotages de `verify_rest.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_rest.mjs',
  cases: [
    {
      name: "« + 15 s » n'ajoute rien",
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: 'setRest({ ...rest, bonus: rest.bonus + 15 })',
          to: 'setRest({ ...rest, bonus: rest.bonus + 0 })',
        },
      ],
      falls: ['« + 15 s » rallonge le repos de quinze secondes'],
    },
    {
      name: "la carte n'applique pas le rallongement",
      edits: [
        {
          file: 'src/features/client/components/scene/RestHero.tsx',
          from: '    if (more > 0) extend(more);\n',
          to: '',
        },
      ],
      falls: ['« + 15 s » rallonge le repos de quinze secondes'],
    },
    {
      name: 'la charge suivante ne se règle plus pendant le repos',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '                  {current && showLoad && (',
          to: '                  {current && false && (',
        },
      ],
      falls: [
        'la charge de la série suivante se règle pendant le repos',
        '→ la série suivante revient en grand, avec la charge réglée',
      ],
    },
    {
      name: 'le repos ne finit plus de lui-même',
      edits: [
        {
          file: 'src/features/client/components/scene/RestHero.tsx',
          from: "      playCue('go');\n      onDone();",
          to: "      playCue('go');",
        },
      ],
      falls: [
        'à zéro, la carte de repos s’efface d’elle-même',
        '→ et la série suivante est là',
      ],
    },
    {
      name: 'ce qui vient perd sa charge',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '                          currentLoad !== undefined\n',
          to: '                          false\n',
        },
      ],
      falls: ['→ et ce qui vient, avec sa charge'],
    },
    {
      name: 'le pied de série reste pendant le repos',
      stale: 'le motif correspond 0 fois dans GuidedSession.tsx',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: "          {step.type === 'block' && step.shape === 'list' && rest ? (",
          to: "          {step.type === 'block' && step.shape === 'list' && rest && false ? (",
        },
      ],
      falls: [
        'pendant le repos, aucun bouton ne coche la série suivante',
        '« + 15 s » rallonge le repos de quinze secondes',
        '« Passer » termine le repos',
        '→ la série suivante revient en grand, avec la charge réglée',
      ],
    },
    {
      name: "la carte repousse la liste hors de l'écran",
      edits: [
        {
          file: 'src/features/client/components/scene/RestHero.tsx',
          from: '      borderRadius="card"\n      p={4}',
          to: '      borderRadius="card"\n      p={4}\n      minH="900px"',
        },
      ],
      falls: ['la série suivante reste lisible dans la liste, sous le repos'],
    },
    {
      name: "un repos est inventé là où rien n'est prescrit",
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '    if (current.restAfter) {\n      setRest({ afterKey: current.key, duration: current.restAfter, bonus: 0 });',
          to: '    if (true) {\n      setRest({ afterKey: current.key, duration: current.restAfter ?? 30, bonus: 0 });',
        },
      ],
      falls: ["un bloc sans repos prescrit n'affiche aucune carte de repos"],
    },
  ],
};
