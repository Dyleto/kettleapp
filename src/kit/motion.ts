import { useState } from 'react';

/**
 * Les mouvements de G5 et leur tempo, au même endroit que la façon de les
 * rejouer.
 *
 * Les durées sont celles du tableau « Mouvement » de la maquette
 * (`docs/maquette.html`). Elles avaient été choisies sans elle, quand elle
 * était perdue — 260 ms pour une scène, 360 pour une coche, une seconde
 * pour l'anneau — et la planche (H2) les a montrées toutes à côté. Les
 * courbes disent le geste : un saut qui part vite et se pose, une entrée
 * qui ralentit en arrivant, un trait tiré d'une main régulière, un anneau
 * qui décélère. Sous « réduire les animations », chaque pièce qui les porte
 * pose `_motionReduce={{ animation: 'none' }}` : la valeur change, la scène
 * est là, la coche est tracée — rien ne bouge.
 */
export const MOTION = {
  valueJump: '280ms cubic-bezier(0.22, 1, 0.36, 1)',
  sceneEnter: '420ms cubic-bezier(0.22, 1, 0.36, 1)',
  checkDraw: '300ms cubic-bezier(0.65, 0, 0.35, 1)',
  ringFill: '1.1s cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

/** L'écart d'un élément d'une scène au suivant, quand elle entre. */
export const STAGGER_MS = 50;

/**
 * Les éléments d'une scène qui entre, chacun à son tour.
 *
 * Une scène n'a pas de liste de ses éléments : chacune a sa forme — un
 * corps et un pied pour une série, une colonne pour le Tabata, des marches
 * pour l'échelle. Le niveau commun est le troisième sous la scène : celui
 * de l'en-tête, du chiffre, de la liste, du bouton. C'est lui qui entre, un
 * élément après l'autre dans son groupe ; le premier part tout de suite.
 *
 * `both` tient chaque élément invisible jusqu'à son départ : sans lui, un
 * élément décalé s'affichait, disparaissait, puis montait.
 */
export const staggered = (animation: string | undefined) => {
  const items = '& > * > * > *';
  return animation === undefined
    ? undefined
    : {
        [items]: {
          animation,
          animationFillMode: 'both',
          _motionReduce: { animation: 'none' },
        },
        ...Object.fromEntries(
          Array.from({ length: 9 }, (_, i) => [
            `${items}:nth-child(${i + 2})`,
            { animationDelay: `${(i + 1) * STAGGER_MS}ms` },
          ])
        ),
      };
};

type Replayable = 'valueJump' | 'sceneEnter';

/**
 * L'animation `name` rejouée chaque fois que `trigger` change, sans démonter
 * l'élément qui la porte.
 *
 * Démonter était la façon évidente — une `key` qui change relance tout —, et
 * elle coûtait trop. Le nombre d'une série vit dans un champ de saisie :
 * démonté, il perdait sa sélection au milieu d'une frappe. Une scène de la
 * séance garde son état d'un bloc de liste au suivant : démontée, elle
 * l'aurait perdu. Changer le nom de l'animation suffit à la relancer ; d'où
 * les jumeaux du thème, `valueJump` et `valueJumpAgain`, qu'on alterne.
 *
 * `initial` dit si le premier rendu joue aussi. Une scène entre en arrivant ;
 * une valeur ne saute pas à l'ouverture de l'écran — elle n'a pas changé,
 * elle est là.
 *
 * L'état est dérivé pendant le rendu, et non dans un effet : un effet
 * jouerait l'animation un rendu trop tard, sur une valeur déjà posée.
 */
export const useReplay = (
  trigger: unknown,
  name: Replayable,
  { initial = false }: { initial?: boolean } = {}
): string | undefined => {
  const [state, setState] = useState({ trigger, plays: initial ? 1 : 0 });
  let { plays } = state;
  if (!Object.is(state.trigger, trigger)) {
    plays += 1;
    setState({ trigger, plays });
  }
  if (plays === 0) return undefined;
  return `${plays % 2 === 1 ? name : `${name}Again`} ${MOTION[name]}`;
};

/**
 * Les clés passées à « fait » sous les yeux de la personne.
 *
 * Une coche se dessine quand on vient de cocher — pas quand on rouvre une
 * séance reprise, où dix séries tracées d'un coup ne diraient rien. Elle se
 * dessine donc pour une clé qu'on a vue à faire, puis faite : une série
 * déjà cochée à l'ouverture, puis défaite et refaite, se dessine aussi.
 *
 * Regarder la ligne elle-même ne suffisait pas : une série faite change de
 * balise (elle devient un bouton, pour la rouvrir), et une ligne qui change
 * de balise est une ligne neuve, qui ne se souvient de rien. La mémoire est
 * donc tenue au-dessus, pour la liste entière, et vit avec elle : une
 * séance reprise la remonte, et ses coches sont là, tracées.
 */
export const useJustDone = (
  keys: readonly string[],
  done: ReadonlySet<string>
): ReadonlySet<string> => {
  const [waiting, setWaiting] = useState(
    () => new Set(keys.filter((key) => !done.has(key)))
  );
  const fresh = keys.filter((key) => !done.has(key) && !waiting.has(key));
  let seen = waiting;
  if (fresh.length > 0) {
    seen = new Set([...waiting, ...fresh]);
    setWaiting(seen);
  }
  return new Set(keys.filter((key) => done.has(key) && seen.has(key)));
};
