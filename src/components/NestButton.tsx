import Link from 'next/link';
import { PlusIcon } from '@heroicons/react/24/outline';

interface NestButtonProps {
  scrapId: string;
  nestedCount: number;
  size?: 'small' | 'medium';
  onClick?: (e: React.MouseEvent) => void;
}

export function NestButton({ scrapId, nestedCount, size = 'small', onClick }: NestButtonProps) {
  const sizeClasses = size === 'small'
    ? 'px-2 py-1 text-xs'
    : 'px-3 py-1.5 text-sm';

  const iconSize = size === 'small' ? 'h-3 w-3' : 'h-4 w-4';
  const borderColor = nestedCount === 0 ? 'border-gray-300' : 'border-indigo-600';

  return (
    <Link
      href={`/${scrapId}`}
      onClick={onClick}
      className={`inline-flex items-center justify-center gap-1 border ${borderColor} rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer mt-1 ${sizeClasses}`}
    >
      {nestedCount === 0 ? (
        <>
          <PlusIcon className={iconSize} />
          Nest
        </>
      ) : (
        <>
          Nest
          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
            {nestedCount}
          </span>
        </>
      )}
    </Link>
  );
}
