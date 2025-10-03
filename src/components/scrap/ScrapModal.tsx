/**
 * ScrapModal Component (Base)
 *
 * Base modal component providing shared layout and backdrop for all scrap modals.
 * Extended by CreateScrapModal, UpdateScrapModal, and ViewScrapModal.
 *
 * @example
 * ```tsx
 * <ScrapModal
 *   isOpen={isOpen}
 *   onClose={onClose}
 * >
 *   <YourModalContent />
 * </ScrapModal>
 * ```
 */

import { ReactNode } from 'react';

interface ScrapModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Modal content */
  children: ReactNode;
}

export function ScrapModal({ isOpen, onClose, children }: ScrapModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{
        zIndex: 1001,
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
      }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
