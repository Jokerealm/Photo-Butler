/**
 * 提示词模板数据迁移工具
 * Prompt Template Data Migration Utilities
 */

import {
  PromptTemplate,
  ParsedPromptItem,
  MigrationResult
} from '../types/promptTemplate'
import { TemplateErrorFactory, TemplateErrorType } from '../types/promptTemplateErrors'

/**
 * 从prompt.txt文件解析提示词项目
 */
export function parsePromptFile(content: string): ParsedPromptItem[] {
  const items: ParsedPromptItem[] = []
  
  // 按行分割内容
  const lines = content.split('\n')
  let currentItem: Partial<ParsedPromptItem> | null = null
  let currentContent = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检查是否是新的编号项目开始
    const match = line.match(/^(\d+)\.\s*(.*)/)
    
    if (match) {
      // 保存前一个项目
      if (currentItem) {
        items.push({
          ...currentItem,
          content: currentContent.trim(),
          originalText: currentContent.trim()
        } as ParsedPromptItem)
      }
      
      // 开始新项目
      const [, indexStr, titleAndContent] = match
      const index = parseInt(indexStr, 10)
      
      // 提取标题（取前50个字符作为标题）
      const title = extractTitle(titleAndContent)
      
      currentItem = {
        index,
        title
      }
      currentContent = titleAndContent
    } else if (line && currentItem) {
      // 继续当前项目的内容
      currentContent += ' ' + line
    }
  }
  
  // 保存最后一个项目
  if (currentItem) {
    items.push({
      ...currentItem,
      content: currentContent.trim(),
      originalText: currentContent.trim()
    } as ParsedPromptItem)
  }
  
  return items
}

/**
 * 从内容中提取标题
 */
function extractTitle(content: string): string {
  // 查找冒号前的部分作为标题
  const colonIndex = content.indexOf('：')
  if (colonIndex > 0 && colonIndex < 50) {
    return content.substring(0, colonIndex).trim()
  }
  
  // 如果没有冒号，取前30个字符
  const title = content.substring(0, 30).trim()
  
  // 如果标题太短，尝试找到第一个句号或逗号
  if (title.length < 10) {
    const punctuationIndex = content.search(/[。，、]/)
    if (punctuationIndex > 0 && punctuationIndex < 50) {
      return content.substring(0, punctuationIndex).trim()
    }
  }
  
  return title + (content.length > 30 ? '...' : '')
}

/**
 * 根据内容匹配缩略图
 */
export function matchThumbnail(content: string, availableImages: string[]): string {
  const contentLower = content.toLowerCase()
  
  // 定义关键词到图片的映射
  const keywordMappings: Record<string, string[]> = {
    '雨夜': ['film-grid-rainy-night.jpg'],
    '雨': ['film-grid-rainy-night.jpg'],
    '夜': ['film-grid-rainy-night.jpg'],
    '胶片': ['film-grid-rainy-night.jpg'],
    '三宫格': ['film-grid-rainy-night.jpg'],
    '模板': ['template-example-1.jpg', 'template-example-2.jpg', 'template-example-3.jpg', 'template-example-4.jpg'],
    '示例': ['template-example-1.jpg', 'template-example-2.jpg', 'template-example-3.jpg', 'template-example-4.jpg']
  }
  
  // 查找匹配的关键词
  for (const [keyword, images] of Object.entries(keywordMappings)) {
    if (contentLower.includes(keyword)) {
      // 找到第一个可用的图片
      for (const image of images) {
        if (availableImages.includes(image)) {
          return `image/${image}`
        }
      }
    }
  }
  
  // 如果没有匹配，使用默认图片
  return 'image/placeholder.png'
}

/**
 * 将解析的项目转换为模板
 */
export function convertToTemplate(
  item: ParsedPromptItem, 
  availableImages: string[] = []
): PromptTemplate {
  const now = new Date().toISOString()
  
  return {
    id: `migrated_${item.index}_${Date.now()}`,
    title: item.title,
    description: generateDescription(item.content),
    content: item.content,
    tags: extractTags(item.content),
    thumbnailPath: matchThumbnail(item.content, availableImages),
    createdAt: now,
    updatedAt: now,
    version: 1
  }
}

/**
 * 生成模板描述
 */
function generateDescription(content: string): string {
  // 取内容的前100个字符作为描述
  let description = content.substring(0, 100).trim()
  
  // 如果描述以句号结尾，保持完整
  const lastPunctuation = description.search(/[。！？]/)
  if (lastPunctuation > 20) {
    description = description.substring(0, lastPunctuation + 1)
  } else if (content.length > 100) {
    description += '...'
  }
  
  return description
}

