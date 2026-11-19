/** Les sabotages de `verify_import.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/coach/pages/ClientDetails.tsx';
const DIALOG = 'src/features/coach/components/ImportTemplateDialog.tsx';
const SAVE = 'src/features/workshop/hooks/useProgramAutoSave.ts';

const LISTS =
  '« Importer un modèle… » au pied du rail ouvre la liste des modèles, et dit ce qu’elle fera';
const ASKS =
  'un programme qui a des séances demande avant de les remplacer : ce qui part, ce qui vient, ce qui reste';
const CANCELS = '→ « Annuler » revient au choix, sans rien toucher';
const REPLACES =
  '→ « Remplacer le programme » remplace, ouvre la séance 1 et l’annonce';
const STAYS = '→ et rien de l’ancien programme ne repart derrière lui';
const WAITS =
  'pendant un enregistrement, l’import attend, et dit que rien n’a bougé';
const PENDING = 'une frappe pas encore partie ne repasse pas derrière l’import';
const EMPTY =
  'un programme vide part d’un modèle sans question : il n’a rien à perdre';

export default {
  suite: 'verify_import.mjs',
  cases: [
    {
      // La seule porte d'un programme qui a déjà des séances.
      name: 'le rail n’offre plus d’importer un modèle',
      edits: [
        {
          file: PAGE,
          from: '            onImport={() => setImportOpen(true)}\n',
          to: '',
        },
      ],
      falls: [LISTS, ASKS, CANCELS, REPLACES, STAYS, WAITS, PENDING],
    },
    {
      // Sans la question, l'import a lieu au premier choix : « Annuler »,
      // le second choix et « Remplacer » ne trouvent plus de fenêtre, et
      // l'annonce a disparu quand on la lit.
      name: 'l’import remplace sans demander',
      edits: [
        {
          file: DIALOG,
          from: '    if (currentCount === 0) void run(template);\n    else setChosen(template);',
          to: '    void run(template);',
        },
      ],
      falls: [ASKS, CANCELS, REPLACES],
    },
    {
      name: 'la question ne dit plus ce qui reste',
      edits: [
        {
          file: DIALOG,
          from: '<chakra.b>historique</chakra.b>',
          to: '<chakra.b>programme</chakra.b>',
        },
      ],
      falls: [ASKS],
    },
    {
      // L'éditeur garde l'ancien programme, que la frappe en attente
      // renverra : le défaut que `replaceWith` répare.
      name: 'l’éditeur n’adopte pas le programme importé',
      edits: [
        {
          file: SAVE,
          from: '        adopt(sessions, JSON.stringify(sessions));\n        initialize({ sessions });',
          to: '        void sessions;',
        },
      ],
      falls: [PENDING],
    },
    {
      name: 'l’import passe pendant un enregistrement',
      edits: [
        {
          file: SAVE,
          from: "      if (inFlight.current !== null)\n        throw new Error('Un enregistrement est en cours');\n",
          to: '',
        },
      ],
      falls: [WAITS],
    },
    {
      name: 'un import refusé ne dit pas ce qui est sauf',
      edits: [
        {
          file: PAGE,
          from: '                  description: `Le programme de ${who} n’a pas bougé. Réessaie dans un instant.`,',
          to: '                  description: `Réessaie dans un instant.`,',
        },
      ],
      falls: [WAITS],
    },
    {
      name: 'après l’import, l’adresse reste sur une séance qui n’existe plus',
      edits: [{ file: PAGE, from: '              goToSession(1);\n', to: '' }],
      falls: [REPLACES],
    },
    {
      name: 'l’import ne s’annonce pas',
      edits: [
        {
          file: PAGE,
          from: '                title: `« ${template.name} » importé chez ${who}`,',
          to: '                title: `Programme importé`,',
        },
      ],
      falls: [REPLACES],
    },
    {
      name: 'un programme vide n’offre plus de partir d’un modèle',
      edits: [
        {
          file: PAGE,
          from: '                      Partir d’un modèle',
          to: '                      Modèles',
        },
      ],
      falls: [EMPTY],
    },
  ],
};
