/**
 * ActionButtons Component
 *
 * Displays action buttons in the bottom-right corner (Settings/Admin and Sign In/Out).
 * Adapts based on authentication state.
 *
 * @example
 * ```tsx
 * <ActionButtons isAuthenticated={!!session} />
 * ```
 */

import Link from 'next/link';
import { CogIcon, ArrowRightOnRectangleIcon, UserIcon } from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';

interface ActionButtonsProps {
  /** Whether the user is currently authenticated */
  isAuthenticated: boolean;
}

export function ActionButtons({ isAuthenticated }: ActionButtonsProps) {
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    window.location.href = '/';
  };

  return (
    <div className="fixed bottom-6 right-6 flex space-x-2" style={{ zIndex: 999 }}>
      {isAuthenticated ? (
        <>
          <Link
            href="/admin"
            className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            title="Admin"
          >
            <CogIcon className="h-6 w-6" />
          </Link>
          <button
            onClick={handleSignOut}
            className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
            title="Sign Out"
          >
            <ArrowRightOnRectangleIcon className="h-6 w-6" />
          </button>
        </>
      ) : (
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          title="Sign In"
        >
          <UserIcon className="h-6 w-6" />
        </Link>
      )}
    </div>
  );
}
