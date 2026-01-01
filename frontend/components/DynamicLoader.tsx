'use client';

import React, { Suspense, lazy, ComponentType } from 'react';

interface DynamicLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  errorBoundary?: boolean;
}

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>;
  fallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
  retryCount?: number;
  [key: string]: any;
}

const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center py-6 sm:py-8">
    <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-sm sm:text-base text-gray-600">加载中...</span>
  </div>
);

const ErrorFallback: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => (
  <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
    <p className="text-sm sm:text-base text-gray-600 mb-3">组件加载失败</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
      >
        重试
      </button>
    )}
  </div>
);

// Enhanced lazy component loader with retry mechanism
export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = <DefaultFallback />,
  errorFallback,
  retryCount = 3,
  ...props
}) => {
  const [Component, setComponent] = React.useState<ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [attempts, setAttempts] = React.useState(0);

  const loadComponent = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const module = await loader();
      setComponent(() => module.default);
    } catch (err) {
      console.error('Failed to load component:', err);
      setError(err as Error);
      
      // Auto-retry with exponential backoff
      if (attempts < retryCount) {
        setTimeout(() => {
          setAttempts(prev => prev + 1);
          loadComponent();
        }, Math.pow(2, attempts) * 1000);
      }
    } finally {
      setLoading(false);
    }
  }, [loader, attempts, retryCount]);

  React.useEffect(() => {
    loadComponent();
  }, [loadComponent]);

  const handleRetry = React.useCallback(() => {
    setAttempts(0);
    loadComponent();
  }, [loadComponent]);

  if (loading) {
    return <>{fallback}</>;
  }

  if (error) {
    return errorFallback || <ErrorFallback onRetry={handleRetry} />;
  }

  if (Component) {
    return <Component {...props} />;
  }

  return null;
};

// Create lazy component with built-in error handling
export const createLazyComponent = (
  loader: () => Promise<{ default: ComponentType<any> }>,
  options: {
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    retryCount?: number;
  } = {}
) => {
  return React.forwardRef<any, any>((props, ref) => (
    <LazyComponent
      loader={loader}
      fallback={options.fallback}
      errorFallback={options.errorFallback}
      retryCount={options.retryCount}
      ref={ref}
      {...props}
    />
  ));
};

// Preload component for better performance
export const preloadComponent = (loader: () => Promise<{ default: ComponentType<any> }>) => {
  return loader().catch(err => {
    console.warn('Failed to preload component:', err);
  });
};

// Hook for component preloading on hover/focus
export const useComponentPreloader = () => {
  const preloadedComponents = React.useRef(new Set<string>());

  const preloadOnHover = React.useCallback((
    componentId: string,
    loader: () => Promise<{ default: ComponentType<any> }>
  ) => {
    return {
      onMouseEnter: () => {
        if (!preloadedComponents.current.has(componentId)) {
          preloadedComponents.current.add(componentId);
          preloadComponent(loader);
        }
      },
      onFocus: () => {
        if (!preloadedComponents.current.has(componentId)) {
          preloadedComponents.current.add(componentId);
          preloadComponent(loader);
        }
      }
    };
  }, []);

  return { preloadOnHover };
};

const DynamicLoader: React.FC<DynamicLoaderProps> = ({
  children,
  fallback = <DefaultFallback />,
  className = '',
  errorBoundary = true
}) => {
  if (errorBoundary) {
    return (
      <div className={className}>
        <Suspense fallback={fallback}>
          {children}
        </Suspense>
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
};

export default DynamicLoader;