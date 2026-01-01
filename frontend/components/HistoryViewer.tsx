'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { HistoryItem, loadHistory, clearHistory, removeHistoryItem } from '../utils/localStorage';

interface HistoryViewerProps {
  history?: HistoryItem[];
  onItemClick?: (item: HistoryItem) => void;
  className?: string;
}

const HistoryViewer: React.FC<HistoryViewerProps> = ({
  history: externalHistory,
  onItemClick,
  className = ''
}) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showFullView, setShowFullView] = useState(false);

  // Load history from localStorage or use external history
  const loadHistoryData = useCallback(() => {
    try {
      setLoading(true);
      setError(null);

      if (externalHistory) {
        // Use externally provided history
        const sortedHistory = [...externalHistory].sort((a, b) => b.timestamp - a.timestamp);
        setHistory(sortedHistory);
      } else {
        // Load from localStorage (this is synchronous)
        const historyData = loadHistory();
        setHistory(historyData);
      }

      console.log('History loaded successfully');
    } catch (err) {
      console.error('Error loading history:', err);
      setError(err instanceof Error ? err.message : '加载历史记录失败');
    } finally {
      setLoading(false);
    }
  }, [externalHistory]);

  // Load history on component mount
  useEffect(() => {
    loadHistoryData();
  }, [loadHistoryData]);

  // Handle history item click
  const handleItemClick = useCallback((item: HistoryItem) => {
    console.log('History item clicked:', item.id);
    setSelectedItem(item);
    setShowFullView(true);
    
    // Call external click handler if provided
    if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  // Handle clear all history
  const handleClearHistory = useCallback(() => {
    if (window.confirm('确定要清空所有历史记录吗？此操作不可撤销。')) {
      try {
        clearHistory();
        setHistory([]);
        console.log('History cleared successfully');
      } catch (err) {
        console.error('Error clearing history:', err);
        setError(err instanceof Error ? err.message : '清空历史记录失败');
      }
    }
  }, []);

  // Handle remove single item
  const handleRemoveItem = useCallback((itemId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering item click
    
    if (window.confirm('确定要删除这条历史记录吗？')) {
      try {
        removeHistoryItem(itemId);
        setHistory(prev => prev.filter(item => item.id !== itemId));
        console.log('History item removed:', itemId);
      } catch (err) {
        console.error('Error removing history item:', err);
        setError(err instanceof Error ? err.message : '删除历史记录失败');
      }
    }
  }, []);

  // Close full view modal
  const closeFullView = useCallback(() => {
    setShowFullView(false);
    setSelectedItem(null);
  }, []);

  // Handle image load error
  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    if (img.src !== '/images/placeholder.png') {
      console.warn('History image failed to load, using placeholder:', img.src);
      img.src = '/images/placeholder.png';
    }
  }, []);

  // Format timestamp for display
  const formatTimestamp = useCallback((timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      return '刚刚';
    } else if (diffHours < 24) {
      return `${diffHours}小时前`;
    } else if (diffDays < 7) {
      return `${diffDays}天前`;
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }, []);

  if (loading) {
    return (
      <div className={`w-full ${className}`}>
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-sm sm:text-base text-gray-600">加载历史记录中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-8 sm:py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-base sm:text-lg font-medium">{error}</p>
          </div>
          <button
            onClick={loadHistoryData}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            <p className="text-base sm:text-lg font-medium">暂无历史记录</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">开始生成图片后，历史记录会显示在这里</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-semibold">历史记录</h2>
        <div className="flex items-center justify-between sm:justify-end space-x-3">
          <span className="text-xs sm:text-sm text-gray-500">
            共 {history.length} 条记录
          </span>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
            >
              清空全部
            </button>
          )}
        </div>
      </div>

      {/* History Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {history.map((item) => (
          <div
            key={item.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group"
            onClick={() => handleItemClick(item)}
            role="button"
            tabIndex={0}
            aria-label={`查看历史记录: ${item.template}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleItemClick(item);
              }
            }}
          >
            {/* Image Comparison */}
            <div className="relative">
              <div className="grid grid-cols-2 gap-0">
                {/* Original Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img
                    src={item.originalImageUrl}
                    alt="原图"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                    原图
                  </div>
                </div>
                
                {/* Generated Image */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                  <img
                    src={item.generatedImageUrl}
                    alt="生成图"
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                    生成图
                  </div>
                </div>
              </div>

              {/* Remove Button */}
              <button
                onClick={(e) => handleRemoveItem(item.id, e)}
                className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                aria-label="删除此记录"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>

            {/* Item Details */}
            <div className="p-3 sm:p-4">
              <div className="space-y-1 sm:space-y-2">
                {/* Template Name */}
                <div className="flex items-center justify-between">
                  <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
                    {item.template}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>

                {/* Prompt */}
                <p className="text-xs text-gray-600 overflow-hidden" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {item.prompt}
                </p>

                {/* Timestamp */}
                <div className="text-xs text-gray-400">
                  {new Date(item.timestamp).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>

            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-200 pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Full View Modal */}
      {showFullView && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                历史记录详情
              </h3>
              <button
                onClick={closeFullView}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="关闭"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Original Image */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">原图</h4>
                  <img
                    src={selectedItem.originalImageUrl}
                    alt="原图"
                    className="w-full rounded-lg shadow-md"
                    onError={handleImageError}
                  />
                </div>

                {/* Generated Image */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">生成图</h4>
                  <img
                    src={selectedItem.generatedImageUrl}
                    alt="生成图"
                    className="w-full rounded-lg shadow-md"
                    onError={handleImageError}
                  />
                </div>
              </div>

              {/* Details */}
              <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">使用模板:</label>
                  <p className="text-sm text-gray-900 mt-1">{selectedItem.template}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">提示词:</label>
                  <p className="text-sm text-gray-900 mt-1 bg-gray-50 p-2 sm:p-3 rounded-md">
                    {selectedItem.prompt}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">生成时间:</label>
                  <p className="text-sm text-gray-900 mt-1">
                    {new Date(selectedItem.timestamp).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
                <button
                  onClick={closeFullView}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  关闭
                </button>
                <a
                  href={selectedItem.generatedImageUrl}
                  download={`ai-generated-${selectedItem.template}-${selectedItem.timestamp}.jpg`}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-center text-sm sm:text-base"
                >
                  下载图片
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HistoryViewer;