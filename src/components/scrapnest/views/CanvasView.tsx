'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useModal } from '../../../hooks/useModal';
import { useFormWithSubmit } from '../../../hooks/useFormWithSubmit';
import { useKeyboardShortcuts } from '../../../hooks/useKeyboardShortcuts';
import { api, type Scrap } from '../../../lib/api';
import { CanvasUtils } from '../../../utils/canvas';
import { ScrapPermissions } from '../../../utils/permissions';
import { CursorIndicator } from '../elements/CursorIndicator';
import { CreateButton } from '../elements/CreateButton';
import { ErrorMessage } from '@/components/common/elements/ErrorMessage';
import { ScrapCard } from '../modules/ScrapCard';
import { CreateScrapModal } from '../modules/CreateScrapModal';
import { UpdateScrapModal } from '../modules/UpdateScrapModal';
import { ViewScrapModal } from '../modules/ViewScrapModal';
import type { ScrapFormData, Position, Size } from '../../../types';

// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('@/components/common/input/FroalaEditor'), {
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});

interface CanvasViewProps {
  /** The scraps to display */
  scraps: Scrap[];
  /** Loading state */
  loading: boolean;
  /** Error message */
  error: string;
  /** Callback to refresh scraps */
  onRefresh: () => void;
  /** Optional parent scrap for nested views */
  parentScrap?: Scrap | null;
  /** Optional parent ID for creating nested scraps */
  parentId?: string;
  /** Optional path prefix for navigation */
  pathPrefix?: string;
  /** Loading text */
  loadingText?: string;
  /** Title to set in document */
  title?: string;
}

