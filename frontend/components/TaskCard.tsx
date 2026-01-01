'use client';

import { GenerationTask, TaskStatus } from '../types';
import LazyImage from './LazyImage';

interface TaskCardProps {
  task: GenerationTask;
  onDownload?: (task: GenerationTask) => void;
  onRetry?: (task: GenerationTask) => void;
  onDelete?: (task: GenerationTask) => void;
  onRefresh?: (task: GenerationTask) => void;
}

export default function TaskCard({ task, onDownload, onRetry, onDelete, onRefresh }: TaskCardProps) {
  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.PROCESSING:
        return 'bg-blue-100 text-blue-800';
      case TaskStatus.COMPLETED:
        return 'bg-green-100 text-green-800';
      case TaskStatus.FAILED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return '等待中';
      case TaskStatus.PROCESSING:
        return '生成中';
      case TaskStatus.COMPLETED:
        return '已完成';
      case TaskStatus.FAILED:
        return '失败';
      default:
        return '未知';
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {/* Images Section */}
      <div className="grid grid-cols-2 gap-0">
        {/* Original Image */}
        <div className="aspect-square bg-gray-100 relative">
          <LazyImage
            src={task.originalImageUrl}
            alt="原图"
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            原图
          </div>
        </div>

        {/* Generated Image or Placeholder */}
        <div className="aspect-square bg-gray-100 relative">
          {task.status === TaskStatus.COMPLETED && task.generatedImageUrl ? (
            <LazyImage
              src={task.generatedImageUrl}
              alt="生成图"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
          {task.status === TaskStatus.PROCESSING ? (
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                  <p className="text-xs text-gray-600">生成中...</p>
                  {task.progress > 0 ? (
                    <p className="text-xs text-gray-500 mt-1">{task.progress}%</p>
                  ) : (
                    <p className="text-xs text-gray-500 mt-1">初始化中...</p>
                  )}
                </div>
              ) : task.status === TaskStatus.FAILED ? (
                <div className="text-center text-red-500">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs">生成失败</p>
                </div>
              ) : (
                <div className="text-center text-gray-400">
                  <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs">等待生成</p>
                </div>
              )}
            </div>
          )}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            生成图
          </div>
        </div>
      </div>

      {/* Task Info */}
      <div className="p-4">
        {/* Status and Template */}
        <div className="flex items-center justify-between mb-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(task.status)}`}>
            {getStatusText(task.status)}
          </span>
          <span className="text-xs text-gray-500">
            {task.template.name}
          </span>
        </div>

        {/* Progress Bar (for processing tasks) */}
        {task.status === TaskStatus.PROCESSING && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>进度</span>
              <span>{task.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(task.progress, 5)}%` }}
              />
            </div>
            {task.estimatedCompletionTime && (
              <div className="text-xs text-gray-500 mt-1">
                预计完成: {formatDate(task.estimatedCompletionTime)}
              </div>
            )}
            {!task.estimatedCompletionTime && task.progress > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                正在计算预计完成时间...
              </div>
            )}
          </div>
        )}

        {/* Error Message */}
        {task.status === TaskStatus.FAILED && task.errorMessage && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
            {task.errorMessage}
          </div>
        )}

        {/* Timestamps */}
        <div className="text-xs text-gray-500 mb-4 space-y-1">
          <div>创建时间: {formatDate(task.createdAt)}</div>
          {task.completedAt && (
            <div>完成时间: {formatDate(task.completedAt)}</div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            {task.status === TaskStatus.COMPLETED && task.generatedImageUrl && onDownload && (
              <button
                onClick={() => onDownload(task)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-lg hover:bg-blue-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>下载</span>
              </button>
            )}

            {task.status === TaskStatus.FAILED && onRetry && (
              <button
                onClick={() => onRetry(task)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-yellow-100 text-yellow-700 text-xs rounded-lg hover:bg-yellow-200 transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>重试</span>
              </button>
            )}

            {(task.status === TaskStatus.PENDING || task.status === TaskStatus.PROCESSING) && onRefresh && (
              <button
                onClick={() => onRefresh(task)}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors"
                title="刷新状态"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新</span>
              </button>
            )}
          </div>

          {onDelete && (
            <button
              onClick={() => onDelete(task)}
              className="flex items-center space-x-1 px-3 py-1.5 bg-red-100 text-red-700 text-xs rounded-lg hover:bg-red-200 transition-colors"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              <span>删除</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}