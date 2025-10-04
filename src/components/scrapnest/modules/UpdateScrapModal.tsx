/**
 * UpdateScrapModal Component
 *
 * Modal for editing an existing scrap (owner only). Extends base ScrapModal.
 * Includes content editor, position inputs, and owner actions (visibility, move).
 *
 * @example
 * ```tsx
 * <UpdateScrapModal
 *   isOpen={isOpen}
 *   scrap={scrap}
 *   form={editForm}
 *   onClose={onClose}
 *   onVisibilityToggle={handleToggle}
 *   onMoveClick={handleMove}
 *   FroalaEditor={FroalaEditor}
 * />
 * ```
 */

import { ScrapModal } from '@/components/scrapnest/modules/ScrapModal';
import { ScrapHeader } from '@/components/scrapnest/modules/ScrapHeader';
import { ScrapFooter } from '@/components/scrapnest/modules/ScrapFooter';
import { PositionInputs } from '@/components/common/elements/PositionInputs';
import config from '../../../../corkboard.config';
import type { Scrap } from '@/lib/api';
import type { ComponentType } from 'react';

interface UpdateScrapModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** The scrap being edited */
  scrap: Scrap | null;
  /** Path prefix for nested page links */
  pathPrefix?: string;
  /** Form state and handlers */
  form: {
    values: any;
    error: string;
    loading: boolean;
    setValue: (field: string, value: any) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleSubmit: () => void;
  };
  /** Close handler */
  onClose: () => void;
  /** Visibility toggle handler */
  onVisibilityToggle?: () => void;
  /** Move click handler */
  onMoveClick?: () => void;
  /** Froala editor component (dynamically imported) */
  FroalaEditor: ComponentType<any>;
}

export function UpdateScrapModal({
  isOpen,
  scrap,
  pathPrefix = '',
  form,
  onClose,
  onVisibilityToggle,
  onMoveClick,
  FroalaEditor,
}: UpdateScrapModalProps) {
  if (!scrap) return null;

  return (
    <ScrapModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="pb-4 border-b border-gray-200 mb-6">
          <ScrapHeader
            scrap={scrap}
            isModal={true}
            isOwner={true}
            pathPrefix={pathPrefix}
            onVisibilityToggle={onVisibilityToggle}
            onMoveClick={onMoveClick}
            onCloseClick={onClose}
          />
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto mb-6">
            <div className="mb-4">
              <label className="sr-only">Content</label>
              <FroalaEditor
                content={form.values.content || scrap.content}
                onChange={(content: string) => form.setValue('content', content)}
                height={400}
                maxHeight={600}
              />
            </div>

            <PositionInputs
              xValue={form.values.x !== undefined ? form.values.x : scrap.x}
              yValue={form.values.y !== undefined ? form.values.y : scrap.y}
              onChange={form.handleInputChange}
              idPrefix="update"
            />
          </div>

          {form.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md mb-4">
              <div className="text-red-800 text-sm">{form.error}</div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4">
            <div className="mb-4">
              <ScrapFooter
                userName={scrap.userName}
                userEmail={scrap.userEmail}
                createdAt={scrap.createdAt}
                size="large"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  form.loading ||
                  !form.values.content ||
                  form.values.content.trim() === '' ||
                  form.values.content === '<p><br></p>'
                }
                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${config.theme.primary.bg} ${config.theme.primary.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {form.loading ? 'Updating...' : 'Update Scrap'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ScrapModal>
  );
}
