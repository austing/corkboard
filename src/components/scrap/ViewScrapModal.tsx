/**
 * ViewScrapModal Component
 *
 * Read-only modal for viewing a scrap (non-owners). Extends base ScrapModal.
 * Shows scrap content and metadata without editing capabilities.
 *
 * @example
 * ```tsx
 * <ViewScrapModal
 *   isOpen={isOpen}
 *   scrap={scrap}
 *   onClose={onClose}
 * />
 * ```
 */

import { ScrapModal } from './ScrapModal';
import { ScrapHeader } from './ScrapHeader';
import { ScrapFooter } from './ScrapFooter';
import type { Scrap } from '../../lib/api';

interface ViewScrapModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The scrap being viewed */
  scrap: Scrap | null;
  /** Path prefix for nested page links */
  pathPrefix?: string;
  /** Close handler */
  onClose: () => void;
}

export function ViewScrapModal({
  isOpen,
  scrap,
  pathPrefix = '',
  onClose,
}: ViewScrapModalProps) {
  if (!scrap) return null;

  return (
    <ScrapModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-4 border-b border-gray-200 mb-6">
          <ScrapHeader
            scrap={scrap}
            isModal={true}
            isOwner={false}
            pathPrefix={pathPrefix}
            onCloseClick={onClose}
          />
        </div>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto mb-6">
          <div
            className="text-base text-gray-800 leading-relaxed froala-content"
            dangerouslySetInnerHTML={{ __html: scrap.content }}
          />
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4">
          <ScrapFooter
            userName={scrap.userName}
            userEmail={scrap.userEmail}
            createdAt={scrap.createdAt}
            size="large"
          />
        </div>
      </div>
    </ScrapModal>
  );
}
