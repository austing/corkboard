'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useModal } from '../../../hooks/useModal';
import { useFormWithSubmit } from '../../../hooks/useFormWithSubmit';
import { api } from '../../../lib/api';
import type { Scrap, ScrapFormData } from '../../../types';
import { ScrapCard } from '../modules/ScrapCard';
import { UpdateScrapModal } from '../modules/UpdateScrapModal';
import { ViewScrapModal } from '../modules/ViewScrapModal';
import { ScrapPermissions } from '../../../utils/permissions';

// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('@/components/common/input/FroalaEditor'), {
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});

export interface TreeNode {
  scrap: Scrap;
  children: TreeNode[];
  depth: number;
}

const CARD_WIDTH = 320;
const CARD_HEIGHT = 320;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 40;

interface TreeViewProps {
  /** The tree data to display */
  treeData: TreeNode[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string;
  /** Callback to refresh tree data */
  onRefresh: () => void;
  /** Optional parent scrap for nested views */
  parentScrap?: Scrap | null;
  /** Optional path prefix for navigation */
  pathPrefix?: string;
  /** Loading text */
  loadingText?: string;
  /** Title to set in document */
  title?: string;
}

export function TreeView({
  treeData,
  loading,
  error,
  onRefresh,
  parentScrap = null,
  pathPrefix = '/scrap-tree',
  loadingText = 'Loading tree view...',
  title = 'Tree View - Corkboard'
}: TreeViewProps): React.JSX.Element {
  const { data: session } = useSession();
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
      onRefresh();
    }
  });

  useEffect(() => {
    document.title = title;
  }, [title]);

  const updateScrapVisibility = async (scrapId: string, visible: boolean): Promise<void> => {
    try {
      await api.updateScrapVisibility(scrapId, visible);
      onRefresh();
    } catch (err) {
      console.error('Error updating scrap visibility:', err);
    }
  };

  // Calculate positions for tree layout - vertical siblings, horizontal nesting
  const calculateTreeLayout = () => {
    const positions: Map<string, { x: number; y: number }> = new Map();
    let currentY = VERTICAL_SPACING;

    function layoutNode(node: TreeNode, x: number, startY: number): number {
      positions.set(node.scrap.id, { x, y: startY });

      if (node.children.length === 0) {
        return startY + CARD_HEIGHT + VERTICAL_SPACING;
      } else {
        const childX = x + CARD_WIDTH + HORIZONTAL_SPACING;
        let childY = startY;

        node.children.forEach(child => {
          childY = layoutNode(child, childX, childY);
        });

        return Math.max(startY + CARD_HEIGHT + VERTICAL_SPACING, childY);
      }
    }

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
        const midX = (parentRightX + childLeftX) / 2;

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
        <div className="text-gray-500">{loadingText}</div>
      </div>
    );
  }

  if (error || (parentScrap && treeData.length === 0)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {error === '404' ? (
            <>
              <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
              <div className="text-gray-600 mb-4">Scrap not found</div>
            </>
          ) : (
            <div className="text-red-500 mb-4">{error || 'No tree data available'}</div>
          )}
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
              <ScrapCard
                scrap={node.scrap}
                isOwner={session?.user?.id === node.scrap.userId}
                isHovered={hoveredScrapId === node.scrap.id}
                isAuthenticated={!!session}
                pathPrefix={pathPrefix}
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
          pathPrefix={pathPrefix}
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
          pathPrefix={pathPrefix}
          onClose={() => fullscreenModal.close()}
        />
      )}
    </>
  );
}
