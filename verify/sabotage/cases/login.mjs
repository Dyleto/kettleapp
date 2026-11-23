/** Les sabotages de `verify_login.mjs`. Voir `../run.mjs`. */
const PAGE = 'src/features/auth/pages/Login.tsx';

const PROMISE = 'une promesse en une phrase, sous le nom du produit';
const ACTION =
  'l’action : Google, puis les deux chemins de qui n’a pas de compte, puis les pages légales';
const WIDE =
  'sur grand écran, deux volets : la promesse à gauche, l’action à droite dans 480 px';
const INVITE =
  'la feuille dit quoi faire, et « Continuer » attend un lien qui en a l’air';
const PASTE = '→ un lien collé ouvre l’invitation de son jeton';
const COPY = 'la feuille donne l’adresse, qui se copie d’une touche';
const GOOGLE = '→ « J’ai déjà un compte coach » part à la connexion Google';
const REFUSED = '→ une copie refusée sélectionne l’adresse, et le dit';
const SESSION = 'une session ouverte ne reste pas sur la connexion';

export default {
  suite: 'verify_login.mjs',
  cases: [
    {
      name: 'la promesse redit « Il ajuste »',
      edits: [
        {
          file: PAGE,
          from: "  'Ton coach écrit ta séance. Tu la suis pas à pas. Ton ressenti règle la suite.';",
          to: "  'Ton coach écrit ta séance. Tu la suis pas à pas. Il ajuste.';",
        },
      ],
      falls: [PROMISE],
    },
    {
      // Sans la rangée, aucune des feuilles du coach ne s'ouvre.
      name: '« Je suis coach » disparaît',
      edits: [
        {
          file: PAGE,
          from: '        <PathRow label="Je suis coach" onOpen={() => setPath(\'coach\')} />\n',
          to: '',
        },
      ],
      falls: [ACTION, COPY, GOOGLE, REFUSED],
    },
    {
      name: 'les pages légales ne se lisent plus avant de se connecter',
      edits: [{ file: PAGE, from: '        <LegalFooter />\n', to: '' }],
      falls: [ACTION],
    },
    {
      name: 'le volet de l’action s’élargit',
      edits: [
        {
          file: PAGE,
          from: '            w="480px"',
          to: '            w="560px"',
        },
      ],
      falls: [WIDE],
    },
    {
      name: '« Continuer » s’active sans lien',
      edits: [{ file: PAGE, from: '          disabled={!token}\n', to: '' }],
      falls: [INVITE],
    },
    {
      name: 'un texte qui n’est pas un lien ne dit rien',
      edits: [
        {
          file: PAGE,
          from: '        {pasted.trim() && !token && (',
          to: '        {false && (',
        },
      ],
      falls: [INVITE],
    },
    {
      name: '« Continuer » oublie le jeton',
      edits: [
        {
          file: PAGE,
          from: '          onClick={() => token && navigate(`/join?token=${token}`)}',
          to: "          onClick={() => token && navigate('/join')}",
        },
      ],
      falls: [PASTE],
    },
    {
      // Un jeton entier — soixante-quatre caractères — n'a plus l'air d'un
      // jeton ; un lien coupé, déjà refusé, le reste.
      name: 'un lien entier ne se reconnaît plus',
      edits: [
        {
          file: 'src/domain/invitation/link.ts',
          from: '  return /^[0-9a-f]{16,}$/i.test(token) ? token : null;',
          to: '  return /^[0-9a-f]{80,}$/i.test(token) ? token : null;',
        },
      ],
      falls: [PASTE],
    },
    {
      name: 'la copie ne copie rien',
      edits: [
        {
          file: PAGE,
          from: '      await navigator.clipboard.writeText(address);',
          to: "      await navigator.clipboard.writeText('');",
        },
      ],
      falls: [COPY],
    },
    {
      name: 'une copie refusée ne sélectionne pas l’adresse',
      edits: [
        {
          file: PAGE,
          from: '      if (field) window.getSelection()?.selectAllChildren(field);\n',
          to: '',
        },
      ],
      falls: [REFUSED],
    },
    {
      name: '« J’ai déjà un compte coach » referme seulement la feuille',
      edits: [
        {
          file: PAGE,
          from: '          onClick={() => loginWithGoogle()}',
          to: '          onClick={onClose}',
        },
      ],
      falls: [GOOGLE],
    },
    {
      name: 'une session ouverte reste sur la connexion',
      edits: [
        {
          file: PAGE,
          from: "    if (!isLoading && user) navigate('/');",
          to: "    if (false) navigate('/');",
        },
      ],
      falls: [SESSION],
    },
  ],
};
