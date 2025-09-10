'use client';

import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { PencilIcon, PlusIcon, ArrowsPointingOutIcon, XMarkIcon, CogIcon, ArrowRightOnRectangleIcon, UserIcon, EyeIcon, EyeSlashIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import config from '../../corkboard.config';


// Dynamically import Froala editor to avoid SSR issues
const FroalaEditor = dynamic(() => import('./components/FroalaEditor'), { 
  ssr: false,
  loading: () => <div className="flex-1 border border-gray-300 rounded-md p-3 text-sm">Loading editor...</div>
});

interface Scrap {
  id: string;
  code: string;
  content: string;
  x: number;
  y: number;
  visible: boolean;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: number;
  updatedAt: number;
}

export default function HomePage() {
  const { data: session } = useSession();
  const [scraps, setScraps] = useState<Scrap[]>([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState('');
  const [_hasAdminAccess, setHasAdminAccess] = useState(false);
  const [fullscreenScrap, setFullscreenScrap] = useState<Scrap | null>(null);
  const [showNewScrapModal, setShowNewScrapModal] = useState(false);
  const [showEditScrapModal, setShowEditScrapModal] = useState(false);
  const [editingScrap, setEditingScrap] = useState<Scrap | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [isHoveringScrap, setIsHoveringScrap] = useState(false);
  const [isMoveMode, setIsMoveMode] = useState(false);
  const [movingScrap, setMovingScrap] = useState<Scrap | null>(null);

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
          setFullscreenScrap(targetScrap);
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

  // Prevent body scroll when modals are open
  useEffect(() => {
    if (fullscreenScrap || showNewScrapModal || showEditScrapModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [fullscreenScrap, showNewScrapModal, showEditScrapModal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle escape key to cancel move mode
      if (e.key === 'Escape' && isMoveMode) {
        setIsMoveMode(false);
        setMovingScrap(null);
        return;
      }
      
      // Disable shift key functionality when modals are open or in move mode
      if (fullscreenScrap || showNewScrapModal || showEditScrapModal || isMoveMode) {
        return;
      }
      
      if (e.shiftKey && !isShiftPressed) {
        setIsShiftPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      // Disable shift key functionality when modals are open or in move mode
      if (fullscreenScrap || showNewScrapModal || showEditScrapModal || isMoveMode) {
        return;
      }
      
      if (!e.shiftKey) {
        setIsShiftPressed(false);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      // Always update cursor position
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    // Initialize cursor position immediately
    const initializeCursorPosition = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    // Get initial cursor position
    window.addEventListener('mousemove', initializeCursorPosition, { once: true });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isShiftPressed, fullscreenScrap, showNewScrapModal, showEditScrapModal]);

  // Handle keyboard shortcuts for modals
  useEffect(() => {
    const handleModalKeyboard = (e: KeyboardEvent) => {
      // Handle Escape key to close modals
      if (e.key === 'Escape') {
        if (fullscreenScrap) {
          setFullscreenScrap(null);
          window.history.pushState(null, '', window.location.pathname);
        } else if (showNewScrapModal) {
          setShowNewScrapModal(false);
          setNewScrapForm({ content: '', x: 0, y: 0 });
          setNewScrapError('');
          window.history.pushState(null, '', window.location.pathname);
        } else if (showEditScrapModal) {
          setShowEditScrapModal(false);
          setEditingScrap(null);
          setEditScrapForm({ content: '', x: 0, y: 0, visible: true });
        setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
          setEditScrapError('');
          window.history.pushState(null, '', window.location.pathname);
        }
      }
      
      // Handle Command+Enter to submit forms
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (showNewScrapModal) {
          // Trigger new scrap form submission
          const formEvent = new Event('submit', { bubbles: true, cancelable: true });
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(formEvent);
          }
        } else if (showEditScrapModal) {
          // Trigger edit scrap form submission
          const formEvent = new Event('submit', { bubbles: true, cancelable: true });
          const form = document.querySelector('form');
          if (form) {
            form.dispatchEvent(formEvent);
          }
        }
        // No action for fullscreen modal (view-only)
      }
    };

    // Only add listener if a modal is open
    if (fullscreenScrap || showNewScrapModal || showEditScrapModal) {
      window.addEventListener('keydown', handleModalKeyboard);
    }

    return () => {
      window.removeEventListener('keydown', handleModalKeyboard);
    };
  }, [fullscreenScrap, showNewScrapModal, showEditScrapModal]);

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

  const calculateCanvasSize = () => {
    if (scraps.length === 0) return;

    // Calculate bounds of all scraps including their size
    const scrapWidth = 300; // max-w-sm is roughly 300px
    const scrapHeight = 200; // estimated height
    const padding = 100; // padding around edges

    const bounds = scraps.reduce(
      (acc, scrap) => ({
        minX: Math.min(acc.minX, scrap.x),
        maxX: Math.max(acc.maxX, scrap.x + scrapWidth),
        minY: Math.min(acc.minY, scrap.y),
        maxY: Math.max(acc.maxY, scrap.y + scrapHeight),
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
    );

    // Include origin (0,0) in bounds
    bounds.minX = Math.min(bounds.minX, 0);
    bounds.minY = Math.min(bounds.minY, 0);
    bounds.maxX = Math.max(bounds.maxX, 0);
    bounds.maxY = Math.max(bounds.maxY, 0);

    // Set canvas size to exactly fit content with padding
    const canvasWidth = bounds.maxX - bounds.minX + (2 * padding);
    const canvasHeight = bounds.maxY - bounds.minY + (2 * padding);
    
    setCanvasSize({ width: canvasWidth, height: canvasHeight });
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
  
  const checkAdminAccess = async () => {
    if (!session?.user?.id) {
      setHasAdminAccess(false);
      return;
    }

    try {
      const response = await fetch('/api/permissions/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session.user.id,
          resource: 'admin',
          action: 'access'
        }),
      });

      if (response.ok) {
        const { hasPermission } = await response.json();
        setHasAdminAccess(hasPermission);
      } else {
        setHasAdminAccess(false);
      }
    } catch (err) {
      console.error('Error checking admin permissions:', err);
      setHasAdminAccess(false);
    }
  };

  const fetchScraps = async () => {
    try {
      if (session?.user?.id) {
        // If authenticated, get all scraps (visible + user's own invisible)
        const response = await fetch('/api/scraps');
        if (response.ok) {
          const data = await response.json();
          // Filter: visible scraps + user's own invisible scraps
          const filteredScraps = data.scraps.filter((scrap: Scrap) => 
            scrap.visible || scrap.userId === session.user.id
          );
          setScraps(filteredScraps);
        } else {
          setScraps([]);
        }
      } else {
        // If not authenticated, only get public visible scraps
        const response = await fetch('/api/scraps/public');
        if (response.ok) {
          const data = await response.json();
          setScraps(data.scraps);
        } else {
          setScraps([]);
        }
      }
    } catch (err) {
      console.error('Error fetching scraps:', err);
      setError('An error occurred while fetching scraps');
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

  const [newScrapForm, setNewScrapForm] = useState({
    content: '',
    x: 0,
    y: 0,
  });
  const [newScrapLoading, setNewScrapLoading] = useState(false);
  const [newScrapError, setNewScrapError] = useState('');

  const handleNewScrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNewScrapLoading(true);
    setNewScrapError('');

    try {
      const response = await fetch('/api/scraps', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newScrapForm.content,
          x: newScrapForm.x,
          y: newScrapForm.y,
        }),
      });

      if (response.ok) {
        setShowNewScrapModal(false);
        setNewScrapForm({ content: '', x: 0, y: 0 });
        window.history.pushState(null, '', window.location.pathname);
        fetchScraps(); // Refresh the scraps
      } else {
        const data = await response.json();
        setNewScrapError(data.error || 'Failed to create scrap');
      }
    } catch (err) {
      setNewScrapError('An error occurred while creating the scrap');
    } finally {
      setNewScrapLoading(false);
    }
  };

  const handleNewScrapInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewScrapForm(prev => ({ 
      ...prev, 
      [name]: name === 'x' || name === 'y' ? parseInt(value) || 0 : value 
    }));
  };

  const [editScrapForm, setEditScrapForm] = useState({
    content: '',
    x: 0,
    y: 0,
    visible: true,
  });
  const [editScrapLoading, setEditScrapLoading] = useState(false);
  const [editScrapError, setEditScrapError] = useState('');
  const [originalEditScrapForm, setOriginalEditScrapForm] = useState({
    content: '',
    x: 0,
    y: 0,
    visible: true,
  });

  const handleEditScrapClick = (scrap: Scrap) => {
    setEditingScrap(scrap);
    const formData = {
      content: scrap.content,
      x: scrap.x,
      y: scrap.y,
      visible: scrap.visible,
    };
    setEditScrapForm(formData);
    setOriginalEditScrapForm(formData);
    setShowEditScrapModal(true);
  };

  const handleEditScrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingScrap) return;
    
    setEditScrapLoading(true);
    setEditScrapError('');

    try {
      const response = await fetch(`/api/scraps/${editingScrap.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editScrapForm.content,
          x: editScrapForm.x,
          y: editScrapForm.y,
          visible: editScrapForm.visible,
        }),
      });

      if (response.ok) {
        setShowEditScrapModal(false);
        setEditingScrap(null);
        setEditScrapForm({ content: '', x: 0, y: 0, visible: true });
        setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
        window.history.pushState(null, '', window.location.pathname);
        fetchScraps(); // Refresh the scraps
      } else {
        const data = await response.json();
        setEditScrapError(data.error || 'Failed to update scrap');
      }
    } catch (err) {
      setEditScrapError('An error occurred while updating the scrap');
    } finally {
      setEditScrapLoading(false);
    }
  };

  const handleEditScrapInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditScrapForm(prev => ({ 
      ...prev, 
      [name]: name === 'x' || name === 'y' ? parseInt(value) || 0 : value 
    }));
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
  const getScrapPosition = (scrap: Scrap) => {
    if (scraps.length === 0) return { x: scrap.x, y: scrap.y };
    
    // Calculate the minimum bounds to offset negative coordinates
    const minX = Math.min(0, ...scraps.map(s => s.x));
    const minY = Math.min(0, ...scraps.map(s => s.y));
    
    const padding = 100;
    
    return { 
      x: scrap.x - minX + padding, 
      y: scrap.y - minY + padding 
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading scraps index...</div>
      </div>
    );
  }

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isMoveMode && movingScrap) {
      // Move the scrap to the clicked position
      const clickX = e.pageX;
      const clickY = e.pageY;
      
      // Convert to canvas coordinates (accounting for padding and negative offset)
      const minX = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.x)) : 0;
      const minY = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.y)) : 0;
      const padding = 100;
      
      const canvasX = clickX + minX - padding;
      const canvasY = clickY + minY - padding;
      
      // Update the scrap position
      updateScrapPosition(movingScrap.id, Math.max(0, Math.round(canvasX)), Math.max(0, Math.round(canvasY)));
      setIsMoveMode(false);
      setMovingScrap(null);
    } else if (isShiftPressed && session && !isHoveringScrap && !isMoveMode) {
      // Calculate click position relative to the canvas
      const clickX = e.pageX;
      const clickY = e.pageY;
      
      // Convert to canvas coordinates (accounting for padding and negative offset)
      const minX = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.x)) : 0;
      const minY = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.y)) : 0;
      const padding = 100;
      
      const canvasX = clickX + minX - padding;
      const canvasY = clickY + minY - padding;
      
      setNewScrapForm({ 
        content: '', 
        x: Math.max(0, Math.round(canvasX)), 
        y: Math.max(0, Math.round(canvasY))
      });
      setShowNewScrapModal(true);
      setIsShiftPressed(false); // Reset shift state when modal opens
    }
  };

  const updateScrapPosition = async (scrapId: string, x: number, y: number) => {
    if (!movingScrap) return;
    
    try {
      const response = await fetch(`/api/scraps/${scrapId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: movingScrap.content,
          x: x,
          y: y,
        }),
      });

      if (response.ok) {
        fetchScraps(); // Refresh the scraps
      } else {
        console.error('Failed to update scrap position');
      }
    } catch (err) {
      console.error('Error updating scrap position:', err);
    }
  };

  const updateScrapVisibility = async (scrapId: string, visible: boolean) => {
    try {
      const response = await fetch(`/api/scraps/${scrapId}/visibility`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visible: visible,
        }),
      });

      if (response.ok) {
        fetchScraps(); // Refresh the scraps
      } else {
        console.error('Failed to update scrap visibility');
      }
    } catch (err) {
      console.error('Error updating scrap visibility:', err);
    }
  };

  const hasFormChanged = () => {
    return (
      editScrapForm.content !== originalEditScrapForm.content ||
      editScrapForm.x !== originalEditScrapForm.x ||
      editScrapForm.y !== originalEditScrapForm.y
    );
  };

  const handleVisibilityToggle = async () => {
    if (!editingScrap) return;
    
    const newVisibility = !editingScrap.visible;
    
    // Update visibility immediately
    await updateScrapVisibility(editingScrap.id, newVisibility);
    
    // Update the editingScrap state with the new visibility
    setEditingScrap(prev => prev ? { ...prev, visible: newVisibility } : null);
    
    // Update form state
    setEditScrapForm(prev => ({ ...prev, visible: newVisibility }));
    setOriginalEditScrapForm(prev => ({ ...prev, visible: newVisibility }));
    
    // If no other changes, close the modal
    if (!hasFormChanged()) {
      setShowEditScrapModal(false);
      setEditingScrap(null);
      setEditScrapForm({ content: '', x: 0, y: 0, visible: true });
      setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
      setEditScrapError('');
      window.history.pushState(null, '', window.location.pathname);
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
        {/* Centered + button - fixed to viewport, not canvas */}
        {session && !isShiftPressed && !isMoveMode && (
          <button
            onClick={() => {
              // Calculate button's center position relative to the canvas
              const buttonCenterX = window.scrollX + window.innerWidth / 2;
              const buttonCenterY = window.scrollY + window.innerHeight / 2;
              
              // Convert to canvas coordinates (accounting for padding and negative offset)
              const minX = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.x)) : 0;
              const minY = scraps.length > 0 ? Math.min(0, ...scraps.map(s => s.y)) : 0;
              const padding = 100;
              
              const canvasX = buttonCenterX + minX - padding;
              const canvasY = buttonCenterY + minY - padding;
              
              setNewScrapForm({ 
                content: '', 
                x: Math.max(0, Math.round(canvasX)), 
                y: Math.max(0, Math.round(canvasY))
              });
              setShowNewScrapModal(true);
            }}
            className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center w-16 h-16 rounded-full ${config.theme.primary.bg} ${config.theme.primary.hover} text-white shadow-lg transition-all hover:scale-110 cursor-pointer`}
            title="Create new scrap (or hold Shift and click anywhere)"
            style={{ zIndex: 1000 }}
          >
            <PlusIcon className="h-8 w-8" />
          </button>
        )}

        {/* Fixed settings and sign out icons bottom right */}
        <div className="fixed bottom-6 right-6 flex space-x-2" style={{ zIndex: 999 }}>
          {session ? (
            <>
              <Link
                href="/studio"
                className="inline-flex items-center justify-center w-12 h-12 border border-gray-300 rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                title="Settings & Studio"
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
        {!loading && scraps.length === 0 && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center" style={{ zIndex: 997 }}>
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-4">
                {session ? 'No scraps on the corkboard yet.' : 'No scraps to display.'}
              </div>
              {!session && (
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  Sign In to Get Started
                </Link>
              )}
            </div>
          </div>
        )}

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
                const newScrap = fullscreenScrap?.id === scrap.id ? null : scrap;
                setFullscreenScrap(newScrap);
                // Update URL hash
                if (newScrap) {
                  window.history.pushState(null, '', `#${newScrap.code}`);
                } else {
                  window.history.pushState(null, '', window.location.pathname);
                }
              }}
            >
              {/* Header with code and action buttons */}
              <div className="flex justify-between items-center mb-3">
                <a 
                  href={`#${scrap.code}`}
                  className={`text-sm font-mono font-bold ${config.theme.primary.text} hover:text-indigo-800`}
                  title={`Anchor to ${scrap.code}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  #{scrap.code}
                </a>
                <div className="flex space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!scrap.visible && session?.user?.id === scrap.userId) {
                        // If it's an invisible scrap, toggle visibility directly
                        updateScrapVisibility(scrap.id, true);
                      } else {
                        // Otherwise open fullscreen modal
                        setFullscreenScrap(scrap);
                        // Update URL hash
                        window.history.pushState(null, '', `#${scrap.code}`);
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
                        window.history.pushState(null, '', `#${scrap.code}`);
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
                  className="text-sm text-gray-800 line-clamp-6 froala-content" 
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
      {fullscreenScrap && (
        <div 
          className="fixed inset-0 flex items-center justify-center" 
          style={{ 
            zIndex: 1001,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => {
            setFullscreenScrap(null);
            window.history.pushState(null, '', window.location.pathname);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6">
              <a 
                href={`#${fullscreenScrap.code}`}
                className={`text-lg font-mono font-bold ${config.theme.primary.text} hover:text-indigo-800`}
                title={`Anchor to ${fullscreenScrap.code}`}
              >
                #{fullscreenScrap.code}
              </a>
              <div className="flex space-x-2">
                {session?.user?.id === fullscreenScrap.userId && (
                  <>
                    <button
                      onClick={async () => {
                        // Toggle visibility of the scrap directly
                        const newVisibility = !fullscreenScrap.visible;
                        await updateScrapVisibility(fullscreenScrap.id, newVisibility);
                        
                        // Close the modal and clear URL hash
                        setFullscreenScrap(null);
                        window.history.pushState(null, '', window.location.pathname);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      title={fullscreenScrap.visible ? "Make private" : "Make visible"}
                    >
                      {fullscreenScrap.visible ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                    </button>
                    <button
                      onClick={() => {
                        setMovingScrap(fullscreenScrap);
                        setIsMoveMode(true);
                        setFullscreenScrap(null);
                        // Clear URL hash when entering move mode
                        window.history.pushState(null, '', window.location.pathname);
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      title="Move this scrap"
                    >
                      <MapPinIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => {
                        handleEditScrapClick(fullscreenScrap);
                        setFullscreenScrap(null); // Close fullscreen modal
                      }}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                      title="Edit this scrap"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => {
                    setFullscreenScrap(null);
                    window.history.pushState(null, '', window.location.pathname);
                  }}
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
                dangerouslySetInnerHTML={{ __html: fullscreenScrap.content }}
              />
            </div>

            {/* Footer */}
            <div className="text-sm text-gray-500 border-t border-gray-200 pt-4 flex justify-between items-center">
              <div>
                {fullscreenScrap.userName || fullscreenScrap.userEmail}
              </div>
              <div>
                {new Date(fullscreenScrap.createdAt).toLocaleDateString()}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* New Scrap Modal */}
      {showNewScrapModal && (
        <div 
          className="fixed inset-0 flex items-center justify-center" 
          style={{ 
            zIndex: 1001,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => {
            setShowNewScrapModal(false);
            setNewScrapForm({ content: '', x: 0, y: 0 });
            setNewScrapError('');
            window.history.pushState(null, '', window.location.pathname);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                  Create New Scrap
                </h2>
                <button
                  onClick={() => {
                    setShowNewScrapModal(false);
                    setNewScrapForm({ content: '', x: 0, y: 0 });
                    setNewScrapError('');
                    window.history.pushState(null, '', window.location.pathname);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                  title="Close"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* Content Form */}
              <form onSubmit={handleNewScrapSubmit} className="space-y-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Content
                  </label>
                  <div>
                    <FroalaEditor
                      content={newScrapForm.content}
                      onChange={(content) => setNewScrapForm(prev => ({ ...prev, content }))}
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
                        value={newScrapForm.x}
                        onChange={handleNewScrapInputChange}
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
                        value={newScrapForm.y}
                        onChange={handleNewScrapInputChange}
                        min={0}
                        max={999999}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  {newScrapError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
                      <div className="text-red-800 text-sm">{newScrapError}</div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewScrapModal(false);
                        setNewScrapForm({ content: '', x: 0, y: 0 });
                        setNewScrapError('');
                        window.history.pushState(null, '', window.location.pathname);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={newScrapLoading || !newScrapForm.content || newScrapForm.content.trim() === '' || newScrapForm.content === '<p><br></p>'}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${config.theme.primary.bg} ${config.theme.primary.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {newScrapLoading ? 'Creating...' : 'Create Scrap'}
                    </button>
                  </div>
              </form>
          </div>
        </div>
      )}

      {/* Edit Scrap Modal */}
      {showEditScrapModal && editingScrap && (
        <div 
          className="fixed inset-0 flex items-center justify-center" 
          style={{ 
            zIndex: 1001,
            backgroundColor: 'rgba(0, 0, 0, 0.2)'
          }}
          onClick={() => {
            setShowEditScrapModal(false);
            setEditingScrap(null);
            setEditScrapForm({ content: '', x: 0, y: 0, visible: true });
        setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
            setEditScrapError('');
            window.history.pushState(null, '', window.location.pathname);
          }}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] w-full mx-4 p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-200 mb-6 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-900">
                  Edit Scrap #{editingScrap.code}
                </h2>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={handleVisibilityToggle}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                    title={editingScrap?.visible ? "Make private" : "Make visible"}
                  >
                    {editingScrap?.visible ? <EyeIcon className="h-5 w-5" /> : <EyeSlashIcon className="h-5 w-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingScrap) {
                        setMovingScrap(editingScrap);
                        setIsMoveMode(true);
                        setShowEditScrapModal(false);
                        setEditingScrap(null);
                        setEditScrapForm({ content: '', x: 0, y: 0, visible: true });
                        setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
                        setEditScrapError('');
                        // Clear URL hash when entering move mode
                        window.history.pushState(null, '', window.location.pathname);
                      }
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                    title="Move this scrap"
                  >
                    <MapPinIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setShowEditScrapModal(false);
                      setEditingScrap(null);
                      setEditScrapForm({ content: '', x: 0, y: 0, visible: true });
        setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
                      setEditScrapError('');
                      window.history.pushState(null, '', window.location.pathname);
                    }}
                    className="text-gray-500 hover:text-gray-700 p-2 rounded hover:bg-gray-100 cursor-pointer"
                    title="Close"
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content Form */}
              <form onSubmit={handleEditScrapSubmit} className="space-y-6">
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-900 mb-2">
                      Content
                    </label>
                    <div>
                      <FroalaEditor
                        content={editScrapForm.content}
                        onChange={(content) => setEditScrapForm(prev => ({ ...prev, content }))}
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
                        value={editScrapForm.x}
                        onChange={handleEditScrapInputChange}
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
                        value={editScrapForm.y}
                        onChange={handleEditScrapInputChange}
                        min={0}
                        max={999999}
                        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm px-3 py-2 border"
                      />
                    </div>
                  </div>

                  {editScrapError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md flex-shrink-0">
                      <div className="text-red-800 text-sm">{editScrapError}</div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditScrapModal(false);
                        setEditingScrap(null);
                        setEditScrapForm({ content: '', x: 0, y: 0, visible: true });
        setOriginalEditScrapForm({ content: '', x: 0, y: 0, visible: true });
                        setEditScrapError('');
                        window.history.pushState(null, '', window.location.pathname);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={editScrapLoading || !editScrapForm.content || editScrapForm.content.trim() === '' || editScrapForm.content === '<p><br></p>'}
                      className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${config.theme.primary.bg} ${config.theme.primary.hover} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {editScrapLoading ? 'Updating...' : 'Update Scrap'}
                    </button>
                  </div>
              </form>
          </div>
        </div>
      )}
    </>
  );
}
