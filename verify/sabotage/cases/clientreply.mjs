/** Les sabotages de `verify_clientreply.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_clientreply.mjs',
  cases: [
    {
      name: 'l’accueil ne montre plus la réponse',
      edits: [
        {
          file: 'src/features/client/home/LastSessionCard.tsx',
          from: '      {reply && (\n        <Box px="18px" pb="18px" mt="-8px">',
          to: '      {false && (\n        <Box px="18px" pb="18px" mt="-8px">',
        },
      ],
      falls: [
        'la réponse en bulle, réaction comprise, à la place de « pas encore lue »',
        'à la visite suivante, la bulle reste, sans « Nouveau »',
        'la plus récente en bulle, avec « Nouveau »',
      ],
    },
    {
      name: 'la réponse ne remplace plus la question',
      edits: [
        {
          file: 'src/features/client/home/LastSessionCard.tsx',
          from: '        {!reply && (note || !completed.viewedByCoach) && (',
          to: '        {(note || !completed.viewedByCoach) && (',
        },
      ],
      falls: [
        'la réponse en bulle, réaction comprise, à la place de « pas encore lue »',
      ],
    },
    {
      name: 'plus de « Nouveau »',
      edits: [
        {
          file: 'src/features/client/home/LastSessionCard.tsx',
          from: '          {reply && fresh && <Chip tone="amber">Nouveau</Chip>}',
          to: '',
        },
      ],
      falls: [
        '→ « Nouveau », tant qu’il ne l’a pas vue',
        '→ « Nouveau » tient le temps de la visite',
        'la plus récente en bulle, avec « Nouveau »',
      ],
    },
    {
      // La lecture revient avant que l'écran soit lu : la pastille ne se
      // voit jamais, à aucune visite.
      name: '« Nouveau » s’éteint sous les yeux',
      edits: [
        {
          file: 'src/features/client/home/LastSessionCard.tsx',
          from: '  const [fresh] = useState(() => hasUnread(completed.replies));',
          to: '  const fresh = hasUnread(completed.replies);',
        },
      ],
      falls: [
        '→ « Nouveau », tant qu’il ne l’a pas vue',
        '→ « Nouveau » tient le temps de la visite',
        'la plus récente en bulle, avec « Nouveau »',
      ],
    },
    {
      name: 'l’accueil ne déclare plus la lecture',
      edits: [
        {
          file: 'src/features/client/home/LastSessionCard.tsx',
          from: '    markRead(completed._id);\n',
          to: '',
        },
      ],
      falls: [
        '→ la voir, c’est l’avoir lue : le serveur le sait',
        'à la visite suivante, la bulle reste, sans « Nouveau »',
      ],
    },
    {
      name: 'l’accueil montre la première réponse, pas la dernière',
      edits: [
        {
          file: 'src/features/client/home/LastSessionCard.tsx',
          from: '  const reply = latestReply(completed.replies);',
          to: '  const reply = completed.replies[0];',
        },
      ],
      falls: ['la plus récente en bulle, avec « Nouveau »'],
    },
    {
      name: 'le détail ne montre plus la réponse',
      edits: [
        {
          file: 'src/features/client/progress/CompletedDetail.tsx',
          from: '              {replyLine(reply)}',
          to: "              {''}",
        },
      ],
      // Le détail du client n'est pas celui des ressentis du coach (E11c) :
      // il tombe côté client, et dans l'aperçu de la liste des clients.
      falls: [
        'dans le détail de la séance, la même bulle, sous son mot',
        'dans l’aperçu d’un client, le coach voit ses réponses sans les marquer lues',
      ],
    },
    {
      name: 'le coach lit à la place du client',
      edits: [
        {
          file: 'src/features/client/progress/CompletedDetail.tsx',
          from: '    if (self && hasUnread(completed.replies)) markRead(completed._id);',
          to: '    if (hasUnread(completed.replies)) markRead(completed._id);',
        },
      ],
      // Le coach n'ouvre ce détail que dans l'aperçu de la liste des
      // clients : c'est là que la garde s'éprouve depuis E11c.
      falls: [
        'dans l’aperçu d’un client, le coach voit ses réponses sans les marquer lues',
      ],
    },
    {
      name: 'les ressentis du coach ne montrent plus ses réponses',
      edits: [
        {
          file: 'src/features/coach/inbox/ReplyThread.tsx',
          from: '          <Bubble tone="raised">{replyLine(reply)}</Bubble>',
          to: '          <Bubble tone="raised">{\'\'}</Bubble>',
        },
      ],
      falls: [
        'le coach voit ses réponses dans le détail, sans les marquer lues',
      ],
    },
  ],
};
