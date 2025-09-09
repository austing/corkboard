'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface PermissionCheckProps {
  resource: string;
  action: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionCheck({ 
  resource, 
  action, 
  children, 
  fallback = null 
}: PermissionCheckProps) {
  const { data: session } = useSession();
  const [hasPermission, setHasPermission] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPermission = async () => {
      if (!session?.user?.id) {
        setHasPermission(false);
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/permissions/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: session.user.id,
            resource,
            action,
          }),
        });

        if (response.ok) {
          const { hasPermission } = await response.json();
          setHasPermission(hasPermission);
        } else {
          setHasPermission(false);
        }
      } catch (error) {
        console.error('Permission check failed:', error);
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    checkPermission();
  }, [session?.user?.id, resource, action]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return hasPermission ? <>{children}</> : <>{fallback}</>;
}