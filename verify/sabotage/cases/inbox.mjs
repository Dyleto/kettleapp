/** Les sabotages de `verify_inbox.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_inbox.mjs',
  cases: [
    {
      name: 'le fil suit l’ordre de l’API',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: '            feedOf(unread.data.items).map((entry) =>',
          to: "              unread.data.items.map((item) => ({ kind: 'card' as const, item })).map((entry) =>",
        },
      ],
      falls: [
        'ce qui fait mal, puis ce qui est mal réglé, puis le reste par date',
        'trois séances « Juste » de Thomas tiennent en une ligne',
        '→ la toucher les déplie',
      ],
    },
    {
      name: 'une douleur ne fait plus passer devant',
      edits: [
        {
          file: 'src/domain/inbox/feed.ts',
          from: "  if (effort === 5 || tags.includes('pain')) return 'alert';",
          to: "  if (effort === 5) return 'alert';",
        },
      ],
      falls: [
        'ce qui fait mal, puis ce qui est mal réglé, puis le reste par date',
      ],
    },
    {
      name: 'les séances calmes ne se replient plus',
      edits: [
        {
          file: 'src/domain/inbox/feed.ts',
          from: '    if (quiet.length < 2) continue;',
          to: '    if (quiet.length < 4) continue;',
        },
      ],
      falls: [
        'ce qui fait mal, puis ce qui est mal réglé, puis le reste par date',
        'trois séances « Juste » de Thomas tiennent en une ligne',
        '→ la toucher les déplie',
      ],
    },
    {
      name: 'la ligne repliée ne se déplie pas',
      edits: [
        {
          file: 'src/features/coach/inbox/QuietFold.tsx',
          from: '      {open &&',
          to: '      {false &&',
        },
      ],
      falls: ['→ la toucher les déplie'],
    },
    {
      name: 'le « trop facile » répété ne se dit plus',
      edits: [
        {
          file: 'src/domain/inbox/feed.ts',
          from: "  if (concernOf(item) === 'repeatedEasy')\n",
          to: '  if (false)\n',
        },
      ],
      falls: ['sans mot, un « trop facile » répété se dit'],
    },
    {
      name: 'un client sans compte n’a plus de nom',
      edits: [
        {
          file: 'src/domain/inbox/feed.ts',
          from: "  'Client sans nom';",
          to: "  '';",
        },
      ],
      falls: [
        'ce qui fait mal, puis ce qui est mal réglé, puis le reste par date',
        'un compte disparu : « Client sans nom », initiales « ? »',
        'trois pastilles au plus, puis « + 2 »',
      ],
    },
    {
      name: 'un client sans nom n’a plus d’initiales',
      edits: [
        {
          file: 'src/features/coach/inbox/InboxCard.tsx',
          from: "        {client.firstName || client.lastName ? undefined : '?'}",
          to: '        {undefined}',
        },
      ],
      falls: ['un compte disparu : « Client sans nom », initiales « ? »'],
    },
    {
      name: 'les pastilles ne disent plus ce qui reste',
      edits: [
        {
          file: 'src/features/coach/inbox/InboxCard.tsx',
          from: '          {more > 0 && <Chip tone="outline">+ {more}</Chip>}',
          to: '',
        },
      ],
      falls: ['trois pastilles au plus, puis « + 2 »'],
    },
    {
      name: 'les pastilles de fait disparaissent',
      edits: [
        {
          file: 'src/features/coach/inbox/InboxCard.tsx',
          from: '  const { chips, more } = doneChips(item);',
          to: '  const { chips, more } = { chips: [] as DoneChip[], more: 0 };',
        },
      ],
      falls: [
        'qui, quoi, comment c’était, son mot, ce qui a bougé',
        'trois pastilles au plus, puis « + 2 »',
      ],
    },
    {
      name: 'un ancien bilan ne se dit plus',
      edits: [
        {
          file: 'src/features/coach/inbox/InboxCard.tsx',
          from: "      {effort ? effort.label : 'ancien bilan'}",
          to: "      {effort ? effort.label : ''}",
        },
      ],
      falls: ['un ancien bilan le dit, sans inventer d’effort'],
    },
    {
      name: 'la douleur se lit où elle tombe',
      edits: [
        {
          file: 'src/features/coach/inbox/InboxCard.tsx',
          from: '  const tags = tagsInOrder(completed.feedback?.tags);',
          to: '  const tags = completed.feedback?.tags ?? [];',
        },
      ],
      falls: ['la douleur se lit la première'],
    },
    {
      name: '« Déjà lues » se charge à chaque visite',
      edits: [
        {
          file: 'src/features/coach/pages/Inbox.tsx',
          from: "  const read = useInbox('read', showRead);",
          to: "  const read = useInbox('read');",
        },
      ],
      falls: ['« Déjà lues » se charge à la demande, et montre ce qui est lu'],
    },
  ],
};
