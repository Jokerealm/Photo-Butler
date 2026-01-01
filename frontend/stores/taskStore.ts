import { create } from 'zustand';
import { GenerationTask, TaskStatus, TaskFilter, TaskSortOption } from '../types';
import { apiService } from '../services/apiService';
import { getWebSocketService } from '../services/websocketService';

interface TaskStore {
  // State
  tasks: GenerationTask[];
  loading: boolean;
  error: string | null;
  filter: TaskFilter;
  sortBy: TaskSortOption;
  wsConnected: boolean;

  // Actions
  setTasks: (tasks: GenerationTask[]) => void;
  addTask: (task: GenerationTask) => void;
  updateTask: (taskId: string, updates: Partial<GenerationTask>) => void;
  removeTask: (taskId: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setFilter: (filter: TaskFilter) => void;
  setSortBy: (sortBy: TaskSortOption) => void;
  setWsConnected: (connected: boolean) => void;
  
  // Task operations
  loadTasks: () => Promise<void>;
  createTask: (templateId: string, imageFile: File) => Promise<GenerationTask>;
  retryTask: (taskId: string) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  // WebSocket integration
  initializeWebSocket: () => void;
  cleanupWebSocket: () => void;
  refreshTaskStatus: (taskId?: string) => void;
  
  // Computed values
  getFilteredTasks: () => GenerationTask[];
  getSortedTasks: (tasks: GenerationTask[]) => GenerationTask[];
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  // Initial state
  tasks: [],
  loading: false,
  error: null,
  filter: {},
  sortBy: TaskSortOption.CREATED_DESC,
  wsConnected: false,

  // Basic actions
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({ 
    tasks: [task, ...state.tasks] 
  })),
  
  updateTask: (taskId, updates) => set((state) => ({
    tasks: state.tasks.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    )
  })),
  
  removeTask: (taskId) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== taskId)
  })),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setFilter: (filter) => set({ filter }),
  
  setSortBy: (sortBy) => set({ sortBy }),
  
  setWsConnected: (wsConnected) => set({ wsConnected }),

  // Task operations
  loadTasks: async () => {
    set({ loading: true, error: null });
    
    try {
      const response = await apiService.getTasks();
      if (response.success) {
        set({ tasks: response.data.tasks, loading: false });
      } else {
        throw new Error('Failed to load tasks');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tasks';
      set({ error: errorMessage, loading: false });
    }
  },

  createTask: async (templateId: string, imageFile: File) => {
    try {
      const response = await apiService.createTask(templateId, imageFile);
      if (response.success) {
        const task = response.data.task;
        get().addTask(task);
        return task;
      } else {
        throw new Error('Failed to create task');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      set({ error: errorMessage });
      throw error;
    }
  },

  retryTask: async (taskId: string) => {
    try {
      const response = await apiService.retryTask(taskId);
      if (response.success) {
        get().updateTask(taskId, response.data.task);
      } else {
        throw new Error('Failed to retry task');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry task';
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    try {
      await apiService.deleteTask(taskId);
      get().removeTask(taskId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete task';
      set({ error: errorMessage });
      throw error;
    }
  },

  // WebSocket integration
  initializeWebSocket: () => {
    const wsService = getWebSocketService();
    
    // Handle connection state changes
    wsService.on('connection-state-changed', (state) => {
      set({ wsConnected: state === 'connected' });
      
      // Clear error when reconnected
      if (state === 'connected') {
        set({ error: null });
      }
    });

    // Handle task updates with enhanced progress tracking
    const handleTaskUpdate = (task: GenerationTask) => {
      const currentTask = get().tasks.find(t => t.id === task.id);
      
      // Calculate estimated completion time for processing tasks
      if (task.status === TaskStatus.PROCESSING && task.progress > 0 && !task.estimatedCompletionTime) {
        const now = new Date();
        const startTime = currentTask ? new Date(currentTask.createdAt) : now;
        const elapsedMs = now.getTime() - startTime.getTime();
        const progressRate = task.progress / 100;
        
        if (progressRate > 0) {
          const totalEstimatedMs = elapsedMs / progressRate;
          const remainingMs = totalEstimatedMs - elapsedMs;
          task.estimatedCompletionTime = new Date(now.getTime() + remainingMs);
        }
      }
      
      // Update task with real-time data
      get().updateTask(task.id, {
        ...task,
        updatedAt: new Date(),
        // Set completion time when task completes
        completedAt: task.status === TaskStatus.COMPLETED ? new Date() : task.completedAt
      });
      
      console.log(`Task ${task.id} updated: ${task.status} (${task.progress}%)`);
    };

    // Handle task completion events
    const handleTaskComplete = (task: GenerationTask) => {
      get().updateTask(task.id, {
        ...task,
        status: TaskStatus.COMPLETED,
        progress: 100,
        completedAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log(`Task ${task.id} completed successfully`);
    };

    // Handle task failure events
    const handleTaskFailed = (task: GenerationTask) => {
      get().updateTask(task.id, {
        ...task,
        status: TaskStatus.FAILED,
        updatedAt: new Date(),
        // Clear estimated completion time on failure
        estimatedCompletionTime: undefined
      });
      
      console.log(`Task ${task.id} failed: ${task.errorMessage || 'Unknown error'}`);
    };

    // Subscribe to all task events
    wsService.on('task-update', handleTaskUpdate);
    wsService.on('task-complete', handleTaskComplete);
    wsService.on('task-failed', handleTaskFailed);
    
    // Connect to WebSocket
    wsService.connect().then(() => {
      // Request status updates for all tasks when connected
      wsService.requestAllTasksStatus();
    }).catch(error => {
      console.error('Failed to connect to WebSocket:', error);
      set({ error: 'Failed to connect to real-time updates' });
    });
  },

  cleanupWebSocket: () => {
    const wsService = getWebSocketService();
    wsService.disconnect();
  },

  refreshTaskStatus: (taskId?: string) => {
    const wsService = getWebSocketService();
    if (taskId) {
      wsService.requestTaskStatus(taskId);
    } else {
      wsService.requestAllTasksStatus();
    }
  },
  
  getFilteredTasks: () => {
    const { tasks, filter } = get();
    let filtered = [...tasks];

    // Filter by status
    if (filter.status && filter.status.length > 0) {
      filtered = filtered.filter(task => filter.status!.includes(task.status));
    }

    // Filter by template
    if (filter.templateId) {
      filtered = filtered.filter(task => task.templateId === filter.templateId);
    }

    // Filter by date range
    if (filter.dateRange) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt);
        return taskDate >= filter.dateRange!.start && taskDate <= filter.dateRange!.end;
      });
    }

    return filtered;
  },
  
  getSortedTasks: (tasks) => {
    const { sortBy } = get();
    const sorted = [...tasks];

    switch (sortBy) {
      case TaskSortOption.CREATED_DESC:
        return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      case TaskSortOption.CREATED_ASC:
        return sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case TaskSortOption.STATUS:
        return sorted.sort((a, b) => a.status.localeCompare(b.status));
      case TaskSortOption.TEMPLATE:
        return sorted.sort((a, b) => a.template.name.localeCompare(b.template.name));
      default:
        return sorted;
    }
  },
}));