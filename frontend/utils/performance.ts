// Performance monitoring utilities

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  interactionTime: number;
  memoryUsage?: number;
}

interface PerformanceEntry {
  name: string;
  startTime: number;
  duration: number;
  entryType: string;
}

// Performance observer for monitoring web vitals
class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Monitor navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.recordNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation timing observer not supported');
      }

      // Monitor largest contentful paint
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('lcp', { 
            loadTime: lastEntry.startTime,
            renderTime: 0,
            interactionTime: 0
          });
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Monitor first input delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            this.recordMetric('fid', {
              loadTime: 0,
              renderTime: 0,
              interactionTime: entry.processingStart - entry.startTime
            });
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  private recordNavigationMetrics(entry: PerformanceNavigationTiming) {
    const loadTime = entry.loadEventEnd - entry.navigationStart;
    const renderTime = entry.domContentLoadedEventEnd - entry.navigationStart;
    
    this.recordMetric('navigation', {
      loadTime,
      renderTime,
      interactionTime: 0,
      memoryUsage: this.getMemoryUsage()
    });
  }

  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
    }
    return undefined;
  }

  recordMetric(name: string, metrics: PerformanceMetrics) {
    this.metrics.set(name, metrics);
    
    // Log performance issues
    if (metrics.loadTime > 3000) {
      console.warn(`Slow load time detected for ${name}: ${metrics.loadTime}ms`);
    }
    
    if (metrics.interactionTime > 100) {
      console.warn(`Slow interaction detected for ${name}: ${metrics.interactionTime}ms`);
    }
  }

  getMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  getMetric(name: string): PerformanceMetrics | undefined {
    return this.metrics.get(name);
  }

  // Measure component render time
  measureRender<T>(name: string, fn: () => T): T {
    const startTime = performance.now();
    const result = fn();
    const endTime = performance.now();
    
    this.recordMetric(`render-${name}`, {
      loadTime: 0,
      renderTime: endTime - startTime,
      interactionTime: 0
    });
    
    return result;
  }

  // Measure async operation time
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await fn();
      const endTime = performance.now();
      
      this.recordMetric(`async-${name}`, {
        loadTime: endTime - startTime,
        renderTime: 0,
        interactionTime: 0
      });
      
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.recordMetric(`async-${name}-error`, {
        loadTime: endTime - startTime,
        renderTime: 0,
        interactionTime: 0
      });
      throw error;
    }
  }

  // Clean up observers
  disconnect() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export function usePerformanceMonitor(componentName: string) {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);

  React.useEffect(() => {
    const startTime = performance.now();
    
    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      const componentMetrics: PerformanceMetrics = {
        loadTime: 0,
        renderTime,
        interactionTime: 0,
        memoryUsage: performanceMonitor['getMemoryUsage']()
      };
      
      performanceMonitor.recordMetric(`component-${componentName}`, componentMetrics);
      setMetrics(componentMetrics);
    };
  }, [componentName]);

  const measureInteraction = React.useCallback((actionName: string, fn: () => void) => {
    const startTime = performance.now();
    fn();
    const endTime = performance.now();
    
    performanceMonitor.recordMetric(`interaction-${componentName}-${actionName}`, {
      loadTime: 0,
      renderTime: 0,
      interactionTime: endTime - startTime
    });
  }, [componentName]);

  return { metrics, measureInteraction };
}

// Image loading performance utilities
export class ImagePerformanceTracker {
  private static instance: ImagePerformanceTracker;
  private loadTimes: Map<string, number> = new Map();
  private errorCounts: Map<string, number> = new Map();

  static getInstance(): ImagePerformanceTracker {
    if (!ImagePerformanceTracker.instance) {
      ImagePerformanceTracker.instance = new ImagePerformanceTracker();
    }
    return ImagePerformanceTracker.instance;
  }

  trackImageLoad(src: string, loadTime: number) {
    this.loadTimes.set(src, loadTime);
    
    // Log slow loading images
    if (loadTime > 2000) {
      console.warn(`Slow image load: ${src} took ${loadTime}ms`);
    }
  }

  trackImageError(src: string) {
    const currentCount = this.errorCounts.get(src) || 0;
    this.errorCounts.set(src, currentCount + 1);
    
    // Log frequently failing images
    if (currentCount >= 2) {
      console.error(`Image repeatedly failing to load: ${src}`);
    }
  }

  getImageStats() {
    return {
      loadTimes: new Map(this.loadTimes),
      errorCounts: new Map(this.errorCounts),
      averageLoadTime: this.calculateAverageLoadTime(),
      errorRate: this.calculateErrorRate()
    };
  }

  private calculateAverageLoadTime(): number {
    if (this.loadTimes.size === 0) return 0;
    
    const total = Array.from(this.loadTimes.values()).reduce((sum, time) => sum + time, 0);
    return total / this.loadTimes.size;
  }

  private calculateErrorRate(): number {
    const totalAttempts = this.loadTimes.size + Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    return totalAttempts > 0 ? totalErrors / totalAttempts : 0;
  }
}

// Bundle size analyzer
export function analyzeBundleSize() {
  if ('performance' in window && 'getEntriesByType' in performance) {
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    
    const jsResources = resources.filter(resource => 
      resource.name.includes('.js') && !resource.name.includes('node_modules')
    );
    
    const cssResources = resources.filter(resource => 
      resource.name.includes('.css')
    );
    
    const totalJSSize = jsResources.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0
    );
    
    const totalCSSSize = cssResources.reduce((total, resource) => 
      total + (resource.transferSize || 0), 0
    );
    
    return {
      jsSize: Math.round(totalJSSize / 1024), // KB
      cssSize: Math.round(totalCSSSize / 1024), // KB
      totalSize: Math.round((totalJSSize + totalCSSSize) / 1024), // KB
      jsResources: jsResources.length,
      cssResources: cssResources.length
    };
  }
  
  return null;
}

// Memory usage monitoring
export function monitorMemoryUsage() {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024), // MB
      usage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100) // %
    };
  }
  
  return null;
}

// React import to fix the hook
import React from 'react';