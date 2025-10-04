import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface NestButtonProps {
  scrapId: string;
  nestedCount: number;
  size?: 'small' | 'medium';
  isHovered?: boolean;
  isModal?: boolean;
  isAuthenticated?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export function NestButton({ scrapId, nestedCount, size = 'small', isHovered = false, isModal = false, isAuthenticated = false, onClick }: NestButtonProps) {
  const sizeClasses = size === 'small'
    ? 'px-1.5 py-0.5 text-[10px]'
    : 'px-2 py-1 text-xs';

  const iconSize = size === 'small' ? 'h-2.5 w-2.5' : 'h-3 w-3';
  const badgeSize = size === 'small' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs';
  const shouldShowAddButton = (isHovered || isModal) && nestedCount === 0 && isAuthenticated;

  return (
    <div className="inline-flex items-center gap-1">
      {/* +Nest button - only visible on hover/modal when count is 0 */}
      {shouldShowAddButton && (
        <Link
          href={`/${scrapId}`}
          onClick={onClick}
          className={`inline-flex items-center gap-0.5 rounded-full font-medium cursor-pointer bg-gray-200 text-gray-700 hover:bg-gray-300 ${sizeClasses}`}
        >
          <PlusIcon className={iconSize} />
          Nest
        </Link>
      )}

      {/* Nest count badge - always visible when count > 0, shows "Nest {n}" */}
      {nestedCount > 0 && (
        <Link
          href={`/${scrapId}`}
          onClick={onClick}
          className={`inline-flex items-center gap-1 rounded-full font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200 cursor-pointer ${badgeSize}`}
        >
          <span>Nest</span>
          <span>({nestedCount})</span>
        </Link>
      )}
    </div>
  );
}
