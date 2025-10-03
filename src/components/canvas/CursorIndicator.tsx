/**
 * CursorIndicator Component
 *
 * Displays a custom cursor indicator during shift-click (create mode) or move mode.
 * Shows a plus icon in a circular badge that follows the mouse cursor.
 * Changes color based on state (hovering scrap vs open canvas).
 *
 * @example
 * ```tsx
 * <CursorIndicator
 *   visible={isShiftPressed}
 *   position={{ x: 100, y: 200 }}
 *   mode="create"
 *   isHoveringScrap={false}
 * />
 * ```
 */

import { PlusIcon } from '@heroicons/react/24/outline';
import config from '../../../corkboard.config';

interface CursorIndicatorProps {
  /** Whether the cursor indicator should be visible */
  visible: boolean;
  /** Current cursor position in pixels */
  position: { x: number; y: number };
  /** Mode of operation - create new scrap or move existing scrap */
  mode: 'create' | 'move';
  /** Whether cursor is hovering over a scrap (affects styling) */
  isHoveringScrap?: boolean;
}

export function CursorIndicator({
  visible,
  position,
  mode,
  isHoveringScrap = false,
}: CursorIndicatorProps) {
  if (!visible) return null;

  const backgroundClass = isHoveringScrap && mode === 'create'
    ? 'bg-gray-400 text-gray-600'
    : `${config.theme.primary.bg} text-white`;

  return (
    <div
      className={`fixed pointer-events-none inline-flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${backgroundClass}`}
      style={{
        left: `${position.x - 16}px`,
        top: `${position.y - 16}px`,
        zIndex: 1002,
      }}
    >
      <PlusIcon className="h-4 w-4" />
    </div>
  );
}
