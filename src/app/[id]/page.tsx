'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useModal } from '../../hooks/useModal';
import { useFormWithSubmit } from '../../hooks/useFormWithSubmit';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { api, type Scrap } from '../../lib/api';
import { CanvasUtils } from '../../utils/canvas';
import { ScrapPermissions } from '../../utils/permissions';
import { CursorIndicator } from '@/components/scrapnest/elements/CursorIndicator';
import { CreateButton } from '@/components/scrapnest/elements/CreateButton';
import { ErrorMessage } from '@/components/common/elements/ErrorMessage';
import { ScrapCard } from '@/components/scrapnest/modules/ScrapCard';
import { CreateScrapModal } from '@/components/scrapnest/modules/CreateScrapModal';
import { UpdateScrapModal } from '@/components/scrapnest/modules/UpdateScrapModal';
import { ViewScrapModal } from '@/components/scrapnest/modules/ViewScrapModal';
import type { ScrapFormData, Position, Size } from '../../types';

// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('../components/FroalaEditor'), {
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});

export default function NestedScrapPage(): React.JSX.Element {
  const { data: session } = useSession();
  const params = useParams();
  const parentId = params.id as string;

  const [parentScrap, setParentScrap] = useState<Scrap | null>(null);
  const [nestedScraps, setNestedScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [canvasSize, setCanvasSize] = useState<Size>({ width: 0, height: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState<boolean>(false);
  const [cursorPosition, setCursorPosition] = useState<Position>({ x: 0, y: 0 });
  const [isHoveringScrap, setIsHoveringScrap] = useState<boolean>(false);
  const [hoveredScrapId, setHoveredScrapId] = useState<string | null>(null);
  const [isMoveMode, setIsMoveMode] = useState<boolean>(false);
  const [movingScrap, setMovingScrap] = useState<Scrap | null>(null);
  const [highlightedScrapCode, setHighlightedScrapCode] = useState<string | null>(null);

  // Modal management using useModal hook
  const fullscreenModal = useModal<Scrap>(null, {
    updateUrlHash: null,
    onClose: () => {
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  const newScrapModal = useModal(false, {
    onClose: () => {
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  const editScrapModal = useModal<Scrap>(null, {
    updateUrlHash: null,
    onClose: () => {
      updateScrapForm.reset();
      _setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true, nestedWithin: parentId });
      _setEditScrapError('');
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  const fetchNestedScraps = useCallback(async (): Promise<void> => {
    if (!parentId) return;

    try {
      const data = await api.fetchNestedScraps(parentId);
      setParentScrap(data.parentScrap);
      const filteredScraps = session?.user?.id
        ? ScrapPermissions.filterViewableScraps(data.nestedScraps, session.user.id)
        : data.nestedScraps;
      setNestedScraps(filteredScraps);
    } catch (err) {
      console.error('Error fetching nested scraps:', err);
      setError('An error occurred while fetching nested scraps');
      setNestedScraps([]);
    } finally {
      setLoading(false);
    }
  }, [parentId, session?.user?.id]);

  useEffect(() => {
    if (parentScrap) {
      document.title = `Nested in ${parentScrap.code} - Corkboard`;
    }
  }, [parentScrap]);

  useEffect(() => {
    fetchNestedScraps();
  }, [fetchNestedScraps]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (fullscreenModal.isOpen || newScrapModal.isOpen || editScrapModal.isOpen || isMoveMode) {
        return;
      }

      if (e.shiftKey && !isShiftPressed) {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (fullscreenModal.isOpen || newScrapModal.isOpen || editScrapModal.isOpen || isMoveMode) {
        return;
      }

      if (!e.shiftKey) {
        setIsShiftPressed(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isShiftPressed, fullscreenModal.isOpen, newScrapModal.isOpen, editScrapModal.isOpen, isMoveMode]);

  useKeyboardShortcuts([
    {
      key: 'Escape',
      handler: () => {
        if (isMoveMode) {
          setIsMoveMode(false);
          setMovingScrap(null);
          setIsShiftPressed(false);
        }
      },
      enabled: isMoveMode
    },
    {
      key: 'Enter',
      ctrl: true,
      handler: () => {
        if (newScrapModal.isOpen) {
          createScrapForm.handleSubmit();
        } else if (editScrapModal.isOpen) {
          updateScrapForm.handleSubmit();
        }
      },
      enabled: newScrapModal.isOpen || editScrapModal.isOpen
    }
  ], [isMoveMode, newScrapModal.isOpen, editScrapModal.isOpen]);

  useEffect(() => {
    if (nestedScraps.length > 0 && !loading) {
      const size: Size = CanvasUtils.calculateCanvasSize(nestedScraps);
      setCanvasSize(size);

      // Handle hash navigation after scraps are loaded
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const targetScrap = nestedScraps.find(scrap => scrap.code === hash);
        if (targetScrap) {
          const scrapElement = document.getElementById(hash);
          if (scrapElement) {
            scrapElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
          // Highlight the scrap instead of opening modal
          setHighlightedScrapCode(hash);
        }
      }
    } else if (nestedScraps.length === 0 && !loading) {
      // No scraps - canvas will use min-content with CSS min-width/min-height
      setCanvasSize({ width: 0, height: 0 });
    }
  }, [nestedScraps, loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && nestedScraps.length > 0) {
        const targetScrap = nestedScraps.find(scrap => scrap.code === hash);
        if (targetScrap) {
          // Scroll to the scrap
          const scrapElement = document.getElementById(hash);
          if (scrapElement) {
            scrapElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'center'
            });
          }
          // Highlight the scrap instead of opening modal
          setHighlightedScrapCode(hash);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [nestedScraps]); // eslint-disable-line react-hooks/exhaustive-deps

  // Form management using useFormWithSubmit hook
  const createScrapForm = useFormWithSubmit<ScrapFormData>({
    initialValues: { content: '', x: 0, y: 0, nestedWithin: parentId },
    onSubmit: async (values: ScrapFormData) => {
      await api.createScrap({
        content: values.content,
        x: values.x,
        y: values.y,
        nestedWithin: parentId
      });
    },
    onSuccess: () => {
      newScrapModal.close();
      fetchNestedScraps();
    }
  });

  const updateScrapForm = useFormWithSubmit<ScrapFormData>({
    initialValues: { content: '', x: 0, y: 0, visible: true, nestedWithin: parentId },
    onSubmit: async (values: ScrapFormData) => {
      // Use fullscreenModal for inline editing
      const modalData = fullscreenModal.data || editScrapModal.data;
      if (!modalData) {
        throw new Error('No scrap selected for editing');
      }
      await api.updateScrap(modalData.id, {
        content: values.content,
        x: values.x,
        y: values.y,
        visible: values.visible,
        nestedWithin: values.nestedWithin
      });
    },
    onSuccess: () => {
      if (fullscreenModal.isOpen) {
        fullscreenModal.close();
      } else {
        editScrapModal.close();
      }
      fetchNestedScraps();
    }
  });

  const [, _setOriginalEditScrapForm] = useState<ScrapFormData>({
    content: '',
    x: 0,
    y: 0,
    visible: true,
    nestedWithin: parentId,
  });

  const getScrapPosition = (scrap: Scrap): Position => {
    return CanvasUtils.getScrapDisplayPosition(scrap, nestedScraps);
  };

  const findAvailablePosition = (x: number, y: number): Position => {
    const offset = 100;
    let newX = x;
    let newY = y;

    // Check if any scrap exists at this position
    while (nestedScraps.some(scrap => scrap.x === newX && scrap.y === newY)) {
      newX += offset;
      newY += offset;
    }

    return { x: newX, y: newY };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    // Clear highlight when clicking anywhere
    if (highlightedScrapCode) {
      setHighlightedScrapCode(null);
    }

    if (isMoveMode && movingScrap) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, nestedScraps);
      updateScrapPosition(movingScrap.id, coords.x, coords.y);
      setIsMoveMode(false);
      setMovingScrap(null);
      setIsShiftPressed(false);
    } else if (isShiftPressed && session && !isHoveringScrap && !isMoveMode) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, nestedScraps);
      const availableCoords = findAvailablePosition(coords.x, coords.y);
      createScrapForm.setValues({
        content: '',
        x: availableCoords.x,
        y: availableCoords.y,
        visible: true,
        nestedWithin: parentId
      });
      newScrapModal.open();
      setIsShiftPressed(false);
    }
  };

  const updateScrapPosition = async (scrapId: string, x: number, y: number): Promise<void> => {
    if (!movingScrap) {
      console.warn('No scrap selected for moving');
      return;
    }

    try {
      await api.updateScrap(scrapId, {
        content: movingScrap.content,
        x: x,
        y: y,
        nestedWithin: parentId
      });
      fetchNestedScraps();
    } catch (err) {
      console.error('Error updating scrap position:', err);
    }
  };

  const updateScrapVisibility = async (scrapId: string, visible: boolean): Promise<void> => {
    try {
      await api.updateScrapVisibility(scrapId, visible);
      fetchNestedScraps();
    } catch (err) {
      console.error('Error updating scrap visibility:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading nested scraps...</div>
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

  return (
    <>
      {/* Custom cursor indicators */}
      <CursorIndicator
        visible={isShiftPressed && !!session && !isMoveMode}
        position={cursorPosition}
        mode="create"
        isHoveringScrap={isHoveringScrap}
      />
      <CursorIndicator
        visible={isMoveMode && !!session}
        position={cursorPosition}
        mode="move"
      />

      {/* Infinite canvas */}
      <div
        className="bg-transparent"
        style={{
          minWidth: '100vw',
          minHeight: '100vh',
          width: canvasSize.width > 0 ? `${canvasSize.width}px` : 'auto',
          height: canvasSize.height > 0 ? `${canvasSize.height}px` : 'auto',
          position: 'relative',
          marginTop: '80px', // Account for fixed header
          cursor: (isShiftPressed && session && !isMoveMode) || isMoveMode ? 'none' : 'default'
        }}
        onClick={handleCanvasClick}
      >
        {/* Centered create button */}
        {!isShiftPressed && !isMoveMode && (
          <CreateButton
            isAuthenticated={!!session}
            onClick={() => {
              const buttonCenterX = window.scrollX + window.innerWidth / 2;
              const buttonCenterY = window.scrollY + window.innerHeight / 2;
              const coords = CanvasUtils.pageToCanvasCoordinates(buttonCenterX, buttonCenterY, nestedScraps);
              const availableCoords = findAvailablePosition(coords.x, coords.y);
              createScrapForm.setValues({ content: '', x: availableCoords.x, y: availableCoords.y, visible: true, nestedWithin: parentId });
              newScrapModal.open();
            }}
          />
        )}

        {/* Error message */}
        <ErrorMessage message={error} />

        {/* Empty state */}
        {nestedScraps.length === 0 && !loading && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-gray-500 text-center max-w-md">
              <div className="text-lg mb-2">No nested scraps yet</div>
              <div className="text-sm">
                {session ? 'Create the first nested scrap by clicking the + button or holding Shift and clicking' : 'Sign in to create nested scraps'}
              </div>
            </div>
          </div>
        )}

        {/* Nested scrap cards */}
        {!loading && nestedScraps.map((scrap, index) => (
          <ScrapCard
            key={scrap.id}
            scrap={scrap}
            position={getScrapPosition(scrap)}
            index={index}
            isMoving={movingScrap?.id === scrap.id}
            isOwner={session?.user?.id === scrap.userId}
            isHovered={hoveredScrapId === scrap.id}
            isHighlighted={highlightedScrapCode === scrap.code}
            isAuthenticated={!!session}
            pathPrefix={window.location.pathname}
            onClick={() => {
              if (fullscreenModal.data?.id === scrap.id) {
                fullscreenModal.close();
              } else {
                const formData: ScrapFormData = {
                  content: scrap.content,
                  x: scrap.x,
                  y: scrap.y,
                  visible: scrap.visible,
                  nestedWithin: parentId
                };
                updateScrapForm.setInitialValues(formData);
                _setOriginalEditScrapForm(formData);
                fullscreenModal.open(scrap);
                window.history.pushState(null, '', `${window.location.pathname}#${scrap.code}`);
              }
            }}
            onMouseEnter={() => {
              setIsHoveringScrap(true);
              setHoveredScrapId(scrap.id);
            }}
            onMouseLeave={() => {
              setIsHoveringScrap(false);
              setHoveredScrapId(null);
            }}
          />
        ))}
      </div>

      {/* Fullscreen Modal - Update or View based on ownership */}
      {fullscreenModal.data && ScrapPermissions.canEdit(fullscreenModal.data, session?.user?.id) ? (
        <UpdateScrapModal
          isOpen={fullscreenModal.isOpen}
          scrap={fullscreenModal.data}
          pathPrefix={window.location.pathname}
          form={updateScrapForm}
          onClose={() => fullscreenModal.close()}
          onVisibilityToggle={async () => {
            const newVisibility = !fullscreenModal.data!.visible;
            await updateScrapVisibility(fullscreenModal.data!.id, newVisibility);
            fullscreenModal.close();
          }}
          onMoveClick={() => {
            setMovingScrap(fullscreenModal.data!);
            setIsMoveMode(true);
            fullscreenModal.close();
          }}
          FroalaEditor={FroalaEditor}
        />
      ) : (
        <ViewScrapModal
          isOpen={fullscreenModal.isOpen}
          scrap={fullscreenModal.data}
          pathPrefix={window.location.pathname}
          onClose={() => fullscreenModal.close()}
        />
      )}

      {/* New Scrap Modal */}
      <CreateScrapModal
        isOpen={newScrapModal.isOpen}
        form={createScrapForm}
        onClose={() => newScrapModal.close()}
        FroalaEditor={FroalaEditor}
      />

      {/* Edit Scrap Modal */}
      <UpdateScrapModal
        isOpen={editScrapModal.isOpen}
        scrap={editScrapModal.data}
        pathPrefix={window.location.pathname}
        form={updateScrapForm}
        onClose={() => editScrapModal.close()}
        onVisibilityToggle={() => {
          if (!editScrapModal.data) return;
          const newVisibility = !editScrapModal.data.visible;
          updateScrapVisibility(editScrapModal.data.id, newVisibility);
          editScrapModal.close();
        }}
        onMoveClick={() => {
          setMovingScrap(editScrapModal.data);
          setIsMoveMode(true);
          editScrapModal.close();
        }}
        FroalaEditor={FroalaEditor}
      />
    </>
  );
}