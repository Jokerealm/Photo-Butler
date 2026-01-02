/**
 * 后端API接口定义
 * Backend API Interface Definitions
 */

import { 
  PromptTemplate, 
  CreateTemplateRequest, 
  UpdateTemplateRequest, 
  TemplateSearchParams, 
  TemplateSearchResult 
} from '../types/promptTemplate'

import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  AuthResponse, 
  UserSession, 
  UserActivity, 
  UserNotification, 
  UserQuota, 
  UserSubscription 
} from '../types/userSystem'

// API响应基础接口
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  code?: string
  timestamp: string
}

// 分页响应接口
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// API错误接口
export interface ApiError {
  code: string
  message: string
  details?: Record<string, any>
  field?: string
}

/**
 * 认证相关API接口
 */
export interface IAuthApi {
  // 用户认证
  login(request: LoginRequest): Promise<ApiResponse<AuthResponse>>
  register(request: RegisterRequest): Promise<ApiResponse<AuthResponse>>
  logout(): Promise<ApiResponse<void>>
  refreshToken(refreshToken: string): Promise<ApiResponse<AuthResponse>>
  
  // 密码管理
  forgotPassword(email: string): Promise<ApiResponse<void>>
  resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>>
  changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse<void>>
  
  // 邮箱验证
  sendVerificationEmail(): Promise<ApiResponse<void>>
  verifyEmail(token: string): Promise<ApiResponse<void>>
  
  // 会话管理
  getCurrentUser(): Promise<ApiResponse<User>>
  getUserSessions(): Promise<ApiResponse<UserSession[]>>
  revokeSession(sessionId: string): Promise<ApiResponse<void>>
  revokeAllSessions(): Promise<ApiResponse<void>>
}

/**
 * 用户管理API接口
 */
export interface IUserApi {
  // 用户信息
  getUser(userId: string): Promise<ApiResponse<User>>
  updateUser(userId: string, updates: Partial<User>): Promise<ApiResponse<User>>
  deleteUser(userId: string): Promise<ApiResponse<void>>
  
  // 用户搜索
  searchUsers(query: string, page?: number, limit?: number): Promise<PaginatedResponse<User>>
  getUsersByRole(role: string): Promise<ApiResponse<User[]>>
  
  // 用户关系
  followUser(userId: string): Promise<ApiResponse<void>>
  unfollowUser(userId: string): Promise<ApiResponse<void>>
  getFollowers(userId: string): Promise<ApiResponse<User[]>>
  getFollowing(userId: string): Promise<ApiResponse<User[]>>
  
  // 用户活动
  getUserActivity(userId: string, page?: number, limit?: number): Promise<PaginatedResponse<UserActivity>>
  
  // 用户通知
  getNotifications(page?: number, limit?: number): Promise<PaginatedResponse<UserNotification>>
  markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>>
  markAllNotificationsAsRead(): Promise<ApiResponse<void>>
  deleteNotification(notificationId: string): Promise<ApiResponse<void>>
  
  // 用户配额
  getUserQuota(userId?: string): Promise<ApiResponse<UserQuota>>
  updateUserQuota(userId: string, quota: Partial<UserQuota>): Promise<ApiResponse<UserQuota>>
  
  // 用户订阅
  getUserSubscription(userId?: string): Promise<ApiResponse<UserSubscription>>
  createSubscription(planId: string, paymentMethodId: string): Promise<ApiResponse<UserSubscription>>
  cancelSubscription(subscriptionId: string): Promise<ApiResponse<void>>
  updateSubscription(subscriptionId: string, updates: Partial<UserSubscription>): Promise<ApiResponse<UserSubscription>>
}

/**
 * 模板管理API接口
 */
export interface ITemplateApi {
  // 基础CRUD
  getTemplates(page?: number, limit?: number): Promise<PaginatedResponse<PromptTemplate>>
  getTemplate(templateId: string): Promise<ApiResponse<PromptTemplate>>
  createTemplate(request: CreateTemplateRequest): Promise<ApiResponse<PromptTemplate>>
  updateTemplate(templateId: string, updates: UpdateTemplateRequest): Promise<ApiResponse<PromptTemplate>>
  deleteTemplate(templateId: string): Promise<ApiResponse<void>>
  
