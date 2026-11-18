/** Les sabotages de `verify_block.mjs`. Voir `../run.mjs`. */
const BLOCK = 'src/features/workshop/components/WorkshopBlock.tsx';
const SETTINGS = 'src/features/workshop/components/BlockSettings.tsx';
const SHEET = 'src/features/workshop/components/BlockSheet.tsx';

export default {
  suite: 'verify_block.mjs',
  cases: [
    {
      // Les réglages se lisent encore, mais ne se touchent plus.
      name: 'sur grand écran, les pastilles sont muettes',
      edits: [
        {
          file: BLOCK,
          from: "            layout={settingsInSheet ? 'static' : 'pills'}",
          to: '            layout="static"',
        },
      ],
      falls: [
        'les réglages se touchent en pastilles, le reste attend derrière « ⋯ »',
        'toucher une pastille l’ouvre sur place, prête à la frappe',
        '→ « + » règle la valeur sans clavier',
        'Échap referme la pastille et rend le focus à la pastille',
      ],
    },
    {
      name: 'une pastille touchée attend un second clic',
      edits: [
        {
          file: SETTINGS,
          from: "      clearable={optional}\n      startOpen={size === 'pill'}",
          to: '      clearable={optional}',
        },
      ],
      falls: ['toucher une pastille l’ouvre sur place, prête à la frappe'],
    },
    {
      name: 'l’intervalle ne s’enregistre plus',
      edits: [
        {
          file: SETTINGS,
          from: '              onChange={(v) => onUpdate({ intervalMinutes: v ?? 1 })}',
          to: '              onChange={() => undefined}',
        },
      ],
      falls: ['→ « + » règle la valeur sans clavier'],
    },
    {
      name: 'la pastille refermée ne reprend pas le focus',
      edits: [
        {
          file: 'src/features/workshop/components/BlockPill.tsx',
          from: '    if (!open && refocus) pillRef.current?.focus();',
          to: '    if (!open && refocus) void pillRef;',
        },
      ],
      falls: ['Échap referme la pastille et rend le focus à la pastille'],
    },
    {
      // Le champ annulé au clavier laisse le focus tomber sur la page : la
      // pastille ne sait plus qu'on était chez elle.
      name: 'un nombre quitté au clavier perd le focus',
      edits: [
        {
          file: 'src/features/workshop/components/InlineValue.tsx',
          from: '    if (!isEditing && pending) buttonRef.current?.focus();',
          to: '    if (!isEditing && pending) void buttonRef;',
        },
      ],
      falls: ['Échap referme la pastille et rend le focus à la pastille'],
    },
    {
      name: '« Nommer le bloc » n’ouvre rien',
      edits: [
        {
          file: BLOCK,
          from: "              onClick={() => afterMenu(() => setFieldAsked('name'))}",
          to: '              onClick={() => undefined}',
        },
      ],
      falls: [
        '« Nommer le bloc » ouvre le nom, qui se lit ensuite en pastille',
      ],
    },
    {
      name: '« Ajouter une consigne » n’ouvre rien',
      edits: [
        {
          file: BLOCK,
          from: "              onClick={() => afterMenu(() => setFieldAsked('instruction'))}",
          to: '              onClick={() => undefined}',
        },
      ],
      falls: ['« Ajouter une consigne » l’écrit, et elle se relit en bulle'],
    },
    {
      name: 'la consigne du bloc ne se montre plus',
      edits: [
        {
          file: BLOCK,
          from: '    ) : hasInstruction ? (',
          to: '    ) : false ? (',
        },
      ],
      falls: [
        'le nom en pastille, la consigne en bulle avant les exercices',
        '« Ajouter une consigne » l’écrit, et elle se relit en bulle',
      ],
    },
    {
      // Les tours d'un EMOM devenu AMRAP partiraient à l'API sous un format
      // qui ne les lit pas.
      name: 'un changement de format garde tous les réglages',
      edits: [
        {
          file: 'src/domain/session/format.ts',
          from: '      reads.includes(key) ? (block[key] ?? defaults[key]) : undefined,',
          to: '      block[key] ?? defaults[key],',
        },
      ],
      falls: [
        '« Changer de format » garde les exercices, et prend les réglages du format',
      ],
    },
    {
      name: '« Annuler » ne remet pas l’ancien format',
      edits: [
        {
          file: 'src/features/workshop/hooks/useProgramWorkshop.ts',
          from: '      undo: () => actions.replaceBlock(activeSession._id, blockId, before),',
          to: '      undo: () => undefined,',
        },
      ],
      falls: ['→ « Annuler » remet l’EMOM et ses tours'],
    },
    {
      name: 'la copie d’un bloc se pose en tête de séance',
      edits: [
        {
          file: 'src/features/workshop/hooks/useProgramEditor.ts',
          from: '          blocks.splice(index + 1, 0, {',
          to: '          blocks.splice(0, 0, {',
        },
      ],
      falls: ['« Dupliquer le bloc » pose la copie juste dessous'],
    },
    {
      name: '« Supprimer le bloc » ne fait rien',
      edits: [
        {
          file: BLOCK,
          from: '            <Menu.Item value="remove" color="app.error" onClick={onRemove}>',
          to: '            <Menu.Item value="remove" color="app.error">',
        },
      ],
      falls: [
        '« Supprimer le bloc » le retire tout de suite, avec « Annuler »',
      ],
    },
    {
      name: 'sur téléphone, l’en-tête n’ouvre rien',
      edits: [
        {
          file: BLOCK,
          from: '        headerAction={\n          settingsInSheet\n',
          to: '        headerAction={\n          false\n',
        },
      ],
      falls: [
        'l’en-tête entier ouvre les réglages du bloc, en grand',
        '→ « C’est bon » la referme, le réglage lu dans l’en-tête',
        '→ « Changer de format » s’y fait aussi',
        '→ le retour du téléphone la referme, sans quitter la séance',
      ],
    },
    {
      name: '« C’est bon » ne referme plus la feuille du bloc',
      edits: [
        {
          file: SHEET,
          from: '            <ActionButton size="md" w="full" onClick={onClose}>',
          to: '            <ActionButton size="md" w="full">',
        },
      ],
      falls: ['→ « C’est bon » la referme, le réglage lu dans l’en-tête'],
    },
    {
      name: 'le retour du téléphone ne referme plus la feuille du bloc',
      edits: [
        {
          file: SHEET,
          from: '  useSheetDismiss(true, onClose);',
          to: '  useSheetDismiss(false, onClose);',
        },
      ],
      falls: ['→ le retour du téléphone la referme, sans quitter la séance'],
    },
  ],
};
