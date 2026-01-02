/**
 * 提示词模板系统错误类型定义
 * Prompt Template System Error Type Definitions
 */

// 错误类型枚举
export enum TemplateErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  FILE_FORMAT_ERROR = 'FILE_FORMAT_ERROR',
  FILE_SIZE_ERROR = 'FILE_SIZE_ERROR',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',
  MIGRATION_ERROR = 'MIGRATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  DUPLICATE_ERROR = 'DUPLICATE_ERROR',
  PARSE_ERROR = 'PARSE_ERROR'
}

// 错误严重程度枚举
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 基础错误接口
export interface TemplateError {
  type: TemplateErrorType
  message: string
  field?: string
  code?: string
  severity?: ErrorSeverity
  details?: any
  timestamp?: string
}

// 验证错误接口
export interface ValidationError extends TemplateError {
  type: TemplateErrorType.VALIDATION_ERROR
  field: string
  expectedValue?: any
  actualValue?: any
}

// 文件错误接口
export interface FileError extends TemplateError {
  type: TemplateErrorType.FILE_FORMAT_ERROR | TemplateErrorType.FILE_SIZE_ERROR
  fileName?: string
  fileSize?: number
  allowedFormats?: string[]
  maxSize?: number
}

// 网络错误接口
export interface NetworkError extends TemplateError {
  type: TemplateErrorType.NETWORK_ERROR
  statusCode?: number
  endpoint?: string
  retryable?: boolean
}

// 存储错误接口
export interface StorageError extends TemplateError {
  type: TemplateErrorType.STORAGE_ERROR
  operation?: 'read' | 'write' | 'delete' | 'update'
  resourceId?: string
}

// 迁移错误接口
export interface MigrationError extends TemplateError {
  type: TemplateErrorType.MIGRATION_ERROR
  sourceFile?: string
  lineNumber?: number
  itemIndex?: number
}

// 错误处理器接口
export interface ErrorHandler {
  handleError: (error: TemplateError) => void
  handleValidationError: (error: ValidationError) => void
  handleFileError: (error: FileError) => void
  handleNetworkError: (error: NetworkError) => void
  handleStorageError: (error: StorageError) => void
  handleMigrationError: (error: MigrationError) => void
}

// 错误恢复策略接口
export interface ErrorRecoveryStrategy {
  canRecover: (error: TemplateError) => boolean
  recover: (error: TemplateError) => Promise<boolean>
  getRecoveryMessage: (error: TemplateError) => string
}

// 错误上下文接口
export interface ErrorContext {
  operation: string
  templateId?: string
  userId?: string
  timestamp: string
  userAgent?: string
  additionalData?: Record<string, any>
}

// 错误报告接口
export interface ErrorReport {
  error: TemplateError
  context: ErrorContext
  stackTrace?: string
  userFeedback?: string
}

// 预定义错误消息
export const ERROR_MESSAGES = {
  [TemplateErrorType.VALIDATION_ERROR]: {
    TITLE_REQUIRED: '模板标题不能为空',
    TITLE_TOO_LONG: '模板标题不能超过100个字符',
    DESCRIPTION_REQUIRED: '模板描述不能为空',
    DESCRIPTION_TOO_LONG: '模板描述不能超过500个字符',
    CONTENT_REQUIRED: '提示词内容不能为空',
    CONTENT_TOO_SHORT: '提示词内容至少需要10个字符',
    CONTENT_TOO_LONG: '提示词内容不能超过5000个字符',
    TAGS_TOO_MANY: '标签数量不能超过10个',
    TAG_TOO_LONG: '单个标签不能超过20个字符',
    INVALID_FORMAT: '数据格式无效'
  },
  [TemplateErrorType.FILE_FORMAT_ERROR]: {
    UNSUPPORTED_FORMAT: '不支持的文件格式，请使用JPG或PNG格式',
    CORRUPTED_FILE: '文件已损坏，无法读取'
  },
  [TemplateErrorType.FILE_SIZE_ERROR]: {
    FILE_TOO_LARGE: '文件大小不能超过5MB',
    FILE_EMPTY: '文件不能为空'
  },
  [TemplateErrorType.TEMPLATE_NOT_FOUND]: {
    NOT_FOUND: '未找到指定的模板',
    DELETED: '模板已被删除'
  },
  [TemplateErrorType.MIGRATION_ERROR]: {
    FILE_NOT_FOUND: '找不到源文件',
    PARSE_FAILED: '解析文件失败',
    INVALID_FORMAT: '文件格式无效'
  },
  [TemplateErrorType.STORAGE_ERROR]: {
    READ_FAILED: '读取数据失败',
    WRITE_FAILED: '保存数据失败',
    DELETE_FAILED: '删除数据失败',
    PERMISSION_DENIED: '没有访问权限'
  },
  [TemplateErrorType.NETWORK_ERROR]: {
    CONNECTION_FAILED: '网络连接失败',
    TIMEOUT: '请求超时',
    SERVER_ERROR: '服务器错误'
  },
  [TemplateErrorType.PERMISSION_ERROR]: {
    ACCESS_DENIED: '访问被拒绝',
    INSUFFICIENT_PERMISSIONS: '权限不足'
  },
  [TemplateErrorType.DUPLICATE_ERROR]: {
    TEMPLATE_EXISTS: '模板已存在',
    TITLE_DUPLICATE: '模板标题重复'
  },
  [TemplateErrorType.PARSE_ERROR]: {
    JSON_INVALID: 'JSON格式无效',
    SYNTAX_ERROR: '语法错误'
  }
} as const

// 错误工厂函数
export class TemplateErrorFactory {
  static createValidationError(
    field: string, 
    message: string, 
    actualValue?: any, 
    expectedValue?: any
  ): ValidationError {
    return {
      type: TemplateErrorType.VALIDATION_ERROR,
      message,
      field,
      severity: ErrorSeverity.MEDIUM,
      actualValue,
      expectedValue,
      timestamp: new Date().toISOString()
    }
  }

  static createFileError(
    subType: TemplateErrorType.FILE_FORMAT_ERROR | TemplateErrorType.FILE_SIZE_ERROR,
    message: string,
    fileName?: string,
    fileSize?: number
  ): FileError {
    return {
      type: subType,
      message,
      fileName,
      fileSize,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date().toISOString()
    }
  }

  static createNetworkError(
    message: string,
    statusCode?: number,
    endpoint?: string
  ): NetworkError {
    return {
      type: TemplateErrorType.NETWORK_ERROR,
      message,
      statusCode,
      endpoint,
      severity: ErrorSeverity.HIGH,
      retryable: statusCode ? statusCode >= 500 : true,
      timestamp: new Date().toISOString()
    }
  }

  static createStorageError(
    message: string,
    operation?: 'read' | 'write' | 'delete' | 'update',
    resourceId?: string
  ): StorageError {
    return {
      type: TemplateErrorType.STORAGE_ERROR,
      message,
      operation,
      resourceId,
      severity: ErrorSeverity.HIGH,
      timestamp: new Date().toISOString()
    }
  }

  static createMigrationError(
    message: string,
    sourceFile?: string,
    lineNumber?: number,
    itemIndex?: number
  ): MigrationError {
    return {
      type: TemplateErrorType.MIGRATION_ERROR,
      message,
      sourceFile,
      lineNumber,
      itemIndex,
      severity: ErrorSeverity.MEDIUM,
      timestamp: new Date().toISOString()
    }
  }
}