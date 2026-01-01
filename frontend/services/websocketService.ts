import { WebSocketMessage, GenerationTask, TaskStatus } from '../types';

export enum ConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface WebSocketServiceEvents {
  'connection-state-changed': (state: ConnectionState) => void;
  'task-update': (task: GenerationTask) => void;
  'task-complete': (task: GenerationTask) => void;
  'task-failed': (task: GenerationTask) => void;
}

export class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, ((data: any) => void)[]> = new Map();
  private connectionState: ConnectionState = ConnectionState.DISCONNECTED;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private heartbeatInterval = 30000; // 30 seconds

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.connectionState === ConnectionState.CONNECTED) {
        resolve();
        return;
      }

      this.setConnectionState(ConnectionState.CONNECTING);
      
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          this.setConnectionState(ConnectionState.CONNECTED);
          this.startHeartbeat();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket disconnected:', event.code, event.reason);
          this.stopHeartbeat();
          
          if (this.connectionState !== ConnectionState.DISCONNECTED) {
            this.setConnectionState(ConnectionState.DISCONNECTED);
            this.handleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.setConnectionState(ConnectionState.ERROR);
          reject(error);
        };
      } catch (error) {
        this.setConnectionState(ConnectionState.ERROR);
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.setConnectionState(ConnectionState.DISCONNECTED);
    this.stopHeartbeat();
    this.clearReconnectTimer();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      this.emit('connection-state-changed', state);
    }
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  private handleMessage(message: WebSocketMessage): void {
    // Handle specific task update messages
    switch (message.type) {
      case 'task_update':
        // Enhanced task update handling with progress tracking
        if (message.data) {
          const task = message.data as GenerationTask;
          console.log(`Received task update: ${task.id} - ${task.status} (${task.progress}%)`);
          this.emit('task-update', task);
        }
        break;
      case 'task_complete':
        // Handle task completion
        if (message.data) {
          const task = message.data as GenerationTask;
          console.log(`Task completed: ${task.id}`);
          this.emit('task-complete', task);
        }
        break;
      case 'task_failed':
        // Handle task failure
        if (message.data) {
          const task = message.data as GenerationTask;
          console.log(`Task failed: ${task.id} - ${task.errorMessage || 'Unknown error'}`);
          this.emit('task-failed', task);
        }
        break;
      case 'pong':
        // Handle heartbeat response
        console.log('Received pong from server');
        break;
      default:
        // Handle generic message types
        const listeners = this.listeners.get(message.type) || [];
        listeners.forEach(listener => listener(message.data));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.setConnectionState(ConnectionState.RECONNECTING);
      
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimer = setTimeout(() => {
        this.connect().catch(error => {
          console.error('Reconnection failed:', error);
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.setConnectionState(ConnectionState.ERROR);
          }
        });
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.setConnectionState(ConnectionState.ERROR);
    }
  }

  on(eventType: string, callback: (data: any) => void): void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }
    this.listeners.get(eventType)!.push(callback);
  }

  off(eventType: string, callback: (data: any) => void): void {
    const listeners = this.listeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(eventType: string, data: any): void {
    const listeners = this.listeners.get(eventType) || [];
    listeners.forEach(listener => listener(data));
  }

  send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  // Task-specific helper methods
  subscribeToTaskUpdates(callback: (task: GenerationTask) => void): void {
    this.on('task-update', callback);
    this.on('task-complete', callback);
    this.on('task-failed', callback);
  }

  unsubscribeFromTaskUpdates(callback: (task: GenerationTask) => void): void {
    this.off('task-update', callback);
    this.off('task-complete', callback);
    this.off('task-failed', callback);
  }

  // Request status update for specific task
  requestTaskStatus(taskId: string): void {
    if (this.isConnected()) {
      this.send({
        type: 'request_task_status',
        data: { taskId }
      });
    }
  }

  // Request status updates for all user tasks
  requestAllTasksStatus(): void {
    if (this.isConnected()) {
      this.send({
        type: 'request_all_tasks_status'
      });
    }
  }
}

// Singleton instance
let wsService: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!wsService) {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';
    wsService = new WebSocketService(wsUrl);
  }
  return wsService;
};

export default WebSocketService;