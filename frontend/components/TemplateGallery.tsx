'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import LazyImage from './LazyImage';

// Template interface matching the backend type
interface Template {
  id: string;
  name: string;
  previewUrl: string;
  prompt: string;
  category?: string;
}

interface TemplateGalleryProps {
  selectedTemplate: Template | null;
  onTemplateSelect: (template: Template) => void;
  disabled?: boolean;
}

interface TemplateListResponse {
  success: boolean;
  data: {
    templates: Template[];
  };
  error?: string;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  selectedTemplate,
  onTemplateSelect,
  disabled = false
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch templates from API with memoization
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/templates');
      const data: TemplateListResponse = await response.json();

      if (data.success) {
        setTemplates(data.data.templates);
        console.log(`Loaded ${data.data.templates.length} templates`);
      } else {
        setError(data.error || '获取模板列表失败');
      }
    } catch (err) {
      console.error('Error fetching templates:', err);
      setError('网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Handle template selection
  const handleTemplateClick = useCallback((template: Template) => {
    if (disabled) return;
    
    console.log('Template selected:', template.name);
    onTemplateSelect(template);
  }, [disabled, onTemplateSelect]);

  // Handle image load error - fallback to placeholder
  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    if (img.src !== '/images/placeholder.png') {
      console.warn('Template image failed to load, using placeholder:', img.src);
      img.src = '/images/placeholder.png';
    }
  }, []);

  // Retry loading templates with memoization
  const handleRetry = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // Memoize template rendering for performance
  const templateItems = useMemo(() => {
    return templates.map((template) => {
      const isSelected = selectedTemplate?.id === template.id;
      
      return (
        <div
          key={template.id}
          className={`
            relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all duration-200
            ${disabled 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:shadow-lg hover:scale-105'
            }
            ${isSelected 
              ? 'border-blue-500 ring-2 ring-blue-200 shadow-lg' 
              : 'border-gray-200 hover:border-gray-300'
            }
          `}
          onClick={() => handleTemplateClick(template)}
          role="button"
          tabIndex={disabled ? -1 : 0}
          aria-label={`选择模板: ${template.name}`}
          onKeyDown={(e) => {
            if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
              e.preventDefault();
              handleTemplateClick(template);
            }
          }}
        >
          {/* Template Preview Image with Lazy Loading */}
          <div className="aspect-square bg-gray-100 relative overflow-hidden">
            <LazyImage
              src={template.previewUrl}
              alt={`${template.name} 预览`}
              className="w-full h-full"
              onError={handleImageError}
              loading="lazy"
              threshold={0.1}
              rootMargin="100px"
            />
            
            {/* Selection Indicator */}
            {isSelected && (
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-blue-500 text-white rounded-full p-1">
                <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>

          {/* Template Name */}
          <div className="p-2 sm:p-3 bg-white">
            <h3 className={`
              text-xs sm:text-sm font-medium text-center truncate
              ${isSelected ? 'text-blue-600' : 'text-gray-900'}
            `}>
              {template.name}
            </h3>
          </div>

          {/* Hover Overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 pointer-events-none" />
          )}
        </div>
      );
    });
  }, [templates, selectedTemplate, disabled, handleTemplateClick, handleImageError]);

  if (loading) {
    return (
      <div className="w-full">
        <div className="flex items-center justify-center py-8 sm:py-12">
          <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-sm sm:text-base text-gray-600">加载模板中...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full">
        <div className="text-center py-8 sm:py-12">
          <div className="text-red-500 mb-4">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-base sm:text-lg font-medium">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm sm:text-base"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="w-full">
        <div className="text-center py-8 sm:py-12">
          <div className="text-gray-500">
            <svg className="mx-auto h-10 w-10 sm:h-12 sm:w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-base sm:text-lg font-medium">暂无可用模板</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">请联系管理员添加模板</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
        {templateItems}
      </div>

      {/* Selected Template Info */}
      {selectedTemplate && (
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <LazyImage
                src={selectedTemplate.previewUrl}
                alt={`${selectedTemplate.name} 预览`}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg"
                onError={handleImageError}
                loading="eager"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-blue-900">
                已选择模板: {selectedTemplate.name}
              </p>
              {selectedTemplate.prompt && (
                <p className="text-xs text-blue-700 mt-1 truncate">
                  提示词: {selectedTemplate.prompt}
                </p>
              )}
            </div>
            <div className="flex-shrink-0">
              <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateGallery;