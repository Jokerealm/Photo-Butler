/**
 * 模板生成器
 * Template Generator
 * 
 * 负责将解析结果转换为标准的JSON模板格式
 */

import { PromptTemplate, ParsedPromptItem, MigrationResult } from '../../types/promptTemplate'
import { parsePromptFile, validateParsedItems, generateTemplateId, cleanContent } from './promptParser'
import { matchThumbnail, batchMatchThumbnails, generateMatchingReport } from './thumbnailMatcher'

/**
 * 将解析的提示词项目转换为模板
 * @param item 解析的提示词项目
 * @returns 生成的模板
 */
export function convertToTemplate(item: ParsedPromptItem): PromptTemplate {
  const now = new Date().toISOString()
  const thumbnailPath = matchThumbnail(item)
  
  // 生成标签
  const tags = generateTagsFromContent(item.title, item.content)
  
  return {
    id: generateTemplateId(item.index, item.title),
    title: item.title,
    description: generateDescription(item.content),
    content: cleanContent(item.content),
    tags,
    thumbnailPath,
    createdAt: now,
    updatedAt: now,
    version: 1
  }
}

/**
 * 从内容生成描述
 * @param content 提示词内容
 * @returns 生成的描述
 */
function generateDescription(content: string): string {
  if (!content) return ''
  
  // 提取内容的前100个字符作为描述
  let description = content.substring(0, 100)
  
  // 在句号处截断，保持完整性
  const periodIndex = description.lastIndexOf('。')
  if (periodIndex > 20) {
    description = description.substring(0, periodIndex + 1)
  } else if (description.length === 100 && content.length > 100) {
    description += '...'
  }
  
  return description.trim()
}

/**
 * 从内容生成标签
 * @param title 标题
 * @param content 内容
 * @returns 生成的标签数组
 */
function generateTagsFromContent(title: string, content: string): string[] {
  const tags = new Set<string>()
  const text = (title + ' ' + content).toLowerCase()
  
  // 预定义的标签映射
  const tagMappings: Record<string, string[]> = {
    // 场景标签
    '雨夜': ['雨夜', '城市', '夜景'],
    '酒店': ['酒店', '室内', '人像'],
    '高山': ['高山', '自然', '风景'],
    '草原': ['草原', '自然', '风景'],
    '星空': ['星空', '夜景', '自然'],
    '花海': ['花海', '自然', '浪漫'],
    '沙漠': ['沙漠', '自然', '风景'],
    '校园': ['校园', '青春', '人像'],
    '圣诞': ['圣诞', '节日', '人像'],
    '职场': ['职场', '现代', '人像'],
    '雪景': ['雪景', '冬天', '自然'],
    '旗袍': ['旗袍', '古典', '人像'],
    '室内': ['室内', '人像', '艺术'],
    
    // 风格标签
    '胶片': ['胶片', '复古', '艺术'],
    '三宫格': ['三宫格', '拼图', '艺术'],
    '电影感': ['电影', '艺术', '专业'],
    '写真': ['写真', '人像', '摄影'],
    '艺术感': ['艺术', '创意', '专业'],
    
    // 情感标签
    '孤独': ['孤独', '情感', '深沉'],
    '浪漫': ['浪漫', '温馨', '情感'],
    '神秘': ['神秘', '深沉', '艺术'],
    '清新': ['清新', '自然', '青春'],
    '优雅': ['优雅', '高贵', '人像'],
    
    // 技术标签
    '逆光': ['逆光', '光影', '技术'],
    '虚化': ['虚化', '景深', '技术'],
    '过度曝光': ['过曝', '技术', '艺术'],
    '颗粒感': ['颗粒', '质感', '复古']
  }
  
  // 根据关键词添加标签
  for (const [keyword, keywordTags] of Object.entries(tagMappings)) {
    if (text.includes(keyword)) {
      keywordTags.forEach(tag => tags.add(tag))
    }
  }
  
  // 添加基础分类标签
  if (text.includes('人物') || text.includes('女性') || text.includes('男性') || text.includes('人像')) {
    tags.add('人像')
  }
  
  if (text.includes('风景') || text.includes('自然') || text.includes('户外')) {
    tags.add('风景')
  }
  
  if (text.includes('室内') || text.includes('酒店') || text.includes('房间')) {
    tags.add('室内')
  }
  
  // 确保至少有一个标签
  if (tags.size === 0) {
    tags.add('通用')
  }
  
  // 限制标签数量
  return Array.from(tags).slice(0, 8)
}

