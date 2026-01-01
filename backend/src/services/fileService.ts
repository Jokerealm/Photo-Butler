import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export class FileService {
  private uploadDir: string;
  private thumbnailDir: string;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.thumbnailDir = path.join(this.uploadDir, 'thumbnails');
    this.ensureUploadDirExists();
    this.startPeriodicCleanup();
  }

  /**
   * Ensure uploads directory exists
   */
  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    if (!fs.existsSync(this.thumbnailDir)) {
      fs.mkdirSync(this.thumbnailDir, { recursive: true });
    }
  }

  /**
   * Start periodic cleanup process
   */
  private startPeriodicCleanup(): void {
    // Clean up every hour
    this.cleanupInterval = setInterval(() => {
      this.performScheduledCleanup();
    }, 60 * 60 * 1000); // 1 hour

    // Also clean up on startup
    setTimeout(() => {
      this.performScheduledCleanup();
    }, 5000); // 5 seconds after startup
  }

  /**
   * Perform scheduled cleanup of old files
   */
  private async performScheduledCleanup(): Promise<void> {
    try {
      logger.info('Starting scheduled file cleanup');
      
      const results = await Promise.allSettled([
        this.cleanupOldFiles(),
        this.cleanupOldThumbnails(),
        this.cleanupOrphanedFiles()
      ]);

      const errors = results
        .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
        .map(result => result.reason);

      if (errors.length > 0) {
        logger.warn('Some cleanup operations failed', { errors });
      } else {
        logger.info('Scheduled file cleanup completed successfully');
      }
    } catch (error) {
      logger.error('Error during scheduled cleanup', { error });
    }
  }

  /**
   * Clean up old temporary files (older than specified age)
   */
  public async cleanupOldFiles(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        // Skip directories (like thumbnails)
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          continue;
        }

        if (now - stats.mtime.getTime() > maxAge) {
          try {
            fs.unlinkSync(filePath);
            cleanedCount++;
            logger.info('Cleaned up old file', { file, age: now - stats.mtime.getTime() });
          } catch (error) {
            logger.warn('Failed to delete old file', { file, error });
          }
        }
      }

      logger.info('Old files cleanup completed', { cleanedCount, maxAge });
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up old files', { error });
      throw error;
    }
  }

  /**
   * Clean up old thumbnail files
   */
  public async cleanupOldThumbnails(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    try {
      if (!fs.existsSync(this.thumbnailDir)) {
        return 0;
      }

      const files = fs.readdirSync(this.thumbnailDir);
      const now = Date.now();
      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.thumbnailDir, file);
        const stats = fs.statSync(filePath);

        if (now - stats.mtime.getTime() > maxAge) {
          try {
            fs.unlinkSync(filePath);
            cleanedCount++;
            logger.info('Cleaned up old thumbnail', { file, age: now - stats.mtime.getTime() });
          } catch (error) {
            logger.warn('Failed to delete old thumbnail', { file, error });
          }
        }
      }

      logger.info('Old thumbnails cleanup completed', { cleanedCount, maxAge });
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up old thumbnails', { error });
      throw error;
    }
  }

  /**
   * Clean up orphaned files (files without corresponding records)
   */
  public async cleanupOrphanedFiles(): Promise<number> {
    try {
      const files = fs.readdirSync(this.uploadDir);
      let cleanedCount = 0;

      // Look for temporary files that might be left over from failed uploads
      const tempFilePatterns = [
        /^temp_\d+\./,  // temp_timestamp.ext
        /^upload_\w+$/,  // upload_randomstring (no extension)
        /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}\.tmp$/  // UUID.tmp files
      ];

      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.isDirectory()) {
          continue;
        }

        // Check if file matches temporary file patterns and is older than 1 hour
        const isOldTempFile = tempFilePatterns.some(pattern => pattern.test(file)) &&
                             (Date.now() - stats.mtime.getTime() > 60 * 60 * 1000);

        if (isOldTempFile) {
          try {
            fs.unlinkSync(filePath);
            cleanedCount++;
            logger.info('Cleaned up orphaned temp file', { file });
          } catch (error) {
            logger.warn('Failed to delete orphaned file', { file, error });
          }
        }
      }

      logger.info('Orphaned files cleanup completed', { cleanedCount });
      return cleanedCount;
    } catch (error) {
      logger.error('Error cleaning up orphaned files', { error });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  public getStorageStats(): {
    totalFiles: number;
    totalSize: number;
    thumbnailCount: number;
    thumbnailSize: number;
  } {
    try {
      const stats = {
        totalFiles: 0,
        totalSize: 0,
        thumbnailCount: 0,
        thumbnailSize: 0
      };

      // Count main upload files
      const files = fs.readdirSync(this.uploadDir);
      for (const file of files) {
        const filePath = path.join(this.uploadDir, file);
        const fileStats = fs.statSync(filePath);
        
        if (fileStats.isFile()) {
          stats.totalFiles++;
          stats.totalSize += fileStats.size;
        }
      }

      // Count thumbnail files
      if (fs.existsSync(this.thumbnailDir)) {
        const thumbnails = fs.readdirSync(this.thumbnailDir);
        for (const thumbnail of thumbnails) {
          const thumbnailPath = path.join(this.thumbnailDir, thumbnail);
          const thumbnailStats = fs.statSync(thumbnailPath);
          
          if (thumbnailStats.isFile()) {
            stats.thumbnailCount++;
            stats.thumbnailSize += thumbnailStats.size;
          }
        }
      }

      return stats;
    } catch (error) {
      logger.error('Error getting storage stats', { error });
      return {
        totalFiles: 0,
        totalSize: 0,
        thumbnailCount: 0,
        thumbnailSize: 0
      };
    }
  }

  /**
   * Force cleanup of all old files (for manual cleanup)
   */
  public async forceCleanup(maxAge: number = 60 * 60 * 1000): Promise<{
    filesDeleted: number;
    thumbnailsDeleted: number;
    orphansDeleted: number;
  }> {
    logger.info('Starting forced cleanup', { maxAge });
    
    const [filesDeleted, thumbnailsDeleted, orphansDeleted] = await Promise.all([
      this.cleanupOldFiles(maxAge),
      this.cleanupOldThumbnails(maxAge),
      this.cleanupOrphanedFiles()
    ]);

    const result = { filesDeleted, thumbnailsDeleted, orphansDeleted };
    logger.info('Forced cleanup completed', result);
    
    return result;
  }

  /**
   * Stop periodic cleanup (for graceful shutdown)
   */
  public stopPeriodicCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      logger.info('Periodic file cleanup stopped');
    }
  }

  /**
   * Delete a specific file by filename
   */
  public deleteFile(filename: string): boolean {
    try {
      const filePath = path.join(this.uploadDir, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Deleted file: ${filename}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error(`Error deleting file ${filename}:`, error);
      return false;
    }
  }

  /**
   * Get file path by filename
   */
  public getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  /**
   * Check if file exists
   */
  public fileExists(filename: string): boolean {
    return fs.existsSync(path.join(this.uploadDir, filename));
  }

  /**
   * Get file stats
   */
  public getFileStats(filename: string): fs.Stats | null {
    try {
      const filePath = path.join(this.uploadDir, filename);
      return fs.statSync(filePath);
    } catch (error) {
      return null;
    }
  }
}

// Create singleton instance
export const fileService = new FileService();

// Graceful shutdown handler
process.on('SIGTERM', () => {
  fileService.stopPeriodicCleanup();
});

process.on('SIGINT', () => {
  fileService.stopPeriodicCleanup();
});