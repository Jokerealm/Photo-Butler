/**
 * 测试数据迁移功能
 * Test Migration Functionality
 */

import { migrationService } from './migrationService'

/**
 * 测试迁移功能
 */
export async function testMigration() {
  console.log('=== 开始测试数据迁移功能 ===')
  
  try {
    // 1. 检查迁移状态
    console.log('\n1. 检查迁移状态...')
    const status = await migrationService.getMigrationStatus()
    console.log('迁移状态:', status)
    
    // 2. 检查是否需要迁移
    console.log('\n2. 检查是否需要迁移...')
    const needsMigration = await migrationService.needsMigration()
    console.log('需要迁移:', needsMigration)
    
    // 3. 执行迁移
    if (needsMigration) {
      console.log('\n3. 执行迁移...')
      const result = await migrationService.migrateFromPromptFile()
      console.log('迁移结果:', result)
      
      if (result.success) {
        console.log(`✅ 迁移成功！创建了 ${result.templatesCreated} 个模板`)
        
        // 显示前几个模板的信息
        if (result.templates.length > 0) {
          console.log('\n前3个模板:')
          result.templates.slice(0, 3).forEach((template, index) => {
            console.log(`${index + 1}. ${template.title}`)
            console.log(`   描述: ${template.description}`)
            console.log(`   标签: ${template.tags.join(', ')}`)
            console.log(`   缩略图: ${template.thumbnailPath}`)
            console.log('')
          })
        }
      } else {
        console.log('❌ 迁移失败:')
        result.errors.forEach(error => console.log(`   - ${error}`))
      }
    } else {
      console.log('✅ 已有迁移数据，无需重新迁移')
    }
    
    // 4. 验证迁移结果
    console.log('\n4. 验证迁移结果...')
    const validation = await migrationService.validateMigration()
    console.log('验证结果:', validation)
    
    if (validation.isValid) {
      console.log(`✅ 验证通过！共有 ${validation.templateCount} 个有效模板`)
    } else {
      console.log('❌ 验证失败:')
      validation.errors.forEach(error => console.log(`   - ${error}`))
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error)
  }
  
  console.log('\n=== 测试完成 ===')
}

/**
 * 测试单个功能模块
 */
export async function testIndividualModules() {
  console.log('=== 测试单个功能模块 ===')
  
  try {
    // 测试解析器
    const { parsePromptFile, validateParsedItems } = await import('./promptParser')
    
    const sampleContent = `1. 测试标题：这是一个测试提示词内容，用于验证解析功能是否正常工作。
2. 另一个测试：这是第二个测试项目，包含更多的内容来验证解析的准确性。`
    
    console.log('\n测试解析器...')
    const parsedItems = parsePromptFile(sampleContent)
    console.log('解析结果:', parsedItems)
    
    const validation = validateParsedItems(parsedItems)
    console.log('验证结果:', validation)
    
    // 测试缩略图匹配
    const { matchThumbnail, generateMatchingReport } = await import('./thumbnailMatcher')
    
    console.log('\n测试缩略图匹配...')
    if (parsedItems.length > 0) {
      const thumbnail = matchThumbnail(parsedItems[0])
      console.log('匹配的缩略图:', thumbnail)
      
      const report = generateMatchingReport(parsedItems)
      console.log('匹配报告:', report)
    }
    
    // 测试模板生成
    const { convertToTemplate, validateGeneratedTemplates } = await import('./templateGenerator')
    
    console.log('\n测试模板生成...')
    if (parsedItems.length > 0) {
      const template = convertToTemplate(parsedItems[0])
      console.log('生成的模板:', template)
      
      const templateValidation = validateGeneratedTemplates([template])
      console.log('模板验证:', templateValidation)
    }
    
  } catch (error) {
    console.error('模块测试失败:', error)
  }
}

// 如果直接运行此文件，执行测试
if (typeof window !== 'undefined') {
  // 在浏览器环境中，可以通过控制台调用
  (window as any).testMigration = testMigration
  (window as any).testIndividualModules = testIndividualModules
}