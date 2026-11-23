/** Les sabotages de `verify_pull.mjs`. Voir `../run.mjs`. */
const PULL = 'src/shared/components/PullToRefresh.tsx';
const RULES = 'src/shared/pull.ts';
const TODAY = 'src/features/client/home/Today.tsx';
const PROGRAM = 'src/features/client/program/Program.tsx';
const INBOX = 'src/features/coach/pages/Inbox.tsx';
const CLIENTS = 'src/features/coach/pages/Clients.tsx';

const SHORT =
  'un geste court dit « Tire pour actualiser », et relâché ne relit rien';
const HOME =
  '→ puis l’accueil montre ce qui a changé, relu une fois malgré une seconde traction';
const SHEET = 'dans une feuille ouverte, tirer ne relit pas l’écran derrière';
const OFFLINE =
  'hors connexion, il le dit pendant la traction, et relâché ne tente rien';
const FAILED =
  'une relecture qui échoue le dit, et l’accueil garde ce qu’il montrait';
const QUICK =
  'une relecture éclair tourne tout de même un instant, puis s’efface';
const PROGRAM_SEEN =
  'tirer le programme montre la séance que le coach vient de renommer';
const MIDWAY =
  'au milieu de la page, le même geste fait défiler : rien ne se relit';
const SIDEWAYS = 'de côté, c’est le glisser d’une ligne : il ne tire rien';
const INBOX_SEEN =
  'tirer « À lire » relit le fil : tout a été lu ailleurs, il le dit';
const CLIENTS_SEEN =
  'tirer la liste des clients montre celui qui vient d’arriver';

export default {
  suite: 'verify_pull.mjs',
  cases: [
    {
      // Relâché à n'importe quelle course, l'écran se relit : un doigt qui
      // effleure le haut de la page recharge tout.
      name: 'relâcher recharge sans seuil',
      edits: [
        {
          file: PULL,
          from: "      const go = pulling && pullPhase(reach, latest.current.online) === 'armed';",
          to: '      const go = pulling && latest.current.online;',
        },
      ],
      // La traction courte relit l'historique : celle d'après compte deux
      // relectures au lieu d'une.
      falls: [SHORT, HOME],
    },
    {
      name: 'hors connexion, relâcher relit quand même',
      edits: [
        {
          file: PULL,
          from: "      const go = pulling && pullPhase(reach, latest.current.online) === 'armed';",
          to: "      const go = pulling && pullPhase(reach, true) === 'armed';",
        },
      ],
      falls: [OFFLINE],
    },
    {
      name: 'une seconde traction relance la relecture',
      edits: [
        {
          file: PULL,
          from: '      if (latest.current.refreshing || event.touches.length !== 1) return;',
          to: '      if (event.touches.length !== 1) return;',
        },
      ],
      falls: [HOME],
    },
    {
      name: 'le geste ne regarde plus où en est la page',
      edits: [
        { file: PULL, from: '      if (window.scrollY > 0) return;\n', to: '' },
      ],
      falls: [MIDWAY],
    },
    {
      name: 'une feuille ouverte tire l’écran derrière',
      edits: [
        {
          file: PULL,
          from: '      if (target?.closest?.(\'[role="dialog"]\')) return;\n',
          to: '',
        },
      ],
      falls: [SHEET],
    },
    {
      name: 'un geste de côté passe pour une traction',
      edits: [
        {
          file: RULES,
          from: "  return dy > 0 && Math.abs(dy) > Math.abs(dx) ? 'pull' : 'other';",
          to: "  return dy > 0 ? 'pull' : 'other';",
        },
      ],
      falls: [SIDEWAYS],
    },
    {
      name: 'une relecture qui échoue se tait',
      edits: [
        {
          file: PULL,
          from: '              { throwOnError: true }',
          to: '              { throwOnError: false }',
        },
      ],
      falls: [FAILED],
    },
    {
      name: 'l’indicateur s’efface dès la réponse',
      edits: [
        {
          file: PULL,
          from: 'const MIN_SPIN = 600;',
          to: 'const MIN_SPIN = 0;',
        },
      ],
      falls: [QUICK],
    },
    {
      // Sans lecture à relancer, l'accueil n'a pas non plus de relecture
      // qui puisse échouer : le message de panne se tait avec.
      name: 'l’accueil ne relit rien',
      edits: [
        {
          file: TODAY,
          from: '      <PullToRefresh queries={CLIENT_SCREEN} />',
          to: '      <PullToRefresh queries={[]} />',
        },
      ],
      falls: [HOME, FAILED],
    },
    {
      name: 'le programme ne relit rien',
      edits: [
        {
          file: PROGRAM,
          from: '      <PullToRefresh queries={CLIENT_SCREEN} />',
          to: '      <PullToRefresh queries={[]} />',
        },
      ],
      falls: [PROGRAM_SEEN],
    },
    {
      name: '« À lire » ne relit rien',
      edits: [
        {
          file: INBOX,
          from: "  const pull = <PullToRefresh queries={[[...queryKeys.coach.all, 'inbox']]} />;",
          to: '  const pull = <PullToRefresh queries={[]} />;',
        },
      ],
      falls: [INBOX_SEEN],
    },
    {
      name: 'la liste des clients ne relit rien',
      edits: [
        {
          file: CLIENTS,
          from: '      <PullToRefresh queries={[queryKeys.coach.clients.lists()]} />',
          to: '      <PullToRefresh queries={[]} />',
        },
      ],
      falls: [CLIENTS_SEEN],
    },
  ],
};
