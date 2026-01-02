/**
 * 数据迁移服务
 * Data Migration Service
 * 
 * 统一的数据迁移服务，整合解析、匹配和生成功能
 */

import { MigrationResult, PromptTemplate } from '../../types/promptTemplate'
import { readTextFile } from './promptParser'
import { performMigration, saveTemplatesToStorage, generateMigrationReport } from './templateGenerator'

/**
 * 数据迁移服务类
 */
export class MigrationService {
  private static instance: MigrationService
  
  private constructor() {}
  
  /**
   * 获取单例实例
   */
  public static getInstance(): MigrationService {
    if (!MigrationService.instance) {
      MigrationService.instance = new MigrationService()
    }
    return MigrationService.instance
  }
  
  /**
   * 从prompt.txt文件执行完整迁移
   * @param filePath 文件路径，默认为 '/prompt/prompt.txt'
   * @returns 迁移结果
   */
  public async migrateFromPromptFile(filePath: string = '/prompt/prompt.txt'): Promise<MigrationResult> {
    try {
      console.log('开始数据迁移...')
      
      // 1. 读取文件内容
      console.log('读取prompt文件:', filePath)
      const fileContent = await readTextFile(filePath)
      
      if (!fileContent || fileContent.trim() === '') {
        return {
          success: false,
          templatesCreated: 0,
          errors: ['文件内容为空或无法读取'],
          templates: []
        }
      }
      
      // 2. 执行迁移
      console.log('执行数据迁移...')
      const result = await performMigration(fileContent)
      
      // 3. 如果迁移成功，保存到本地存储
      if (result.success && result.templates.length > 0) {
        console.log('保存模板到本地存储...')
        const saveSuccess = await saveTemplatesToStorage(result.templates)
        
        if (!saveSuccess) {
          result.errors.push('保存到本地存储失败')
        }
      }
      
      // 4. 生成报告
      const report = generateMigrationReport(result)
      console.log('迁移报告:\n', report)
      
      return result
    } catch (error) {
      console.error('迁移过程中发生错误:', error)
      return {
        success: false,
        templatesCreated: 0,
        errors: [`迁移失败: ${error instanceof Error ? error.message : '未知错误'}`],
        templates: []
      }
    }
  }
  
  /**
   * 从字符串内容执行迁移
   * @param content 文件内容
   * @returns 迁移结果
   */
  public async migrateFromContent(content: string): Promise<MigrationResult> {
    try {
      console.log('从内容执行迁移...')
      
      if (!content || content.trim() === '') {
        return {
          success: false,
          templatesCreated: 0,
          errors: ['内容为空'],
          templates: []
        }
      }
      
      const result = await performMigration(content)
      
      if (result.success && result.templates.length > 0) {
        const saveSuccess = await saveTemplatesToStorage(result.templates)
        if (!saveSuccess) {
          result.errors.push('保存到本地存储失败')
        }
      }
      
      return result
    } catch (error) {
      console.error('从内容迁移失败:', error)
      return {
        success: false,
        templatesCreated: 0,
        errors: [`迁移失败: ${error instanceof Error ? error.message : '未知错误'}`],
        templates: []
      }
    }
  }
  
  /**
   * 检查是否需要迁移
   * @returns 是否需要迁移
   */
  public async needsMigration(): Promise<boolean> {
    try {
      // 检查本地存储中是否已有模板数据
      const existingData = localStorage.getItem('promptTemplates')
      
      if (existingData) {
        const data = JSON.parse(existingData)
        // 如果已有数据且包含模板，则不需要迁移
        return !(data && ((Array.isArray(data.templates) && data.templates.length > 0) || 
                         (Array.isArray(data) && data.length > 0)))
      }
      
      return true
    } catch (error) {
      console.error('检查迁移状态失败:', error)
      return true // 出错时默认需要迁移
    }
  }
  
