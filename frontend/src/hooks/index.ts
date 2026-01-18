import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';
import type {
  SaasProduct,
  Directory,
  SubmissionWithDetails,
  DashboardStats,
  SubmissionFilters,
  DirectoryFilters,
  ApiError
} from '../types/schema';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

interface UseApiListState<T> {
  data: T[];
  loading: boolean;
  error: ApiError | null;
}

// Hook for fetching SaaS products
export function useSaasProducts() {
  const [state, setState] = useState<UseApiListState<SaasProduct>>({
    data: [],
    loading: true,
    error: null
  });

  const fetchProducts = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getSaasProducts();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: [], loading: false, error: error as ApiError });
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { ...state, refetch: fetchProducts };
}

// Hook for fetching a single SaaS product
export function useSaasProduct(id: number | null) {
  const [state, setState] = useState<UseApiState<SaasProduct>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchProduct = useCallback(async () => {
    if (!id) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getSaasProduct(id);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as ApiError });
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return { ...state, refetch: fetchProduct };
}

// Hook for fetching directories
export function useDirectories(filters?: DirectoryFilters) {
  const [state, setState] = useState<UseApiListState<Directory>>({
    data: [],
    loading: true,
    error: null
  });

  const fetchDirectories = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getDirectories(filters);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: [], loading: false, error: error as ApiError });
    }
  }, [filters]);

  useEffect(() => {
    fetchDirectories();
  }, [fetchDirectories]);

  return { ...state, refetch: fetchDirectories };
}

// Hook for fetching submissions
export function useSubmissions(filters?: SubmissionFilters) {
  const [state, setState] = useState<UseApiListState<SubmissionWithDetails>>({
    data: [],
    loading: true,
    error: null
  });

  const fetchSubmissions = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getSubmissions(filters);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: [], loading: false, error: error as ApiError });
    }
  }, [filters]);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  return { ...state, refetch: fetchSubmissions };
}

// Hook for dashboard stats
export function useDashboardStats() {
  const [state, setState] = useState<UseApiState<DashboardStats>>({
    data: null,
    loading: true,
    error: null
  });

  const fetchStats = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const data = await api.getDashboardStats();
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({ data: null, loading: false, error: error as ApiError });
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...state, refetch: fetchStats };
}

// Hook for debounced value
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Hook for local storage
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}

// Hook for async operations with loading state
export function useAsync<T, Args extends unknown[]>(
  asyncFunction: (...args: Args) => Promise<T>
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: ApiError | null;
    value: T | null;
  }>({
    loading: false,
    error: null,
    value: null
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ loading: true, error: null, value: null });
      try {
        const response = await asyncFunction(...args);
        setState({ loading: false, error: null, value: response });
        return response;
      } catch (error) {
        setState({ loading: false, error: error as ApiError, value: null });
        throw error;
      }
    },
    [asyncFunction]
  );

  return { ...state, execute };
}