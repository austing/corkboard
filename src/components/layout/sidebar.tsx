'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  CogIcon, 
  Squares2X2Icon,
  ArrowRightOnRectangleIcon,
  ClipboardDocumentIcon,
  ChevronLeftIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { signOut } from 'next-auth/react';
import config from '../../../corkboard.config';

const navigation = [
  { name: `Back to ${config.app.name}`, href: '/', icon: ChevronLeftIcon, isBack: true },
  { name: 'Dashboard', href: '/admin', icon: Squares2X2Icon },
  { name: 'Users', href: '/admin/users', icon: UsersIcon },
  { name: 'Roles', href: '/admin/roles', icon: ShieldCheckIcon },
  { name: 'Scraps', href: '/admin/scraps', icon: ClipboardDocumentIcon },
  { name: 'Settings', href: '/admin/settings', icon: CogIcon },
  { name: 'Profile Settings', href: '/profile', icon: UserCircleIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-64 bg-gray-800">
      <div className="flex items-center h-16 px-4">
        <h1 className="text-white text-xl font-semibold">{config.panels.admin.title}</h1>
      </div>
      <nav className="mt-5 flex-1 px-2">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href && !item.isBack;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`${
                  item.isBack
                    ? 'text-gray-400 hover:bg-gray-700 hover:text-gray-300 border-b border-gray-700 mb-3 pb-2'
                    : isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
              >
                <item.icon
                  className={`${
                    item.isBack 
                      ? 'text-gray-400 group-hover:text-gray-300 mr-3 h-5 w-5'
                      : isActive 
                      ? 'text-gray-300 mr-3 h-6 w-6' 
                      : 'text-gray-400 group-hover:text-gray-300 mr-3 h-6 w-6'
                  }`}
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
      <div className="p-4">
        <button
          onClick={async () => {
            await signOut({ redirect: false });
            window.location.href = '/auth/signin';
          }}
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white cursor-pointer"
        >
          <ArrowRightOnRectangleIcon className="mr-3 h-6 w-6" />
          Sign Out
        </button>
      </div>
    </div>
  );
}