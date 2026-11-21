/** Les sabotages de `verify_voice.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_voice.mjs',
  cases: [
    {
      name: "l'onglet du client redevient « Historique »",
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
      falls: ['le rail est À lire, Clients, Modèles, Exercices'],
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
      name: "l'aperçu du coach ouvre la séance en lecteur client",
      // La carte passait `readOnly` au tiroir ; le panneau dit au détail
      // qui lit (F3b, F4b).
      edits: [
        {
          file: 'src/features/coach/components/ClientPreview.tsx',
          from: '          viewer="coach"\n',
          to: '          viewer="self"\n',
        },
      ],
      falls: [
        'le coach lit « Son mot »',
        '→ et non « Ton mot » ni « Ton commentaire »',
      ],
    },
    {
      name: "l'aperçu du coach propose « Corriger »",
      edits: [
        {
          file: 'src/features/coach/components/ClientPreview.tsx',
          from: '          viewer="coach"\n          onClose={() => setOpenedId(null)}',
          to: '          viewer="coach"\n          onCorrect={() => undefined}\n          onClose={() => setOpenedId(null)}',
        },
      ],
      falls: ['→ sans pouvoir corriger la séance de son client'],
    },
    {
      name: 'le libellé reste « Ton mot » pour tout le monde',
      edits: [
        {
          file: 'src/features/client/progress/CompletedDetail.tsx',
          from: "<Eyebrow>{self ? 'Ton mot' : 'Son mot'}</Eyebrow>",
          to: "<Eyebrow>{'Ton mot'}</Eyebrow>",
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
          file: 'src/features/client/progress/CompletedDetail.tsx',
          from: "<Eyebrow>{self ? 'Ton mot' : 'Son mot'}</Eyebrow>",
          to: "<Eyebrow>{'Son mot'}</Eyebrow>",
        },
      ],
      falls: ['le client lit « Ton mot »'],
    },
    {
      name: 'Progrès ouvre la séance en lecture seule',
      // Sur téléphone, la feuille de Progrès : c'est elle que lit la
      // suite, et non le panneau du grand écran.
      edits: [
        {
          file: 'src/features/client/progress/History.tsx',
          from: '          onCorrect={() => setCorrecting(true)}\n          onClose={() => setOpenedId(null)}',
          to: '          onClose={() => setOpenedId(null)}',
        },
      ],
      // « Ton mot » ne dépend plus de « Corriger » mais de qui lit : seule
      // la correction tombe.
      falls: ['→ et peut toujours corriger sa séance'],
    },
    {
      name: "l'état vide des ressentis ne nomme plus personne",
      edits: [
        {
          file: 'src/features/coach/pages/ClientJournal.tsx',
          from: "title={`${client.firstName ?? 'Ton client'} n'a encore rien fait`}",
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
          from: 'client ? `Ressentis de ${client.firstName',
          to: 'client ? `Journal de ${client.firstName',
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
