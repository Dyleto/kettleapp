import { BlockExercise, SessionBlock } from '@/types';
import { ReactNode } from 'react';

export interface BlockProps {
  block: SessionBlock;
  isEditing?: boolean;
  onUpdate?: (updates: Partial<SessionBlock>) => void;
  onRemove?: () => void;
  onAddExercise?: () => void;
  onRemoveExercise?: (index: number) => void;
  onUpdateExercise?: (
    index: number,
    updates: Partial<Omit<BlockExercise, 'exercise'>>
  ) => void;
  dragHandleProps?: Record<string, unknown>;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  /**
   * Content inserted under each exercise, in read mode only.
   * Lets the client record what they actually did without the rendering
   * shared with the coach shifting by a pixel when the prop is absent.
   */
  renderExerciseExtra?: (ctx: {
    blockOrder: number;
    exerciseOrder: number;
    exerciseId?: string;
  }) => ReactNode;
}
