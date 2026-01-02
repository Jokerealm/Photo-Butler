/**
 * 组件集成测试
 * Component Integration Test
 * 
 * 测试完整的用户流程和组件集成
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1
 */

import { templateService } from '../../services/TemplateService'
import { migrationService } from './migrationService'
import { executeFullMigration } from './executeMigration'
import { PromptTemplate, CreateTemplateRequest } from '../../types/promptTemplate'

/**
 * 集成测试执行器
 */
export class IntegrationTestExecutor {
  private static instance: IntegrationTestExecutor
  
  private constructor() {}
  
  public static getInstance(): IntegrationTestExecutor {
    if (!IntegrationTestExecutor.instance) {
      IntegrationTestExecutor.instance = new IntegrationTestExecutor()
    }
    return IntegrationTestExecutor.instance
  }
  
  /**
   * 执行完整的集成测试
   */
  public async executeFullIntegrationTest(): Promise<{
    success: boolean
    results: IntegrationTestResult[]
    summary: string
    errors: string[]
  }> {
    console.log('🚀 开始执行完整的组件集成测试...')
    console.log('='.repeat(60))
    
    const results: IntegrationTestResult[] = []
    const errors: string[] = []
    
    try {
      // 测试1: 数据迁移集成
      console.log('\\n📦 测试1: 数据迁移集成...')
      const migrationResult = await this.testMigrationIntegration()
      results.push(migrationResult)
      
      if (!migrationResult.success) {
        errors.push(`迁移集成测试失败: ${migrationResult.error}`)
      }
      
      // 测试2: 模板服务集成
      console.log('\\n🔧 测试2: 模板服务集成...')
      const serviceResult = await this.testTemplateServiceIntegration()
      results.push(serviceResult)
      
      if (!serviceResult.success) {
        errors.push(`服务集成测试失败: ${serviceResult.error}`)
      }
      
      // 测试3: 搜索和筛选集成
      console.log('\\n🔍 测试3: 搜索和筛选集成...')
      const searchResult = await this.testSearchAndFilterIntegration()
      results.push(searchResult)
      
      if (!searchResult.success) {
        errors.push(`搜索筛选集成测试失败: ${searchResult.error}`)
      }
      
      // 测试4: CRUD操作集成
      console.log('\\n📝 测试4: CRUD操作集成...')
      const crudResult = await this.testCRUDIntegration()
      results.push(crudResult)
      
      if (!crudResult.success) {
        errors.push(`CRUD集成测试失败: ${crudResult.error}`)
      }
      
      // 测试5: 用户流程集成
      console.log('\\n👤 测试5: 用户流程集成...')
      const userFlowResult = await this.testUserFlowIntegration()
      results.push(userFlowResult)
      
      if (!userFlowResult.success) {
        errors.push(`用户流程集成测试失败: ${userFlowResult.error}`)
      }
      
      // 测试6: 性能和优化测试
      console.log('\\n⚡ 测试6: 性能和优化测试...')
      const performanceResult = await this.testPerformanceOptimization()
      results.push(performanceResult)
      
      if (!performanceResult.success) {
        errors.push(`性能优化测试失败: ${performanceResult.error}`)
      }
      
      // 生成测试摘要
      const summary = this.generateTestSummary(results, errors)
      const overallSuccess = errors.length === 0
      
      console.log('\\n📋 集成测试摘要:')
      console.log('-'.repeat(40))
      console.log(summary)
      
      if (overallSuccess) {
        console.log('\\n✅ 所有集成测试通过！')
      } else {
        console.log('\\n❌ 部分集成测试失败')
        console.log('错误详情:')
        errors.forEach((error, index) => {
          console.log(`  ${index + 1}. ${error}`)
        })
      }
      
      return {
        success: overallSuccess,
        results,
        summary,
        errors
      }
      
    } catch (error) {
      const errorMessage = `集成测试执行失败: ${error instanceof Error ? error.message : '未知错误'}`
      console.error('💥', errorMessage)
      
      return {
        success: false,
        results,
        summary: errorMessage,
        errors: [errorMessage]
      }
    }
  }
  