/**
 * 从内容中提取标签
 */
function extractTags(content: string): string[] {
  const tags: string[] = []
  
  // 定义标签提取规则
  const tagPatterns = [
    // 场景相关
    { pattern: /雨夜|夜晚|傍晚|黄昏|日出|日落/, tag: '时间' },
    { pattern: /城市|街道|公园|海边|山顶|草原|沙漠|校园/, tag: '场景' },
    { pattern: /胶片|三宫格|写真|人像|艺术/, tag: '风格' },
    { pattern: /女性|男性|人物/, tag: '人物' },
    { pattern: /猫|动物/, tag: '动物' },
    { pattern: /雨|雪|风|云/, tag: '天气' },
    { pattern: /电影|叙事|故事/, tag: '叙事' },
    { pattern: /青春|校园|学生/, tag: '青春' },
    { pattern: /职场|工作|商务/, tag: '职场' },
    { pattern: /古典|旗袍|传统/, tag: '古典' },
    { pattern: /圣诞|节日|庆祝/, tag: '节日' },
    { pattern: /新年|锦鲤|祝福/, tag: '新年' }
  ]
  
  // 应用标签规则
  for (const { pattern, tag } of tagPatterns) {
    if (pattern.test(content)) {
      tags.push(tag)
    }
  }
  
  // 如果没有提取到标签，添加默认标签
  if (tags.length === 0) {
    tags.push('提示词')
  }
  
  // 去重并限制数量
  return Array.from(new Set(tags)).slice(0, 5)
}

/**
 * 执行完整的数据迁移
 */
export async function migratePromptData(
  promptFileContent: string,
  availableImages: string[] = []
): Promise<MigrationResult> {
  const errors: string[] = []
  const templates: PromptTemplate[] = []
  
  try {
    // 解析提示词文件
    const parsedItems = parsePromptFile(promptFileContent)
    
    if (parsedItems.length === 0) {
      errors.push('未找到有效的提示词项目')
      return {
        success: false,
        templatesCreated: 0,
        errors,
        templates: []
      }
    }
    
    // 转换为模板
    for (const item of parsedItems) {
      try {
        const template = convertToTemplate(item, availableImages)
        templates.push(template)
      } catch (error) {
        errors.push(`转换项目 ${item.index} 失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    }
    
    return {
      success: templates.length > 0,
      templatesCreated: templates.length,
      errors,
      templates
    }
    
  } catch (error) {
    errors.push(`迁移失败: ${error instanceof Error ? error.message : '未知错误'}`)
    
    return {
      success: false,
      templatesCreated: 0,
      errors,
      templates: []
    }
  }
}

/**
 * 验证迁移结果
 */
export function validateMigrationResult(result: MigrationResult): boolean {
  return (
    result.success &&
    result.templatesCreated > 0 &&
    result.templates.length === result.templatesCreated &&
    result.templates.every(template => 
      template.id &&
      template.title &&
      template.content &&
      template.createdAt &&
      template.updatedAt
    )
  )
}

/**
 * 生成迁移报告
 */
export function generateMigrationReport(result: MigrationResult): string {
  const { success, templatesCreated, errors, templates } = result
  
  let report = `数据迁移报告\n`
  report += `================\n\n`
  report += `状态: ${success ? '成功' : '失败'}\n`
  report += `创建模板数量: ${templatesCreated}\n`
  
  if (errors.length > 0) {
    report += `\n错误信息:\n`
    errors.forEach((error, index) => {
      report += `${index + 1}. ${error}\n`
    })
  }
  
  if (templates.length > 0) {
    report += `\n创建的模板:\n`
    templates.forEach((template, index) => {
      report += `${index + 1}. ${template.title} (ID: ${template.id})\n`
    })
  }
  
  report += `\n迁移时间: ${new Date().toLocaleString()}\n`
  
  return report
}

/**
 * 清理迁移数据
 */
export function cleanupMigrationData(templates: PromptTemplate[]): PromptTemplate[] {
  return templates.map(template => ({
    ...template,
    title: template.title.trim(),
    description: template.description.trim(),
    content: template.content.trim(),
    tags: template.tags.filter(tag => tag.trim().length > 0)
  }))
}

/**
 * 检查是否需要迁移
 */
export function needsMigration(existingTemplates: PromptTemplate[]): boolean {
  // 如果没有模板，或者所有模板都是迁移生成的，则可能需要迁移
  return existingTemplates.length === 0 || 
         existingTemplates.every(t => t.id.startsWith('migrated_'))
}