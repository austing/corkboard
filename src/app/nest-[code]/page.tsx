'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api, type Scrap } from '../../lib/api';
import { ScrapPermissions } from '../../utils/permissions';
import { CanvasView } from '@/components/scrapnest/views/CanvasView';

export default function NestedScrapPage(): React.JSX.Element {
  const { data: session } = useSession();
  const params = useParams();
  const parentCode = params.code as string;

  const [parentScrap, setParentScrap] = useState<Scrap | null>(null);
  const [nestedScraps, setNestedScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchNestedScraps = useCallback(async (): Promise<void> => {
    if (!parentCode) return;

    try {
      const data = await api.fetchNestedScraps(parentCode);
      setParentScrap(data.parentScrap);
      const filteredScraps = session?.user?.id
        ? ScrapPermissions.filterViewableScraps(data.nestedScraps, session.user.id)
        : data.nestedScraps;
      setNestedScraps(filteredScraps);
      setError('');
    } catch (err) {
      console.error('Error fetching nested scraps:', err);
      const error = err as { message?: string; status?: number };
      if (error.message?.includes('not found') || error.status === 404) {
        setError('404');
      } else {
        setError('An error occurred while fetching nested scraps');
      }
      setNestedScraps([]);
    } finally {
      setLoading(false);
    }
  }, [parentCode, session?.user?.id]);

  useEffect(() => {
    fetchNestedScraps();
  }, [fetchNestedScraps]);

  return (
    <CanvasView
      scraps={nestedScraps}
      loading={loading}
      error={error}
      onRefresh={fetchNestedScraps}
      parentScrap={parentScrap}
      parentId={parentCode}
      loadingText="Loading nested scraps..."
      title={parentScrap ? `Nested in ${parentScrap.code} - Corkboard` : 'Corkboard'}
    />
  );
}
