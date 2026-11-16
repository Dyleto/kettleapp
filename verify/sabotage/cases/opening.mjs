/** Les sabotages de `verify_opening.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_opening.mjs',
  cases: [
    {
      name: 'les exercices redeviennent des étapes',
      edits: [
        {
          file: 'src/domain/session/measure.ts',
          from: '  new Set(\n    session.blocks.flatMap((block) =>\n      block.exercises.map((entry) => entry.exercise._id)\n    )\n  ).size;',
          to: '  session.blocks.reduce(\n    (sum, block) => sum + (block.rounds ?? setsOfBlock(block).length),\n    0\n  );',
        },
      ],
      falls: [
        'trois exercices sont annoncés, pas quinze',
        'sept exercices sont annoncés, pas douze',
      ],
    },
    {
      name: "le repère d'un bloc ne suit plus son format",
      edits: [
        {
          file: 'src/domain/session/measure.ts',
          from: 'export const blockMarker = (block: SessionBlock): string => {',
          to: 'export const blockMarker = (block: SessionBlock): string => {\n  if (block.order > 0) return `${block.exercises.length} exercices`;',
        },
      ],
      falls: [
        'chaque bloc porte son repère, dans son unité',
        'les trois blocs sont annoncés dans leur ordre',
      ],
    },
    {
      name: 'le jour conseillé disparaît',
      edits: [
        {
          file: 'src/features/client/guided/outline.ts',
          from: "  const advice = days ? `conseillée ${days}` : '';",
          to: "  const advice = days ? '' : '';",
        },
      ],
      falls: ['→ précédé de son rang et du jour conseillé'],
    },
    {
      name: "le mot du coach n'ouvre plus la séance",
      edits: [
        {
          file: 'src/features/client/guided/scene/Opening.tsx',
          from: '        {note && <CoachBubble>{note}</CoachBubble>}',
          to: '        {note && false && <CoachBubble>{note}</CoachBubble>}',
        },
      ],
      falls: ['le mot du coach ouvre la séance, sous son prénom'],
    },
    {
      name: "une bulle vide s'affiche sans mot du coach",
      edits: [
        {
          file: 'src/features/client/guided/scene/Opening.tsx',
          from: '        {note && <CoachBubble>{note}</CoachBubble>}',
          to: '        {(note || true) && <CoachBubble>{note}</CoachBubble>}',
        },
      ],
      falls: ["aucune bulle quand le coach n'a rien écrit"],
    },
    {
      name: "l'heure de départ se pose à l'affichage",
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: '    if (!pastOpening) return;\n',
          to: '',
        },
      ],
      falls: ['→ sans que rien ne soit commencé'],
    },
    {
      name: 'la croix ne ferme plus',
      edits: [
        {
          file: 'src/features/client/guided/scene/Opening.tsx',
          from: '          onClick={onClose}',
          to: '          onClick={() => {}}',
        },
      ],
      falls: ['la croix revient à la fiche de séance'],
    },
    {
      name: 'le décompte ne nomme plus le geste',
      edits: [
        {
          file: 'src/features/client/guided/GuidedSession.tsx',
          from: '        detail={gesture.detail}\n',
          to: '',
        },
      ],
      falls: ['le décompte annonce le premier geste par son nom'],
    },
    {
      name: "l'ouverture perd le réglage du son",
      edits: [
        {
          file: 'src/features/client/guided/scene/Opening.tsx',
          from: '        <SoundToggle />\n',
          to: '',
        },
      ],
      falls: ["le son se règle dès l'ouverture"],
    },
    {
      name: 'le titre ignore le nom de la séance',
      edits: [
        {
          file: 'src/domain/session/name.ts',
          from: '  session.name?.trim() || sessionRank(session.order);',
          to: '  sessionRank(session.order);',
        },
      ],
      falls: ['le titre est le nom de la séance'],
    },
    {
      name: 'la durée approchée disparaît',
      edits: [
        {
          file: 'src/features/client/guided/scene/Opening.tsx',
          from: '            ≈&nbsp;{estimatedMinutes(session)}&nbsp;min\n',
          to: '',
        },
      ],
      falls: ['→ avec le nombre de blocs et une durée approchée'],
    },
  ],
};
