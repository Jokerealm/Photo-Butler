/**
 * 提示词模板系统配置
 * Prompt Template System Configuration
 */

import { ServiceConfig } from '../services/promptTemplateService'

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: ServiceConfig = {
  // 存储配置
  storage: {
    type: 'localStorage',
    prefix: 'prompt_template_',
    maxSize: 50 * 1024 * 1024 // 50MB
  },
  
  // 文件配置
  files: {
    uploadDirectory: 'uploads/templates',
    thumbnailDirectory: 'uploads/thumbnails',
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedFormats: ['jpg', 'jpeg', 'png']
  },
  
  // 缓存配置
  cache: {
    enabled: true,
    ttl: 24 * 60 * 60 * 1000, // 24小时
    maxSize: 100
  },
  
  // 搜索配置
  search: {
    indexEnabled: true,
    fuzzySearch: true,
    maxResults: 50
  },
  
  // 迁移配置
  migration: {
    sourceFile: 'prompt/prompt.txt',
    backupEnabled: true,
    validateAfterMigration: true
  }
}

/**
 * 环境特定配置
 */
export const ENVIRONMENT_CONFIG = {
  development: {
    ...DEFAULT_CONFIG,
    cache: {
      ...DEFAULT_CONFIG.cache,
      enabled: false // 开发环境禁用缓存
    }
  },
  
  production: {
    ...DEFAULT_CONFIG,
    files: {
      ...DEFAULT_CONFIG.files,
      maxFileSize: 10 * 1024 * 1024 // 生产环境允许更大文件
    }
  },
  
  test: {
    ...DEFAULT_CONFIG,
    storage: {
      ...DEFAULT_CONFIG.storage,
      type: 'memory' as const
    },
    cache: {
      ...DEFAULT_CONFIG.cache,
      enabled: false
    }
  }
}

/**
 * 获取当前环境配置
 */
export function getConfig(): ServiceConfig {
  const env = process.env.NODE_ENV || 'development'
  return ENVIRONMENT_CONFIG[env as keyof typeof ENVIRONMENT_CONFIG] || DEFAULT_CONFIG
}

/**
 * 应用配置常量
 */
export const APP_CONFIG = {
  // 应用信息
  APP_NAME: '提示词模板系统',
  APP_VERSION: '1.0.0',
  
  // 数据版本
  DATA_VERSION: 1,
  SCHEMA_VERSION: '1.0',
  
  // 本地存储键名
  STORAGE_KEYS: {
    TEMPLATES: 'prompt_templates',
    SETTINGS: 'prompt_template_settings',
    CACHE: 'prompt_template_cache',
    MIGRATION_STATUS: 'prompt_template_migration_status'
  },
  
  // 默认值
  DEFAULTS: {
    THUMBNAIL_PATH: 'image/placeholder.png',
    TAGS: ['提示词'],
    DESCRIPTION_LENGTH: 100,
    TITLE_LENGTH: 30
  },
  
  // 限制
  LIMITS: {
    MAX_TEMPLATES: 1000,
    MAX_TAGS_PER_TEMPLATE: 10,
    MAX_TAG_LENGTH: 20,
    MAX_TITLE_LENGTH: 100,
    MAX_DESCRIPTION_LENGTH: 500,
    MAX_CONTENT_LENGTH: 5000,
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    MAX_SEARCH_RESULTS: 50
  },
  
  // 文件路径
  PATHS: {
    IMAGES: 'image',
    UPLOADS: 'uploads',
    THUMBNAILS: 'uploads/thumbnails',
    TEMPLATES: 'templates',
    BACKUPS: 'backups'
  },
  
  // 支持的文件格式
  SUPPORTED_FORMATS: {
    IMAGES: ['jpg', 'jpeg', 'png'],
    MIME_TYPES: ['image/jpeg', 'image/png']
  },
  
  // UI配置
  UI: {
    ITEMS_PER_PAGE: 20,
    GRID_COLUMNS: {
      MOBILE: 1,
      TABLET: 2,
      DESKTOP: 3,
      LARGE: 4
    },
    ANIMATION_DURATION: 300,
    DEBOUNCE_DELAY: 300
  },
  
  // 错误消息
  ERROR_MESSAGES: {
    NETWORK_ERROR: '网络连接失败，请检查网络设置',
    STORAGE_ERROR: '本地存储失败，请检查浏览器设置',
    FILE_ERROR: '文件处理失败，请检查文件格式和大小',
    VALIDATION_ERROR: '数据验证失败，请检查输入内容',
    MIGRATION_ERROR: '数据迁移失败，请联系技术支持'
  },
  
  // 成功消息
  SUCCESS_MESSAGES: {
    TEMPLATE_CREATED: '模板创建成功',
    TEMPLATE_UPDATED: '模板更新成功',
    TEMPLATE_DELETED: '模板删除成功',
    MIGRATION_COMPLETED: '数据迁移完成',
    FILE_UPLOADED: '文件上传成功'
  }
}

/**
 * 功能开关配置
 */
export const FEATURE_FLAGS = {
  // 核心功能
  TEMPLATE_CRUD: true,
  SEARCH_AND_FILTER: true,
  FILE_UPLOAD: true,
  DATA_MIGRATION: true,
  
  // 高级功能
  ADVANCED_SEARCH: false,
  BATCH_OPERATIONS: false,
  TEMPLATE_SHARING: false,
  USER_SYSTEM: false,
  
  // 实验性功能
  AI_SUGGESTIONS: false,
  AUTO_TAGGING: false,
  TEMPLATE_ANALYTICS: false,
  EXPORT_IMPORT: false,
  
  // 开发功能
  DEBUG_MODE: process.env.NODE_ENV === 'development',
  PERFORMANCE_MONITORING: false,
  ERROR_REPORTING: false
}

/**
 * 检查功能是否启用
 */
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature] === true
}

/**
 * 获取环境变量配置
 */
export function getEnvironmentConfig() {
  return {
    NODE_ENV: process.env.NODE_ENV || 'development',
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000',
    UPLOAD_URL: process.env.NEXT_PUBLIC_UPLOAD_URL || '/api/upload',
    MAX_FILE_SIZE: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '5242880'), // 5MB
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
    DEBUG: process.env.NEXT_PUBLIC_DEBUG === 'true'
  }
}