import path from 'path';
import fs from 'fs';

/**
 * 存储配置和目录管理
 * Storage configuration and directory management
 */
export class StorageConfig {
  private readonly baseDir: string;
  
  // 存储目录结构
  public readonly directories = {
    // 用户上传的原始图片（临时存储，处理后可删除）
    uploads: 'uploads/originals',
    
    // AI生成的图片（用户的作品，长期保存）
    generated: 'uploads/generated',
    
    // 用户下载的图片（可以定期清理）
    downloads: 'downloads',
    
    // 压缩和缩略图（缓存，可以重新生成）
    cache: 'uploads/cache',
    
    // 临时文件（定期清理）
    temp: 'uploads/temp'
  };

  constructor(baseDir?: string) {
    this.baseDir = baseDir || process.cwd();
    this.initializeDirectories();
  }

  /**
   * 初始化所有必要的目录
   */
  private initializeDirectories(): void {
    Object.values(this.directories).forEach(dir => {
      const fullPath = this.getFullPath(dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
        console.log(`[Storage] Created directory: ${fullPath}`);
      }
    });
  }

  /**
   * 获取完整路径
   */
  public getFullPath(relativePath: string): string {
    return path.join(this.baseDir, relativePath);
  }

  /**
   * 获取用户上传文件路径
   */
  public getUploadPath(filename: string): string {
    return this.getFullPath(path.join(this.directories.uploads, filename));
  }

  /**
   * 获取生成文件路径
   */
  public getGeneratedPath(filename: string): string {
    return this.getFullPath(path.join(this.directories.generated, filename));
  }

  /**
   * 获取下载文件路径
   */
  public getDownloadPath(filename: string): string {
    return this.getFullPath(path.join(this.directories.downloads, filename));
  }

  /**
   * 获取缓存文件路径
   */
  public getCachePath(filename: string): string {
    return this.getFullPath(path.join(this.directories.cache, filename));
  }

  /**
   * 获取临时文件路径
   */
  public getTempPath(filename: string): string {
    return this.getFullPath(path.join(this.directories.temp, filename));
  }

  /**
   * 生成唯一文件名
   */
  public generateUniqueFilename(originalName: string, prefix?: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${prefix ? prefix + '_' : ''}${baseName}_${timestamp}_${random}${extension}`;
  }

  /**
   * 清理临时文件（删除超过指定时间的文件）
   */
  public async cleanupTempFiles(maxAgeHours: number = 24): Promise<void> {
    const tempDir = this.getFullPath(this.directories.temp);
    const maxAge = maxAgeHours * 60 * 60 * 1000; // 转换为毫秒
    
    try {
      const files = fs.readdirSync(tempDir);
      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (Date.now() - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }
      
      console.log(`[Storage] Cleaned up ${deletedCount} temporary files`);
    } catch (error) {
      console.error('[Storage] Error cleaning up temp files:', error);
    }
  }

  /**
   * 清理上传文件（删除已处理完成的原始上传文件）
   */
  public async cleanupProcessedUploads(taskIds: string[]): Promise<void> {
    const uploadsDir = this.getFullPath(this.directories.uploads);
    
    try {
      const files = fs.readdirSync(uploadsDir);
      let deletedCount = 0;
      
      for (const taskId of taskIds) {
        const matchingFiles = files.filter(file => file.startsWith(taskId));
        
        for (const file of matchingFiles) {
          const filePath = path.join(uploadsDir, file);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            deletedCount++;
          }
        }
      }
      
      console.log(`[Storage] Cleaned up ${deletedCount} processed upload files`);
    } catch (error) {
      console.error('[Storage] Error cleaning up uploads:', error);
    }
  }

  /**
   * 获取目录使用情况统计
   */
  public getStorageStats(): Record<string, { files: number; sizeBytes: number }> {
    const stats: Record<string, { files: number; sizeBytes: number }> = {};
    
    Object.entries(this.directories).forEach(([name, dir]) => {
      const fullPath = this.getFullPath(dir);
      
      try {
        const files = fs.readdirSync(fullPath);
        let totalSize = 0;
        
        files.forEach(file => {
          const filePath = path.join(fullPath, file);
          const fileStats = fs.statSync(filePath);
          if (fileStats.isFile()) {
            totalSize += fileStats.size;
          }
        });
        
        stats[name] = {
          files: files.length,
          sizeBytes: totalSize
        };
      } catch (error) {
        stats[name] = { files: 0, sizeBytes: 0 };
      }
    });
    
    return stats;
  }
}

// 导出单例实例
export const storageConfig = new StorageConfig();