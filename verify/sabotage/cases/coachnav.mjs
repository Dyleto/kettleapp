/** Les sabotages de `verify_coachnav.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_coachnav.mjs',
  cases: [
    {
      name: 'le compteur ne plafonne plus à « 99+ »',
      edits: [
        {
          file: 'src/kit/count.ts',
          from: "  return count > 99 ? '99+' : String(Math.floor(count));",
          to: '  return String(Math.floor(count));',
        },
      ],
      falls: ['au-delà de 99 : « 99+ »'],
    },
    {
      name: 'le compteur affiche zéro',
      edits: [
        {
          file: 'src/kit/count.ts',
          from: '  if (count === undefined || !Number.isFinite(count) || count < 1) return null;',
          to: '  if (count === undefined) return null;',
        },
      ],
      falls: ['rien à lire : pas de pastille, et « Tout est lu »'],
    },
    {
      name: 'le rail garde une seule largeur',
      edits: [
        {
          file: 'src/kit/Navigation.tsx',
          from: "      w={{ md: '76px', xl: collapsed ? '76px' : '232px' }}",
          to: '      w="200px"',
        },
      ],
      falls: [
        'un rail de 76 px, sans libellés',
        'un rail de 232 px, avec ses libellés',
        'dans l’atelier, le rail se replie en icônes, « Clients » allumé',
      ],
    },
    {
      name: 'les libellés restent au rail d’icônes',
      edits: [
        {
          file: 'src/kit/Navigation.tsx',
          from: '                <Text as="span" display={{ base: \'none\', xl: wide }}>',
          to: "                <Text as=\"span\" display={{ base: 'none', md: 'inline' }}>",
        },
      ],
      falls: [
        'un rail de 76 px, sans libellés',
        'dans l’atelier, le rail se replie en icônes, « Clients » allumé',
      ],
    },
    {
      name: 'l’atelier ne replie plus le rail',
      edits: [
        {
          file: 'src/App.tsx',
          from: '          handle={{ ownsMobileTopBar: true, collapsesRail: true }}',
          to: '          handle={{ ownsMobileTopBar: true }}',
        },
      ],
      falls: [
        'dans l’atelier, le rail se replie en icônes, « Clients » allumé',
      ],
    },
    {
      name: '« À lire » perd son compteur',
      edits: [
        {
          file: 'src/features/coach/navItems.tsx',
          from: '    count: unread,\n',
          to: '',
        },
      ],
      falls: [
        '→ « À lire » porte le compte des séances à lire',
        '→ chaque icône garde son nom, compteur compris',
        '→ le compteur sur « À lire »',
        'au-delà de 99 : « 99+ »',
      ],
    },
    {
      name: 'l’espace s’ouvre encore sur la liste des clients',
      edits: [
        {
          file: 'src/App.tsx',
          from: '        <Route index element={<Inbox />} />',
          to: '        <Route index element={<Clients />} />',
        },
      ],
      falls: [
        '→ l’espace s’ouvre sur « À lire », onglet allumé',
        'rien à lire : pas de pastille, et « Tout est lu »',
      ],
    },
    {
      name: '« À lire » reste allumé partout',
      edits: [
        {
          file: 'src/features/coach/navItems.tsx',
          from: '    end: true,\n',
          to: '',
        },
      ],
      falls: [
        '→ sur la liste des clients, seul « Clients » est allumé',
        'dans l’atelier, le rail se replie en icônes, « Clients » allumé',
      ],
    },
  ],
};
