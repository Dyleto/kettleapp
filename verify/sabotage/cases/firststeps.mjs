/** Les sabotages de `verify_firststeps.mjs`. Voir `../run.mjs`. */
const GATE = 'src/features/account/components/HealthConsentGate.tsx';
const LAYOUT = 'src/features/client/shell/ClientLayout.tsx';

const QUESTION = 'la question tient en une phrase, et nomme le coach';
const DETAIL =
  'le détail se déplie : ce qu’un refus change, et la politique de confidentialité';
const SIZES =
  'les deux réponses ont la même taille, et aucune n’est choisie d’avance';
const ACCEPT = '« J’accepte » enregistre l’accord, et ouvre l’accueil';
const SEVERAL = 'avec plusieurs coachs, la question dit « ton coach »';
const REFUSE_ASKS =
  '« Je refuse » demande d’abord quand des ressentis seraient effacés, puis ouvre l’accueil';
const REFUSE_DIRECT = '→ sans rien à effacer, refuser tient en un geste';
const WELCOME = 'src/features/client/shell/Welcome.tsx';
const WELCOME_HOOK = 'src/features/client/shell/useWelcome.ts';
const W_FIRST =
  'un nouveau client voit trois cartes, et la première nomme son coach';
const W_NEXT = '« Suivant » avance, et les points suivent';
const W_SWIPE = 'glisser change de carte, dans les deux sens';
const W_LAST =
  '→ la dernière dit ce qu’on demande à la fin, et propose de commencer';
const W_START =
  '« Commencer » mène à la question puis à l’accueil, et les cartes ne reviennent plus';
const W_SKIP = '« Passer » mène droit à la question';
const W_WIDE = 'sur grand écran, la carte tient dans 480 px, au centre';
const W_REGULAR =
  'un client qui s’entraîne déjà ne les voit pas, même sur un nouvel appareil';
const W_NO_COACH = 'sans coach, pas de cartes : la question vient seule';
const W_ACCOUNT = 'elles n’arrêtent pas « Mon compte »';
const LOGOUT =
  '« Se déconnecter » reste offert, pour qui s’est trompé de compte';

