import { EyeSlashIcon, EyeIcon, MapPinIcon, XMarkIcon } from '@heroicons/react/24/outline';
import config from '../../../../corkboard.config';
import { NestButton } from '@/components/scrapnest/elements/NestButton';
import type { Scrap } from '@/lib/api';

interface ScrapHeaderProps {
  scrap: Scrap;
  isModal?: boolean;
  isOwner?: boolean;
  isHovered?: boolean;
  isAuthenticated?: boolean;
  pathPrefix?: string; // For nested pages, e.g., window.location.pathname
  onVisibilityToggle?: () => void;
  onMoveClick?: () => void;
  onCloseClick?: () => void;
}

export function ScrapHeader({
  scrap,
  isModal = false,
  isOwner = false,
  isHovered = false,
  isAuthenticated = false,
  pathPrefix = '',
  onVisibilityToggle,
  onMoveClick,
  onCloseClick,
}: ScrapHeaderProps) {
  const codeSize = isModal ? 'text-lg' : 'text-sm';
  const iconSize = isModal ? 'h-5 w-5' : 'h-4 w-4';
  const iconPadding = isModal ? 'p-2' : 'p-1';
  const nestButtonSize = isModal ? 'medium' : 'small';

  return (
    <>
      <div className="flex justify-between items-start mb-3">
        {/* Code and nest button on left */}
        <div className="flex items-center gap-1.5">
          <a
            href={`${pathPrefix}#${scrap.code}`}
            className={`${codeSize} font-mono font-bold ${config.theme.primary.text} hover:text-indigo-800`}
            title={`Anchor to ${scrap.code}`}
            onClick={(e) => e.stopPropagation()}
          >
            #{scrap.code}
          </a>
          {/* Nest button and count - always show if nestedCount is available */}
          {scrap.nestedCount !== undefined && (
            <NestButton
              scrapCode={scrap.code}
              nestedCount={scrap.nestedCount}
              size={nestButtonSize}
              isHovered={isHovered}
              isModal={isModal}
              isAuthenticated={isAuthenticated}
              isOwner={isOwner}
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>

        {/* Action buttons on right */}
        {isModal && (
          <div className="flex space-x-1">
            {/* Owner-only buttons */}
            {isOwner && (
              <>
                {onVisibilityToggle && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVisibilityToggle();
                    }}
                    className={`text-gray-500 hover:text-gray-700 ${iconPadding} rounded hover:bg-gray-100 cursor-pointer`}
                    title={scrap.visible ? "Make private" : "Make visible"}
                  >
                    {scrap.visible ? <EyeIcon className={iconSize} /> : <EyeSlashIcon className={iconSize} />}
                  </button>
                )}
                {onMoveClick && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveClick();
                    }}
                    className={`text-gray-500 hover:text-gray-700 ${iconPadding} rounded hover:bg-gray-100 cursor-pointer`}
                    title="Move this scrap"
                  >
                    <MapPinIcon className={iconSize} />
                  </button>
                )}
              </>
            )}
            {/* Close button - always visible in modal */}
            {onCloseClick && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseClick();
                }}
                className={`text-gray-500 hover:text-gray-700 ${iconPadding} rounded hover:bg-gray-100 cursor-pointer`}
                title="Close"
              >
                <XMarkIcon className={iconSize} />
              </button>
            )}
          </div>
        )}
      </div>
    </>
  );
}
