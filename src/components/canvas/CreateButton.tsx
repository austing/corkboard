/**
 * CreateButton Component
 *
 * Centered floating button for creating new scraps.
 * Shows plus icon for authenticated users, decorative symbol for guests.
 *
 * @example
 * ```tsx
 * <CreateButton
 *   isAuthenticated={!!session}
 *   onClick={() => openCreateModal()}
 * />
 * ```
 */

import { PlusIcon } from '@heroicons/react/24/outline';
import config from '../../../corkboard.config';

interface CreateButtonProps {
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** Click handler (only for authenticated users) */
  onClick?: () => void;
}

export function CreateButton({ isAuthenticated, onClick }: CreateButtonProps) {
  if (isAuthenticated) {
    return (
      <button
        onClick={onClick}
        className={`fixed inline-flex items-center justify-center w-16 h-16 rounded-full ${config.theme.primary.bg} ${config.theme.primary.hover} text-white shadow-lg transition-all hover:scale-110 cursor-pointer`}
        title="Create new scrap (or hold Shift and click anywhere)"
        style={{
          zIndex: 1000,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      >
        <PlusIcon className="h-8 w-8" />
      </button>
    );
  }

  return (
    <div
      className="fixed inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-300 text-gray-600 shadow-lg"
      style={{
        zIndex: 1000,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
      }}
      title="Sign in to create scraps"
    >
      <span className="text-2xl">⚘</span>
    </div>
  );
}
