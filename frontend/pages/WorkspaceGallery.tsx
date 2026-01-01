'use client';

import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { GenerationTask, TaskStatus, TaskSortOption } from '../types';
import TaskCard from '../components/TaskCard';
import TaskFilter from '../components/TaskFilter';

interface WorkspaceGalleryProps {
  userId?: string;
}

const WorkspaceGallery: React.FC<WorkspaceGalleryProps> = ({ userId }) => {
  const {
    tasks,
    loading,
    error,
    filter,
    sortBy,
    wsConnected,
    setFilter,
    setSortBy,
    getFilteredTasks,
    getSortedTasks,
    loadTasks: loadTasksFromStore,
    retryTask,
    deleteTask,
    refreshTaskStatus,
  } = useTaskStore();

  const { showToast } = useUIStore();
  const [filteredAndSortedTasks, setFilteredAndSortedTasks] = useState<GenerationTask[]>([]);

  useEffect(() => {
    // TODO: 当任务API实现后，取消注释下面的代码
    // loadTasksFromStore();
    
    // 暂时设置为空任务列表，避免404错误
    const { setTasks, setLoading } = useTaskStore.getState();
    setLoading(false);
    setTasks([]);
  }, [userId]);

  // Initialize WebSocket connection for real-time updates
  useEffect(() => {
    const { initializeWebSocket, cleanupWebSocket } = useTaskStore.getState();
    
    // Initialize WebSocket connection
    initializeWebSocket();
    
    // Show connection status to user
    if (!wsConnected) {
      showToast('正在连接实时更新...', 'info');
    }
    
    // Cleanup on unmount
    return () => {
      cleanupWebSocket();
    };
  }, []);

  // Handle WebSocket connection status changes
  useEffect(() => {
    if (wsConnected) {
      showToast('实时更新已连接', 'success');
    } else {
      // Only show disconnection message if we were previously connected
      const wasConnected = useTaskStore.getState().wsConnected;
      if (wasConnected) {
        showToast('实时更新连接断开，正在重连...', 'warning');
      }
    }
  }, [wsConnected, showToast]);

  useEffect(() => {
    const filtered = getFilteredTasks();
    const sorted = getSortedTasks(filtered);
    setFilteredAndSortedTasks(sorted);
  }, [tasks, filter, sortBy, getFilteredTasks, getSortedTasks]);

  const loadTasks = () => {
    // TODO: 当任务API实现后，取消注释下面的代码
    // loadTasksFromStore();
    
    // 暂时显示友好提示
    showToast('任务功能正在开发中', 'info');
  };

  const handleDownload = async (task: GenerationTask) => {
    if (!task.generatedImageUrl) return;
    
    try {
      // Mock download functionality
      showToast('开始下载图片', 'info');
      // In real implementation, this would trigger actual download
    } catch (err) {
      showToast('下载失败', 'error');
    }
  };

  const handleRetry = async (task: GenerationTask) => {
    try {
      await retryTask(task.id);
      showToast('任务已重新提交', 'success');
    } catch (err) {
      showToast('重试失败', 'error');
    }
  };

  const handleDelete = async (task: GenerationTask) => {
    if (window.confirm('确定要删除这个任务吗？')) {
      try {
        await deleteTask(task.id);
        showToast('任务已删除', 'success');
      } catch (err) {
        showToast('删除失败', 'error');
      }
    }
  };

  const handleRefresh = (task: GenerationTask) => {
    refreshTaskStatus(task.id);
    showToast('正在刷新任务状态...', 'info');
  };

  const handleRetryLoad = () => {
    // TODO: 当任务API实现后，取消注释下面的代码
    // loadTasks();
    
    // 暂时显示友好提示
    showToast('任务功能正在开发中', 'info');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载作品中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetryLoad}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">作品仓库</h1>
            <p className="text-gray-600">管理您的AI艺术作品</p>
          </div>
          
          {/* WebSocket Connection Status */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => refreshTaskStatus()}
              className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              title="刷新任务状态"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>刷新</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${wsConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-sm text-gray-600">
                {wsConnected ? '实时更新已连接' : '实时更新已断开'}
              </span>
              {!wsConnected && (
                <button
                  onClick={() => {
                    const { initializeWebSocket } = useTaskStore.getState();
                    initializeWebSocket();
                  }}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  重连
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="mb-8">
        <TaskFilter
          filter={filter}
          sortBy={sortBy}
          onFilterChange={setFilter}
          onSortChange={setSortBy}
        />
      </div>

      {/* Tasks Grid */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">作品仓库功能开发中</h3>
          <p className="text-gray-600 mb-4">任务管理和作品展示功能正在开发中，敬请期待</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800">当前可用功能</p>
                <p className="text-sm text-blue-700 mt-1">
                  您可以在<a href="/marketplace" className="underline hover:text-blue-900">模板商城</a>中浏览和选择AI艺术风格模板
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onDownload={handleDownload}
              onRetry={handleRetry}
              onDelete={handleDelete}
              onRefresh={handleRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default WorkspaceGallery;