/** Les sabotages de `verify_motion.mjs`. Voir `../run.mjs`. */
const THEME = 'src/theme.ts';
const MOTION = 'src/kit/motion.ts';
const CHECK = 'src/kit/DrawnCheck.tsx';
const RING = 'src/kit/Ring.tsx';
const SCENE = 'src/features/client/guided/GuidedScene.tsx';
const STEPPER = 'src/features/client/guided/scene/NumberStepper.tsx';
const AMRAP = 'src/features/client/guided/scene/AmrapBlock.tsx';
const SETS = 'src/features/client/guided/scene/BlockSets.tsx';
const NEXT = 'src/features/client/guided/scene/NextBlock.tsx';
const CARD = 'src/features/client/home/WeekCard.tsx';
const MEMORY = 'src/features/client/home/ringMemory.ts';
const WEEK = 'src/features/client/end/Week.tsx';

const ENTERS = 'un bloc passé : l’écran « Bloc suivant » entre, puis le bloc';
const NEXT_CHECK = '→ la coche du bloc fini s’y dessine';
const JUMPS = '« + » fait sauter la charge';
const JUMPS_AGAIN = '→ et la refait sauter au pas suivant';
const TYPED = '→ pas à la frappe : le nombre ne saute pas sous les doigts';
const STOP =
  '→ ni contre une butée : « − » sans charge ne change rien, et rien ne saute';
const CHECKED = 'cocher la série dessine sa coche dans la liste';
const STAYS = '→ sans faire entrer de scène : on est toujours dans le bloc';
const RESUMED =
  'la séance reprise : la série faite est tracée, sans se redessiner';
const REDONE = '→ défaite puis refaite, elle se dessine de nouveau';
const ROUNDS = 'un tour bouclé fait sauter le compte';
const CHANGED =
  'une séance de plus depuis la dernière visite : l’anneau part d’un tiers et monte aux deux';
const END_FILL =
  '« Ta semaine » remplit son anneau de la séance qu’on vient de faire';
const END_ONCE = '→ et l’accueil, derrière, ne le remplit pas une seconde fois';
const REDUCED =
  'rien n’entre, ne saute ni ne se dessine : la scène, la charge, la coche';
const REDUCED_RING =
  '→ et l’anneau qui a changé est à sa nouvelle place, sans se remplir';

