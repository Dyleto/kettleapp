/**
 * Ce qu'une touche demande à la séance guidée, sur un grand écran posé au
 * sol : Espace valide, P met en pause, ← et → reculent et avancent.
 *
 * La touche ne fait rien d'elle-même : elle touche la commande que la scène
 * a marquée (`data-guided-primary`, `-previous`, `-next`), comme un doigt
 * le ferait. Reprogrammer chaque geste pour le clavier en aurait fait une
 * seconde copie — « Série faite » enregistre aussi la charge affichée, et
 * cette copie-là l'aurait oublié.
 */
export type GuidedKey = 'primary' | 'pause' | 'previous' | 'next';

/** Ce qui a reçu la touche : un champ garde les siennes. */
interface KeyTarget {
  tagName?: string;
  isContentEditable?: boolean;
}

const TYPING = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

/**
 * La demande d'une touche, ou rien.
 *
 * Rien quand on tape dans un champ — « 22,5 » s'écrit avec des touches —,
 * ni avec un modificateur — Ctrl+P imprime, le navigateur s'en charge. Et
 * Espace sur un bouton qui a le focus : le bouton y répond déjà, et le
 * toucher en plus validerait deux fois.
 */
export const guidedKey = (
  event: Pick<KeyboardEvent, 'key' | 'ctrlKey' | 'metaKey' | 'altKey'>,
  target: KeyTarget | null
): GuidedKey | null => {
  if (event.ctrlKey || event.metaKey || event.altKey) return null;
  if (target?.isContentEditable || TYPING.has(target?.tagName ?? ''))
    return null;
  switch (event.key) {
    case ' ':
      return target?.tagName === 'BUTTON' ? null : 'primary';
    case 'p':
    case 'P':
      return 'pause';
    case 'ArrowLeft':
      return 'previous';
    case 'ArrowRight':
      return 'next';
    default:
      return null;
  }
};
