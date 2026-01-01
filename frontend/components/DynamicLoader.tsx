'use client';

import React, { Suspense } from 'react';

interface DynamicLoaderProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
}

const DefaultFallback: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
    <span className="ml-3 text-gray-600">加载中...</span>
  </div>
);

const DynamicLoader: React.FC<DynamicLoaderProps> = ({
  children,
  fallback = <DefaultFallback />,
  className = ''
}) => {
  return (
    <div className={className}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </div>
  );
};

export default DynamicLoader;