export default {
  suite: 'verify_motion.mjs',
  cases: [
    {
      name: 'la scène n’entre plus',
      edits: [
        {
          file: SCENE,
          from: '          animation={enter}\n',
          to: '',
        },
      ],
      falls: [ENTERS],
    },
    {
      // Une scène identifiée par ce qui est coché entrerait à chaque série.
      name: 'une série cochée change de scène',
      edits: [
        {
          file: SCENE,
          from: '        : `block-${step.block.order}`;',
          to: '        : `block-${step.block.order}-${state.done.length}`;',
        },
      ],
      falls: [STAYS],
    },
    {
      // Sans le jumeau, le nom ne change pas d'un rendu à l'autre : seule
      // la première fois joue.
      name: 'le jumeau ne relance rien',
      edits: [
        {
          file: MOTION,
          from: '  return `${plays % 2 === 1 ? name : `${name}Again`} ${MOTION[name]}`;',
          to: '  return `${name} ${MOTION[name]}`;',
        },
      ],
      falls: [ENTERS, JUMPS_AGAIN],
    },
    {
      name: 'le saut n’a plus de hauteur',
      edits: [
        {
          file: THEME,
          from: "  '35%': { transform: 'translateY(-6px) scale(1.12)' },",
          to: "  '35%': { transform: 'translateY(0) scale(1)' },",
        },
      ],
      falls: [JUMPS, JUMPS_AGAIN, ROUNDS],
    },
    {
      name: 'l’entrée ne part de nulle part',
      edits: [
        {
          file: THEME,
          from: "  from: { opacity: 0, transform: 'translateY(8px)' },",
          to: "  from: { opacity: 1, transform: 'translateY(0)' },",
        },
      ],
      falls: [ENTERS],
    },
    {
      name: 'le nombre saute à la frappe',
      edits: [
        {
          file: STEPPER,
          from: "  const jump = useReplay(steps, 'valueJump');",
          to: "  const jump = useReplay(value, 'valueJump');",
        },
      ],
      falls: [TYPED],
    },
    {
      name: 'le nombre saute contre une butée',
      edits: [
        {
          file: STEPPER,
          from: '    if (next !== value) setSteps((count) => count + 1);',
          to: '    setSteps((count) => count + 1);',
        },
      ],
      falls: [STOP],
    },
    {
      name: 'le compte des tours ne saute plus',
      edits: [
        {
          file: AMRAP,
          from: '              animation={jump}\n              _motionReduce={{ animation: \'none\' }}\n              data-jump="rounds"',
          to: '              data-jump="rounds"',
        },
      ],
      falls: [ROUNDS],
    },
    {
      name: 'la coche se redessine à la reprise',
      edits: [
        {
          file: SETS,
          from: '                    draw={justDone.has(e.key)}',
          to: '                    draw',
        },
      ],
      falls: [RESUMED],
    },
    {
      // La mémoire ne retient plus une série qui redevient à faire : refaite,
      // elle passe pour déjà gagnée.
      name: 'les coches oublient ce qui redevient à faire',
      edits: [
        {
          file: MOTION,
          from: '  if (fresh.length > 0) {',
          to: '  if (fresh.length < 0) {',
        },
      ],
      falls: [REDONE],
    },
    {
      // Le défaut réparé : la série refaite revenait en carte ouverte, et
      // sa coche n'avait nulle part où se dessiner.
      name: '« Refaire » laisse la carte ouverte',
      edits: [
        {
          file: SETS,
          from: '                      setOpened(null);\n',
          to: '',
        },
      ],
      falls: [REDONE],
    },
    {
      name: 'la coche du bloc fini est posée d’avance',
      edits: [
        {
          file: NEXT,
          from: '            <DrawnCheck size={22} />',
          to: '            <DrawnCheck size={22} draw={false} />',
        },
      ],
      falls: [NEXT_CHECK],
    },
    {
      name: 'la coche ne se trace plus',
      edits: [
        {
          file: CHECK,
          from: '      animation={draw ? `checkDraw ${MOTION.checkDraw} both` : undefined}',
          to: '      animation={undefined}',
        },
      ],
      falls: [NEXT_CHECK, CHECKED, REDONE],
    },
    {
      name: 'l’accueil ne part pas de ce qu’il avait vu',
      edits: [{ file: CARD, from: '              from={from}\n', to: '' }],
      falls: [CHANGED],
    },
    {
      name: 'l’accueil ne retient pas ce qu’il a montré',
      edits: [
        {
          file: MEMORY,
          from: '    if (part !== null) rememberRing(part);',
          to: '    void rememberRing;',
        },
      ],
      falls: [CHANGED],
    },
    {
      name: 'l’écran de fin ne retient pas la semaine',
      edits: [
        {
          file: WEEK,
          from: '    if (target > 0) rememberRing(Math.min(1, after / target));',
          to: '    void rememberRing;',
        },
      ],
      falls: [END_ONCE],
    },
    {
      name: 'l’écran de fin ne part plus de la semaine d’avant',
      edits: [
        {
          file: WEEK,
          from: '                from={before !== after ? before / target : undefined}',
          to: '                from={undefined}',
        },
      ],
      falls: [END_FILL],
    },
    {
      name: 'l’anneau se remplit sous « réduire les animations »',
      edits: [
        {
          file: RING,
          from: "          _motionReduce={{ transition: 'none', animation: 'none' }}",
          to: "          _motionReduce={{ transition: 'none' }}",
        },
      ],
      falls: [REDUCED_RING],
    },
    {
      name: 'la scène entre sous « réduire les animations »',
      edits: [
        {
          file: SCENE,
          from: "          animation={enter}\n          _motionReduce={{ animation: 'none' }}",
          to: '          animation={enter}',
        },
      ],
      falls: [REDUCED],
    },
    {
      name: 'la charge saute sous « réduire les animations »',
      edits: [
        {
          file: STEPPER,
          from: '          _motionReduce={{ animation: \'none\' }}\n          data-jump="stepper"',
          to: '          data-jump="stepper"',
        },
      ],
      falls: [REDUCED],
    },
    {
      name: 'la coche se dessine sous « réduire les animations »',
      edits: [
        {
          file: CHECK,
          from: "      _motionReduce={{ animation: 'none' }}\n",
          to: '',
        },
      ],
      falls: [REDUCED],
    },
  ],
};
