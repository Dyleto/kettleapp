/** Les sabotages de `verify_messages.mjs`. Voir `../run.mjs`. */
const TOASTER = 'src/shared/components/ui/toasterInstance.ts';
const UNDO = 'src/shared/components/undoable.ts';
const SAVE = 'src/features/workshop/hooks/useProgramMutations.ts';

const SILENT = 'un enregistrement automatique ne s’annonce par aucun message';
const ONE =
  'deux suppressions de suite : une seule bannière, celle de la dernière';
const AFTER =
  '→ « Annuler » reprend la dernière ; la première, chassée, reste faite';
const BANNER = 'la bannière « Annuler » reste huit secondes, pas davantage';
const PLAIN = 'un message ordinaire reste trois secondes';

export default {
  suite: 'verify_messages.mjs',
  cases: [
    {
      name: 'les messages s’empilent',
      edits: [
        { file: TOASTER, from: '  if (!updating) toaster.remove();', to: '' },
      ],
      falls: [ONE],
    },
    {
      name: 'un message ordinaire reste cinq secondes',
      edits: [
        {
          file: TOASTER,
          from: 'export const MESSAGE_DURATION = 3000;',
          to: 'export const MESSAGE_DURATION = 5000;',
        },
      ],
      falls: [PLAIN],
    },
    {
      name: 'la bannière « Annuler » ne reste que trois secondes',
      edits: [
        { file: UNDO, from: '    duration: 8000,', to: '    duration: 3000,' },
      ],
      falls: [BANNER],
    },
    {
      name: 'l’enregistrement automatique s’annonce',
      edits: [
        {
          file: SAVE,
          from: "import api from '@/shared/config/api';",
          to: "import api from '@/shared/config/api';\nimport { toaster } from '@/shared/components/ui/toasterInstance';",
        },
        {
          file: SAVE,
          from: '    onSuccess: (saved) => {',
          to: "    onSuccess: (saved) => {\n      toaster.create({ title: 'Programme sauvegardé', type: 'success' });",
        },
      ],
      // Le message chasse aussi la bannière « Annuler » : il tombe entre
      // deux suppressions, et pendant qu'elle compte ses huit secondes.
      falls: [SILENT, ONE, AFTER, BANNER],
    },
  ],
};
