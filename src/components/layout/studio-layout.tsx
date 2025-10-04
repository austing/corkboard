/**
 * StudioLayout Component
 *
 * Layout wrapper for studio pages (content management).
 * Provides consistent navigation and styling for user content pages.
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  DocumentTextIcon,
  UserCircleIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

interface StudioLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'My Scraps', href: '/studio', icon: DocumentTextIcon },
  { name: 'Create Scrap', href: '/studio/new', icon: PlusIcon },
  { name: 'Profile', href: '/profile', icon: UserCircleIcon },
];

export default function StudioLayout({ children }: StudioLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-indigo-800">
        <div className="flex flex-col h-full">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-900">
            <h1 className="text-xl font-semibold text-white">Studio</h1>
          </div>
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-indigo-900 text-white'
                      : 'text-indigo-100 hover:bg-indigo-700 hover:text-white'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-100">
        <main className="p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