/**
 * 批量转换为模板
 * @param items 解析的提示词项目数组
 * @returns 生成的模板数组
 */
export function batchConvertToTemplates(items: ParsedPromptItem[]): PromptTemplate[] {
  return items.map(item => convertToTemplate(item))
}

/**
 * 验证生成的模板数据
 * @param templates 模板数组
 * @returns 验证结果
 */
export function validateGeneratedTemplates(templates: PromptTemplate[]): {
  isValid: boolean
  errors: string[]
  validTemplates: PromptTemplate[]
  invalidTemplates: Array<{ template: PromptTemplate, errors: string[] }>
} {
  const errors: string[] = []
  const validTemplates: PromptTemplate[] = []
  const invalidTemplates: Array<{ template: PromptTemplate, errors: string[] }> = []
  
  if (!Array.isArray(templates)) {
    errors.push('模板数据不是数组')
    return { isValid: false, errors, validTemplates, invalidTemplates }
  }
  
  templates.forEach((template, index) => {
    const templateErrors = validateSingleTemplate(template)
    
    if (templateErrors.length === 0) {
      validTemplates.push(template)
    } else {
      invalidTemplates.push({ template, errors: templateErrors })
      errors.push(`模板 ${index + 1} (${template.title}): ${templateErrors.join(', ')}`)
    }
  })
  
  return {
    isValid: errors.length === 0,
    errors,
    validTemplates,
    invalidTemplates
  }
}

/**
 * 验证单个模板
 * @param template 模板对象
 * @returns 错误数组
 */
function validateSingleTemplate(template: PromptTemplate): string[] {
  const errors: string[] = []
  
  // 必需字段检查
  if (!template.id || typeof template.id !== 'string') {
    errors.push('缺少有效的ID')
  }
  
  if (!template.title || typeof template.title !== 'string' || template.title.trim() === '') {
    errors.push('缺少有效的标题')
  }
  
  if (!template.description || typeof template.description !== 'string') {
    errors.push('缺少有效的描述')
  }
  
  if (!template.content || typeof template.content !== 'string' || template.content.trim() === '') {
    errors.push('缺少有效的内容')
  }
  
  if (!Array.isArray(template.tags)) {
    errors.push('标签必须是数组')
  }
  
  if (!template.thumbnailPath || typeof template.thumbnailPath !== 'string') {
    errors.push('缺少有效的缩略图路径')
  }
  
  if (!template.createdAt || typeof template.createdAt !== 'string') {
    errors.push('缺少有效的创建时间')
  }
  
  if (!template.updatedAt || typeof template.updatedAt !== 'string') {
    errors.push('缺少有效的更新时间')
  }
  
  if (typeof template.version !== 'number' || template.version <= 0) {
    errors.push('版本号必须是正整数')
  }
  
  // 长度检查
  if (template.title && template.title.length > 100) {
    errors.push('标题过长')
  }
  
  if (template.description && template.description.length > 500) {
    errors.push('描述过长')
  }
  
  if (template.content && template.content.length > 5000) {
    errors.push('内容过长')
  }
  
  if (template.content && template.content.length < 10) {
    errors.push('内容过短')
  }
  
  if (template.tags && template.tags.length > 10) {
    errors.push('标签过多')
  }
  
  // 时间格式检查
  if (template.createdAt && !isValidISODate(template.createdAt)) {
    errors.push('创建时间格式无效')
  }
  
  if (template.updatedAt && !isValidISODate(template.updatedAt)) {
    errors.push('更新时间格式无效')
  }
  
  return errors
}

/**
 * 检查是否是有效的ISO日期格式
 * @param dateString 日期字符串
 * @returns 是否有效
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === dateString
}

/**
 * 生成JSON模板文件内容
 * @param templates 模板数组
 * @returns JSON字符串
 */
