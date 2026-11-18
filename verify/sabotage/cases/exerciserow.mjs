/** Les sabotages de `verify_exerciserow.mjs`. Voir `../run.mjs`. */
const ROW = 'src/features/workshop/components/ExerciseRow.tsx';
const SETTINGS = 'src/features/workshop/components/ExerciseSettings.tsx';
const DISMISS = 'src/shared/hooks/useOutsideDismiss.ts';
const TAB = 'src/features/coach/components/ClientProgramTab.tsx';
const BLOCK = 'src/features/workshop/components/WorkshopBlock.tsx';

export default {
  suite: 'verify_exerciserow.mjs',
  cases: [
    {
      name: 'une ligne sans dose ne dit plus « à régler »',
      edits: [
        {
          file: ROW,
          from: "          {dose ?? 'à régler'}",
          to: '          {dose}',
        },
      ],
      falls: ['une ligne sans dose dit « à régler »'],
    },
    {
      // Chaque ligne porte ses réglages en permanence, comme avant E5.
      name: 'les réglages sont toujours dépliés',
      edits: [
        {
          file: ROW,
          from: '  const lit = open && !inSheet;',
          to: '  const lit = !inSheet;',
        },
      ],
      falls: [
        'le nom et la dose, et rien d’autre à toucher',
        'aucun réglage visible tant qu’aucune ligne n’est ouverte',
      ],
    },
    {
      name: '« + » ne fait plus rien',
      edits: [
        {
          file: 'src/features/workshop/components/Stepper.tsx',
          from: '      onClick={() => onChange(stepped(kind, value, 1))}',
          to: '      onClick={() => undefined}',
        },
      ],
      falls: [
        '« + » ajoute une répétition, et le serveur la reçoit',
        'la dose se lit en entier, et le repos se règle avec elle',
        '→ « C’est bon » la referme, la dose réglée sur la ligne',
      ],
    },
    {
      // Une ligne ouverte par bloc, et non par séance : au clic, la
      // ligne quittée se referme d'elle-même ; au clavier, plus rien ne la
      // referme.
      name: 'une ligne ouverte par bloc',
      edits: [
        {
          file: TAB,
          from: '  const [openRow, setOpenRow] = useState<{\n    blockId: string;\n    index: number;\n  } | null>(focused);',
          to: '  const [openByBlock, setOpenByBlock] = useState<\n    Record<string, number | null>\n  >({});',
        },
        {
          file: TAB,
          from: '                        openRow?.blockId === block._id ? openRow.index : null',
          to: '                        openByBlock[block._id] ?? null',
        },
        {
          file: TAB,
          from: '                        setOpenRow(\n                          index === null ? null : { blockId: block._id, index }\n                        )',
          to: '                        setOpenByBlock((m) => ({ ...m, [block._id]: index }))',
        },
      ],
      falls: ['une seule ligne ouverte à la fois, d’un bloc à l’autre'],
    },
    {
      // Deux panneaux ouverts, l'état que l'atelier ne connaît plus : c'est
      // le seul où l'écouteur réabonné à chaque rendu manque l'Échap. La
      // règle par bloc les y met ; le cas précédent montre qu'elle seule ne
      // fait pas tomber l'Échap.
      name: 'deux lignes ouvertes, et l’écouteur qui se réabonne à chaque rendu',
      edits: [
        {
          file: TAB,
          from: '  const [openRow, setOpenRow] = useState<{\n    blockId: string;\n    index: number;\n  } | null>(focused);',
          to: '  const [openByBlock, setOpenByBlock] = useState<\n    Record<string, number | null>\n  >({});',
        },
        {
          file: TAB,
          from: '                        openRow?.blockId === block._id ? openRow.index : null',
          to: '                        openByBlock[block._id] ?? null',
        },
        {
          file: TAB,
          from: '                        setOpenRow(\n                          index === null ? null : { blockId: block._id, index }\n                        )',
          to: '                        setOpenByBlock((m) => ({ ...m, [block._id]: index }))',
        },
        {
          file: DISMISS,
          from: '    const onDismiss = () => dismissRef.current();\n',
          to: '',
        },
        {
          file: DISMISS,
          from: '  }, [ref, isOpen]);',
          to: '  }, [ref, isOpen, onDismiss]);',
        },
      ],
      falls: [
        'une seule ligne ouverte à la fois, d’un bloc à l’autre',
        'Échap la referme, et rend le focus à la ligne',
      ],
    },
    {
      name: 'Échap ne referme plus rien',
      edits: [
        {
          file: DISMISS,
          from: "        event.key === 'Escape' &&",
          to: "        event.key === 'Esc' &&",
        },
      ],
      falls: ['Échap la referme, et rend le focus à la ligne'],
    },
    {
      name: 'le focus n’est plus rendu à la ligne',
      edits: [
        {
          file: ROW,
          from: '    if (inside) toggleRef.current?.focus();',
          to: '    void inside;',
        },
      ],
      falls: ['Échap la referme, et rend le focus à la ligne'],
    },
    {
      name: 'la ligne ouverte n’écoute plus ce qui se passe ailleurs',
      edits: [
        {
          file: ROW,
          from: '  useOutsideDismiss(rootRef, open && !inSheet, close);',
          to: '  useOutsideDismiss(rootRef, false, close);',
        },
      ],
      falls: [
        'Échap la referme, et rend le focus à la ligne',
        'un clic ailleurs la referme',
        '« + consigne » l’écrit, et la ligne fermée la relit dessous',
      ],
    },
    {
      // Échap annule la saisie du nombre, et ferme la ligne du même coup.
      name: 'un Échap déjà consommé referme quand même',
      edits: [
        {
          file: DISMISS,
          from: '        !event.defaultPrevented &&\n',
          to: '',
        },
      ],
      falls: [
        'Échap dans le nombre rend la valeur d’avant, sans refermer la ligne',
      ],
    },
    {
      name: 'toucher « Annuler » compte comme un clic ailleurs',
      edits: [
        {
          file: DISMISS,
          from: `const LAYER = '[role="dialog"], [data-scope="toast"]';`,
          to: `const LAYER = '[role="dialog"]';`,
        },
      ],
      falls: ['→ « Annuler » remet les 12 reps, la ligne toujours ouverte'],
    },
    {
      name: 'changer d’unité efface sans prévenir',
      edits: [
        {
          file: SETTINGS,
          from: '    if (erased)\n',
          to: '    if (!erased)\n',
        },
      ],
      falls: [
        '« Durée » passe la dose en durée, et la bannière dit ce qui s’efface',
        '→ « Annuler » remet les 12 reps, la ligne toujours ouverte',
      ],
    },
    {
      name: '« Autre unité » ne demande plus sa valeur',
      edits: [
        {
          file: SETTINGS,
          from: "    setCustomAsked(next === 'custom');",
          to: '    setCustomAsked(false);',
        },
      ],
      falls: [
        '« Autre unité » demande sa valeur : le champ s’ouvre, prêt à la frappe',
        '→ « 400 m » se lit sur la ligne, et le serveur ne garde que la mesure',
      ],
    },
    {
      name: 'la copie se pose en tête du bloc',
      edits: [
        {
          file: 'src/features/workshop/hooks/useProgramWorkshop.ts',
          from: '    actions.insertExercise(activeSession._id, blockId, index + 1, {',
          to: '    actions.insertExercise(activeSession._id, blockId, 0, {',
        },
      ],
      falls: ['« Dupliquer » pose la copie juste dessous, et l’ouvre'],
    },
    {
      name: 'après une copie, c’est l’original qui reste ouvert',
      edits: [
        {
          file: BLOCK,
          from: '            onOpenRow(index + 1);',
          to: '            onOpenRow(index);',
        },
      ],
      falls: ['« Dupliquer » pose la copie juste dessous, et l’ouvre'],
    },
    {
      name: 'une ligne retirée reste ouverte',
      edits: [
        {
          file: BLOCK,
          from: '            onOpenRow(null);\n',
          to: '',
        },
      ],
      falls: [
        '« Retirer » la retire tout de suite, avec « Annuler », et rien ne reste ouvert',
      ],
    },
    {
      name: 'une série unique garde son repos',
      edits: [
        {
          file: SETTINGS,
          from: '  const restStepper = supportsSets && sets > 1 && (',
          to: '  const restStepper = supportsSets && (',
        },
      ],
      falls: ['→ ramenée à une série, la ligne perd son repos'],
    },
    {
      name: 'la ligne fermée ne relit plus sa consigne',
      edits: [
        {
          file: ROW,
          from: '        {note && !lit && (',
          to: '        {note && lit && (',
        },
      ],
      falls: ['« + consigne » l’écrit, et la ligne fermée la relit dessous'],
    },
    {
      name: 'sur téléphone, les réglages se déplient sous la ligne',
      edits: [
        {
          file: TAB,
          from: '                      settingsInSheet={!!isMobile}',
          to: '                      settingsInSheet={false}',
        },
      ],
      falls: [
        'toucher une ligne ouvre ses réglages en feuille, pas dessous',
        '→ « C’est bon » la referme, la dose réglée sur la ligne',
        '→ le retour du téléphone la referme, sans quitter la séance',
      ],
    },
    {
      name: 'le retour du téléphone ne referme plus la feuille',
      edits: [
        {
          file: ROW,
          from: '  useSheetDismiss(open && inSheet, close);',
          to: '  useSheetDismiss(false, close);',
        },
      ],
      falls: ['→ le retour du téléphone la referme, sans quitter la séance'],
    },
  ],
};
