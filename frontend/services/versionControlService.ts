/**
 * 版本控制服务
 * Version Control Service for Prompt Template System
 */

import { PromptTemplate } from '../types/promptTemplate'

// 版本控制相关类型定义
export interface VersionInfo {
  version: number
  schemaVersion: string
  createdAt: string
  description: string
}

export interface MigrationRule {
  fromVersion: number
  toVersion: number
  migrate: (data: any) => any
  validate: (data: any) => boolean
}

export interface VersionControlConfig {
  currentVersion: number
  currentSchemaVersion: string
  supportedVersions: number[]
  migrationRules: MigrationRule[]
}

/**
 * 版本控制服务类
 */
export class VersionControlService {
  private static instance: VersionControlService
  private config: VersionControlConfig

  // 当前系统版本配置
  private static readonly CURRENT_VERSION = 1
  private static readonly CURRENT_SCHEMA_VERSION = '1.0.0'
  private static readonly SUPPORTED_VERSIONS = [1]

  private constructor() {
    this.config = {
      currentVersion: VersionControlService.CURRENT_VERSION,
      currentSchemaVersion: VersionControlService.CURRENT_SCHEMA_VERSION,
      supportedVersions: VersionControlService.SUPPORTED_VERSIONS,
      migrationRules: this.initializeMigrationRules()
    }
  }

  public static getInstance(): VersionControlService {
    if (!VersionControlService.instance) {
      VersionControlService.instance = new VersionControlService()
    }
    return VersionControlService.instance
  }

  /**
   * 检查数据版本兼容性
   */
  public checkVersionCompatibility(data: any): {
    isCompatible: boolean
    needsMigration: boolean
    currentVersion: number
    targetVersion: number
    errors: string[]
  } {
    const errors: string[] = []
    
    // 检查是否有版本信息
    if (!data.version && !data.schemaVersion) {
      // 假设是旧版本数据，需要迁移
      return {
        isCompatible: false,
        needsMigration: true,
        currentVersion: 0,
        targetVersion: this.config.currentVersion,
        errors: ['数据缺少版本信息，假设为旧版本格式']
      }
    }

    const dataVersion = data.version || 0
    const dataSchemaVersion = data.schemaVersion || '0.0.0'

    // 检查版本是否受支持
    if (!this.config.supportedVersions.includes(dataVersion)) {
      errors.push(`不支持的数据版本: ${dataVersion}`)
      return {
        isCompatible: false,
        needsMigration: false,
        currentVersion: dataVersion,
        targetVersion: this.config.currentVersion,
        errors
      }
    }

    // 检查是否需要升级
    const needsMigration = dataVersion < this.config.currentVersion

    return {
      isCompatible: true,
      needsMigration,
      currentVersion: dataVersion,
      targetVersion: this.config.currentVersion,
      errors
    }
  }

  /**
   * 执行数据迁移
   */
  public async migrateData(data: any): Promise<{
    success: boolean
    migratedData: any
    errors: string[]
    appliedMigrations: string[]
  }> {
    const errors: string[] = []
    const appliedMigrations: string[] = []
    let currentData = { ...data }

    try {
      const versionCheck = this.checkVersionCompatibility(data)
      
      if (!versionCheck.isCompatible && !versionCheck.needsMigration) {
        return {
          success: false,
          migratedData: data,
          errors: versionCheck.errors,
          appliedMigrations
        }
      }

      if (!versionCheck.needsMigration) {
        return {
          success: true,
          migratedData: data,
          errors: [],
          appliedMigrations
        }
      }

      // 执行迁移规则
      let currentVersion = versionCheck.currentVersion
      
      while (currentVersion < versionCheck.targetVersion) {
        const migrationRule = this.config.migrationRules.find(
          rule => rule.fromVersion === currentVersion && rule.toVersion === currentVersion + 1
        )

        if (!migrationRule) {
          errors.push(`找不到从版本 ${currentVersion} 到 ${currentVersion + 1} 的迁移规则`)
          break
        }

        try {
          // 验证迁移前数据
          if (!migrationRule.validate(currentData)) {
            errors.push(`版本 ${currentVersion} 数据验证失败`)
            break
          }

          // 执行迁移
          currentData = migrationRule.migrate(currentData)
          appliedMigrations.push(`${migrationRule.fromVersion} -> ${migrationRule.toVersion}`)
          currentVersion = migrationRule.toVersion

        } catch (error) {
          errors.push(`迁移失败 (${migrationRule.fromVersion} -> ${migrationRule.toVersion}): ${error}`)
          break
        }
      }

      // 更新版本信息
      if (errors.length === 0) {
        currentData.version = this.config.currentVersion
        currentData.schemaVersion = this.config.currentSchemaVersion
        currentData.migratedAt = new Date().toISOString()
      }

      return {
        success: errors.length === 0,
        migratedData: currentData,
        errors,
        appliedMigrations
      }

    } catch (error) {
      return {
        success: false,
        migratedData: data,
        errors: [`迁移过程中发生错误: ${error}`],
        appliedMigrations
      }
    }
  }