export function generateJSONContent(templates: PromptTemplate[]): string {
  const data = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    totalTemplates: templates.length,
    templates
  }
  
  return JSON.stringify(data, null, 2)
}

/**
 * 执行完整的数据迁移
 * @param promptFileContent prompt.txt文件内容
 * @returns 迁移结果
 */
export async function performMigration(promptFileContent: string): Promise<MigrationResult> {
  try {
    // 1. 解析prompt文件
    const parsedItems = parsePromptFile(promptFileContent)
    
    // 2. 验证解析结果
    const parseValidation = validateParsedItems(parsedItems)
    if (!parseValidation.isValid) {
      return {
        success: false,
        templatesCreated: 0,
        errors: parseValidation.errors,
        templates: []
      }
    }
    
    // 3. 转换为模板
    const templates = batchConvertToTemplates(parsedItems)
    
    // 4. 验证生成的模板
    const templateValidation = validateGeneratedTemplates(templates)
    
    // 5. 生成匹配报告
    const matchingReport = generateMatchingReport(parsedItems)
    
    const result: MigrationResult = {
      success: templateValidation.isValid,
      templatesCreated: templateValidation.validTemplates.length,
      errors: templateValidation.errors,
      templates: templateValidation.validTemplates
    }
    
    // 添加匹配报告到错误信息中（作为信息性内容）
    if (matchingReport.unmatchedItems > 0) {
      result.errors.push(`缩略图匹配: ${matchingReport.matchedItems}/${matchingReport.totalItems} 项目匹配成功`)
    }
    
    return result
  } catch (error) {
    return {
      success: false,
      templatesCreated: 0,
      errors: [`迁移过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`],
      templates: []
    }
  }
}

/**
 * 保存模板到本地存储
 * @param templates 模板数组
 * @returns 是否成功
 */
export async function saveTemplatesToStorage(templates: PromptTemplate[]): Promise<boolean> {
  try {
    const jsonContent = generateJSONContent(templates)
    
    // 保存到localStorage
    localStorage.setItem('promptTemplates', jsonContent)
    
    // 同时保存一个备份
    const backupKey = `promptTemplates_backup_${Date.now()}`
    localStorage.setItem(backupKey, jsonContent)
    
    // 清理旧备份（只保留最近5个）
    const allKeys = Object.keys(localStorage)
    const backupKeys = allKeys
      .filter(key => key.startsWith('promptTemplates_backup_'))
      .sort()
      .reverse()
    
    // 删除多余的备份
    backupKeys.slice(5).forEach(key => {
      localStorage.removeItem(key)
    })
    
    return true
  } catch (error) {
    console.error('保存模板到存储失败:', error)
    return false
  }
}

/**
 * 从本地存储加载模板
 * @returns 模板数组
 */
export async function loadTemplatesFromStorage(): Promise<PromptTemplate[]> {
  try {
    const jsonContent = localStorage.getItem('promptTemplates')
    if (!jsonContent) {
      return []
    }
    
    const data = JSON.parse(jsonContent)
    
    // 验证数据格式
    if (data && Array.isArray(data.templates)) {
      return data.templates
    } else if (Array.isArray(data)) {
      // 兼容旧格式
      return data
    }
    
    return []
  } catch (error) {
    console.error('从存储加载模板失败:', error)
    return []
  }
}

/**
 * 生成迁移报告
 * @param result 迁移结果
 * @returns 格式化的报告字符串
 */
export function generateMigrationReport(result: MigrationResult): string {
  const lines: string[] = []
  
  lines.push('=== 数据迁移报告 ===')
  lines.push(`迁移状态: ${result.success ? '成功' : '失败'}`)
  lines.push(`创建模板数量: ${result.templatesCreated}`)
  
  if (result.errors.length > 0) {
    lines.push('\n错误信息:')
    result.errors.forEach((error, index) => {
      lines.push(`${index + 1}. ${error}`)
    })
  }
  
  if (result.templates.length > 0) {
    lines.push('\n生成的模板:')
    result.templates.forEach((template, index) => {
      lines.push(`${index + 1}. ${template.title} (${template.tags.join(', ')})`)
    })
  }
  
  lines.push(`\n报告生成时间: ${new Date().toLocaleString()}`)
  
  return lines.join('\n')
}