/**
 * ClientLayout Component
 *
 * Client-side wrapper that provides the GlobalHeader.
 * Needs to be a client component to access session and pathname.
 */

'use client';

import { useSession } from 'next-auth/react';
import { GlobalHeader } from '../navigation/GlobalHeader';

interface ClientLayoutProps {
  children: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { data: session } = useSession();

  return (
    <>
      <GlobalHeader isAuthenticated={!!session} />
      <div className="pt-20">
        {children}
      </div>
    </>
  );
}
