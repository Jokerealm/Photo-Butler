/**
 * 运行数据迁移脚本
 * Run Data Migration Script
 * 
 * 这个脚本用于执行完整的数据迁移流程
 * 可以通过命令行或浏览器控制台运行
 */

import { executeFullMigration, handleMigrationExceptions, cleanupMigrationData } from '../utils/promptTemplate/executeMigration'
import { migrationService } from '../utils/promptTemplate/migrationService'

/**
 * 主迁移函数
 */
async function runMigration() {
  console.log('🚀 开始执行提示词模板系统数据迁移')
  console.log('=' .repeat(50))
  
  try {
    // 步骤1: 检查异常情况
    console.log('\n🔍 步骤1: 检查系统状态和异常情况...')
    const exceptionCheck = await handleMigrationExceptions()
    
    if (!exceptionCheck.success) {
      console.log('⚠️ 发现系统异常，建议先解决以下问题:')
      exceptionCheck.recoveryActions.forEach((action, index) => {
        console.log(`  ${index + 1}. ${action}`)
      })
      
      const shouldContinue = confirm('发现异常情况，是否继续执行迁移？')
      if (!shouldContinue) {
        console.log('❌ 用户取消迁移')
        return
      }
    }
    
    // 步骤2: 执行迁移
    console.log('\n⚙️ 步骤2: 执行数据迁移...')
    const migrationResult = await executeFullMigration({
      filePath: '/prompt/prompt.txt',
      forceRemigration: false,
      validateOnly: false,
      createBackup: true
    })
    
    // 步骤3: 显示结果
    console.log('\n📊 步骤3: 迁移结果分析')
    console.log('-'.repeat(30))
    
    if (migrationResult.success) {
      console.log('✅ 迁移执行成功！')
      
      if (migrationResult.result) {
        console.log(`📦 创建了 ${migrationResult.result.templatesCreated} 个模板`)
        
        // 显示模板统计信息
        if (migrationResult.result.templates.length > 0) {
          const templates = migrationResult.result.templates
          const tagStats = getTagStatistics(templates)
          
          console.log('\n📈 模板统计信息:')
          console.log(`  - 总模板数: ${templates.length}`)
          console.log(`  - 平均内容长度: ${Math.round(templates.reduce((sum, t) => sum + t.content.length, 0) / templates.length)} 字符`)
          console.log(`  - 最常用标签: ${tagStats.slice(0, 5).map(([tag, count]) => `${tag}(${count})`).join(', ')}`)
          
          console.log('\n📝 模板列表:')
          templates.forEach((template, index) => {
            console.log(`  ${index + 1}. ${template.title}`)
            console.log(`     标签: ${template.tags.join(', ')}`)
            console.log(`     缩略图: ${template.thumbnailPath}`)
          })
        }
      }
      
      if (migrationResult.validationResult) {
        console.log(`🔍 验证结果: ${migrationResult.validationResult.templateCount} 个模板通过验证`)
      }
      
    } else {
      console.log('❌ 迁移执行失败')
      
      if (migrationResult.errors.length > 0) {
        console.log('\n错误详情:')
        migrationResult.errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`)
        })
      }
    }
    
    // 步骤4: 提供后续操作建议
    console.log('\n💡 后续操作建议:')
    
    if (migrationResult.success) {
      console.log('  ✅ 迁移成功完成，可以开始使用模板系统')
      console.log('  📱 在应用中访问模板列表查看迁移结果')
      console.log('  🔄 如需重新迁移，可以调用 remigrate() 函数')
    } else {
      console.log('  🔧 检查并解决上述错误')
      console.log('  🧹 如需清理数据重新开始，可以调用 cleanup() 函数')
      console.log('  📞 如问题持续，请检查控制台详细错误信息')
    }
    
    console.log('\n' + '='.repeat(50))
    console.log('🏁 数据迁移流程完成')
    
    return migrationResult
    
  } catch (error) {
    console.error('💥 迁移过程中发生未预期的错误:', error)
    console.log('\n🆘 紧急恢复建议:')
    console.log('  1. 刷新页面重试')
    console.log('  2. 检查浏览器控制台错误信息')
    console.log('  3. 确认网络连接正常')
    console.log('  4. 调用 cleanup() 清理数据后重试')
    
    throw error
  }
}

/**
 * 重新执行迁移
 */
async function remigrate() {
  console.log('🔄 重新执行数据迁移...')
  
  const confirmed = confirm('这将清除现有数据并重新迁移，确定继续吗？')
  if (!confirmed) {
    console.log('❌ 用户取消重新迁移')
    return
  }
  
  return await executeFullMigration({
    filePath: '/prompt/prompt.txt',
    forceRemigration: true,
    validateOnly: false,
    createBackup: true
  })
}

/**
 * 仅验证现有数据
 */
async function validateOnly() {
  console.log('🔍 验证现有迁移数据...')
  
  return await executeFullMigration({
    validateOnly: true
  })
}

/**
 * 清理迁移数据
 */
async function cleanup() {
  console.log('🧹 清理迁移数据...')
  
  const confirmed = confirm('这将删除所有迁移数据，确定继续吗？')
  if (!confirmed) {
    console.log('❌ 用户取消清理操作')
    return
  }
  
  const success = await cleanupMigrationData()
  
  if (success) {
    console.log('✅ 数据清理完成')
  } else {
    console.log('❌ 数据清理失败')
  }
  
  return success
}

/**
 * 获取标签统计信息
 */
function getTagStatistics(templates: any[]): Array<[string, number]> {
  const tagCounts = new Map<string, number>()
  
  templates.forEach(template => {
    template.tags.forEach((tag: string) => {
      tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
    })
  })
  
  return Array.from(tagCounts.entries())
    .sort(([, a], [, b]) => b - a)
}

/**
 * 获取迁移状态信息
 */
async function getStatus() {
  console.log('📊 获取迁移状态信息...')
  
  try {
    const status = await migrationService.getMigrationStatus()
    const validation = await migrationService.validateMigration()
    
    console.log('当前状态:')
    console.log(`  - 已迁移: ${status.hasMigrated}`)
    console.log(`  - 模板数量: ${status.templateCount}`)
    console.log(`  - 上次迁移: ${status.lastMigrationTime ? new Date(status.lastMigrationTime).toLocaleString() : '未知'}`)
    console.log(`  - 数据有效: ${validation.isValid}`)
    
    if (!validation.isValid && validation.errors.length > 0) {
      console.log('验证错误:')
      validation.errors.forEach((error: string, index: number) => {
        console.log(`  ${index + 1}. ${error}`)
      })
    }
    
    return { status, validation }
  } catch (error) {
    console.error('获取状态失败:', error)
    throw error
  }
}

// 导出函数供外部调用
export {
  runMigration,
  remigrate,
  validateOnly,
  cleanup,
  getStatus
}

// 在浏览器环境中，将函数添加到全局对象以便控制台调用
if (typeof window !== 'undefined') {
  (window as any).runMigration = runMigration;
  (window as any).remigrate = remigrate;
  (window as any).validateOnly = validateOnly;
  (window as any).cleanup = cleanup;
  (window as any).getStatus = getStatus;
  
  console.log('🎯 迁移函数已加载到全局对象:')
  console.log('  - runMigration(): 执行完整迁移')
  console.log('  - remigrate(): 重新迁移')
  console.log('  - validateOnly(): 仅验证数据')
  console.log('  - cleanup(): 清理数据')
  console.log('  - getStatus(): 获取状态')
}

// 如果作为模块直接运行，执行迁移
if (typeof require !== 'undefined' && require.main === module) {
  runMigration().catch(console.error)
}