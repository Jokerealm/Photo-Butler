'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Template, GenerationTask } from '../types';
import { apiService } from '../services/apiService';
import ImageUploader from './ImageUploader';

interface TemplateModalProps {
  template: Template;
  isOpen: boolean;
  onClose: () => void;
  onTaskSubmit: (task: GenerationTask) => void;
}

interface ConfirmationModalProps {
  isOpen: boolean;
  taskId: string;
  onContinue: () => void;
  onViewWorkspace: () => void;
  onClose: () => void;
}

// Confirmation Modal Component
function ConfirmationModal({ isOpen, taskId, onContinue, onViewWorkspace, onClose }: ConfirmationModalProps) {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all duration-300 scale-100 opacity-100">
        {/* Success Icon */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Message */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            任务已添加到后台进行生成
          </h3>
          <p className="text-sm text-gray-600">
            任务ID: {taskId}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            您可以继续浏览模板或前往工作区查看生成进度
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinue}
            className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            继续生成
          </button>
          <button
            onClick={onViewWorkspace}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            去查看
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplateModal({ template, isOpen, onClose, onTaskSubmit }: TemplateModalProps) {
  const router = useRouter();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<GenerationTask | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // 添加提示词编辑状态
  const [editablePrompt, setEditablePrompt] = useState<string>('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setUploadedFile(null);
      setPreviewUrl(null);
      setIsSubmitting(false);
      setSubmitError(null);
      setSubmitSuccess(null);
      setShowConfirmation(false);
      setIsEditingPrompt(false);
    } else {
      // 当模态框打开时，初始化可编辑的提示词
      setEditablePrompt(template.prompt);
    }
  }, [isOpen, template.prompt]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleImageUpload = useCallback((file: File, preview: string) => {
    setUploadedFile(file);
    setPreviewUrl(preview);
    setSubmitError(null);
  }, []);

  // 处理提示词编辑
  const handlePromptEdit = useCallback(() => {
    setIsEditingPrompt(true);
  }, []);

  const handlePromptSave = useCallback(() => {
    setIsEditingPrompt(false);
  }, []);

  const handlePromptCancel = useCallback(() => {
    setEditablePrompt(template.prompt);
    setIsEditingPrompt(false);
  }, [template.prompt]);

  const handlePromptReset = useCallback(() => {
    setEditablePrompt(template.prompt);
  }, [template.prompt]);

  // Confirmation modal handlers
  const handleContinueGeneration = useCallback(() => {
    setShowConfirmation(false);
    // Reset form for next generation
    setUploadedFile(null);
    setPreviewUrl(null);
    setSubmitError(null);
    setSubmitSuccess(null);
  }, []);

  const handleViewWorkspace = useCallback(() => {
    setShowConfirmation(false);
    onClose();
    router.push('/workspace');
  }, [onClose, router]);

  const handleCloseConfirmation = useCallback(() => {
    setShowConfirmation(false);
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!uploadedFile) {
      setSubmitError('请先上传图片');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 使用编辑后的提示词，如果与原始提示词不同，则作为自定义提示词传递
      const customPrompt = editablePrompt !== template.prompt ? editablePrompt : undefined;
      
      console.log('Creating task with:', {
        templateId: template.id,
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        customPrompt: customPrompt ? 'Custom prompt provided' : 'Using template prompt'
      });
      
      const response = await apiService.createTask(template.id, uploadedFile, customPrompt);
      
      console.log('Task creation response:', response);
      
      if (response.success) {
        const task = response.data.task;
        console.log('Task created successfully:', task.id);
        setSubmitSuccess(task);
        setShowConfirmation(true);
        onTaskSubmit(task);
      } else {
        throw new Error(response.error || '任务提交失败');
      }
    } catch (err) {
      console.error('Task creation failed:', err);
      const errorMessage = err instanceof Error ? err.message : '提交失败，请重试';
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [uploadedFile, template.id, template.prompt, editablePrompt, onTaskSubmit]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ${
        isOpen ? 'bg-black bg-opacity-50' : 'bg-black bg-opacity-0'
      } p-0 sm:p-4`}
      onClick={handleBackdropClick}
    >
      <div className={`bg-white shadow-2xl w-full h-full sm:max-w-4xl sm:w-full sm:max-h-[90vh] sm:rounded-2xl overflow-hidden transform transition-all duration-300 ${
        isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
      }`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 truncate pr-4">
            {template.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0 touch-manipulation"
            aria-label="关闭"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[calc(100vh-140px)] sm:max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Left Column - Template Info */}
            <div>
              {/* Template Preview */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">预览效果</h3>
                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden shadow-lg">
                  <img
                    src={template.previewUrl}
                    alt={template.name}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder.png';
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 text-center">
                  使用此模板生成的示例效果
                </p>
              </div>

              {/* Template Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">模板信息</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">创建时间</span>
                      <span className="text-sm text-gray-900">
                        {new Date(template.createdAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                    {template.category && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-600">分类</span>
                        <span className="text-sm text-gray-900">{template.category}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">描述</h3>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <p className="text-gray-700 leading-relaxed">{template.description}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">AI提示词</h3>
                    <div className="flex items-center space-x-2">
                      {isEditingPrompt ? (
                        <>
                          <button
                            onClick={handlePromptReset}
                            className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                            title="重置为模板默认"
                          >
                            重置
                          </button>
                          <button
                            onClick={handlePromptCancel}
                            className="px-3 py-1 text-xs text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                          >
                            取消
                          </button>
                          <button
                            onClick={handlePromptSave}
                            className="px-3 py-1 text-xs text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                          >
                            保存
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={handlePromptEdit}
                          className="px-3 py-1 text-xs text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center space-x-1"
                        >
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          <span>编辑</span>
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {isEditingPrompt ? (
                    <div className="space-y-3">
                      <textarea
                        value={editablePrompt}
                        onChange={(e) => setEditablePrompt(e.target.value)}
                        className="w-full h-48 p-4 border border-gray-300 rounded-lg resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono leading-relaxed"
                        placeholder="编辑AI提示词..."
                      />
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{editablePrompt.length} 字符</span>
                        <span>提示：详细的描述有助于生成更好的效果</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-900 rounded-lg p-4 max-h-48 overflow-y-auto">
                      <pre className="text-sm text-green-400 font-mono leading-relaxed whitespace-pre-wrap">
                        {editablePrompt}
                      </pre>
                    </div>
                  )}
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {isEditingPrompt 
                      ? '您可以根据需要修改提示词，以获得更符合期望的生成效果'
                      : '此提示词将用于指导AI生成您的专属艺术作品'
                    }
                  </p>
                </div>

                {template.tags && template.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">风格标签</h3>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm rounded-full border border-blue-200 hover:from-blue-200 hover:to-purple-200 transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Upload and Generate */}
            <div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">上传参考图片</h3>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-500 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-blue-900 mb-1">上传说明</h4>
                        <ul className="text-xs text-blue-800 space-y-1">
                          <li>• 支持JPG、PNG格式，文件大小不超过10MB</li>
                          <li>• 建议上传清晰、高质量的参考图片</li>
                          <li>• 图片将作为AI生成的参考基础</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  
                  <ImageUploader
                    onImageUpload={handleImageUpload}
                    acceptedFormats={['image/jpeg', 'image/png']}
                  />
                </div>

                {uploadedFile && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <p className="text-sm text-green-700 font-medium">
                            图片上传成功
                          </p>
                          <p className="text-xs text-green-600">
                            {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setUploadedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="text-green-600 hover:text-green-800 transition-colors"
                        title="重新上传"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {submitError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm text-red-700 font-medium">提交失败</p>
                        <p className="text-xs text-red-600 mt-1">{submitError}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <h4 className="text-sm font-medium text-amber-900 mb-1">生成说明</h4>
                      <ul className="text-xs text-amber-800 space-y-1">
                        <li>• 生成任务将在后台异步处理，无需等待</li>
                        <li>• 您可以继续浏览其他模板或提交更多任务</li>
                        <li>• 完成后可在&quot;作品仓库&quot;中查看生成结果</li>
                        <li>• 生成时间通常为1-3分钟，请耐心等待</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between p-4 sm:p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0 gap-3 sm:gap-0">
          <div className="text-sm text-gray-600 order-2 sm:order-1 text-center sm:text-left">
            {uploadedFile ? (
              <span className="flex items-center justify-center sm:justify-start text-green-600">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                已准备就绪
                {editablePrompt !== template.prompt && (
                  <span className="ml-2 text-blue-600">(已自定义提示词)</span>
                )}
              </span>
            ) : (
              '请先上传参考图片'
            )}
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 order-1 sm:order-2">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!uploadedFile || isSubmitting || isEditingPrompt}
              className={`flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-2 rounded-lg font-medium transition-all duration-200 touch-manipulation ${
                uploadedFile && !isSubmitting && !isEditingPrompt
                  ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>提交中...</span>
                </div>
              ) : isEditingPrompt ? (
                '请先保存提示词'
              ) : (
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>开始生成</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && submitSuccess && (
        <ConfirmationModal
          isOpen={showConfirmation}
          taskId={submitSuccess.id}
          onContinue={handleContinueGeneration}
          onViewWorkspace={handleViewWorkspace}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
}