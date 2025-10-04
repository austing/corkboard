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
  UserGroupIcon,
  ShieldCheckIcon,
  ArrowsRightLeftIcon,
} from '@heroicons/react/24/outline';
import PermissionCheck from '@/guards/PermissionCheck';

interface StudioLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'my scraps', href: '/scrap-studio', icon: DocumentTextIcon },
  { name: 'create scrap', href: '/scrap-studio/new', icon: PlusIcon },
  { name: 'fixtures', href: '/scrap-studio/fixtures', icon: ArrowsRightLeftIcon },
  { name: 'me', href: '/scrap-studio/profile', icon: UserCircleIcon },
];

const adminNavigation = [
  { name: 'users', href: '/scrap-studio/users', icon: UserGroupIcon, resource: 'users', action: 'read' },
  { name: 'roles', href: '/scrap-studio/roles', icon: ShieldCheckIcon, resource: 'roles', action: 'read' },
];

export default function StudioLayout({ children }: StudioLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 mt-1 ml-4 mb-4 bg-indigo-800 rounded-sm shadow-sm">
        <div className="flex flex-col h-full rounded-sm overflow-hidden">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-indigo-900">
            <h1 className="text-xl font-semibold text-white">scrap studio</h1>
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

            {/* Admin section - only visible to users with permissions */}
            {adminNavigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
              return (
                <PermissionCheck
                  key={item.name}
                  resource={item.resource}
                  action={item.action}
                  fallback={null}
                >
                  <Link
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
                </PermissionCheck>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-100">
        <main className="p-8 mt-4">
          {children}
        </main>
      </div>
    </div>
  );
}
