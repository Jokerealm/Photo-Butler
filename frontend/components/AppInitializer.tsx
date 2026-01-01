'use client';

import { useEffect } from 'react';
import { useTaskStore } from '../stores/taskStore';

/**
 * AppInitializer component handles the initialization of global services
 * including WebSocket connection and task store setup
 */
export default function AppInitializer({ children }: { children: React.ReactNode }) {
  const { initializeWebSocket, cleanupWebSocket, loadTasks } = useTaskStore();

  useEffect(() => {
    // Initialize WebSocket connection for real-time task updates
    initializeWebSocket();

    // TODO: Load initial tasks when task API is implemented
    // loadTasks().catch(error => {
    //   console.error('Failed to load initial tasks:', error);
    // });

    // Cleanup on unmount
    return () => {
      cleanupWebSocket();
    };
  }, [initializeWebSocket, cleanupWebSocket]);

  return <>{children}</>;
}