  // 搜索和筛选
  searchTemplates(params: TemplateSearchParams): Promise<ApiResponse<TemplateSearchResult>>
  getTemplatesByTag(tag: string, page?: number, limit?: number): Promise<PaginatedResponse<PromptTemplate>>
  getTemplatesByCategory(category: string, page?: number, limit?: number): Promise<PaginatedResponse<PromptTemplate>>
  getTemplatesByAuthor(authorId: string, page?: number, limit?: number): Promise<PaginatedResponse<PromptTemplate>>
  
  // 模板交互
  likeTemplate(templateId: string): Promise<ApiResponse<void>>
  unlikeTemplate(templateId: string): Promise<ApiResponse<void>>
  getTemplateLikes(templateId: string): Promise<ApiResponse<User[]>>
  
  // 模板评论
  getTemplateComments(templateId: string, page?: number, limit?: number): Promise<PaginatedResponse<Comment>>
  addTemplateComment(templateId: string, content: string): Promise<ApiResponse<Comment>>
  updateTemplateComment(commentId: string, content: string): Promise<ApiResponse<Comment>>
  deleteTemplateComment(commentId: string): Promise<ApiResponse<void>>
  
  // 模板分享和下载
  shareTemplate(templateId: string, platform: string): Promise<ApiResponse<{ shareUrl: string }>>
  downloadTemplate(templateId: string): Promise<ApiResponse<{ downloadUrl: string }>>
  getTemplateStats(templateId: string): Promise<ApiResponse<TemplateStats>>
  
  // 模板收藏
  favoriteTemplate(templateId: string): Promise<ApiResponse<void>>
  unfavoriteTemplate(templateId: string): Promise<ApiResponse<void>>
  getFavoriteTemplates(page?: number, limit?: number): Promise<PaginatedResponse<PromptTemplate>>
  
  // 模板标签
  getAvailableTags(): Promise<ApiResponse<string[]>>
  getPopularTags(limit?: number): Promise<ApiResponse<TagWithCount[]>>
  
  // 模板分类
  getCategories(): Promise<ApiResponse<Category[]>>
  createCategory(name: string, description: string): Promise<ApiResponse<Category>>
  updateCategory(categoryId: string, updates: Partial<Category>): Promise<ApiResponse<Category>>
  deleteCategory(categoryId: string): Promise<ApiResponse<void>>
}

/**
 * 文件管理API接口
 */
export interface IFileApi {
  // 文件上传
  uploadFile(file: File, directory?: string): Promise<ApiResponse<{ filePath: string; fileUrl: string }>>
  uploadThumbnail(file: File): Promise<ApiResponse<{ filePath: string; fileUrl: string }>>
  uploadAvatar(file: File): Promise<ApiResponse<{ filePath: string; fileUrl: string }>>
  
  // 文件删除
  deleteFile(filePath: string): Promise<ApiResponse<void>>
  
  // 文件信息
  getFileInfo(filePath: string): Promise<ApiResponse<FileInfo>>
  getFileUrl(filePath: string): Promise<ApiResponse<{ fileUrl: string }>>
  
  // 批量操作
  uploadMultipleFiles(files: File[], directory?: string): Promise<ApiResponse<FileUploadResult[]>>
  deleteMultipleFiles(filePaths: string[]): Promise<ApiResponse<void>>
}

/**
 * 管理员API接口
 */
export interface IAdminApi {
  // 系统统计
  getSystemStats(): Promise<ApiResponse<SystemStats>>
  getUserStats(): Promise<ApiResponse<UserStats>>
  getTemplateStats(): Promise<ApiResponse<TemplateStatsAdmin>>
  
  // 用户管理
  getAllUsers(page?: number, limit?: number): Promise<PaginatedResponse<User>>
  banUser(userId: string, reason: string, duration?: number): Promise<ApiResponse<void>>
  unbanUser(userId: string): Promise<ApiResponse<void>>
  changeUserRole(userId: string, role: string): Promise<ApiResponse<User>>
  
  // 内容审核
  getPendingTemplates(page?: number, limit?: number): Promise<PaginatedResponse<PromptTemplate>>
  approveTemplate(templateId: string): Promise<ApiResponse<void>>
  rejectTemplate(templateId: string, reason: string): Promise<ApiResponse<void>>
  
