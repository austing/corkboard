import { useState, useCallback, FormEvent, ChangeEvent } from 'react';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit: (values: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  resetOnSuccess?: boolean;
}

export function useFormWithSubmit<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  onSuccess,
  onError,
  resetOnSuccess = true
}: UseFormOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [originalValues, setOriginalValues] = useState<T>(initialValues);

  const handleInputChange = useCallback((
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setValues(prev => ({
      ...prev,
      [name]: type === 'number' ? (parseInt(value) || 0) : value
    }));
  }, []);

  const setValue = useCallback((name: keyof T, value: unknown) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = useCallback(async (e?: FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setError('');

    try {
      await onSubmit(values);
      if (resetOnSuccess) {
        setValues(initialValues);
      }
      onSuccess?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [values, onSubmit, onSuccess, onError, resetOnSuccess, initialValues]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setError('');
    setOriginalValues(initialValues);
  }, [initialValues]);

  const hasChanged = useCallback(() => {
    return Object.keys(values).some(key => values[key] !== originalValues[key]);
  }, [values, originalValues]);

  const setInitialValues = useCallback((newValues: T) => {
    setValues(newValues);
    setOriginalValues(newValues);
  }, []);

  return {
    values,
    loading,
    error,
    handleInputChange,
    handleSubmit,
    setValue,
    setValues,
    reset,
    hasChanged,
    setInitialValues,
    setError
  };
}