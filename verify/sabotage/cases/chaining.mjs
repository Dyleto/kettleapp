/** Les sabotages de `verify_chaining.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_chaining.mjs',
  cases: [
    {
      name: '« Palier fait » ne coche rien',
      edits: [
        {
          file: 'src/features/client/components/scene/LadderBlock.tsx',
          from: '    const keys = rungSets(sets, rung).map((set) => set.key);',
          to: '    const keys: string[] = [];',
        },
      ],
      falls: [
        'les sept paliers sont cochés',
        "→ et c'est « Terminer » qui attend, pas un bilan déjà ouvert",
      ],
    },
  ],
};
