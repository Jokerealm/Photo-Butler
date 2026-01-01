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

interface TemplateShowcaseProps {
  onTemplateSelect: (template: Template) => void;
}

interface TemplateListResponse {
  success: boolean;
  data: {
    templates: Template[];
  };
  error?: string;
}

const TemplateShowcase: React.FC<TemplateShowcaseProps> = ({
  onTemplateSelect
}) => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch templates from API
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

  // Get unique categories
  const categories = useMemo(() => {
    const cats = ['all', ...new Set(templates.map(t => t.category).filter(Boolean))];
    return cats;
  }, [templates]);

  // Filter templates by category
  const filteredTemplates = useMemo(() => {
    if (selectedCategory === 'all') return templates;
    return templates.filter(t => t.category === selectedCategory);
  }, [templates, selectedCategory]);

  // Handle template selection
  const handleTemplateClick = useCallback((template: Template) => {
    console.log('Template selected:', template.name);
    onTemplateSelect(template);
  }, [onTemplateSelect]);

  // Handle image load error
  const handleImageError = useCallback((event: React.SyntheticEvent<HTMLImageElement>) => {
    const img = event.target as HTMLImageElement;
    if (img.src !== '/images/placeholder.png') {
      console.warn('Template image failed to load, using placeholder:', img.src);
      img.src = '/images/placeholder.png';
    }
  }, []);

  // Retry loading templates
  const handleRetry = useCallback(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">正在加载艺术风格模板...</p>
          <p className="text-sm text-gray-500 mt-2">为您准备最美的视觉体验</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-6">
            <svg className="mx-auto h-16 w-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-xl font-medium">{error}</p>
          </div>
          <button
            onClick={handleRetry}
            className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors font-medium shadow-soft-blue"
          >
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 floating-animation">
            选择你的艺术风格
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            从精心策划的风格模板中选择，开启你的AI艺术之旅
          </p>
          <p className="text-sm text-gray-500">
            每个模板都经过专业调优，为你带来最佳的生成效果
          </p>
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="flex justify-center mb-8">
            <div className="glass-card rounded-2xl p-2 shadow-soft-blue">
              <div className="flex space-x-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category || 'all')}
                    className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      selectedCategory === category
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-glow'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                    }`}
                  >
                    {category === 'all' ? '全部风格' : category}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
          {filteredTemplates.map((template, index) => (
            <div
              key={template.id}
              className="template-card-hover cursor-pointer group"
              onClick={() => handleTemplateClick(template)}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="glass-card rounded-2xl overflow-hidden shadow-soft-blue glow-effect">
                {/* Template Preview */}
                <div className="aspect-square relative overflow-hidden">
                  <LazyImage
                    src={template.previewUrl}
                    alt={`${template.name} 风格预览`}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={handleImageError}
                    loading="lazy"
                    threshold={0.1}
                    rootMargin="100px"
                  />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center justify-center">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <span className="text-sm font-medium text-gray-900">选择此风格</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {template.name}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {template.prompt}
                  </p>
                  
                  {/* Category Badge */}
                  {template.category && (
                    <div className="mt-3">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {template.category}
                      </span>
                    </div>
                  )}
                </div>

                {/* Selection Button */}
                <div className="p-4 pt-0">
                  <button className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 shadow-soft-blue hover:shadow-glow">
                    选择这个风格
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTemplates.length === 0 && !loading && (
          <div className="text-center py-16">
            <div className="glass-card rounded-2xl p-8 max-w-md mx-auto shadow-soft-blue">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无此类风格</h3>
              <p className="text-gray-600">尝试选择其他分类或查看全部风格</p>
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-16 text-center">
          <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto shadow-soft-blue">
            <h4 className="text-lg font-medium text-gray-900 mb-3">💡 选择技巧</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
              <div className="space-y-2">
                <p>• 每个风格都有独特的艺术特色</p>
                <p>• 选择后可以进一步自定义提示词</p>
              </div>
              <div className="space-y-2">
                <p>• 建议先预览效果再做选择</p>
                <p>• 不同风格适合不同类型的照片</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateShowcase;