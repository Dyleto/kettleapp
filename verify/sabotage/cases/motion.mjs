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
const LADDER = 'src/features/client/guided/scene/LadderBlock.tsx';

const ENTERS = 'un bloc passé : l’écran « Bloc suivant » entre, puis le bloc';
const EACH = '→ élément par élément : 14 px, 420 ms, 50 ms de l’un au suivant';
const NEXT_CHECK = '→ la coche du bloc fini s’y dessine';
const JUMP_VALUES = '→ à 128 %, en 280 ms';
const CHECK_TIME = '→ en 300 ms';
const LADDER_CHECK = '« Échelle bouclée » dessine sa coche';
const RING_TIME = '→ en 1,1 s, en décélérant';
const DAY_CHECK = '→ et la coche du jour se dessine';
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
          from: '          css={staggered(entering)}\n',
          to: '',
        },
      ],
      falls: [ENTERS, EACH],
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
      falls: [ENTERS, EACH, JUMPS_AGAIN],
    },
    {
      name: 'le saut n’a plus de hauteur',
      edits: [
        {
          file: THEME,
          from: "  '40%': { transform: 'scale(1.28)' },",
          to: "  '40%': { transform: 'scale(1)' },",
        },
      ],
      falls: [JUMPS, JUMP_VALUES, JUMPS_AGAIN, ROUNDS],
    },
    {
      // La valeur d'avant la maquette.
      name: 'le saut ne monte qu’à 112 %',
      edits: [
        {
          file: THEME,
          from: "  '40%': { transform: 'scale(1.28)' },",
          to: "  '40%': { transform: 'scale(1.12)' },",
        },
      ],
      falls: [JUMP_VALUES],
    },
    {
      name: 'le saut dure 360 ms',
      edits: [
        {
          file: MOTION,
          from: "  valueJump: '280ms cubic-bezier(0.22, 1, 0.36, 1)',",
          to: "  valueJump: '360ms cubic-bezier(0.22, 1, 0.36, 1)',",
        },
      ],
      falls: [JUMP_VALUES],
    },
    {
      name: 'l’entrée ne part de nulle part',
      edits: [
        {
          file: THEME,
          from: "  from: { opacity: 0, transform: 'translateY(14px)' },",
          to: "  from: { opacity: 1, transform: 'translateY(0)' },",
        },
      ],
      falls: [ENTERS, EACH],
    },
    {
      // Les valeurs d'avant la maquette, une à une.
      name: 'l’entrée ne monte que de 8 px',
      edits: [
        {
          file: THEME,
          from: "  from: { opacity: 0, transform: 'translateY(14px)' },",
          to: "  from: { opacity: 0, transform: 'translateY(8px)' },",
        },
      ],
      falls: [EACH],
    },
    {
      name: 'l’entrée dure 260 ms',
      edits: [
        {
          file: MOTION,
          from: "  sceneEnter: '420ms cubic-bezier(0.22, 1, 0.36, 1)',",
          to: "  sceneEnter: '260ms cubic-bezier(0.22, 1, 0.36, 1)',",
        },
      ],
      falls: [EACH],
    },
    {
      name: 'les éléments entrent tous ensemble',
      edits: [
        {
          file: MOTION,
          from: '            { animationDelay: `${(i + 1) * STAGGER_MS}ms` },',
          to: "            { animationDelay: '0ms' },",
        },
      ],
      falls: [EACH],
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
      falls: [NEXT_CHECK, CHECKED, CHECK_TIME, REDONE, LADDER_CHECK, DAY_CHECK],
    },
    {
      name: 'la coche se dessine en 360 ms',
      edits: [
        {
          file: MOTION,
          from: "  checkDraw: '300ms cubic-bezier(0.65, 0, 0.35, 1)',",
          to: "  checkDraw: '360ms cubic-bezier(0.65, 0, 0.35, 1)',",
        },
      ],
      falls: [CHECK_TIME],
    },
    {
      name: 'l’échelle bouclée pose sa coche toute faite',
      edits: [
        {
          file: LADDER,
          from: '            <DrawnCheck size={22} />',
          to: '            <DrawnCheck size={22} draw={false} />',
        },
      ],
      falls: [LADDER_CHECK],
    },
    {
      name: 'le jour gagné pose sa coche toute faite',
      edits: [
        {
          file: WEEK,
          from: '              fresh: day === freshDay,',
          to: '              fresh: false,',
        },
      ],
      falls: [DAY_CHECK],
    },
    {
      name: 'l’anneau se remplit en une seconde',
      edits: [
        {
          file: MOTION,
          from: "  ringFill: '1.1s cubic-bezier(0.22, 1, 0.36, 1)',",
          to: "  ringFill: '1s cubic-bezier(0.22, 1, 0.36, 1)',",
        },
      ],
      falls: [RING_TIME],
    },
    {
      name: 'l’anneau se remplit à vitesse constante',
      edits: [
        {
          file: MOTION,
          from: "  ringFill: '1.1s cubic-bezier(0.22, 1, 0.36, 1)',",
          to: "  ringFill: '1.1s linear',",
        },
      ],
      falls: [RING_TIME],
    },
    {
      name: 'l’accueil ne part pas de ce qu’il avait vu',
      edits: [{ file: CARD, from: '              from={from}\n', to: '' }],
      // L'anneau qui ne part plus de rien ne s'anime pas : son tempo ne se
      // lit plus.
      falls: [CHANGED, RING_TIME],
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
      falls: [CHANGED, RING_TIME],
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
          file: MOTION,
          from: "          _motionReduce: { animation: 'none' },\n",
          to: '',
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
