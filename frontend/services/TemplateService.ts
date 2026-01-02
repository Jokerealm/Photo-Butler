/**
 * 提示词模板服务实现
 * Prompt Template Service Implementation
 * 
 * 实现模板的CRUD操作、搜索筛选和数据验证功能
 * Requirements: 1.4, 1.5, 3.2, 3.3
 */

import {
  PromptTemplate,
  CreateTemplateRequest,
  UpdateTemplateRequest,
  TemplateSearchParams,
  TemplateSearchResult,
  MigrationResult,
  ParsedPromptItem,
  TemplateValidationResult
} from '../types/promptTemplate'

import {
  validateCreateTemplateRequest,
  validateUpdateTemplateRequest,
  validatePromptTemplate,
  sanitizeTags,
  sanitizeText
} from '../utils/promptTemplateValidation'

import {
  TemplateErrorFactory,
  TemplateErrorType,
  ERROR_MESSAGES
} from '../types/promptTemplateErrors'

import { versionControlService } from './versionControlService'

/**
 * 生成唯一ID的辅助函数
 */
function generateId(): string {
  return `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 提示词模板服务类
 * 负责处理所有模板相关的业务逻辑
 */
export class TemplateService {
  private templates: PromptTemplate[] = []
  private readonly STORAGE_KEY = 'prompt_templates'

  constructor() {
    this.loadFromStorage()
  }

  /**
   * 获取所有模板
   * Requirements: 1.4, 1.5
   */
  async getAllTemplates(): Promise<PromptTemplate[]> {
    try {
      return [...this.templates]
    } catch (error) {
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].READ_FAILED,
        'read'
      )
    }
  }

  /**
   * 根据ID获取模板
   * Requirements: 1.4
   */
  async getTemplateById(id: string): Promise<PromptTemplate | null> {
    try {
      const template = this.templates.find(t => t.id === id)
      return template ? { ...template } : null
    } catch (error) {
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].READ_FAILED,
        'read',
        id
      )
    }
  }

  /**
   * 创建新模板
   * Requirements: 1.4, 1.5
   */
  async createTemplate(request: CreateTemplateRequest): Promise<PromptTemplate> {
    // 验证请求数据
    const validationResult = validateCreateTemplateRequest(request)
    if (!validationResult.isValid) {
      throw new Error(`创建模板验证失败: ${validationResult.errors.map(e => e.message).join(', ')}`)
    }

    try {
      // 创建新模板对象
      const now = new Date().toISOString()
      const newTemplate: PromptTemplate = {
        id: generateId(),
        title: sanitizeText(request.title),
        description: sanitizeText(request.description),
        content: sanitizeText(request.content),
        tags: sanitizeTags(request.tags),
        thumbnailPath: request.thumbnailFile ? await this.handleThumbnailUpload(request.thumbnailFile) : 'placeholder.png',
        createdAt: now,
        updatedAt: now,
        version: 1
      }

      // 验证生成的模板
      const templateValidation = validatePromptTemplate(newTemplate)
      if (!templateValidation.isValid) {
        throw new Error(`生成的模板数据无效: ${templateValidation.errors.map(e => e.message).join(', ')}`)
      }

      // 添加到内存存储
      this.templates.push(newTemplate)
      
      // 保存到持久化存储
      await this.saveToStorage()

      return { ...newTemplate }
    } catch (error) {
      if (error.type) {
        throw error // 重新抛出已知的模板错误
      }
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].WRITE_FAILED,
        'write'
      )
    }
  }

  /**
   * 更新模板
   * Requirements: 1.4, 1.5
   */
  async updateTemplate(id: string, updates: UpdateTemplateRequest): Promise<PromptTemplate> {
    // 验证更新请求
    const validationResult = validateUpdateTemplateRequest(updates)
    if (!validationResult.isValid) {
      throw new Error(`更新模板验证失败: ${validationResult.errors.map(e => e.message).join(', ')}`)
    }

    // 检查模板是否存在
    const templateIndex = this.templates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      throw new Error(ERROR_MESSAGES[TemplateErrorType.TEMPLATE_NOT_FOUND].NOT_FOUND)
    }

    try {
      const existingTemplate = this.templates[templateIndex]
      
      // 创建更新后的模板
      const updatedTemplate: PromptTemplate = {
        ...existingTemplate,
        title: updates.title !== undefined ? sanitizeText(updates.title) : existingTemplate.title,
        description: updates.description !== undefined ? sanitizeText(updates.description) : existingTemplate.description,
        content: updates.content !== undefined ? sanitizeText(updates.content) : existingTemplate.content,
        tags: updates.tags !== undefined ? sanitizeTags(updates.tags) : existingTemplate.tags,
        thumbnailPath: updates.thumbnailFile ? await this.handleThumbnailUpload(updates.thumbnailFile) : existingTemplate.thumbnailPath,
        updatedAt: new Date().toISOString()
      }

      // 验证更新后的模板
      const templateValidation = validatePromptTemplate(updatedTemplate)
      if (!templateValidation.isValid) {
        throw new Error(`更新后的模板数据无效: ${templateValidation.errors.map(e => e.message).join(', ')}`)
      }

      // 更新内存存储
      this.templates[templateIndex] = updatedTemplate
      
      // 保存到持久化存储
      await this.saveToStorage()

      return { ...updatedTemplate }
    } catch (error) {
      if (error.type) {
        throw error // 重新抛出已知的模板错误
      }
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].WRITE_FAILED,
        'update',
        id
      )
    }
  }

  /**
   * 删除模板
   * Requirements: 1.4
   */
  async deleteTemplate(id: string): Promise<void> {
    // 检查模板是否存在
    const templateIndex = this.templates.findIndex(t => t.id === id)
    if (templateIndex === -1) {
      throw new Error(ERROR_MESSAGES[TemplateErrorType.TEMPLATE_NOT_FOUND].NOT_FOUND)
    }

    try {
      // 从内存存储中移除
      this.templates.splice(templateIndex, 1)
      
      // 保存到持久化存储
      await this.saveToStorage()
    } catch (error) {
      if (error.type) {
        throw error // 重新抛出已知的模板错误
      }
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].DELETE_FAILED,
        'delete',
        id
      )
    }
  }

  /**
   * 搜索模板
   * Requirements: 3.2
   */
  async searchTemplates(params: TemplateSearchParams): Promise<TemplateSearchResult> {
    try {
      let filteredTemplates = [...this.templates]

      // 按查询关键词搜索
      if (params.query && params.query.trim()) {
        const query = params.query.toLowerCase().trim()
        filteredTemplates = filteredTemplates.filter(template => 
          template.title.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.content.toLowerCase().includes(query)
        )
      }

      // 按标签筛选
      if (params.tags && params.tags.length > 0) {
        filteredTemplates = filteredTemplates.filter(template =>
          params.tags!.some(tag => template.tags.includes(tag))
        )
      }

      // 按分类筛选
      if (params.category) {
        filteredTemplates = filteredTemplates.filter(template =>
          template.category === params.category
        )
      }

      // 按作者筛选
      if (params.authorId) {
        filteredTemplates = filteredTemplates.filter(template =>
          template.authorId === params.authorId
        )
      }

      // 分页处理
      const total = filteredTemplates.length
      const offset = params.offset || 0
      const limit = params.limit || total

      const paginatedTemplates = filteredTemplates.slice(offset, offset + limit)
      const hasMore = offset + limit < total

      return {
        templates: paginatedTemplates,
        total,
        query: params.query,
        hasMore
      }
    } catch (error) {
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].READ_FAILED,
        'read'
      )
    }
  }

  /**
   * 按标签筛选模板
   * Requirements: 3.3
   */
  async filterByTags(tags: string[]): Promise<PromptTemplate[]> {
    try {
      if (!tags || tags.length === 0) {
        return [...this.templates]
      }

      return this.templates.filter(template =>
        tags.some(tag => template.tags.includes(tag))
      )
    } catch (error) {
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].READ_FAILED,
        'read'
      )
    }
  }

  /**
   * 获取所有可用标签
   * Requirements: 3.3
   */
  async getAvailableTags(): Promise<string[]> {
    try {
      const allTags = new Set<string>()
      this.templates.forEach(template => {
        template.tags.forEach(tag => allTags.add(tag))
      })
      return Array.from(allTags).sort()
    } catch (error) {
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].READ_FAILED,
        'read'
      )
    }
  }

  /**
   * 验证模板数据
   * Requirements: 1.5
   */
  async validateTemplate(template: PromptTemplate): Promise<boolean> {
    const validationResult = validatePromptTemplate(template)
    return validationResult.isValid
  }

  /**
   * 清理和标准化模板数据
   * Requirements: 1.5
   */
  sanitizeTemplateData(data: any): PromptTemplate | null {
    try {
      if (!data || typeof data !== 'object') {
        return null
      }

      // 检查必需字段
      if (!data.id || !data.title || !data.description || !data.content) {
        return null
      }

      const sanitized: PromptTemplate = {
        id: String(data.id),
        title: sanitizeText(String(data.title)),
        description: sanitizeText(String(data.description)),
        content: sanitizeText(String(data.content)),
        tags: Array.isArray(data.tags) ? sanitizeTags(data.tags.map(String)) : [],
        thumbnailPath: String(data.thumbnailPath || ''),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        version: Number(data.version) || 1,
        // 可选字段
        authorId: data.authorId ? String(data.authorId) : undefined,
        category: data.category ? String(data.category) : undefined,
        usageCount: data.usageCount ? Number(data.usageCount) : undefined,
        rating: data.rating ? Number(data.rating) : undefined
      }

      // 验证清理后的数据
      const validationResult = validatePromptTemplate(sanitized)
      return validationResult.isValid ? sanitized : null
    } catch (error) {
      return null
    }
  }

  /**
   * 处理缩略图上传
   * 这是一个占位符实现，实际应该与文件服务集成
   */
  private async handleThumbnailUpload(file: File): Promise<string> {
    // TODO: 实现实际的文件上传逻辑
    // 这里返回一个模拟的路径
    return `thumbnails/${generateId()}_${file.name}`
  }

  /**
   * 从本地存储加载模板数据
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        
        // 检查版本兼容性
        const versionCheck = versionControlService.checkVersionCompatibility(data)
        
        if (!versionCheck.isCompatible && !versionCheck.needsMigration) {
          console.error('不兼容的数据版本:', versionCheck.errors)
          this.templates = []
          return
        }

        // 如果需要迁移，执行迁移
        if (versionCheck.needsMigration) {
          this.migrateStoredData(data)
        } else {
          // 直接加载数据
          this.loadValidatedData(data)
        }
      }
    } catch (error) {
      console.warn('Failed to load templates from storage:', error)
      this.templates = []
    }
  }

  /**
   * 迁移存储的数据
   */
  private async migrateStoredData(data: any): Promise<void> {
    try {
      const migrationResult = await versionControlService.migrateData(data)
      
      if (migrationResult.success) {
        console.log('数据迁移成功:', migrationResult.appliedMigrations)
        this.loadValidatedData(migrationResult.migratedData)
        
        // 保存迁移后的数据
        await this.saveToStorage()
      } else {
        console.error('数据迁移失败:', migrationResult.errors)
        this.templates = []
      }
    } catch (error) {
      console.error('迁移过程中发生错误:', error)
      this.templates = []
    }
  }

  /**
   * 加载已验证的数据
   */
  private loadValidatedData(data: any): void {
    if (Array.isArray(data)) {
      this.templates = data
        .map(item => this.sanitizeTemplateData(item))
        .filter((template): template is PromptTemplate => template !== null)
    } else if (data && Array.isArray(data.templates)) {
      // 处理包装格式的数据
      this.templates = data.templates
        .map(item => this.sanitizeTemplateData(item))
        .filter((template): template is PromptTemplate => template !== null)
    } else {
      this.templates = []
    }
  }

  /**
   * 保存模板数据到本地存储
   */
  private async saveToStorage(): Promise<void> {
    try {
      // 创建版本化的数据结构
      const versionedData = {
        version: versionControlService.getVersionInfo().version,
        schemaVersion: versionControlService.getVersionInfo().schemaVersion,
        savedAt: new Date().toISOString(),
        templates: this.templates
      }
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(versionedData))
    } catch (error) {
      throw TemplateErrorFactory.createStorageError(
        ERROR_MESSAGES[TemplateErrorType.STORAGE_ERROR].WRITE_FAILED,
        'write'
      )
    }
  }

  /**
   * 创建数据备份
   */
  async createBackup(): Promise<{
    success: boolean
    backupData: string
    timestamp: string
    error?: string
  }> {
    try {
      return versionControlService.createBackup({
        templates: this.templates,
        metadata: {
          totalTemplates: this.templates.length,
          exportedAt: new Date().toISOString()
        }
      })
    } catch (error) {
      return {
        success: false,
        backupData: '',
        timestamp: new Date().toISOString(),
        error: `创建备份失败: ${error}`
      }
    }
  }

  /**
   * 从备份恢复数据
   */
  async restoreFromBackup(backupData: string): Promise<{
    success: boolean
    restoredCount: number
    errors: string[]
  }> {
    try {
      const restoreResult = await versionControlService.restoreFromBackup(backupData)
      
      if (restoreResult.success && restoreResult.restoredData) {
        const restoredTemplates = restoreResult.restoredData.templates || []
        
        // 验证恢复的模板
        const validTemplates = restoredTemplates
          .map(item => this.sanitizeTemplateData(item))
          .filter((template): template is PromptTemplate => template !== null)
        
        this.templates = validTemplates
        await this.saveToStorage()
        
        return {
          success: true,
          restoredCount: validTemplates.length,
          errors: restoreResult.errors
        }
      } else {
        return {
          success: false,
          restoredCount: 0,
          errors: restoreResult.errors
        }
      }
    } catch (error) {
      return {
        success: false,
        restoredCount: 0,
        errors: [`恢复失败: ${error}`]
      }
    }
  }

  /**
   * 获取版本信息
   */
  getVersionInfo() {
    return versionControlService.getVersionInfo()
  }
}

// 导出单例实例
export const templateService = new TemplateService()