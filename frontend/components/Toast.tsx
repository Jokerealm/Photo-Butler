'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

/**
 * Toast类型
 * Toast types
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * Toast消息接口
 * Toast message interface
 */
export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Toast上下文接口
 * Toast context interface
 */
interface ToastContextType {
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
  error: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
  warning: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
  info: (title: string, message?: string, options?: Partial<ToastMessage>) => string;
}

/**
 * Toast上下文
 * Toast context
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * 生成唯一ID
 * Generate unique ID
 */
const generateId = (): string => {
  return `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Toast提供者组件
 * Toast provider component
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  /**
   * 添加Toast
   * Add toast
   */
  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>): string => {
    const id = generateId();
    const newToast: ToastMessage = {
      id,
      duration: 5000, // 默认5秒
      ...toast
    };

    setToasts(prev => [...prev, newToast]);

    // 自动移除（如果不是持久化的）
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  /**
   * 移除Toast
   * Remove toast
   */
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * 清除所有Toast
   * Clear all toasts
   */
  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  /**
   * 成功Toast
   * Success toast
   */
  const success = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastMessage>
  ): string => {
    return addToast({
      type: 'success',
      title,
      message,
      ...options
    });
  }, [addToast]);

  /**
   * 错误Toast
   * Error toast
   */
  const error = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastMessage>
  ): string => {
    return addToast({
      type: 'error',
      title,
      message,
      duration: 8000, // 错误消息显示更长时间
      ...options
    });
  }, [addToast]);

  /**
   * 警告Toast
   * Warning toast
   */
  const warning = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastMessage>
  ): string => {
    return addToast({
      type: 'warning',
      title,
      message,
      duration: 6000,
      ...options
    });
  }, [addToast]);

  /**
   * 信息Toast
   * Info toast
   */
  const info = useCallback((
    title: string, 
    message?: string, 
    options?: Partial<ToastMessage>
  ): string => {
    return addToast({
      type: 'info',
      title,
      message,
      ...options
    });
  }, [addToast]);

  const contextValue: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

/**
 * Toast容器组件
 * Toast container component
 */
const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts } = context;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};

/**
 * Toast项组件
 * Toast item component
 */
const ToastItem: React.FC<{ toast: ToastMessage }> = ({ toast }) => {
  const context = useContext(ToastContext);
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 进入动画
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = useCallback(() => {
    if (!context) return;
    
    setIsLeaving(true);
    setTimeout(() => {
      context.removeToast(toast.id);
    }, 300); // 等待退出动画完成
  }, [context, toast.id]);

  const getToastStyles = () => {
    const baseStyles = "transform transition-all duration-300 ease-in-out";
    const visibilityStyles = isVisible && !isLeaving 
      ? "translate-x-0 opacity-100" 
      : "translate-x-full opacity-0";
    
    return `${baseStyles} ${visibilityStyles}`;
  };

  const getToastColorStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-200 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIconStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const renderIcon = () => {
    const iconClass = `w-5 h-5 ${getIconStyles()}`;
    
    switch (toast.type) {
      case 'success':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case 'error':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case 'warning':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'info':
        return (
          <svg className={iconClass} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`${getToastStyles()}`}>
      <div className={`max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${getToastColorStyles()}`}>
        <div className="p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {renderIcon()}
            </div>
            <div className="ml-3 w-0 flex-1 pt-0.5">
              <p className="text-sm font-medium">
                {toast.title}
              </p>
              {toast.message && (
                <p className="mt-1 text-sm opacity-90">
                  {toast.message}
                </p>
              )}
              {toast.action && (
                <div className="mt-3">
                  <button
                    onClick={toast.action.onClick}
                    className="text-sm font-medium underline hover:no-underline focus:outline-none"
                  >
                    {toast.action.label}
                  </button>
                </div>
              )}
            </div>
            <div className="ml-4 flex-shrink-0 flex">
              <button
                onClick={handleClose}
                className="inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150"
              >
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * 使用Toast的Hook
 * Hook for using toast
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;