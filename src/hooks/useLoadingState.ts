import { useState, useCallback } from 'react';

export function useLoadingState<T extends (...args: never[]) => Promise<unknown>>(
  asyncFunction: T
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async (...args: Parameters<T>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await asyncFunction(...args);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [asyncFunction]);

  return { execute, loading, error, setError };
}