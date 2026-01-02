/**
 * 提示词文件解析器
 * Prompt File Parser
 * 
 * 负责解析prompt.txt文件，将编号提示词项目转换为结构化数据
 */

import { ParsedPromptItem } from '../../types/promptTemplate'

/**
 * 解析prompt.txt文件内容
 * @param content 文件内容
 * @returns 解析后的提示词项目数组
 */
export function parsePromptFile(content: string): ParsedPromptItem[] {
  if (!content || typeof content !== 'string') {
    return []
  }

  const items: ParsedPromptItem[] = []
  
  // 按行分割内容
  const lines = content.split('\n')
  let currentItem: Partial<ParsedPromptItem> | null = null
  let currentContent = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // 检查是否是新的编号项目开始（格式：数字. 标题：内容）
    const itemMatch = line.match(/^(\d+)\.\s*(.+)/)
    
    if (itemMatch) {
      // 保存上一个项目
      if (currentItem && currentContent) {
        items.push({
          ...currentItem,
          content: currentContent.trim(),
          originalText: currentContent.trim()
        } as ParsedPromptItem)
      }
      
      // 开始新项目
      const index = parseInt(itemMatch[1], 10)
      const fullText = itemMatch[2]
      
      // 提取标题（冒号前的部分）
      const colonIndex = fullText.indexOf('：')
      let title = ''
      let content = fullText
      
      if (colonIndex !== -1) {
        title = fullText.substring(0, colonIndex).trim()
        content = fullText.substring(colonIndex + 1).trim()
      } else {
        // 如果没有冒号，尝试从内容中提取标题
        title = extractTitleFromContent(fullText)
      }
      
      currentItem = {
        index,
        title,
      }
      currentContent = content
    } else if (currentItem && line) {
      // 继续当前项目的内容（多行内容）
      currentContent += ' ' + line
    }
  }
  
  // 保存最后一个项目
  if (currentItem && currentContent) {
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
 * @param content 提示词内容
 * @returns 提取的标题
 */
export function extractTitleFromContent(content: string): string {
  if (!content) return '未命名模板'
  
  // 尝试从内容开头提取标题
  // 查找第一个句号、冒号或逗号前的内容作为标题
  const titleMatch = content.match(/^([^。：，,\.]{1,20})/)
  
  if (titleMatch) {
    let title = titleMatch[1].trim()
    
    // 清理标题，移除一些常见的描述性词汇
    title = title.replace(/^(将图片编辑为|输出一张|参考|基于|生成)/g, '')
    title = title.replace(/：$/, '')
    
    // 如果标题太短，尝试提取更多内容
    if (title.length < 3) {
      const longerMatch = content.match(/^([^。]{1,30})/)
      if (longerMatch) {
        title = longerMatch[1].trim()
      }
    }
    
    return title || '未命名模板'
  }
  
  // 如果无法提取，返回内容的前20个字符
  return content.substring(0, 20) + (content.length > 20 ? '...' : '')
}

/**
 * 验证解析结果
 * @param items 解析的项目数组
 * @returns 验证结果
 */
export function validateParsedItems(items: ParsedPromptItem[]): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  if (!Array.isArray(items)) {
    errors.push('解析结果不是数组')
    return { isValid: false, errors }
  }
  
  if (items.length === 0) {
    errors.push('没有解析到任何提示词项目')
    return { isValid: false, errors }
  }
  
  // 检查每个项目
  items.forEach((item, index) => {
    if (!item.title || item.title.trim() === '') {
      errors.push(`项目 ${index + 1}: 缺少标题`)
    }
    
    if (!item.content || item.content.trim() === '') {
      errors.push(`项目 ${index + 1}: 缺少内容`)
    }
    
    if (typeof item.index !== 'number' || item.index <= 0) {
      errors.push(`项目 ${index + 1}: 索引无效`)
    }
    
    if (item.content && item.content.length < 10) {
      errors.push(`项目 ${index + 1}: 内容过短`)
    }
    
    if (item.content && item.content.length > 5000) {
      errors.push(`项目 ${index + 1}: 内容过长`)
    }
  })
  
  // 检查索引重复
  const indices = items.map(item => item.index)
  const uniqueIndices = new Set(indices)
  if (indices.length !== uniqueIndices.size) {
    errors.push('存在重复的索引')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 读取文件内容
 * @param filePath 文件路径
 * @returns 文件内容
 */
export async function readTextFile(filePath: string): Promise<string> {
  try {
    // 在浏览器环境中，我们需要通过fetch读取文件
    const response = await fetch(filePath)
    if (!response.ok) {
      throw new Error(`无法读取文件: ${response.statusText}`)
    }
    return await response.text()
  } catch (error) {
    console.error('读取文件失败:', error)
    throw new Error(`读取文件失败: ${error instanceof Error ? error.message : '未知错误'}`)
  }
}

/**
 * 清理和标准化内容
 * @param content 原始内容
 * @returns 清理后的内容
 */
export function cleanContent(content: string): string {
  if (!content) return ''
  
  return content
    // 移除多余的空白字符
    .replace(/\s+/g, ' ')
    // 移除行首行尾空白
    .trim()
    // 标准化标点符号
    .replace(/。{2,}/g, '。')
    .replace(/，{2,}/g, '，')
    // 移除特殊字符
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
}

/**
 * 生成唯一ID
 * @param index 项目索引
 * @param title 项目标题
 * @returns 唯一ID
 */
export function generateTemplateId(index: number, title: string): string {
  // 使用索引和标题的哈希生成ID
  const hash = simpleHash(title + index.toString())
  return `template_${index}_${hash}`
}

/**
 * 简单哈希函数
 * @param str 输入字符串
 * @returns 哈希值
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // 转换为32位整数
  }
  return Math.abs(hash).toString(36)
}