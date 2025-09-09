'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Users, 
  Shield, 
  Settings, 
  LayoutDashboard,
  LogOut,
  Clipboard,
  ChevronLeft,
  UserCog
} from 'lucide-react';
import { signOut } from 'next-auth/react';
import config from '../../../corkboard.config';

const navigation = [
  { name: `Back to ${config.app.name}`, href: '/', icon: ChevronLeft, isBack: true },
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Roles', href: '/admin/roles', icon: Shield },
  { name: 'Scraps', href: '/admin/scraps', icon: Clipboard },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
  { name: 'Profile Settings', href: '/profile', icon: UserCog },
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
          className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
        >
          <LogOut className="mr-3 h-6 w-6" />
          Sign Out
        </button>
      </div>
    </div>
  );
}