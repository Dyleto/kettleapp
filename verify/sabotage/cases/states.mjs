/** Les sabotages de `verify_states.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_states.mjs',
  cases: [
    {
      name: 'la porte ne montre jamais la panne',
      edits: [
        {
          file: 'src/features/client/shell/ClientProgramBoundary.tsx',
          from: 'if (clientSessions.isUnavailable) {',
          to: 'if (clientSessions.isUnavailable && false) {',
        },
      ],
      falls: [
        "l'accueil dit que Kettle ne répond pas",
        '→ et non que le programme est vide',
        "→ et l'annonce à un lecteur d'écran",
        'le programme aussi',
        "l'historique aussi",
        '« Réessayer » ramène le programme',
        "la fiche d'une séance dit la panne",
        "l'accueil dit la panne",
        '→ et ne désigne aucune séance',
        'la panne est dite sans attendre',
        '→ et non un programme vide',
      ],
    },
    {
      name: "l'indisponibilité ne regarde que isError",
      edits: [
        {
          file: 'src/features/client/common/useClientSessions.ts',
          from: 'hasNothingToShow(programQuery) || hasNothingToShow(historyQuery)',
          to: 'programQuery.isError || historyQuery.isError',
        },
      ],
      falls: ['la panne est dite sans attendre', '→ et non un programme vide'],
    },
    {
      name: "l'historique ne compte plus",
      edits: [
        {
          file: 'src/features/client/common/useClientSessions.ts',
          from: 'hasNothingToShow(programQuery) || hasNothingToShow(historyQuery)',
          to: 'hasNothingToShow(programQuery)',
        },
      ],
      falls: ["l'accueil dit la panne", '→ et ne désigne aucune séance'],
    },
    {
      name: 'la garde de « Séance introuvable » retirée',
      edits: [
        {
          file: 'src/features/client/common/useClientSessions.ts',
          from: 'if (isProgramKnown && !isLoading && sessionId && !activeSession) {',
          to: 'if (!isLoading && sessionId && !activeSession) {',
        },
      ],
      falls: [
        "→ sans prétendre que la séance n'existe plus",
        "→ et sans quitter l'adresse demandée",
      ],
    },
    {
      name: 'le compte passe sous la porte',
      edits: [
        {
          file: 'src/App.tsx',
          from: '          <Route path="history" element={<History />} />\n        </Route>\n        <Route path="account" element={<Account space="client" />} />',
          to: '          <Route path="history" element={<History />} />\n          <Route path="account" element={<Account space="client" />} />\n        </Route>',
        },
      ],
      falls: [
        '→ sans même demander le programme',
        'la panne est dite sans attendre',
      ],
    },
    {
      name: 'les refus sont de nouveau retentés',
      edits: [
        {
          file: 'src/shared/config/queryClient.ts',
          from: 'retry: (failureCount, error) => !isRefusal(error) && failureCount < 3,',
          to: 'retry: 3,',
        },
      ],
      falls: [
        'un client inconnu est dit introuvable, sans attendre',
        '→ avec le chemin pour repartir',
      ],
    },
    {
      name: 'un 404 est pris pour une panne',
      edits: [
        {
          file: 'src/kit/LoadFailure.tsx',
          from: 'missing && isNotFound(query.error) ? (',
          to: 'missing && false ? (',
        },
      ],
      falls: [
        'un client inconnu est dit introuvable, sans attendre',
        '→ sans proposer de réessayer',
        '→ avec le chemin pour repartir',
      ],
    },
    {
      name: 'la liste des clients retombe sur sa liste vide',
      edits: [
        {
          file: 'src/features/coach/pages/Clients.tsx',
          from: '  ) : isUnavailable(clientsQuery) ? (',
          to: '  ) : isUnavailable(clientsQuery) && false ? (',
        },
      ],
      falls: [
        'la liste des clients dit la panne',
        "→ et non qu'il n'y a aucun client",
      ],
    },
    {
      name: "l'atelier retombe sur sa page blanche",
      edits: [
        {
          file: 'src/features/coach/pages/ClientDetails.tsx',
          from: 'if (isUnavailable(clientQuery)) {',
          to: 'if (isUnavailable(clientQuery) && false) {',
        },
      ],
      falls: [
        'un client inconnu est dit introuvable, sans attendre',
        '→ avec le chemin pour repartir',
        "l'atelier dit la panne au lieu d'une page blanche",
      ],
    },
    {
      name: 'le personnage est annoncé',
      edits: [
        {
          file: 'src/kit/Mascot.tsx',
          from: '    aria-hidden\n',
          to: '',
        },
      ],
      falls: ["→ que les lecteurs d'écran n'annoncent pas"],
    },
    {
      name: "l'accueil vide perd son personnage",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '            mood="sleep"\n',
          to: '',
        },
      ],
      falls: ['→ avec le personnage endormi'],
    },
    {
      name: "la panne n'est plus annoncée",
      edits: [
        {
          file: 'src/kit/ErrorState.tsx',
          from: '<Box role="alert">',
          to: '<Box>',
        },
      ],
      falls: ["→ et l'annonce à un lecteur d'écran"],
    },
    {
      name: 'une adresse inconnue est prise pour un plantage',
      edits: [
        {
          file: 'src/shared/components/RouteError.tsx',
          from: 'const notFound = isRouteErrorResponse(error) && error.status === 404;',
          to: 'const notFound = false && isRouteErrorResponse(error);',
        },
      ],
      falls: [
        "une page inconnue dit qu'elle n'existe pas",
        '→ sans proposer de recharger',
        "→ et son bouton ramène à l'accueil",
      ],
    },
    {
      name: 'un toast redit la panne',
      edits: [
        {
          file: 'src/features/coach/pages/Clients.tsx',
          from: "import { useState } from 'react';",
          to: "import { useEffect, useState } from 'react';",
        },
        {
          file: 'src/features/coach/pages/Clients.tsx',
          from: "  const [query, setQuery] = useState('');",
          to: "  useEffect(() => {\n    if (clientsQuery.error) toaster.create({ title: 'Impossible de charger vos clients', type: 'error', duration: 60000 });\n  }, [clientsQuery.error]);\n  const [query, setQuery] = useState('');",
        },
      ],
      falls: ['→ une seule fois : aucun toast ne la redit'],
    },
    {
      name: "l'historique vide perd son bouton",
      edits: [
        {
          file: 'src/features/client/progress/History.tsx',
          from: 'onClick={() => navigate(CLIENT_ROUTES.program)}',
          to: 'onClick={() => {}}',
        },
      ],
      falls: ['→ et son bouton mène au programme'],
    },
  ],
};
