import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from './taskStore';
import { TaskStatus } from '../types';

// Mock the WebSocket service
jest.mock('../services/websocketService', () => ({
  getWebSocketService: () => ({
    connect: jest.fn().mockResolvedValue(undefined),
    disconnect: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    subscribeToTaskUpdates: jest.fn(),
    unsubscribeFromTaskUpdates: jest.fn(),
    requestTaskStatus: jest.fn(),
    requestAllTasksStatus: jest.fn(),
  })
}));

// Mock the API service
jest.mock('../services/apiService', () => ({
  apiService: {
    getTasks: jest.fn().mockResolvedValue({
      success: true,
      data: {
        tasks: []
      }
    }),
    createTask: jest.fn(),
    retryTask: jest.fn(),
    deleteTask: jest.fn()
  }
}));

describe('TaskStore Real-time Updates', () => {
  beforeEach(() => {
    // Reset the store state before each test
    const { result } = renderHook(() => useTaskStore());
    act(() => {
      result.current.setTasks([]);
      result.current.setError(null);
      result.current.setLoading(false);
      result.current.setWsConnected(false);
    });
  });

  test('should initialize WebSocket connection', () => {
    const { result } = renderHook(() => useTaskStore());
    
    act(() => {
      result.current.initializeWebSocket();
    });
    
    // WebSocket initialization should not throw errors
    expect(result.current.wsConnected).toBe(false); // Initially false until connection is established
  });

  test('should update task with real-time data', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const mockTask = {
      id: 'task_1',
      userId: 'user_1',
      templateId: 'template_1',
      template: {
        id: 'template_1',
        name: 'Test Template',
        description: 'Test Description',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      originalImageUrl: '/original.jpg',
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add initial task
    act(() => {
      result.current.addTask(mockTask);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0].status).toBe(TaskStatus.PENDING);

    // Update task status (simulating WebSocket update)
    act(() => {
      result.current.updateTask('task_1', {
        status: TaskStatus.PROCESSING,
        progress: 50
      });
    });

    expect(result.current.tasks[0].status).toBe(TaskStatus.PROCESSING);
    expect(result.current.tasks[0].progress).toBe(50);
  });

  test('should handle task completion', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const mockTask = {
      id: 'task_1',
      userId: 'user_1',
      templateId: 'template_1',
      template: {
        id: 'template_1',
        name: 'Test Template',
        description: 'Test Description',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      originalImageUrl: '/original.jpg',
      status: TaskStatus.PROCESSING,
      progress: 50,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add processing task
    act(() => {
      result.current.addTask(mockTask);
    });

    // Complete the task (simulating WebSocket completion event)
    act(() => {
      result.current.updateTask('task_1', {
        status: TaskStatus.COMPLETED,
        progress: 100,
        generatedImageUrl: '/generated.jpg',
        completedAt: new Date()
      });
    });

    const completedTask = result.current.tasks[0];
    expect(completedTask.status).toBe(TaskStatus.COMPLETED);
    expect(completedTask.progress).toBe(100);
    expect(completedTask.generatedImageUrl).toBe('/generated.jpg');
    expect(completedTask.completedAt).toBeDefined();
  });

  test('should handle task failure', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const mockTask = {
      id: 'task_1',
      userId: 'user_1',
      templateId: 'template_1',
      template: {
        id: 'template_1',
        name: 'Test Template',
        description: 'Test Description',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      originalImageUrl: '/original.jpg',
      status: TaskStatus.PROCESSING,
      progress: 30,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add processing task
    act(() => {
      result.current.addTask(mockTask);
    });

    // Fail the task (simulating WebSocket failure event)
    act(() => {
      result.current.updateTask('task_1', {
        status: TaskStatus.FAILED,
        errorMessage: 'Generation failed due to network error'
      });
    });

    const failedTask = result.current.tasks[0];
    expect(failedTask.status).toBe(TaskStatus.FAILED);
    expect(failedTask.errorMessage).toBe('Generation failed due to network error');
  });

  test('should filter and sort tasks correctly', () => {
    const { result } = renderHook(() => useTaskStore());
    
    const tasks = [
      {
        id: 'task_1',
        userId: 'user_1',
        templateId: 'template_1',
        template: {
          id: 'template_1',
          name: 'Template A',
          description: 'Test Description',
          previewUrl: '/test.jpg',
          prompt: 'test prompt',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        originalImageUrl: '/original.jpg',
        status: TaskStatus.COMPLETED,
        progress: 100,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date()
      },
      {
        id: 'task_2',
        userId: 'user_1',
        templateId: 'template_2',
        template: {
          id: 'template_2',
          name: 'Template B',
          description: 'Test Description',
          previewUrl: '/test.jpg',
          prompt: 'test prompt',
          tags: ['test'],
          createdAt: new Date(),
          updatedAt: new Date()
        },
        originalImageUrl: '/original.jpg',
        status: TaskStatus.PROCESSING,
        progress: 50,
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date()
      }
    ];

    // Add tasks
    act(() => {
      result.current.setTasks(tasks);
    });

    // Test filtering by status
    act(() => {
      result.current.setFilter({ status: [TaskStatus.COMPLETED] });
    });

    const filteredTasks = result.current.getFilteredTasks();
    expect(filteredTasks).toHaveLength(1);
    expect(filteredTasks[0].status).toBe(TaskStatus.COMPLETED);

    // Test sorting
    const sortedTasks = result.current.getSortedTasks(result.current.tasks);
    expect(sortedTasks[0].createdAt.getTime()).toBeGreaterThan(sortedTasks[1].createdAt.getTime());
  });

  test('should handle WebSocket connection state changes', () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Initially disconnected
    expect(result.current.wsConnected).toBe(false);
    
    // Simulate connection
    act(() => {
      result.current.setWsConnected(true);
    });
    
    expect(result.current.wsConnected).toBe(true);
    
    // Simulate disconnection
    act(() => {
      result.current.setWsConnected(false);
    });
    
    expect(result.current.wsConnected).toBe(false);
  });
});