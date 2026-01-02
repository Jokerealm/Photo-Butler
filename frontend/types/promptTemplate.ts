/**
 * 提示词模板系统类型定义
 * Prompt Template System Type Definitions
 */

// 提示词模板接口 - 核心数据模型
export interface PromptTemplate {
  id: string                    // 唯一标识符
  title: string                 // 模板标题
  description: string           // 模板描述
  content: string              // 提示词内容
  tags: string[]               // 用户自定义标签
  thumbnailPath: string        // 缩略图路径
  createdAt: string           // 创建时间 (ISO 8601)
  updatedAt: string           // 更新时间 (ISO 8601)
  version: number             // 版本号，用于向后兼容
  
  // 用户系统集成字段
  authorId?: string           // 作者ID (用户系统)
  authorName?: string         // 作者显示名称
  authorAvatar?: string       // 作者头像
  
  // 可见性和权限
  visibility?: 'public' | 'private' | 'unlisted'  // 可见性设置
  isApproved?: boolean        // 是否已审核通过
  isFeatured?: boolean        // 是否为精选模板
  
  // 分类和组织
  category?: string           // 模板分类
  categoryId?: string         // 分类ID
  
  // 统计信息
  usageCount?: number         // 使用次数
  viewCount?: number          // 查看次数
  downloadCount?: number      // 下载次数
  likeCount?: number          // 点赞数
  commentCount?: number       // 评论数
  shareCount?: number         // 分享次数
  favoriteCount?: number      // 收藏次数
  
  // 评分系统
  rating?: number             // 平均评分 (1-5)
  ratingCount?: number        // 评分人数
  
  // 模板元数据
  language?: string           // 模板语言
  difficulty?: 'beginner' | 'intermediate' | 'advanced'  // 难度级别
  estimatedTime?: number      // 预估使用时间（分钟）
  
  // 许可和版权
  license?: string            // 许可证类型
  isCommercialUse?: boolean   // 是否允许商业使用
  
  // 版本控制
  parentId?: string           // 父模板ID（用于模板分支）
  versionHistory?: string[]   // 版本历史记录
  
  // 协作功能
  collaborators?: string[]    // 协作者ID列表
  isCollaborative?: boolean   // 是否允许协作编辑
  
  // 审核和管理
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged'
  moderationNotes?: string    // 审核备注
  moderatedBy?: string        // 审核人ID
  moderatedAt?: string        // 审核时间
  
  // 标记和标签
  flags?: string[]            // 标记（如：NSFW、暴力等）
  customFields?: Record<string, any>  // 自定义字段，用于扩展
}

// 创建模板请求接口
export interface CreateTemplateRequest {
  title: string
  description: string
  content: string
  tags: string[]
  thumbnailFile?: File        // 上传的缩略图文件
}

// 更新模板请求接口
export interface UpdateTemplateRequest {
  title?: string
  description?: string
  content?: string
  tags?: string[]
  thumbnailFile?: File
}

// 模板搜索参数接口
export interface TemplateSearchParams {
  query?: string              // 搜索关键词
  tags?: string[]            // 标签筛选
  category?: string          // 分类筛选
  authorId?: string          // 作者筛选
  limit?: number             // 结果数量限制
  offset?: number            // 分页偏移
}

// 模板搜索结果接口
export interface TemplateSearchResult {
  templates: PromptTemplate[]
  total: number
  query?: string
  hasMore: boolean
}

// 模板验证规则接口
export interface TemplateValidationRules {
  title: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  description: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  content: {
    required: boolean;
    minLength: number;
    maxLength: number;
  };
  tags: {
    maxCount: number;
    maxTagLength: number;
  };
  thumbnailFile: {
    allowedFormats: string[];
    maxSize: number;  // 5MB
  };
}

// 模板验证结果接口
export interface TemplateValidationResult {
  isValid: boolean
  errors: TemplateValidationError[]
}

// 模板验证错误接口
export interface TemplateValidationError {
  field: string
  message: string
  code: string
}

// 数据迁移相关接口
export interface MigrationResult {
  success: boolean
  templatesCreated: number
  errors: string[]
  templates: PromptTemplate[]
}

// 解析的提示词项目接口
export interface ParsedPromptItem {
  index: number
  title: string
  content: string
  originalText: string
}

// API响应接口
export interface PromptTemplateApiResponse<T> {
  success: boolean
  data: T
  error?: string
  message?: string
}

// 组件Props接口
export interface TemplateListProps {
  templates: PromptTemplate[]
  loading?: boolean
  onTemplateSelect?: (template: PromptTemplate) => void
  onTemplateEdit?: (template: PromptTemplate) => void
  onTemplateDelete?: (templateId: string) => void
}

export interface TemplateCardProps {
  template: PromptTemplate
  onClick?: (template: PromptTemplate) => void
  onEdit?: (template: PromptTemplate) => void
  onDelete?: (templateId: string) => void
  className?: string
}

export interface TemplateDetailProps {
  template: PromptTemplate
  onEdit?: (template: PromptTemplate) => void
  onDelete?: (templateId: string) => void
  onClose?: () => void
}

export interface TemplateUploadProps {
  onSubmit: (request: CreateTemplateRequest) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch: (query: string) => void
  placeholder?: string
  className?: string
}

export interface TagFilterProps {
  availableTags: string[]
  selectedTags: string[]
  onTagToggle: (tag: string) => void
  onClearAll: () => void
  className?: string
}

// 状态管理接口
export interface TemplateStoreState {
  templates: PromptTemplate[]
  loading: boolean
  error: string | null
  searchQuery: string
  selectedTags: string[]
  filteredTemplates: PromptTemplate[]
  selectedTemplate: PromptTemplate | null
}

export interface TemplateStoreActions {
  // 数据加载
  loadTemplates: () => Promise<void>
  refreshTemplates: () => Promise<void>
  
  // 搜索和筛选
  setSearchQuery: (query: string) => void
  searchTemplates: (query: string) => Promise<void>
  toggleTag: (tag: string) => void
  clearTagFilter: () => void
  filterByTags: (tags: string[]) => void
  
  // CRUD操作
  createTemplate: (request: CreateTemplateRequest) => Promise<PromptTemplate>
  updateTemplate: (id: string, updates: UpdateTemplateRequest) => Promise<PromptTemplate>
  deleteTemplate: (id: string) => Promise<void>
  
  // 模板选择
  selectTemplate: (template: PromptTemplate | null) => void
  
  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void
  
  // 数据迁移
  migrateFromTextFile: (filePath: string) => Promise<MigrationResult>
}

// 完整的Store接口
export interface TemplateStore extends TemplateStoreState, TemplateStoreActions {}