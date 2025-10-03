/**
 * CanvasHeader Component
 *
 * Always-visible navigation header showing current context.
 * Displays "Root" when at main page, or "Nested in: #CODE" when viewing nested scraps.
 * Includes back button and scrap count.
 *
 * @example
 * ```tsx
 * // Main page
 * <CanvasHeader
 *   mode="root"
 *   scrapCount={42}
 * />
 *
 * // Nested page
 * <CanvasHeader
 *   mode="nested"
 *   parentScrap={parentScrap}
 *   scrapCount={5}
 *   onNavigateToParent={() => router.push(`/${parentScrap.nestedWithin}#${parentScrap.code}`)}
 * />
 * ```
 */

import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import type { Scrap } from '../../lib/api';

interface CanvasHeaderProps {
  /** Whether this is root or nested view */
  mode: 'root' | 'nested';
  /** Total number of scraps in current view */
  scrapCount: number;
  /** Parent scrap data (required for nested mode) */
  parentScrap?: Scrap;
  /** Navigate to parent handler (for nested mode) */
  onNavigateToParent?: () => void;
}

export function CanvasHeader({
  mode,
  scrapCount,
  parentScrap,
  onNavigateToParent,
}: CanvasHeaderProps) {
  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 p-3">
      <div className="flex items-center space-x-3">
        {mode === 'nested' && (
          <>
            <Link
              href="/"
              className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-1" />
              Back to main
            </Link>
            <div className="text-gray-400">|</div>
          </>
        )}

        <div className="text-sm">
          {mode === 'root' ? (
            <span className="text-gray-600 font-medium">Root Corkboard</span>
          ) : parentScrap ? (
            <>
              <span className="text-gray-600">Nested in: </span>
              {parentScrap.nestedWithin ? (
                <button
                  onClick={onNavigateToParent}
                  className="font-mono font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  #{parentScrap.code}
                </button>
              ) : (
                <button
                  onClick={onNavigateToParent}
                  className="font-mono font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                >
                  #{parentScrap.code}
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="text-sm text-gray-500">
        {scrapCount} scrap{scrapCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
