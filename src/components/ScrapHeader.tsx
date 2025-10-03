import { PencilIcon, ArrowsPointingOutIcon, EyeSlashIcon, EyeIcon, MapPinIcon } from '@heroicons/react/24/outline';
import config from '../../corkboard.config';
import { NestButton } from './NestButton';
import type { Scrap } from '../lib/api';

interface ScrapHeaderProps {
  scrap: Scrap;
  isModal?: boolean;
  isOwner?: boolean;
  pathPrefix?: string; // For nested pages, e.g., window.location.pathname
  onFullscreenClick?: () => void;
  onEditClick?: () => void;
  onVisibilityToggle?: () => void;
  onMoveClick?: () => void;
}

export function ScrapHeader({
  scrap,
  isModal = false,
  isOwner = false,
  pathPrefix = '',
  onFullscreenClick,
  onEditClick,
  onVisibilityToggle,
  onMoveClick,
}: ScrapHeaderProps) {
  const codeSize = isModal ? 'text-lg' : 'text-sm';
  const iconSize = isModal ? 'h-5 w-5' : 'h-4 w-4';
  const iconPadding = isModal ? 'p-2' : 'p-1';
  const nestButtonSize = isModal ? 'medium' : 'small';

  return (
    <>
      <div className="flex justify-between items-start mb-3">
        {/* Action buttons on left */}
        <div className="flex space-x-1">
        {onFullscreenClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onFullscreenClick();
            }}
            className={`text-gray-500 hover:text-gray-700 ${iconPadding} rounded hover:bg-gray-100 cursor-pointer`}
            title={!scrap.visible && isOwner ? "Make visible" : "View fullscreen"}
          >
            {!scrap.visible && isOwner ? (
              <EyeSlashIcon className={iconSize} />
            ) : (
              <ArrowsPointingOutIcon className={iconSize} />
            )}
          </button>
        )}
        {isOwner && onEditClick && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            className={`text-gray-500 hover:text-gray-700 ${iconPadding} rounded hover:bg-gray-100 cursor-pointer`}
            title="Edit this scrap"
          >
            <PencilIcon className={iconSize} />
          </button>
        )}
        {isModal && isOwner && (
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
      </div>

      {/* Code and nest button on right */}
      <div className="flex flex-col items-end">
        <a
          href={`${pathPrefix}#${scrap.code}`}
          className={`${codeSize} font-mono font-bold ${config.theme.primary.text} hover:text-indigo-800`}
          title={`Anchor to ${scrap.code}`}
          onClick={(e) => e.stopPropagation()}
        >
          #{scrap.code}
        </a>
        {/* Open Nest button - hide on invisible scraps */}
        {scrap.nestedCount !== undefined && scrap.visible && (
          <NestButton
            scrapId={scrap.id}
            nestedCount={scrap.nestedCount}
            size={nestButtonSize}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        </div>
      </div>
      {/* Divider line */}
      <div className="border-t border-gray-200 mb-3"></div>
    </>
  );
}
