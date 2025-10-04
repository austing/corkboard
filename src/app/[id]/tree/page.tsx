'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useModal } from '../../../hooks/useModal';
import { useFormWithSubmit } from '../../../hooks/useFormWithSubmit';
import { api } from '../../../lib/api';
import type { Scrap, ScrapFormData } from '../../../types';
import { ScrapCard } from '../../../components/scrap/ScrapCard';
import { UpdateScrapModal } from '../../../components/scrap/UpdateScrapModal';
import { ViewScrapModal } from '../../../components/scrap/ViewScrapModal';
import { ScrapPermissions } from '../../../utils/permissions';

// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('../../components/FroalaEditor'), {
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});

interface TreeNode {
  scrap: Scrap;
  children: TreeNode[];
  depth: number;
}

const CARD_WIDTH = 320; // 20rem (w-80) in pixels
const CARD_HEIGHT = 320; // 20rem (h-80) in pixels
const HORIZONTAL_SPACING = 80; // Space between levels
const VERTICAL_SPACING = 40; // Space between siblings

export default function NestedTreePage(): React.JSX.Element {
  const { data: session } = useSession();
  const params = useParams();
  const parentId = params.id as string;

  const [parentScrap, setParentScrap] = useState<Scrap | null>(null);
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [hoveredScrapId, setHoveredScrapId] = useState<string | null>(null);

  // Modal management
  const fullscreenModal = useModal<Scrap>(null, {
    updateUrlHash: null,
    onClose: () => {
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  const updateScrapForm = useFormWithSubmit<ScrapFormData>({
    initialValues: { content: '', x: 0, y: 0, visible: true },
    onSubmit: async (values: ScrapFormData) => {
      const modalData = fullscreenModal.data;
      if (!modalData) {
        throw new Error('No scrap selected for editing');
      }
      await api.updateScrap(modalData.id, {
        content: values.content,
        x: values.x,
        y: values.y,
        visible: values.visible
      });
    },
    onSuccess: () => {
      fullscreenModal.close();
      fetchTreeData();
    }
  });

  useEffect(() => {
    if (parentScrap) {
      document.title = `Tree: Nested in ${parentScrap.code} - Corkboard`;
    }
    fetchTreeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, parentId]);

  const fetchTreeData = async (): Promise<void> => {
    if (!parentId) return;

    try {
      // First get parent and nested scraps
      const data = await api.fetchNestedScraps(parentId);
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
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError('An error occurred while fetching tree data');
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const distanceFromOrigin = (scrap: Scrap): number => {
    return Math.sqrt(scrap.x * scrap.x + scrap.y * scrap.y);
  };

  const updateScrapVisibility = async (scrapId: string, visible: boolean): Promise<void> => {
    try {
      await api.updateScrapVisibility(scrapId, visible);
      fetchTreeData();
    } catch (err) {
      console.error('Error updating scrap visibility:', err);
    }
  };

  // Calculate positions for tree layout - vertical siblings, horizontal nesting
  const calculateTreeLayout = () => {
    const positions: Map<string, { x: number; y: number }> = new Map();
    let currentY = VERTICAL_SPACING;

    function layoutNode(node: TreeNode, x: number, startY: number): number {
      // Place this node at the current position
      positions.set(node.scrap.id, { x, y: startY });

      if (node.children.length === 0) {
        // Leaf node - return next Y position for siblings
        return startY + CARD_HEIGHT + VERTICAL_SPACING;
      } else {
        // Has children - layout children to the right
        const childX = x + CARD_WIDTH + HORIZONTAL_SPACING;
        let childY = startY;

        node.children.forEach(child => {
          childY = layoutNode(child, childX, childY);
        });

        // Return the maximum Y used (either by this node or its children)
        return Math.max(startY + CARD_HEIGHT + VERTICAL_SPACING, childY);
      }
    }

    // Layout each root node vertically
    treeData.forEach(rootNode => {
      currentY = layoutNode(rootNode, HORIZONTAL_SPACING, currentY);
    });

    return positions;
  };

  // Calculate canvas size based on positions
  const calculateCanvasSize = (positions: Map<string, { x: number; y: number }>) => {
    let maxX = 0;
    let maxY = 0;

    positions.forEach(pos => {
      maxX = Math.max(maxX, pos.x + CARD_WIDTH);
      maxY = Math.max(maxY, pos.y + CARD_HEIGHT);
    });

    return {
      width: Math.max(maxX + HORIZONTAL_SPACING, window.innerWidth),
      height: Math.max(maxY + VERTICAL_SPACING, window.innerHeight)
    };
  };

  // Render connection lines - right angles (horizontal then vertical)
  const renderConnections = (positions: Map<string, { x: number; y: number }>) => {
    const lines: JSX.Element[] = [];

    function addLines(node: TreeNode) {
      const parentPos = positions.get(node.scrap.id);
      if (!parentPos) return;

      const parentRightX = parentPos.x + CARD_WIDTH;
      const parentCenterY = parentPos.y + CARD_HEIGHT / 2;

      node.children.forEach(child => {
        const childPos = positions.get(child.scrap.id);
        if (!childPos) return;

        const childLeftX = childPos.x;
        const childCenterY = childPos.y + CARD_HEIGHT / 2;

        // Calculate midpoint for right angle
        const midX = (parentRightX + childLeftX) / 2;

        // Draw horizontal line from parent to midpoint
        lines.push(
          <line
            key={`${node.scrap.id}-${child.scrap.id}-h`}
            x1={parentRightX}
            y1={parentCenterY}
            x2={midX}
            y2={parentCenterY}
            stroke="#9ca3af"
            strokeWidth="2"
          />
        );

        // Draw vertical line at midpoint
        lines.push(
          <line
            key={`${node.scrap.id}-${child.scrap.id}-v`}
            x1={midX}
            y1={parentCenterY}
            x2={midX}
            y2={childCenterY}
            stroke="#9ca3af"
            strokeWidth="2"
          />
        );

        // Draw horizontal line from midpoint to child
        lines.push(
          <line
            key={`${node.scrap.id}-${child.scrap.id}-h2`}
            x1={midX}
            y1={childCenterY}
            x2={childLeftX}
            y2={childCenterY}
            stroke="#9ca3af"
            strokeWidth="2"
          />
        );

        addLines(child);
      });
    }

    treeData.forEach(rootNode => addLines(rootNode));
    return lines;
  };

  // Flatten tree for rendering scraps
  const flattenTree = (nodes: TreeNode[]): TreeNode[] => {
    const result: TreeNode[] = [];

    function traverse(node: TreeNode) {
      result.push(node);
      node.children.forEach(traverse);
    }

    nodes.forEach(traverse);
    return result;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading tree view...</div>
      </div>
    );
  }

  if (error || !parentScrap) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error || 'Parent scrap not found'}</div>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to main corkboard
          </Link>
        </div>
      </div>
    );
  }

  const positions = calculateTreeLayout();
  const canvasSize = calculateCanvasSize(positions);
  const flatNodes = flattenTree(treeData);

  return (
    <>
      <div
        className="bg-gray-50 relative"
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          position: 'relative',
          marginTop: '80px'
        }}
      >
        {/* SVG for connection lines */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: canvasSize.width,
            height: canvasSize.height,
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {renderConnections(positions)}
        </svg>

        {/* Scrap cards */}
        {flatNodes.map((node) => {
          const pos = positions.get(node.scrap.id);
          if (!pos) return null;

          return (
            <div
              key={node.scrap.id}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                zIndex: 10
              }}
            >
              <ScrapCard
                scrap={node.scrap}
                isOwner={session?.user?.id === node.scrap.userId}
                isHovered={hoveredScrapId === node.scrap.id}
                isAuthenticated={!!session}
                pathPrefix={`/${parentId}/tree`}
                treeMode={true}
                onClick={() => {
                  const formData: ScrapFormData = {
                    content: node.scrap.content,
                    x: node.scrap.x,
                    y: node.scrap.y,
                    visible: node.scrap.visible,
                  };
                  updateScrapForm.setInitialValues(formData);
                  fullscreenModal.open(node.scrap);
                  window.history.pushState(null, '', `#${node.scrap.code}`);
                }}
                onMouseEnter={() => setHoveredScrapId(node.scrap.id)}
                onMouseLeave={() => setHoveredScrapId(null)}
              />
            </div>
          );
        })}
      </div>

      {/* Fullscreen Modal - Update or View based on ownership */}
      {fullscreenModal.data && ScrapPermissions.canEdit(fullscreenModal.data, session?.user?.id) ? (
        <UpdateScrapModal
          isOpen={fullscreenModal.isOpen}
          scrap={fullscreenModal.data}
          pathPrefix={`/${parentId}/tree`}
          form={updateScrapForm}
          onClose={() => fullscreenModal.close()}
          onVisibilityToggle={async () => {
            const newVisibility = !fullscreenModal.data!.visible;
            await updateScrapVisibility(fullscreenModal.data!.id, newVisibility);
            fullscreenModal.close();
          }}
          FroalaEditor={FroalaEditor}
        />
      ) : (
        <ViewScrapModal
          isOpen={fullscreenModal.isOpen}
          scrap={fullscreenModal.data}
          pathPrefix={`/${parentId}/tree`}
          onClose={() => fullscreenModal.close()}
        />
      )}
    </>
  );
}
