import type { SessionBlock } from '@/shared/types';
import { blockSupportsRepsOnly } from '@/domain/session/blocks';
import { isRoundBased } from '@/domain/session/measure';
import { setsOfBlock } from '@/domain/session/sets';

/** Au-delà, les traits deviennent trop fins pour se compter : on montre le
 * rythme, pas un inventaire. */
export const MAX_BARS = 12;

/** Le plus petit trait d'une échelle, en part du plus haut : un palier de
 * deux répétitions sous un de vingt resterait sinon un point. */
const SHORTEST_RUNG = 0.18;

/** Ce que le dessin d'un bloc montre, sans encore le peindre. */
export interface BlockDrawing {
  /** La hauteur de chaque trait d'effort, en part du plus haut (0 à 1). */
  bars: number[];
  /** Un trait de repos, plus bas, suit chaque trait d'effort. */
  alternates: boolean;
}

/**
 * Le dessin d'un bloc : un trait par tour ou par série.
 *
 * Le Tabata et le On / Off alternent un trait d'effort et un trait de repos
 * plus bas ; l'échelle fait suivre la hauteur de ses traits à ses paliers,
 * pour qu'une échelle qui monte se voie monter. Le reste aligne des traits
 * égaux.
 *
 * La fiche et l'ouverture de la séance guidée le dessinent, et la palette
 * des formats de l'atelier le dessinera : le même bloc ne doit pas avoir
 * deux dessins, donc une seule règle, ici, qui ne connaît pas l'écran.
 */
export const blockDrawing = (block: SessionBlock): BlockDrawing => {
  const alternates =
    blockSupportsRepsOnly(block.type) && (block.restDuration ?? 0) > 0;
  if (block.type === 'ladder' && block.repsScheme?.length) {
    const scheme = block.repsScheme.slice(0, MAX_BARS);
    const top = Math.max(...scheme);
    return {
      bars: scheme.map((reps) => Math.max(SHORTEST_RUNG, reps / top)),
      alternates,
    };
  }
  const count = Math.min(
    MAX_BARS,
    Math.max(
      1,
      isRoundBased(block) ? (block.rounds ?? 1) : setsOfBlock(block).length
    )
  );
  return { bars: Array.from({ length: count }, () => 1), alternates };
};
