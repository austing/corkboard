'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useModal } from '../../hooks/useModal';
import { useFormWithSubmit } from '../../hooks/useFormWithSubmit';
import { api } from '../../lib/api';
import type { Scrap, ScrapFormData } from '../../types';
import { TreeScrapCard } from '../../components/scrap/TreeScrapCard';
import { UpdateScrapModal } from '../../components/scrap/UpdateScrapModal';
import { ViewScrapModal } from '../../components/scrap/ViewScrapModal';
import { ScrapPermissions } from '../../utils/permissions';

// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('../components/FroalaEditor'), {
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});

interface TreeNode {
  scrap: Scrap;
  children: TreeNode[];
  depth: number;
}

interface TreeResponse {
  tree: TreeNode[];
}

const CARD_WIDTH = 320; // 20rem (w-80) in pixels
const CARD_HEIGHT = 320; // 20rem (h-80) in pixels
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 80;

export default function TreePage(): React.JSX.Element {
  const { data: session } = useSession();
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
    document.title = 'Tree View - Corkboard';
    fetchTreeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchTreeData = async (): Promise<void> => {
    try {
      const response = await fetch('/api/scraps/tree');
      if (!response.ok) {
        throw new Error('Failed to fetch tree data');
      }
      const data: TreeResponse = await response.json();
      setTreeData(data.tree);
    } catch (err) {
      console.error('Error fetching tree:', err);
      setError('An error occurred while fetching tree data');
      setTreeData([]);
    } finally {
      setLoading(false);
    }
  };

  const updateScrapVisibility = async (scrapId: string, visible: boolean): Promise<void> => {
    try {
      await api.updateScrapVisibility(scrapId, visible);
      fetchTreeData();
    } catch (err) {
      console.error('Error updating scrap visibility:', err);
    }
  };

  // Calculate positions for tree layout
  const calculateTreeLayout = () => {
    const positions: Map<string, { x: number; y: number }> = new Map();
    let currentX = HORIZONTAL_SPACING;

    function layoutNode(node: TreeNode, depth: number): number {
      const y = depth * (CARD_HEIGHT + VERTICAL_SPACING) + VERTICAL_SPACING;

      if (node.children.length === 0) {
        // Leaf node - place at current X position
        positions.set(node.scrap.id, { x: currentX, y });
        currentX += CARD_WIDTH + HORIZONTAL_SPACING;
        return currentX - HORIZONTAL_SPACING - CARD_WIDTH / 2;
      } else {
        // Internal node - place between children
        const childPositions: number[] = [];
        node.children.forEach(child => {
          const childCenterX = layoutNode(child, depth + 1);
          childPositions.push(childCenterX);
        });

        // Place parent centered above children
        const leftmost = childPositions[0];
        const rightmost = childPositions[childPositions.length - 1];
        const centerX = (leftmost + rightmost) / 2;

        positions.set(node.scrap.id, { x: centerX - CARD_WIDTH / 2, y });
        return centerX;
      }
    }

    treeData.forEach(rootNode => {
      layoutNode(rootNode, 0);
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

  // Render connection lines
  const renderConnections = (positions: Map<string, { x: number; y: number }>) => {
    const lines: JSX.Element[] = [];

    function addLines(node: TreeNode) {
      const parentPos = positions.get(node.scrap.id);
      if (!parentPos) return;

      const parentCenterX = parentPos.x + CARD_WIDTH / 2;
      const parentBottomY = parentPos.y + CARD_HEIGHT;

      node.children.forEach(child => {
        const childPos = positions.get(child.scrap.id);
        if (!childPos) return;

        const childCenterX = childPos.x + CARD_WIDTH / 2;
        const childTopY = childPos.y;

        lines.push(
          <line
            key={`${node.scrap.id}-${child.scrap.id}`}
            x1={parentCenterX}
            y1={parentBottomY}
            x2={childCenterX}
            y2={childTopY}
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-500">{error}</div>
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
          position: 'relative'
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
              <TreeScrapCard
                scrap={node.scrap}
                isOwner={session?.user?.id === node.scrap.userId}
                isHovered={hoveredScrapId === node.scrap.id}
                isAuthenticated={!!session}
                pathPrefix="/tree"
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
          form={updateScrapForm}
          onClose={() => fullscreenModal.close()}
          onVisibilityToggle={async () => {
            const newVisibility = !fullscreenModal.data!.visible;
            await updateScrapVisibility(fullscreenModal.data!.id, newVisibility);
            fullscreenModal.close();
          }}
          onMoveClick={() => {
            // Move not available in tree view
            fullscreenModal.close();
          }}
          FroalaEditor={FroalaEditor}
        />
      ) : (
        <ViewScrapModal
          isOpen={fullscreenModal.isOpen}
          scrap={fullscreenModal.data}
          onClose={() => fullscreenModal.close()}
        />
      )}
    </>
  );
}
