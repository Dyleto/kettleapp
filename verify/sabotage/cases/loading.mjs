/** Les sabotages de `verify_loading.mjs`. Voir `../run.mjs`. */
const ACCOUNT_PAGE = 'src/features/account/pages/Account.tsx';
const WORKSHOP_PAGE = 'src/features/coach/pages/ClientDetails.tsx';
const SHAPES = 'src/kit/LoadingShapes.tsx';
const NOTICE = 'src/kit/SlowNotice.tsx';
const TODAY = 'src/features/client/home/Today.tsx';
const ROOT = 'src/shared/layouts/RootLayout.tsx';

const ACCOUNT = '« Mon compte » charge derrière des formes, sans roue';
const SLOW =
  '→ rien avant dix secondes, puis « C’est plus long que d’habitude »';
const WORKSHOP =
  'l’atelier charge derrière ses formes : les séances, puis les blocs';
const SHELL = 'l’application montre des formes, pas une roue ambre';
const HOME = 'l’accueil aussi dit, après dix secondes, que c’est plus long';

export default {
  suite: 'verify_loading.mjs',
  cases: [
    {
      name: '« Mon compte » charge sur une page vide',
      edits: [
        {
          file: ACCOUNT_PAGE,
          from: '        <LoadingShapes layout="column" />',
          to: '        <></>',
        },
      ],
      // Sans formes, pas de phrase non plus : elle vit dedans.
      falls: [ACCOUNT, SLOW],
    },
    {
      name: 'la phrase paraît dès le début du chargement',
      edits: [
        {
          file: NOTICE,
          from: 'export const SLOW_AFTER = 10_000;',
          to: 'export const SLOW_AFTER = 0;',
        },
      ],
      falls: [SLOW],
    },
    {
      name: 'la phrase ne paraît jamais',
      edits: [
        {
          file: NOTICE,
          from: '  if (!slow) return null;',
          to: '  return null;',
        },
      ],
      falls: [SLOW, HOME],
    },
    {
      name: 'les formes ne portent plus la phrase',
      edits: [{ file: SHAPES, from: '      <SlowNotice />', to: '' }],
      falls: [SLOW],
    },
    {
      name: 'l’atelier charge sous une simple colonne',
      edits: [
        {
          file: WORKSHOP_PAGE,
          from: '        <LoadingShapes layout="workshop" />',
          to: '        <LoadingShapes layout="column" />',
        },
      ],
      falls: [WORKSHOP],
    },
    {
      name: 'les séances fantômes manquent sur grand écran',
      edits: [
        {
          file: SHAPES,
          from: "            display={{ base: 'none', md: 'flex' }}",
          to: '            display="none"',
        },
      ],
      falls: [WORKSHOP],
    },
    {
      name: 'la coque charge sur un écran vide',
      edits: [{ file: ROOT, from: '    <LoadingShapes />', to: '    <></>' }],
      falls: [SHELL],
    },
    {
      name: 'l’accueil ne dit rien au bout de dix secondes',
      edits: [{ file: TODAY, from: '          <SlowNotice />', to: '' }],
      falls: [HOME],
    },
  ],
};
