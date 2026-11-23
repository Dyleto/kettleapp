/** Les sabotages de `verify_admin.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/admin/pages/Dashboard.tsx';
const DIALOG = 'src/features/admin/components/NewCoachDialog.tsx';
const DOMAIN = 'src/domain/admin/coaches.ts';
const HOOK = 'src/features/admin/hooks/useCreateCoach.ts';

const STATS = 'quatre nombres, ce qu’ils comptent, et les séances du jour';
const ROWS =
  'une ligne par coach : nom, adresse, clients, exercices, et depuis quand';
const NO_NAME = 'sans nom, la ligne dit l’adresse, une seule fois';
const NAMED = 'le rail et le titre nomment l’écran « Administration »';
const MOBILE =
  'sur téléphone : les tuiles sur deux colonnes, une carte par coach, rien ne déborde';
const ARMED =
  '« Créer le compte » attend une adresse, et dit avec quoi on se connecte';
const CREATED =
  'une adresse inconnue ouvre le compte, avec le nom saisi, sans rien demander';
const FOUND =
  'une adresse connue : « Ce compte existe déjà », avec son nom, et rien n’est donné';
const BACK = '→ « Retour » revient au formulaire, l’adresse gardée';
const PROMOTE =
  '→ « Donner le rôle de coach » renvoie avec `promote`, et le nom du compte';
const CONFLICT = 'un compte déjà coach : la boîte le dit, et reste ouverte';
const FAILED =
  'une panne : « Rien n’a été créé », une seule demande, l’adresse gardée';

export default {
  suite: 'verify_admin.mjs',
  cases: [
    {
      name: 'les séances du jour ne s’affichent plus',
      edits: [
        {
          file: DOMAIN,
          from: "        ? `+ ${stats.sessionTodayCount} aujourd'hui`",
          to: '        ? undefined',
        },
      ],
      falls: [STATS],
    },
    {
      name: 'un client s’écrit au pluriel',
      edits: [
        {
          file: DOMAIN,
          from: "  clients: plural(coach.clientCount, 'client', 'clients'),",
          to: '  clients: `${coach.clientCount} clients`,',
        },
      ],
      falls: [ROWS],
    },
    {
      name: 'un coach sans nom n’a plus que du vide',
      edits: [
        {
          file: DOMAIN,
          from: "  `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim() || coach.email;",
          to: "  `${coach.firstName ?? ''} ${coach.lastName ?? ''}`.trim();",
        },
      ],
      falls: [NO_NAME],
    },
    {
      name: 'l’adresse s’écrit deux fois sous un coach sans nom',
      edits: [
        {
          file: PAGE,
          from: '      {name !== coach.email && (',
          to: '      {true && (',
        },
      ],
      falls: [NO_NAME],
    },
    {
      name: 'le rail nomme l’écran autrement',
      edits: [
        {
          file: PAGE,
          from: "  { to: '/admin', label: 'Administration', icon: LuShield, end: true },",
          to: "  { to: '/admin', label: 'Admin', icon: LuShield, end: true },",
        },
      ],
      falls: [NAMED],
    },
    {
      name: 'l’onglet du navigateur ne nomme plus l’écran',
      edits: [
        {
          file: PAGE,
          from: "  useDocumentTitle('Administration');",
          to: '  useDocumentTitle();',
        },
      ],
      falls: [NAMED],
    },
    {
      name: 'le titre et le bouton restent côte à côte sur téléphone',
      edits: [
        {
          file: PAGE,
          from: '            <HStack justify="space-between" gap="12px" flexWrap="wrap">',
          to: '            <HStack justify="space-between" gap="12px">',
        },
      ],
      falls: [MOBILE],
    },
    {
      name: 'quatre tuiles de front sur téléphone',
      edits: [
        {
          file: PAGE,
          from: "                  base: 'repeat(2, minmax(0, 1fr))',",
          to: "                  base: 'repeat(4, minmax(0, 1fr))',",
        },
      ],
      falls: [MOBILE],
    },
    {
      name: 'pas de carte de coach sur téléphone',
      edits: [
        {
          file: PAGE,
          from: "        display={{ base: 'flex', md: 'none' }}",
          to: '        display="none"',
        },
      ],
      falls: [MOBILE],
    },
    {
      name: '« Créer le compte » s’active sans adresse',
      edits: [
        {
          file: DIALOG,
          from: '                      disabled={!isEmailLike(email)}',
          to: '                      disabled={false}',
        },
      ],
      falls: [ARMED],
    },
    {
      name: 'une adresse sans domaine passe pour une adresse',
      edits: [
        {
          file: DOMAIN,
          from: '  /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(text.trim());',
          to: '  /@/.test(text.trim());',
        },
      ],
      falls: [ARMED],
    },
    {
      name: 'le nom saisi ne part pas',
      edits: [
        {
          file: DIALOG,
          from: '        firstName: firstName.trim() || undefined,',
          to: '        firstName: undefined,',
        },
      ],
      falls: [CREATED],
    },
    {
      name: 'la liste ne se relit pas après une ouverture',
      edits: [
        {
          file: HOOK,
          from: '      queryClient.invalidateQueries({ queryKey: queryKeys.admin.coaches() });',
          to: '',
        },
      ],
      falls: [CREATED],
    },
    {
      // Le défaut réparé : le rôle se donnait en silence.
      name: 'le rôle se donne sans demander',
      edits: [
        {
          file: DIALOG,
          from: '        promote: promote || undefined,',
          to: '        promote: true,',
        },
      ],
      // Sans question, ni « Retour » ni « Donner le rôle de coach » ; et
      // une adresse inconnue part, elle aussi, avec `promote`.
      falls: [CREATED, FOUND, BACK, PROMOTE],
    },
    {
      name: 'la question d’un compte trouvé ne s’affiche pas',
      edits: [
        {
          file: DIALOG,
          from: "          if (result.status === 'exists') {",
          to: '          if (false) {',
        },
      ],
      falls: [FOUND, BACK, PROMOTE],
    },
    {
      name: '« Retour » efface l’adresse',
      edits: [
        {
          file: DIALOG,
          from: '                        setFound(null);\n',
          to: "                        setFound(null);\n                        setEmail('');\n",
        },
      ],
      // Sans adresse, « Créer le compte » ne repart pas, la question non
      // plus.
      falls: [BACK, PROMOTE],
    },
    {
      name: '« Donner le rôle de coach » renvoie sans `promote`',
      edits: [
        {
          file: DIALOG,
          from: '                      onClick={() => send(true)}',
          to: '                      onClick={() => send(false)}',
        },
      ],
      falls: [PROMOTE],
    },
    {
      name: 'un compte déjà coach passe pour une panne',
      edits: [
        {
          file: DIALOG,
          from: '    ? isConflict(create.error)',
          to: '    ? false',
        },
      ],
      falls: [CONFLICT],
    },
    {
      name: 'l’ouverture se rejoue après une panne',
      edits: [{ file: HOOK, from: '    retry: 0,\n', to: '' }],
      // Le refus aussi se rejoue : il arrive trois secondes trop tard.
      falls: [CONFLICT, FAILED],
    },
    {
      name: 'le message d’échec reste quand l’adresse change',
      edits: [
        {
          file: DIALOG,
          from: '                      if (create.isError) create.reset();',
          to: '',
        },
      ],
      falls: [FAILED],
    },
  ],
};
