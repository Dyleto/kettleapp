/** Les sabotages de `verify_newexercise.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_newexercise.mjs',
  cases: [
    {
      // Le champ se replie dès que la souris s'enfonce, le bouton remonte
      // sous le pointeur, et le clic tombe à côté : la fiche reste ouverte.
      name: '« Retour au programme » laisse le champ se replier sous le clic',
      edits: [
        {
          file: 'src/features/exercise/components/ExerciseSheet.tsx',
          from: '          onMouseDown={(e: React.MouseEvent) => e.preventDefault()}\n',
          to: '',
        },
      ],
      falls: ['→ elle referme la fiche et rend le programme, la ligne ouverte'],
    },
  ],
};
