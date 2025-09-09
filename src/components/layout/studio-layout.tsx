'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  DocumentTextIcon,
  ChevronDoubleLeftIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import config from '../../../corkboard.config';

const navigation = [
  { name: `Back to ${config.app.name}`, href: '/', icon: ChevronDoubleLeftIcon, isBack: true },
  { name: 'Content', href: '/studio', icon: DocumentTextIcon },
  { name: 'Profile Settings', href: '/profile', icon: Cog6ToothIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    <div>
      {/* Mobile sidebar */}
      <div className={`relative z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900/80" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 z-40 w-72 bg-white px-6 py-6 sm:max-w-sm">
          <div className="flex items-center justify-between">
            <Link href="/studio" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">{config.panels.content.title}</span>
            </Link>
            <button
              type="button"
              className="-m-2.5 rounded-md p-2.5 text-gray-700"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <nav className="mt-8 flow-root">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      item.isBack
                        ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b border-gray-200 mb-2 pb-2'
                        : pathname === item.href
                        ? 'bg-gray-50 text-indigo-600'
                        : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                      'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                    )}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={classNames(
                      item.isBack ? 'h-5 w-5' : 'h-6 w-6',
                      'shrink-0'
                    )} />
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 border-r border-gray-200">
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/studio" className="flex items-center">
              <span className="text-xl font-bold text-gray-900">{config.panels.content.title}</span>
            </Link>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul className="space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={classNames(
                          item.isBack
                            ? 'text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-b border-gray-200 mb-2 pb-2'
                            : pathname === item.href
                            ? 'bg-gray-50 text-indigo-600'
                            : 'text-gray-700 hover:text-indigo-600 hover:bg-gray-50',
                          'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold'
                        )}
                      >
                        <item.icon className={classNames(
                          item.isBack ? 'h-5 w-5' : 'h-6 w-6',
                          'shrink-0'
                        )} />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="lg:pl-72">
        {/* Top navigation */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>
          
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-4 text-sm font-semibold leading-6 text-gray-900">
                <UserCircleIcon className="h-8 w-8 text-gray-400" />
                <Link href="/profile" className="hover:text-indigo-600">
                  {session?.user?.name || session?.user?.email}
                </Link>
                <button
                  onClick={async () => {
                    await signOut({ redirect: false });
                    window.location.href = '/auth/signin';
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}