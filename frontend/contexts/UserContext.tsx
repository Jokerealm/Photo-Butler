/**
 * 用户上下文提供者
 * User Context Provider for User System Integration
 */

'use client'

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'
import { User, AuthToken, UserRole, UserStatus } from '../types/userSystem'
import { permissionService, PermissionCheckResult } from '../services/permissionService'

// 用户状态接口
interface UserState {
  user: User | null
  token: AuthToken | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  permissions: Record<string, boolean>
}

// 用户操作类型
type UserAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: AuthToken } }
  | { type: 'CLEAR_USER' }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> }
  | { type: 'SET_PERMISSIONS'; payload: Record<string, boolean> }

// 用户上下文接口
interface UserContextType {
  state: UserState
  
  // 认证操作
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  register: (userData: any) => Promise<boolean>
  refreshToken: () => Promise<boolean>
  
  // 用户信息操作
  updateUser: (updates: Partial<User>) => Promise<boolean>
  getCurrentUser: () => Promise<User | null>
  
  // 权限检查
  hasPermission: (permission: string) => boolean
  hasRole: (role: UserRole) => boolean
  canPerformAction: (resource: any, action: string) => Promise<PermissionCheckResult>
  
  // 工具方法
  isGuest: () => boolean
  isAdmin: () => boolean
  isModerator: () => boolean
  clearError: () => void
}

// 初始状态
const initialState: UserState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  permissions: {}
}

// 状态减速器
function userReducer(state: UserState, action: UserAction): UserState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload
      }
    
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      }
    
    case 'CLEAR_USER':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        permissions: {}
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false
      }
    
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null
      }
    
    case 'SET_PERMISSIONS':
      return {
        ...state,
        permissions: action.payload
      }
    
    default:
      return state
  }
}

// 创建上下文
const UserContext = createContext<UserContextType | undefined>(undefined)

// 用户上下文提供者组件
interface UserProviderProps {
  children: ReactNode
}

