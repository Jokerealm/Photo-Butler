import fs from 'fs';
import path from 'path';

/**
 * 日志级别
 * Log levels
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

/**
 * 日志条目接口
 * Log entry interface
 */
export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  stack?: string;
  context?: Record<string, any>;
}

/**
 * 日志配置
 * Logger configuration
 */
export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  logDir: string;
  maxFileSize: number; // in bytes
  maxFiles: number;
}

/**
 * 简单的日志系统
 * Simple logging system
 */
export class Logger {
  private config: LoggerConfig;
  private logDir: string;

  constructor(config?: Partial<LoggerConfig>) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: true,
      logDir: path.join(process.cwd(), 'logs'),
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
      ...config
    };

    this.logDir = this.config.logDir;
    this.ensureLogDirectory();
  }

  /**
   * 确保日志目录存在
   * Ensure log directory exists
   */
  private ensureLogDirectory(): void {
    if (this.config.enableFile && !fs.existsSync(this.logDir)) {
      try {
        fs.mkdirSync(this.logDir, { recursive: true });
      } catch (error) {
        console.error('Failed to create log directory:', error);
        this.config.enableFile = false;
      }
    }
  }

  /**
   * 格式化时间戳
   * Format timestamp
   */
  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  /**
   * 格式化日志消息
   * Format log message
   */
  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = this.formatTimestamp();
    let formatted = `[${timestamp}] [${level.toUpperCase()}] ${message}`;
    
    if (data) {
      if (typeof data === 'object') {
        formatted += `\n${JSON.stringify(data, null, 2)}`;
      } else {
        formatted += ` ${data}`;
      }
    }
    
    return formatted;
  }

  /**
   * 获取日志文件路径
   * Get log file path
   */
  private getLogFilePath(level: string): string {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${level}-${date}.log`);
  }

  /**
   * 写入文件日志
   * Write to file log
   */
  private async writeToFile(level: string, message: string): Promise<void> {
    if (!this.config.enableFile) return;

    try {
      const filePath = this.getLogFilePath(level);
      const logMessage = message + '\n';
      
      // 检查文件大小并轮转
      await this.rotateLogIfNeeded(filePath);
      
      // 异步写入文件
      fs.appendFileSync(filePath, logMessage, 'utf8');
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * 日志轮转
   * Log rotation
   */
  private async rotateLogIfNeeded(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) return;

      const stats = fs.statSync(filePath);
      if (stats.size < this.config.maxFileSize) return;

      // 轮转日志文件
      const dir = path.dirname(filePath);
      const basename = path.basename(filePath, '.log');
      
      // 移动现有文件
      for (let i = this.config.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(dir, `${basename}.${i}.log`);
        const newFile = path.join(dir, `${basename}.${i + 1}.log`);
        
        if (fs.existsSync(oldFile)) {
          if (i === this.config.maxFiles - 1) {
            fs.unlinkSync(oldFile); // 删除最老的文件
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
      
      // 重命名当前文件
      const rotatedFile = path.join(dir, `${basename}.1.log`);
      fs.renameSync(filePath, rotatedFile);
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  /**
   * 写入日志
   * Write log
   */
  private async log(level: LogLevel, levelName: string, message: string, data?: any): Promise<void> {
    if (level > this.config.level) return;

    const formattedMessage = this.formatMessage(levelName, message, data);

    // 控制台输出
    if (this.config.enableConsole) {
      switch (level) {
        case LogLevel.ERROR:
          console.error(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
      }
    }

    // 文件输出
    await this.writeToFile(levelName.toLowerCase(), formattedMessage);
  }

  /**
   * 错误日志
   * Error log
   */
  async error(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.ERROR, 'ERROR', message, data);
  }

  /**
   * 警告日志
   * Warning log
   */
  async warn(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.WARN, 'WARN', message, data);
  }

  /**
   * 信息日志
   * Info log
   */
  async info(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.INFO, 'INFO', message, data);
  }

  /**
   * 调试日志
   * Debug log
   */
  async debug(message: string, data?: any): Promise<void> {
    await this.log(LogLevel.DEBUG, 'DEBUG', message, data);
  }

  /**
   * 设置日志级别
   * Set log level
   */
  setLevel(level: LogLevel): void {
    this.config.level = level;
  }

  /**
   * 获取日志级别
   * Get log level
   */
  getLevel(): LogLevel {
    return this.config.level;
  }

  /**
   * 清理旧日志文件
   * Clean up old log files
   */
  async cleanup(daysToKeep: number = 7): Promise<void> {
    if (!this.config.enableFile) return;

    try {
      const files = fs.readdirSync(this.logDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      for (const file of files) {
        if (!file.endsWith('.log')) continue;

        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime < cutoffDate) {
          fs.unlinkSync(filePath);
          console.log(`Cleaned up old log file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup log files:', error);
    }
  }
}

// 创建默认日志实例
const logLevel = process.env.LOG_LEVEL ? 
  LogLevel[process.env.LOG_LEVEL.toUpperCase() as keyof typeof LogLevel] : 
  (process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO);

export const logger = new Logger({
  level: logLevel,
  enableConsole: true,
  enableFile: process.env.NODE_ENV !== 'test', // 测试环境不写文件
});

// 定期清理日志文件（每天运行一次）
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    logger.cleanup().catch(error => {
      console.error('Log cleanup failed:', error);
    });
  }, 24 * 60 * 60 * 1000); // 24小时
}