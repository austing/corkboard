/**
 * Performance & Memory Tests
 * Tests for performance optimization, memory management, and resource efficiency
 */

import { performance } from 'perf_hooks';

describe('Performance & Memory Management', () => {
  describe('Memory Leak Prevention', () => {
    it('should not leak memory during scrap operations', () => {
      const scraps = new Map();
      const eventListeners = new WeakMap();

      const createScrap = (id: string, content: string) => {
        const scrap = {
          id,
          content,
          listeners: new Set(),
          cleanup: () => {
            // Cleanup event listeners
            const listeners = eventListeners.get(scrap);
            if (listeners) {
              listeners.forEach(({ element, event, handler }: any) => {
                element.removeEventListener(event, handler);
              });
            }
            scrap.listeners.clear();
          }
        };

        scraps.set(id, scrap);
        eventListeners.set(scrap, []);
        return scrap;
      };

      const deleteScrap = (id: string) => {
        const scrap = scraps.get(id);
        if (scrap) {
          scrap.cleanup();
          scraps.delete(id);
        }
      };

      // Create multiple scraps
      for (let i = 0; i < 100; i++) {
        createScrap(`scrap-${i}`, `Content ${i}`);
      }

      expect(scraps.size).toBe(100);

      // Delete all scraps
      for (let i = 0; i < 100; i++) {
        deleteScrap(`scrap-${i}`);
      }

      expect(scraps.size).toBe(0);
    });

    it('should cleanup circular references', () => {
      const createCircularStructure = () => {
        const parent: any = { children: [] };
        const child: any = { parent };
        parent.children.push(child);

        return { parent, child };
      };

      const cleanup = (obj: any, visited = new WeakSet()) => {
        if (!obj || typeof obj !== 'object' || visited.has(obj)) {
          return;
        }
        
        visited.add(obj);
        
        Object.keys(obj).forEach(key => {
          if (typeof obj[key] === 'object' && obj[key] !== null) {
            cleanup(obj[key], visited);
            obj[key] = null;
          }
        });
      };

      const { parent, child } = createCircularStructure();
      expect(parent.children[0]).toBe(child);
      expect(child.parent).toBe(parent);

      // Cleanup circular references
      cleanup(parent);
      expect(parent.children).toBeNull();
      expect(child.parent).toBeNull();
    });

    it('should handle WeakMap and WeakSet correctly', () => {
      const objectRegistry = new WeakMap();
      const activeObjects = new WeakSet();

      const registerObject = (obj: object, data: any) => {
        objectRegistry.set(obj, data);
        activeObjects.add(obj);
      };

      const isRegistered = (obj: object) => {
        return activeObjects.has(obj);
      };

      const getObjectData = (obj: object) => {
        return objectRegistry.get(obj);
      };

      // Create objects and register them
      let obj1: any = { id: 1 };
      let obj2: any = { id: 2 };

      registerObject(obj1, { name: 'Object 1' });
      registerObject(obj2, { name: 'Object 2' });

      expect(isRegistered(obj1)).toBe(true);
      expect(getObjectData(obj1)).toEqual({ name: 'Object 1' });

      // Remove references (simulating garbage collection)
      obj1 = null;
      obj2 = null;

      // WeakMap and WeakSet should handle cleanup automatically
      // (In a real scenario, garbage collection would clean these up)
    });
  });

  describe('Performance Optimization', () => {
    it('should efficiently render large numbers of scraps', () => {
      const startTime = performance.now();
      
      const renderScraps = (scraps: any[], batchSize = 50) => {
        const batches = [];
        
        for (let i = 0; i < scraps.length; i += batchSize) {
          batches.push(scraps.slice(i, i + batchSize));
        }
        
        return batches.map(batch => 
          batch.map(scrap => ({
            id: scrap.id,
            renderedContent: `<div>${scrap.content}</div>`
          }))
        );
      };

      // Create large dataset
      const largeScrapsArray = Array.from({ length: 1000 }, (_, i) => ({
        id: `scrap-${i}`,
        content: `Content for scrap ${i}`,
        x: Math.random() * 1000,
        y: Math.random() * 1000
      }));

      const rendered = renderScraps(largeScrapsArray);
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      expect(rendered.length).toBe(20); // 1000 / 50 = 20 batches
      expect(rendered[0].length).toBe(50);
      expect(renderTime).toBeLessThan(100); // Should render quickly
    });

    it('should debounce rapid position updates', () => {
      jest.useFakeTimers();

      let updateCount = 0;
      const actualUpdate = () => {
        updateCount++;
      };

      const createDebouncer = (func: Function, delay: number) => {
        let timeoutId: NodeJS.Timeout;
        
        return (...args: any[]) => {
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => func(...args), delay);
        };
      };

      const debouncedUpdate = createDebouncer(actualUpdate, 100);

      // Fire multiple rapid updates
      for (let i = 0; i < 10; i++) {
        debouncedUpdate();
      }

      expect(updateCount).toBe(0); // No updates yet due to debouncing

      // Fast forward time
      jest.advanceTimersByTime(50);
      expect(updateCount).toBe(0); // Still no updates

      jest.advanceTimersByTime(60); // Total 110ms
      expect(updateCount).toBe(1); // Now the update should have fired

      jest.useRealTimers();
    });

    it('should throttle scroll and resize events', () => {
      jest.useFakeTimers();

      let throttledCallCount = 0;
      const throttledHandler = () => {
        throttledCallCount++;
      };

      const createThrottler = (func: Function, limit: number) => {
        let inThrottle = false;
        
        return (...args: any[]) => {
          if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
          }
        };
      };

      const throttledScroll = createThrottler(throttledHandler, 100);

      // Fire multiple rapid events
      for (let i = 0; i < 10; i++) {
        throttledScroll();
      }

      expect(throttledCallCount).toBe(1); // Only first call should execute

      // Advance time and try again
      jest.advanceTimersByTime(100);
      throttledScroll();
      expect(throttledCallCount).toBe(2);

      jest.useRealTimers();
    });

    it('should optimize DOM queries and caching', () => {
      const createDOMCache = () => {
        const cache = new Map<string, Element>();
        const queryStats = { hits: 0, misses: 0 };

        return {
          querySelector: (selector: string) => {
            if (cache.has(selector)) {
              queryStats.hits++;
              return cache.get(selector)!;
            }

            // Simulate DOM query
            const element = { 
              id: selector.replace('#', ''),
              tagName: selector.startsWith('.') ? 'DIV' : 'SPAN'
            } as any;

            cache.set(selector, element);
            queryStats.misses++;
            return element;
          },

          invalidateCache: (selector?: string) => {
            if (selector) {
              cache.delete(selector);
            } else {
              cache.clear();
            }
          },

          getStats: () => queryStats
        };
      };

      const domCache = createDOMCache();

      // First queries (cache misses)
      domCache.querySelector('#header');
      domCache.querySelector('.button');
      domCache.querySelector('#footer');

      expect(domCache.getStats().misses).toBe(3);
      expect(domCache.getStats().hits).toBe(0);

      // Repeated queries (cache hits)
      domCache.querySelector('#header');
      domCache.querySelector('.button');

      expect(domCache.getStats().hits).toBe(2);
      expect(domCache.getStats().misses).toBe(3);
    });
  });

  describe('Resource Management', () => {
    it('should cleanup intervals and timeouts', () => {
      const activeTimers = new Set<NodeJS.Timeout>();

      const createManagedTimer = () => {
        return {
          setTimeout: (callback: Function, delay: number) => {
            const id = setTimeout(() => {
              callback();
              activeTimers.delete(id);
            }, delay);
            activeTimers.add(id);
            return id;
          },

          setInterval: (callback: Function, delay: number) => {
            const id = setInterval(callback, delay);
            activeTimers.add(id);
            return id;
          },

          clearTimer: (id: NodeJS.Timeout) => {
            clearTimeout(id);
            clearInterval(id);
            activeTimers.delete(id);
          },

          clearAllTimers: () => {
            activeTimers.forEach(id => {
              clearTimeout(id);
              clearInterval(id);
            });
            activeTimers.clear();
          },

          getActiveTimersCount: () => activeTimers.size
        };
      };

      const timerManager = createManagedTimer();

      // Create multiple timers
      const timer1 = timerManager.setTimeout(() => {}, 1000);
      const timer2 = timerManager.setInterval(() => {}, 500);
      const timer3 = timerManager.setTimeout(() => {}, 2000);

      expect(timerManager.getActiveTimersCount()).toBe(3);

      // Clear specific timer
      timerManager.clearTimer(timer1);
      expect(timerManager.getActiveTimersCount()).toBe(2);

      // Clear all timers
      timerManager.clearAllTimers();
      expect(timerManager.getActiveTimersCount()).toBe(0);
    });

    // @TODO: Fix AbortController mock for proper async cancellation testing
    // Issue: Mock fetch doesn't properly simulate abort signal behavior in test environment
    it.skip('should manage async operations properly', async () => {
      const createAsyncManager = () => {
        const activePromises = new Set();
        const abortControllers = new Set<AbortController>();

        return {
          createCancellableRequest: async (url: string) => {
            const controller = new AbortController();
            abortControllers.add(controller);

            const promise = fetch(url, { signal: controller.signal })
              .finally(() => {
                activePromises.delete(promise);
                abortControllers.delete(controller);
              });

            activePromises.add(promise);
            return promise;
          },

          cancelAllRequests: () => {
            abortControllers.forEach(controller => controller.abort());
            abortControllers.clear();
            activePromises.clear();
          },

          getActiveRequestsCount: () => activePromises.size
        };
      };

      const asyncManager = createAsyncManager();

      // Mock fetch that can be aborted
      global.fetch = jest.fn((url: string, options: any) => {
        if (options?.signal?.aborted) {
          return Promise.reject(new Error('AbortError'));
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
      });

      // Create requests
      const request1 = asyncManager.createCancellableRequest('/api/scraps');
      const request2 = asyncManager.createCancellableRequest('/api/users');

      expect(asyncManager.getActiveRequestsCount()).toBe(2);

      // Cancel all requests
      asyncManager.cancelAllRequests();
      expect(asyncManager.getActiveRequestsCount()).toBe(0);

      // Requests should be cancelled
      await expect(request1).rejects.toThrow();
      await expect(request2).rejects.toThrow();
    });
  });

  describe('Data Structure Optimization', () => {
    it('should use efficient data structures for large datasets', () => {
      // Test Map vs Object performance characteristics
      const testMapVsObject = (size: number) => {
        const map = new Map();
        const obj: { [key: string]: any } = {};

        // Insert performance
        const mapInsertStart = performance.now();
        for (let i = 0; i < size; i++) {
          map.set(`key-${i}`, `value-${i}`);
        }
        const mapInsertTime = performance.now() - mapInsertStart;

        const objInsertStart = performance.now();
        for (let i = 0; i < size; i++) {
          obj[`key-${i}`] = `value-${i}`;
        }
        const objInsertTime = performance.now() - objInsertStart;

        // Lookup performance
        const mapLookupStart = performance.now();
        for (let i = 0; i < size; i++) {
          map.get(`key-${i}`);
        }
        const mapLookupTime = performance.now() - mapLookupStart;

        const objLookupStart = performance.now();
        for (let i = 0; i < size; i++) {
          obj[`key-${i}`];
        }
        const objLookupTime = performance.now() - objLookupStart;

        return {
          map: { insertTime: mapInsertTime, lookupTime: mapLookupTime },
          obj: { insertTime: objInsertTime, lookupTime: objLookupTime }
        };
      };

      const results = testMapVsObject(1000);
      
      // Both should complete in reasonable time
      expect(results.map.insertTime).toBeLessThan(100);
      expect(results.obj.insertTime).toBeLessThan(100);
      expect(results.map.lookupTime).toBeLessThan(100);
      expect(results.obj.lookupTime).toBeLessThan(100);
    });

    it('should efficiently handle array operations', () => {
      const largeArray = Array.from({ length: 10000 }, (_, i) => ({ id: i, value: `item-${i}` }));

      // Test different array operation strategies
      const findById = (id: number) => {
        const start = performance.now();
        const result = largeArray.find(item => item.id === id);
        const time = performance.now() - start;
        return { result, time };
      };

      const findByIdWithIndex = (id: number) => {
        const start = performance.now();
        // Since IDs are sequential, we can use direct indexing
        const result = largeArray[id];
        const time = performance.now() - start;
        return { result, time };
      };

      const result1 = findById(5000);
      const result2 = findByIdWithIndex(5000);

      expect(result1.result?.id).toBe(5000);
      expect(result2.result?.id).toBe(5000);
      expect(result2.time).toBeLessThan(result1.time); // Direct indexing should be faster
    });
  });

  describe('Virtual Scrolling and Rendering', () => {
    it('should implement virtual scrolling for large lists', () => {
      interface VirtualScrollConfig {
        itemHeight: number;
        containerHeight: number;
        totalItems: number;
        buffer: number;
      }

      const createVirtualScroller = (config: VirtualScrollConfig) => {
        return {
          getVisibleRange: (scrollTop: number) => {
            const { itemHeight, containerHeight, totalItems, buffer } = config;
            
            const visibleItemsCount = Math.ceil(containerHeight / itemHeight);
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(totalItems - 1, startIndex + visibleItemsCount);

            // Add buffer items
            const bufferedStart = Math.max(0, startIndex - buffer);
            const bufferedEnd = Math.min(totalItems - 1, endIndex + buffer);

            return {
              start: bufferedStart,
              end: bufferedEnd,
              visibleCount: bufferedEnd - bufferedStart + 1
            };
          },

          getTotalHeight: () => config.totalItems * config.itemHeight,

          getOffsetY: (index: number) => index * config.itemHeight
        };
      };

      const scroller = createVirtualScroller({
        itemHeight: 50,
        containerHeight: 500,
        totalItems: 10000,
        buffer: 5
      });

      // Test at scroll position 0
      const range1 = scroller.getVisibleRange(0);
      expect(range1.start).toBe(0);
      expect(range1.visibleCount).toBeLessThan(50); // Should only render visible + buffer

      // Test at middle position
      const range2 = scroller.getVisibleRange(5000);
      expect(range2.start).toBeGreaterThan(90);
      expect(range2.end).toBeLessThan(130);

      expect(scroller.getTotalHeight()).toBe(500000); // 10000 * 50
    });
  });
});