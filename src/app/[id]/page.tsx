'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon, PlusIcon, CogIcon, ArrowRightOnRectangleIcon, UserIcon, EyeIcon, EyeSlashIcon, MapPinIcon, PencilIcon, XMarkIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';
import dynamic from 'next/dynamic';
import config from '../../../corkboard.config';
import { useModal } from '../../hooks/useModal';
import { useFormWithSubmit } from '../../hooks/useFormWithSubmit';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { api, type Scrap } from '../../lib/api';
import { CanvasUtils } from '../../utils/canvas';
import { ScrapPermissions } from '../../utils/permissions';
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
  const [isMoveMode, setIsMoveMode] = useState<boolean>(false);
  const [movingScrap, setMovingScrap] = useState<Scrap | null>(null);

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
      editScrapForm.reset();
      _setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true, nestedWithin: parentId });
      _setEditScrapError('');
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  const handleHashNavigation = useCallback(() => {
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
        // Open the modal
        setTimeout(() => {
          fullscreenModal.open(targetScrap);
        }, 500); // Delay to let scroll complete
      }
    }
  }, [nestedScraps, fullscreenModal]);

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
          newScrapForm.handleSubmit();
        } else if (editScrapModal.isOpen) {
          editScrapForm.handleSubmit();
        }
      },
      enabled: newScrapModal.isOpen || editScrapModal.isOpen
    }
  ], [isMoveMode, newScrapModal.isOpen, editScrapModal.isOpen]);

  const calculateCanvasSize = useCallback((): void => {
    const size: Size = CanvasUtils.calculateCanvasSize(nestedScraps);
    setCanvasSize(size);
  }, [nestedScraps]);

  useEffect(() => {
    if (nestedScraps.length > 0 && !loading) {
      calculateCanvasSize();
      // Handle hash navigation after scraps are loaded
      handleHashNavigation();
    } else if (nestedScraps.length === 0 && !loading) {
      setCanvasSize({ width: Math.max(window.innerWidth, 1000), height: Math.max(window.innerHeight, 800) });
    }
  }, [nestedScraps, loading, calculateCanvasSize, handleHashNavigation]);

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      handleHashNavigation();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [nestedScraps, handleHashNavigation]);

  // Form management using useFormWithSubmit hook
  const newScrapForm = useFormWithSubmit<ScrapFormData>({
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

  const editScrapForm = useFormWithSubmit<ScrapFormData>({
    initialValues: { content: '', x: 0, y: 0, visible: true, nestedWithin: parentId },
    onSubmit: async (values: ScrapFormData) => {
      if (!editScrapModal.data) {
        throw new Error('No scrap selected for editing');
      }
      await api.updateScrap(editScrapModal.data.id, {
        content: values.content,
        x: values.x,
        y: values.y,
        visible: values.visible,
        nestedWithin: values.nestedWithin
      });
    },
    onSuccess: () => {
      editScrapModal.close();
      fetchNestedScraps();
    }
  });

  const [_editScrapError, _setEditScrapError] = useState<string>('');
  const [_originalEditScrapForm, _setOriginalEditScrapForm] = useState<ScrapFormData>({
    content: '',
    x: 0,
    y: 0,
    visible: true,
    nestedWithin: parentId,
  });

  const handleEditScrapClick = (scrap: Scrap): void => {
    const formData: ScrapFormData = {
      content: scrap.content,
      x: scrap.x,
      y: scrap.y,
      visible: scrap.visible,
      nestedWithin: scrap.nestedWithin || parentId,
    };
    editScrapForm.setInitialValues(formData);
    _setOriginalEditScrapForm(formData);
    editScrapModal.open(scrap);
  };

  const getScrapPosition = (scrap: Scrap): Position => {
    return CanvasUtils.getScrapDisplayPosition(scrap, nestedScraps);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (isMoveMode && movingScrap) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, nestedScraps);
      updateScrapPosition(movingScrap.id, coords.x, coords.y);
      setIsMoveMode(false);
      setMovingScrap(null);
      setIsShiftPressed(false);
    } else if (isShiftPressed && session && !isHoveringScrap && !isMoveMode) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, nestedScraps);
      newScrapForm.setValues({
        content: '',
        x: coords.x,
        y: coords.y,
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
      {/* Back button and parent scrap info */}
      <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between bg-white/90 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex items-center space-x-3">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 text-sm font-medium"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Back to main
          </Link>
          <div className="text-gray-400">|</div>
          <div className="text-sm">
            <span className="text-gray-600">Nested in: </span>
            {parentScrap.nestedWithin ? (
              <Link
                href={`/${parentScrap.nestedWithin}#${parentScrap.code}`}
                className="font-mono font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                #{parentScrap.code}
              </Link>
            ) : (
              <Link
                href={`/#${parentScrap.code}`}
                className="font-mono font-bold text-indigo-600 hover:text-indigo-800 underline"
              >
                #{parentScrap.code}
              </Link>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-500">
          {nestedScraps.length} nested scrap{nestedScraps.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Shift key cursor replacement */}
      {isShiftPressed && session && !isMoveMode && (
        <div
          className={`fixed pointer-events-none inline-flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${
            isHoveringScrap
              ? 'bg-gray-400 text-gray-600'
              : `${config.theme.primary.bg} text-white`
          }`}
          style={{
            left: `${cursorPosition.x - 16}px`,
            top: `${cursorPosition.y - 16}px`,
            zIndex: 1002
          }}
        >
          <PlusIcon className="h-4 w-4" />
        </div>
      )}

      {/* Move mode cursor replacement */}
      {isMoveMode && session && (
        <div
          className={`fixed pointer-events-none inline-flex items-center justify-center w-8 h-8 rounded-full shadow-lg ${config.theme.primary.bg} text-white`}
          style={{
            left: `${cursorPosition.x - 16}px`,
            top: `${cursorPosition.y - 16}px`,
            zIndex: 1002
          }}
        >
          <PlusIcon className="h-4 w-4" />
        </div>
      )}

      {/* Infinite canvas */}
      <div
        className="bg-transparent"
        style={{
          width: `${canvasSize.width}px`,
          height: `${canvasSize.height}px`,
          position: 'relative',
          marginTop: '80px', // Account for fixed header
          cursor: (isShiftPressed && session && !isMoveMode) || isMoveMode ? 'none' : 'default'
        }}
        onClick={handleCanvasClick}
      >
        {/* Centered button for creating new nested scraps */}
        {session && !isShiftPressed && !isMoveMode && (
          <button
            onClick={() => {
              const buttonCenterX = window.scrollX + window.innerWidth / 2;
              const buttonCenterY = window.scrollY + window.innerHeight / 2;

              const coords = CanvasUtils.pageToCanvasCoordinates(buttonCenterX, buttonCenterY, nestedScraps);

              newScrapForm.setValues({
                content: '',
                x: coords.x,
                y: coords.y,
                nestedWithin: parentId
              });
              newScrapModal.open();
            }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-16 h-16 rounded-full ${config.theme.primary.bg} ${config.theme.primary.hover} text-white shadow-lg transition-all hover:scale-110 cursor-pointer`}
            title="Create new nested scrap (or hold Shift and click anywhere)"
            style={{ zIndex: 1000 }}
          >
            <PlusIcon className="h-8 w-8" />
          </button>
        )}

        {/* Decorative symbol for non-authenticated users */}
        {!session && !isShiftPressed && !isMoveMode && (
          <div
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-300 text-gray-600 shadow-lg"
            style={{ zIndex: 1000 }}
            title="Sign in to create scraps"
          >
            <span className="text-2xl">⚘</span>
          </div>
        )}

        {/* Fixed settings and sign out icons bottom right */}
        <div className="fixed bottom-6 right-6 flex space-x-2" style={{ zIndex: 999 }}>
          {session ? (
            <>
              <Link
                href="/admin"
                className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                title="Admin"
              >
                <CogIcon className="h-6 w-6" />
              </Link>
              <button
                onClick={async () => {
                  const { signOut } = await import('next-auth/react');
                  await signOut({ redirect: false });
                  window.location.href = '/';
                }}
                className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </>
          ) : (
            <Link
              href="/auth/signin"
              className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              title="Sign In"
            >
              <UserIcon className="h-6 w-6" />
            </Link>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="fixed top-20 left-4 right-4 p-4 bg-red-50 border border-red-200 rounded-md" style={{ zIndex: 998 }}>
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {nestedScraps.length === 0 && !loading && (
          <div className="flex items-center justify-center min-h-[50vh] text-center">
            <div className="text-gray-500">
              <div className="text-lg mb-2">No nested scraps yet</div>
              <div className="text-sm">
                {session ? 'Create the first nested scrap by clicking the + button or holding Shift and clicking' : 'Sign in to create nested scraps'}
              </div>
            </div>
          </div>
        )}

        {/* Absolutely positioned nested scraps */}
        {!loading && nestedScraps.map((scrap, index) => {
          const position = getScrapPosition(scrap);
          return (
            <div
              key={scrap.id}
              id={scrap.code}
              className={`absolute shadow-lg rounded-lg p-4 max-w-sm transition-shadow cursor-pointer ${
                movingScrap?.id === scrap.id
                  ? `${config.theme.moving.bg} ${config.theme.moving.text} border ${config.theme.moving.border}`
                  : !scrap.visible && session?.user?.id === scrap.userId
                    ? `${config.theme.invisible.bg} ${config.theme.invisible.text} border border-gray-600 opacity-40 hover:opacity-100 hover:shadow-xl invert`
                    : 'bg-white border border-gray-200 hover:shadow-xl'
              }`}
              style={{
                left: `${position.x}px`,
                top: `${position.y}px`,
                zIndex: scrap.visible ? 10 + index : index
              }}
              onMouseEnter={() => setIsHoveringScrap(true)}
              onMouseLeave={() => setIsHoveringScrap(false)}
              onClick={() => {
                if (fullscreenModal.data?.id === scrap.id) {
                  fullscreenModal.close();
                } else {
                  fullscreenModal.open(scrap);
                  window.history.pushState(null, '', `${window.location.pathname}#${scrap.code}`);
                }
              }}
            >
              {/* Header with code, nest button, and action buttons */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                  <a
                    href={`${window.location.pathname}#${scrap.code}`}
                    className={`text-sm font-mono font-bold ${config.theme.primary.text} hover:text-indigo-800`}
                    title={`Anchor to ${scrap.code}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    #{scrap.code}
                  </a>
                  {/* Open Nest button */}
                  {scrap.nestedCount !== undefined && (
                    <Link
                      href={`/${scrap.id}`}
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer mt-1"
                    >
                      {scrap.nestedCount === 0 ? (
                        'Start Nest'
                      ) : (
                        <>
                          Open Nest{' '}
                          <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                            {scrap.nestedCount}
                          </span>
                        </>
                      )}
                    </Link>
                  )}
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!scrap.visible && session?.user?.id === scrap.userId) {
                        // If it's an invisible scrap, toggle visibility directly
                        updateScrapVisibility(scrap.id, true);
                      } else {
                        // Otherwise open fullscreen modal
                        fullscreenModal.open(scrap);
                        window.history.pushState(null, '', `${window.location.pathname}#${scrap.code}`);
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 cursor-pointer"
                    title={!scrap.visible && session?.user?.id === scrap.userId ? "Make visible" : "View fullscreen"}
                  >
                    {!scrap.visible && session?.user?.id === scrap.userId ? (
                      <EyeSlashIcon className="h-4 w-4" />
                    ) : (
                      <ArrowsPointingOutIcon className="h-4 w-4" />
                    )}
                  </button>
                  {session?.user?.id === scrap.userId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditScrapClick(scrap);
                        // Update URL hash
                        window.history.pushState(null, '', `${window.location.pathname}#${scrap.code}`);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-1 rounded hover:bg-gray-100 cursor-pointer"
                      title="Edit this scrap"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="mb-3">
                <div
                  className="text-sm text-gray-800 line-clamp-24 froala-content"
                  dangerouslySetInnerHTML={{ __html: scrap.content }}
                />
              </div>

              {/* Footer info */}
              <div className="text-xs text-gray-500 border-t pt-2 flex justify-between items-center">
                <div>
                  {scrap.userName || scrap.userEmail}
                </div>
                <div>
                  {new Date(scrap.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fullscreen Modal for nested scraps */}
      {fullscreenModal.isOpen && fullscreenModal.data && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 1001,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => fullscreenModal.close()}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-gray-200 mb-6">
              <div className="flex flex-col">
                <a
                  href={`${window.location.pathname}#${fullscreenModal.data.code}`}
                  className={`text-lg font-mono font-bold ${config.theme.primary.text} hover:text-indigo-800`}
                  title={`Anchor to ${fullscreenModal.data.code}`}
                >
                  #{fullscreenModal.data.code}
                </a>
                {/* Open Nest button in modal header */}
                {fullscreenModal.data.nestedCount !== undefined && (
                  <Link
                    href={`/${fullscreenModal.data.id}`}
                    className="inline-flex items-center px-2 py-1 border border-gray-300 rounded-md shadow-sm text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer mt-1"
                  >
                    {fullscreenModal.data.nestedCount === 0 ? (
                      'Start Nest'
                    ) : (
                      <>
                        Open Nest{' '}
                        <span className="ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          {fullscreenModal.data.nestedCount}
                        </span>
                      </>
                    )}
                  </Link>
                )}
              </div>
              <div className="flex space-x-2">
                {ScrapPermissions.canEdit(fullscreenModal.data, session?.user?.id) && (
                  <>
                    <button
                      onClick={async () => {
                        const newVisibility = !fullscreenModal.data!.visible;
                        await updateScrapVisibility(fullscreenModal.data!.id, newVisibility);
                        fullscreenModal.close();
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      title={fullscreenModal.data.visible ? "Make private" : "Make visible"}
                    >
                      {fullscreenModal.data.visible ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setMovingScrap(fullscreenModal.data!);
                        setIsMoveMode(true);
                        fullscreenModal.close();
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      title="Move this scrap"
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        handleEditScrapClick(fullscreenModal.data!);
                        fullscreenModal.close();
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      title="Edit this scrap"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => fullscreenModal.close()}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                  title="Close fullscreen"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content - scrollable */}
            <div className="flex-1 overflow-y-auto mb-6">
              <div
                className="text-base text-gray-800 leading-relaxed froala-content"
                dangerouslySetInnerHTML={{ __html: fullscreenModal.data.content }}
              />
            </div>

            {/* Footer */}
            <div className="text-sm text-gray-500 border-t border-gray-200 pt-4 flex justify-between items-center">
              <div>
                {fullscreenModal.data.userName || fullscreenModal.data.userEmail}
              </div>
              <div>
                {new Date(fullscreenModal.data.createdAt).toLocaleDateString()}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* New Scrap Modal for nested scraps */}
      {newScrapModal.isOpen && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 1001,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => newScrapModal.close()}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                  Create New Nested Scrap
                </h2>
                <button
                  onClick={() => newScrapModal.close()}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                  title="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content Form */}
              <form onSubmit={newScrapForm.handleSubmit} className="space-y-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Content
                  </label>
                  <div>
                    <FroalaEditor
                      content={newScrapForm.values.content}
                      onChange={(content) => newScrapForm.setValue('content', content)}
                      height={400}
                      maxHeight={600}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="new-x" className="block text-sm font-medium text-gray-900 mb-2">
                      X Position
                    </label>
                      <input
                        type="number"
                        name="x"
                        id="new-x"
                        value={newScrapForm.values.x}
                        onChange={newScrapForm.handleInputChange}
                        min={0}
                        max={999999}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label htmlFor="new-y" className="block text-sm font-medium text-gray-900 mb-2">
                        Y Position
                      </label>
                      <input
                        type="number"
                        name="y"
                        id="new-y"
                        value={newScrapForm.values.y}
                        onChange={newScrapForm.handleInputChange}
                        min={0}
                        max={999999}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  {newScrapForm.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
                      <div className="text-red-800 text-sm">{newScrapForm.error}</div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => newScrapModal.close()}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={newScrapForm.loading || !newScrapForm.values.content || newScrapForm.values.content.trim() === '' || newScrapForm.values.content === '<p><br></p>'}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${config.theme.primary.bg} ${config.theme.primary.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {newScrapForm.loading ? 'Creating...' : 'Create Nested Scrap'}
                    </button>
                  </div>
              </form>
          </div>
        </div>
      )}

      {/* Edit Scrap Modal for nested scraps */}
      {editScrapModal.isOpen && editScrapModal.data && (
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 1001,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => editScrapModal.close()}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Nested Scrap #{editScrapModal.data.code}
                </h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!editScrapModal.data) return;
                      const newVisibility = !editScrapModal.data.visible;
                      updateScrapVisibility(editScrapModal.data.id, newVisibility);
                      editScrapModal.close();
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                    title={editScrapModal.data.visible ? "Make private" : "Make visible"}
                  >
                    {editScrapModal.data.visible ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMovingScrap(editScrapModal.data);
                      setIsMoveMode(true);
                      editScrapModal.close();
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                    title="Move this scrap"
                  >
                    <MapPinIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => editScrapModal.close()}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                    title="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content Form */}
              <form onSubmit={editScrapForm.handleSubmit} className="space-y-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Content
                    </label>
                    <div>
                      <FroalaEditor
                        content={editScrapForm.values.content}
                        onChange={(content) => editScrapForm.setValue('content', content)}
                        height={400}
                        maxHeight={600}
                      />
                    </div>
                  </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-x" className="block text-sm font-medium text-gray-900 mb-2">
                        X Position
                      </label>
                      <input
                        type="number"
                        name="x"
                        id="edit-x"
                        value={editScrapForm.values.x}
                        onChange={editScrapForm.handleInputChange}
                        min={0}
                        max={999999}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border"
                      />
                    </div>

                    <div>
                      <label htmlFor="edit-y" className="block text-sm font-medium text-gray-900 mb-2">
                        Y Position
                      </label>
                      <input
                        type="number"
                        name="y"
                        id="edit-y"
                        value={editScrapForm.values.y}
                        onChange={editScrapForm.handleInputChange}
                        min={0}
                        max={999999}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  {editScrapForm.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
                      <div className="text-red-800 text-sm">{editScrapForm.error}</div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => editScrapModal.close()}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editScrapForm.loading || !editScrapForm.values.content || editScrapForm.values.content.trim() === '' || editScrapForm.values.content === '<p><br></p>'}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${config.theme.primary.bg} ${config.theme.primary.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {editScrapForm.loading ? 'Updating...' : 'Update Scrap'}
                    </button>
                  </div>
              </form>
          </div>
        </div>
      )}
    </>
  );
}