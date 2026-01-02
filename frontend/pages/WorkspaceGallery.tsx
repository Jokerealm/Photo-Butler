'use client';

import React, { useEffect, useState } from 'react';
import { useTaskStore } from '../stores/taskStore';
import { useUIStore } from '../stores/uiStore';
import { GenerationTask, TaskStatus, TaskSortOption } from '../types';
import TaskCard from '../components/TaskCard';
import TaskFilter from '../components/TaskFilter';
import { apiService } from '../services/apiService';

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
    // 现在任务API已经实现，启用任务加载
    loadTasksFromStore();
  }, [userId, loadTasksFromStore]);

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
    // 现在任务API已经实现，启用任务加载
    loadTasksFromStore();
  };

  const handleDownload = async (task: GenerationTask) => {
    if (!task.generatedImageUrl) return;
    
    try {
      showToast('开始下载图片', 'info');
      
      // Generate a meaningful filename
      const timestamp = new Date(task.createdAt).toISOString().slice(0, 10);
      const filename = `generated_${task.template.name}_${timestamp}_${task.id.slice(0, 8)}.jpg`;
      
      // Use the backend download API instead of direct URL
      const downloadUrl = `/api/download/${task.id}?${new URLSearchParams({
        url: task.generatedImageUrl,
        template: task.template.name,
        timestamp: Date.now().toString()
      })}`;
      
      await apiService.downloadFile(downloadUrl, filename);
      showToast('图片下载成功', 'success');
    } catch (err) {
      console.error('Download failed:', err);
      showToast(`下载失败: ${err instanceof Error ? err.message : '未知错误'}`, 'error');
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

  const handleRefresh = async (task: GenerationTask) => {
    if (wsConnected) {
      // 如果WebSocket连接正常，使用WebSocket刷新
      refreshTaskStatus(task.id);
      showToast('正在刷新任务状态...', 'info');
    } else {
      // 如果WebSocket未连接，直接调用API获取任务状态
      try {
        showToast('正在刷新任务状态...', 'info');
        const response = await apiService.getTask(task.id);
        if (response.success && response.data.task) {
          const { updateTask } = useTaskStore.getState();
          updateTask(task.id, response.data.task);
          showToast('任务状态已更新', 'success');
        } else {
          throw new Error('获取任务状态失败');
        }
      } catch (err) {
        console.error('Refresh task failed:', err);
        showToast('刷新失败，请重试', 'error');
      }
    }
  };

  const handleRetryLoad = () => {
    // 现在任务API已经实现，启用任务加载
    loadTasks();
  };

  const getTaskStats = () => {
    return {
      total: tasks.length,
      pending: tasks.filter(t => t.status === TaskStatus.PENDING).length,
      processing: tasks.filter(t => t.status === TaskStatus.PROCESSING).length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      failed: tasks.filter(t => t.status === TaskStatus.FAILED).length,
    };
  };

  const getActiveTasks = () => {
    return filteredAndSortedTasks.filter(task => 
      task.status === TaskStatus.PENDING || task.status === TaskStatus.PROCESSING
    );
  };

  const getCompletedTasks = () => {
    return filteredAndSortedTasks.filter(task => task.status === TaskStatus.COMPLETED);
  };

  const getFailedTasks = () => {
    return filteredAndSortedTasks.filter(task => task.status === TaskStatus.FAILED);
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
      {/* Header with Enhanced Statistics */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">作品仓库</h1>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span>管理您的AI艺术作品</span>
              {tasks.length > 0 && (
                <>
                  <span>•</span>
                  <span>总计 {tasks.length} 个任务</span>
                  <span>•</span>
                  <span>{getTaskStats().processing} 个进行中</span>
                  <span>•</span>
                  <span>{getTaskStats().completed} 个已完成</span>
                  {getTaskStats().failed > 0 && (
                    <>
                      <span>•</span>
                      <span className="text-red-600">{getTaskStats().failed} 个失败</span>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
          
          {/* WebSocket Connection Status */}
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                if (wsConnected) {
                  // 如果WebSocket连接正常，使用WebSocket刷新
                  refreshTaskStatus();
                  showToast('正在刷新任务状态...', 'info');
                } else {
                  // 如果WebSocket未连接，直接重新加载任务
                  loadTasks();
                  showToast('正在重新加载任务...', 'info');
                }
              }}
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

      {/* Tasks Display with Grouping */}
      {filteredAndSortedTasks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无作品</h3>
          <p className="text-gray-600 mb-4">您还没有创建任何AI艺术作品</p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-blue-800">开始创作</p>
                <p className="text-sm text-blue-700 mt-1">
                  前往<a href="/marketplace" className="underline hover:text-blue-900">模板商城</a>选择风格模板，或直接在<a href="/create" className="underline hover:text-blue-900">AI创作</a>页面开始创作
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Tasks Section */}
          {getActiveTasks().length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">进行中的任务</h2>
                <span className="text-sm text-gray-500">{getActiveTasks().length} 个任务</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getActiveTasks().map((task) => (
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
            </div>
          )}

          {/* Completed Tasks Section */}
          {getCompletedTasks().length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">已完成的作品</h2>
                <span className="text-sm text-gray-500">{getCompletedTasks().length} 个作品</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCompletedTasks().map((task) => (
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
            </div>
          )}

          {/* Failed Tasks Section */}
          {getFailedTasks().length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 text-red-600">失败的任务</h2>
                <span className="text-sm text-red-500">{getFailedTasks().length} 个任务</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFailedTasks().map((task) => (
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
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkspaceGallery;