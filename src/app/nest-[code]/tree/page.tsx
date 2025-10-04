/**
 * NestedTreePage Component
 *
 * Displays scraps nested within a parent scrap in a tree/graph layout.
 * Shows scraps sorted by distance from origin in vertical column layout.
 *
 * @example
 * Route: /nest-PARENT_CODE/tree
 * ```tsx
 * // Accessed via /nest-{parentCode}/tree
 * <NestedTreePage />
 * ```
 */

'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../lib/api';
import type { Scrap } from '../../../types';
import { ScrapPermissions } from '../../../utils/permissions';
import { TreeView, type TreeNode } from '@/components/scrapnest/views/TreeView';

export default function NestedTreePage(): React.JSX.Element {
  const { data: session } = useSession();
  const params = useParams();
  const parentCode = params.code as string;

  const [parentScrap, setParentScrap] = useState<Scrap | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const distanceFromOrigin = (scrap: Scrap): number => {
    return Math.sqrt(scrap.x * scrap.x + scrap.y * scrap.y);
  };

  const fetchTreeData = useCallback(async (): Promise<void> => {
    if (!parentCode) return;

    try {
      const data = await api.fetchNestedScraps(parentCode);
      setParentScrap(data.parentScrap);

      // Build tree structure from flat nested scraps
      const nestedScraps = session?.user?.id
        ? ScrapPermissions.filterViewableScraps(data.nestedScraps, session.user.id)
        : data.nestedScraps;

      // Build tree (all scraps are direct children in this case)
      const rootNodes: TreeNode[] = nestedScraps.map(scrap => ({
        scrap,
        children: [],
        depth: 0
      }));

      // Sort by distance from origin
      rootNodes.sort((a, b) => distanceFromOrigin(a.scrap) - distanceFromOrigin(b.scrap));

      setTreeData(rootNodes);
      setError('');
    } catch (err) {
      console.error('Error fetching tree:', err);
      const error = err as { message?: string; status?: number };
      if (error.message?.includes('not found') || error.status === 404) {
        setError('404');
      } else {
        setError('An error occurred while fetching tree data');
      }
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  }, [parentCode, session?.user?.id]);

  useEffect(() => {
    fetchTreeData();
  }, [fetchTreeData]);

  return (
    <TreeView
      treeData={treeData}
      loading={loading}
      error={error}
      onRefresh={fetchTreeData}
      parentScrap={parentScrap}
      pathPrefix={`/nest-${parentCode}/tree`}
      loadingText="Loading tree view..."
      title={parentScrap ? `Tree: Nested in ${parentScrap.code} - Corkboard` : 'Tree - Corkboard'}
    />
  );
}
