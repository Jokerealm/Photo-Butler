import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { logger } from '../utils/logger';

export interface WebSocketMessage {
  type: string;
  data?: any;
}

export class WebSocketService {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, WebSocket> = new Map();

  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, ws);
      
      logger.info(`WebSocket client connected: ${clientId} from ${request.socket.remoteAddress}`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection_established',
        data: { clientId, timestamp: new Date().toISOString() }
      });

      ws.on('message', (data: Buffer) => {
        try {
          const message: WebSocketMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          logger.error(`Invalid WebSocket message from ${clientId}:`, error);
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: 'Invalid message format' }
          });
        }
      });

      ws.on('close', () => {
        logger.info(`WebSocket client disconnected: ${clientId}`);
        this.clients.delete(clientId);
      });

      ws.on('error', (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });

      // Send ping every 30 seconds to keep connection alive
      const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          this.sendToClient(clientId, { type: 'ping' });
        } else {
          clearInterval(pingInterval);
        }
      }, 30000);
    });

    logger.info('WebSocket server initialized on /ws');
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private handleMessage(clientId: string, message: WebSocketMessage): void {
    logger.debug(`Received message from ${clientId}:`, message);

    switch (message.type) {
      case 'ping':
        this.sendToClient(clientId, { type: 'pong' });
        break;
      
      case 'pong':
        // Client responded to our ping
        break;
      
      case 'request_task_status':
        // Handle task status request
        if (message.data?.taskId) {
          this.handleTaskStatusRequest(clientId, message.data.taskId).catch(error => {
            logger.error('Error handling task status request:', error);
          });
        }
        break;
      
      case 'request_all_tasks_status':
        // Handle all tasks status request
        this.handleAllTasksStatusRequest(clientId).catch(error => {
          logger.error('Error handling all tasks status request:', error);
        });
        break;
      
      default:
        logger.warn(`Unknown message type from ${clientId}: ${message.type}`);
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: `Unknown message type: ${message.type}` }
        });
    }
  }

  private async handleTaskStatusRequest(clientId: string, taskId: string): Promise<void> {
    try {
      // Import taskService dynamically to avoid circular dependencies
      const { taskService } = await import('./taskService');
      const task = await taskService.getTaskById(taskId);
      
      if (task) {
        this.sendToClient(clientId, {
          type: 'task_update',
          data: task
        });
      } else {
        this.sendToClient(clientId, {
          type: 'error',
          data: { message: `Task not found: ${taskId}` }
        });
      }
    } catch (error) {
      logger.error(`Failed to get task status for ${taskId}:`, error);
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Failed to get task status' }
      });
    }
  }

  private async handleAllTasksStatusRequest(clientId: string): Promise<void> {
    try {
      // Import taskService dynamically to avoid circular dependencies
      const { taskService } = await import('./taskService');
      const tasks = await taskService.getAllTasks();
      
      // Send individual task updates for each task
      tasks.forEach(task => {
        this.sendToClient(clientId, {
          type: 'task_update',
          data: task
        });
      });
      
      // Send completion message
      this.sendToClient(clientId, {
        type: 'all_tasks_status_complete',
        data: { 
          count: tasks.length,
          message: `Sent status for ${tasks.length} tasks`
        }
      });
    } catch (error) {
      logger.error('Failed to get all tasks status:', error);
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Failed to get tasks status' }
      });
    }
  }

  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Failed to send message to client ${clientId}:`, error);
        this.clients.delete(clientId);
      }
    }
  }

  broadcast(message: WebSocketMessage, excludeClientId?: string): void {
    const messageStr = JSON.stringify(message);
    
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (error) {
          logger.error(`Failed to broadcast to client ${clientId}:`, error);
          this.clients.delete(clientId);
        }
      }
    });
  }

  // Task-specific broadcast methods
  broadcastTaskUpdate(taskId: string, status: string, progress: number, message?: string): void {
    this.broadcast({
      type: 'task_update',
      data: {
        taskId,
        status,
        progress,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  broadcastTaskComplete(taskId: string, result?: any): void {
    this.broadcast({
      type: 'task_complete',
      data: {
        taskId,
        status: 'completed',
        progress: 100,
        result,
        timestamp: new Date().toISOString()
      }
    });
  }

  broadcastTaskFailed(taskId: string, error: string): void {
    this.broadcast({
      type: 'task_failed',
      data: {
        taskId,
        status: 'failed',
        error,
        timestamp: new Date().toISOString()
      }
    });
  }

  getConnectedClientsCount(): number {
    return this.clients.size;
  }

  close(): void {
    if (this.wss) {
      this.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.close();
        }
      });
      this.clients.clear();
      this.wss.close();
      logger.info('WebSocket server closed');
    }
  }
}

// Singleton instance
export const websocketService = new WebSocketService();