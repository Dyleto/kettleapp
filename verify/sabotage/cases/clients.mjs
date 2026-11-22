/** Les sabotages de `verify_clients.mjs`. Voir `../run.mjs`. */
const DOMAIN = 'src/domain/clients/roster.ts';
const PAGE = 'src/features/coach/pages/Clients.tsx';
const ROW = 'src/features/coach/clients/ClientRow.tsx';
const TILES_FILE = 'src/features/coach/clients/ClientTiles.tsx';
// Le tri vit dans le kit, que la bibliothèque d'exercices partage (F7a).
const SEARCH_FILE = 'src/kit/SortMenu.tsx';

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

const PANEL = 'src/features/coach/components/ClientPreview.tsx';
const DEFAULT =
  'sans choix, le panneau montre le premier de la liste : le prochain à traiter';
const HEAD =
  'une ligne choisie s’y ouvre : le nom, et depuis quand dure le suivi';
const PHRASE =
  '→ ses ressentis en points, et la phrase de sa ligne, à la couleur du dur';
const WEEK_TOTAL = '→ sa semaine, et son total de séances';
const RECENT_ROWS =
  '→ ses trois dernières séances, la plus récente d’abord, son mot compris';
const SHEET =
  '→ une séance s’ouvre en feuille, au « Son mot », sans « Corriger »';
const JOURNAL = '→ « Tous ses ressentis » mène à son journal';
const NO_HISTORY =
  'un client sans séance : le panneau le dit, sans lien vers un journal vide';
const OPEN_PROGRAM = '« Ouvrir son programme » mène à son atelier';

const INVITE = 'src/features/coach/clients/InviteSheet.tsx';
const INVITE_HOOK = 'src/features/coach/hooks/useActiveInvitation.ts';
const READY = '« Inviter » ouvre la feuille, le lien déjà prêt, et sa validité';
const COPY = '« Copier le lien » copie, et le bouton le dit';
const REVERT = '→ puis il redevient « Copier le lien »';
const NO_SHARE = 'sans partage sur l’appareil, pas de « Partager… »';
const ESCAPE = '→ Échap referme la feuille';
const SHARE = 'là où le téléphone partage, « Partager… » lui passe le lien';
const EXPIRED =
  'un lien expiré : un nouveau est créé à l’ouverture de la feuille';
const REFUSED =
  'une copie refusée : le lien reste, sélectionné, et la feuille le dit';
const EMPTY_COPY =
  'l’état vide copie le lien d’une touche, sans ouvrir de feuille';

const TAGS_DOMAIN = 'src/domain/clients/tags.ts';
const TAGS_UI = 'src/features/coach/clients/Tags.tsx';
const TAGS_HOOK = 'src/features/coach/hooks/useTags.ts';
const ROW_TAGS =
  'chaque ligne porte ses étiquettes : trois au plus, puis « + 1 »';
const BAR = 'la barre : « Tous », chaque étiquette, et « + étiquette »';
const ONE_TAG = 'une étiquette filtre la liste';
const TWO_TAGS = '→ deux étiquettes : les clients qui en portent au moins une';
const ALL_TAGS = '→ « Tous » retire le filtre';
const CHECKED = '« modifier » ouvre ses étiquettes, cochées';
const UNCHECK =
  'décocher part tout de suite, et la ligne derrière la feuille suit';
const FIELD =
  'le champ filtre au début des mots, et propose « Créer » pour un nom neuf seulement';
const ENTER = '→ Entrée crée l’étiquette, la coche, et la barre la montre';
const CLOSED = '« C’est bon » referme, et le panneau dit ses étiquettes';
const MANAGED = '« + étiquette » : chacune, et combien de clients la portent';
const CREATE =
  'créer : un nom déjà pris ne se crée pas, un neuf rejoint la liste et la barre';
const RENAME = 'renommer : partout à la fois';
const DELETE =
  'supprimer : la feuille dit combien de clients la perdront, puis la retire de tous';

const REMOVE = 'src/features/coach/clients/RemoveClientSheet.tsx';
const MENU_OPENS =
  'le clic droit ouvre le menu de la ligne, sans ouvrir l’atelier';
