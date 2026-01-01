/**
 * Database type definitions for future use
 */

export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
}

export interface DatabaseConfig {
  path: string;
  maxConnections?: number;
  timeout?: number;
}

export interface DatabaseHealth {
  isConnected: boolean;
  lastCheck: Date;
  error?: string;
}