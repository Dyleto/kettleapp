/** Les sabotages de `verify_sound.mjs`. Voir `../run.mjs`. */
export default {
  suite: 'verify_sound.mjs',
  // « Le premier bip est perdu pendant que la sortie s'ouvre » vivait ici.
  // Chromium sous Playwright ouvre la sortie audio sur-le-champ : la sortie
  // « en train de s'ouvrir » n'existe pas au banc, et le cas ne pouvait rien
  // faire tomber. Vitest l'éprouve (`sound.test.ts`, « le lecteur, pendant
  // que la sortie s'ouvre »), et ce sabotage y fait tomber son test.
  cases: [
    {
      name: 'les chiffres du décompte ne sonnent plus',
      edits: [
        {
          file: 'src/features/client/guided/scene/Countdown.tsx',
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
          file: 'src/features/client/guided/scene/Countdown.tsx',
          from: "      playCue('go');\n",
          to: '',
        },
      ],
      falls: ['le départ donne un bip long, plus aigu'],
    },
    {
      name: 'les dernières secondes ne sonnent plus',
      edits: [
        {
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: "        playCue('tick');\n",
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
          file: 'src/features/client/guided/scene/TimedBlock.tsx',
          from: "      if (next.round !== previous.round || next.phase !== previous.phase) {\n        playCue('go');\n",
          to: '      if (next.round !== previous.round || next.phase !== previous.phase) {\n',
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
          file: 'src/features/client/guided/useGuidedSession.ts',
          from: "      playCue('blockEnd');\n",
          to: '',
        },
      ],
      falls: ['quitter le bloc joue deux notes montantes'],
    },
    {
      name: 'finir la séance ne sonne plus',
      edits: [
        {
          file: 'src/features/client/guided/useGuidedSession.ts',
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
      edits: [
        {
          file: 'src/shared/feedback/sound.ts',
          from: '  if (!isSoundEnabled() || !context) return;',
          to: '  if (!context) return;',
        },
      ],
      falls: ['un tour entier se passe alors sans un bip'],
    },
    {
      name: 'valider une série sonne',
      edits: [
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: "import { BlockSets } from './BlockSets';\n",
          to: "import { BlockSets } from './BlockSets';\nimport { playCue } from '@/shared/feedback/sound';\n",
        },
        {
          file: 'src/features/client/guided/scene/ListScene.tsx',
          from: '  const markDone = () => {\n',
          to: "  const markDone = () => {\n    playCue('tick');\n",
        },
      ],
      falls: [
        "valider les séries de l'échauffement n'a rien fait sonner",
        'quitter le bloc joue deux notes montantes',
      ],
    },
    {
      name: "le refus n'est plus retenu",
      edits: [
        {
          file: 'src/shared/feedback/sound.ts',
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
          file: 'src/features/client/guided/screen.ts',
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
        '→ avec un premier bip court',
        'chaque chiffre donne le sien',
        'le départ donne un bip long, plus aigu',
      ],
    },
    {
      name: 'le bip du départ dure autant que les autres',
      edits: [
        {
          file: 'src/shared/feedback/sound.ts',
          from: 'go: [{ frequency: 1320, at: 0, duration: 400 }],',
          to: 'go: [{ frequency: 1320, at: 0, duration: 90 }],',
        },
      ],
      falls: [
        '→ et plus long que les trois qui le précèdent',
        'le départ donne un bip long, plus aigu',
      ],
    },
    {
      name: 'le réglage de « Mon compte » ne répond plus',
      edits: [
        {
          file: 'src/features/account/components/DeviceSettings.tsx',
          from: '          setSound(next);',
          to: '',
        },
      ],
      falls: ['→ et le remet'],
    },
    {
      name: 'la séance perd son bouton de son',
      edits: [
        {
          file: 'src/features/client/guided/SceneShell.tsx',
          from: '  const soundToggle = <SoundToggle color="fg.muted" />;',
          to: '  const soundToggle = null;',
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
    {
      name: 'un mouvement coché ne vibre plus',
      edits: [
        {
          file: 'src/features/client/guided/useGuidedSession.ts',
          from: "      buzz('tap');\n",
          to: '',
        },
      ],
      falls: ['un mouvement coché vibre d’un coup bref'],
    },
    {
      name: 'le réglage des vibrations ne coupe rien',
      edits: [
        {
          file: 'src/shared/feedback/haptics.ts',
          from: '  if (!canVibrate() || !isVibrationEnabled()) return;',
          to: '  if (!canVibrate()) return;',
        },
      ],
      falls: ['→ et un mouvement coché ne vibre plus'],
    },
    {
      name: '« Vibrations » s’affiche sans vibreur',
      edits: [
        {
          file: 'src/features/account/components/DeviceSettings.tsx',
          from: '      {canVibrate() && (',
          to: '      {true && (',
        },
      ],
      falls: ['sans vibreur, « Vibrations » ne s’affiche pas'],
    },
    {
      name: 'un geste vibre longtemps',
      edits: [
        {
          file: 'src/shared/feedback/haptics.ts',
          from: '  tap: 40,',
          to: '  tap: 400,',
        },
      ],
      falls: ['un mouvement coché vibre d’un coup bref'],
    },
  ],
};