const MENU_TAGS = '→ « Étiquettes » ouvre sa feuille, sur téléphone aussi';
const LONG_PRESS = '→ l’appui long au doigt l’ouvre aussi';
const MENU_JOURNAL = '→ « Voir ses ressentis » mène à son journal';
const ASK = '« Retirer » demande, et dit ce qui reste au client';
const KEEP = '→ « Garder » ne retire rien';
const REMOVED =
  '→ « Retirer » : le client quitte la liste, et les tuiles le comptent';
const REMOVE_FAILED =
  'un retrait raté : la feuille reste et dit que le client est toujours là';

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
      // Le panneau montre le premier de la liste : Sarah, au lieu de
      // Thomas.
      falls: [ORDER, OTHERS, DEFAULT],
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
          from: '      onSelect={(details) => onChange(details.value as T)}',
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
          from: '    withPreview ? setPreviewId(client._id) : openProgram(client);',
          to: '    setPreviewId(client._id);',
        },
      ],
      falls: [PHONE],
    },
    {
      name: 'l’état vide ne propose plus rien',
      edits: [
        {
          file: PAGE,
          from: "      action={\n        <ActionButton size=\"md\" onClick={copyFirstLink}>\n          {copied ? <LuCheck size={18} /> : <LuLink size={18} />}\n          {copied ? 'Lien copié' : 'Copier le lien d’invitation'}\n        </ActionButton>\n      }\n",
          to: '',
        },
      ],
      // Sans bouton, plus rien à toucher pour copier.
      falls: [EMPTY, EMPTY_COPY],
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
    {
      name: 'sans choix, le panneau reste vide',
      edits: [
        {
          file: PAGE,
          from: '    clients.find((c) => c._id === previewId) ?? visible[0] ?? null;',
          to: '    clients.find((c) => c._id === previewId) ?? null;',
        },
      ],
      falls: [DEFAULT],
    },
    {
      name: 'l’ancienneté se compte depuis la dernière séance',
      edits: [
        {
          file: PANEL,
          from: '            {followedSince(client.linkedAt, new Date())}',
          to: '            {followedSince(client.lastCompletedAt ?? client.linkedAt, new Date())}',
        },
      ],
      falls: [HEAD],
    },
    {
      // Sarah lirait « Les deux dernières : dures », la série du journal,
      // sous une ligne qui dit « devient trop dure ».
      name: 'le panneau ne reprend plus la tendance de la ligne',
      edits: [
        {
          file: DOMAIN,
          from: "  if (trend === 'hard') return { text: 'Devient trop dure', tone: 'hard' };\n",
          to: '',
        },
      ],
      falls: [PHRASE],
    },
    {
      name: 'la phrase du panneau perd sa couleur',
      edits: [
        {
          file: PANEL,
          from: "            color={headline.tone ? EFFORT_ZONE_COLOR[headline.tone] : 'fg'}",
          to: '            color="fg"',
        },
      ],
      falls: [PHRASE],
    },
    {
      name: 'le total se dit toujours incomplet',
      edits: [
        {
          file: PANEL,
          from: '                  complete: history.length < HISTORY_PAGE_SIZE,',
          to: '                  complete: false,',
        },
      ],
      falls: [WEEK_TOTAL],
    },
    {
      // La première ligne n'est plus la séance du 30 août : la feuille
      // qu'elle ouvre ne porte plus ce nom.
      name: 'le panneau montre les trois plus anciennes séances',
      edits: [
        {
          file: PANEL,
          from: '            {history.slice(0, SHOWN).map((completed) => (',
          to: '            {history.slice(-SHOWN).map((completed) => (',
        },
      ],
      falls: [RECENT_ROWS, SHEET],
    },
    {
      name: 'une séance récente ne dit plus le mot du client',
      edits: [
        {
          file: PANEL,
          from: "          {said ? ` · « ${said} »` : ''}",
          to: "          {''}",
        },
      ],
      falls: [RECENT_ROWS],
    },
    {
      name: '« Tous ses ressentis » mène à un journal vide',
      edits: [
        {
          file: PANEL,
          from: '      {history.length > 0 && (',
          to: '      {true && (',
        },
      ],
      falls: [NO_HISTORY],
    },
    {
      name: '« Tous ses ressentis » mène à l’atelier',
      edits: [
        {
          file: PANEL,
          from: '          onClick={() => navigate(COACH_ROUTES.clientJournal(client._id))}',
          to: '          onClick={() => navigate(COACH_ROUTES.clientSession(client._id, 1))}',
        },
      ],
      falls: [JOURNAL],
    },
    {
      name: '« Ouvrir son programme » ne mène nulle part',
      edits: [
        {
          file: PANEL,
          from: '        onClick={() => navigate(COACH_ROUTES.clientSession(client._id, 1))}',
          to: '        onClick={() => undefined}',
        },
      ],
      falls: [OPEN_PROGRAM],
    },
    {
      // Un lien encore valable n'a pas à être recréé : chaque création
      // fait un aller-retour, et le partage perd son activation.
      name: 'la feuille crée un lien même quand il y en a un',
      edits: [
        {
          file: INVITE,
          from: '  const needed = active.isFetched && !valid;',
          to: '  const needed = active.isFetched;',
        },
      ],
      falls: [READY],
    },
    {
      name: 'la feuille ne dit plus jusqu’à quand le lien vaut',
      edits: [
        {
          file: INVITE,
          from: '            {linkExpiry(valid.expiresAt)} Le même lien sert à plusieurs clients.',
          to: '            Le même lien sert à plusieurs clients.',
        },
      ],
      falls: [READY],
    },
    {
      name: '« Copier le lien » copie autre chose',
      edits: [
        {
          file: INVITE,
          from: '      await navigator.clipboard.writeText(link);',
          to: "      await navigator.clipboard.writeText('');",
        },
      ],
      falls: [COPY],
    },
    {
      name: '« Lien copié » reste',
      edits: [
        {
          file: INVITE,
          from: '      timer.current = window.setTimeout(() => setCopied(false), 2000);\n',
          to: '',
        },
      ],
      falls: [REVERT],
    },
    {
      name: '« Partager… » s’affiche sans partage possible',
      edits: [
        {
          file: INVITE,
          from: '        {canShare && link && (',
          to: '        {link && (',
        },
      ],
      falls: [NO_SHARE],
    },
    {
      name: '« Partager… » ne passe pas le lien',
      edits: [
        {
          file: INVITE,
          from: "                .share({ title: 'Rejoindre mon suivi sur Kettle', url: link })",
          to: "                .share({ title: 'Rejoindre mon suivi sur Kettle', url: '' })",
        },
      ],
      falls: [SHARE],
    },
    {
      name: 'Échap ne referme plus la feuille d’invitation',
      edits: [
        {
          file: INVITE,
          from: '  useSheetDismiss(true, onClose);\n',
          to: '',
        },
      ],
      falls: [ESCAPE],
    },
    {
      name: 'un lien expiré passe pour valable',
      edits: [
        {
          file: INVITE_HOOK,
          from: '  data?.token && data.expiresAt && Date.parse(data.expiresAt) > Date.now()',
          to: '  data?.token && data.expiresAt',
        },
      ],
      falls: [EXPIRED],
    },
    {
      name: 'une copie refusée ne sélectionne pas le lien',
      edits: [
        {
          file: INVITE,
          from: '      setCopyFailed(true);\n      selectLink();',
          to: '      setCopyFailed(true);',
        },
      ],
      falls: [REFUSED],
    },
    {
      name: 'l’état vide ouvre toujours la feuille',
      edits: [
        {
          file: PAGE,
          from: '    if (!(await copyInvitation())) return setInviting(true);',
          to: '    return setInviting(true);',
        },
      ],
      falls: [EMPTY_COPY],
    },
    {
      name: 'une ligne montre quatre étiquettes',
      edits: [{ file: TAGS_DOMAIN, from: '  max = 3', to: '  max = 4' }],
      falls: [ROW_TAGS],
    },
    {
      // Sarah lirait « Compétition, Reprise, Senior » : l'ordre où on les
      // a posées, et non celui de la barre.
      name: 'les étiquettes d’une ligne suivent l’ordre de pose',
      edits: [
        {
          file: TAGS_DOMAIN,
          from: '  const mine = tags.filter((tag) => tagIds.includes(tag._id));',
          to: '  const mine = tagIds.flatMap((id) => tags.filter((tag) => tag._id === id));',
        },
      ],
      // Le décochage relit la ligne de Sarah dans le même ordre : il tombe
      // avec.
      falls: [ROW_TAGS, UNCHECK],
    },
    {
      // Lue par leur nom partout ailleurs, les étiquettes ne disent leur
      // ordre que dans la barre.
      name: 'la barre range les étiquettes à rebours',
      edits: [
        {
          file: TAGS_UI,
          from: '    {tags.map((tag) => {\n      const on = selected.has(tag._id);',
          to: '    {[...tags].reverse().map((tag) => {\n      const on = selected.has(tag._id);',
        },
      ],
      falls: [BAR],
    },
    {
      name: 'la feuille d’un client ne dit plus ce qui est coché',
      edits: [
        {
          file: TAGS_UI,
          from: '                aria-checked={on}',
          to: '                aria-checked={false}',
        },
      ],
      // Entrée coche l'étiquette créée : la case le dit de la même façon.
      falls: [CHECKED, ENTER],
    },
    {
      name: '« + 1 » ne se dit plus',
      edits: [
        {
          file: 'src/features/coach/clients/ClientRow.tsx',
          from: '            {more > 0 && <Chip tone="outline">+ {more}</Chip>}\n',
          to: '',
        },
      ],
      falls: [ROW_TAGS],
    },
    {
      name: 'deux étiquettes ne montrent que les clients qui portent les deux',
      edits: [
        {
          file: TAGS_DOMAIN,
          from: '  selected.size === 0 || client.tagIds.some((id) => selected.has(id));',
          to: '  [...selected].every((id) => client.tagIds.includes(id));',
        },
      ],
      falls: [TWO_TAGS],
    },
    {
      name: 'la barre ne filtre plus',
      edits: [
        {
          file: PAGE,
          from: '        hasAnyTag(c, tagFilter)',
          to: '        true',
        },
      ],
      falls: [ONE_TAG, TWO_TAGS],
    },
    {
      name: '« Tous » ne retire plus le filtre',
      edits: [
        {
          file: TAGS_UI,
          from: '    <Toggle on={selected.size === 0} onPress={() => onChange(new Set())}>',
          to: '    <Toggle on={selected.size === 0} onPress={() => undefined}>',
        },
      ],
      falls: [ALL_TAGS],
    },
    {
      // « se » trouverait aussi « Prise de masse » et « Reprise ».
      name: 'le champ cherche au milieu des mots',
      edits: [
        {
          file: TAGS_DOMAIN,
          from: "      key.startsWith(needle) ||\n      key.split(' ').some((word) => word.startsWith(needle))",
          to: '      key.includes(needle)',
        },
      ],
      falls: [FIELD],
    },
    {
      name: '« Créer » se propose pour un nom déjà pris',
      edits: [
        {
          file: TAGS_DOMAIN,
          from: '    !tags.some((tag) => tagKey(tag.name) === tagKey(name))',
          to: '    true',
        },
      ],
      falls: [FIELD, CREATE],
    },
    {
      name: 'décocher n’envoie rien de ce qui reste',
      edits: [
        {
          file: TAGS_HOOK,
          from: '          { tagIds }\n',
          to: '          { tagIds: [] }\n',
        },
      ],
      // Chaque pose vide tout : l'étiquette créée ensuite aussi.
      falls: [UNCHECK, ENTER, CLOSED],
    },
    {
      name: 'une étiquette créée dans la feuille ne se coche pas',
      edits: [
        {
          file: TAGS_UI,
          from: '        put([...mine, tag._id]);',
          to: '        put(mine);',
        },
      ],
      falls: [ENTER, CLOSED],
    },
    {
      name: 'le panneau ne montre plus les étiquettes du client',
      edits: [
        {
          file: PANEL,
          from: '  const mine = tags.filter((tag) => client.tagIds.includes(tag._id));',
          to: '  const mine = tags.filter(() => false);',
        },
      ],
      falls: [CLOSED],
    },
    {
      name: 'la gestion ne compte plus les clients',
      edits: [
        {
          file: TAGS_UI,
          from: '                used={tagUsage(clients, tag._id)}',
          to: '                used={0}',
        },
      ],
      // Une étiquette neuve ne compte personne : celle-là reste juste.
      falls: [MANAGED, RENAME, DELETE],
    },
    {
      name: 'un renommage ne se voit pas',
      edits: [
        {
          file: TAGS_HOOK,
          from: '      setTags((tags) => tags.map((t) => (t._id === tag._id ? tag : t))),',
          to: '      undefined,',
        },
      ],
      falls: [RENAME],
    },
    {
      name: 'supprimer sans demander',
      edits: [
        {
          file: TAGS_UI,
          from: '            onClick={() => setConfirming(true)}',
          to: '            onClick={() => remove.mutate(tag._id)}',
        },
      ],
      falls: [DELETE],
    },
    {
      name: 'une ligne n’a plus de menu',
      edits: [
        {
          file: 'src/features/coach/clients/ClientRow.tsx',
          from: '  return actions ? (',
          to: '  return false ? (',
        },
      ],
      falls: [
        MENU_OPENS,
        MENU_TAGS,
        LONG_PRESS,
        MENU_JOURNAL,
        ASK,
        REMOVED,
        REMOVE_FAILED,
      ],
    },
    {
      name: '« Étiquettes » n’ouvre rien',
      edits: [
        {
          file: PAGE,
          from: '      onSelect: () => setTagsFor(client._id),',
          to: '      onSelect: () => undefined,',
        },
      ],
      falls: [MENU_TAGS],
    },
    {
      name: '« Voir ses ressentis » ne mène nulle part',
      edits: [
        {
          file: PAGE,
          from: '      onSelect: () => navigate(COACH_ROUTES.clientJournal(client._id)),',
          to: '      onSelect: () => undefined,',
        },
      ],
      falls: [MENU_JOURNAL],
    },
    {
      name: '« Retirer de mes clients » n’ouvre rien',
      edits: [
        {
          file: PAGE,
          from: '      onSelect: () => setRemoving(client._id),',
          to: '      onSelect: () => undefined,',
        },
      ],
      falls: [ASK, REMOVED, REMOVE_FAILED],
    },
    {
      // Karim part dès « Garder » : l'assertion du retrait constate ensuite
      // un client bien retiré, et reste verte.
      name: '« Garder » retire quand même',
      edits: [
        {
          file: REMOVE,
          from: '        <ActionButton tone="ghost" size="md" w="full" onClick={onClose}>',
          to: '        <ActionButton tone="ghost" size="md" w="full" onClick={() => remove.mutate(client._id, { onSuccess: onClose })}>',
        },
      ],
      falls: [KEEP],
    },
    {
      name: 'un client retiré reste dans la liste',
      edits: [
        {
          file: 'src/features/coach/hooks/useClients.ts',
          from: '        (list) => list?.filter((c) => c._id !== clientId)',
          to: '        (list) => list',
        },
      ],
      falls: [REMOVED],
    },
    {
      name: 'un retrait raté ne se dit pas',
      edits: [
        {
          file: REMOVE,
          from: '        {remove.isError && (',
          to: '        {false && (',
        },
      ],
      falls: [REMOVE_FAILED],
    },
    {
      // Refermée avant la réponse, la feuille ne peut plus dire l'échec.
      name: 'la feuille se ferme sans attendre la réponse',
      edits: [
        {
          file: REMOVE,
          from: '          onClick={() => remove.mutate(client._id, { onSuccess: onClose })}',
          to: '          onClick={() => {\n            remove.mutate(client._id);\n            onClose();\n          }}',
        },
      ],
      falls: [REMOVE_FAILED],
    },
  ],
};
