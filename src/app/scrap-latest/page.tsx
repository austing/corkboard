'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';
import type { Scrap } from '../../types';
import { ScrapPermissions } from '../../utils/permissions';
import { LatestView } from '@/components/scrapnest/views/LatestView';

export default function LatestPage(): React.JSX.Element {
  const { data: session } = useSession();
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchScraps = useCallback(async (): Promise<void> => {
    try {
      const data = await api.fetchScraps();
      const filteredScraps = session?.user?.id
        ? ScrapPermissions.filterViewableScraps(data.scraps, session.user.id)
        : data.scraps;

      // Sort by updatedAt, most recent first
      const sortedScraps = [...filteredScraps].sort((a, b) => {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });

      setScraps(sortedScraps);
      setError('');
    } catch (err) {
      console.error('Error fetching scraps:', err);
      setError('An error occurred while fetching scraps');
      setScraps([]);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchScraps();
  }, [fetchScraps]);

  return (
    <LatestView
      scraps={scraps}
      loading={loading}
      error={error}
      onRefresh={fetchScraps}
      pathPrefix="/scrap-latest"
      loadingText="Loading latest scraps..."
      title="Latest - Corkboard"
      headerText="Latest scraps by modification date"
    />
  );
}
