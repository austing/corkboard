import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface NestButtonProps {
  scrapId: string;
  nestedCount: number;
  size?: 'small' | 'medium';
  isHovered?: boolean;
  isModal?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function NestButton({ scrapId, nestedCount, size = 'small', isHovered = false, isModal = false, onClick }: NestButtonProps) {
  const sizeClasses = size === 'small'
    ? 'px-2 py-1 text-xs'
    : 'px-2.5 py-1.5 text-sm';

  const iconSize = size === 'small' ? 'h-3 w-3' : 'h-4 w-4';
  const shouldShowAddButton = isHovered || isModal;

  return (
    <div className="inline-flex items-center gap-1">
      {/* +Nest button - only visible on hover or in modal */}
      {shouldShowAddButton && (
        <Link
          href={`/${scrapId}`}
          onClick={onClick}
          className={`inline-flex items-center gap-1 rounded-full font-medium cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300 ${sizeClasses}`}
        >
          <PlusIcon className={iconSize} />
          Nest
        </Link>
      )}

      {/* Nest count badge - always visible when count > 0 */}
      {nestedCount > 0 && (
        <Link
          href={`/${scrapId}`}
          onClick={onClick}
          className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer"
        >
          {nestedCount}
        </Link>
      )}
    </div>
  );
}