  // 系统配置
  getSystemConfig(): Promise<ApiResponse<SystemConfig>>
  updateSystemConfig(config: Partial<SystemConfig>): Promise<ApiResponse<SystemConfig>>
  
  // 日志和监控
  getSystemLogs(page?: number, limit?: number): Promise<PaginatedResponse<SystemLog>>
  getUserActivities(page?: number, limit?: number): Promise<PaginatedResponse<UserActivity>>
  
  // 备份和恢复
  createBackup(): Promise<ApiResponse<{ backupId: string; downloadUrl: string }>>
  restoreFromBackup(backupId: string): Promise<ApiResponse<void>>
  getBackupHistory(): Promise<ApiResponse<BackupInfo[]>>
}

// 辅助类型定义

export interface Comment {
  id: string
  templateId: string
  authorId: string
  author: User
  content: string
  createdAt: string
  updatedAt: string
  isEdited: boolean
}

export interface TemplateStats {
  templateId: string
  views: number
  likes: number
  downloads: number
  shares: number
  comments: number
  favorites: number
  createdAt: string
  updatedAt: string
}

export interface TagWithCount {
  tag: string
  count: number
}

export interface Category {
  id: string
  name: string
  description: string
  slug: string
  parentId?: string
  sortOrder: number
  isActive: boolean
  templateCount: number
  createdAt: string
  updatedAt: string
}

export interface FileInfo {
  fileName: string
  filePath: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  uploadedBy: string
}

export interface FileUploadResult {
  fileName: string
  filePath: string
  fileUrl: string
  success: boolean
  error?: string
}

export interface SystemStats {
  totalUsers: number
  activeUsers: number
  totalTemplates: number
  publicTemplates: number
  totalDownloads: number
  totalViews: number
  storageUsed: number
  systemUptime: number
}

export interface UserStats {
  newUsersToday: number
  newUsersThisWeek: number
  newUsersThisMonth: number
  activeUsersToday: number
  activeUsersThisWeek: number
  activeUsersThisMonth: number
  topUsers: Array<{ user: User; score: number }>
}

export interface TemplateStatsAdmin {
  newTemplatesToday: number
  newTemplatesThisWeek: number
  newTemplatesThisMonth: number
  totalViews: number
  totalDownloads: number
  topTemplates: Array<{ template: PromptTemplate; stats: TemplateStats }>
  popularTags: TagWithCount[]
}

export interface SystemConfig {
  siteName: string
  siteDescription: string
  allowRegistration: boolean
  requireEmailVerification: boolean
  maxFileSize: number
  allowedFileTypes: string[]
  defaultUserQuota: UserQuota
  maintenanceMode: boolean
  maintenanceMessage: string
}

export interface SystemLog {
  id: string
  level: 'info' | 'warn' | 'error' | 'debug'
  message: string
  metadata?: Record<string, any>
  timestamp: string
  source: string
}

export interface BackupInfo {
  id: string
  fileName: string
  fileSize: number
  createdAt: string
  createdBy: string
  status: 'completed' | 'failed' | 'in_progress'
  downloadUrl?: string
}

/**
 * API客户端配置接口
 */
export interface ApiClientConfig {
  baseUrl: string
  timeout: number
  retryAttempts: number
  retryDelay: number
  headers?: Record<string, string>
}

/**
 * API客户端接口
 */
export interface IApiClient {
  // 配置
  setConfig(config: Partial<ApiClientConfig>): void
  setAuthToken(token: string): void
  clearAuthToken(): void
  
  // HTTP方法
  get<T>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>>
  post<T>(url: string, data?: any): Promise<ApiResponse<T>>
  put<T>(url: string, data?: any): Promise<ApiResponse<T>>
  patch<T>(url: string, data?: any): Promise<ApiResponse<T>>
  delete<T>(url: string): Promise<ApiResponse<T>>
  
  // 文件上传
  upload<T>(url: string, file: File, data?: Record<string, any>): Promise<ApiResponse<T>>
  uploadMultiple<T>(url: string, files: File[], data?: Record<string, any>): Promise<ApiResponse<T>>
  
  // 请求拦截器
  addRequestInterceptor(interceptor: (config: any) => any): void
  addResponseInterceptor(interceptor: (response: any) => any): void
  
  // 错误处理
  setErrorHandler(handler: (error: any) => void): void
}