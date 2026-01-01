import { DatabaseService } from './databaseService';
import fs from 'fs';
import path from 'path';

describe('DatabaseService', () => {
  let dbService: DatabaseService;
  let testDbPath: string;

  beforeEach(() => {
    // Create a test database service with a unique test database
    dbService = new DatabaseService();
    testDbPath = path.join(process.cwd(), 'data', `test-${Date.now()}-photo-butler.db`);
    
    // Override the dbPath for testing
    (dbService as any).dbPath = testDbPath;
  });

  afterEach(async () => {
    // Clean up: close connection and remove test database
    try {
      if (dbService.isAvailable()) {
        await dbService.close();
      }
    } catch (error) {
      // Ignore close errors in tests
    }
    
    // Clean up test database file
    try {
      if (fs.existsSync(testDbPath)) {
        fs.unlinkSync(testDbPath);
      }
    } catch (error) {
      // Ignore file cleanup errors
    }
  });

  describe('Database Initialization', () => {
    it('should initialize database successfully', async () => {
      const result = await dbService.initialize();
      
      expect(result).toBe(true);
      expect(dbService.isAvailable()).toBe(true);
      expect(fs.existsSync(testDbPath)).toBe(true);
    });

    it('should create users and orders tables', async () => {
      await dbService.initialize();
      const db = dbService.getConnection();
      
      expect(db).not.toBeNull();
      
      // Test that tables exist by querying them
      return new Promise<void>((resolve, reject) => {
        db!.get('SELECT COUNT(*) as count FROM users', (err, row: any) => {
          if (err) {
            reject(err);
          } else {
            expect(row.count).toBe(0);
            
            db!.get('SELECT COUNT(*) as count FROM orders', (err2, row2: any) => {
              if (err2) {
                reject(err2);
              } else {
                expect(row2.count).toBe(0);
                resolve();
              }
            });
          }
        });
      });
    });

    it('should handle initialization failure gracefully', async () => {
      // Set an invalid path to simulate failure
      (dbService as any).dbPath = '/invalid/path/that/does/not/exist/test.db';
      
      const result = await dbService.initialize();
      
      expect(result).toBe(false);
      expect(dbService.isAvailable()).toBe(false);
      expect(dbService.getConnection()).toBeNull();
    });
  });

  describe('Health Check', () => {
    it('should return true for healthy database', async () => {
      await dbService.initialize();
      
      const isHealthy = await dbService.healthCheck();
      
      expect(isHealthy).toBe(true);
    });

    it('should return false for unavailable database', async () => {
      // Don't initialize the database
      const isHealthy = await dbService.healthCheck();
      
      expect(isHealthy).toBe(false);
    });
  });

  describe('Connection Management', () => {
    it('should return null connection when not initialized', () => {
      const connection = dbService.getConnection();
      
      expect(connection).toBeNull();
    });

    it('should return valid connection when initialized', async () => {
      await dbService.initialize();
      
      const connection = dbService.getConnection();
      
      expect(connection).not.toBeNull();
    });

    it('should close connection properly', async () => {
      await dbService.initialize();
      expect(dbService.isAvailable()).toBe(true);
      
      await dbService.close();
      
      expect(dbService.isAvailable()).toBe(false);
      expect(dbService.getConnection()).toBeNull();
    });
  });
});