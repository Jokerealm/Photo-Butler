/**
 * 权限管理服务接口
 * Permission Management Service Interface
 */

import { User, UserRole, Permission, Role, UserQuota } from '../types/userSystem'
import { PromptTemplate } from '../types/promptTemplate'

// 资源类型枚举
export enum ResourceType {
  TEMPLATE = 'template',
  USER = 'user',
  SYSTEM = 'system',
  ADMIN = 'admin'
}

// 操作类型枚举
export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  SHARE = 'share',
  DOWNLOAD = 'download',
  LIKE = 'like',
  COMMENT = 'comment',
  MODERATE = 'moderate',
  ADMIN = 'admin'
}

// 权限检查结果接口
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredRole?: UserRole
  requiredPermission?: string
}

// 权限上下文接口
export interface PermissionContext {
  user: User | null
  resource?: any
  resourceType: ResourceType
  action: ActionType
  metadata?: Record<string, any>
}

/**
 * 权限服务接口
 */
export interface IPermissionService {
  // 权限检查
  checkPermission(context: PermissionContext): Promise<PermissionCheckResult>
  hasPermission(user: User | null, permission: string): Promise<boolean>
  hasRole(user: User | null, role: UserRole): boolean
  
  // 模板权限检查
  canCreateTemplate(user: User | null): Promise<PermissionCheckResult>
  canReadTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult>
  canUpdateTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult>
  canDeleteTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult>
  canShareTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult>
  canDownloadTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult>
  
  // 用户权限检查
  canViewUser(user: User | null, targetUser: User): Promise<PermissionCheckResult>
  canEditUser(user: User | null, targetUser: User): Promise<PermissionCheckResult>
  canDeleteUser(user: User | null, targetUser: User): Promise<PermissionCheckResult>
  
  // 系统权限检查
  canAccessAdmin(user: User | null): Promise<PermissionCheckResult>
  canModerateContent(user: User | null): Promise<PermissionCheckResult>
  canManageUsers(user: User | null): Promise<PermissionCheckResult>
  
  // 配额检查
  checkQuota(user: User | null, action: string): Promise<PermissionCheckResult>
  getRemainingQuota(user: User | null): Promise<Partial<UserQuota>>
}

/**
 * 权限服务实现类
 */
