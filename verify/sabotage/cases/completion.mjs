/** Les sabotages de `verify_completion.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_completion.mjs',
  cases: [
    {
      name: 'un envoi manqué ne se dit pas',
      stale: 'le motif correspond 0 fois dans SessionScreen.tsx',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '              () => setSendFailed(true)',
          to: '              () => {}',
        },
      ],
      falls: [
        "l'écran reste, et dit que l'envoi n'est pas parti",
        '→ et ce qui est sauf : rien n’est perdu',
        '→ le bouton redevient actif : « Réessayer »',
      ],
    },
    {
      name: "un visage est choisi d'avance",
      edits: [
        {
          file: 'src/features/client/end/Feeling.tsx',
          from: '  const [effort, setEffort] = useState<number | undefined>(undefined);',
          to: '  const [effort, setEffort] = useState<number | undefined>(3);',
        },
      ],
      falls: ['→ et attend un visage : rien n’est choisi d’avance'],
    },
    {
      name: "le bouton ne dit pas qu'on réessaie",
      edits: [
        {
          file: 'src/features/client/end/Feeling.tsx',
          from: "          {failed ? 'Réessayer' : `Envoyer à ${coach.inline}`}",
          to: '          {failed ? `Envoyer à ${coach.inline}` : `Envoyer à ${coach.inline}`}',
        },
      ],
      falls: ['→ le bouton redevient actif : « Réessayer »'],
    },
    {
      name: 'la croix ne referme rien',
      edits: [
        {
          file: 'src/features/client/end/Feeling.tsx',
          from: '          onClick={onClose}',
          to: '          onClick={() => {}}',
        },
      ],
      falls: ['la croix referme le ressenti sans rien envoyer'],
    },
    {
      name: "le ressenti ne prend pas tout l'écran",
      edits: [
        {
          file: 'src/features/client/end/Feeling.tsx',
          from: '      position="fixed"\n      inset={0}\n      zIndex={50}',
          to: '      position="fixed"\n      inset="0 0 auto 0"\n      h="90%"\n      zIndex={50}',
        },
      ],
      falls: ['le ressenti prend tout l’écran'],
    },
  ],
};
