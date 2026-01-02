/**
 * 提示词模板验证工具
 * Prompt Template Validation Utilities
 */

import { 
  PromptTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest,
  TemplateValidationResult,
  TemplateValidationError,
  TemplateValidationRules 
} from '../types/promptTemplate'
import { 
  TemplateErrorFactory, 
  ERROR_MESSAGES, 
  TemplateErrorType 
} from '../types/promptTemplateErrors'

// 验证规则常量
export const VALIDATION_RULES: TemplateValidationRules = {
  title: {
    required: true,
    minLength: 1,
    maxLength: 100
  },
  description: {
    required: true,
    minLength: 1,
    maxLength: 500
  },
  content: {
    required: true,
    minLength: 10,
    maxLength: 5000
  },
  tags: {
    maxCount: 10,
    maxTagLength: 20
  },
  thumbnailFile: {
    allowedFormats: ['jpg', 'jpeg', 'png'],
    maxSize: 5 * 1024 * 1024  // 5MB
  }
}

// 支持的图片格式
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png']
export const SUPPORTED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png']

/**
 * 验证模板标题
 */
export function validateTitle(title: string): TemplateValidationError[] {
  const errors: TemplateValidationError[] = []
  
  if (!title || title.trim().length === 0) {
    errors.push({
      field: 'title',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].TITLE_REQUIRED,
      code: 'TITLE_REQUIRED'
    })
  } else if (title.length > VALIDATION_RULES.title.maxLength) {
    errors.push({
      field: 'title',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].TITLE_TOO_LONG,
      code: 'TITLE_TOO_LONG'
    })
  }
  
  return errors
}

/**
 * 验证模板描述
 */
export function validateDescription(description: string): TemplateValidationError[] {
  const errors: TemplateValidationError[] = []
  
  if (!description || description.trim().length === 0) {
    errors.push({
      field: 'description',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].DESCRIPTION_REQUIRED,
      code: 'DESCRIPTION_REQUIRED'
    })
  } else if (description.length > VALIDATION_RULES.description.maxLength) {
    errors.push({
      field: 'description',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].DESCRIPTION_TOO_LONG,
      code: 'DESCRIPTION_TOO_LONG'
    })
  }
  
  return errors
}

/**
 * 验证提示词内容
 */
export function validateContent(content: string): TemplateValidationError[] {
  const errors: TemplateValidationError[] = []
  
  if (!content || content.trim().length === 0) {
    errors.push({
      field: 'content',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].CONTENT_REQUIRED,
      code: 'CONTENT_REQUIRED'
    })
  } else if (content.length < VALIDATION_RULES.content.minLength) {
    errors.push({
      field: 'content',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].CONTENT_TOO_SHORT,
      code: 'CONTENT_TOO_SHORT'
    })
  } else if (content.length > VALIDATION_RULES.content.maxLength) {
    errors.push({
      field: 'content',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].CONTENT_TOO_LONG,
      code: 'CONTENT_TOO_LONG'
    })
  }
  
  return errors
}

/**
 * 验证标签
 */
export function validateTags(tags: string[]): TemplateValidationError[] {
  const errors: TemplateValidationError[] = []
  
  if (tags.length > VALIDATION_RULES.tags.maxCount) {
    errors.push({
      field: 'tags',
      message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].TAGS_TOO_MANY,
      code: 'TAGS_TOO_MANY'
    })
  }
  
  tags.forEach((tag, index) => {
    if (tag.length > VALIDATION_RULES.tags.maxTagLength) {
      errors.push({
        field: `tags[${index}]`,
        message: ERROR_MESSAGES[TemplateErrorType.VALIDATION_ERROR].TAG_TOO_LONG,
        code: 'TAG_TOO_LONG'
      })
    }
  })
  
  return errors
}

/**
 * 验证缩略图文件
 */
export function validateThumbnailFile(file: File): TemplateValidationError[] {
  const errors: TemplateValidationError[] = []
  
  // 检查文件大小
  if (file.size > VALIDATION_RULES.thumbnailFile.maxSize) {
    errors.push({
      field: 'thumbnailFile',
      message: ERROR_MESSAGES[TemplateErrorType.FILE_SIZE_ERROR].FILE_TOO_LARGE,
      code: 'FILE_TOO_LARGE'
    })
  }
  
  if (file.size === 0) {
    errors.push({
      field: 'thumbnailFile',
      message: ERROR_MESSAGES[TemplateErrorType.FILE_SIZE_ERROR].FILE_EMPTY,
      code: 'FILE_EMPTY'
    })
  }
  
  // 检查文件格式
  if (!SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !SUPPORTED_IMAGE_EXTENSIONS.includes(extension)) {
      errors.push({
        field: 'thumbnailFile',
        message: ERROR_MESSAGES[TemplateErrorType.FILE_FORMAT_ERROR].UNSUPPORTED_FORMAT,
        code: 'UNSUPPORTED_FORMAT'
      })
    }
  }
  
  return errors
}

