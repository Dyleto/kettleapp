/** Les sabotages de `verify_unsent.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_unsent.mjs',
  cases: [
    {
      name: 'la fin ne marque pas la séance « à valider »',
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: '            writeProgress(activeSession._id, { finishedAt: Date.now() });',
          to: '',
        },
      ],
      falls: [
        'la fiche ne propose plus de la reprendre : « Dire comment c’était »',
        'l’accueil la dit « à valider », et non « en cours »',
        '→ « Dire comment c’était » rouvre le ressenti, seul',
        '→ envoyé, la séance quitte le téléphone',
      ],
    },
    {
      name: "l'accueil reprend une séance finie",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: "    ) : unfinished?.state === 'finished' ? (",
          to: '    ) : false ? (',
        },
      ],
      falls: [
        'l’accueil la dit « à valider », et non « en cours »',
        '→ « Dire comment c’était » rouvre le ressenti, seul',
        '→ envoyé, la séance quitte le téléphone',
      ],
    },
    {
      name: "« Dire comment c'était » n'ouvre pas le ressenti",
      edits: [
        {
          file: 'src/features/client/sheet/SessionScreen.tsx',
          from: "    dispatch({ type: 'resumeFeeling' });",
          to: '',
        },
      ],
      falls: [
        '→ « Dire comment c’était » rouvre le ressenti, seul',
        '→ envoyé, la séance quitte le téléphone',
      ],
    },
    {
      name: "sans réseau, l'envoi est quand même tenté",
      edits: [
        {
          file: 'src/features/client/common/useClientSessions.ts',
          from: '      if (!navigator.onLine) {',
          to: '      if (false) {',
        },
      ],
      falls: [
        'sans réseau, l’écran dit que le ressenti partira seul',
        '→ « Envoyer maintenant » sans réseau le dit, et garde tout',
      ],
    },
    {
      name: "une coupure en route n'est pas mise en attente",
      edits: [
        {
          file: 'src/features/client/common/useClientSessions.ts',
          from: '            if (!isNetworkCut(error)) {',
          to: '            if (true) {',
        },
      ],
      falls: [
        'la requête coupée met le ressenti en attente, sans parler d’échec',
        '→ « Envoyer maintenant » l’envoie, une fois',
      ],
    },
    {
      name: "le ressenti gardé n'a pas de date",
      edits: [
        {
          file: 'src/features/client/end/pending.ts',
          from: '      completedAt: feeling.completedAt ?? now.toISOString(),',
          to: "      completedAt: feeling.completedAt ?? '',",
        },
      ],
      falls: [
        '→ il est gardé sur le téléphone, daté de maintenant',
        'l’accueil le dit en attente de réseau',
        '→ « Envoyer maintenant » sans réseau le dit, et garde tout',
        'au retour du réseau, il part seul, tel qu’il a été dit',
        '→ « Séance envoyée », et la carte d’attente s’en va',
        // La coupure en route lit le stockage brut, où le ressenti sans date
        // est bien écrit : c'est la lecture qui l'écarte, et l'accueil qui
        // n'a plus rien à envoyer.
        '→ « Envoyer maintenant » l’envoie, une fois',
      ],
    },
    {
      name: "le retour du réseau n'envoie rien",
      edits: [
        {
          file: 'src/features/client/end/pending.ts',
          from: "    window.addEventListener('online', onOnline);",
          to: '',
        },
      ],
      falls: [
        'au retour du réseau, il part seul, tel qu’il a été dit',
        '→ « Séance envoyée », et la carte d’attente s’en va',
      ],
    },
    {
      name: "la carte d'attente reste après l'envoi",
      edits: [
        {
          file: 'src/features/client/home/Today.tsx',
          from: '    [sessions, history]',
          to: '    [sessions]',
        },
      ],
      falls: ['→ « Séance envoyée », et la carte d’attente s’en va'],
    },
    {
      name: '« Envoyer maintenant » sans réseau ne dit rien',
      edits: [
        {
          file: 'src/features/client/end/pending.ts',
          from: "        title: 'Toujours pas de réseau',",
          to: "        title: '',",
        },
      ],
      falls: ['→ « Envoyer maintenant » sans réseau le dit, et garde tout'],
    },
    {
      name: '« Envoyer maintenant » tente sans réseau',
      edits: [
        {
          file: 'src/features/client/end/pending.ts',
          from: '    if (!navigator.onLine) return [];',
          to: '    if (false) return [];',
        },
      ],
      falls: ['→ « Envoyer maintenant » sans réseau le dit, et garde tout'],
    },
    {
      name: 'le bilan part sans sa clé d’envoi',
      edits: [
        {
          file: 'src/features/client/end/sending.ts',
          from: '    ...(sendKey ? { sendKey } : {}),\n',
          to: '',
        },
      ],
      falls: [
        'la réponse perdue met le ressenti en attente, avec la clé de l’envoi',
        '→ le renvoi porte la même clé, et la séance ne compte qu’une fois',
      ],
    },
    {
      name: 'la clé n’est pas gardée avant l’envoi',
      edits: [
        {
          file: 'src/features/client/end/sendKey.ts',
          from: '  writeProgress(sessionId, { sendKey });\n',
          to: '',
        },
      ],
      falls: [
        'la réponse perdue met le ressenti en attente, avec la clé de l’envoi',
        '→ le renvoi porte la même clé, et la séance ne compte qu’une fois',
      ],
    },
    {
      name: 'la clé gardée ne se relit pas',
      edits: [
        {
          file: 'src/features/client/guided/sessionProgress.ts',
          from: '      sendKey: isSendKey(stored.sendKey) ? stored.sendKey : undefined,',
          to: '      sendKey: undefined,',
        },
      ],
      falls: [
        'la réponse perdue met le ressenti en attente, avec la clé de l’envoi',
        '→ le renvoi porte la même clé, et la séance ne compte qu’une fois',
      ],
    },
  ],
};
