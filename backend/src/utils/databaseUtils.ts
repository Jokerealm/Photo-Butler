import { databaseService } from '../services/databaseService';
import { User, Order } from '../types/database';

/**
 * Database utility functions for future use
 * These functions provide a higher-level interface to database operations
 */

export class DatabaseUtils {
  /**
   * Check if database is available for use
   */
  static isAvailable(): boolean {
    return databaseService.isAvailable();
  }

  /**
   * Get database health status
   */
  static async getHealthStatus(): Promise<boolean> {
    return await databaseService.healthCheck();
  }

  /**
   * User operations (for future implementation)
   */
  static async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<number | null> {
    const db = databaseService.getConnection();
    if (!db) {
      console.log('Database not available, user creation skipped');
      return null;
    }

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO users (username, email, password_hash)
        VALUES (?, ?, ?)
      `);
      
      stmt.run([userData.username, userData.email, userData.password_hash], function(err) {
        if (err) {
          console.error('Error creating user:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  /**
   * Order operations (for future implementation)
   */
  static async createOrder(orderData: Omit<Order, 'id' | 'created_at'>): Promise<number | null> {
    const db = databaseService.getConnection();
    if (!db) {
      console.log('Database not available, order creation skipped');
      return null;
    }

    return new Promise((resolve, reject) => {
      const stmt = db.prepare(`
        INSERT INTO orders (user_id, amount, status)
        VALUES (?, ?, ?)
      `);
      
      stmt.run([orderData.user_id, orderData.amount, orderData.status], function(err) {
        if (err) {
          console.error('Error creating order:', err);
          reject(err);
        } else {
          resolve(this.lastID);
        }
      });
      
      stmt.finalize();
    });
  }

  /**
   * Get user by ID (for future implementation)
   */
  static async getUserById(id: number): Promise<User | null> {
    const db = databaseService.getConnection();
    if (!db) {
      return null;
    }

    return new Promise((resolve, reject) => {
      db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
        if (err) {
          console.error('Error fetching user:', err);
          reject(err);
        } else {
          resolve(row as User || null);
        }
      });
    });
  }

  /**
   * Get orders by user ID (for future implementation)
   */
  static async getOrdersByUserId(userId: number): Promise<Order[]> {
    const db = databaseService.getConnection();
    if (!db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      db.all('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId], (err, rows) => {
        if (err) {
          console.error('Error fetching orders:', err);
          reject(err);
        } else {
          resolve(rows as Order[] || []);
        }
      });
    });
  }
}