'use client';

import React, { useState, useCallback } from 'react';
import Image from 'next/image';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: (event: React.SyntheticEvent<HTMLImageElement>) => void;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  fill?: boolean;
}

const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  placeholder = '/images/placeholder.png',
  onLoad,
  onError,
  loading = 'lazy',
  sizes,
  priority = false,
  width,
  height,
  fill = false
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    if (retryCount < maxRetries) {
      // Retry loading the image
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000 * (retryCount + 1)); // Exponential backoff
    } else {
      setHasError(true);
      onError?.(event);
    }
  }, [onError, retryCount, maxRetries]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(0);
  }, []);

  // Generate responsive image sizes if not provided
  const responsiveSizes = sizes || '(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw';

  // Common image props
  const imageProps = {
    alt,
    className: `object-cover transition-opacity duration-300 ${
      isLoaded ? 'opacity-100' : 'opacity-0'
    } ${className}`,
    onLoad: handleLoad,
    onError: handleError,
    priority,
    sizes: responsiveSizes,
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
  };

  return (
    <div className={`relative overflow-hidden ${!fill ? className : ''}`}>
      {/* Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center z-10">
          <svg 
            className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
        </div>
      )}

      {/* Next.js optimized image */}
      {!hasError && (
        fill ? (
          <Image
            src={src}
            fill
            {...imageProps}
          />
        ) : (
          <Image
            src={src}
            width={width || 340}
            height={height || 240}
            {...imageProps}
          />
        )
      )}

      {/* Error state with retry */}
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center p-2 z-10">
          <div className="text-center text-gray-500">
            <svg 
              className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
              />
            </svg>
            <p className="text-xs mb-2">加载失败</p>
            <button
              onClick={handleRetry}
              className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 transition-colors touch-manipulation"
            >
              重试
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LazyImage;