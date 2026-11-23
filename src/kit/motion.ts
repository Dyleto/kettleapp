import { useState } from 'react';

/**
 * Les trois mouvements de G5 et leur tempo, au même endroit que la façon de
 * les rejouer.
 *
 * Chaque courbe dit son geste : un saut qui dépasse un peu avant de se
 * poser, une entrée qui ralentit en arrivant, un trait tiré d'une main
 * régulière. Moins d'un tiers de seconde pour les trois : une animation
 * qu'on attend est un retard. Sous « réduire les animations », chaque
 * pièce qui les porte pose `_motionReduce={{ animation: 'none' }}` : la
 * valeur change, la scène est là, la coche est tracée — rien ne bouge.
 */
export const MOTION = {
  valueJump: '280ms cubic-bezier(0.34, 1.56, 0.64, 1)',
  sceneEnter: '260ms cubic-bezier(0.22, 1, 0.36, 1)',
  checkDraw: '360ms cubic-bezier(0.65, 0, 0.35, 1)',
} as const;

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