  /**
   * 验证模板数据结构
   */
  public validateTemplateStructure(template: any): {
    isValid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []

    // 检查必需字段
    const requiredFields = ['id', 'title', 'description', 'content', 'tags', 'thumbnailPath', 'createdAt', 'updatedAt']
    
    for (const field of requiredFields) {
      if (!(field in template)) {
        errors.push(`缺少必需字段: ${field}`)
      }
    }

    // 检查字段类型
    if (template.id && typeof template.id !== 'string') {
      errors.push('id 字段必须是字符串类型')
    }

    if (template.title && typeof template.title !== 'string') {
      errors.push('title 字段必须是字符串类型')
    }

    if (template.description && typeof template.description !== 'string') {
      errors.push('description 字段必须是字符串类型')
    }

    if (template.content && typeof template.content !== 'string') {
      errors.push('content 字段必须是字符串类型')
    }

    if (template.tags && !Array.isArray(template.tags)) {
      errors.push('tags 字段必须是数组类型')
    }

    if (template.thumbnailPath && typeof template.thumbnailPath !== 'string') {
      errors.push('thumbnailPath 字段必须是字符串类型')
    }

    // 检查版本字段
    if (template.version && typeof template.version !== 'number') {
      errors.push('version 字段必须是数字类型')
    }

    // 检查可选字段
    if (template.authorId && typeof template.authorId !== 'string') {
      warnings.push('authorId 字段应该是字符串类型')
    }

    if (template.category && typeof template.category !== 'string') {
      warnings.push('category 字段应该是字符串类型')
    }

    if (template.usageCount && typeof template.usageCount !== 'number') {
      warnings.push('usageCount 字段应该是数字类型')
    }

    if (template.rating && typeof template.rating !== 'number') {
      warnings.push('rating 字段应该是数字类型')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * 获取版本信息
   */
  public getVersionInfo(): VersionInfo {
    return {
      version: this.config.currentVersion,
      schemaVersion: this.config.currentSchemaVersion,
      createdAt: new Date().toISOString(),
      description: '提示词模板系统版本信息'
    }
  }

  /**
   * 初始化迁移规则
   */
  private initializeMigrationRules(): MigrationRule[] {
    return [
      // 从版本 0 (旧格式) 到版本 1 的迁移
      {
        fromVersion: 0,
        toVersion: 1,
        validate: (data: any) => {
          // 验证旧格式数据
          return data && (Array.isArray(data) || typeof data === 'object')
        },
        migrate: (data: any) => {
          // 如果是数组格式的旧数据
          if (Array.isArray(data)) {
            return data.map((item: any, index: number) => this.migrateOldTemplateFormat(item, index))
          }
          
          // 如果是单个对象
          if (typeof data === 'object' && !data.version) {
            return this.migrateOldTemplateFormat(data, 0)
          }

          return data
        }
      }
    ]
  }

  /**
   * 迁移旧模板格式到新格式
   */
  private migrateOldTemplateFormat(oldTemplate: any, index: number): PromptTemplate {
    const now = new Date().toISOString()
    
    return {
      id: oldTemplate.id || `migrated-${index}-${Date.now()}`,
      title: oldTemplate.title || oldTemplate.name || `迁移模板 ${index + 1}`,
      description: oldTemplate.description || oldTemplate.desc || '',
      content: oldTemplate.content || oldTemplate.prompt || '',
      tags: Array.isArray(oldTemplate.tags) ? oldTemplate.tags : [],
      thumbnailPath: oldTemplate.thumbnailPath || oldTemplate.thumbnail || '',
      createdAt: oldTemplate.createdAt || now,
      updatedAt: oldTemplate.updatedAt || now,
      version: 1,
      
      // 迁移可选字段
      authorId: oldTemplate.authorId || oldTemplate.author,
      category: oldTemplate.category,
      usageCount: oldTemplate.usageCount || 0,
      rating: oldTemplate.rating
    }
  }

  /**
   * 创建数据备份
   */
  public createBackup(data: any): {
    success: boolean
    backupData: string
    timestamp: string
    error?: string
  } {
    try {
      const backup = {
        version: this.config.currentVersion,
        schemaVersion: this.config.currentSchemaVersion,
        timestamp: new Date().toISOString(),
        data: data
      }

      return {
        success: true,
        backupData: JSON.stringify(backup, null, 2),
        timestamp: backup.timestamp
      }
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
  public async restoreFromBackup(backupData: string): Promise<{
    success: boolean
    restoredData: any
    errors: string[]
  }> {
    try {
      const backup = JSON.parse(backupData)
      
      if (!backup.data) {
        return {
          success: false,
          restoredData: null,
          errors: ['备份数据格式无效']
        }
      }

      // 检查并迁移备份数据
      const migrationResult = await this.migrateData(backup.data)
      
      return {
        success: migrationResult.success,
        restoredData: migrationResult.migratedData,
        errors: migrationResult.errors
      }
    } catch (error) {
      return {
        success: false,
        restoredData: null,
        errors: [`恢复备份失败: ${error}`]
      }
    }
  }
}

// 导出单例实例
export const versionControlService = VersionControlService.getInstance()