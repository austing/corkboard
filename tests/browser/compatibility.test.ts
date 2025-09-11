/**
 * Browser Compatibility Tests
 * Tests for browser-specific features, fallbacks, and compatibility
 */

describe('Browser Compatibility', () => {
  let originalCrypto: any;
  let originalLocalStorage: any;
  let originalNavigator: any;

  beforeEach(() => {
    // Store original implementations
    originalCrypto = global.crypto;
    originalLocalStorage = global.localStorage;
    originalNavigator = global.navigator;
  });

  afterEach(() => {
    // Restore original implementations
    if (originalCrypto) {
      Object.defineProperty(global, 'crypto', {
        value: originalCrypto,
        writable: true,
        configurable: true
      });
    }
    if (originalLocalStorage) {
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
        configurable: true
      });
    }
    if (originalNavigator) {
      Object.defineProperty(global, 'navigator', {
        value: originalNavigator,
        writable: true,
        configurable: true
      });
    }
  });

  describe('Crypto API Fallbacks', () => {
    it('should handle missing crypto.randomUUID fallback', () => {
      // Remove crypto.randomUUID
      Object.defineProperty(global, 'crypto', {
        value: {
          ...originalCrypto,
          randomUUID: undefined
        },
        writable: true,
        configurable: true
      });

      const generateId = () => {
        if (crypto?.randomUUID) {
          return crypto.randomUUID();
        }
        
        // Fallback implementation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });

    it('should work without crypto object entirely', () => {
      // Remove crypto entirely
      Object.defineProperty(global, 'crypto', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
          return crypto.randomUUID();
        }
        
        // Math.random fallback
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
      };

      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(10);
    });
  });

  describe('Local Storage Compatibility', () => {
    it('should work without localStorage', () => {
      // Remove localStorage
      Object.defineProperty(global, 'localStorage', {
        value: undefined,
        writable: true,
        configurable: true
      });

      const createStorage = () => {
        const isLocalStorageAvailable = () => {
          try {
            return typeof localStorage !== 'undefined';
          } catch {
            return false;
          }
        };

        return {
          getItem: (key: string) => {
            if (isLocalStorageAvailable()) {
              return localStorage.getItem(key);
            }
            return null;
          },
          setItem: (key: string, value: string) => {
            if (isLocalStorageAvailable()) {
              localStorage.setItem(key, value);
            }
            // Silently fail if not available
          },
          removeItem: (key: string) => {
            if (isLocalStorageAvailable()) {
              localStorage.removeItem(key);
            }
          }
        };
      };

      const storage = createStorage();
      
      // Should not throw errors
      expect(() => {
        storage.setItem('test', 'value');
        const value = storage.getItem('test');
        storage.removeItem('test');
      }).not.toThrow();
    });

    it('should handle localStorage quota exceeded', () => {
      // Mock localStorage that throws on setItem
      global.localStorage = {
        getItem: jest.fn(),
        setItem: jest.fn(() => {
          throw new Error('QuotaExceededError');
        }),
        removeItem: jest.fn(),
        clear: jest.fn(),
        length: 0,
        key: jest.fn()
      } as any;

      const safeSetItem = (key: string, value: string) => {
        try {
          localStorage.setItem(key, value);
          return true;
        } catch (error) {
          console.warn('localStorage quota exceeded or not available');
          return false;
        }
      };

      const result = safeSetItem('test', 'value');
      expect(result).toBe(false);
    });
  });

  describe('Viewport and Device Compatibility', () => {
    it('should handle different viewport sizes', () => {
      const getResponsiveConfig = (width: number, height: number) => {
        // Simulate different screen sizes
        Object.defineProperty(window, 'innerWidth', {
          writable: true,
          configurable: true,
          value: width,
        });
        
        Object.defineProperty(window, 'innerHeight', {
          writable: true,
          configurable: true,
          value: height,
        });

        if (width < 640) {
          return { layout: 'mobile', columns: 1 };
        } else if (width < 1024) {
          return { layout: 'tablet', columns: 2 };
        } else {
          return { layout: 'desktop', columns: 4 };
        }
      };

      expect(getResponsiveConfig(320, 568)).toEqual({ layout: 'mobile', columns: 1 });
      expect(getResponsiveConfig(768, 1024)).toEqual({ layout: 'tablet', columns: 2 });
      expect(getResponsiveConfig(1920, 1080)).toEqual({ layout: 'desktop', columns: 4 });
    });

    it('should detect touch devices', () => {
      const isTouchDevice = () => {
        return 'ontouchstart' in window || 
               navigator.maxTouchPoints > 0 ||
               (navigator as any).msMaxTouchPoints > 0;
      };

      // Mock touch support
      Object.defineProperty(window, 'ontouchstart', {
        writable: true,
        configurable: true,
        value: () => {}
      });

      expect(isTouchDevice()).toBe(true);

      // Remove touch support
      delete (window as any).ontouchstart;
      Object.defineProperty(navigator, 'maxTouchPoints', {
        writable: true,
        configurable: true,
        value: 0
      });

      expect(isTouchDevice()).toBe(false);
    });
  });

  describe('User Agent and Feature Detection', () => {
    it('should detect browser capabilities', () => {
      const getBrowserFeatures = () => {
        return {
          hasWebGL: !!window.WebGLRenderingContext,
          hasCanvas: !!document.createElement('canvas').getContext,
          hasLocalStorage: (() => {
            try {
              return typeof localStorage !== 'undefined';
            } catch {
              return false;
            }
          })(),
          hasGeolocation: !!navigator.geolocation,
          hasNotifications: 'Notification' in window,
          hasServiceWorker: 'serviceWorker' in navigator,
          hasWebAssembly: typeof WebAssembly === 'object'
        };
      };

      const features = getBrowserFeatures();
      expect(typeof features.hasWebGL).toBe('boolean');
      expect(typeof features.hasCanvas).toBe('boolean');
      expect(typeof features.hasLocalStorage).toBe('boolean');
    });

    it('should handle missing global objects gracefully', () => {
      // Remove navigator
      delete (global as any).navigator;

      const safeNavigatorCheck = () => {
        try {
          return navigator?.userAgent || 'unknown';
        } catch {
          return 'unknown';
        }
      };

      expect(safeNavigatorCheck()).toBe('unknown');
    });
  });

  describe('Event Handling Compatibility', () => {
    it('should handle different event types', () => {
      const createEventHandler = () => {
        const events = new Map();

        return {
          addEventListener: (element: any, event: string, handler: Function, options?: any) => {
            // Handle both modern and legacy event listener options
            const useCapture = typeof options === 'boolean' ? options : options?.capture || false;
            
            if (!events.has(element)) {
              events.set(element, new Map());
            }
            
            const elementEvents = events.get(element);
            if (!elementEvents.has(event)) {
              elementEvents.set(event, []);
            }
            
            elementEvents.get(event).push({ handler, useCapture });
          },
          
          removeEventListener: (element: any, event: string, handler: Function) => {
            const elementEvents = events.get(element);
            if (elementEvents?.has(event)) {
              const handlers = elementEvents.get(event);
              const index = handlers.findIndex((h: any) => h.handler === handler);
              if (index > -1) {
                handlers.splice(index, 1);
              }
            }
          },

          getListenerCount: (element: any, event: string) => {
            return events.get(element)?.get(event)?.length || 0;
          }
        };
      };

      const eventHandler = createEventHandler();
      const mockElement = {};
      const handler1 = () => {};
      const handler2 = () => {};

      eventHandler.addEventListener(mockElement, 'click', handler1);
      eventHandler.addEventListener(mockElement, 'click', handler2, { passive: true });
      
      expect(eventHandler.getListenerCount(mockElement, 'click')).toBe(2);

      eventHandler.removeEventListener(mockElement, 'click', handler1);
      expect(eventHandler.getListenerCount(mockElement, 'click')).toBe(1);
    });
  });

  describe('CSS and Styling Compatibility', () => {
    it('should handle CSS custom properties fallbacks', () => {
      const getCSSValue = (property: string, fallback: string) => {
        // Simulate CSS custom property support detection
        const supportsCustomProperties = CSS?.supports?.('color', 'var(--test)') || false;
        
        if (supportsCustomProperties) {
          return `var(${property}, ${fallback})`;
        } else {
          return fallback;
        }
      };

      // Mock CSS.supports
      Object.defineProperty(global, 'CSS', {
        value: {
          supports: (property: string, value: string) => {
            return value.includes('var(');
          }
        },
        writable: true,
        configurable: true
      });

      expect(getCSSValue('--primary-color', '#007bff')).toBe('var(--primary-color, #007bff)');

      // Remove CSS.supports
      Object.defineProperty(global, 'CSS', {
        value: undefined,
        writable: true,
        configurable: true
      });
      expect(getCSSValue('--primary-color', '#007bff')).toBe('#007bff');
    });

    it('should detect reduced motion preferences', () => {
      const prefersReducedMotion = () => {
        // Mock matchMedia
        const mockMatchMedia = (query: string) => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        });

        Object.defineProperty(window, 'matchMedia', {
          writable: true,
          value: jest.fn().mockImplementation(mockMatchMedia),
        });

        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      };

      const reducedMotion = prefersReducedMotion();
      expect(typeof reducedMotion).toBe('boolean');
    });
  });

  describe('Network and Connectivity', () => {
    it('should handle offline/online states', () => {
      const createNetworkMonitor = () => {
        let isOnline = navigator?.onLine ?? true;
        const listeners: Array<(online: boolean) => void> = [];

        return {
          isOnline: () => isOnline,
          onStatusChange: (callback: (online: boolean) => void) => {
            listeners.push(callback);
          },
          simulateOffline: () => {
            isOnline = false;
            listeners.forEach(listener => listener(false));
          },
          simulateOnline: () => {
            isOnline = true;
            listeners.forEach(listener => listener(true));
          }
        };
      };

      const monitor = createNetworkMonitor();
      let status: boolean | undefined;
      
      monitor.onStatusChange((online) => {
        status = online;
      });

      monitor.simulateOffline();
      expect(status).toBe(false);
      expect(monitor.isOnline()).toBe(false);

      monitor.simulateOnline();
      expect(status).toBe(true);
      expect(monitor.isOnline()).toBe(true);
    });
  });
});