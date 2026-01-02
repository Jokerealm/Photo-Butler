'use client';

import { useState, useRef, useCallback } from 'react';
import { CreateTemplateRequest, TemplateUploadProps } from '../../types/promptTemplate';
import { validateCreateTemplateRequest } from '../../utils/promptTemplateValidation';

/**
 * 提示词模板上传组件
 * 实现模板上传表单、添加文件上传功能、集成实时验证
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */
export default function TemplateUpload({ 
  onSubmit, 
  onCancel, 
  loading = false 
}: TemplateUploadProps) {
  const [formData, setFormData] = useState<CreateTemplateRequest>({
    title: '',
    description: '',
    content: '',
    tags: [],
    thumbnailFile: undefined
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 实时验证
  const validateField = useCallback((field: string, value: any) => {
    const tempRequest = { ...formData, [field]: value };
    const validationResult = validateCreateTemplateRequest(tempRequest);
    
    const fieldErrors: Record<string, string> = {};
    validationResult.errors.forEach(error => {
      if (error.field === field) {
        fieldErrors[field] = error.message;
      }
    });
    
    setErrors(prev => ({
      ...prev,
      [field]: fieldErrors[field] || ''
    }));
  }, [formData]);

  // 处理表单字段变化
  const handleFieldChange = (field: keyof CreateTemplateRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  // 处理标题变化
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    handleFieldChange('title', value);
  };

  // 处理描述变化
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    handleFieldChange('description', value);
  };

  // 处理内容变化
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    handleFieldChange('content', value);
  };

  // 处理标签输入
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  // 添加标签
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag) && formData.tags.length < 10) {
      const newTags = [...formData.tags, trimmedTag];
      handleFieldChange('tags', newTags);
    }
  };

  // 处理标签输入键盘事件
  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    } else if (e.key === 'Backspace' && tagInput === '' && formData.tags.length > 0) {
      const newTags = formData.tags.slice(0, -1);
      handleFieldChange('tags', newTags);
    }
  };

  // 移除标签
  const removeTag = (index: number) => {
    const newTags = formData.tags.filter((_, i) => i !== index);
    handleFieldChange('tags', newTags);
  };

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, thumbnailFile: '只支持 JPG 和 PNG 格式的图片' }));
      return;
    }

    // 验证文件大小 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, thumbnailFile: '文件大小不能超过 5MB' }));
      return;
    }

    // 清除错误并设置文件
    setErrors(prev => ({ ...prev, thumbnailFile: '' }));
    handleFieldChange('thumbnailFile', file);

    // 创建预览URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // 处理文件输入变化
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 处理拖拽事件
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // 处理文件拖放
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // 打开文件选择器
  const openFileSelector = () => {
    fileInputRef.current?.click();
  };

  // 移除文件
  const removeFile = () => {
    handleFieldChange('thumbnailFile', undefined);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 完整验证
    const validationResult = validateCreateTemplateRequest(formData);
    if (!validationResult.isValid) {
      const fieldErrors: Record<string, string> = {};
      validationResult.errors.forEach(error => {
        fieldErrors[error.field] = error.message;
      });
      setErrors(fieldErrors);
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  // 处理取消
  const handleCancel = () => {
    onCancel?.();
  };

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="template-upload-form">
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">上传新模板</h1>
          <p className="text-gray-600 mt-1">创建一个新的提示词模板并分享给其他用户</p>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左侧：表单字段 */}
            <div className="space-y-6">
              {/* 标题 */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  模板标题 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={handleTitleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                    errors.title ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="输入模板标题"
                  maxLength={100}
                  data-testid="title-input"
                />
                {errors.title && (
                  <p className="mt-1 text-sm text-red-600" data-testid="title-error">
                    {errors.title}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.title.length}/100 字符
                </p>
              </div>

              {/* 描述 */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  模板描述 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={handleDescriptionChange}
                  rows={4}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="描述这个模板的用途和特点"
                  maxLength={500}
                  data-testid="description-input"
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600" data-testid="description-error">
                    {errors.description}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.description.length}/500 字符
                </p>
              </div>

              {/* 标签 */}
              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                  标签
                </label>
                <div className={`border rounded-lg p-3 focus-within:ring-2 focus-within:ring-blue-500 transition-colors duration-200 ${
                  errors.tags ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                        data-testid={`tag-${index}`}
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                          data-testid={`remove-tag-${index}`}
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagKeyDown}
                    className="w-full border-none outline-none text-sm"
                    placeholder={formData.tags.length === 0 ? "输入标签，按回车或逗号添加" : "继续添加标签..."}
                    maxLength={20}
                    data-testid="tag-input"
                  />
                </div>
                {errors.tags && (
                  <p className="mt-1 text-sm text-red-600" data-testid="tags-error">
                    {errors.tags}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  最多添加 10 个标签，每个标签最长 20 字符
                </p>
              </div>
            </div>

            {/* 右侧：缩略图上传 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                缩略图
              </label>
              <div
                className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200 ${
                  dragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : errors.thumbnailFile 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                data-testid="file-drop-zone"
              >
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="预览"
                      className="w-full h-48 object-cover rounded-lg"
                      data-testid="image-preview"
                    />
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors duration-200"
                      data-testid="remove-image-button"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <svg className="mx-auto w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <div>
                      <p className="text-gray-600">拖拽图片到此处，或</p>
                      <button
                        type="button"
                        onClick={openFileSelector}
                        className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        data-testid="select-file-button"
                      >
                        选择文件
                      </button>
                    </div>
                    <p className="text-xs text-gray-500">
                      支持 JPG、PNG 格式，最大 5MB
                    </p>
                  </div>
                )}
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileInputChange}
                  className="hidden"
                  data-testid="file-input"
                />
              </div>
              {errors.thumbnailFile && (
                <p className="mt-1 text-sm text-red-600" data-testid="file-error">
                  {errors.thumbnailFile}
                </p>
              )}
            </div>
          </div>

          {/* 提示词内容 */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              提示词内容 <span className="text-red-500">*</span>
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={handleContentChange}
              rows={8}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 resize-none font-mono text-sm ${
                errors.content ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="输入完整的提示词内容..."
              maxLength={5000}
              data-testid="content-input"
            />
            {errors.content && (
              <p className="mt-1 text-sm text-red-600" data-testid="content-error">
                {errors.content}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              {formData.content.length}/5000 字符
            </p>
          </div>

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="cancel-button"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              data-testid="submit-button"
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? '创建中...' : '创建模板'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}