/**
 * ScrapCard Component
 *
 * Displays a scrap as a card on the canvas with preview content.
 * Handles different visual states (normal, moving, invisible).
 * Shows header with code/nest button, content preview, and footer metadata.
 *
 * @example
 * ```tsx
 * <ScrapCard
 *   scrap={scrap}
 *   position={{ x: 100, y: 200 }}
 *   isMoving={false}
 *   isOwner={true}
 *   onClick={() => handleScrapClick(scrap)}
 *   onMouseEnter={() => setIsHovering(true)}
 *   onMouseLeave={() => setIsHovering(false)}
 * />
 * ```
 */

import config from '../../../corkboard.config';
import { ScrapHeader } from './ScrapHeader';
import { ScrapFooter } from './ScrapFooter';
import type { Scrap } from '../../lib/api';

interface ScrapCardProps {
  /** The scrap data to display */
  scrap: Scrap;
  /** Position on the canvas */
  position: { x: number; y: number };
  /** Visual index for z-index calculation */
  index: number;
  /** Whether this scrap is currently being moved */
  isMoving?: boolean;
  /** Whether the current user owns this scrap */
  isOwner?: boolean;
  /** Path prefix for nested page links */
  pathPrefix?: string;
  /** Click handler */
  onClick?: () => void;
  /** Mouse enter handler */
  onMouseEnter?: () => void;
  /** Mouse leave handler */
  onMouseLeave?: () => void;
}

export function ScrapCard({
  scrap,
  position,
  index,
  isMoving = false,
  isOwner = false,
  pathPrefix = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ScrapCardProps) {
  // Determine card styling based on state
  const getCardClassName = () => {
    if (isMoving) {
      return `${config.theme.moving.bg} ${config.theme.moving.text} border ${config.theme.moving.border}`;
    }
    if (!scrap.visible && isOwner) {
      return `${config.theme.invisible.bg} ${config.theme.invisible.text} border border-gray-600 opacity-40 hover:opacity-100 hover:shadow-xl invert`;
    }
    return 'bg-white border border-gray-200 hover:shadow-xl';
  };

  return (
    <div
      id={scrap.code}
      className={`absolute shadow-lg rounded-lg p-4 max-w-sm transition-shadow cursor-pointer ${getCardClassName()}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: scrap.visible ? 10 + index : index,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
    >
      <ScrapHeader
        scrap={scrap}
        isOwner={isOwner}
        pathPrefix={pathPrefix}
      />

      {/* Divider line */}
      <div className="border-t border-gray-200 mb-3"></div>

      {/* Content preview */}
      <div className="mb-3">
        <div
          className="text-sm text-gray-800 line-clamp-24 froala-content"
          dangerouslySetInnerHTML={{ __html: scrap.content }}
        />
      </div>

      {/* Footer metadata */}
      <ScrapFooter
        userName={scrap.userName}
        userEmail={scrap.userEmail}
        createdAt={scrap.createdAt}
        size="small"
      />
    </div>
  );
}
