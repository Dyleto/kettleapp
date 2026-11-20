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
      // La réponse partie n'a plus son 🔥 : la bulle relue dans la séance
      // ouverte, que l'assertion cherche avec son émoji, tombe avec elle.
      falls: [
        '→ « Envoyer à Sarah » envoie le texte, la réaction déjà posée avec',
        '→ la réponse se relit dans la séance ouverte, « pas encore lue »',
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
          file: 'src/features/coach/inbox/ReplyThread.tsx',
          from: '            {sentLabel(reply, item.client.firstName)}',
          to: "            {''}",
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
          from: '      COACH_ROUTES.clientSession(\n        item.client._id,\n        item.completed.sessionOrder,\n        concernedExercise(item)\n      )',
          to: '      COACH_ROUTES.clients',
        },
      ],
      falls: [
        '« Ajuster » ouvre l’atelier du client sur cette séance',
        'l’exercice que le client cite s’ouvre, à l’écran',
        '→ sur téléphone, ses réglages en feuille, prêts à changer',
      ],
    },
    {
      // « Ajuster » retombe sur la séance, en haut, comme avant E5c.
      name: '« Ajuster » ne désigne plus d’exercice',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '        concernedExercise(item)\n',
          to: '',
        },
      ],
      falls: [
        'l’exercice que le client cite s’ouvre, à l’écran',
        '→ sur téléphone, ses réglages en feuille, prêts à changer',
      ],
    },
    {
      // « fente » ne se lit plus dans « Fentes marchées ».
      name: 'le mot du client se lit sans ramener le pluriel au singulier',
      edits: [
        {
          file: 'src/domain/inbox/concerned.ts',
          from: "    .map((word) => word.replace(/[sx]$/, ''));",
          to: '    .map((word) => word);',
        },
      ],
      falls: [
        'l’exercice que le client cite s’ouvre, à l’écran',
        '→ sur téléphone, ses réglages en feuille, prêts à changer',
      ],
    },
    {
      name: 'l’atelier lit un autre nom dans l’adresse',
      edits: [
        {
          file: 'src/features/coach/pages/ClientDetails.tsx',
          from: "  const focusExerciseId = useSearchParams()[0].get('exercise') ?? undefined;",
          to: "  const focusExerciseId = useSearchParams()[0].get('exercice') ?? undefined;",
        },
      ],
      falls: [
        'l’exercice que le client cite s’ouvre, à l’écran',
        '→ sur téléphone, ses réglages en feuille, prêts à changer',
      ],
    },
    {
      name: 'l’exercice désigné ne s’ouvre pas',
      edits: [
        {
          file: 'src/features/coach/components/ClientProgramTab.tsx',
          from: '  } | null>(focused);',
          to: '  } | null>(null);',
        },
      ],
      falls: [
        'l’exercice que le client cite s’ouvre, à l’écran',
        '→ sur téléphone, ses réglages en feuille, prêts à changer',
      ],
    },
    {
      // Ouvert, mais sous la ligne de flottaison : le coach ne le voit pas.
      name: 'l’exercice désigné s’ouvre hors de l’écran',
      edits: [
        {
          file: 'src/features/workshop/components/ExerciseRow.tsx',
          from: "    if (reveal) rootRef.current?.scrollIntoView({ block: 'center' });",
          to: '    if (reveal) void rootRef;',
        },
      ],
      falls: ['l’exercice que le client cite s’ouvre, à l’écran'],
    },
  ],
};
