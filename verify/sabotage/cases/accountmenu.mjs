/** Les sabotages de `verify_accountmenu.mjs`. Voir `../run.mjs`. */
const ROUTES = 'src/shared/config/routes.ts';
const LAYOUT = 'src/features/client/shell/ClientLayout.tsx';
const MENU = 'src/shared/components/Header.tsx';

const PHONE =
  'une feuille : l’identité, puis « Mon compte », l’espace coach et ce qui l’y attend, « Se déconnecter »';
const ESC = '→ Échap la referme';
const COACH_SIDE =
  'côté coach, on passe à l’espace client, jamais à celui où l’on est';
const SINGLE =
  'un compte à un seul rôle n’a nulle part où passer, et « À lire » n’est pas lu';
const WIDE = 'un menu qui monte de l’avatar, avec les mêmes entrées';

export default {
  suite: 'verify_accountmenu.mjs',
  cases: [
    {
      // Le défaut réparé : « Vue Client » se proposait depuis l'espace
      // client.
      name: 'le menu propose l’espace où l’on est',
      edits: [
        {
          file: ROUTES,
          from: '    (entry) => held[entry.space] && entry.space !== here',
          to: '    (entry) => held[entry.space]',
        },
      ],
      // Un compte à un seul rôle se voit proposer son propre espace, lui
      // aussi.
      falls: [PHONE, COACH_SIDE, SINGLE, WIDE],
    },
    {
      name: 'ce qui attend côté coach ne se dit plus',
      edits: [
        {
          file: LAYOUT,
          from: '  const waiting = unread > 0 ? { coach: `${unread} à lire` } : undefined;',
          to: '  const waiting = undefined;',
        },
      ],
      falls: [PHONE, WIDE],
    },
    {
      name: '« À lire » se lit pour un compte qui n’est pas coach',
      edits: [
        {
          file: LAYOUT,
          from: "  const unread = useInbox('unread', !!user?.isCoach).data?.total ?? 0;",
          to: "  const unread = useInbox('unread', true).data?.total ?? 0;",
        },
      ],
      falls: [SINGLE],
    },
    {
      name: 'Échap ne referme pas la feuille',
      edits: [
        { file: MENU, from: '  useSheetDismiss(true, onClose);\n', to: '' },
      ],
      falls: [ESC],
    },
    {
      name: 'le menu s’ouvre à côté de l’avatar, et non au-dessus',
      edits: [
        {
          file: MENU,
          from: "      <Menu.Root positioning={{ placement: 'top-start' }}>",
          to: "      <Menu.Root positioning={{ placement: 'right-end' }}>",
        },
      ],
      falls: [WIDE],
    },
  ],
};
