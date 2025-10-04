/**
 * CreateScrapModal Component
 *
 * Modal for creating a new scrap. Extends base ScrapModal.
 * Includes content editor and position inputs.
 *
 * @example
 * ```tsx
 * <CreateScrapModal
 *   isOpen={isOpen}
 *   form={newScrapForm}
 *   onClose={onClose}
 *   FroalaEditor={FroalaEditor}
 * />
 * ```
 */

import { XMarkIcon } from '@heroicons/react/24/outline';
import { ScrapModal } from '@/components/scrapnest/modules/ScrapModal';
import { PositionInputs } from '@/components/common/elements/PositionInputs';
import config from '../../../../corkboard.config';
import type { ComponentType } from 'react';

interface CreateScrapModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
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
  /** Froala editor component (dynamically imported) */
  FroalaEditor: ComponentType<any>;
}

export function CreateScrapModal({
  isOpen,
  form,
  onClose,
  FroalaEditor,
}: CreateScrapModalProps) {
  return (
    <ScrapModal isOpen={isOpen} onClose={onClose}>
      <div className="p-6 overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
          <h2 className="text-lg font-bold text-gray-900">Create New Scrap</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Content</label>
            <FroalaEditor
              content={form.values.content}
              onChange={(content: string) => form.setValue('content', content)}
              height={400}
              maxHeight={600}
            />
          </div>

          <PositionInputs
            xValue={form.values.x}
            yValue={form.values.y}
            onChange={form.handleInputChange}
            idPrefix="create"
          />

          {form.error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="text-red-800 text-sm">{form.error}</div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
              {form.loading ? 'Creating...' : 'Create Scrap'}
            </button>
          </div>
        </form>
      </div>
    </ScrapModal>
  );
}
