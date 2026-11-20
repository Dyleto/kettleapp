/** Les sabotages de `verify_saving.mjs`. Voir `../run.mjs`. */
const STATUS = 'src/features/workshop/components/ProgramSaveStatus.tsx';
const PAGE = 'src/features/coach/pages/ClientDetails.tsx';

const HEADER =
  'l’état de l’enregistrement se lit dans l’en-tête de la séance : « Enregistrement… », puis « Enregistré »';
const THREE = '→ « Enregistré » reste trois secondes, puis s’efface';
const STAYS =
  'un échec reste, « Non enregistré · Réessayer », jusqu’à ce que « Réessayer » réussisse';
const PHONE = 'sur téléphone, l’état se lit au bas de l’écran';
const EMPTY =
  'un programme vide accueille : le personnage, le prénom, et deux façons de commencer';

export default {
  suite: 'verify_saving.mjs',
  cases: [
    {
      // L'état retourne au bas de la page, seul endroit où il vivait.
      name: 'l’en-tête ne dit plus l’état de l’enregistrement',
      edits: [
        {
          file: PAGE,
          from: '                  saveStatus={\n                    <SaveStatus\n                      state={saveState}\n                      savedAt={savedAt}\n                      onRetry={flush}\n                    />\n                  }\n',
          to: '',
        },
      ],
      falls: [HEADER, THREE, STAYS],
    },
    {
      name: '« Enregistré » ne fait que passer',
      edits: [
        {
          file: STATUS,
          from: 'const CONFIRMATION_DURATION = 3000;',
          to: 'const CONFIRMATION_DURATION = 1000;',
        },
      ],
      falls: [THREE],
    },
    {
      name: 'un échec ne se dit pas',
      edits: [
        {
          file: STATUS,
          from: "  if (state === 'error') return 'failed';\n",
          to: '',
        },
      ],
      falls: [STAYS],
    },
    {
      name: '« Réessayer » ne réessaie pas',
      edits: [
        {
          file: STATUS,
          from: '          <chakra.button\n            type="button"\n            onClick={onRetry}',
          to: '          <chakra.button\n            type="button"\n            onClick={() => undefined}',
        },
      ],
      falls: [STAYS],
    },
    {
      // L'en-tête et la ligne du bas disent l'état ensemble.
      name: 'la ligne du bas double l’en-tête sur grand écran',
      edits: [
        {
          file: PAGE,
          from: '          phoneOnly={!!activeSession}',
          to: '          phoneOnly={false}',
        },
      ],
      falls: [HEADER],
    },
    {
      name: 'sur téléphone, la ligne du bas se tait',
      edits: [
        {
          file: STATUS,
          from: "      display={phoneOnly ? { base: 'block', md: 'none' } : 'block'}",
          to: "      display={phoneOnly ? 'none' : 'block'}",
        },
      ],
      falls: [PHONE],
    },
    {
      name: 'le programme vide n’accueille plus',
      edits: [{ file: PAGE, from: '                mood="hello"\n', to: '' }],
      falls: [EMPTY],
    },
  ],
};
