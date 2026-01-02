/**
 * 用户系统集成接口定义
 * User System Integration Interface Definitions
 */

// 用户基础信息接口
export interface User {
  id: string
  username: string
  email: string
  displayName: string
  avatar?: string
  role: UserRole
  status: UserStatus
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
  
  // 用户偏好设置
  preferences?: UserPreferences
  
  // 统计信息
  stats?: UserStats
}

// 用户角色枚举
export enum UserRole {
  ADMIN = 'admin',
  MODERATOR = 'moderator',
  PREMIUM_USER = 'premium_user',
  REGULAR_USER = 'regular_user',
  GUEST = 'guest'
}

// 用户状态枚举
export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
  PENDING_VERIFICATION = 'pending_verification'
}

// 用户偏好设置接口
export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  emailNotifications: boolean
  pushNotifications: boolean
  defaultTemplateVisibility: 'public' | 'private' | 'unlisted'
  autoSaveEnabled: boolean
}

// 用户统计信息接口
export interface UserStats {
  templatesCreated: number
  templatesShared: number
  templatesDownloaded: number
  totalViews: number
  totalLikes: number
  joinedAt: string
}

// 权限相关接口
export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface Role {
  id: string
  name: string
  description: string
  permissions: Permission[]
  isSystemRole: boolean
}

// 用户认证相关接口
export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresAt: string
  tokenType: 'Bearer'
}

export interface LoginRequest {
  email: string
  password: string
  rememberMe?: boolean
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
  displayName: string
  acceptTerms: boolean
}

export interface AuthResponse {
  success: boolean
  user?: User
  token?: AuthToken
  error?: string
  message?: string
}

// 用户会话接口
export interface UserSession {
  id: string
  userId: string
  deviceInfo: string
  ipAddress: string
  userAgent: string
  createdAt: string
  lastActiveAt: string
  expiresAt: string
  isActive: boolean
}

// 用户活动日志接口
export interface UserActivity {
  id: string
  userId: string
  action: string
  resource: string
  resourceId?: string
  metadata?: Record<string, any>
  ipAddress: string
  userAgent: string
  timestamp: string
}

// 用户关系接口（关注、粉丝等）
export interface UserRelation {
  id: string
  followerId: string
  followingId: string
  createdAt: string
  status: 'active' | 'blocked'
}

// 用户通知接口
export interface UserNotification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  isRead: boolean
  createdAt: string
  expiresAt?: string
}

export enum NotificationType {
  TEMPLATE_LIKED = 'template_liked',
  TEMPLATE_COMMENTED = 'template_commented',
  TEMPLATE_SHARED = 'template_shared',
  USER_FOLLOWED = 'user_followed',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  ACCOUNT_UPDATE = 'account_update'
}

// 用户配额和限制接口
export interface UserQuota {
  userId: string
  maxTemplates: number
  maxStorageSize: number // in bytes
  maxFileSize: number // in bytes
  maxTagsPerTemplate: number
  canCreatePublicTemplates: boolean
  canUploadCustomThumbnails: boolean
  apiRequestsPerHour: number
  
  // 当前使用情况
  currentTemplates: number
  currentStorageUsed: number
  
  // 重置时间
  quotaResetAt: string
}

// 用户订阅和计费接口
export interface UserSubscription {
  id: string
  userId: string
  planId: string
  status: SubscriptionStatus
  startDate: string
  endDate?: string
  autoRenew: boolean
  paymentMethod?: string
  
  // 计费信息
  amount: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  
  // 时间戳
  createdAt: string
  updatedAt: string
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PENDING = 'pending'
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  billingCycle: 'monthly' | 'yearly'
  features: string[]
  quota: Partial<UserQuota>
  isActive: boolean
  sortOrder: number
}