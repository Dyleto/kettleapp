/** Les sabotages de `verify_update.mjs`. Voir `../run.mjs`. */
const BANNER = 'src/shared/components/AppUpdateBanner.tsx';
const HOOK = 'src/shared/hooks/useAppUpdate.ts';
const POLICY = 'src/shared/updatePolicy.ts';
const GUIDED = 'src/features/client/guided/GuidedSession.tsx';
const AUTOSAVE = 'src/features/workshop/hooks/useProgramAutoSave.ts';

const WAITING =
  'une frappe attend : le bandeau le dit, et la page ne se recharge pas';
const NOW = '→ « Maintenant » enregistre la frappe, puis recharge';
const SESSION =
  'une séance en cours n’est ni rechargée ni interrompue par un bandeau';
const SESSION_END = '→ la séance fermée, la version s’installe';

export default {
  suite: 'verify_update.mjs',
  cases: [
    {
      name: '« Maintenant » ne fait rien',
      edits: [
        {
          file: BANNER,
          from: '            <ActionButton size="sm" onClick={installNow}>',
          to: '            <ActionButton size="sm" onClick={() => {}}>',
        },
      ],
      falls: [NOW],
    },
    {
      // Le défaut réparé : le bandeau n'apprenait pas qu'un enregistrement
      // venait d'aboutir.
      name: 'le bandeau n’écoute plus le registre',
      edits: [{ file: HOOK, from: '  useUnsavedWorkChanges();\n', to: '' }],
      falls: [NOW, SESSION_END],
    },
    {
      // L'autre défaut réparé : une version rechargeait la page en pleine
      // séance.
      name: 'une séance en cours ne se déclare plus',
      edits: [
        {
          file: GUIDED,
          from: "  useClaimUnsavedWork(state.phase !== 'opening' && state.phase !== 'empty', {",
          to: '  useClaimUnsavedWork(false, {',
        },
      ],
      falls: [SESSION],
    },
    {
      name: 'la politique ignore la séance en cours',
      edits: [{ file: POLICY, from: "  if (busy) return 'wait';\n", to: '' }],
      falls: [SESSION],
    },
    {
      name: 'la politique recharge par-dessus une frappe',
      edits: [{ file: POLICY, from: "  if (unsaved) return 'ask';\n", to: '' }],
      // Rechargée avant l'envoi, la frappe ne part jamais.
      falls: [WAITING, NOW],
    },
    {
      name: 'l’atelier ne donne pas de quoi envoyer tout de suite',
      edits: [
        {
          file: AUTOSAVE,
          from: '  useClaimUnsavedWork(atRisk, { flush });',
          to: '  useClaimUnsavedWork(atRisk);',
        },
      ],
      falls: [NOW],
    },
  ],
};
