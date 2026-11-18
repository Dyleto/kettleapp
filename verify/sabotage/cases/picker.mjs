/** Les sabotages de `verify_picker.mjs`. Voir `../run.mjs`. */
const PICKER = 'src/features/workshop/components/InlineExercisePicker.tsx';
const CHOICES = 'src/domain/exercise/choices.ts';

export default {
  suite: 'verify_picker.mjs',
  cases: [
    {
      // La bibliothèque passe devant ce programme, comme avant E6b.
      name: 'à la frappe, la bibliothèque passe devant ce programme',
      edits: [
        {
          file: CHOICES,
          from: '      { label: IN_PROGRAM, exercises: matches(placed) },\n      { label: LIBRARY, exercises: matches(outside) },',
          to: '      { label: LIBRARY, exercises: matches(outside) },\n      { label: IN_PROGRAM, exercises: matches(placed) },',
        },
      ],
      falls: ['d’abord ce programme, puis la bibliothèque, puis « Créer »'],
    },
    {
      name: 'les lignes du sélecteur taisent leur usage',
      edits: [
        {
          file: PICKER,
          from: '                      {usageLine(option.exercise)}',
          to: "                      {''}",
        },
      ],
      falls: ['→ chaque mouvement dit son usage'],
    },
    {
      name: '« Créer » ne dit plus qu’il ouvre la fiche',
      edits: [
        {
          file: PICKER,
          from: '                Créer «&nbsp;{trimmed}&nbsp;» et ouvrir sa fiche',
          to: '                Créer «&nbsp;{trimmed}&nbsp;»',
        },
      ],
      falls: ['d’abord ce programme, puis la bibliothèque, puis « Créer »'],
    },
    {
      name: 'la vidéo ne se voit plus avant de choisir',
      edits: [
        {
          file: PICKER,
          from: '                    {option.exercise.videoUrl && (',
          to: '                    {false && (',
        },
      ],
      falls: ['→ une vidéo posée se voit avant de choisir'],
    },
    {
      // Le tiroir recouvre l'atelier même quand la colonne est là.
      name: 'sur grand écran, la fiche reste un tiroir',
      edits: [
        {
          file: 'src/features/coach/pages/ClientDetails.tsx',
          from: '                  onOpenExerciseSheet={isWide ? setAsideExercise : undefined}',
          to: '                  onOpenExerciseSheet={undefined}',
        },
      ],
      falls: [
        'à partir de 1 280 px, elle prend la colonne de droite, sans recouvrir',
        '→ elle dit chez combien de clients ce qu’on change changera',
      ],
    },
    {
      name: 'la fiche tait le nombre de clients',
      edits: [
        {
          file: CHOICES,
          from: "    clients > 0 ? `, chez ${clients} client${clients > 1 ? 's' : ''}` : '';",
          to: "    '';",
        },
      ],
      falls: ['→ elle dit chez combien de clients ce qu’on change changera'],
    },
    {
      // Ouverte depuis un programme, la fiche n'a que l'exercice du
      // programme, sans ses compteurs.
      name: 'la fiche ne lit plus les compteurs de la bibliothèque',
      edits: [
        {
          file: 'src/features/exercise/components/ExerciseSheet.tsx',
          from: '  const counted = library?.find((e) => e._id === exercise._id) ?? exercise;',
          to: '  const counted = library ? exercise : exercise;',
        },
      ],
      falls: ['→ elle dit chez combien de clients ce qu’on change changera'],
    },
    {
      // Écrire dans la fiche referme la ligne d'où elle est partie.
      name: 'la colonne de la fiche compte comme un clic ailleurs',
      edits: [
        {
          file: 'src/features/coach/pages/ClientDetails.tsx',
          from: '                  data-layer\n',
          to: '',
        },
      ],
      falls: ['→ la ligne reste ouverte pendant qu’on écrit dans la fiche'],
    },
    {
      // Les mouvements de ce programme arrivent sans compteurs : Burpee,
      // placé dans sept séances, se lirait « jamais utilisé ».
      name: 'ce programme se lit sans les compteurs de la bibliothèque',
      edits: [
        {
          file: CHOICES,
          from: '  const placed = inProgram.map((e) => byId.get(e._id) ?? e);',
          to: '  const placed = byId.size ? [...inProgram] : [...inProgram];',
        },
      ],
      falls: ['→ chaque mouvement dit son usage'],
    },
  ],
};
