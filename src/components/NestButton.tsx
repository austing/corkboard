import Link from 'next/link';

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

  return (
    <Link
      href={`/${scrapId}`}
      onClick={onClick}
      className={`inline-flex items-center gap-1 border border-gray-300 rounded-md shadow-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer mt-1 ${sizeClasses}`}
    >
      {nestedCount === 0 ? (
        'Open Nest'
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
