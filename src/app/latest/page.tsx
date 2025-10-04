'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useModal } from '../../hooks/useModal';
import { useFormWithSubmit } from '../../hooks/useFormWithSubmit';
import { api } from '../../lib/api';
import type { Scrap, ScrapFormData } from '../../types';
import { ScrapCard } from '@/components/scrapnest/modules/ScrapCard';
import { UpdateScrapModal } from '@/components/scrapnest/modules/UpdateScrapModal';
import { ViewScrapModal } from '@/components/scrapnest/modules/ViewScrapModal';
import { ScrapPermissions } from '../../utils/permissions';

// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('../components/FroalaEditor'), {
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});

const CARD_WIDTH = 320;
const CARD_HEIGHT = 320;
const VERTICAL_SPACING = 40;

export default function LatestPage(): React.JSX.Element {
  const { data: session } = useSession();
  const [scraps, setScraps] = useState<Scrap[]>([]);
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
      fetchScraps();
    }
  });

  useEffect(() => {
    document.title = 'Latest - Corkboard';
    fetchScraps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  const fetchScraps = async (): Promise<void> => {
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
    } catch (err) {
      console.error('Error fetching scraps:', err);
      setError('An error occurred while fetching scraps');
      setScraps([]);
    } finally {
      setLoading(false);
    }
  };

  const updateScrapVisibility = async (scrapId: string, visible: boolean): Promise<void> => {
    try {
      await api.updateScrapVisibility(scrapId, visible);
      fetchScraps();
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
    if (scrap.nestedWithin) {
      return `/${scrap.nestedWithin}#${scrap.code}`;
    }
    return `/#${scrap.code}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading latest scraps...</div>
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
        {/* Header with scrap code link */}
        <div className="fixed top-20 left-0 right-0 z-50 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-sm shadow-sm border border-gray-300 px-4 py-2">
            <span className="text-sm text-gray-600">Latest scraps by modification date</span>
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
                pathPrefix="/latest"
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
          pathPrefix="/latest"
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
          pathPrefix="/latest"
          onClose={() => fullscreenModal.close()}
        />
      )}
    </>
  );
}