  /**
   * 测试数据迁移集成
   */
  private async testMigrationIntegration(): Promise<IntegrationTestResult> {
    const testName = '数据迁移集成'
    const startTime = Date.now()
    
    try {
      // 1. 检查迁移状态
      const migrationStatus = await migrationService.getMigrationStatus()
      console.log(`  迁移状态: 已迁移=${migrationStatus.hasMigrated}, 模板数量=${migrationStatus.templateCount}`)
      
      // 2. 如果没有数据，执行迁移
      if (!migrationStatus.hasMigrated || migrationStatus.templateCount === 0) {
        console.log('  执行数据迁移...')
        const migrationResult = await executeFullMigration({
          filePath: '/prompt/prompt.txt',
          forceRemigration: false,
          validateOnly: false,
          createBackup: true
        })
        
        if (!migrationResult.success) {
          throw new Error(`迁移失败: ${migrationResult.errors.join(', ')}`)
        }
        
        console.log(`  ✅ 迁移成功，创建了 ${migrationResult.result?.templatesCreated || 0} 个模板`)
      }
      
      // 3. 验证迁移结果
      const validation = await migrationService.validateMigration()
      if (!validation.isValid) {
        throw new Error(`迁移验证失败: ${validation.errors.join(', ')}`)
      }
      
      console.log(`  ✅ 验证通过，共有 ${validation.templateCount} 个有效模板`)
      
      return {
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: `迁移验证通过，模板数量: ${validation.templateCount}`
      }
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
  
  /**
   * 测试模板服务集成
   */
  private async testTemplateServiceIntegration(): Promise<IntegrationTestResult> {
    const testName = '模板服务集成'
    const startTime = Date.now()
    
    try {
      // 1. 测试获取所有模板
      const allTemplates = await templateService.getAllTemplates()
      console.log(`  获取到 ${allTemplates.length} 个模板`)
      
      if (allTemplates.length === 0) {
        throw new Error('没有找到任何模板数据')
      }
      
      // 2. 测试根据ID获取模板
      const firstTemplate = allTemplates[0]
      const retrievedTemplate = await templateService.getTemplateById(firstTemplate.id)
      
      if (!retrievedTemplate) {
        throw new Error('无法根据ID获取模板')
      }
      
      if (retrievedTemplate.id !== firstTemplate.id) {
        throw new Error('获取的模板ID不匹配')
      }
      
      console.log(`  ✅ 成功根据ID获取模板: ${retrievedTemplate.title}`)
      
      // 3. 测试获取可用标签
      const availableTags = await templateService.getAvailableTags()
      console.log(`  获取到 ${availableTags.length} 个可用标签: ${availableTags.slice(0, 5).join(', ')}${availableTags.length > 5 ? '...' : ''}`)
      
      // 4. 测试模板验证
      const isValid = await templateService.validateTemplate(firstTemplate)
      if (!isValid) {
        throw new Error('模板验证失败')
      }
      
      console.log(`  ✅ 模板验证通过`)
      
      return {
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: `服务集成测试通过，模板数量: ${allTemplates.length}, 标签数量: ${availableTags.length}`
      }
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
  
  /**
   * 测试搜索和筛选集成
   */
  private async testSearchAndFilterIntegration(): Promise<IntegrationTestResult> {
    const testName = '搜索和筛选集成'
    const startTime = Date.now()
    
    try {
      // 1. 测试关键词搜索
      const searchResult1 = await templateService.searchTemplates({
        query: '雨夜',
        limit: 10
      })
      
      console.log(`  关键词搜索 "雨夜": 找到 ${searchResult1.templates.length} 个结果`)
      
      // 验证搜索结果
      const hasRainyNightTemplate = searchResult1.templates.some(t => 
        t.title.includes('雨夜') || t.content.includes('雨夜')
      )
      
      if (!hasRainyNightTemplate && searchResult1.templates.length > 0) {
        throw new Error('搜索结果不包含相关内容')
      }
      
      // 2. 测试标签筛选
      const availableTags = await templateService.getAvailableTags()
      if (availableTags.length > 0) {
        const firstTag = availableTags[0]
        const tagFilterResult = await templateService.filterByTags([firstTag])
        
        console.log(`  标签筛选 "${firstTag}": 找到 ${tagFilterResult.length} 个结果`)
        
        // 验证筛选结果
        const allHaveTag = tagFilterResult.every(t => t.tags.includes(firstTag))
        if (!allHaveTag) {
          throw new Error('标签筛选结果不正确')
        }
      }
      
      // 3. 测试组合搜索
      if (availableTags.length > 1) {
        const searchResult2 = await templateService.searchTemplates({
          query: '写真',
          tags: [availableTags[0]],
          limit: 5
        })
        
        console.log(`  组合搜索: 找到 ${searchResult2.templates.length} 个结果`)
      }
      
      console.log(`  ✅ 搜索和筛选功能正常`)
      
      return {
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: `搜索筛选测试通过，可用标签: ${availableTags.length}`
      }
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
  
  /**
   * 测试CRUD操作集成
   */
  private async testCRUDIntegration(): Promise<IntegrationTestResult> {
    const testName = 'CRUD操作集成'
    const startTime = Date.now()
    
    try {
      const initialCount = (await templateService.getAllTemplates()).length
      
      // 1. 测试创建模板
      const createRequest: CreateTemplateRequest = {
        title: '集成测试模板',
        description: '这是一个用于集成测试的模板',
        content: '这是集成测试模板的内容，用于验证CRUD操作是否正常工作。',
        tags: ['测试', '集成', 'CRUD']
      }
      
      const createdTemplate = await templateService.createTemplate(createRequest)
      console.log(`  ✅ 创建模板成功: ${createdTemplate.title}`)
      
      // 验证创建结果
      const afterCreateCount = (await templateService.getAllTemplates()).length
      if (afterCreateCount !== initialCount + 1) {
        throw new Error('创建模板后数量不正确')
      }
      
      // 2. 测试更新模板
      const updateRequest = {
        title: '更新后的集成测试模板',
        description: '这是更新后的描述',
        tags: ['测试', '集成', 'CRUD', '更新']
      }
      
      const updatedTemplate = await templateService.updateTemplate(createdTemplate.id, updateRequest)
      console.log(`  ✅ 更新模板成功: ${updatedTemplate.title}`)
      
      // 验证更新结果
      if (updatedTemplate.title !== updateRequest.title) {
        throw new Error('模板更新不正确')
      }
      
      // 3. 测试删除模板
      await templateService.deleteTemplate(createdTemplate.id)
      console.log(`  ✅ 删除模板成功`)
      
      // 验证删除结果
      const afterDeleteCount = (await templateService.getAllTemplates()).length
      if (afterDeleteCount !== initialCount) {
        throw new Error('删除模板后数量不正确')
      }
      
      // 验证模板确实被删除
      const deletedTemplate = await templateService.getTemplateById(createdTemplate.id)
      if (deletedTemplate !== null) {
        throw new Error('模板删除失败，仍能获取到已删除的模板')
      }
      
      return {
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: `CRUD操作测试通过，初始模板数: ${initialCount}`
      }
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
  
  /**
   * 测试用户流程集成
   */
  private async testUserFlowIntegration(): Promise<IntegrationTestResult> {
    const testName = '用户流程集成'
    const startTime = Date.now()
    
    try {
      // 模拟完整的用户使用流程
      
      // 1. 用户进入应用，加载模板列表
      const allTemplates = await templateService.getAllTemplates()
      console.log(`  步骤1: 加载模板列表 - ${allTemplates.length} 个模板`)
      
      if (allTemplates.length === 0) {
        throw new Error('没有可用的模板')
      }
      
      // 2. 用户搜索特定模板
      const searchQuery = '写真'
      const searchResults = await templateService.searchTemplates({
        query: searchQuery,
        limit: 10
      })
      console.log(`  步骤2: 搜索 "${searchQuery}" - 找到 ${searchResults.templates.length} 个结果`)
      
      // 3. 用户查看模板详情
      if (searchResults.templates.length > 0) {
        const selectedTemplate = searchResults.templates[0]
        const templateDetail = await templateService.getTemplateById(selectedTemplate.id)
        
        if (!templateDetail) {
          throw new Error('无法获取模板详情')
        }
        
        console.log(`  步骤3: 查看模板详情 - ${templateDetail.title}`)
      }
      
      // 4. 用户按标签筛选
      const availableTags = await templateService.getAvailableTags()
      if (availableTags.length > 0) {
        const selectedTag = availableTags[0]
        const tagResults = await templateService.filterByTags([selectedTag])
        console.log(`  步骤4: 按标签 "${selectedTag}" 筛选 - 找到 ${tagResults.length} 个结果`)
      }
      
      // 5. 用户创建新模板（模拟上传流程）
      const newTemplate: CreateTemplateRequest = {
        title: '用户创建的测试模板',
        description: '这是用户通过上传流程创建的模板',
        content: '用户自定义的提示词内容，包含详细的描述和要求。',
        tags: ['用户创建', '测试', '自定义']
      }
      
      const createdTemplate = await templateService.createTemplate(newTemplate)
      console.log(`  步骤5: 创建新模板 - ${createdTemplate.title}`)
      
      // 6. 用户编辑模板
      const editedTemplate = await templateService.updateTemplate(createdTemplate.id, {
        description: '用户编辑后的描述',
        tags: [...createdTemplate.tags, '已编辑']
      })
      console.log(`  步骤6: 编辑模板 - 添加标签 "已编辑"`)
      
      // 7. 清理测试数据
      await templateService.deleteTemplate(createdTemplate.id)
      console.log(`  步骤7: 清理测试数据`)
      
      console.log(`  ✅ 用户流程测试完成`)
      
      return {
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: `用户流程测试通过，涵盖浏览、搜索、筛选、创建、编辑、删除等操作`
      }
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
  
  /**
   * 测试性能和优化
   */
  private async testPerformanceOptimization(): Promise<IntegrationTestResult> {
    const testName = '性能和优化测试'
    const startTime = Date.now()
    
    try {
      // 1. 测试大量数据加载性能
      const loadStartTime = Date.now()
      const allTemplates = await templateService.getAllTemplates()
      const loadDuration = Date.now() - loadStartTime
      
      console.log(`  数据加载性能: ${allTemplates.length} 个模板，耗时 ${loadDuration}ms`)
      
      if (loadDuration > 1000) {
        console.warn(`  ⚠️ 数据加载较慢: ${loadDuration}ms`)
      }
      
      // 2. 测试搜索性能
      const searchStartTime = Date.now()
      await templateService.searchTemplates({
        query: '测试',
        limit: 100
      })
      const searchDuration = Date.now() - searchStartTime
      
      console.log(`  搜索性能: 耗时 ${searchDuration}ms`)
      
      if (searchDuration > 500) {
        console.warn(`  ⚠️ 搜索较慢: ${searchDuration}ms`)
      }
      
      // 3. 测试标签筛选性能
      const filterStartTime = Date.now()
      const availableTags = await templateService.getAvailableTags()
      if (availableTags.length > 0) {
        await templateService.filterByTags([availableTags[0]])
      }
      const filterDuration = Date.now() - filterStartTime
      
      console.log(`  筛选性能: 耗时 ${filterDuration}ms`)
      
      // 4. 测试内存使用情况
      const memoryInfo = this.getMemoryUsage()
      console.log(`  内存使用: ${memoryInfo}`)
      
      // 5. 测试数据一致性
      const consistencyCheck = await this.checkDataConsistency()
      if (!consistencyCheck.isConsistent) {
        throw new Error(`数据一致性检查失败: ${consistencyCheck.errors.join(', ')}`)
      }
      
      console.log(`  ✅ 数据一致性检查通过`)
      
      return {
        testName,
        success: true,
        duration: Date.now() - startTime,
        details: `性能测试通过 - 加载:${loadDuration}ms, 搜索:${searchDuration}ms, 筛选:${filterDuration}ms`
      }
      
    } catch (error) {
      return {
        testName,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      }
    }
  }
  
  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): string {
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      const used = Math.round(memory.usedJSHeapSize / 1024 / 1024 * 100) / 100
      const total = Math.round(memory.totalJSHeapSize / 1024 / 1024 * 100) / 100
      return `${used}MB / ${total}MB`
    }
    return '无法获取内存信息'
  }
  
  /**
   * 检查数据一致性
   */
  private async checkDataConsistency(): Promise<{
    isConsistent: boolean
    errors: string[]
  }> {
    const errors: string[] = []
    
    try {
      const allTemplates = await templateService.getAllTemplates()
      
      // 检查ID唯一性
      const ids = allTemplates.map(t => t.id)
      const uniqueIds = new Set(ids)
      if (ids.length !== uniqueIds.size) {
        errors.push('存在重复的模板ID')
      }
      
      // 检查必需字段
      allTemplates.forEach((template, index) => {
        if (!template.id) errors.push(`模板 ${index}: 缺少ID`)
        if (!template.title) errors.push(`模板 ${index}: 缺少标题`)
        if (!template.content) errors.push(`模板 ${index}: 缺少内容`)
        if (!Array.isArray(template.tags)) errors.push(`模板 ${index}: 标签格式错误`)
      })
      
      // 检查时间戳格式
      allTemplates.forEach((template, index) => {
        try {
          new Date(template.createdAt)
          new Date(template.updatedAt)
        } catch {
          errors.push(`模板 ${index}: 时间戳格式错误`)
        }
      })
      
    } catch (error) {
      errors.push(`一致性检查失败: ${error}`)
    }
    
    return {
      isConsistent: errors.length === 0,
      errors
    }
  }
  
  /**
   * 生成测试摘要
   */
  private generateTestSummary(results: IntegrationTestResult[], errors: string[]): string {
    const totalTests = results.length
    const passedTests = results.filter(r => r.success).length
    const failedTests = totalTests - passedTests
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)
    
    const lines: string[] = []
    lines.push('=== 集成测试摘要 ===')
    lines.push(`执行时间: ${new Date().toLocaleString()}`)
    lines.push(`总测试数: ${totalTests}`)
    lines.push(`通过: ${passedTests}`)
    lines.push(`失败: ${failedTests}`)
    lines.push(`总耗时: ${totalDuration}ms`)
    lines.push('')
    
    lines.push('测试详情:')
    results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌'
      lines.push(`${index + 1}. ${status} ${result.testName} (${result.duration}ms)`)
      if (result.success && result.details) {
        lines.push(`   ${result.details}`)
      } else if (!result.success && result.error) {
        lines.push(`   错误: ${result.error}`)
      }
    })
    
    lines.push('')
    lines.push(`整体状态: ${errors.length === 0 ? '✅ 全部通过' : '❌ 存在问题'}`)
    
    return lines.join('\\n')
  }
}

/**
 * 集成测试结果接口
 */
interface IntegrationTestResult {
  testName: string
  success: boolean
  duration: number
  details?: string
  error?: string
}

/**
 * 导出单例实例
 */
export const integrationTestExecutor = IntegrationTestExecutor.getInstance()

/**
 * 便捷函数：执行完整集成测试
 */
export async function executeIntegrationTest() {
  return await integrationTestExecutor.executeFullIntegrationTest()
}