export function UserProvider({ children }: UserProviderProps) {
  const [state, dispatch] = useReducer(userReducer, initialState)

  // 初始化用户状态
  useEffect(() => {
    initializeUser()
  }, [])

  // 初始化用户
  const initializeUser = async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      
      // 从本地存储获取token
      const storedToken = localStorage.getItem('auth_token')
      const storedUser = localStorage.getItem('user_data')
      
      if (storedToken && storedUser) {
        try {
          const token: AuthToken = JSON.parse(storedToken)
          const user: User = JSON.parse(storedUser)
          
          // 检查token是否过期
          if (new Date(token.expiresAt) > new Date()) {
            dispatch({ type: 'SET_USER', payload: { user, token } })
            await loadUserPermissions(user)
          } else {
            // Token过期，尝试刷新
            const refreshed = await refreshToken()
            if (!refreshed) {
              clearStoredAuth()
            }
          }
        } catch (error) {
          console.error('解析存储的用户数据失败:', error)
          clearStoredAuth()
        }
      }
    } catch (error) {
      console.error('初始化用户状态失败:', error)
      dispatch({ type: 'SET_ERROR', payload: '初始化用户状态失败' })
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 登录
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // TODO: 实现实际的登录API调用
      // 这里是模拟实现
      const mockUser: User = {
        id: 'user_1',
        username: email.split('@')[0],
        email,
        displayName: email.split('@')[0],
        role: UserRole.REGULAR_USER,
        status: UserStatus.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const mockToken: AuthToken = {
        accessToken: 'mock_access_token',
        refreshToken: 'mock_refresh_token',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24小时后过期
        tokenType: 'Bearer'
      }
      
      // 存储到本地
      localStorage.setItem('auth_token', JSON.stringify(mockToken))
      localStorage.setItem('user_data', JSON.stringify(mockUser))
      
      dispatch({ type: 'SET_USER', payload: { user: mockUser, token: mockToken } })
      await loadUserPermissions(mockUser)
      
      return true
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '登录失败' })
      return false
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 登出
  const logout = async (): Promise<void> => {
    try {
      // TODO: 调用后端登出API
      clearStoredAuth()
      dispatch({ type: 'CLEAR_USER' })
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  // 注册
  const register = async (userData: any): Promise<boolean> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true })
      dispatch({ type: 'SET_ERROR', payload: null })
      
      // TODO: 实现实际的注册API调用
      return true
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '注册失败' })
      return false
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }

  // 刷新Token
  const refreshToken = async (): Promise<boolean> => {
    try {
      const storedToken = localStorage.getItem('auth_token')
      if (!storedToken) return false
      
      const token: AuthToken = JSON.parse(storedToken)
      
      // TODO: 实现实际的token刷新API调用
      // 这里是模拟实现
      const newToken: AuthToken = {
        ...token,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
      localStorage.setItem('auth_token', JSON.stringify(newToken))
      
      if (state.user) {
        dispatch({ type: 'SET_USER', payload: { user: state.user, token: newToken } })
      }
      
      return true
    } catch (error) {
      console.error('刷新token失败:', error)
      return false
    }
  }

  // 更新用户信息
  const updateUser = async (updates: Partial<User>): Promise<boolean> => {
    try {
      if (!state.user) return false
      
      // TODO: 调用后端更新用户API
      const updatedUser = { ...state.user, ...updates, updatedAt: new Date().toISOString() }
      
      localStorage.setItem('user_data', JSON.stringify(updatedUser))
      dispatch({ type: 'UPDATE_USER', payload: updates })
      
      return true
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: '更新用户信息失败' })
      return false
    }
  }

  // 获取当前用户
  const getCurrentUser = async (): Promise<User | null> => {
    return state.user
  }

  // 加载用户权限
  const loadUserPermissions = async (user: User) => {
    try {
      // TODO: 从后端加载用户权限
      const permissions: Record<string, boolean> = {
        'create_template': true,
        'edit_own_template': true,
        'delete_own_template': true,
        'view_public_templates': true,
        'download_templates': true
      }
      
      // 根据用户角色添加额外权限
      if (user.role === UserRole.ADMIN) {
        permissions['admin_access'] = true
        permissions['moderate_content'] = true
        permissions['manage_users'] = true
        permissions['edit_any_template'] = true
        permissions['delete_any_template'] = true
      } else if (user.role === UserRole.MODERATOR) {
        permissions['moderate_content'] = true
        permissions['edit_any_template'] = true
      }
      
      dispatch({ type: 'SET_PERMISSIONS', payload: permissions })
    } catch (error) {
      console.error('加载用户权限失败:', error)
    }
  }

  // 检查权限
  const hasPermission = (permission: string): boolean => {
    return state.permissions[permission] || false
  }

  // 检查角色
  const hasRole = (role: UserRole): boolean => {
    return permissionService.hasRole(state.user, role)
  }

  // 检查是否可以执行操作
  const canPerformAction = async (resource: any, action: string): Promise<PermissionCheckResult> => {
    // TODO: 实现具体的权限检查逻辑
    return { allowed: true }
  }

  // 工具方法
  const isGuest = (): boolean => {
    return !state.isAuthenticated || !state.user
  }

  const isAdmin = (): boolean => {
    return state.user?.role === UserRole.ADMIN
  }

  const isModerator = (): boolean => {
    return state.user?.role === UserRole.MODERATOR || isAdmin()
  }

  const clearError = (): void => {
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  // 清除存储的认证信息
  const clearStoredAuth = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_data')
  }

  const contextValue: UserContextType = {
    state,
    login,
    logout,
    register,
    refreshToken,
    updateUser,
    getCurrentUser,
    hasPermission,
    hasRole,
    canPerformAction,
    isGuest,
    isAdmin,
    isModerator,
    clearError
  }

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  )
}

// 自定义Hook
export function useUser(): UserContextType {
  const context = useContext(UserContext)
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

// 权限检查Hook
export function usePermission(permission: string): boolean {
  const { hasPermission } = useUser()
  return hasPermission(permission)
}

// 角色检查Hook
export function useRole(role: UserRole): boolean {
  const { hasRole } = useUser()
  return hasRole(role)
}

// 认证状态Hook
export function useAuth() {
  const { state, login, logout, register } = useUser()
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    login,
    logout,
    register
  }
}