  /**
   * 获取迁移状态信息
   * @returns 状态信息
   */
  public async getMigrationStatus(): Promise<{
    hasMigrated: boolean
    templateCount: number
    lastMigrationTime?: string
  }> {
    try {
      const existingData = localStorage.getItem('promptTemplates')
      
      if (!existingData) {
        return {
          hasMigrated: false,
          templateCount: 0
        }
      }
      
      const data = JSON.parse(existingData)
      let templates: PromptTemplate[] = []
      let generatedAt: string | undefined
      
      if (data && Array.isArray(data.templates)) {
        templates = data.templates
        generatedAt = data.generatedAt
      } else if (Array.isArray(data)) {
        templates = data
      }
      
      return {
        hasMigrated: templates.length > 0,
        templateCount: templates.length,
        lastMigrationTime: generatedAt
      }
    } catch (error) {
      console.error('获取迁移状态失败:', error)
      return {
        hasMigrated: false,
        templateCount: 0
      }
    }
  }
  
  /**
   * 清除迁移数据
   * @returns 是否成功
   */
  public async clearMigrationData(): Promise<boolean> {
    try {
      // 清除主数据
      localStorage.removeItem('promptTemplates')
      
      // 清除所有备份
      const allKeys = Object.keys(localStorage)
      const backupKeys = allKeys.filter(key => key.startsWith('promptTemplates_backup_'))
      
      backupKeys.forEach(key => {
        localStorage.removeItem(key)
      })
      
      console.log('迁移数据已清除')
      return true
    } catch (error) {
      console.error('清除迁移数据失败:', error)
      return false
    }
  }
  
  /**
   * 重新执行迁移
   * @param filePath 文件路径
   * @returns 迁移结果
   */
  public async remigrate(filePath: string = '/prompt/prompt.txt'): Promise<MigrationResult> {
    console.log('重新执行迁移...')
    
    // 先清除现有数据
    await this.clearMigrationData()
    
    // 重新执行迁移
    return await this.migrateFromPromptFile(filePath)
  }
  
  /**
   * 验证迁移结果
   * @returns 验证结果
   */
  public async validateMigration(): Promise<{
    isValid: boolean
    errors: string[]
    templateCount: number
  }> {
    try {
      const existingData = localStorage.getItem('promptTemplates')
      
      if (!existingData) {
        return {
          isValid: false,
          errors: ['没有找到迁移数据'],
          templateCount: 0
        }
      }
      
      const data = JSON.parse(existingData)
      let templates: PromptTemplate[] = []
      
      if (data && Array.isArray(data.templates)) {
        templates = data.templates
      } else if (Array.isArray(data)) {
        templates = data
      } else {
        return {
          isValid: false,
          errors: ['数据格式无效'],
          templateCount: 0
        }
      }
      
      const errors: string[] = []
      
      // 验证每个模板
      templates.forEach((template, index) => {
        if (!template.id) {
          errors.push(`模板 ${index + 1}: 缺少ID`)
        }
        if (!template.title) {
          errors.push(`模板 ${index + 1}: 缺少标题`)
        }
        if (!template.content) {
          errors.push(`模板 ${index + 1}: 缺少内容`)
        }
        if (!template.thumbnailPath) {
          errors.push(`模板 ${index + 1}: 缺少缩略图路径`)
        }
      })
      
      return {
        isValid: errors.length === 0,
        errors,
        templateCount: templates.length
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`验证失败: ${error instanceof Error ? error.message : '未知错误'}`],
        templateCount: 0
      }
    }
  }
}

/**
 * 导出单例实例
 */
export const migrationService = MigrationService.getInstance()

/**
 * 便捷函数：执行迁移
 */
export async function executeMigration(filePath?: string): Promise<MigrationResult> {
  return await migrationService.migrateFromPromptFile(filePath)
}

/**
 * 便捷函数：检查迁移状态
 */
export async function checkMigrationStatus() {
  return await migrationService.getMigrationStatus()
}

/**
 * 便捷函数：验证迁移
 */
export async function validateMigrationData() {
  return await migrationService.validateMigration()
}