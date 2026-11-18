/** Les sabotages de `verify_workshop.mjs`. Voir `../run.mjs`. */
const SETTINGS = 'src/features/workshop/components/BlockSettings.tsx';

export default {
  suite: 'verify_workshop.mjs',
  cases: [
    {
      name: "l'échelle n'a pas de limite à régler",
      edits: [
        {
          file: SETTINGS,
          from: '        limitSetting(block, onUpdate),\n        {',
          to: '        {',
        },
      ],
      falls: [
        "l'en-tête de l'échelle propose une limite, vide d'abord",
        '→ douze minutes, enregistrées sur le bloc',
      ],
    },
    {
      name: "la limite saisie n'est pas enregistrée",
      edits: [
        {
          file: SETTINGS,
          from: '      onChange={(v) => onUpdate({ durationMinutes: v })}\n      ariaLabel="Limite de temps en minutes"',
          to: '      onChange={() => undefined}\n      ariaLabel="Limite de temps en minutes"',
        },
      ],
      falls: ['→ douze minutes, enregistrées sur le bloc'],
    },
  ],
};
