/** Les sabotages de `verify_offline.mjs`. Voir `../run.mjs`. */
const BANNER = 'src/shared/components/OfflineBanner.tsx';
const ONLINE = 'src/shared/hooks/useOnline.ts';
const STATUS = 'src/features/workshop/components/ProgramSaveStatus.tsx';
const AUTOSAVE = 'src/features/workshop/hooks/useProgramAutoSave.ts';
const COACH_LAYOUT = 'src/features/coach/pages/CoachLayout.tsx';

const CLIENT = 'sans réseau, « Hors connexion » et ce qui est sauf : la séance';
const GONE = '→ le bandeau part au retour du réseau';
const WAITING =
  'une modification sans réseau : « Non enregistré », sans « Réessayer » inutile';
const COACH = '→ le bandeau du coach dit que ce qu’il écrit reste là';
const RETRY =
  'un envoi qui a échoué avant la coupure repart seul au retour du réseau';

export default {
  suite: 'verify_offline.mjs',
  cases: [
    {
      name: 'le bandeau ne s’affiche jamais',
      edits: [
        {
          file: BANNER,
          from: '  if (online) return null;',
          to: '  return null;',
        },
      ],
      falls: [CLIENT, COACH],
    },
    {
      name: 'la perte du réseau n’est pas entendue',
      edits: [
        {
          file: ONLINE,
          from: "  window.addEventListener('offline', onChange);\n",
          to: '',
        },
      ],
      // La ligne de l'atelier tient : elle se redessine à chaque changement
      // de l'enregistrement, et relit le réseau à ce moment-là. Le bandeau,
      // que rien d'autre ne redessine, dépend de l'événement.
      falls: [CLIENT, COACH],
    },
    {
      name: 'le retour du réseau n’est pas entendu',
      edits: [
        {
          file: ONLINE,
          from: "  window.addEventListener('online', onChange);\n",
          to: '',
        },
      ],
      falls: [GONE],
    },
    {
      name: 'le coach lit la phrase du client',
      edits: [
        {
          file: COACH_LAYOUT,
          from: '          <OfflineBanner line="Ce que tu écris reste sur cet appareil, et s’enregistre au retour du réseau." />',
          to: '          <OfflineBanner line="Tu peux faire ta séance : elle s’enverra au retour du réseau." />',
        },
      ],
      falls: [COACH],
    },
    {
      name: 'sans réseau, la ligne dit « Enregistrement… » sans fin',
      edits: [
        {
          file: STATUS,
          from: "  if (!online && state !== 'idle') return 'offline';\n",
          to: '',
        },
      ],
      falls: [WAITING],
    },
    {
      // Le défaut réparé : un échec d'avant la coupure attendait un geste.
      name: 'le retour du réseau ne relance pas un envoi échoué',
      edits: [
        {
          file: AUTOSAVE,
          from: '    const retry = () => flush();',
          to: '    const retry = () => {};',
        },
      ],
      falls: [RETRY],
    },
  ],
};
