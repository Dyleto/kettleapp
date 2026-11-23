/** Les sabotages de `verify_join.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/auth/pages/Join.tsx';

const ASK =
  'le lien demande avant de rattacher le compte ouvert, et dit lequel';
const JOIN =
  '« Rejoindre Julie » rattache ce compte par son jeton, et ouvre son espace client à son nom';
const FAIL = '→ un rattachement raté le dit, et ne quitte pas le lien';
const OTHER =
  '« Utiliser un autre compte » ferme la session et revient au même lien';
const LINKED =
  'un client qui suit déjà ce coach va droit à son accueil, et le lit';
const NAMELESS = 'sans prénom, « Ton coach t’invite sur Kettle »';

export default {
  suite: 'verify_join.mjs',
  cases: [
    {
      // Le compte ouvert repart chez Google, comme avant F9b.
      name: 'un compte connecté n’a que « Rejoindre avec Google »',
      edits: [
        {
          file: PAGE,
          from: '        {user ? (\n          <VStack w="100%" gap="10px">',
          to: '        {false ? (\n          <VStack w="100%" gap="10px">',
        },
      ],
      falls: [ASK, JOIN, FAIL, OTHER],
    },
    {
      name: 'la question ne dit pas qu’elle porte sur ce compte',
      edits: [
        {
          file: PAGE,
          from: '            ? `Rejoindre ${who} avec ce compte ?`',
          to: "            ? `${Who} t'invite sur Kettle`",
        },
      ],
      falls: [ASK],
    },
    {
      name: 'rejoindre laisse sur le lien',
      edits: [
        {
          file: PAGE,
          from: '                    navigate(CLIENT_ROUTES.today, { replace: true }),\n',
          to: '                    undefined,\n',
        },
      ],
      falls: [JOIN],
    },
    {
      // L'accueil s'ouvre, mais au nom du compte d'avant.
      name: 'le compte rendu ne remplace pas celui du contexte',
      edits: [
        {
          file: 'src/features/auth/hooks/useJoinCoach.ts',
          from: '      setUser(user);\n',
          to: '',
        },
      ],
      falls: [JOIN],
    },
    {
      name: 'un rattachement raté ne dit rien',
      edits: [
        {
          file: PAGE,
          from: '            {join.isError && (',
          to: '            {false && (',
        },
      ],
      falls: [FAIL],
    },
    {
      name: '« Utiliser un autre compte » garde la session',
      edits: [
        {
          file: PAGE,
          from: '      await authService.logout();\n',
          to: '',
        },
      ],
      falls: [OTHER],
    },
    {
      name: 'un client déjà rattaché se voit poser la question',
      edits: [
        {
          file: PAGE,
          from: '  const alreadyLinked = !!user && !!data?.alreadyLinked;',
          to: '  const alreadyLinked = false;',
        },
      ],
      falls: [LINKED],
    },
    {
      name: 'un client déjà rattaché arrive sans un mot',
      edits: [
        {
          file: PAGE,
          from: "    toaster.create({ type: 'info', title: `Tu es déjà avec ${who}` });\n",
          to: '',
        },
      ],
      falls: [LINKED],
    },
    {
      name: 'sans prénom, le titre commence par une espace',
      edits: [
        {
          file: PAGE,
          from: "  const Who = coachFirstName || 'Ton coach';",
          to: '  const Who = coachFirstName;',
        },
      ],
      falls: [NAMELESS],
    },
  ],
};
