'use client';

import { useMemo } from 'react';
import { TemplateListProps } from '../../types/promptTemplate';
import TemplateCard from './TemplateCard';

/**
 * 提示词模板列表组件
 * 以网格布局显示模板卡片，支持空状态显示
 */
export default function TemplateList({ 
  templates,
  loading = false,
  onTemplateSelect,
  onTemplateEdit,
  onTemplateDelete
}: TemplateListProps) {
  
  // 计算网格列数（响应式）
  const gridCols = useMemo(() => {
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5';
  }, []);

  // 加载状态
  if (loading) {
    return (
      <div className="space-y-6" data-testid="template-list-loading">
        {/* 加载指示器 */}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="text-gray-500 text-sm">正在加载模板...</p>
          </div>
        </div>
        
        {/* 骨架屏 */}
        <div className={`grid ${gridCols} gap-6`}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden animate-pulse">
              <div className="w-full bg-gray-200" style={{ aspectRatio: '340/240' }}></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
                <div className="flex space-x-2">
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                  <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 空状态
  if (!templates || templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4" data-testid="template-list-empty">
        <div className="text-center max-w-md">
          {/* 空状态图标 */}
          <div className="mx-auto w-24 h-24 mb-6 text-gray-300">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="w-full h-full">
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" 
              />
            </svg>
          </div>
          
          {/* 空状态文本 */}
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            暂无模板
          </h3>
          <p className="text-gray-500 mb-6 leading-relaxed">
            还没有找到任何提示词模板。您可以尝试调整搜索条件，或者上传第一个模板。
          </p>
          
          {/* 空状态操作 */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button 
              className="px-6 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
              onClick={() => {
                // TODO: 导航到上传页面
                console.log('Navigate to upload page');
              }}
            >
              上传模板
            </button>
            <button 
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
              onClick={() => {
                // TODO: 重置筛选条件
                console.log('Reset filters');
              }}
            >
              重置筛选
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 模板网格
  return (
    <div className="space-y-6" data-testid="template-list">
      {/* 结果统计 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          找到 <span className="font-medium text-gray-900">{templates.length}</span> 个模板
        </div>
        
        {/* 排序选项 */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">排序：</span>
          <select 
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-blue-500 transition-colors duration-200"
            defaultValue="createdAt"
            onChange={(e) => {
              // TODO: 实现排序逻辑
              console.log('Sort by:', e.target.value);
            }}
          >
            <option value="createdAt">创建时间</option>
            <option value="updatedAt">更新时间</option>
            <option value="title">标题</option>
            <option value="usageCount">使用次数</option>
          </select>
        </div>
      </div>

      {/* 模板网格 */}
      <div className={`grid ${gridCols} gap-6`}>
        {templates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            onClick={onTemplateSelect}
            onEdit={onTemplateEdit}
            onDelete={onTemplateDelete}
            className="h-full"
          />
        ))}
      </div>

      {/* 加载更多 */}
      {templates.length > 0 && templates.length % 20 === 0 && (
        <div className="flex justify-center pt-8">
          <button 
            className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 font-medium"
            onClick={() => {
              // TODO: 实现加载更多逻辑
              console.log('Load more templates');
            }}
          >
            加载更多
          </button>
        </div>
      )}

      {/* 性能提示 */}
      {templates.length > 100 && (
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-yellow-400 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-yellow-800">性能提示</h4>
              <p className="text-sm text-yellow-700 mt-1">
                当前显示了大量模板，可能会影响页面性能。建议使用搜索和筛选功能来缩小结果范围。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}