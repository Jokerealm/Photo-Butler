/**
 * Integration test for the async task generation system
 * Tests the integration between TaskStore, WebSocketService, and ApiService
 */

import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from '../../stores/taskStore';
import { getWebSocketService } from '../../services/websocketService';
import { apiService } from '../../services/apiService';
import { TaskStatus } from '../../types';

// Mock the API service
jest.mock('../../services/apiService');
const mockApiService = apiService as jest.Mocked<typeof apiService>;

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  send: jest.fn(),
  readyState: WebSocket.OPEN,
}));

describe('Async Task Generation System Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a task and add it to the store', async () => {
    // Mock successful task creation
    const mockTask = {
      id: 'test-task-1',
      userId: 'user1',
      templateId: 'template1',
      template: {
        id: 'template1',
        name: 'Test Template',
        description: 'Test Description',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      originalImageUrl: '/original.jpg',
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    mockApiService.createTask.mockResolvedValue({
      success: true,
      data: { task: mockTask },
    });

    const { result } = renderHook(() => useTaskStore());

    // Create a task
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    await act(async () => {
      const createdTask = await result.current.createTask('template1', file);
      expect(createdTask).toEqual(mockTask);
    });

    // Verify task was added to store
    expect(result.current.tasks).toContain(mockTask);
    expect(mockApiService.createTask).toHaveBeenCalledWith('template1', file);
  });

  it('should handle task updates via WebSocket', async () => {
    const { result } = renderHook(() => useTaskStore());
    
    // Add initial task
    const initialTask = {
      id: 'test-task-2',
      userId: 'user1',
      templateId: 'template1',
      template: {
        id: 'template1',
        name: 'Test Template',
        description: 'Test Description',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      originalImageUrl: '/original.jpg',
      status: TaskStatus.PENDING,
      progress: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addTask(initialTask);
    });

    // Simulate WebSocket task update
    const updatedTask = {
      ...initialTask,
      status: TaskStatus.PROCESSING,
      progress: 50,
    };

    act(() => {
      result.current.updateTask('test-task-2', {
        status: TaskStatus.PROCESSING,
        progress: 50,
      });
    });

    // Verify task was updated
    const task = result.current.tasks.find(t => t.id === 'test-task-2');
    expect(task?.status).toBe(TaskStatus.PROCESSING);
    expect(task?.progress).toBe(50);
  });

  it('should handle task retry functionality', async () => {
    mockApiService.retryTask.mockResolvedValue({
      success: true,
      data: {
        task: {
          id: 'test-task-3',
          status: TaskStatus.PENDING,
          progress: 0,
        },
      },
    });

    const { result } = renderHook(() => useTaskStore());

    await act(async () => {
      await result.current.retryTask('test-task-3');
    });

    expect(mockApiService.retryTask).toHaveBeenCalledWith('test-task-3');
  });

  it('should handle task deletion', async () => {
    mockApiService.deleteTask.mockResolvedValue({
      success: true,
      data: {},
    });

    const { result } = renderHook(() => useTaskStore());

    // Add a task first
    const taskToDelete = {
      id: 'test-task-4',
      userId: 'user1',
      templateId: 'template1',
      template: {
        id: 'template1',
        name: 'Test Template',
        description: 'Test Description',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        tags: ['test'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      originalImageUrl: '/original.jpg',
      status: TaskStatus.COMPLETED,
      progress: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    act(() => {
      result.current.addTask(taskToDelete);
    });

    // Delete the task
    await act(async () => {
      await result.current.deleteTask('test-task-4');
    });

    // Verify task was removed
    expect(result.current.tasks.find(t => t.id === 'test-task-4')).toBeUndefined();
    expect(mockApiService.deleteTask).toHaveBeenCalledWith('test-task-4');
  });

  it('should handle WebSocket connection state', () => {
    const { result } = renderHook(() => useTaskStore());

    // Test connection state changes
    act(() => {
      result.current.setWsConnected(true);
    });

    expect(result.current.wsConnected).toBe(true);

    act(() => {
      result.current.setWsConnected(false);
    });

    expect(result.current.wsConnected).toBe(false);
  });

  it('should filter and sort tasks correctly', () => {
    const { result } = renderHook(() => useTaskStore());

    const tasks = [
      {
        id: 'task1',
        status: TaskStatus.COMPLETED,
        createdAt: new Date('2024-01-01'),
        template: { name: 'A Template' },
      },
      {
        id: 'task2',
        status: TaskStatus.PROCESSING,
        createdAt: new Date('2024-01-02'),
        template: { name: 'B Template' },
      },
      {
        id: 'task3',
        status: TaskStatus.FAILED,
        createdAt: new Date('2024-01-03'),
        template: { name: 'C Template' },
      },
    ] as any[];

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
    const sortedTasks = result.current.getSortedTasks(tasks);
    expect(sortedTasks[0].createdAt.getTime()).toBeGreaterThan(
      sortedTasks[1].createdAt.getTime()
    );
  });
});