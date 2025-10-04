'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { TreeView, type TreeNode } from '@/components/scrapnest/views/TreeView';

interface TreeResponse {
  tree: TreeNode[];
}

export default function TreePage(): React.JSX.Element {
  const { data: session } = useSession();
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchTreeData = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch('/api/scraps/tree');
      if (!response.ok) {
        throw new Error('Failed to fetch tree data');
      }
      const data: TreeResponse = await response.json();
      setTreeData(data.tree);
      setError('');
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError('An error occurred while fetching tree data');
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreeData();
  }, [session, fetchTreeData]);

  return (
    <TreeView
      treeData={treeData}
      loading={loading}
      error={error}
      onRefresh={fetchTreeData}
      pathPrefix="/scrap-tree"
      loadingText="Loading tree view..."
      title="Tree View - Corkboard"
    />
  );
}