export function CanvasView({
  scraps,
  loading,
  error,
  onRefresh,
  parentScrap = null,
  parentId,
  pathPrefix = '',
  loadingText = 'Loading scraps...',
  title = 'Corkboard'
}: CanvasViewProps): React.JSX.Element {
  const { data: session } = useSession();
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
      setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true, nestedWithin: parentId });
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  const handleHashNavigation = useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && scraps.length > 0) {
      const targetScrap = scraps.find(scrap => scrap.code === hash);
      if (targetScrap) {
        const scrapElement = document.getElementById(hash);
        if (scrapElement) {
          scrapElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
          });
        }
        setHighlightedScrapCode(hash);
      }
    }
  }, [scraps]);

  useEffect(() => {
    document.title = title;
  }, [title]);

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

    const initializeCursorPosition = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousemove', initializeCursorPosition, { once: true });

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
    if (scraps.length > 0 && !loading) {
      calculateCanvasSize();
      handleHashNavigation();
    } else if (scraps.length === 0 && !loading) {
      setCanvasSize({ width: 0, height: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scraps, loading, handleHashNavigation]);

  const calculateCanvasSize = (): void => {
    const size: Size = CanvasUtils.calculateCanvasSize(scraps);
    setCanvasSize(size);
  };

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
      onRefresh();
    }
  });

  const updateScrapForm = useFormWithSubmit<ScrapFormData>({
    initialValues: { content: '', x: 0, y: 0, visible: true, nestedWithin: parentId },
    onSubmit: async (values: ScrapFormData) => {
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
      onRefresh();
    }
  });

  const [originalEditScrapForm, setOriginalEditScrapForm] = useState<ScrapFormData>({
    content: '',
    x: 0,
    y: 0,
    visible: true,
    nestedWithin: parentId,
  });

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      handleHashNavigation();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scraps, handleHashNavigation]);

  const getScrapPosition = (scrap: Scrap): Position => {
    return CanvasUtils.getScrapDisplayPosition(scrap, scraps);
  };

  const findAvailablePosition = (x: number, y: number): Position => {
    const offset = 100;
    let newX = x;
    let newY = y;

    while (scraps.some(scrap => scrap.x === newX && scrap.y === newY)) {
      newX += offset;
      newY += offset;
    }

    return { x: newX, y: newY };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (highlightedScrapCode) {
      setHighlightedScrapCode(null);
    }

    if (isMoveMode && movingScrap) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, scraps);
      updateScrapPosition(movingScrap.id, coords.x, coords.y);
      setIsMoveMode(false);
      setMovingScrap(null);
      setIsShiftPressed(false);
    } else if (isShiftPressed && session && !isHoveringScrap && !isMoveMode) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, scraps);
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
      onRefresh();
    } catch (err) {
      console.error('Error updating scrap position:', err);
    }
  };

  const updateScrapVisibility = async (scrapId: string, visible: boolean): Promise<void> => {
    try {
      await api.updateScrapVisibility(scrapId, visible);
      onRefresh();
    } catch (err) {
      console.error('Error updating scrap visibility:', err);
    }
  };

  const hasFormChanged = (): boolean => {
    return (
      updateScrapForm.values.content !== originalEditScrapForm.content ||
      updateScrapForm.values.x !== originalEditScrapForm.x ||
      updateScrapForm.values.y !== originalEditScrapForm.y
    );
  };

  const handleVisibilityToggle = async (): Promise<void> => {
    if (!editScrapModal.data) {
      console.warn('No scrap selected for visibility toggle');
      return;
    }

    const newVisibility: boolean = !editScrapModal.data.visible;

    await updateScrapVisibility(editScrapModal.data.id, newVisibility);

    editScrapModal.setData(prev => prev ? { ...prev, visible: newVisibility } : null);
    updateScrapForm.setValue('visible', newVisibility);
    setOriginalEditScrapForm(prev => ({ ...prev, visible: newVisibility }));

    if (!hasFormChanged()) {
      editScrapModal.close();
    }
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

  return (
    <>
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

      <div
        className="bg-transparent"
        style={{
          minHeight: '100vh',
          minWidth: parentId ? '100vw' : undefined,
          width: canvasSize.width > 0 ? `${canvasSize.width}px` : 'auto',
          height: canvasSize.height > 0 ? `${canvasSize.height}px` : 'auto',
          position: 'relative',
          marginTop: parentId ? '80px' : undefined,
          cursor: (isShiftPressed && session && !isMoveMode) || isMoveMode ? 'none' : 'default'
        }}
        onClick={handleCanvasClick}
      >
        {!isShiftPressed && !isMoveMode && (
          <CreateButton
            isAuthenticated={!!session}
            onClick={() => {
              const buttonCenterX = window.scrollX + window.innerWidth / 2;
              const buttonCenterY = window.scrollY + window.innerHeight / 2;
              const coords = CanvasUtils.pageToCanvasCoordinates(buttonCenterX, buttonCenterY, scraps);
              const availableCoords = findAvailablePosition(coords.x, coords.y);
              createScrapForm.setValues({
                content: '',
                x: availableCoords.x,
                y: availableCoords.y,
                visible: true,
                nestedWithin: parentId
              });
              newScrapModal.open();
            }}
          />
        )}

        <ErrorMessage message={error} />

        {loading && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center" style={{ zIndex: 997 }}>
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-4">Loading corkboard...</div>
            </div>
          </div>
        )}

        {/* Empty state for nested views */}
        {parentId && scraps.length === 0 && !loading && (
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="text-gray-500 text-center max-w-md">
              <div className="text-lg mb-2">No nested scraps yet</div>
              <div className="text-sm">
                {session ? 'Create the first nested scrap by clicking the + button or holding Shift and clicking' : 'Sign in to create nested scraps'}
              </div>
            </div>
          </div>
        )}

        {!loading && scraps.map((scrap, index) => (
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
            pathPrefix={pathPrefix || (parentId ? window.location.pathname : undefined)}
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
                setOriginalEditScrapForm(formData);
                fullscreenModal.open(scrap);
                const hashPath = parentId ? `${window.location.pathname}#${scrap.code}` : `#${scrap.code}`;
                window.history.pushState(null, '', hashPath);
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

      {fullscreenModal.data && ScrapPermissions.canEdit(fullscreenModal.data, session?.user?.id) ? (
        <UpdateScrapModal
          isOpen={fullscreenModal.isOpen}
          scrap={fullscreenModal.data}
          pathPrefix={pathPrefix || (parentId ? window.location.pathname : undefined)}
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
          pathPrefix={pathPrefix || (parentId ? window.location.pathname : undefined)}
          onClose={() => fullscreenModal.close()}
        />
      )}

      <CreateScrapModal
        isOpen={newScrapModal.isOpen}
        form={createScrapForm}
        onClose={() => newScrapModal.close()}
        FroalaEditor={FroalaEditor}
      />

      <UpdateScrapModal
        isOpen={editScrapModal.isOpen}
        scrap={editScrapModal.data}
        pathPrefix={pathPrefix || (parentId ? window.location.pathname : undefined)}
        form={updateScrapForm}
        onClose={() => editScrapModal.close()}
        onVisibilityToggle={handleVisibilityToggle}
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
