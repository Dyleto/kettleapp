/** Les sabotages de `verify_usetemplate.mjs`. Voir `../run.mjs`. */
const SHEET = 'src/features/template/components/UseTemplateSheet.tsx';
const WORKSHOP = 'src/features/template/pages/TemplateDetails.tsx';
const CARD = 'src/domain/template/card.ts';

const EMPTY = 'un modèle vide ne s’utilise pour personne';
const ROWS =
  'la feuille dit, pour chaque client, ce que son programme porte et ce que l’import fera';
const SEARCH = 'chercher resserre la liste, sans casse';
const ASKS =
  '« Remplacer… » pose la question de l’atelier : ce qui part, ce qui vient, ce qui reste';
const CANCEL = '→ « Annuler » revient à la liste, sans rien importer';
const FAILED =
  'un import raté laisse la feuille ouverte, et dit que rien n’a bougé';
const IMPORTS =
  '« Importer » importe chez ce client, ouvre son atelier sur la séance 1, et le dit';
const REPLACES =
  '→ « Remplacer le programme » importe aussi, et ouvre l’atelier de ce client';
const EMPTY_WORKSHOP = 'l’atelier d’un modèle vide ne l’offre pas non plus';
const WAITS =
  'depuis l’atelier d’un modèle, l’import attend que ce qu’on y a écrit soit enregistré';
const THEN = '→ puis s’offre, une fois l’enregistrement arrivé';

export default {
  suite: 'verify_usetemplate.mjs',
  cases: [
    {
      name: 'un modèle vide s’offre à l’import',
      edits: [
        {
          file: 'src/features/template/components/TemplateCard.tsx',
          from: '          disabled={template.sessionCount === 0}\n',
          to: '',
        },
      ],
      falls: [EMPTY],
    },
    {
      name: 'la ligne d’un client ne compte plus ses séances',
      edits: [
        {
          file: CARD,
          from: "    : `a déjà ${plural(sessionCount, 'séance')}`;",
          to: '    : `a déjà des séances`;',
        },
      ],
      falls: [ROWS],
    },
    {
      // Sarah s'importerait d'une touche : plus de question à poser.
      name: 'un programme rempli s’importe sans demander',
      edits: [
        {
          file: CARD,
          from: "  sessionCount === 0 ? 'import' : 'replace';",
          to: "  sessionCount === sessionCount ? 'import' : 'replace';",
        },
      ],
      falls: [ROWS, ASKS, REPLACES],
    },
    {
      name: 'la recherche ne filtre plus',
      edits: [
        {
          file: SHEET,
          from: '.filter((client) =>\n    matchesQuery(client, query)\n  );',
          to: '.filter(() => query === query);',
        },
      ],
      falls: [SEARCH],
    },
    {
      name: 'la question compte mal ce qui part',
      edits: [
        {
          file: SHEET,
          from: '            currentCount={replacing.sessionCount}',
          to: '            currentCount={1}',
        },
      ],
      falls: [ASKS],
    },
    {
      // La feuille reste sur la question : la panne d'après n'y trouve pas
      // « Importer ».
      name: '« Annuler » ne revient pas à la liste',
      edits: [
        {
          file: SHEET,
          from: '              setReplacing(null);\n            }}',
          to: '            }}',
        },
      ],
      falls: [CANCEL, FAILED, IMPORTS],
    },
    {
      name: 'un import raté ne dit rien',
      edits: [
        {
          file: SHEET,
          from: '        onError: () => setFailedFor(client),',
          to: '        onError: () => undefined,',
        },
      ],
      falls: [FAILED],
    },
    {
      name: 'un import réussi laisse sur l’écran des modèles',
      edits: [
        {
          file: SHEET,
          from: '          navigate(COACH_ROUTES.clientSession(client._id, 1));\n',
          to: '',
        },
      ],
      falls: [IMPORTS, REPLACES],
    },
    {
      name: 'un import réussi ne dit pas d’où vient le programme',
      edits: [
        {
          file: SHEET,
          from: '            title: `Programme importé depuis “${template.name}”`,',
          to: '            title: `Programme importé`,',
        },
      ],
      falls: [IMPORTS],
    },
    {
      name: '« Remplacer le programme » ne fait rien',
      edits: [
        {
          file: SHEET,
          from: '            onClick={() => run(replacing)}',
          to: '            onClick={() => undefined}',
        },
      ],
      falls: [REPLACES],
    },
    {
      name: 'l’atelier d’un modèle vide l’offre à l’import',
      edits: [
        {
          file: WORKSHOP,
          from: '            disabled={sessions.length === 0}\n            onClick={() => setUsing(true)}',
          to: '            onClick={() => setUsing(true)}',
        },
      ],
      falls: [EMPTY_WORKSHOP],
    },
    {
      name: '« Utiliser pour un client » ne s’ouvre pas depuis l’atelier',
      edits: [
        {
          file: WORKSHOP,
          from: '            onClick={() => setUsing(true)}',
          to: '            onClick={() => undefined}',
        },
      ],
      falls: [WAITS, THEN],
    },
    {
      name: 'la feuille ne dit pas qu’elle attend l’enregistrement',
      edits: [
        {
          file: WORKSHOP,
          from: "              : saveState !== 'idle'\n                ? 'Ton modèle finit de s’enregistrer…'\n                : undefined",
          to: '              : undefined',
        },
      ],
      falls: [WAITS],
    },
    {
      // Le texte reste : seul le bouton cesse d'attendre.
      name: '« Importer » n’attend pas l’enregistrement',
      edits: [
        {
          file: SHEET,
          from: '                          aria-label={`Importer chez ${name}`}\n                          disabled={!!blocked || importTemplate.isPending}',
          to: '                          aria-label={`Importer chez ${name}`}\n                          disabled={importTemplate.isPending}',
        },
      ],
      falls: [WAITS],
    },
  ],
};