export default {
  suite: 'verify_firststeps.mjs',
  cases: [
    {
      // Toute la question saute : le consentement se contourne.
      name: 'l’espace client s’ouvre sans poser la question',
      edits: [
        {
          file: LAYOUT,
          from: '  if (user?.needsHealthConsent)',
          to: '  if (user?.needsHealthConsent && false)',
        },
      ],
      // Après les cartes aussi, la question manque.
      falls: [
        QUESTION,
        DETAIL,
        SIZES,
        ACCEPT,
        SEVERAL,
        REFUSE_ASKS,
        REFUSE_DIRECT,
        W_START,
        W_SKIP,
        W_NO_COACH,
        LOGOUT,
      ],
    },
    {
      // Le détail nomme aussi le coach.
      name: 'la question ne nomme plus le coach',
      edits: [
        {
          file: LAYOUT,
          from: '    return <HealthConsentGate coach={voice.inline} />;',
          to: '    return <HealthConsentGate />;',
        },
      ],
      falls: [QUESTION, DETAIL],
    },
    {
      name: 'avec deux coachs, la question nomme le premier',
      edits: [
        {
          file: 'src/features/client/common/coach.ts',
          from: "  const name = coaches.length === 1 ? coaches[0].firstName.trim() : '';",
          to: "  const name = coaches[0]?.firstName.trim() ?? '';",
        },
      ],
      falls: [SEVERAL],
    },
    {
      name: 'le détail est déjà déplié',
      edits: [
        {
          file: GATE,
          from: '        {detailOpen && (',
          to: '        {(detailOpen || true) && (',
        },
      ],
      falls: [DETAIL],
    },
    {
      name: 'le bouton ne dit pas qu’il a déplié',
      edits: [
        {
          file: GATE,
          from: '          aria-expanded={detailOpen}',
          to: '          aria-expanded={false}',
        },
      ],
      falls: [DETAIL],
    },
    {
      name: '« Je refuse » est plus petit',
      edits: [
        {
          file: GATE,
          from: '            tone="ghost"\n            w="full"',
          to: '            tone="ghost"\n            size="sm"\n            w="full"',
        },
      ],
      falls: [SIZES],
    },
    {
      name: '« J’accepte » est choisi d’avance',
      edits: [
        {
          file: GATE,
          from: '            onClick={() => mutate(true)}',
          to: '            autoFocus\n            onClick={() => mutate(true)}',
        },
      ],
      falls: [SIZES],
    },
    {
      name: '« J’accepte » envoie un refus',
      edits: [
        {
          file: GATE,
          from: '            onClick={() => mutate(true)}',
          to: '            onClick={() => mutate(false)}',
        },
      ],
      // Après les cartes, l'accord part en refus tout autant.
      falls: [ACCEPT, W_START],
    },
    {
      name: 'refuser efface sans prévenir',
      edits: [
        {
          file: GATE,
          from: '    if (toLose > 0) {',
          to: '    if (toLose < 0) {',
        },
      ],
      falls: [REFUSE_ASKS],
    },
    {
      name: 'refuser demande même quand rien ne s’efface',
      edits: [
        {
          file: GATE,
          from: '    if (toLose > 0) {',
          to: '    if (toLose >= 0) {',
        },
      ],
      falls: [REFUSE_DIRECT],
    },
    {
      // La réponse part, mais la question reste devant l'accueil.
      name: 'une réponse ne lève pas la question',
      edits: [
        {
          file: 'src/features/account/hooks/useAccount.ts',
          from: '        setUser({ ...user, healthConsent, needsHealthConsent: false });',
          to: '        setUser({ ...user, healthConsent });',
        },
      ],
      falls: [ACCEPT, REFUSE_ASKS, REFUSE_DIRECT, W_START],
    },
    {
      name: '« Se déconnecter » ne fait rien',
      edits: [
        {
          file: GATE,
          from: '            onClick={logout}',
          to: '            onClick={() => undefined}',
        },
      ],
      falls: [LOGOUT],
    },
    {
      // Sans cartes, la question vient seule : « Passer » et « Commencer »
      // n'ont plus rien à sauter, et ce qui suit la question tient.
      name: 'les cartes ne se montrent jamais',
      edits: [
        {
          file: LAYOUT,
          from: "  if (welcome.state === 'show')",
          to: "  if (welcome.state === 'show' && false)",
        },
      ],
      falls: [W_FIRST, W_NEXT, W_SWIPE, W_LAST, W_WIDE],
    },
    {
      name: 'la première carte ne nomme plus le coach',
      edits: [
        {
          file: WELCOME,
          from: '    title: `${coach.opening} prépare ton programme`,',
          to: '    title: `Ton coach prépare ton programme`,',
        },
      ],
      falls: [W_FIRST],
    },
    {
      name: 'la dernière carte ne nomme plus le coach',
      edits: [
        {
          file: WELCOME,
          from: '    line: `Une touche à la fin. ${coach.opening} s’en sert pour régler la suite.`,',
          to: '    line: `Une touche à la fin.`,',
        },
      ],
      falls: [W_LAST],
    },
    {
      name: '« Suivant » saute une carte',
      edits: [
        {
          file: WELCOME,
          from: '            onClick={() => (last ? onDone() : go(index + 1))}',
          to: '            onClick={() => (last ? onDone() : go(index + 2))}',
        },
      ],
      falls: [W_NEXT],
    },
    {
      name: 'les points ne gardent pas les cartes vues',
      edits: [
        {
          file: WELCOME,
          from: "              i < index ? 'done' : i === index ? 'now' : 'todo'",
          to: "              i === index ? 'now' : 'todo'",
        },
      ],
      falls: [W_NEXT],
    },
    {
      name: 'glisser ne revient pas en arrière',
      edits: [
        {
          file: WELCOME,
          from: '          else if (moved >= SWIPE) go(index - 1);\n',
          to: '',
        },
      ],
      falls: [W_SWIPE],
    },
    {
      name: '« Passer » ne fait rien',
      edits: [
        {
          file: WELCOME,
          from: '            onClick={onDone}',
          to: '            onClick={() => undefined}',
        },
      ],
      falls: [W_SKIP],
    },
    {
      name: 'la carte s’élargit sur grand écran',
      edits: [
        {
          file: WELCOME,
          from: '        maxW="480px"',
          to: '        maxW="560px"',
        },
      ],
      falls: [W_WIDE],
    },
    {
      name: 'les cartes reviennent à chaque visite',
      edits: [
        {
          file: WELCOME_HOOK,
          from: "    storage.setItem(WELCOME_SEEN_KEY, '1');\n",
          to: '',
        },
      ],
      falls: [W_START],
    },
    {
      name: 'un client qui s’entraîne déjà les revoit',
      edits: [
        {
          file: WELCOME_HOOK,
          from: '(program.data?.coaches.length ?? 0) > 0 && history.data?.length === 0',
          to: '(program.data?.coaches.length ?? 0) > 0',
        },
      ],
      falls: [W_REGULAR],
    },
    {
      name: 'un client sans coach les voit',
      edits: [
        {
          file: WELCOME_HOOK,
          from: '(program.data?.coaches.length ?? 0) > 0 && history.data?.length === 0',
          to: 'history.data?.length === 0',
        },
      ],
      falls: [W_NO_COACH],
    },
    {
      name: 'les cartes s’ouvrent sur « Mon compte »',
      edits: [
        {
          file: WELCOME_HOOK,
          from: '  const asking = !seen && onToday;',
          to: '  const asking = !seen || !onToday;',
        },
      ],
      falls: [W_ACCOUNT],
    },
  ],
};
