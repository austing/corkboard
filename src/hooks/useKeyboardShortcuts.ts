import { useEffect, useRef } from 'react';
import type React from 'react';
import type { ShortcutConfig } from '../types';

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  deps: React.DependencyList = []
): void {
  const handlersRef = useRef(shortcuts);
  handlersRef.current = shortcuts;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      for (const shortcut of handlersRef.current) {
        if (shortcut.enabled === false) continue;

        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : true;
        const matchesMeta = shortcut.meta ? e.metaKey : true;
        const matchesShift = shortcut.shift ? e.shiftKey : true;
        const matchesAlt = shortcut.alt ? e.altKey : true;

        if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
          if (shortcut.preventDefault !== false) {
            e.preventDefault();
          }
          shortcut.handler();
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, deps);
}