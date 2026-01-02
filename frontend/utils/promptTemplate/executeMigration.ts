/**
 * 执行完整数据迁移
 * Execute Complete Data Migration
 * 
 * 这个脚本负责执行完整的数据迁移流程，包括：
 * 1. 读取prompt.txt文件
 * 2. 解析提示词内容
 * 3. 匹配缩略图
 * 4. 生成JSON模板
 * 5. 验证迁移结果
 * 6. 处理异常情况
 */

import { migrationService } from './migrationService'
import { MigrationResult } from '../../types/promptTemplate'

/**
 * 迁移执行器类
 */
export class MigrationExecutor {
  private static instance: MigrationExecutor
  
  private constructor() {}
  
  public static getInstance(): MigrationExecutor {
    if (!MigrationExecutor.instance) {
      MigrationExecutor.instance = new MigrationExecutor()
    }
    return MigrationExecutor.instance
  }
  
  /**
   * 执行完整的数据迁移流程
   * @param options 迁移选项
   * @returns 迁移结果
   */
  public async executeFullMigration(options: {
    filePath?: string
    forceRemigration?: boolean
    validateOnly?: boolean
    createBackup?: boolean
  } = {}): Promise<{
    success: boolean
    result?: MigrationResult
    validationResult?: any
    errors: string[]
    summary: string
  }> {
    const {
      filePath = '/prompt/prompt.txt',
      forceRemigration = false,
      validateOnly = false,
      createBackup = true
    } = options
    
    const errors: string[] = []
    let result: MigrationResult | undefined
    let validationResult: any
    
    try {
      console.log('🚀 开始执行数据迁移流程...')
      console.log(`文件路径: ${filePath}`)
      console.log(`强制重新迁移: ${forceRemigration}`)
      console.log(`仅验证模式: ${validateOnly}`)
      
      // 步骤1: 检查当前迁移状态
      console.log('\n📊 步骤1: 检查迁移状态...')
      const currentStatus = await migrationService.getMigrationStatus()
      console.log(`当前状态: 已迁移=${currentStatus.hasMigrated}, 模板数量=${currentStatus.templateCount}`)
      
      if (currentStatus.lastMigrationTime) {
        console.log(`上次迁移时间: ${new Date(currentStatus.lastMigrationTime).toLocaleString()}`)
      }
      
      // 步骤2: 决定是否需要执行迁移
      const needsMigration = forceRemigration || await migrationService.needsMigration()
      console.log(`需要迁移: ${needsMigration}`)
      
      if (validateOnly) {
        console.log('\n🔍 仅验证模式: 跳过迁移，直接验证现有数据...')
      } else if (needsMigration) {
        // 步骤3: 创建备份（如果需要）
        if (createBackup && currentStatus.hasMigrated) {
          console.log('\n💾 步骤3: 创建数据备份...')
          await this.createBackup()
        }
        
        // 步骤4: 执行迁移
        console.log('\n⚙️ 步骤4: 执行数据迁移...')
        
        if (forceRemigration) {
          result = await migrationService.remigrate(filePath)
        } else {
          result = await migrationService.migrateFromPromptFile(filePath)
        }
        
        console.log(`迁移结果: 成功=${result.success}, 创建模板=${result.templatesCreated}`)
        
        if (result.errors.length > 0) {
          console.log('迁移警告/错误:')
          result.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error}`)
            errors.push(error)
          })
        }
        
        // 显示创建的模板摘要
        if (result.success && result.templates.length > 0) {
          console.log('\n📝 创建的模板摘要:')
          result.templates.slice(0, 5).forEach((template, index) => {
            console.log(`  ${index + 1}. ${template.title} (${template.tags.join(', ')})`)
          })
          
          if (result.templates.length > 5) {
            console.log(`  ... 还有 ${result.templates.length - 5} 个模板`)
          }
        }
      } else {
        console.log('\n✅ 数据已存在，跳过迁移步骤')
      }
      
      // 步骤5: 验证迁移结果
      console.log('\n🔍 步骤5: 验证迁移结果...')
      validationResult = await migrationService.validateMigration()
      
      console.log(`验证结果: 有效=${validationResult.isValid}, 模板数量=${validationResult.templateCount}`)
      
      if (!validationResult.isValid) {
        console.log('验证错误:')
        validationResult.errors.forEach((error: string, index: number) => {
          console.log(`  ${index + 1}. ${error}`)
          errors.push(`验证错误: ${error}`)
        })
      }
      
      // 步骤6: 生成最终报告
      const summary = this.generateExecutionSummary({
        migrationExecuted: needsMigration && !validateOnly,
        migrationResult: result,
        validationResult,
        errors
      })
      
      console.log('\n📋 执行摘要:')
      console.log(summary)
      
      const success = (result?.success !== false) && validationResult.isValid && errors.length === 0
      
      return {
        success,
        result,
        validationResult,
        errors,
        summary
      }
      
    } catch (error) {
      const errorMessage = `迁移执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      console.error('❌', errorMessage)
      errors.push(errorMessage)
      
      return {
        success: false,
        errors,
        summary: `迁移执行失败: ${errorMessage}`
      }
    }
  }
  
  /**
   * 创建数据备份
   */
  private async createBackup(): Promise<void> {
    try {
      const existingData = localStorage.getItem('promptTemplates')
      if (existingData) {
        const backupKey = `promptTemplates_manual_backup_${Date.now()}`
        localStorage.setItem(backupKey, existingData)
        console.log(`✅ 备份已创建: ${backupKey}`)
      }
    } catch (error) {
      console.warn('⚠️ 创建备份失败:', error)
    }
  }
  
  /**
   * 生成执行摘要
   */
  private generateExecutionSummary(params: {
    migrationExecuted: boolean
    migrationResult?: MigrationResult
    validationResult: any
    errors: string[]
  }): string {
    const { migrationExecuted, migrationResult, validationResult, errors } = params
    
    const lines: string[] = []
    lines.push('=== 数据迁移执行摘要 ===')
    lines.push(`执行时间: ${new Date().toLocaleString()}`)
    lines.push('')
    
    if (migrationExecuted) {
      lines.push('📦 迁移执行情况:')
      if (migrationResult) {
        lines.push(`  - 状态: ${migrationResult.success ? '成功' : '失败'}`)
        lines.push(`  - 创建模板: ${migrationResult.templatesCreated} 个`)
        lines.push(`  - 迁移错误: ${migrationResult.errors.length} 个`)
      }
    } else {
      lines.push('📦 迁移执行情况: 跳过（数据已存在或仅验证模式）')
    }
    
    lines.push('')
    lines.push('🔍 验证结果:')
    lines.push(`  - 数据有效性: ${validationResult.isValid ? '通过' : '失败'}`)
    lines.push(`  - 模板总数: ${validationResult.templateCount} 个`)
    lines.push(`  - 验证错误: ${validationResult.errors.length} 个`)
    
    if (errors.length > 0) {
      lines.push('')
      lines.push('⚠️ 问题汇总:')
      errors.forEach((error, index) => {
        lines.push(`  ${index + 1}. ${error}`)
      })
    }
    
    lines.push('')
    lines.push(`总体状态: ${errors.length === 0 && validationResult.isValid ? '✅ 成功' : '❌ 存在问题'}`)
    
    return lines.join('\n')
  }
  
  /**
   * 处理迁移异常情况
   */
  public async handleMigrationExceptions(): Promise<{
    recoveryActions: string[]
    success: boolean
  }> {
    const recoveryActions: string[] = []
    
    try {
      console.log('🔧 检查并处理迁移异常情况...')
      
      // 检查1: 验证prompt.txt文件是否可访问
      try {
        const response = await fetch('/prompt/prompt.txt')
        if (!response.ok) {
          recoveryActions.push(`无法访问prompt.txt文件 (${response.status}): 请确认文件存在且路径正确`)
        }
      } catch (error) {
        recoveryActions.push('无法访问prompt.txt文件: 请检查网络连接和文件路径')
      }
      
      // 检查2: 验证localStorage可用性
      try {
        const testKey = 'migration_test_' + Date.now()
        localStorage.setItem(testKey, 'test')
        localStorage.removeItem(testKey)
      } catch (error) {
        recoveryActions.push('localStorage不可用: 请检查浏览器设置和存储权限')
      }
      
      // 检查3: 验证现有数据完整性
      try {
        const existingData = localStorage.getItem('promptTemplates')
        if (existingData) {
          JSON.parse(existingData)
        }
      } catch (error) {
        recoveryActions.push('现有数据损坏: 建议清除数据并重新迁移')
      }
      
      // 检查4: 验证缩略图文件可访问性
      const sampleThumbnails = ['/image/placeholder.png', '/image/雨夜出逃.png']
      for (const thumbnail of sampleThumbnails) {
        try {
          const response = await fetch(thumbnail, { method: 'HEAD' })
          if (!response.ok) {
            recoveryActions.push(`缩略图文件不可访问: ${thumbnail}`)
            break
          }
        } catch (error) {
          recoveryActions.push('缩略图文件访问异常: 请检查image目录')
          break
        }
      }
      
      if (recoveryActions.length === 0) {
        console.log('✅ 未发现异常情况')
        return { recoveryActions: [], success: true }
      } else {
        console.log('⚠️ 发现以下异常情况:')
        recoveryActions.forEach((action, index) => {
          console.log(`  ${index + 1}. ${action}`)
        })
        return { recoveryActions, success: false }
      }
      
    } catch (error) {
      const errorMessage = `异常检查失败: ${error instanceof Error ? error.message : '未知错误'}`
      console.error('❌', errorMessage)
      return {
        recoveryActions: [errorMessage],
        success: false
      }
    }
  }
  
  /**
   * 清理和重置迁移数据
   */
  public async cleanupAndReset(): Promise<boolean> {
    try {
      console.log('🧹 清理和重置迁移数据...')
      
      const success = await migrationService.clearMigrationData()
      
      if (success) {
        console.log('✅ 数据清理完成')
      } else {
        console.log('❌ 数据清理失败')
      }
      
      return success
    } catch (error) {
      console.error('清理过程中发生错误:', error)
      return false
    }
  }
}

/**
 * 导出单例实例
 */
export const migrationExecutor = MigrationExecutor.getInstance()

/**
 * 便捷函数：执行完整迁移
 */
export async function executeFullMigration(options?: {
  filePath?: string
  forceRemigration?: boolean
  validateOnly?: boolean
  createBackup?: boolean
}) {
  return await migrationExecutor.executeFullMigration(options)
}

/**
 * 便捷函数：处理异常情况
 */
export async function handleMigrationExceptions() {
  return await migrationExecutor.handleMigrationExceptions()
}

/**
 * 便捷函数：清理数据
 */
export async function cleanupMigrationData() {
  return await migrationExecutor.cleanupAndReset()
}