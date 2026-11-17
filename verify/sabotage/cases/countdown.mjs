/** Les sabotages de `verify_countdown.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_countdown.mjs',
  cases: [
    {
      name: 'le repos attend une touche pour partir',
      edits: [
        {
          file: 'src/features/client/guided/scene/RestHero.tsx',
          from: '  const { remaining, extend } = useCountdown(duration, {\n    frozen,',
          to: '  const { remaining, extend } = useCountdown(duration, {\n    autoStart: false,\n    frozen,',
        },
      ],
      falls: ['→ et il tourne sans qu’on le lance'],
    },
    {
      name: "le décompte de l'ouverture ne lance pas le premier bloc",
      edits: [
        {
          file: 'src/features/client/guided/session.ts',
          from: "  if (step.type === 'round') return step.block.order;",
          to: "  if (step.type === 'round') return null;",
        },
      ],
      falls: [
        "→ le décompte de l'ouverture l'a lancé",
        'le dernier tour tombé, on atteint le bloc suivant',
      ],
    },
    {
      name: "l'horloge part au montage, sans attendre « Lancer »",
      edits: [
        {
          file: 'src/features/client/guided/useBlockClock.ts',
          from: '  const [running, setRunning] = useState(armed);',
          to: '  const [running, setRunning] = useState(true);',
        },
      ],
      falls: [
        '→ et propose de la lancer',
        '→ ce que son étiquette dit aussi',
        "trois secondes d'attente ne mordent pas sur le tour",
        '→ son horloge attend à son tour',
      ],
    },
  ],
};