export class PermissionService implements IPermissionService {
  private static instance: PermissionService

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService()
    }
    return PermissionService.instance
  }

  /**
   * 检查权限
   */
  async checkPermission(context: PermissionContext): Promise<PermissionCheckResult> {
    const { user, resource, resourceType, action } = context

    // 如果没有用户，只允许读取公开资源
    if (!user) {
      if (action === ActionType.READ && this.isPublicResource(resource, resourceType)) {
        return { allowed: true }
      }
      return {
        allowed: false,
        reason: '需要登录才能执行此操作',
        requiredRole: UserRole.REGULAR_USER
      }
    }

    // 检查用户状态
    if (user.status !== 'active') {
      return {
        allowed: false,
        reason: '用户账户未激活或已被暂停'
      }
    }

    // 管理员拥有所有权限
    if (user.role === UserRole.ADMIN) {
      return { allowed: true }
    }

    // 根据资源类型和操作类型检查权限
    switch (resourceType) {
      case ResourceType.TEMPLATE:
        return this.checkTemplatePermission(user, resource as PromptTemplate, action)
      
      case ResourceType.USER:
        return this.checkUserPermission(user, resource as User, action)
      
      case ResourceType.SYSTEM:
        return this.checkSystemPermission(user, action)
      
      default:
        return {
          allowed: false,
          reason: '未知的资源类型'
        }
    }
  }

  /**
   * 检查用户是否拥有特定权限
   */
  async hasPermission(user: User | null, permission: string): Promise<boolean> {
    if (!user) return false
    if (user.role === UserRole.ADMIN) return true
    
    // TODO: 实现基于角色的权限检查
    // 这里需要从后端获取用户的具体权限列表
    return false
  }

  /**
   * 检查用户是否拥有特定角色
   */
  hasRole(user: User | null, role: UserRole): boolean {
    if (!user) return false
    return user.role === role || user.role === UserRole.ADMIN
  }

  /**
   * 检查是否可以创建模板
   */
  async canCreateTemplate(user: User | null): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要登录才能创建模板',
        requiredRole: UserRole.REGULAR_USER
      }
    }

    // 检查配额
    const quotaCheck = await this.checkQuota(user, 'create_template')
    if (!quotaCheck.allowed) {
      return quotaCheck
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以读取模板
   */
  async canReadTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult> {
    // 公开模板任何人都可以读取
    if (this.isPublicTemplate(template)) {
      return { allowed: true }
    }

    // 私有模板只有作者可以读取
    if (!user || template.authorId !== user.id) {
      return {
        allowed: false,
        reason: '无权访问此私有模板'
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以更新模板
   */
  async canUpdateTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要登录才能编辑模板',
        requiredRole: UserRole.REGULAR_USER
      }
    }

    // 只有作者或管理员可以编辑
    if (template.authorId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      return {
        allowed: false,
        reason: '只有模板作者或管理员可以编辑模板'
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以删除模板
   */
  async canDeleteTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要登录才能删除模板',
        requiredRole: UserRole.REGULAR_USER
      }
    }

    // 只有作者或管理员可以删除
    if (template.authorId !== user.id && user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      return {
        allowed: false,
        reason: '只有模板作者或管理员可以删除模板'
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以分享模板
   */
  async canShareTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult> {
    // 公开模板任何人都可以分享
    if (this.isPublicTemplate(template)) {
      return { allowed: true }
    }

    // 私有模板只有作者可以分享
    if (!user || template.authorId !== user.id) {
      return {
        allowed: false,
        reason: '无权分享此私有模板'
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以下载模板
   */
  async canDownloadTemplate(user: User | null, template: PromptTemplate): Promise<PermissionCheckResult> {
    // 首先检查是否可以读取
    const readCheck = await this.canReadTemplate(user, template)
    if (!readCheck.allowed) {
      return readCheck
    }

    // 检查下载配额
    if (user) {
      const quotaCheck = await this.checkQuota(user, 'download_template')
      if (!quotaCheck.allowed) {
        return quotaCheck
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以查看用户信息
   */
  async canViewUser(user: User | null, targetUser: User): Promise<PermissionCheckResult> {
    // 公开用户信息任何人都可以查看
    return { allowed: true }
  }

  /**
   * 检查是否可以编辑用户信息
   */
  async canEditUser(user: User | null, targetUser: User): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要登录才能编辑用户信息',
        requiredRole: UserRole.REGULAR_USER
      }
    }

    // 只能编辑自己的信息，或管理员可以编辑任何人
    if (user.id !== targetUser.id && user.role !== UserRole.ADMIN) {
      return {
        allowed: false,
        reason: '只能编辑自己的用户信息'
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以删除用户
   */
  async canDeleteUser(user: User | null, targetUser: User): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要登录才能删除用户',
        requiredRole: UserRole.ADMIN
      }
    }

    // 只有管理员可以删除用户
    if (user.role !== UserRole.ADMIN) {
      return {
        allowed: false,
        reason: '只有管理员可以删除用户',
        requiredRole: UserRole.ADMIN
      }
    }

    // 不能删除自己
    if (user.id === targetUser.id) {
      return {
        allowed: false,
        reason: '不能删除自己的账户'
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以访问管理面板
   */
  async canAccessAdmin(user: User | null): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要管理员权限',
        requiredRole: UserRole.ADMIN
      }
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      return {
        allowed: false,
        reason: '需要管理员或版主权限',
        requiredRole: UserRole.MODERATOR
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以审核内容
   */
  async canModerateContent(user: User | null): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要版主权限',
        requiredRole: UserRole.MODERATOR
      }
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.MODERATOR) {
      return {
        allowed: false,
        reason: '需要版主或管理员权限',
        requiredRole: UserRole.MODERATOR
      }
    }

    return { allowed: true }
  }

  /**
   * 检查是否可以管理用户
   */
  async canManageUsers(user: User | null): Promise<PermissionCheckResult> {
    if (!user) {
      return {
        allowed: false,
        reason: '需要管理员权限',
        requiredRole: UserRole.ADMIN
      }
    }

    if (user.role !== UserRole.ADMIN) {
      return {
        allowed: false,
        reason: '需要管理员权限',
        requiredRole: UserRole.ADMIN
      }
    }

    return { allowed: true }
  }

  /**
   * 检查配额限制
   */
  async checkQuota(user: User | null, action: string): Promise<PermissionCheckResult> {
    if (!user) {
      return { allowed: true } // 游客没有配额限制，但其他权限检查会拦截
    }

    // TODO: 实现实际的配额检查逻辑
    // 这里需要从后端获取用户的配额信息
    
    return { allowed: true }
  }

  /**
   * 获取剩余配额
   */
  async getRemainingQuota(user: User | null): Promise<Partial<UserQuota>> {
    if (!user) {
      return {}
    }

    // TODO: 实现实际的配额查询逻辑
    return {
      maxTemplates: 100,
      currentTemplates: 0,
      maxStorageSize: 1024 * 1024 * 100, // 100MB
      currentStorageUsed: 0
    }
  }

  // 私有辅助方法

  private checkTemplatePermission(user: User, template: PromptTemplate, action: ActionType): PermissionCheckResult {
    switch (action) {
      case ActionType.READ:
        return this.isPublicTemplate(template) || template.authorId === user.id
          ? { allowed: true }
          : { allowed: false, reason: '无权访问此模板' }
      
      case ActionType.UPDATE:
      case ActionType.DELETE:
        return template.authorId === user.id || this.hasRole(user, UserRole.MODERATOR)
          ? { allowed: true }
          : { allowed: false, reason: '只有作者或管理员可以修改模板' }
      
      default:
        return { allowed: false, reason: '不支持的操作' }
    }
  }

  private checkUserPermission(user: User, targetUser: User, action: ActionType): PermissionCheckResult {
    switch (action) {
      case ActionType.READ:
        return { allowed: true }
      
      case ActionType.UPDATE:
        return user.id === targetUser.id || this.hasRole(user, UserRole.ADMIN)
          ? { allowed: true }
          : { allowed: false, reason: '只能编辑自己的信息' }
      
      case ActionType.DELETE:
        return this.hasRole(user, UserRole.ADMIN) && user.id !== targetUser.id
          ? { allowed: true }
          : { allowed: false, reason: '只有管理员可以删除用户' }
      
      default:
        return { allowed: false, reason: '不支持的操作' }
    }
  }

  private checkSystemPermission(user: User, action: ActionType): PermissionCheckResult {
    if (!this.hasRole(user, UserRole.MODERATOR)) {
      return {
        allowed: false,
        reason: '需要管理员权限',
        requiredRole: UserRole.MODERATOR
      }
    }

    return { allowed: true }
  }

  private isPublicResource(resource: any, resourceType: ResourceType): boolean {
    switch (resourceType) {
      case ResourceType.TEMPLATE:
        return this.isPublicTemplate(resource as PromptTemplate)
      default:
        return false
    }
  }

  private isPublicTemplate(template: PromptTemplate): boolean {
    // 如果没有作者ID，认为是公开模板（向后兼容）
    if (!template.authorId) {
      return true
    }
    
    // TODO: 实现基于模板可见性设置的判断
    // 这里需要添加模板的可见性字段
    return true // 暂时默认所有模板都是公开的
  }
}

// 导出单例实例
export const permissionService = PermissionService.getInstance()