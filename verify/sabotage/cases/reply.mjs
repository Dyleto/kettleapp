/** Les sabotages de `verify_reply.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_reply.mjs',
  cases: [
    {
      name: 'toucher de nouveau ne retire plus la réaction',
      edits: [
        {
          file: 'src/features/coach/inbox/InboxCard.tsx',
          from: '        body: { reaction: toggledReaction(reacted, key) },',
          to: '        body: { reaction: key },',
        },
      ],
      falls: ['toucher de nouveau la retire'],
    },
    {
      name: 'aucune réaction ne s’allume',
      edits: [
        {
          file: 'src/domain/inbox/reply.ts',
          from: '  return mine && !mine.readAt ? mine.reaction : undefined;',
          to: '  return undefined;',
        },
      ],
      falls: ['la réaction part, et s’allume', 'toucher de nouveau la retire'],
    },
    {
      name: 'l’écran ne sait plus quelles réponses sont les siennes',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '  const coachId = useAuth().user?.coachId;',
          to: '  const coachId = undefined as string | undefined;',
        },
      ],
      falls: [
        'la réaction part, et s’allume',
        'toucher de nouveau la retire',
        '→ « Envoyer à Sarah » envoie le texte, la réaction déjà posée avec',
        '→ la réponse se relit dans la séance ouverte, « pas encore lue »',
      ],
    },
    {
      // La carte part avec ses boutons : la réaction ne s'allume plus nulle
      // part, et la partie suivante n'hérite d'aucune réaction posée.
      name: 'la carte réagie disparaît sous le doigt',
      edits: [
        {
          file: 'src/features/coach/hooks/useInboxActions.ts',
          from: "    queryKey: [...queryKeys.coach.all, 'inbox'],\n    refetchType: 'none',",
          to: "    queryKey: [...queryKeys.coach.all, 'inbox'],",
        },
      ],
      falls: [
        'la réaction part, et s’allume',
        '→ la carte reste à sa place pendant qu’on la lit',
        'toucher de nouveau la retire',
        '→ « Envoyer à Sarah » envoie le texte, la réaction déjà posée avec',
        '→ la réponse se relit dans la séance ouverte, « pas encore lue »',
        '→ la séance est lue, mais la carte reste jusqu’au prochain chargement',
      ],
    },
    {
      name: 'une réponse toute faite ne remplit plus le champ',
      edits: [
        {
          file: 'src/features/coach/inbox/ReplyComposer.tsx',
          from: '              setText((was) => (was.trim() ? `${was.trim()} ${quick}` : quick))',
          to: '              setText((was) => was)',
        },
      ],
      falls: [
        'la feuille s’ouvre, et une réponse toute faite remplit le champ',
        '→ « Envoyer à Sarah » envoie le texte, la réaction déjà posée avec',
        '→ la réponse se relit dans la séance ouverte, « pas encore lue »',
      ],
    },
    {
      name: 'le brouillon oublie la réaction déjà posée',
      edits: [
        {
          file: 'src/features/coach/inbox/ReplyComposer.tsx',
          from: '  const [reaction, setReaction] = useState<Reaction | undefined>(\n    editable?.reaction\n  );',
          to: '  const [reaction, setReaction] = useState<Reaction | undefined>(undefined);',
        },
      ],
      falls: [
        '→ « Envoyer à Sarah » envoie le texte, la réaction déjà posée avec',
      ],
    },
    {
      name: 'la feuille reste ouverte après l’envoi',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '              onSent={() => setReplyItem(null)}',
          to: '              onSent={() => {}}',
        },
      ],
      falls: [
        '→ « Envoyer à Sarah » envoie le texte, la réaction déjà posée avec',
        '→ la réponse se relit dans la séance ouverte, « pas encore lue »',
      ],
    },
    {
      name: 'la réponse partie ne dit plus si elle est lue',
      edits: [
        {
          file: 'src/features/coach/inbox/InboxDetail.tsx',
          from: '              {sentLabel(reply, client.firstName)}',
          to: "              {''}",
        },
      ],
      falls: [
        '→ la réponse se relit dans la séance ouverte, « pas encore lue »',
      ],
    },
    {
      name: 'un tremblement suffit à lire',
      edits: [
        {
          file: 'src/features/coach/inbox/Swipeable.tsx',
          from: 'const THRESHOLD = 96;',
          to: 'const THRESHOLD = 20;',
        },
      ],
      falls: ['un glissement trop court ne lit rien'],
    },
    {
      name: 'la carte glissée reste dans le fil',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '    if (before)\n      queryClient.setQueryData<InboxData>(key, {',
          to: '    if (false)\n      queryClient.setQueryData<InboxData>(key, {',
        },
      ],
      falls: ['glisser une carte la lit sans répondre, et la retire du fil'],
    },
    {
      name: '« Annuler » ne remet pas la carte',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '        if (before) queryClient.setQueryData(key, before);\n',
          to: '',
        },
      ],
      falls: ['→ « Annuler » la remet, et le dit au serveur'],
    },
    {
      name: '« Annuler » ne le dit pas au serveur',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '        markViewed.mutate({ ids, viewed: false });\n',
          to: '',
        },
      ],
      falls: ['→ « Annuler » la remet, et le dit au serveur'],
    },
    {
      name: 'ouvrir une carte ne la lit plus',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '    if (!item.completed.viewedByCoach)\n      markViewed.mutate({ ids: [item.completed._id], viewed: true });\n',
          to: '',
        },
      ],
      falls: [
        '→ la séance est lue, mais la carte reste jusqu’au prochain chargement',
      ],
    },
    {
      name: 'le grand écran ouvre aussi une feuille',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '  const wide = useBreakpointValue({ base: false, xl: true }) ?? false;',
          to: '  const wide = false;',
        },
      ],
      falls: ['à partir de 1 280 px, elle s’ouvre dans le panneau de droite'],
    },
    {
      name: '« Ajuster » mène à la liste des clients',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '      COACH_ROUTES.clientSession(item.client._id, item.completed.sessionOrder)',
          to: '      COACH_ROUTES.clients',
        },
      ],
      falls: ['« Ajuster » ouvre l’atelier du client sur cette séance'],
    },
  ],
};
