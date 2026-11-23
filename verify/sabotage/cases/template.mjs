/** Les sabotages de `verify_template.mjs`. Voir `../run.mjs`. */
const CARD = 'src/features/template/components/TemplateCard.tsx';
const PAGE = 'src/features/template/pages/Templates.tsx';
const CARDS =
  'une carte montre ses séances : rang, nom, et un segment par bloc';
const DUPLICATED =
  '« Dupliquer » : la copie entre en tête, avec les mêmes séances';
const RENAMED = '« Renommer » part du nom actuel, et la carte prend le nouveau';
const MORE = 'au-delà de quatre séances, la carte dit combien il en reste';
const USED = 'un modèle importé chez un client le dit sur sa carte';
const CREATE_EMPTY = '→ et de quoi en créer un';
const OPENED_EMPTY = '→ vide, et il le dit';
const DETAILS = 'src/features/template/pages/TemplateDetails.tsx';

export default {
  suite: 'verify_template.mjs',
  cases: [
    {
      name: 'le titre redevient un paragraphe',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '            as="h1"\n            fontWeight="800"',
          to: '            fontWeight="800"',
        },
      ],
      falls: ["l'écran porte le nom de son onglet"],
    },
    {
      name: "le titre ne porte plus le nom de l'onglet",
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '            Modèles\n          </Text>',
          to: '            Modèles de programme\n          </Text>',
        },
      ],
      falls: ["l'écran porte le nom de son onglet"],
    },
    {
      name: '« Nouveau » redevient bleu',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '          <ActionButton ml="auto" size="sm" onClick={() => setCreating(true)}>',
          to: '          <ActionButton ml="auto" size="sm" bg="blue.500" onClick={() => setCreating(true)}>',
        },
      ],
      falls: ["« Nouveau » est à la couleur de l'application"],
    },
    {
      name: "le rail d'un modèle reparle d'un client",
      edits: [
        {
          file: 'src/features/coach/components/SessionRail.tsx',
          from: 'tracked={history !== undefined}\n                history={history ?? []}\n                onSelect={() => onSelect(index)}\n                sortable={!!onReorder}\n                actions=',
          to: 'tracked\n                history={history ?? []}\n                onSelect={() => onSelect(index)}\n                sortable={!!onReorder}\n                actions=',
        },
      ],
      falls: ["le rail d'un modèle ne dit rien de ce qu'un client aurait fait"],
    },
    {
      name: 'le rail ne dit plus rien à personne',
      edits: [
        {
          file: 'src/features/coach/components/SessionRail.tsx',
          from: '  const line = railLine(session, { tracked, done });',
          to: '  const line = railLine(session, { tracked: false, done });',
        },
      ],
      falls: ['→ et que son rail dit bien ce qui n’a jamais été fait'],
    },
    {
      // Le menu ne demande plus à la page si elle a de quoi copier.
      name: '« Copier vers un client… » s’offre aussi dans un modèle',
      edits: [
        {
          file: 'src/features/coach/hooks/useSessionMenu.tsx',
          from: "      onCopy && {\n        value: 'copy',",
          to: "      {\n        value: 'copy',",
        },
      ],
      falls: [
        "le menu d'une séance de modèle ne propose pas « copier vers un client »",
      ],
    },
    {
      name: '« Copier vers un client… » disparaît partout',
      edits: [
        {
          file: 'src/features/coach/hooks/useSessionMenu.tsx',
          from: "      onCopy && {\n        value: 'copy',",
          to: "      false && {\n        value: 'copy',",
        },
      ],
      falls: ['→ alors que celui d’un client la propose'],
    },
    {
      name: 'la liste vide perd son personnage',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: '            mood="hello"\n',
          to: '',
        },
      ],
      falls: ['→ avec le personnage'],
    },
    {
      name: 'la liste vide ne dit plus à quoi sert un modèle',
      edits: [
        {
          file: 'src/features/template/pages/Templates.tsx',
          from: 'title="Écris-le une fois"',
          to: 'title="Aucun modèle"',
        },
      ],
      falls: ['sans modèle, la liste dit à quoi ils servent'],
    },
    {
      name: 'une carte montre ses séances à rebours',
      edits: [
        {
          file: CARD,
          from: '          {template.preview.map((session) => (',
          to: '          {[...template.preview].reverse().map((session) => (',
        },
      ],
      falls: [CARDS],
    },
    {
      name: 'la barre d’une séance ne compte qu’un bloc',
      edits: [
        {
          file: CARD,
          from: '                  blocks={session.blockTypes.map((type, index) => ({',
          to: '                  blocks={session.blockTypes.slice(0, 1).map((type, index) => ({',
        },
      ],
      falls: [CARDS],
    },
    {
      name: '« + 2 séances » ne se dit plus',
      edits: [
        {
          file: 'src/domain/template/card.ts',
          from: '  const rest =\n    template.sessionCount - Math.min(PREVIEW_SESSIONS, template.preview.length);',
          to: '  const rest = 0;',
        },
      ],
      falls: [MORE],
    },
    {
      name: 'un modèle importé se dit jamais utilisé',
      edits: [
        {
          file: 'src/domain/template/card.ts',
          from: '    template.usageCount === 0',
          to: '    true',
        },
      ],
      falls: [USED],
    },
    {
      // Sans copie, rien à renommer ensuite.
      name: '« Dupliquer » ne fait rien',
      edits: [
        {
          file: CARD,
          from: '              onSelect: onDuplicate,',
          to: '              onSelect: () => undefined,',
        },
      ],
      falls: [DUPLICATED, RENAMED, MORE],
    },
    {
      name: 'la copie n’apparaît qu’au rechargement',
      edits: [
        {
          file: 'src/features/template/hooks/useTemplateMutations.ts',
          from: '    mutationFn: (templateId: string) => templateService.duplicate(templateId),\n    onSuccess: () =>\n      queryClient.invalidateQueries({\n        queryKey: queryKeys.coach.templates.all(),\n      }),',
          to: '    mutationFn: (templateId: string) => templateService.duplicate(templateId),\n    onSuccess: () => undefined,',
        },
      ],
      falls: [DUPLICATED, RENAMED],
    },
    {
      name: '« Renommer » part d’un champ vide',
      edits: [
        {
          file: PAGE,
          from: '          initial={renaming.name}\n',
          to: '',
        },
      ],
      falls: [RENAMED],
    },
    {
      name: '« Renommer » renvoie l’ancien nom',
      edits: [
        {
          file: PAGE,
          from: '              { id: renaming._id, name },',
          to: '              { id: renaming._id, name: renaming.name },',
        },
      ],
      falls: [RENAMED],
    },
    {
      name: 'la liste vide ne propose plus de créer',
      edits: [
        {
          file: PAGE,
          from: '                <ActionButton size="md" onClick={() => setCreating(true)}>\n                  <LuPlus size={18} />\n                  Créer un modèle\n                </ActionButton>\n',
          to: '',
        },
      ],
      falls: [CREATE_EMPTY],
    },
    {
      // L'assertion attend le texte plutôt que le calme du réseau : sans
      // lui, elle doit tomber au bout de l'attente, pas passer.
      name: 'un modèle vide ne le dit plus',
      edits: [
        {
          file: DETAILS,
          from: '              title="Ce modèle est vide"',
          to: '              title="Aucune séance"',
        },
      ],
      falls: [OPENED_EMPTY],
    },
  ],
};
