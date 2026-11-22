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
      falls: [
        QUESTION,
        DETAIL,
        SIZES,
        ACCEPT,
        SEVERAL,
        REFUSE_ASKS,
        REFUSE_DIRECT,
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
      falls: [ACCEPT],
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
      falls: [ACCEPT, REFUSE_ASKS, REFUSE_DIRECT],
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
  ],
};