/**
 * 验证创建模板请求
 */
export function validateCreateTemplateRequest(request: CreateTemplateRequest): TemplateValidationResult {
  const errors: TemplateValidationError[] = []
  
  // 验证各个字段
  errors.push(...validateTitle(request.title))
  errors.push(...validateDescription(request.description))
  errors.push(...validateContent(request.content))
  errors.push(...validateTags(request.tags))
  
  // 验证缩略图文件（如果提供）
  if (request.thumbnailFile) {
    errors.push(...validateThumbnailFile(request.thumbnailFile))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证更新模板请求
 */
export function validateUpdateTemplateRequest(request: UpdateTemplateRequest): TemplateValidationResult {
  const errors: TemplateValidationError[] = []
  
  // 只验证提供的字段
  if (request.title !== undefined) {
    errors.push(...validateTitle(request.title))
  }
  
  if (request.description !== undefined) {
    errors.push(...validateDescription(request.description))
  }
  
  if (request.content !== undefined) {
    errors.push(...validateContent(request.content))
  }
  
  if (request.tags !== undefined) {
    errors.push(...validateTags(request.tags))
  }
  
  if (request.thumbnailFile !== undefined) {
    errors.push(...validateThumbnailFile(request.thumbnailFile))
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证完整的模板对象
 */
export function validatePromptTemplate(template: PromptTemplate): TemplateValidationResult {
  const errors: TemplateValidationError[] = []
  
  // 验证必需字段
  errors.push(...validateTitle(template.title))
  errors.push(...validateDescription(template.description))
  errors.push(...validateContent(template.content))
  errors.push(...validateTags(template.tags))
  
  // 验证ID
  if (!template.id || template.id.trim().length === 0) {
    errors.push({
      field: 'id',
      message: '模板ID不能为空',
      code: 'ID_REQUIRED'
    })
  }
  
  // 验证缩略图路径
  if (!template.thumbnailPath || template.thumbnailPath.trim().length === 0) {
    errors.push({
      field: 'thumbnailPath',
      message: '缩略图路径不能为空',
      code: 'THUMBNAIL_PATH_REQUIRED'
    })
  }
  
  // 验证时间戳
  if (!template.createdAt || !isValidISODate(template.createdAt)) {
    errors.push({
      field: 'createdAt',
      message: '创建时间格式无效',
      code: 'CREATED_AT_INVALID'
    })
  }
  
  if (!template.updatedAt || !isValidISODate(template.updatedAt)) {
    errors.push({
      field: 'updatedAt',
      message: '更新时间格式无效',
      code: 'UPDATED_AT_INVALID'
    })
  }
  
  // 验证版本号
  if (typeof template.version !== 'number' || template.version < 1) {
    errors.push({
      field: 'version',
      message: '版本号必须是大于0的数字',
      code: 'VERSION_INVALID'
    })
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * 验证ISO日期格式
 */
function isValidISODate(dateString: string): boolean {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString() === dateString
}

/**
 * 清理和标准化标签
 */
export function sanitizeTags(tags: string[]): string[] {
  return tags
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0)
    .filter((tag, index, array) => array.indexOf(tag) === index) // 去重
    .slice(0, VALIDATION_RULES.tags.maxCount) // 限制数量
}

/**
 * 清理和标准化文本内容
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * 生成验证错误的用户友好消息
 */
export function formatValidationErrors(errors: TemplateValidationError[]): string {
  if (errors.length === 0) return ''
  
  if (errors.length === 1) {
    return errors[0].message
  }
  
  return `发现 ${errors.length} 个错误：\n${errors.map(error => `• ${error.message}`).join('\n')}`
}

/**
 * 检查模板数据是否符合最新版本格式
 */
export function isLatestVersion(template: any): boolean {
  return (
    typeof template === 'object' &&
    template !== null &&
    typeof template.id === 'string' &&
    typeof template.title === 'string' &&
    typeof template.description === 'string' &&
    typeof template.content === 'string' &&
    Array.isArray(template.tags) &&
    typeof template.thumbnailPath === 'string' &&
    typeof template.createdAt === 'string' &&
    typeof template.updatedAt === 'string' &&
    typeof template.version === 'number'
  )
}