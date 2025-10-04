/**
 * GlobalHeader Component
 *
 * Fixed floating header present on all pages.
 * Contains navigation links (index, tree), settings, and auth controls.
 *
 * @example
 * ```tsx
 * <GlobalHeader isAuthenticated={!!session} />
 * ```
 */

'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ArrowRightOnRectangleIcon,
  ArrowLeftOnRectangleIcon,
  Cog6ToothIcon,
  MapIcon,
} from '@heroicons/react/24/outline';

interface GlobalHeaderProps {
  /** Whether the user is authenticated */
  isAuthenticated?: boolean;
}

export function GlobalHeader({ isAuthenticated }: GlobalHeaderProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isActive = (path: string) => {
    // Handle trailing slash - check both with and without
    return pathname === path || pathname === `${path}/` || (path === '/' && pathname === path);
  };

  // Determine tree link based on current route
  const getTreeLink = () => {
    // If on a nest page (/nest-{code}), link to tree view of that nest
    const nestMatch = pathname.match(/^\/nest-([^\/]+)\/?$/);
    if (nestMatch) {
      return `/nest-${nestMatch[1]}/tree/`;
    }
    // If already on a nested tree page, stay there
    const nestedTreeMatch = pathname.match(/^\/nest-([^\/]+)\/tree\/?$/);
    if (nestedTreeMatch) {
      return `/nest-${nestedTreeMatch[1]}/tree/`;
    }
    // Default to root tree
    return '/scrap-tree/';
  };

  const treeLink = getTreeLink();
  const isTreeActive = pathname.includes('/tree') || pathname.includes('/scrap-tree');

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-sm shadow-sm border border-indigo-500 p-3">
      {/* Left side - Navigation links */}
      <div className="flex items-center space-x-0">
        <Link
          href="/"
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isActive('/')
              ? 'bg-indigo-100 text-gray-800'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
          title="Home"
        >
          <HomeIcon className="h-4 w-4" />
        </Link>

        <Link
          href={treeLink}
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isTreeActive
              ? 'bg-indigo-100 text-gray-800'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
          title="Tree View"
        >
          <MapIcon className="h-4 w-4" />
          <span>Tree</span>
        </Link>
      </div>

      {/* Right side - Settings and auth controls */}
      <div className="flex items-center space-x-2">
        {isAuthenticated && (
          <Link
            href="/scrap-studio"
            className={`inline-flex items-center p-2 rounded-md transition-colors ${
              pathname.startsWith('/scrap-studio')
                ? 'bg-indigo-100 text-gray-800'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
            title="Settings"
          >
            <Cog6ToothIcon className="h-4 w-4" />
          </Link>
        )}

        {isAuthenticated ? (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium transition-colors cursor-pointer"
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        ) : (
          <Link
            href="/auth/signin"
            className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium transition-colors"
            title="Sign In"
          >
            <ArrowLeftOnRectangleIcon className="h-4 w-4" />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </div>
  );
}
