import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  private isInitialized: boolean = false;

  constructor() {
    // Create database directory if it doesn't exist
    const dbDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = path.join(dbDir, 'photo-butler.db');
  }

  /**
   * Initialize database connection and create tables
   * This method is designed to fail gracefully - if database setup fails,
   * the application should continue to work with localStorage only
   */
  async initialize(): Promise<boolean> {
    try {
      await this.connect();
      await this.createTables();
      this.isInitialized = true;
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization failed:', error);
      console.log('Application will continue without database functionality');
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * Establish database connection
   */
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          resolve();
        }
      });
    });
  }

  /**
   * Create database tables (users and orders for future use)
   */
  private async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        status VARCHAR(20) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;

    return new Promise((resolve, reject) => {
      this.db!.serialize(() => {
        this.db!.run(createUsersTable, (err) => {
          if (err) {
            console.error('Error creating users table:', err);
            reject(err);
            return;
          }
          console.log('Users table created or already exists');
        });

        this.db!.run(createOrdersTable, (err) => {
          if (err) {
            console.error('Error creating orders table:', err);
            reject(err);
            return;
          }
          console.log('Orders table created or already exists');
          resolve();
        });
      });
    });
  }

  /**
   * Get database connection (returns null if not initialized)
   */
  getConnection(): sqlite3.Database | null {
    return this.isInitialized ? this.db : null;
  }

  /**
   * Check if database is available
   */
  isAvailable(): boolean {
    return this.isInitialized && this.db !== null;
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
            reject(err);
          } else {
            console.log('Database connection closed');
            this.db = null;
            this.isInitialized = false;
            resolve();
          }
        });
      });
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    return new Promise((resolve) => {
      this.db!.get('SELECT 1', (err) => {
        if (err) {
          console.error('Database health check failed:', err);
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }
}

// Singleton instance
export const databaseService = new DatabaseService();