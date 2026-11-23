/** Les sabotages de `verify_a11y.mjs`. Voir `../run.mjs`. */
const WORKSHOP = 'src/features/coach/pages/ClientDetails.tsx';
const JOURNAL = 'src/features/coach/pages/ClientJournal.tsx';
const LEGAL = 'src/features/legal/pages/LegalLayout.tsx';
const THEME = 'src/theme.ts';
const MENU = 'src/shared/components/Header.tsx';
const PROGRAM = 'src/features/client/program/Program.tsx';
const TEMPLATES = 'src/features/template/pages/Templates.tsx';
const TEMPLATE_CARD = 'src/features/template/components/TemplateCard.tsx';

const ONE_H1_WIDE =
  'grand écran : chaque écran porte un titre de niveau 1, et un seul';
const NAMED =
  '→ sur grand écran, l’atelier et les ressentis s’intitulent du nom du client';
const SKIP =
  'le lien « Aller au contenu » y mène au repère principal, et il n’y en a qu’un';
const TITLE = 'l’onglet dit quel document est ouvert';
const CONTRAST =
  '« Se déconnecter », « Supprimer » : au moins 4,5:1 sur leur fond';
const REFLOW = 'aucun écran ne défile de côté à 320 px de large';
const MARGIN =
  '→ les cartes du programme et des modèles gardent leur marge de 16 px';

export default {
  suite: 'verify_a11y.mjs',
  cases: [
    {
      name: 'l’atelier n’a plus de titre sur grand écran',
      edits: [
        {
          file: WORKSHOP,
          from: '              <Heading as="h1" size="lg" fontWeight="bold">',
          to: '              <Heading as="p" size="lg" fontWeight="bold">',
        },
      ],
      falls: [ONE_H1_WIDE, NAMED],
    },
    {
      name: 'les ressentis n’ont plus de titre sur grand écran',
      edits: [
        {
          file: JOURNAL,
          from: '            <Heading as="h1" size="2xl" fontWeight="800" flex={1} minW={0}>',
          to: '            <Heading as="p" size="2xl" fontWeight="800" flex={1} minW={0}>',
        },
      ],
      falls: [ONE_H1_WIDE, NAMED],
    },
    {
      name: 'les pages légales perdent leur repère principal',
      edits: [
        {
          file: LEGAL,
          from: '    <Box as="main" id="contenu" bg="bg.canvas" minH="100dvh" color="fg">',
          to: '    <Box bg="bg.canvas" minH="100dvh" color="fg">',
        },
      ],
      falls: [SKIP],
    },
    {
      name: 'l’onglet d’une page légale ne dit que « Kettle »',
      edits: [{ file: LEGAL, from: '  useDocumentTitle(title);\n', to: '' }],
      falls: [TITLE],
    },
    {
      name: 'le corail du texte retombe sur celui du fond',
      edits: [
        {
          file: THEME,
          from: "            fg: { value: '#F2847B' },",
          to: "            fg: { value: '#E2574C' },",
        },
      ],
      falls: [CONTRAST],
    },
    {
      name: '« Se déconnecter » reprend le corail du fond',
      edits: [
        {
          file: MENU,
          from: "              color={entry.danger ? 'app.error.fg' : 'fg'}",
          to: "              color={entry.danger ? 'app.error' : 'fg'}",
        },
      ],
      falls: [CONTRAST],
    },
    {
      // La pastille reste à côté du nom, et la carte dépasse l'écran.
      name: 'la pastille d’une séance ne passe plus sous son nom',
      edits: [
        {
          file: PROGRAM,
          from: '      <HStack align="start" gap="8px" flexWrap="wrap">',
          to: '      <HStack align="start" gap="8px">',
        },
      ],
      falls: [REFLOW, MARGIN],
    },
    {
      name: '« Nouveau » ne passe plus sous le titre des modèles',
      edits: [
        {
          file: TEMPLATES,
          from: '        <HStack gap="12px" align="center" flexWrap="wrap">',
          to: '        <HStack gap="12px" align="center">',
        },
      ],
      falls: [REFLOW],
    },
    {
      name: 'les deux boutons d’un modèle restent côte à côte',
      edits: [
        {
          file: TEMPLATE_CARD,
          from: '      <HStack gap="8px" mt="auto" pt="4px" flexWrap="wrap">',
          to: '      <HStack gap="8px" mt="auto" pt="4px">',
        },
      ],
      falls: [MARGIN],
    },
  ],
};
