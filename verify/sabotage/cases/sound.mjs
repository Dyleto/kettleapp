/** Les sabotages de `verify_sound.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_sound.mjs',
  cases: [
    {
      name: 'les chiffres du décompte ne sonnent plus',
      edits: [
        {
          file: 'src/features/client/components/scene/Countdown.tsx',
          from: "    if (remaining > 0) playCue('tick');",
          to: '',
        },
      ],
      falls: [
        '→ avec un premier bip court',
        'chaque chiffre donne le sien',
        'le départ donne un bip long, plus aigu',
      ],
    },
    {
      name: 'le départ ne sonne plus',
      edits: [
        {
          file: 'src/features/client/components/scene/Countdown.tsx',
          from: "      playCue('go');\n",
          to: '',
        },
      ],
      falls: ['le départ donne un bip long, plus aigu'],
    },
    {
      name: "le premier bip est perdu pendant que la sortie s'ouvre",
      edits: [
        {
          file: 'src/features/client/sound.ts',
          from: '        if (Date.now() - askedAt <= STALE_AFTER) schedule(output, cue);',
          to: '',
        },
      ],
      falls: [
        '→ avec un premier bip court',
        'chaque chiffre donne le sien',
        'le départ donne un bip long, plus aigu',
      ],
    },
    {
      name: 'les dernières secondes ne sonnent plus',
      edits: [
        {
          file: 'src/features/client/components/guided/Timer.tsx',
          from: "      playCue('tick');\n",
          to: '',
        },
      ],
      falls: [
        'ses trois dernières secondes donnent trois bips courts',
        '→ et plus long que les trois qui le précèdent',
      ],
    },
    {
      name: 'la fin du décompte ne sonne plus',
      edits: [
        {
          file: 'src/features/client/components/guided/Timer.tsx',
          from: "      playCue('go');\n",
          to: '',
        },
      ],
      falls: [
        'le changement de tour donne un bip, plus aigu',
        '→ et plus long que les trois qui le précèdent',
      ],
    },
    {
      name: 'quitter un bloc ne sonne plus',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: "if (leavesBlock) playCue('blockEnd');",
          to: '',
        },
      ],
      falls: ['quitter le bloc joue deux notes montantes'],
    },
    {
      name: 'finir la séance ne sonne plus',
      stale: 'le motif correspond 2 fois dans GuidedSession.tsx',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: "      playCue('sessionEnd');\n",
          to: '',
        },
      ],
      falls: [
        'terminer joue trois notes montantes',
        '→ dont la dernière est le bip du départ, entendu toute la séance',
      ],
    },
    {
      name: 'le lecteur ignore le réglage',
      stale: 'le motif correspond 0 fois dans sound.ts',
      edits: [
        {
          file: 'src/features/client/sound.ts',
          from: '  if (!isSoundEnabled()) return;\n',
          to: '',
        },
      ],
      falls: ['un tour entier se passe alors sans un bip'],
    },
    {
      name: 'valider une série sonne',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '  const markDone = () => {',
          to: "  const markDone = () => {\n    playCue('tick');",
        },
      ],
      falls: [
        "valider les séries de l'échauffement n'a rien fait sonner",
        'quitter le bloc joue deux notes montantes',
        'valider sept paliers ne fait rien sonner',
        'terminer joue trois notes montantes',
        '→ dont la dernière est le bip du départ, entendu toute la séance',
      ],
    },
    {
      name: "le refus n'est plus retenu",
      edits: [
        {
          file: 'src/features/client/sound.ts',
          from: '  else storage.setItem(KEY, MUTED);\n',
          to: '',
        },
      ],
      falls: [
        'le bouton dit alors qu’il le remettra',
        'un tour entier se passe alors sans un bip',
        "le réglage est retenu sur l'appareil",
        '« Mon compte » le montre coupé',
        '→ et le remet',
      ],
    },
    {
      name: "la sortie audio n'est jamais ouverte",
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: "    document.addEventListener('click', unlockSound, true);\n",
          to: '',
        },
      ],
      falls: [
        'quitter le bloc joue deux notes montantes',
        'ses trois dernières secondes donnent trois bips courts',
        'le changement de tour donne un bip, plus aigu',
        '→ et plus long que les trois qui le précèdent',
        'terminer joue trois notes montantes',
        '→ dont la dernière est le bip du départ, entendu toute la séance',
      ],
    },
    {
      name: 'le bip du départ dure autant que les autres',
      edits: [
        {
          file: 'src/features/client/sound.ts',
          from: 'go: [{ frequency: 1320, at: 0, duration: 400 }],',
          to: 'go: [{ frequency: 1320, at: 0, duration: 90 }],',
        },
      ],
      falls: ['→ et plus long que les trois qui le précèdent'],
    },
    {
      name: 'le réglage de « Mon compte » ne répond plus',
      edits: [
        {
          file: 'src/features/client/components/SoundSetting.tsx',
          from: '        setEnabled(!enabled);',
          to: '',
        },
      ],
      falls: ['→ et le remet'],
    },
    {
      name: 'la séance perd son bouton de son',
      stale: 'le motif correspond 0 fois dans GuidedSession.tsx',
      edits: [
        {
          file: 'src/features/client/components/GuidedSession.tsx',
          from: '          {soundToggle}\n          {quitButton}\n        </HStack>',
          to: '          {quitButton}\n        </HStack>',
        },
      ],
      falls: [
        'la séance porte de quoi couper le son',
        'le bouton dit alors qu’il le remettra',
        'un tour entier se passe alors sans un bip',
        "le réglage est retenu sur l'appareil",
        '« Mon compte » le montre coupé',
        '→ et le remet',
      ],
    },
  ],
};
