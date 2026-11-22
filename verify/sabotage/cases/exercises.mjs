/** Les sabotages de `verify_exercises.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/exercise/pages/Exercises.tsx';
const ROW = 'src/features/exercise/components/LibraryRow.tsx';
const LIBRARY = 'src/domain/exercise/library.ts';

const TITLE = 'l’écran porte le nom de son onglet, et compte ses exercices';
const NAME_ORDER = 'par nom d’abord';
const THUMB = 'une vignette dit quels mouvements ont une vidéo';
const USAGE =
  'chaque ligne dit son usage : séances, une séance, jamais utilisé';
const DESCRIPTION = '→ et sa consigne, quand elle en a une';
const FIRST = 'sans choix, le panneau montre le premier de la liste';
const OPENS = 'toucher une ligne ouvre sa fiche dans le panneau, et la marque';
const USAGE_ORDER = '« Les plus utilisés » range par usage';
const SEARCH = 'chercher garde chaque mot, sans accent ni casse';
const EXISTS = 'un nom qui existe déjà, à l’accent près, ne se propose pas';
const OFFER = 'un nom neuf : « Créer », et la phrase qui dit pourquoi';
const ENTER = 'Entrée le crée, ouvre sa fiche et vide le champ';
const PHONE_NONE = 'sans choix, aucune fiche ne s’ouvre';
const PHONE_SHEET = 'toucher une ligne monte sa fiche dans une feuille';
const PHONE_BACK = '→ et le retour du téléphone la referme';
const EMPTY = 'une bibliothèque vide dit comment la remplir';
const SHEET = 'src/features/exercise/components/ExerciseSheet.tsx';
const MUTATIONS = 'src/features/exercise/hooks/useExerciseMutations.ts';
const REACH =
  'un exercice utilisé dit sa portée, et pourquoi il ne se supprime pas';
const LINKS =
  'un lien YouTube se joue dans la fiche, un autre s’ouvre ailleurs';
const EMPTY_NAME = 'un nom vidé reprend l’ancien, sans rien envoyer';
const BAD_LINK = 'un lien illisible est refusé, et la fiche dit pourquoi';
const SILENT = 'une consigne s’enregistre seule, sans message';
const DELETES =
  'un exercice jamais utilisé se supprime d’une touche, et la bannière offre « Annuler »';
const UNDO =
  '→ « Annuler » le remet, consigne et vidéo comprises, et rouvre sa fiche';
const REFUSED = 'une suppression refusée le dit, et l’exercice reste';

export default {
  suite: 'verify_exercises.mjs',
  cases: [
    {
      // Le compte du titre, et celui qui suit une création.
      name: 'le compte ne s’accorde plus',
      edits: [
        {
          file: LIBRARY,
          from: "  `${count} exercice${count > 1 ? 's' : ''}`;",
          to: '  `${count} exercice`;',
        },
      ],
      falls: [TITLE, ENTER],
    },
    {
      // L'ordre de l'API : le premier de la liste change, et le panneau
      // avec lui.
      name: 'la liste ne se range plus par nom',
      edits: [
        {
          file: LIBRARY,
          from: '      ? (b.usageCount ?? 0) - (a.usageCount ?? 0) || byName(a, b)\n      : byName(a, b)',
          to: '      ? (b.usageCount ?? 0) - (a.usageCount ?? 0) || byName(a, b)\n      : 0',
        },
      ],
      falls: [NAME_ORDER, FIRST],
    },
    {
      name: '« Les plus utilisés » met les moins utilisés en tête',
      edits: [
        {
          file: LIBRARY,
          from: '      ? (b.usageCount ?? 0) - (a.usageCount ?? 0) || byName(a, b)',
          to: '      ? (a.usageCount ?? 0) - (b.usageCount ?? 0) || byName(a, b)',
        },
      ],
      falls: [USAGE_ORDER],
    },
    {
      name: 'aucune vignette ne dit la vidéo',
      edits: [
        {
          file: ROW,
          from: '  const hasVideo = !!exercise.videoUrl?.trim();',
          to: '  const hasVideo = false;',
        },
      ],
      falls: [THUMB],
    },
    {
      name: 'la ligne dit un nombre nu',
      edits: [
        {
          file: ROW,
          from: '        {usage}\n',
          to: '        {exercise.usageCount}\n',
        },
      ],
      falls: [USAGE],
    },
    {
      name: 'la consigne passe aux lignes qui n’en ont pas',
      edits: [
        {
          file: ROW,
          from: '        {description && (',
          to: '        {!description && (',
        },
      ],
      falls: [DESCRIPTION],
    },
    {
      name: 'le panneau attend un choix',
      edits: [
        {
          file: PAGE,
          from: '  const inPanel = withPanel ? (chosen ?? shown[0] ?? null) : null;',
          to: '  const inPanel = withPanel ? chosen : null;',
        },
      ],
      falls: [FIRST],
    },
    {
      name: 'la ligne ouverte ne se marque plus',
      edits: [
        {
          file: ROW,
          from: "      aria-current={selected ? 'true' : undefined}",
          to: '      aria-current={undefined}',
        },
      ],
      falls: [FIRST, OPENS],
    },
    {
      // Une adresse sans fiche ouvre la première de l'API : sur téléphone,
      // une feuille monte d'elle-même et ne se referme plus.
      name: 'une fiche s’ouvre sans qu’on l’ait choisie',
      edits: [
        {
          file: PAGE,
          from: '  const chosen = exercises.find((e) => e._id === exerciseId) ?? null;',
          to: '  const chosen = exercises.find((e) => e._id === exerciseId) ?? exercises[0] ?? null;',
        },
      ],
      falls: [FIRST, PHONE_NONE, PHONE_BACK],
    },
    {
      name: 'le champ ne filtre plus',
      edits: [
        {
          file: PAGE,
          from: '.filter((exercise) =>\n    matchesName(exercise, query)\n  );',
          to: '.filter(() => query === query);',
        },
      ],
      falls: [SEARCH, EXISTS, OFFER],
    },
    {
      name: 'un nom qui existe se propose encore',
      edits: [
        {
          file: LIBRARY,
          from: '  return exercises.some((exercise) => normalize(exercise.name) === key)\n    ? null\n    : name;',
          to: '  void key;\n  return name;',
        },
      ],
      falls: [EXISTS],
    },
    {
      name: '« Créer » ne dit plus pourquoi',
      edits: [
        {
          file: PAGE,
          from: '                  Aucun exercice ne porte ce nom.\n',
          to: '',
        },
      ],
      falls: [OFFER],
    },
    {
      name: 'Entrée ne crée rien',
      edits: [{ file: PAGE, from: '              onEnter={create}\n', to: '' }],
      falls: [ENTER],
    },
    {
      name: 'le champ garde le nom créé',
      edits: [{ file: PAGE, from: "          setQuery('');\n", to: '' }],
      falls: [ENTER],
    },
    {
      name: 'sur téléphone, la fiche ne monte plus',
      edits: [
        {
          file: PAGE,
          from: '      {!withPanel && chosen && (',
          to: '      {false && chosen && (',
        },
      ],
      falls: [PHONE_SHEET],
    },
    {
      name: 'une bibliothèque vide ne dit rien',
      edits: [
        {
          file: PAGE,
          from: '              title="Ta bibliothèque est vide"',
          to: '              title=""',
        },
      ],
      falls: [EMPTY],
    },
    {
      name: 'la fiche ne dit plus pourquoi elle ne supprime pas',
      edits: [
        {
          file: SHEET,
          from: '                Retire-le de ces séances avant de le supprimer.\n',
          to: '',
        },
      ],
      falls: [REACH],
    },
    {
      name: 'un exercice utilisé s’offre à la suppression',
      edits: [{ file: SHEET, from: '              disabled={used}\n', to: '' }],
      falls: [REACH],
    },
    {
      // Le lien passe par le lecteur YouTube, qui ne sait pas l'ouvrir.
      name: 'une autre adresse se prend pour YouTube',
      edits: [
        {
          file: 'src/shared/components/VideoPlayer.tsx',
          from: "  if (link.kind === 'link') {",
          to: "  if (link.kind === 'aucun') {",
        },
      ],
      falls: [LINKS],
    },
    {
      name: 'seul YouTube se lit encore',
      edits: [
        {
          file: 'src/domain/exercise/video.ts',
          from: "  return WEB_ADDRESS.test(value) ? { kind: 'link', url: value } : null;",
          to: '  return null;',
        },
      ],
      falls: [LINKS],
    },
    {
      name: 'un nom vidé part au serveur',
      edits: [
        {
          file: SHEET,
          from: "    if (required && next === '') return cancel();\n",
          to: '',
        },
      ],
      falls: [EMPTY_NAME],
    },
    {
      // Le lien illisible est enregistré : « Annuler » le remet ensuite,
      // à la place de la vidéo.
      name: 'un lien illisible s’enregistre',
      edits: [
        { file: SHEET, from: '          validate={videoLinkError}\n', to: '' },
      ],
      falls: [BAD_LINK, UNDO],
    },
    {
      name: '« Exercice modifié » revient à chaque champ',
      edits: [
        {
          file: MUTATIONS,
          from: '        queryKey: queryKeys.coach.exercises.detail(variables.id),\n      });\n    },',
          to: "        queryKey: queryKeys.coach.exercises.detail(variables.id),\n      });\n      toaster.create({ title: 'Exercice modifié', type: 'success' });\n    },",
        },
      ],
      falls: [SILENT],
    },
    {
      name: 'la suppression ne propose pas « Annuler »',
      edits: [
        {
          file: PAGE,
          from: '        undoable({\n',
          to: '        void ({\n',
        },
      ],
      falls: [DELETES, UNDO],
    },
    {
      name: 'la fiche supprimée reste dans l’adresse',
      edits: [
        {
          file: PAGE,
          from: '        if (exerciseId === exercise._id) closeSheet();\n',
          to: '',
        },
      ],
      falls: [DELETES],
    },
    {
      name: '« Annuler » remet un exercice nu',
      edits: [
        {
          file: PAGE,
          from: '                description: exercise.description,\n                videoUrl: exercise.videoUrl,\n',
          to: '',
        },
      ],
      falls: [UNDO],
    },
    {
      name: '« Annuler » ne rouvre pas la fiche',
      edits: [
        {
          file: PAGE,
          from: '              { onSuccess: (restored) => openSheet(restored._id) }',
          to: '              {}',
        },
      ],
      falls: [UNDO],
    },
    {
      name: 'une suppression refusée ne dit pas ce qui reste',
      edits: [
        {
          file: MUTATIONS,
          from: "        description: 'Il est toujours dans ta bibliothèque. Réessaie.',",
          to: "        description: 'Réessaie.',",
        },
      ],
      falls: [REFUSED],
    },
  ],
};
