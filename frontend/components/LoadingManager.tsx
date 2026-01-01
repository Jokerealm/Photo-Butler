'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, loading: boolean) => void;
  isLoading: (key?: string) => boolean;
  isAnyLoading: () => boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: React.ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = useCallback((key: string, loading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: loading
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const isAnyLoading = useCallback(() => {
    return Object.values(loadingStates).some(Boolean);
  }, [loadingStates]);

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoadingIndicator />
    </LoadingContext.Provider>
  );
};

// Global loading indicator component
const GlobalLoadingIndicator: React.FC = () => {
  const { isAnyLoading } = useLoading();

  if (!isAnyLoading()) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="h-1 bg-blue-200">
        <div className="h-full bg-blue-600 animate-pulse"></div>
      </div>
    </div>
  );
};

// Hook for managing loading state with automatic cleanup
export const useLoadingState = (key: string) => {
  const { setLoading, isLoading } = useLoading();

  const startLoading = useCallback(() => {
    setLoading(key, true);
  }, [key, setLoading]);

  const stopLoading = useCallback(() => {
    setLoading(key, false);
  }, [key, setLoading]);

  const withLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    startLoading();
    try {
      return await operation();
    } finally {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading: isLoading(key),
    startLoading,
    stopLoading,
    withLoading
  };
};

// Enhanced loading states with progress
interface ProgressLoadingState {
  loading: boolean;
  progress?: number;
  message?: string;
  error?: string;
}

interface ProgressLoadingContextType {
  states: { [key: string]: ProgressLoadingState };
  setProgressLoading: (key: string, state: Partial<ProgressLoadingState>) => void;
  clearLoading: (key: string) => void;
  getState: (key: string) => ProgressLoadingState;
}

const ProgressLoadingContext = createContext<ProgressLoadingContextType | undefined>(undefined);

export const useProgressLoading = () => {
  const context = useContext(ProgressLoadingContext);
  if (!context) {
    throw new Error('useProgressLoading must be used within a ProgressLoadingProvider');
  }
  return context;
};

export const ProgressLoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [states, setStates] = useState<{ [key: string]: ProgressLoadingState }>({});

  const setProgressLoading = useCallback((key: string, newState: Partial<ProgressLoadingState>) => {
    setStates(prev => ({
      ...prev,
      [key]: {
        loading: false,
        progress: undefined,
        message: undefined,
        error: undefined,
        ...prev[key],
        ...newState
      }
    }));
  }, []);

  const clearLoading = useCallback((key: string) => {
    setStates(prev => {
      const newStates = { ...prev };
      delete newStates[key];
      return newStates;
    });
  }, []);

  const getState = useCallback((key: string): ProgressLoadingState => {
    return states[key] || { loading: false };
  }, [states]);

  const value: ProgressLoadingContextType = {
    states,
    setProgressLoading,
    clearLoading,
    getState
  };

  return (
    <ProgressLoadingContext.Provider value={value}>
      {children}
      <ProgressLoadingOverlay />
    </ProgressLoadingContext.Provider>
  );
};

// Progress loading overlay
const ProgressLoadingOverlay: React.FC = () => {
  const { states } = useProgressLoading();

  const activeStates = Object.entries(states).filter(([_, state]) => state.loading);

  if (activeStates.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        {activeStates.map(([key, state]) => (
          <div key={key} className="mb-4 last:mb-0">
            {state.message && (
              <p className="text-sm text-gray-700 mb-2">{state.message}</p>
            )}
            
            {state.progress !== undefined && (
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, state.progress))}%` }}
                ></div>
              </div>
            )}
            
            {state.progress !== undefined && (
              <p className="text-xs text-gray-500 text-center">
                {Math.round(state.progress)}%
              </p>
            )}
            
            {state.error && (
              <div className="bg-red-50 border border-red-200 rounded p-2 mt-2">
                <p className="text-sm text-red-700">{state.error}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// Hook for progress loading
export const useProgressLoadingState = (key: string) => {
  const { setProgressLoading, clearLoading, getState } = useProgressLoading();

  const updateProgress = useCallback((progress: number, message?: string) => {
    setProgressLoading(key, { loading: true, progress, message });
  }, [key, setProgressLoading]);

  const setError = useCallback((error: string) => {
    setProgressLoading(key, { loading: false, error });
  }, [key, setProgressLoading]);

  const complete = useCallback(() => {
    clearLoading(key);
  }, [key, clearLoading]);

  const start = useCallback((message?: string) => {
    setProgressLoading(key, { loading: true, message, progress: 0 });
  }, [key, setProgressLoading]);

  return {
    state: getState(key),
    start,
    updateProgress,
    setError,
    complete
  };
};