'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { api, type Scrap } from '../lib/api';
import { ScrapPermissions } from '../utils/permissions';
import { CanvasView } from '@/components/scrapnest/views/CanvasView';

export default function HomePage(): React.JSX.Element {
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
      setScraps(filteredScraps);
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
    <CanvasView
      scraps={scraps}
      loading={loading}
      error={error}
      onRefresh={fetchScraps}
      loadingText="Loading scraps index..."
      title="Corkboard"
    />
  );
}
