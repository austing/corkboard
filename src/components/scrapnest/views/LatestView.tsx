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

const CARD_WIDTH = 320;
const CARD_HEIGHT = 320;
const VERTICAL_SPACING = 40;

interface LatestViewProps {
  /** The scraps to display (pre-sorted) */
  scraps: Scrap[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string;
  /** Callback to refresh scraps */
  onRefresh: () => void;
  /** Optional parent scrap for nested views */
  parentScrap?: Scrap | null;
  /** Optional parent ID for nested views */
  parentId?: string;
  /** Optional path prefix for navigation */
  pathPrefix?: string;
  /** Loading text */
  loadingText?: string;
  /** Title to set in document */
  title?: string;
  /** Header text to display */
  headerText?: string;
}

export function LatestView({
  scraps,
  loading,
  error,
  onRefresh,
  parentScrap = null,
  parentId,
  pathPrefix = '/scrap-latest',
  loadingText = 'Loading latest scraps...',
  title = 'Latest - Corkboard',
  headerText = 'Latest scraps by modification date'
}: LatestViewProps): React.JSX.Element {
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

  // Calculate positions - centered vertical column
  const calculatePositions = () => {
    const positions: Map<string, { x: number; y: number }> = new Map();
    const centerX = Math.max(window.innerWidth / 2 - CARD_WIDTH / 2, VERTICAL_SPACING);

    scraps.forEach((scrap, index) => {
      const y = VERTICAL_SPACING + index * (CARD_HEIGHT + VERTICAL_SPACING);
      positions.set(scrap.id, { x: centerX, y });
    });

    return positions;
  };

  const calculateCanvasSize = (positions: Map<string, { x: number; y: number }>) => {
    let maxY = 0;

    positions.forEach(pos => {
      maxY = Math.max(maxY, pos.y + CARD_HEIGHT);
    });

    return {
      width: Math.max(window.innerWidth, CARD_WIDTH + 2 * VERTICAL_SPACING),
      height: Math.max(maxY + VERTICAL_SPACING, window.innerHeight)
    };
  };

  const getScrapLink = (scrap: Scrap) => {
    if (parentId) {
      return `/${parentId}#${scrap.code}`;
    }
    if (scrap.nestedWithin) {
      return `/${scrap.nestedWithin}#${scrap.code}`;
    }
    return `/#${scrap.code}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">{loadingText}</div>
      </div>
    );
  }

  if (error || (parentId && !parentScrap)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {error === '404' ? (
            <>
              <div className="text-6xl font-bold text-gray-400 mb-4">404</div>
              <div className="text-gray-600 mb-4">Scrap not found</div>
            </>
          ) : (
            <div className="text-red-500 mb-4">{error || 'Parent scrap not found'}</div>
          )}
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to main corkboard
          </Link>
        </div>
      </div>
    );
  }

  const positions = calculatePositions();
  const canvasSize = calculateCanvasSize(positions);

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
        {/* Header */}
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-sm shadow-sm border border-gray-300 px-4 py-2">
            {parentScrap ? (
              <Link
                href={parentScrap.nestedWithin ? `/${parentScrap.nestedWithin}#${parentScrap.code}` : `/#${parentScrap.code}`}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                {parentScrap.code}
              </Link>
            ) : (
              <span className="text-sm text-gray-600">{headerText}</span>
            )}
          </div>
        </div>

        {/* Scrap cards */}
        {scraps.map((scrap) => {
          const pos = positions.get(scrap.id);
          if (!pos) return null;

          return (
            <div
              key={scrap.id}
              style={{
                position: 'absolute',
                left: `${pos.x}px`,
                top: `${pos.y}px`,
                zIndex: 10
              }}
            >
              {/* Centered link above scrap */}
              <div className="flex justify-center mb-2">
                <Link
                  href={getScrapLink(scrap)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {scrap.code}
                </Link>
              </div>

              <ScrapCard
                scrap={scrap}
                isOwner={session?.user?.id === scrap.userId}
                isHovered={hoveredScrapId === scrap.id}
                isAuthenticated={!!session}
                pathPrefix={pathPrefix}
                treeMode={true}
                onClick={() => {
                  const formData: ScrapFormData = {
                    content: scrap.content,
                    x: scrap.x,
                    y: scrap.y,
                    visible: scrap.visible,
                  };
                  updateScrapForm.setInitialValues(formData);
                  fullscreenModal.open(scrap);
                  window.history.pushState(null, '', `#${scrap.code}`);
                }}
                onMouseEnter={() => setHoveredScrapId(scrap.id)}
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
