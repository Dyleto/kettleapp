/** Les sabotages de `verify_clients.mjs`. Voir `../run.mjs`. */
const DOMAIN = 'src/domain/clients/roster.ts';
const PAGE = 'src/features/coach/pages/Clients.tsx';
const ROW = 'src/features/coach/clients/ClientRow.tsx';
const TILES_FILE = 'src/features/coach/clients/ClientTiles.tsx';
const SEARCH_FILE = 'src/features/coach/clients/ClientSearch.tsx';

const TILES =
  'trois chiffres en tête : six à lire chez trois clients, un à relancer, deux mal réglées';
const ORDER =
  'une ligne par client, ce qui demande de l’attention d’abord : à lire, à relancer, puis par activité';
const LINES = '→ chacune sa ligne d’état, dite sans accorder';
const COLORS = '→ à sa couleur : ambre, bleu, corail, gris';
const WEEK =
  '→ la semaine en anneau, rempli de ce qui est fait ; un tiret sans jour conseillé';
const PULSE =
  '→ les derniers ressentis en points, du plus ancien au plus récent ; aucun, rien';
const SILENT =
  'une tuile montre ce qu’elle compte : « à relancer », Karim seul';
const RETOGGLE = '→ la toucher de nouveau retire le filtre';
const OTHERS =
  '→ « mal réglées » : Julien et Sarah ; « à lire » : Thomas, Julien et Sarah';
const ZERO = 'une tuile à zéro ne se touche pas';
const SEARCH =
  'filtre à la frappe, sans accent ni casse, chaque mot où qu’il soit';
const NO_MATCH = 'aucun résultat : la phrase le dit, avec le mot tapé';
const CLEAR = '→ « Effacer la recherche » rend toute la liste';
const ALPHA = 'le menu de tri range par prénom, et dit le tri choisi';
const RECENT = '→ « Activité » : la plus récente d’abord';
const PHONE = 'sur téléphone, toucher une ligne ouvre l’atelier du client';
const EMPTY = 'l’état vide propose l’action au lieu de la décrire';
const COLUMNS =
  'des colonnes : la pastille d’état à droite, sans mordre sur les points';
const ONE_LINE = '→ chaque état tient sur une ligne';
const COMBINED = 'la recherche se cumule avec une tuile';
const SELECT = 'une ligne choisit le client, sans quitter la liste';
const DOUBLE = '→ le double-clic ouvre son atelier';

