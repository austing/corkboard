'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Sidebar from './sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [checkingPermissions, setCheckingPermissions] = useState(true);

  useEffect(() => {
    const checkAdminPermissions = async () => {
      if (status === 'loading') return;
      
      if (!session?.user?.id) {
        router.push('/auth/signin');
        return;
      }

      try {
        const response = await fetch('/api/permissions/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: session.user.id,
            resource: 'admin',
            action: 'access'
          }),
        });

        if (response.ok) {
          const { hasPermission } = await response.json();
          if (hasPermission) {
            setHasAdminAccess(true);
          } else {
            router.push('/studio');
          }
        } else {
          router.push('/studio');
        }
      } catch (error) {
        console.error('Error checking admin permissions:', error);
        router.push('/studio');
      } finally {
        setCheckingPermissions(false);
      }
    };

    checkAdminPermissions();
  }, [session, status, router]);

  if (status === 'loading' || checkingPermissions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session || !hasAdminAccess) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}