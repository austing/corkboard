import { useState, useEffect, useCallback } from 'react';
import type { UseModalOptions } from '../types';

interface UseModalReturn<T> {
  isOpen: boolean;
  data: T | null;
  open: (newData?: T) => void;
  close: () => void;
  setData: (data: T | null) => void;
}

export function useModal<T = boolean>(
  initialState: T | null = null,
  options: UseModalOptions = {}
): UseModalReturn<T> {
  const {
    onClose,
    preventBodyScroll = true,
    updateUrlHash = null,
    escapeToClose = true
  } = options;

  const [isOpen, setIsOpen] = useState(!!initialState);
  const [data, setData] = useState<T | null>(initialState);

  const open = useCallback((newData?: T) => {
    setIsOpen(true);
    if (newData !== undefined) {
      setData(newData);
    }
    if (updateUrlHash) {
      window.history.pushState(null, '', `#${updateUrlHash}`);
    }
  }, [updateUrlHash]);

  const close = useCallback(() => {
    setIsOpen(false);
    setData(null);
    if (updateUrlHash !== null) {
      window.history.pushState(null, '', window.location.pathname);
    }
    onClose?.();
  }, [onClose, updateUrlHash]);

  // Handle body scroll
  useEffect(() => {
    if (preventBodyScroll && isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, preventBodyScroll]);

  // Handle escape key
  useEffect(() => {
    if (!escapeToClose || !isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        close();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, escapeToClose, close]);

  return { 
    isOpen, 
    data, 
    open, 
    close, 
    setData 
  } as UseModalReturn<T>;
}