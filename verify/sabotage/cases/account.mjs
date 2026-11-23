/** Les sabotages de `verify_account.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/account/pages/Account.tsx';
const SUMMARY = 'src/domain/account/summary.ts';
const DELETE_DIALOG = 'src/features/account/components/DeleteAccountDialog.tsx';

const IDENTITY = 'l’identité : le nom, l’adresse, et qu’elle vient de Google';
const COACH = 'son coach, depuis quand, et combien de séances';
const HEALTH =
  '→ ses données de santé : avec qui, et combien de séances en contiennent';
const NO_ACTIVITY = '→ sans l’activité du coach, qui est de l’autre espace';
const OPTOUT = 'arrêter le partage demande d’abord, puisque cela efface';
const COPY =
  '« Recevoir une copie de mes données » donne l’adresse, et le délai';
const ACTIVITY = 'son activité, à la place du coach et des données de santé';
const LOGOUT = '« Se déconnecter » est sur l’écran, et ramène à la connexion';
const DELETE_WORD =
  'supprimer dit ce qui disparaît, et le bouton rouge attend le mot';
const DELETE =
  '→ « Supprimer définitivement » supprime, et ramène à la connexion';
const NO_COACH =
  'sans coach : « Aucun coach pour l’instant », et de quoi coller une invitation';
const WIDE = 'sur grand écran, une colonne de 640 px';

export default {
  suite: 'verify_account.mjs',
  cases: [
    {
      name: 'l’identité ne dit plus d’où elle vient',
      edits: [
        {
          file: PAGE,
          from: '              {user?.email} · compte Google',
          to: '              {user?.email}',
        },
      ],
      falls: [IDENTITY],
    },
    {
      name: 'la ligne d’un coach ne compte plus les séances',
      edits: [
        {
          file: SUMMARY,
          from: '  if (coachCount !== 1) return since;',
          to: '  return since;',
        },
      ],
      falls: [COACH],
    },
    {
      // La date du coach et celle de l'accord s'écrivent pareil.
      name: 'le premier du mois s’écrit « 1 »',
      edits: [
        {
          file: SUMMARY,
          from: "  const day = date.getDate() === 1 ? '1er' : String(date.getDate());",
          to: '  const day = String(date.getDate());',
        },
      ],
      falls: [COACH, HEALTH],
    },
    {
      name: 'les données de santé ne disent plus combien de séances en portent',
      edits: [
        {
          file: SUMMARY,
          from: '      : `${count} séances en contiennent.`;',
          to: "      : '';",
        },
      ],
      falls: [HEALTH],
    },
    {
      name: 'les données de santé ne disent plus avec qui',
      edits: [
        {
          file: SUMMARY,
          from: "  return coaches[0]?.firstName.trim() || 'ton coach';",
          to: "  return 'ton coach';",
        },
      ],
      // Le retrait du partage trouve l'interrupteur par son nom : il tombe
      // avec lui.
      falls: [HEALTH, OPTOUT],
    },
    {
      name: 'le client lit aussi l’activité du coach',
      edits: [
        {
          file: PAGE,
          from: '        {!inClientSpace && data?.asCoach && (',
          to: '        {data?.asCoach && (',
        },
      ],
      falls: [NO_ACTIVITY],
    },
    {
      name: 'le coach lit aussi le coach et les données de santé',
      edits: [
        {
          file: PAGE,
          from: '        {inClientSpace && data?.asClient && (',
          to: '        {data?.asClient && (',
        },
      ],
      falls: [ACTIVITY],
    },
    {
      name: 'arrêter le partage efface sans prévenir',
      edits: [
        {
          file: 'src/features/account/components/HealthConsentCard.tsx',
          from: '    if (granted && healthDataCount > 0) {',
          to: '    if (false) {',
        },
      ],
      falls: [OPTOUT],
    },
    {
      name: '« Recevoir une copie de mes données » n’ouvre rien',
      edits: [
        {
          file: PAGE,
          from: "            onOpen={() => setSheet('copy')}",
          to: '            onOpen={() => undefined}',
        },
      ],
      falls: [COPY],
    },
    {
      name: '« Se déconnecter » ne fait rien',
      edits: [
        {
          file: PAGE,
          from: '        <ActionButton tone="ghost" size="md" w="full" mt="8px" onClick={logout}>',
          to: '        <ActionButton tone="ghost" size="md" w="full" mt="8px">',
        },
      ],
      falls: [LOGOUT],
    },
    {
      name: 'le bouton rouge n’attend pas le mot',
      edits: [
        {
          file: DELETE_DIALOG,
          from: '                  disabled={!armed}\n',
          to: '',
        },
      ],
      falls: [DELETE_WORD],
    },
    {
      // « supprimer » en minuscules n'arme plus rien : la suppression ne
      // part pas.
      name: 'le mot doit être tapé en capitales',
      edits: [
        {
          file: DELETE_DIALOG,
          from: '  const armed = typed.trim().toUpperCase() === WORD;',
          to: '  const armed = typed.trim() === WORD;',
        },
      ],
      falls: [DELETE_WORD, DELETE],
    },
    {
      name: 'un compte supprimé reste sur l’écran',
      edits: [
        {
          file: 'src/features/account/hooks/useAccount.ts',
          from: "      window.location.href = '/login';\n",
          to: '',
        },
      ],
      falls: [DELETE],
    },
    {
      name: 'la liste ne dit plus que le coach part',
      edits: [
        {
          file: SUMMARY,
          from: "      lines.push(`ton rattachement à ${names.join(' et ')}`);",
          to: '      void names;',
        },
      ],
      falls: [DELETE_WORD],
    },
    {
      name: 'sans coach, rien pour coller une invitation',
      edits: [
        {
          file: PAGE,
          from: "      {sheet === 'invite' && <InviteSheet onClose={() => setSheet(null)} />}\n",
          to: '',
        },
      ],
      falls: [NO_COACH],
    },
    {
      name: 'la colonne compte le rembourrage',
      edits: [
        {
          file: PAGE,
          from: "      maxW={{ base: '672px', md: '704px' }}",
          to: "      maxW={{ base: '672px', md: '672px' }}",
        },
      ],
      falls: [WIDE],
    },
  ],
};
