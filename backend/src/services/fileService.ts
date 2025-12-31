import fs from 'fs';
import path from 'path';

export class FileService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), 'uploads');
    this.ensureUploadDirExists();
  }

  /**
   * Ensure uploads directory exists
   */
  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Clean up old temporary files (older than 24 hours)
   */
  public cleanupOldFiles(): void {
    try {
      const files = fs.readdirSync(this.uploadDir);
      const now = Date.now();
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

      files.forEach(file => {
        const filePath = path.join(this.uploadDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old file: ${file}`);
        }
      });
    } catch (error) {
      console.error('Error cleaning up old files:', error);
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

// Set up periodic cleanup (every hour)
setInterval(() => {
  fileService.cleanupOldFiles();
}, 60 * 60 * 1000); // 1 hour