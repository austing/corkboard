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

import config from '../../../../corkboard.config';
import { ScrapHeader } from '@/components/scrapnest/modules/ScrapHeader';
import { ScrapFooter } from '@/components/scrapnest/modules/ScrapFooter';
import type { Scrap } from '@/lib/api';

interface ScrapCardProps {
  /** The scrap data to display */
  scrap: Scrap;
  /** Position on the canvas (optional for tree mode) */
  position?: { x: number; y: number };
  /** Visual index for z-index calculation (optional for tree mode) */
  index?: number;
  /** Whether this scrap is currently being moved */
  isMoving?: boolean;
  /** Whether the current user owns this scrap */
  isOwner?: boolean;
  /** Whether the mouse is hovering over this scrap */
  isHovered?: boolean;
  /** Whether this scrap is highlighted from an anchor link */
  isHighlighted?: boolean;
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
  /** Path prefix for nested page links */
  pathPrefix?: string;
  /** Tree mode - use fixed dimensions instead of canvas positioning */
  treeMode?: boolean;
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
  index = 0,
  isMoving = false,
  isOwner = false,
  isHovered = false,
  isHighlighted = false,
  isAuthenticated = false,
  pathPrefix = '',
  treeMode = false,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: ScrapCardProps) {
  // Check if scrap content is redacted (empty content, null user data = not logged in OR invisible non-owner)
  const isRedacted = scrap.content === '' && scrap.userId === null;
  // Invisible scraps that user doesn't own should not be clickable
  const isInvisibleNonOwner = !scrap.visible && !isOwner;
  const isClickable = !isRedacted && !isInvisibleNonOwner;

  // Determine card styling based on state
  const isInvisibleScrap = !scrap.visible || isRedacted;

  const getCardClassName = () => {
    if (isMoving) {
      return `${config.theme.moving.bg} ${config.theme.moving.text} border ${config.theme.moving.border}`;
    }
    if (isInvisibleScrap) {
      // All invisible scraps use the same styling and raise opacity on hover
      const highlightClass = isHighlighted ? `${config.theme.accent.border} border-4` : 'border-gray-300';
      return `${config.theme.invisible.bg} ${config.theme.invisible.text} border ${highlightClass} opacity-80 hover:opacity-100 hover:shadow-xl`;
    }
    const highlightClass = isHighlighted ? `${config.theme.accent.border} border-4` : 'border-indigo-400';
    return `${config.theme.visible.bg} ${config.theme.visible.text} border ${highlightClass} hover:shadow-xl`;
  };

  const cardStyle = treeMode
    ? {} // No positioning in tree mode - handled by parent
    : {
        left: `${position?.x ?? 0}px`,
        top: `${position?.y ?? 0}px`,
        zIndex: scrap.visible ? 10 + index : index,
      };

  const positionClass = treeMode ? '' : 'absolute';
  const sizeClass = treeMode ? 'w-80 h-80' : 'w-80';
  const contentHeightClass = treeMode ? 'line-clamp-[14]' : 'line-clamp-24 min-h-[120px]';

  return (
    <div
      id={scrap.code}
      className={`${positionClass} shadow-lg rounded-lg p-4 ${sizeClass} flex flex-col transition-shadow ${isClickable ? 'cursor-pointer' : 'cursor-default'} ${getCardClassName()}`}
      style={cardStyle}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={isClickable ? onClick : undefined}
    >
      <ScrapHeader
        scrap={scrap}
        isOwner={isOwner}
        isHovered={isHovered}
        isAuthenticated={isAuthenticated}
        pathPrefix={pathPrefix}
      />

      {/* Divider line */}
      <div className="border-t border-gray-500 mb-3"></div>

      {/* Content preview - grows to fill available space */}
      <div className="mb-3 flex-grow overflow-hidden">
        <div
          className={`text-sm ${contentHeightClass} froala-content ${isInvisibleScrap ? config.theme.invisible.textColor : ''}`}
          dangerouslySetInnerHTML={{ __html: scrap.content }}
        />
      </div>

      {/* Footer metadata - stays at bottom */}
      <ScrapFooter
        userName={scrap.userName}
        userEmail={scrap.userEmail}
        createdAt={scrap.createdAt}
        updatedAt={scrap.updatedAt}
        size="small"
      />
    </div>
  );
}
