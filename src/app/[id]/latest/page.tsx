/**
 * NestedLatestPage Component
 *
 * Displays scraps nested within a parent scrap, sorted by most recently updated.
 * Shows scraps in a vertical column layout (latest first).
 *
 * @example
 * Route: /PARENT_ID/latest
 * ```tsx
 * // Accessed via /{parentId}/latest
 * <NestedLatestPage />
 * ```
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import type { Scrap } from '../../../types';
import { ScrapPermissions } from '../../../utils/permissions';
import { LatestView } from '@/components/scrapnest/views/LatestView';

export default function NestedLatestPage(): React.JSX.Element {
  const { data: session } = useSession();
  const params = useParams();
  const parentId = params.id as string;

  const [parentScrap, setParentScrap] = useState<Scrap | null>(null);
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchScraps = useCallback(async (): Promise<void> => {
    if (!parentId) return;

    try {
      const data = await api.fetchNestedScraps(parentId);
      setParentScrap(data.parentScrap);

      const filteredScraps = session?.user?.id
        ? ScrapPermissions.filterViewableScraps(data.nestedScraps, session.user.id)
        : data.nestedScraps;

      // Sort by updatedAt, most recent first
      const sortedScraps = [...filteredScraps].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setScraps(sortedScraps);
      setError('');
    } catch (err) {
      console.error('Error fetching scraps:', err);
      const error = err as { message?: string; status?: number };
      if (error.message?.includes('not found') || error.status === 404) {
        setError('404');
      } else {
        setError('An error occurred while fetching scraps');
      }
      setScraps([]);
    } finally {
      setLoading(false);
    }
  }, [parentId, session?.user?.id]);

  useEffect(() => {
    fetchScraps();
  }, [fetchScraps]);

  return (
    <LatestView
      scraps={scraps}
      loading={loading}
      error={error}
      onRefresh={fetchScraps}
      parentScrap={parentScrap}
      parentId={parentId}
      pathPrefix={`/${parentId}/latest`}
      loadingText="Loading latest scraps..."
      title={parentScrap ? `Latest: Nested in ${parentScrap.code} - Corkboard` : 'Latest - Corkboard'}
    />
  );
}
