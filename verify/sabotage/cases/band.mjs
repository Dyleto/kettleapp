/** Les sabotages de `verify_band.mjs`. Voir `../run.mjs`. */
const RAIL = 'src/features/coach/components/SessionRail.tsx';
const SHEET = 'src/features/coach/components/SessionSheet.tsx';
const PAGE = 'src/features/coach/pages/ClientDetails.tsx';

export default {
  suite: 'verify_band.mjs',
  cases: [
    {
      // La pastille d'avant E7b : le rang, et rien d'autre.
      name: 'la carte ne dit plus que le rang',
      edits: [
        {
          file: RAIL,
          from: '      <Text fontWeight="700" fontSize="15px" lineClamp={1}>\n        {session.order} · {name}',
          to: '      <Text fontWeight="700" fontSize="15px" lineClamp={1}>\n        S{session.order}',
        },
      ],
      falls: [
        'chaque séance est une carte : son nom, sa durée, ses ressentis',
        '→ la bande se renumérote',
      ],
    },
    {
      name: 'la carte tait qu’une séance n’a jamais été faite',
      edits: [
        {
          file: 'src/domain/session/rail.ts',
          from: "  [durationLabel(session), tracked && !done ? 'jamais faite' : '']",
          to: '  [durationLabel(session)]',
        },
      ],
      falls: ['→ une séance jamais faite le dit, sans points'],
    },
    {
      name: 'la carte perd ses ressentis',
      edits: [
        {
          file: RAIL,
          from: '      {tracked && done ? (',
          to: '      {false ? (',
        },
      ],
      falls: ['chaque séance est une carte : son nom, sa durée, ses ressentis'],
    },
    {
      // Le geste du rail d'un grand écran, qui ne défile pas de côté.
      name: 'la carte retient le doigt : la bande ne défile plus',
      edits: [
        {
          file: RAIL,
          from: '      touchAction="manipulation"',
          to: '      touchAction="none"',
        },
      ],
      falls: [
        'un glissement bref fait défiler la bande, sans soulever ni déplacer de carte',
      ],
    },
    {
      // Sans appui long, tout glissement soulève une carte.
      name: 'une carte se soulève sans appui long',
      edits: [
        {
          file: RAIL,
          from: '      activationConstraint: { delay: 200, tolerance: 5 },',
          to: '      activationConstraint: { distance: 5 },',
        },
      ],
      falls: [
        'un glissement bref fait défiler la bande, sans soulever ni déplacer de carte',
      ],
    },
    {
      name: 'la bande oublie l’ordre où on a posé la carte',
      edits: [
        {
          file: RAIL,
          from: "        onDragEnd={handleDragEnd}\n        // La bande défile d'elle-même",
          to: "        onDragEnd={() => undefined}\n        // La bande défile d'elle-même",
        },
      ],
      falls: [
        'un appui long puis glisser déplace la séance, et le serveur reçoit le nouvel ordre',
        '→ la bande se renumérote',
      ],
    },
    {
      // Le cinquième de la bande, par défaut : elle file sous le doigt.
      name: 'la bande défile dès que le doigt approche du bord',
      edits: [
        {
          file: RAIL,
          from: '        autoScroll={{ threshold: { x: 0.1, y: 0 } }}\n',
          to: '',
        },
      ],
      falls: [
        'un appui long puis glisser déplace la séance, et le serveur reçoit le nouvel ordre',
        '→ la bande se renumérote',
      ],
    },
    {
      name: 'la séance ouverte reste hors de la bande',
      edits: [
        {
          file: RAIL,
          from: "      cardRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });",
          to: '      void 0;',
        },
      ],
      falls: ['ouverte par son adresse, la sixième se montre dans la bande'],
    },
    {
      name: 'l’en-tête de la séance reste sur téléphone',
      edits: [
        { file: PAGE, from: '                  sessionSheetOnPhone\n', to: '' },
      ],
      falls: [
        'l’en-tête de la séance laisse la place au « ⋯ » de la barre du haut',
      ],
    },
    {
      name: 'la feuille ne nomme plus le client',
      edits: [
        {
          file: PAGE,
          from: '            clientFirstName={client.firstName}\n',
          to: '',
        },
      ],
      falls: [
        '« ⋯ » ouvre la feuille : le nom, les jours, le mot, et le reste du menu',
      ],
    },
    {
      name: 'le nom tapé dans la feuille ne part nulle part',
      edits: [
        {
          file: SHEET,
          from: '            onRename(e.target.value.trim() ? e.target.value : undefined)',
          to: '            void e',
        },
      ],
      falls: [
        '→ le nom et les jours s’y règlent, et partent au serveur',
        '→ le nom tapé part au serveur',
      ],
    },
    {
      name: 'une action laisse la feuille ouverte',
      edits: [
        {
          file: SHEET,
          from: '                onClose();\n                action.onSelect();',
          to: '                action.onSelect();',
        },
      ],
      falls: ['→ une action referme la feuille, puis se fait'],
    },
    {
      name: '« + » sur téléphone n’ouvre pas la feuille',
      edits: [
        {
          file: PAGE,
          from: '                setSessionSheet({ focusName: true });\n',
          to: '',
        },
      ],
      falls: [
        '« + » ouvre la feuille de la séance neuve, son nom prêt à la frappe',
        '→ le nom tapé part au serveur',
      ],
    },
    {
      name: 'la feuille d’une séance neuve n’offre pas le nom à la frappe',
      edits: [
        {
          file: SHEET,
          from: '          autoFocus={focusName}',
          to: '          autoFocus={false}',
        },
      ],
      falls: [
        '« + » ouvre la feuille de la séance neuve, son nom prêt à la frappe',
        '→ le nom tapé part au serveur',
      ],
    },
    {
      // Le titre caché, ouvert à l'écriture sans pouvoir prendre le focus,
      // garde la demande et se rouvre sur un écran plus large.
      name: '« + » sur téléphone demande aussi le titre caché',
      edits: [
        {
          file: PAGE,
          from: '                addSession({ rename: false });',
          to: '                addSession();',
        },
      ],
      falls: ['→ et ne laisse aucun titre ouvert derrière elle'],
    },
  ],
};
