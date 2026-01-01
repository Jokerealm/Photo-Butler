'use client';

import React, { useEffect, useState } from 'react';
import { useTemplateStore } from '../stores/templateStore';
import { useUIStore } from '../stores/uiStore';
import { apiService } from '../services/apiService';
import { Template } from '../types';
import TemplateCard from '../components/TemplateCard';
import SearchBar from '../components/SearchBar';
import TemplateModal from '../components/TemplateModal';

interface TemplateMarketplaceProps {
  onTemplateSelect?: (template: Template) => void;
}

const TemplateMarketplace: React.FC<TemplateMarketplaceProps> = ({ 
  onTemplateSelect 
}) => {
  const {
    filteredTemplates,
    searchQuery,
    loading,
    error,
    selectedTemplate,
    showModal,
    setTemplates,
    setLoading,
    setError,
    searchTemplates,
    selectTemplate,
    closeModal,
  } = useTemplateStore();

  const { showToast } = useUIStore();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiService.getTemplates();
      if (response.success) {
        setTemplates(response.data.templates);
      } else {
        throw new Error(response.error || '获取模板失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载模板失败';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateClick = (template: Template) => {
    selectTemplate(template);
    onTemplateSelect?.(template);
  };

  const handleRetry = () => {
    loadTemplates();
  };

  const handleTaskSubmit = (task: any) => {
    showToast(`生成任务已提交 (ID: ${task.id})`, 'success');
    closeModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载模板中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">加载失败</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">模板商城</h1>
        <p className="text-gray-600">选择您喜欢的AI艺术风格模板</p>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          value={searchQuery}
          onChange={searchTemplates}
          placeholder="搜索模板名称、描述或标签..."
          enableServerSearch={true}
        />
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 && !loading ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">未找到匹配模板</h3>
          <p className="text-gray-600">尝试使用不同的关键词搜索</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onClick={handleTemplateClick}
            />
          ))}
        </div>
      )}

      {/* Template Modal */}
      {selectedTemplate && (
        <TemplateModal
          template={selectedTemplate}
          isOpen={showModal}
          onClose={closeModal}
          onTaskSubmit={handleTaskSubmit}
        />
      )}
    </div>
  );
};

export default TemplateMarketplace;