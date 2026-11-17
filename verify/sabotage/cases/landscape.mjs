/** Les sabotages de `verify_landscape.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_landscape.mjs',
  cases: [
    {
      name: "l'ouverture rogne au lieu de défiler",
      edits: [
        {
          file: 'src/features/client/guided/scene/Opening.tsx',
          from: '        overflowY="auto"',
          to: '        overflowY="hidden"',
        },
      ],
      falls: [
        "l'écran d'ouverture ne coupe rien sans recours (sans la note du coach)",
        "l'écran d'ouverture ne coupe rien sans recours (avec la note du coach)",
      ],
    },
    {
      name: 'une feuille rogne au lieu de défiler',
      edits: [
        {
          file: 'src/kit/Sheet.tsx',
          from: '      overflowY="auto"',
          to: '      overflowY="hidden"',
        },
      ],
      falls: ['la pause ne coupe rien sans recours'],
    },
    {
      name: '« Bloc suivant » sur une seule colonne, à plat',
      edits: [
        {
          file: 'src/features/client/guided/scene/NextBlock.tsx',
          from: "            display: 'grid',",
          to: "            display: 'flex',",
        },
      ],
      falls: ["« Bloc suivant » tient dans l'écran, sans défiler"],
    },
  ],
};
