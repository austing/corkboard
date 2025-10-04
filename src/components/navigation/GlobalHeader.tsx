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

  const isActive = (path: string) => pathname === path;

  return (
    <div className="fixed top-4 left-4 right-4 z-[100] flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-gray-200 p-3">
      {/* Left side - Navigation links */}
      <div className="flex items-center space-x-4">
        <Link
          href="/"
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isActive('/')
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
          }`}
          title="Home"
        >
          <HomeIcon className="h-4 w-4" />
        </Link>

        <Link
          href="/tree"
          className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            isActive('/tree')
              ? 'bg-indigo-100 text-indigo-700'
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
            href="/studio"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 p-2 rounded-md hover:bg-gray-100 transition-colors"
            title="Settings"
          >
            <Cog6ToothIcon className="h-5 w-5" />
          </Link>
        )}

        {isAuthenticated ? (
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="inline-flex items-center space-x-1.5 text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-md hover:bg-gray-100 text-sm font-medium transition-colors"
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
