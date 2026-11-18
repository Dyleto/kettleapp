/** Les sabotages de `verify_session.mjs`. Voir `../run.mjs`. */
const RAIL = 'src/features/coach/components/SessionRail.tsx';
const DOTS = 'src/features/coach/components/EffortDots.tsx';
const HEADER = 'src/features/coach/components/SessionHeader.tsx';
const MENU = 'src/features/coach/components/SessionMenu.tsx';
const TAB = 'src/features/coach/components/ClientProgramTab.tsx';
const PAGE = 'src/features/coach/pages/ClientDetails.tsx';
const SHEETS = 'src/features/coach/hooks/useSessionSheets.tsx';
const WORKSHOP = 'src/features/workshop/hooks/useProgramWorkshop.ts';

export default {
  suite: 'verify_session.mjs',
  cases: [
    {
      // La ligne d'avant E7a : un compte, et ni durée ni jours.
      name: 'le rail ne dit plus que le nombre de blocs',
      edits: [
        {
          file: RAIL,
          from: '        {line}\n      </Text>',
          to: '        {session.blocks.length} blocs\n      </Text>',
        },
      ],
      falls: [
        'chaque séance dit sa durée et ses jours, sans l’ouvrir',
        '→ « jamais faite » sous celle que le client n’a jamais faite, et elle seule',
        '→ refermée, elle le relit, et le rail aussi',
      ],
    },
    {
      name: 'la barre de composition ne montre que le premier bloc',
      edits: [
        {
          file: RAIL,
          from: '      {session.blocks.map((block) => (\n        <Box\n          key={block._id}\n          flex={1}',
          to: '      {session.blocks.slice(0, 1).map((block) => (\n        <Box\n          key={block._id}\n          flex={1}',
        },
      ],
      falls: ['la barre dit la composition : un segment par bloc'],
    },
    {
      name: 'les ressentis se lisent à l’envers',
      edits: [
        {
          file: DOTS,
          from: '      {zones.map((zone, i) => (',
          to: '      {[...zones].reverse().map((zone, i) => (',
        },
      ],
      falls: ['les cinq derniers ressentis, du plus ancien au plus récent'],
    },
    {
      name: 'les ressentis ne sont plus qu’une rangée de ronds sans nom',
      edits: [{ file: DOTS, from: '      role="img"\n', to: '' }],
      falls: ['→ et un lecteur d’écran les entend en mots'],
    },
    {
      name: 'une séance jamais faite montre cinq points vides',
      edits: [
        {
          file: RAIL,
          from: '{tracked && done && <EffortDots',
          to: '{tracked && <EffortDots',
        },
      ],
      falls: ['→ une séance jamais faite n’en montre aucun'],
    },
    {
      // Le point vide de la maquette, pris dans `line` : sur `bg.raised`, il
      // disparaît.
      name: 'un point vide se fond dans la séance ouverte',
      edits: [
        {
          file: DOTS,
          from: "          bg={zone ? EFFORT_ZONE_COLOR[zone] : 'fg.muted'}\n          opacity={zone ? 1 : 0.3}",
          to: "          bg={zone ? EFFORT_ZONE_COLOR[zone] : 'line'}",
        },
      ],
      falls: ['→ un point vide se voit sur la séance ouverte'],
    },
    {
      name: 'le rail n’a plus de clic droit',
      edits: [
        {
          file: PAGE,
          from: '            menuFor={(session) => actionsFor(session)}\n',
          to: '',
        },
      ],
      falls: [
        'le clic droit sur une séance ouvre son menu entier',
        '→ « Renommer » ouvre la séance, son nom prêt à la frappe',
        '→ et le serveur reçoit le nom tapé',
        '→ même sur la séance ouverte, que rien ne remonte',
      ],
    },
    {
      // Le nom s'ouvre à l'écriture, mais sur une séance qu'on ne lit pas.
      name: '« Renommer » au clic droit n’ouvre pas la séance visée',
      edits: [
        {
          file: PAGE,
          from: '      if (index >= 0) goToSession(index + 1);\n',
          to: '',
        },
      ],
      falls: [
        '→ « Renommer » ouvre la séance, son nom prêt à la frappe',
        '→ et le serveur reçoit le nom tapé',
        '→ même sur la séance ouverte, que rien ne remonte',
      ],
    },
    {
      // Le défaut d'avant : la séance ouverte ne se remonte pas, et son
      // titre ignorait la demande.
      name: 'la séance ouverte ignore « Renommer » venu du rail',
      edits: [
        {
          file: TAB,
          from: '    if (startRenaming) setRenameRequest((n) => n + 1);\n',
          to: '',
        },
      ],
      falls: ['→ même sur la séance ouverte, que rien ne remonte'],
    },
    {
      // L'entrée lancée au clic, avant que le menu ne rende le focus à son
      // « ⋯ » : le champ qu'elle ouvre le perd aussitôt — le titre, le mot
      // d'avant séance, et le nom du modèle, dont la frappe part ailleurs :
      // le modèle s'enregistre sous l'ancien nom, et l'annonce avec lui.
      name: 'le menu lance l’entrée avant de se refermer',
      edits: [
        {
          file: MENU,
          from: '      chosen.current = actions.find((a) => a.value === value)?.onSelect ?? null;',
          to: '      actions.find((a) => a.value === value)?.onSelect();',
        },
      ],
      falls: [
        '→ même sur la séance ouverte, que rien ne remonte',
        '→ « Ajouter un mot d’avant séance » ouvre le champ, prêt à la frappe',
        '→ « Renommer » ouvre le titre ; Échap rend le nom d’avant',
        'la feuille propose le nom de la séance, sélectionné, prêt à la frappe',
        '→ « Enregistrer le modèle » le crée, avec cette seule séance',
        '→ et l’annonce, avec de quoi y aller',
      ],
    },
    {
      name: 'l’en-tête ne dit plus la durée',
      edits: [
        {
          file: HEADER,
          from: '    <Chip tone="amber">{durationLabel(session)}</Chip>\n',
          to: '',
        },
      ],
      falls: ['l’en-tête dit le nom, la durée et les jours de la séance'],
    },
    {
      name: 'un jour coché dans la pastille ne part nulle part',
      edits: [
        {
          file: HEADER,
          from: '<SuggestedDaysPicker value={session.suggestedDays} onChange={onDays} />',
          to: '<SuggestedDaysPicker value={session.suggestedDays} onChange={() => undefined} />',
        },
      ],
      falls: [
        'la pastille des jours s’ouvre sur place, et un jour coché part au serveur',
        '→ refermée, elle le relit, et le rail aussi',
      ],
    },
    {
      name: '« Ajouter un mot d’avant séance » montre le champ sans l’ouvrir',
      edits: [
        {
          file: TAB,
          from: '              startOpen={noteRequested && !hasNote}',
          to: '              startOpen={false}',
        },
      ],
      falls: [
        '→ « Ajouter un mot d’avant séance » ouvre le champ, prêt à la frappe',
      ],
    },
    {
      name: 'Échap garde le nom tapé',
      edits: [
        { file: HEADER, from: '            onRename(before);\n', to: '' },
      ],
      falls: ['→ « Renommer » ouvre le titre ; Échap rend le nom d’avant'],
    },
    {
      name: '« Dupliquer » reste sur l’original',
      edits: [
        {
          file: WORKSHOP,
          from: '    goToSession(index + 2);',
          to: '    goToSession(index + 1);',
        },
      ],
      falls: [
        '→ « Dupliquer » ouvre la copie, juste après l’original',
        '→ « Supprimer la séance 2 » la retire, avec « Annuler »',
      ],
    },
    {
      name: '« Supprimer » ne dit plus quelle séance',
      edits: [
        {
          file: 'src/features/coach/hooks/useSessionMenu.tsx',
          from: '        label: `Supprimer la séance ${session.order}`,',
          to: "        label: 'Supprimer',",
        },
      ],
      falls: [
        'le clic droit sur une séance ouvre son menu entier',
        'le « ⋯ » de la séance porte tout le reste',
        '→ « Supprimer la séance 2 » la retire, avec « Annuler »',
      ],
    },
    {
      name: '« + Séance » n’ouvre plus le nom',
      edits: [{ file: WORKSHOP, from: '    setRenamingId(id);\n', to: '' }],
      falls: [
        '« + Séance » ouvre la séance neuve sur son nom, prêt à la frappe',
        '→ le nom tapé part au serveur',
      ],
    },
    {
      // La demande n'est jamais levée : elle rouvre le titre à chaque retour,
      // et une seconde demande sur la même séance ne se voit plus.
      name: 'le nom refermé reste demandé',
      edits: [
        {
          file: WORKSHOP,
          from: '    onRenamed: () => setRenamingId(null),',
          to: '    onRenamed: () => undefined,',
        },
      ],
      falls: [
        '→ même sur la séance ouverte, que rien ne remonte',
        '→ refermé, il ne se rouvre pas en revenant sur la séance',
      ],
    },
    {
      name: 'la pastille vide se nomme deux fois',
      edits: [
        {
          file: 'src/features/workshop/components/BlockPill.tsx',
          from: '      aria-label={display === label ? label : `${label} : ${display}`}',
          to: '      aria-label={`${label} : ${display}`}',
        },
      ],
      falls: [
        '→ sans jour choisi, la pastille des jours se lit par son seul nom',
      ],
    },
    {
      name: 'la feuille ne propose plus de nom',
      edits: [
        {
          file: SHEETS,
          from: '          defaultName={sessionName(saving)}',
          to: '          defaultName=""',
        },
      ],
      falls: [
        'la feuille propose le nom de la séance, sélectionné, prêt à la frappe',
      ],
    },
    {
      name: 'la feuille ne nomme plus le client',
      edits: [
        {
          file: PAGE,
          from: '    clientFirstName: client?.firstName,\n',
          to: '',
        },
      ],
      falls: ['→ et dit que le programme de Sarah ne bouge pas'],
    },
    {
      name: 'le modèle emporte tout le programme',
      edits: [
        {
          file: SHEETS,
          from: '              { clientId, name, sessionIds: [saving._id] },',
          to: '              { clientId, name },',
        },
      ],
      falls: ['→ « Enregistrer le modèle » le crée, avec cette seule séance'],
    },
    {
      name: 'l’annonce n’offre plus d’y aller',
      edits: [
        {
          file: SHEETS,
          from: "                      label: 'Voir le modèle',",
          to: "                      label: 'Voir',",
        },
      ],
      falls: ['→ et l’annonce, avec de quoi y aller'],
    },
  ],
};
