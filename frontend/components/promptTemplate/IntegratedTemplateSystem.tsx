/**
 * 集成的提示词模板系统
 * Integrated Prompt Template System
 * 
 * 连接所有UI组件，展示完整的用户流程
 * Requirements: 3.1, 3.2, 3.3, 3.4, 4.1
 */

import React, { useState, useEffect, useCallback } from 'react'
import { usePromptTemplateStore, useAvailableTags, useTemplateStats } from '../../stores/promptTemplateStore'
import { PromptTemplate, CreateTemplateRequest } from '../../types/promptTemplate'

// 导入所有组件
import TemplateList from './TemplateList'
import TemplateCard from './TemplateCard'
import TemplateDetail from './TemplateDetail'
import TemplateUpload from './TemplateUpload'
import SearchBar from './SearchBar'
import TagFilter from './TagFilter'

/**
 * 视图模式枚举
 */
enum ViewMode {
  LIST = 'list',
  DETAIL = 'detail',
  UPLOAD = 'upload',
  EDIT = 'edit'
}

/**
 * 集成模板系统组件
 */
const IntegratedTemplateSystem: React.FC = () => {
  // Store状态
  const {
    templates,
    filteredTemplates,
    loading,
    error,
    searchQuery,
    selectedTags,
    selectedTemplate,
    loadTemplates,
    setSearchQuery,
    toggleTag,
    clearTagFilter,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    selectTemplate,
    clearError
  } = usePromptTemplateStore()
  
  // 本地状态
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.LIST)
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null)
  const [showStats, setShowStats] = useState(false)
  
  // 获取辅助数据
  const availableTags = useAvailableTags()
  const templateStats = useTemplateStats()
  
  // 初始化加载
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])
  
  // 错误自动清除
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])
  
  /**
   * 处理搜索
   */
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
  }, [setSearchQuery])
  
  /**
   * 处理标签切换
   */
  const handleTagToggle = useCallback((tag: string) => {
    toggleTag(tag)
  }, [toggleTag])
  
  /**
   * 处理清除标签筛选
   */
  const handleClearTags = useCallback(() => {
    clearTagFilter()
  }, [clearTagFilter])
  
  /**
   * 处理模板选择
   */
  const handleTemplateSelect = useCallback((template: PromptTemplate) => {
    selectTemplate(template)
    setViewMode(ViewMode.DETAIL)
  }, [selectTemplate])
  
  /**
   * 处理模板创建
   */
  const handleTemplateCreate = useCallback(async (request: CreateTemplateRequest) => {
    try {
      await createTemplate(request)
      setViewMode(ViewMode.LIST)
      // 显示成功消息
      console.log('模板创建成功')
    } catch (error) {
      console.error('创建模板失败:', error)
      throw error
    }
  }, [createTemplate])
  
  /**
   * 处理模板更新
   */
  const handleTemplateUpdate = useCallback(async (id: string, updates: Partial<PromptTemplate>) => {
    try {
      await updateTemplate(id, updates)
      setViewMode(ViewMode.LIST)
      setEditingTemplate(null)
      // 显示成功消息
      console.log('模板更新成功')
    } catch (error) {
      console.error('更新模板失败:', error)
      throw error
    }
  }, [updateTemplate])
  
  /**
   * 处理模板删除
   */
  const handleTemplateDelete = useCallback(async (id: string) => {
    try {
      await deleteTemplate(id)
      if (selectedTemplate?.id === id) {
        selectTemplate(null)
        setViewMode(ViewMode.LIST)
      }
      // 显示成功消息
      console.log('模板删除成功')
    } catch (error) {
      console.error('删除模板失败:', error)
      throw error
    }
  }, [deleteTemplate, selectedTemplate, selectTemplate])
  
  /**
   * 处理编辑模板
   */
  const handleEditTemplate = useCallback((template: PromptTemplate) => {
    setEditingTemplate(template)
    setViewMode(ViewMode.EDIT)
  }, [])
  
  /**
   * 处理返回列表
   */
  const handleBackToList = useCallback(() => {
    setViewMode(ViewMode.LIST)
    setEditingTemplate(null)
    selectTemplate(null)
  }, [selectTemplate])
  
  /**
   * 处理显示上传页面
   */
  const handleShowUpload = useCallback(() => {
    setViewMode(ViewMode.UPLOAD)
  }, [])
  
  /**
   * 切换统计信息显示
   */
  const handleToggleStats = useCallback(() => {
    setShowStats(prev => !prev)
  }, [])
  
  /**
   * 渲染头部工具栏
   */
  const renderHeader = () => (
    <div className="bg-white shadow-sm border-b border-gray-200 p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          提示词模板系统
        </h1>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={handleToggleStats}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            {showStats ? '隐藏统计' : '显示统计'}
          </button>
          
          {viewMode === ViewMode.LIST && (
            <button
              onClick={handleShowUpload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              上传模板
            </button>
          )}
          
          {viewMode !== ViewMode.LIST && (
            <button
              onClick={handleBackToList}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
            >
              返回列表
            </button>
          )}
        </div>
      </div>
      
      {/* 统计信息 */}
      {showStats && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">系统统计</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{templateStats.total}</div>
              <div className="text-sm text-gray-600">总模板数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{templateStats.totalTags}</div>
              <div className="text-sm text-gray-600">标签数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {templateStats.averageTagsPerTemplate.toFixed(1)}
              </div>
              <div className="text-sm text-gray-600">平均标签数</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{filteredTemplates.length}</div>
              <div className="text-sm text-gray-600">筛选结果</div>
            </div>
          </div>
        </div>
      )}
      
      {/* 搜索和筛选 */}
      {viewMode === ViewMode.LIST && (
        <div className="space-y-4">
          <SearchBar
            value={searchQuery}
            onChange={handleSearch}
            placeholder="搜索模板标题、描述或内容..."
            suggestions={availableTags.slice(0, 5)}
          />
          
          <TagFilter
            availableTags={availableTags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
            onClearAll={handleClearTags}
          />
        </div>
      )}
    </div>
  )
  
  /**
   * 渲染错误信息
   */
  const renderError = () => {
    if (!error) return null
    
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              操作失败
            </h3>
            <div className="mt-2 text-sm text-red-700">
              {error}
            </div>
          </div>
          <div className="ml-auto pl-3">
            <button
              onClick={clearError}
              className="inline-flex text-red-400 hover:text-red-600"
            >
              <span className="sr-only">关闭</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    )
  }
  
  /**
   * 渲染加载状态
   */
  const renderLoading = () => {
    if (!loading) return null
    
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">加载中...</span>
      </div>
    )
  }
  
  /**
   * 渲染主要内容
   */
  const renderMainContent = () => {
    if (loading) {
      return renderLoading()
    }
    
    switch (viewMode) {
      case ViewMode.LIST:
        return (
          <TemplateList
            templates={filteredTemplates}
            loading={loading}
            onTemplateClick={handleTemplateSelect}
            onTemplateEdit={handleEditTemplate}
            onTemplateDelete={handleTemplateDelete}
          />
        )
      
      case ViewMode.DETAIL:
        return selectedTemplate ? (
          <TemplateDetail
            template={selectedTemplate}
            onEdit={() => handleEditTemplate(selectedTemplate)}
            onDelete={() => handleTemplateDelete(selectedTemplate.id)}
            onClose={handleBackToList}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">未选择模板</p>
          </div>
        )
      
      case ViewMode.UPLOAD:
        return (
          <TemplateUpload
            onSubmit={handleTemplateCreate}
            onCancel={handleBackToList}
            loading={loading}
          />
        )
      
      case ViewMode.EDIT:
        return editingTemplate ? (
          <TemplateUpload
            initialData={{
              title: editingTemplate.title,
              description: editingTemplate.description,
              content: editingTemplate.content,
              tags: editingTemplate.tags
            }}
            onSubmit={(request) => handleTemplateUpdate(editingTemplate.id, request)}
            onCancel={handleBackToList}
            loading={loading}
            isEditing={true}
          />
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">未选择要编辑的模板</p>
          </div>
        )
      
      default:
        return (
          <div className="text-center py-12">
            <p className="text-gray-500">未知视图模式</p>
          </div>
        )
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {renderHeader()}
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderError()}
        {renderMainContent()}
      </main>
      
      {/* 底部信息 */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              提示词模板系统 v1.0.0 - 
              {templateStats.mostRecentTemplate && (
                <span className="ml-1">
                  最新模板: {templateStats.mostRecentTemplate.title}
                </span>
              )}
            </div>
            <div>
              当前显示: {filteredTemplates.length} / {templates.length} 个模板
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default IntegratedTemplateSystem