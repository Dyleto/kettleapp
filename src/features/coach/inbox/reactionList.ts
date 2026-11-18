import type { Reaction } from '@/domain/inbox/reply';

/** Les trois réactions de la maquette : la clé que l'API retient, l'émoji
 * qui l'affiche, et le mot qui la nomme à qui ne la voit pas. */
export const REACTIONS: { key: Reaction; emoji: string; name: string }[] = [
  { key: 'clap', emoji: '👏', name: 'bravo' },
  { key: 'strong', emoji: '💪', name: 'costaud' },
  { key: 'fire', emoji: '🔥', name: 'en feu' },
];
