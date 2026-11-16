/** Les sabotages de `verify_voice.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_voice.mjs',
  cases: [
    {
      name: "l'onglet du client redevient « Historique »",
      stale:
        "« l'onglet « Progrès » ouvre l'écran « Progrès » » n'est plus un libellé de la suite",
      edits: [
        {
          file: 'src/features/client/shell/navItems.tsx',
          from: "label: 'Progrès'",
          to: "label: 'Historique'",
        },
      ],
      falls: [
        'les onglets sont Aujourd’hui, Programme, Progrès',
        "l'onglet « Progrès » ouvre l'écran « Progrès »",
      ],
    },
    {
      name: "l'écran des progrès garde son ancien titre",
      stale:
        "« l'onglet « Progrès » ouvre l'écran « Progrès » » n'est plus un libellé de la suite",
      edits: [
        {
          file: 'src/features/client/progress/History.tsx',
          from: '          Progrès\n',
          to: '          Historique\n',
        },
      ],
      falls: ["l'onglet « Progrès » ouvre l'écran « Progrès »"],
    },
    {
      name: 'le rail du coach redevient « Mes clients »',
      edits: [
        {
          file: 'src/features/coach/navItems.tsx',
          from: "label: 'Clients'",
          to: "label: 'Mes clients'",
        },
      ],
      falls: ['le rail est Clients, Modèles, Exercices'],
    },
    {
      name: "l'écran des exercices garde son ancien titre",
      edits: [
        {
          file: 'src/features/exercise/pages/Exercises.tsx',
          from: '                Exercices\n              </Text>',
          to: '                Bibliothèque\n              </Text>',
        },
      ],
      falls: ["l'entrée « Exercices » ouvre l'écran « Exercices »"],
    },
    {
      name: "l'invitation vouvoie et accorde",
      edits: [
        {
          file: 'src/features/auth/pages/Join.tsx',
          from: "{coachFirstName} t'invite sur Kettle",
          to: '{coachFirstName} vous invite à le rejoindre',
        },
      ],
      falls: [
        'le titre est « Julie t’invite sur Kettle »',
        '→ sans vouvoyer la personne invitée',
        '→ et « Réessayer » ramène l’invitation',
      ],
    },
    {
      name: 'une coupure est prise pour un lien mort',
      edits: [
        {
          file: 'src/features/auth/pages/Join.tsx',
          from: 'return isRefusal(error) ? (',
          to: 'return isRefusal(error) || true ? (',
        },
      ],
      falls: [
        'une coupure de réseau dit que Kettle ne répond pas',
        '→ et non que le lien est mort',
        '→ et « Réessayer » ramène l’invitation',
      ],
    },
    {
      name: 'un lien mort est pris pour une coupure',
      edits: [
        {
          file: 'src/features/auth/pages/Join.tsx',
          from: 'return isRefusal(error) ? (',
          to: 'return isRefusal(error) && false ? (',
        },
      ],
      falls: [
        'un lien expiré dit qu’il ne marche plus',
        '→ sans proposer de réessayer',
      ],
    },
    {
      name: "l'aperçu du coach rouvre le bilan en mode modifiable",
      edits: [
        {
          file: 'src/features/coach/components/ClientPreview.tsx',
          from: '                readOnly\n',
          to: '',
        },
      ],
      falls: [
        'le coach lit « Son mot »',
        '→ et non « Ton mot » ni « Ton commentaire »',
        '→ sans pouvoir corriger la séance de son client',
      ],
    },
    {
      name: 'le libellé reste « Ton mot » pour tout le monde',
      edits: [
        {
          file: 'src/features/client/progress/CompletedSessionDrawer.tsx',
          from: "{editable ? 'Ton mot' : 'Son mot'}",
          to: "{'Ton mot'}",
        },
      ],
      falls: [
        'le coach lit « Son mot »',
        '→ et non « Ton mot » ni « Ton commentaire »',
      ],
    },
    {
      name: 'le libellé devient « Son mot » pour tout le monde',
      edits: [
        {
          file: 'src/features/client/progress/CompletedSessionDrawer.tsx',
          from: "{editable ? 'Ton mot' : 'Son mot'}",
          to: "{'Son mot'}",
        },
      ],
      falls: ['le client lit « Ton mot »'],
    },
    {
      name: 'la carte est en lecture seule pour tout le monde',
      edits: [
        {
          file: 'src/features/client/progress/SessionHistoryCard.tsx',
          from: 'editable={!readOnly}',
          to: 'editable={false}',
        },
      ],
      falls: [
        'le client lit « Ton mot »',
        '→ et peut toujours corriger sa séance',
      ],
    },
    {
      name: "l'état vide des ressentis ne nomme plus personne",
      edits: [
        {
          file: 'src/features/coach/components/ClientJournalTab.tsx',
          from: "title={`${clientFirstName ?? 'Ton client'} n'a encore rien fait`}",
          to: 'title="Aucune séance réalisée"',
        },
      ],
      falls: ['les ressentis vides disent « Sarah n’a encore rien fait »'],
    },
    {
      name: "l'écran des ressentis garde son ancien titre",
      edits: [
        {
          file: 'src/features/coach/pages/ClientJournal.tsx',
          from: '          Ressentis de {client.firstName}',
          to: '          Journal de {client.firstName}',
        },
      ],
      falls: ['→ sous le titre « Ressentis de Sarah »'],
    },
    {
      name: 'la précision de rattachement disparaît',
      edits: [
        {
          file: 'src/features/auth/pages/Join.tsx',
          from: "Ton compte sera rattaché à {coachName}. Rien d'autre à créer.",
          to: "Rien d'autre à créer.",
        },
      ],
      falls: ['→ et dit à quel compte elle sera rattachée'],
    },
    {
      name: "un lien sans jeton n'est plus reconnu",
      edits: [
        {
          file: 'src/features/auth/pages/Join.tsx',
          from: 'if (!invitationToken) return <IncompleteLink />;',
          to: '',
        },
      ],
      falls: ['un lien tronqué dit qu’il lui manque un bout'],
    },
    {
      name: 'le coach ne se nomme jamais',
      edits: [
        {
          file: 'src/features/client/common/coach.ts',
          from: '  return name ? { inline: name, opening: name } : UNNAMED;',
          to: '  return name ? UNNAMED : UNNAMED;',
        },
      ],
      falls: ['un seul coach : « Julie ne l’a pas encore lue »'],
    },
    {
      name: 'avec deux coachs, le premier est nommé',
      edits: [
        {
          file: 'src/features/client/common/coach.ts',
          from: "  const name = coaches.length === 1 ? coaches[0].firstName.trim() : '';",
          to: "  const name = coaches.length >= 1 ? coaches[0].firstName.trim() : '';",
        },
      ],
      falls: ['deux coachs : « ton coach », plutôt qu’en nommer un au hasard'],
    },
    {
      name: 'le prénom ne descend pas jusqu’aux écrans',
      note: 'La carte de la dernière séance le lit par le contexte : sans lui, elle retombe sur « ton coach ».',
      edits: [
        {
          file: 'src/features/client/shell/ClientProgramBoundary.tsx',
          from: '    <CoachVoiceContext.Provider value={clientSessions.coach}>',
          to: '    <CoachVoiceContext.Provider value={coachVoice([])}>',
        },
        {
          file: 'src/features/client/shell/ClientProgramBoundary.tsx',
          from: "import { CoachVoiceContext } from '@/features/client/common/coach';",
          to: "import { CoachVoiceContext, coachVoice } from '@/features/client/common/coach';",
        },
      ],
      falls: ['un seul coach : « Julie ne l’a pas encore lue »'],
    },
  ],
};
