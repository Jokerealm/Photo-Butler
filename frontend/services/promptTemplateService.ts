/**
 * 提示词模板服务接口定义
 * Prompt Template Service Interface Definitions
 */

import {
  PromptTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateSearchParams,
  TemplateSearchResult,
  MigrationResult,
  ParsedPromptItem,
  PromptTemplateApiResponse
} from '../types/promptTemplate'

/**
 * 提示词模板服务接口
 * 定义所有模板相关的业务操作
 */
export interface IPromptTemplateService {
  // 基础CRUD操作
  getAllTemplates(): Promise<PromptTemplate[]>
  getTemplateById(id: string): Promise<PromptTemplate | null>
  createTemplate(request: CreateTemplateRequest): Promise<PromptTemplate>
  updateTemplate(id: string, updates: UpdateTemplateRequest): Promise<PromptTemplate>
  deleteTemplate(id: string): Promise<void>
  
  // 搜索和筛选
  searchTemplates(params: TemplateSearchParams): Promise<TemplateSearchResult>
  filterByTags(tags: string[]): Promise<PromptTemplate[]>
  getAvailableTags(): Promise<string[]>
  
  // 数据迁移
  migrateFromTextFile(filePath: string): Promise<MigrationResult>
  parsePromptFile(content: string): ParsedPromptItem[]
  
  // 文件处理
  uploadThumbnail(file: File): Promise<string>
  deleteThumbnail(path: string): Promise<void>
  
  // 数据验证和清理
  validateTemplate(template: PromptTemplate): Promise<boolean>
  sanitizeTemplateData(data: any): PromptTemplate | null
}

/**
 * 本地存储服务接口
 * 处理模板数据的本地存储
 */
export interface ITemplateStorageService {
  // 存储操作
  saveTemplates(templates: PromptTemplate[]): Promise<void>
  loadTemplates(): Promise<PromptTemplate[]>
  saveTemplate(template: PromptTemplate): Promise<void>
  removeTemplate(id: string): Promise<void>
  
  // 缓存管理
  clearCache(): Promise<void>
  getCacheInfo(): Promise<{ size: number; lastUpdated: string }>
  
  // 数据导入导出
  exportTemplates(): Promise<string>
  importTemplates(data: string): Promise<PromptTemplate[]>
  
  // 备份和恢复
  createBackup(): Promise<string>
  restoreFromBackup(backupData: string): Promise<void>
}

/**
 * 文件处理服务接口
 * 处理文件上传、下载和管理
 */
export interface IFileHandlingService {
  // 文件上传
  uploadFile(file: File, directory?: string): Promise<string>
  uploadThumbnail(file: File): Promise<string>
  
  // 文件删除
  deleteFile(path: string): Promise<void>
  
  // 文件验证
  validateImageFile(file: File): Promise<boolean>
  getFileInfo(file: File): Promise<{ size: number; type: string; name: string }>
  
  // 图片处理
  resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<File>
  generateThumbnail(file: File): Promise<File>
  
  // 文件路径管理
  generateFilePath(fileName: string, directory?: string): string
  getAbsolutePath(relativePath: string): string
  ensureDirectoryExists(path: string): Promise<void>
}

/**
 * 数据迁移服务接口
 * 处理从旧格式到新格式的数据迁移
 */
export interface IMigrationService {
  // 迁移操作
  migrateFromPromptFile(filePath: string): Promise<MigrationResult>
  migrateFromLegacyFormat(data: any[]): Promise<MigrationResult>
  
  // 解析操作
  parsePromptFile(content: string): ParsedPromptItem[]
  parsePromptItem(text: string, index: number): ParsedPromptItem | null
  
  // 数据转换
  convertToTemplate(item: ParsedPromptItem): PromptTemplate
  matchThumbnail(content: string): string | null
  
  // 验证和清理
  validateMigrationData(data: any): boolean
  cleanupAfterMigration(): Promise<void>
}

/**
 * 搜索服务接口
 * 处理模板搜索和筛选逻辑
 */
export interface ISearchService {
  // 搜索操作
  searchByQuery(templates: PromptTemplate[], query: string): PromptTemplate[]
  searchByTags(templates: PromptTemplate[], tags: string[]): PromptTemplate[]
  searchByCategory(templates: PromptTemplate[], category: string): PromptTemplate[]
  
  // 高级搜索
  advancedSearch(templates: PromptTemplate[], params: TemplateSearchParams): TemplateSearchResult
  
  // 搜索优化
  buildSearchIndex(templates: PromptTemplate[]): void
  clearSearchIndex(): void
  
  // 搜索建议
  getSuggestions(query: string): string[]
  getPopularTags(): string[]
  
  // 排序
  sortTemplates(templates: PromptTemplate[], sortBy: 'title' | 'createdAt' | 'updatedAt' | 'usageCount'): PromptTemplate[]
}

/**
 * 缓存服务接口
 * 处理模板数据的缓存管理
 */
export interface ICacheService {
  // 缓存操作
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, ttl?: number): Promise<void>
  delete(key: string): Promise<void>
  clear(): Promise<void>
  
  // 缓存管理
  has(key: string): Promise<boolean>
  keys(): Promise<string[]>
  size(): Promise<number>
  
  // 缓存策略
  setTTL(key: string, ttl: number): Promise<void>
  getTTL(key: string): Promise<number>
  
  // 批量操作
  mget<T>(keys: string[]): Promise<(T | null)[]>
  mset<T>(entries: Array<[string, T]>): Promise<void>
  mdel(keys: string[]): Promise<void>
}

/**
 * 事件服务接口
 * 处理模板相关的事件通知
 */
export interface IEventService {
  // 事件监听
  on(event: string, callback: (...args: any[]) => void): void
  off(event: string, callback: (...args: any[]) => void): void
  once(event: string, callback: (...args: any[]) => void): void
  
  // 事件触发
  emit(event: string, ...args: any[]): void
  
  // 事件管理
  removeAllListeners(event?: string): void
  listenerCount(event: string): number
  
  // 预定义事件
  onTemplateCreated(callback: (template: PromptTemplate) => void): void
  onTemplateUpdated(callback: (template: PromptTemplate) => void): void
  onTemplateDeleted(callback: (templateId: string) => void): void
  onSearchPerformed(callback: (query: string, results: PromptTemplate[]) => void): void
  onMigrationCompleted(callback: (result: MigrationResult) => void): void
}

/**
 * 服务工厂接口
 * 创建和管理各种服务实例
 */
export interface IServiceFactory {
  createTemplateService(): IPromptTemplateService
  createStorageService(): ITemplateStorageService
  createFileService(): IFileHandlingService
  createMigrationService(): IMigrationService
  createSearchService(): ISearchService
  createCacheService(): ICacheService
  createEventService(): IEventService
}

/**
 * 服务配置接口
 */
export interface ServiceConfig {
  // 存储配置
  storage: {
    type: 'localStorage' | 'indexedDB' | 'memory'
    prefix: string
    maxSize?: number
  }
  
  // 文件配置
  files: {
    uploadDirectory: string
    thumbnailDirectory: string
    maxFileSize: number
    allowedFormats: string[]
  }
  
  // 缓存配置
  cache: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  
  // 搜索配置
  search: {
    indexEnabled: boolean
    fuzzySearch: boolean
    maxResults: number
  }
  
  // 迁移配置
  migration: {
    sourceFile: string
    backupEnabled: boolean
    validateAfterMigration: boolean
  }
}