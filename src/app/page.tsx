'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { PencilIcon, PlusIcon, ArrowsPointingOutIcon, XMarkIcon, CogIcon, ArrowRightOnRectangleIcon, UserIcon, EyeIcon, EyeSlashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import config from '../../corkboard.config';
import { useModal } from '../hooks/useModal';
import { useFormWithSubmit } from '../hooks/useFormWithSubmit';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { api, type Scrap } from '../lib/api';
import { CanvasUtils } from '../utils/canvas';
import { ScrapPermissions } from '../utils/permissions';
import { ScrapHeader } from '../components/ScrapHeader';
import type { ScrapFormData, Position, Size } from '../types';


// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('./components/FroalaEditor'), { 
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});


export default function HomePage(): React.JSX.Element {
  const { data: session } = useSession();
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [_error, setError] = useState<string>('');
  const [_hasAdminAccess, setHasAdminAccess] = useState<boolean>(false);
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
      setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
      setEditScrapError('');
      window.history.pushState(null, '', window.location.pathname);
    }
  });

  const handleHashNavigation = useCallback(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && scraps.length > 0) {
      const targetScrap = scraps.find(scrap => scrap.code === hash);
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
  }, [scraps]);

  useEffect(() => {
    document.title = 'Corkboard';
  }, []);

  useEffect(() => {
    fetchScraps();
    if (session?.user?.id) {
      checkAdminAccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable shift key functionality when modals are open or in move mode
      if (fullscreenModal.isOpen || newScrapModal.isOpen || editScrapModal.isOpen || isMoveMode) {
        return;
      }
      
      if (e.shiftKey && !isShiftPressed) {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Disable shift key functionality when modals are open or in move mode
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

  // Use keyboard shortcuts hook for better organization
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

  useEffect(() => {
    if (scraps.length > 0 && !loading) {
      calculateCanvasSize();
      // Handle hash navigation after scraps are loaded
      handleHashNavigation();
    } else if (scraps.length === 0 && !loading) {
      // No scraps - set minimal canvas size
      setCanvasSize({ width: Math.max(window.innerWidth, 1000), height: Math.max(window.innerHeight, 800) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scraps, loading, handleHashNavigation]);

  const calculateCanvasSize = (): void => {
    const size: Size = CanvasUtils.calculateCanvasSize(scraps);
    setCanvasSize(size);
  };

  // Keep centering function for potential future use
  const _centerViewport = () => {
    if (scraps.length === 0) return;

    const bounds = scraps.reduce(
      (acc, scrap) => ({
        minX: Math.min(acc.minX, scrap.x),
        maxX: Math.max(acc.maxX, scrap.x + 300),
        minY: Math.min(acc.minY, scrap.y),
        maxY: Math.max(acc.maxY, scrap.y + 200),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    bounds.minX = Math.min(bounds.minX, 0);
    bounds.minY = Math.min(bounds.minY, 0);
    bounds.maxX = Math.max(bounds.maxX, 0);
    bounds.maxY = Math.max(bounds.maxY, 0);

    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    const padding = 100;

    const scrollX = centerX - Math.min(bounds.minX, 0) - window.innerWidth / 2 + padding;
    const scrollY = centerY - Math.min(bounds.minY, 0) - window.innerHeight / 2 + padding;

    window.scrollTo({
      left: Math.max(0, scrollX),
      top: Math.max(0, scrollY),
      behavior: 'smooth'
    });
  };
  
  const checkAdminAccess = async (): Promise<void> => {
    if (!session?.user?.id) {
      setHasAdminAccess(false);
      return;
    }

    try {
      const response = await api.checkPermission({
        userId: session.user.id,
        resource: 'admin',
        action: 'access'
      });
      setHasAdminAccess(response.hasPermission);
    } catch (err) {
      console.error('Error checking admin permissions:', err);
      setHasAdminAccess(false);
    }
  };

  const fetchScraps = async (): Promise<void> => {
    try {
      const data = await api.fetchScraps(!!session?.user?.id);
      const filteredScraps = session?.user?.id 
        ? ScrapPermissions.filterViewableScraps(data.scraps, session.user.id)
        : data.scraps;
      setScraps(filteredScraps);
    } catch (err) {
      console.error('Error fetching scraps:', err);
      setError('An error occurred while fetching scraps');
      setScraps([]);
    } finally {
      setLoading(false);
    }
  };

  const _scrapToText = (scrap: Scrap) => {
    const scrapData = {
      id: scrap.id,
      code: scrap.code,
      content: scrap.content,
      position: { x: scrap.x, y: scrap.y },
      author: scrap.userName || scrap.userEmail,
      created: new Date(scrap.createdAt).toISOString(),
      updated: new Date(scrap.updatedAt).toISOString()
    };
    
    return JSON.stringify(scrapData, null, 2);
  };

  // Form management using useFormWithSubmit hook
  const newScrapForm = useFormWithSubmit<ScrapFormData>({
    initialValues: { content: '', x: 0, y: 0 },
    onSubmit: async (values: ScrapFormData) => {
      await api.createScrap({
        content: values.content,
        x: values.x,
        y: values.y
      });
    },
    onSuccess: () => {
      newScrapModal.close();
      fetchScraps();
    }
  });

  const editScrapForm = useFormWithSubmit<ScrapFormData>({
    initialValues: { content: '', x: 0, y: 0, visible: true },
    onSubmit: async (values: ScrapFormData) => {
      if (!editScrapModal.data) {
        throw new Error('No scrap selected for editing');
      }
      await api.updateScrap(editScrapModal.data.id, {
        content: values.content,
        x: values.x,
        y: values.y,
        visible: values.visible
      });
    },
    onSuccess: () => {
      editScrapModal.close();
      fetchScraps();
    }
  });

  const [editScrapError, setEditScrapError] = useState<string>('');
  const [originalEditScrapForm, setOriginalEditScrapForm] = useState<ScrapFormData>({
    content: '',
    x: 0,
    y: 0,
    visible: true,
  });

  const handleEditScrapClick = (scrap: Scrap): void => {
    const formData: ScrapFormData = {
      content: scrap.content,
      x: scrap.x,
      y: scrap.y,
      visible: scrap.visible,
    };
    editScrapForm.setInitialValues(formData);
    setOriginalEditScrapForm(formData);
    editScrapModal.open(scrap);
  };

  // Quill editor configuration - only basic formatting, no font size
  const _quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'align': [] }],
      [{ 'color': [] }]
    ],
  };

  const _quillFormats = [
    'bold', 'italic', 'underline', 'align', 'color'
  ];

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      handleHashNavigation();
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [scraps, handleHashNavigation]);

  // Calculate position accounting for negative coordinates
  const getScrapPosition = (scrap: Scrap): Position => {
    return CanvasUtils.getScrapDisplayPosition(scrap, scraps);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading scraps index...</div>
      </div>
    );
  }

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>): void => {
    if (isMoveMode && movingScrap) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, scraps);
      updateScrapPosition(movingScrap.id, coords.x, coords.y);
      setIsMoveMode(false);
      setMovingScrap(null);
      setIsShiftPressed(false);
    } else if (isShiftPressed && session && !isHoveringScrap && !isMoveMode) {
      const coords: Position = CanvasUtils.pageToCanvasCoordinates(e.pageX, e.pageY, scraps);
      newScrapForm.setValues({ 
        content: '', 
        x: coords.x, 
        y: coords.y,
        visible: true
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
      });
      fetchScraps();
    } catch (err) {
      console.error('Error updating scrap position:', err);
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

  const hasFormChanged = (): boolean => {
    return (
      editScrapForm.values.content !== originalEditScrapForm.content ||
      editScrapForm.values.x !== originalEditScrapForm.x ||
      editScrapForm.values.y !== originalEditScrapForm.y
    );
  };

  const handleVisibilityToggle = async (): Promise<void> => {
    if (!editScrapModal.data) {
      console.warn('No scrap selected for visibility toggle');
      return;
    }
    
    const newVisibility: boolean = !editScrapModal.data.visible;
    
    await updateScrapVisibility(editScrapModal.data.id, newVisibility);
    
    // Update modal data and form state
    editScrapModal.setData(prev => prev ? { ...prev, visible: newVisibility } : null);
    editScrapForm.setValue('visible', newVisibility);
    setOriginalEditScrapForm(prev => ({ ...prev, visible: newVisibility }));
    
    // If no other changes, close the modal
    if (!hasFormChanged()) {
      editScrapModal.close();
    }
  };

  return (
    <>
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

      {/* Infinite canvas - no size restrictions */}
      <div 
        className="bg-transparent" 
        style={{ 
          width: `${canvasSize.width}px`, 
          height: `${canvasSize.height}px`,
          position: 'relative',
          cursor: (isShiftPressed && session && !isMoveMode) || isMoveMode ? 'none' : 'default'
        }}
        onClick={handleCanvasClick}
      >
        {/* Centered button - + for authenticated users, ⚘ for non-authenticated */}
        {session && !isShiftPressed && !isMoveMode && (
          <button
            onClick={() => {
              const buttonCenterX = window.scrollX + window.innerWidth / 2;
              const buttonCenterY = window.scrollY + window.innerHeight / 2;
              
              const coords = CanvasUtils.pageToCanvasCoordinates(buttonCenterX, buttonCenterY, scraps);
              
              newScrapForm.setValues({ 
                content: '', 
                x: coords.x, 
                y: coords.y
              });
              newScrapModal.open();
            }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-16 h-16 rounded-full ${config.theme.primary.bg} ${config.theme.primary.hover} text-white shadow-lg transition-all hover:scale-110 cursor-pointer`}
            title="Create new scrap (or hold Shift and click anywhere)"
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
        {_error && (
          <div className="fixed top-4 left-4 right-4 p-4 bg-red-50 border border-red-200 rounded-md" style={{ zIndex: 998 }}>
            <p className="text-red-800">{_error}</p>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center" style={{ zIndex: 997 }}>
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-4">Loading corkboard...</div>
            </div>
          </div>
        )}

        {/* Empty state */}

        {/* Absolutely positioned scraps */}
        {!loading && scraps.map((scrap, index) => {
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
                  window.history.pushState(null, '', `#${scrap.code}`);
                }
              }}
            >
              <ScrapHeader
                scrap={scrap}
                isOwner={session?.user?.id === scrap.userId}
                onFullscreenClick={() => {
                  if (!scrap.visible && session?.user?.id === scrap.userId) {
                    updateScrapVisibility(scrap.id, true);
                  } else {
                    fullscreenModal.open(scrap);
                    window.history.pushState(null, '', `#${scrap.code}`);
                  }
                }}
                onEditClick={() => {
                  handleEditScrapClick(scrap);
                  window.history.pushState(null, '', `#${scrap.code}`);
                }}
              />

              {/* Divider line */}
              <div className="border-t border-gray-200 mb-3"></div>

              {/* Content */}
              <div className="mb-3">
                <div
                  className="text-sm text-gray-800 line-clamp-24 froala-content"
                  dangerouslySetInnerHTML={{ __html: scrap.content }}
                />
              </div>

              {/* Footer info - simplified */}
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

      {/* Fullscreen Modal */}
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
            <div className="pb-4 border-b border-gray-200 mb-6">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <ScrapHeader
                    scrap={fullscreenModal.data}
                    isModal={true}
                    isOwner={ScrapPermissions.canEdit(fullscreenModal.data, session?.user?.id)}
                    onFullscreenClick={() => {
                      fullscreenModal.open(fullscreenModal.data!);
                      window.history.pushState(null, '', `#${fullscreenModal.data.code}`);
                    }}
                    onEditClick={() => {
                      handleEditScrapClick(fullscreenModal.data!);
                      fullscreenModal.close();
                    }}
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
                  />
                </div>
                <button
                  onClick={() => fullscreenModal.close()}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer ml-2"
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

      {/* New Scrap Modal */}
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
                  Create New Scrap
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
                      {newScrapForm.loading ? 'Creating...' : 'Create Scrap'}
                    </button>
                  </div>
              </form>
          </div>
        </div>
      )}

      {/* Edit Scrap Modal */}
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
                  Edit Scrap #{editScrapModal.data.code}
                </h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleVisibilityToggle}
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