export default {
  suite: 'verify_clients.mjs',
  cases: [
    {
      // Karim, « Juste » puis « Dure », passerait pour mal réglé.
      name: 'un seul ressenti suffit à dire une séance mal réglée',
      edits: [
        {
          file: DOMAIN,
          from: '  if (!before || before !== last) return null;',
          to: '  if (!last) return null;',
        },
      ],
      falls: [TILES, OTHERS],
    },
    {
      // Karim, sans rien depuis 22 jours, n'est plus à relancer : il change
      // de rang, de ligne, et la tuile « à relancer » tombe à zéro.
      name: 'le silence ne compte qu’au-delà d’un mois',
      edits: [
        {
          file: DOMAIN,
          from: '  daysSince(client.lastCompletedAt ?? client.linkedAt, now) > SILENCE_DAYS;',
          to: '  daysSince(client.lastCompletedAt ?? client.linkedAt, now) > 30;',
        },
      ],
      // Sans tendance, Karim passe « à jour », en gris : sa couleur tombe
      // avec sa ligne. La tuile à zéro ne se touche pas : la retoucher ne
      // change rien, et l'assertion du retrait reste verte.
      falls: [TILES, ORDER, LINES, COLORS, SILENT],
    },
    {
      name: 'le moins de séances à lire passe en tête',
      edits: [
        {
          file: DOMAIN,
          from: '      (group(a) === 0 ? b.unseenCount - a.unseenCount : 0) ||',
          to: '      (group(a) === 0 ? a.unseenCount - b.unseenCount : 0) ||',
        },
      ],
      falls: [ORDER, OTHERS],
    },
    {
      // La ligne de Sarah devient « 1 séance à lire », dans l'ambre de Thomas.
      name: 'à lire, la tendance ne se dit plus',
      edits: [
        {
          file: DOMAIN,
          from: '  if (n > 0)\n    return trend\n',
          to: '  if (n > 0)\n    return false\n',
        },
      ],
      falls: [LINES, COLORS],
    },
    {
      name: 'le nouveau suivi s’accorde au féminin',
      edits: [
        {
          file: DOMAIN,
          from: "          ? 'nouveau suivi · programme à écrire'",
          to: "          ? 'nouvelle · programme à écrire'",
        },
      ],
      falls: [LINES],
    },
    {
      name: 'le corail se lit comme l’ambre',
      edits: [
        {
          file: ROW,
          from: "  coral: 'session.work.fg',",
          to: "  coral: 'app.primary',",
        },
      ],
      falls: [COLORS],
    },
    {
      name: 'l’anneau se remplit toujours',
      edits: [
        {
          file: ROW,
          from: '        part={Math.min(1, client.weekDone / client.weekTarget)}',
          to: '        part={1}',
        },
      ],
      falls: [WEEK],
    },
    {
      name: 'sans jour conseillé, un anneau vide',
      edits: [
        {
          file: ROW,
          from: '  client.weekTarget > 0 ? (',
          to: '  true ? (',
        },
      ],
      falls: [WEEK],
    },
    {
      name: 'les points se lisent du plus récent au plus ancien',
      edits: [
        {
          file: ROW,
          from: '      zones={efforts.map((effort) => getEffortLevel(effort)?.zone ?? null)}',
          to: '      zones={[...efforts].reverse().map((effort) => getEffortLevel(effort)?.zone ?? null)}',
        },
      ],
      falls: [PULSE],
    },
    {
      name: 'aucun ressenti montre un rang éteint',
      edits: [
        {
          file: ROW,
          from: '  efforts.length > 0 ? (',
          to: '  true ? (',
        },
      ],
      falls: [PULSE],
    },
    {
      name: 'la sous-ligne compte les séances au lieu des clients',
      edits: [
        {
          file: TILES_FILE,
          from: '        ? `chez ${counts.unreadClients} client${counts.unreadClients > 1 ? ',
          to: '        ? `chez ${counts.unreadSessions} client${counts.unreadClients > 1 ? ',
        },
      ],
      falls: [TILES],
    },
    {
      name: 'une tuile touchée deux fois garde son filtre',
      edits: [
        {
          file: TILES_FILE,
          from: '          onClick={() => onFilter(on ? null : tile.filter)}',
          to: '          onClick={() => onFilter(tile.filter)}',
        },
      ],
      falls: [RETOGGLE],
    },
    {
      name: 'une tuile à zéro se touche',
      edits: [
        {
          file: TILES_FILE,
          from: '          disabled={tile.count === 0}',
          to: '          disabled={false}',
        },
      ],
      falls: [ZERO],
    },
    {
      name: 'la recherche tient compte des accents',
      edits: [
        {
          file: DOMAIN,
          from: '  const haystack = normalize(',
          to: '  const haystack = (',
        },
      ],
      // Le sabotage retire aussi la casse : « sa » ne trouve plus
      // « Sarah ».
      falls: [SEARCH, COMBINED],
    },
    {
      name: 'la recherche lit les mots tapés comme un seul',
      edits: [
        {
          file: DOMAIN,
          from: '  return needle.split(/\\s+/).every((word) => haystack.includes(word));',
          to: '  return haystack.includes(needle);',
        },
      ],
      falls: [SEARCH],
    },
    {
      name: 'aucun résultat ne dit plus ce qui a été tapé',
      edits: [
        {
          file: PAGE,
          from: '              ? `Aucun client ne s’appelle « ${query.trim()} »`',
          to: "              ? 'Aucun client ne s’appelle ainsi'",
        },
      ],
      falls: [NO_MATCH],
    },
    {
      name: '« Effacer la recherche » ne vide pas le champ',
      edits: [
        {
          file: PAGE,
          from: "              setQuery('');\n              setFilter(null);",
          to: '              setFilter(null);',
        },
      ],
      falls: [CLEAR],
    },
    {
      name: 'le menu de tri ne trie plus',
      edits: [
        {
          file: SEARCH_FILE,
          from: '      onSelect={({ value }) => onSort(value as ClientSort)}',
          to: '      onSelect={() => undefined}',
        },
      ],
      falls: [ALPHA, RECENT],
    },
    {
      name: 'le menu ne dit plus le tri choisi',
      edits: [
        {
          file: SEARCH_FILE,
          from: '          aria-label={`Trier : ${current.label}`}',
          to: '          aria-label="Trier : À traiter"',
        },
      ],
      falls: [ALPHA],
    },
    {
      name: '« Activité » met la plus ancienne en tête',
      edits: [
        {
          file: DOMAIN,
          from: '      (a, b) => lastActivity(b) - lastActivity(a) || byName(a, b)',
          to: '      (a, b) => lastActivity(a) - lastActivity(b) || byName(a, b)',
        },
      ],
      falls: [RECENT],
    },
    {
      name: 'sur téléphone, une ligne ne mène plus à l’atelier',
      edits: [
        {
          file: PAGE,
          from: '    withPreview ? setPreview(client) : openProgram(client);',
          to: '    setPreview(client);',
        },
      ],
      falls: [PHONE],
    },
    {
      name: 'l’état vide ne propose plus rien',
      edits: [
        {
          file: PAGE,
          from: '      action={\n        <ActionButton size="md" onClick={invite} loading={isPending}>\n          Obtenir le lien d’invitation\n        </ActionButton>\n      }\n',
          to: '',
        },
      ],
      falls: [EMPTY],
    },
    {
      // La pastille ne se coupe pas : c'est la colonne qui lui laisse la
      // place. « 1 à lire · devient trop dure » passait sur les points à
      // 1 280 px avant que les colonnes soient rééquilibrées.
      name: 'la colonne d’état se resserre',
      edits: [
        {
          file: ROW,
          from: "          md: '34px minmax(0, 1fr) 56px 84px minmax(0, 1.3fr)',",
          to: "          md: '34px minmax(0, 1fr) 56px 84px minmax(0, 0.3fr)',",
        },
      ],
      falls: [COLUMNS],
    },
    {
      name: 'la ligne grise passe sur plusieurs lignes',
      edits: [
        {
          file: ROW,
          from: '              textAlign="right"\n              truncate\n',
          to: '              textAlign="right"\n',
        },
      ],
      falls: [ONE_LINE],
    },
    {
      name: 'le client choisi ne se marque plus',
      edits: [
        {
          file: PAGE,
          from: '              selected={withPreview && client._id === preview?._id}',
          to: '              selected={false}',
        },
      ],
      falls: [SELECT],
    },
    {
      name: 'le double-clic n’ouvre plus l’atelier',
      edits: [
        {
          file: ROW,
          from: '      onDoubleClick={onOpenProgram}\n',
          to: '',
        },
      ],
      falls: [DOUBLE],
    },
  ],
};
