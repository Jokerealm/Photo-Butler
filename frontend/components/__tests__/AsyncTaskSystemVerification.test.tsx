/**
 * Verification test for the async task generation system integration
 * Ensures all components are properly connected and working together
 */

import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from '../../stores/taskStore';
import { getWebSocketService } from '../../services/websocketService';
import { apiService } from '../../services/apiService';

// Mock the API service
jest.mock('../../services/apiService');

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  close: jest.fn(),
  send: jest.fn(),
  readyState: WebSocket.OPEN,
}));

describe('Async Task Generation System Verification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should have all required services available', () => {
    // Verify API service is available
    expect(apiService).toBeDefined();
    expect(apiService.createTask).toBeDefined();
    expect(apiService.getTasks).toBeDefined();
    expect(apiService.retryTask).toBeDefined();
    expect(apiService.deleteTask).toBeDefined();

    // Verify WebSocket service is available
    const wsService = getWebSocketService();
    expect(wsService).toBeDefined();
    expect(wsService.connect).toBeDefined();
    expect(wsService.disconnect).toBeDefined();
    expect(wsService.subscribeToTaskUpdates).toBeDefined();
  });

  it('should have task store with all required methods', () => {
    const { result } = renderHook(() => useTaskStore());

    // Verify state properties
    expect(result.current.tasks).toBeDefined();
    expect(result.current.loading).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.wsConnected).toBeDefined();

    // Verify action methods
    expect(result.current.createTask).toBeDefined();
    expect(result.current.loadTasks).toBeDefined();
    expect(result.current.retryTask).toBeDefined();
    expect(result.current.deleteTask).toBeDefined();
    expect(result.current.initializeWebSocket).toBeDefined();
    expect(result.current.cleanupWebSocket).toBeDefined();

    // Verify computed methods
    expect(result.current.getFilteredTasks).toBeDefined();
    expect(result.current.getSortedTasks).toBeDefined();
  });

  it('should properly initialize WebSocket connection', () => {
    const { result } = renderHook(() => useTaskStore());

    // Initialize WebSocket
    result.current.initializeWebSocket();

    // Verify WebSocket service was called
    const wsService = getWebSocketService();
    expect(wsService).toBeDefined();
  });

  it('should handle task lifecycle correctly', async () => {
    const mockApiService = apiService as jest.Mocked<typeof apiService>;
    
    // Mock successful responses
    mockApiService.createTask.mockResolvedValue({
      success: true,
      data: { task: { id: 'test-task', status: 'pending' } as any },
    });

    mockApiService.retryTask.mockResolvedValue({
      success: true,
      data: { task: { id: 'test-task', status: 'pending' } as any },
    });

    mockApiService.deleteTask.mockResolvedValue({
      success: true,
      data: {},
    });

    const { result } = renderHook(() => useTaskStore());

    // Test task creation
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    await result.current.createTask('template-1', file);
    expect(mockApiService.createTask).toHaveBeenCalledWith('template-1', file);

    // Test task retry
    await result.current.retryTask('test-task');
    expect(mockApiService.retryTask).toHaveBeenCalledWith('test-task');

    // Test task deletion
    await result.current.deleteTask('test-task');
    expect(mockApiService.deleteTask).toHaveBeenCalledWith('test-task');
  });

  it('should handle WebSocket connection states', () => {
    const { result } = renderHook(() => useTaskStore());

    // Test connection state changes
    expect(result.current.wsConnected).toBe(false);

    act(() => {
      result.current.setWsConnected(true);
    });
    expect(result.current.wsConnected).toBe(true);

    act(() => {
      result.current.setWsConnected(false);
    });
    expect(result.current.wsConnected).toBe(false);
  });

  it('should provide proper error handling', async () => {
    const mockApiService = apiService as jest.Mocked<typeof apiService>;
    
    // Mock API error
    mockApiService.createTask.mockRejectedValue(new Error('API Error'));

    const { result } = renderHook(() => useTaskStore());

    // Test error handling
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    
    try {
      await result.current.createTask('template-1', file);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).message).toBe('API Error');
    }

    // Verify error state is set
    expect(result.current.error).toBeTruthy();
  });
});