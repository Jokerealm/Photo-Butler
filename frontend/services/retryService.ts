// Network retry service with exponential backoff

interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: any) => boolean;
  onRetry?: (attempt: number, error: any) => void;
}

interface RetryState {
  attempt: number;
  lastError: any;
  isRetrying: boolean;
}

export class RetryService {
  private static defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryCondition: (error: any) => {
      // Retry on network errors, 5xx server errors, and timeouts
      if (error?.code === 'NETWORK_ERROR') return true;
      if (error?.status >= 500) return true;
      if (error?.name === 'TimeoutError') return true;
      if (error?.message?.includes('fetch')) return true;
      return false;
    },
    onRetry: () => {}
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const config = { ...this.defaultOptions, ...options };
    let lastError: any;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry if condition is not met
        if (!config.retryCondition(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === config.maxAttempts) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1),
          config.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        config.onRetry(attempt, error);

        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError;
  }

  static createRetryableFunction<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    options: RetryOptions = {}
  ) {
    return (...args: T): Promise<R> => {
      return this.withRetry(() => fn(...args), options);
    };
  }
}

// React hook for retry functionality
export function useRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
) {
  const [state, setState] = React.useState<RetryState>({
    attempt: 0,
    lastError: null,
    isRetrying: false
  });

  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(false);

  const execute = React.useCallback(async () => {
    setLoading(true);
    setState(prev => ({ ...prev, isRetrying: true, attempt: 0 }));

    try {
      const result = await RetryService.withRetry(operation, {
        ...options,
        onRetry: (attempt, error) => {
          setState(prev => ({ ...prev, attempt, lastError: error }));
          options.onRetry?.(attempt, error);
        }
      });

      setData(result);
      setState(prev => ({ ...prev, isRetrying: false, lastError: null }));
      return result;
    } catch (error) {
      setState(prev => ({ ...prev, isRetrying: false, lastError: error }));
      throw error;
    } finally {
      setLoading(false);
    }
  }, [operation, options]);

  const retry = React.useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error: state.lastError,
    isRetrying: state.isRetrying,
    attempt: state.attempt,
    execute,
    retry
  };
}

// Network status monitoring
export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private listeners: Set<(online: boolean) => void> = new Set();
  private _isOnline: boolean = navigator.onLine;

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    this._isOnline = true;
    this.notifyListeners(true);
  };

  private handleOffline = () => {
    this._isOnline = false;
    this.notifyListeners(false);
  };

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  addListener(listener: (online: boolean) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Test actual connectivity (not just browser online status)
  async testConnectivity(): Promise<boolean> {
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: AbortSignal.timeout(5000)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// React hook for network status
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [isConnected, setIsConnected] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const monitor = NetworkMonitor.getInstance();
    
    const unsubscribe = monitor.addListener(setIsOnline);
    
    // Test actual connectivity periodically
    const testConnectivity = async () => {
      const connected = await monitor.testConnectivity();
      setIsConnected(connected);
    };

    testConnectivity();
    const interval = setInterval(testConnectivity, 30000); // Test every 30 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { isOnline, isConnected };
}

// Queue for offline operations
export class OfflineQueue {
  private static instance: OfflineQueue;
  private queue: Array<{
    id: string;
    operation: () => Promise<any>;
    retryOptions?: RetryOptions;
    timestamp: number;
  }> = [];

  static getInstance(): OfflineQueue {
    if (!OfflineQueue.instance) {
      OfflineQueue.instance = new OfflineQueue();
    }
    return OfflineQueue.instance;
  }

  constructor() {
    // Process queue when coming back online
    NetworkMonitor.getInstance().addListener((online) => {
      if (online) {
        this.processQueue();
      }
    });
  }

  add(
    id: string,
    operation: () => Promise<any>,
    retryOptions?: RetryOptions
  ) {
    this.queue.push({
      id,
      operation,
      retryOptions,
      timestamp: Date.now()
    });
  }

  remove(id: string) {
    this.queue = this.queue.filter(item => item.id !== id);
  }

  async processQueue() {
    const items = [...this.queue];
    this.queue = [];

    for (const item of items) {
      try {
        await RetryService.withRetry(item.operation, item.retryOptions);
      } catch (error) {
        console.error(`Failed to process queued operation ${item.id}:`, error);
        // Re-add to queue if it's a retryable error
        if (item.retryOptions?.retryCondition?.(error) !== false) {
          this.queue.push(item);
        }
      }
    }
  }

  getQueueSize(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}

// React import
import React from 'react';