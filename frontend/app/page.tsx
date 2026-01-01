'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import DynamicLoader from '../components/DynamicLoader';
import { HistoryItem, saveHistoryItem, generateHistoryId } from '../utils/localStorage';

// Dynamic imports for code splitting
const ImageUploader = dynamic(() => import('../components/ImageUploader'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-sm text-gray-600">加载上传组件...</span>
    </div>
  )
});

const TemplateGallery = dynamic(() => import('../components/TemplateGallery'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-sm text-gray-600">加载模板库...</span>
    </div>
  )
});

const PromptEditor = dynamic(() => import('../components/PromptEditor'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-sm text-gray-600">加载编辑器...</span>
    </div>
  )
});

const ImageGenerator = dynamic(() => import('../components/ImageGenerator'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-sm text-gray-600">加载生成器...</span>
    </div>
  )
});

const HistoryViewer = dynamic(() => import('../components/HistoryViewer'), {
  loading: () => (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      <span className="ml-3 text-sm text-gray-600">加载历史记录...</span>
    </div>
  )
});

// Template interface matching the component
interface Template {
  id: string;
  name: string;
  previewUrl: string;
  prompt: string;
  category?: string;
}

// Generation result interface
interface GenerationResult {
  imageUrl: string;
  timestamp: number;
  template: string;
  prompt: string;
  generationId: string;
}

// Application state interface for better state management
interface AppState {
  uploadedFile: File | null;
  previewUrl: string | null;
  selectedTemplate: Template | null;
  currentPrompt: string;
  showHistory: boolean;
  isGenerating: boolean;
  lastGenerationResult: GenerationResult | null;
}

export default function Home() {
  // Consolidated state management
  const [state, setState] = useState<AppState>({
    uploadedFile: null,
    previewUrl: null,
    selectedTemplate: null,
    currentPrompt: '',
    showHistory: false,
    isGenerating: false,
    lastGenerationResult: null
  });

  // Destructure state for easier access
  const {
    uploadedFile,
    previewUrl,
    selectedTemplate,
    currentPrompt,
    showHistory,
    isGenerating,
    lastGenerationResult
  } = state;

  // Enhanced image upload handler with better state management
  const handleImageUpload = useCallback((file: File, preview: string) => {
    setState(prev => ({
      ...prev,
      uploadedFile: file,
      previewUrl: preview,
      // Reset downstream state when new image is uploaded
      selectedTemplate: null,
      currentPrompt: '',
      lastGenerationResult: null
    }));
    console.log('Image uploaded:', file.name, file.size, file.type);
  }, []);

  // Enhanced template selection with automatic prompt loading
  const handleTemplateSelect = useCallback((template: Template) => {
    setState(prev => ({
      ...prev,
      selectedTemplate: template,
      currentPrompt: template.prompt,
      // Clear previous generation result when template changes
      lastGenerationResult: null
    }));
    console.log('Template selected:', template.name, template.prompt);
  }, []);

  // Enhanced prompt change handler
  const handlePromptChange = useCallback((prompt: string) => {
    setState(prev => ({
      ...prev,
      currentPrompt: prompt
    }));
  }, []);

  // Enhanced generation complete handler with better state management
  const handleGenerationComplete = useCallback((result: GenerationResult) => {
    console.log('Generation completed:', result);
    
    setState(prev => ({
      ...prev,
      isGenerating: false,
      lastGenerationResult: result
    }));
    
    // Save to localStorage using the proper utility
    try {
      const historyItem: HistoryItem = {
        id: generateHistoryId(),
        originalImageUrl: previewUrl || '', // Use the preview URL as original image
        generatedImageUrl: result.imageUrl,
        template: result.template,
        prompt: result.prompt,
        timestamp: result.timestamp
      };
      
      saveHistoryItem(historyItem);
      console.log('History item saved:', historyItem.id);
    } catch (error) {
      console.warn('Failed to save generation history to localStorage:', error);
    }
  }, [previewUrl]);

  // Enhanced history item click handler
  const handleHistoryItemClick = useCallback((item: HistoryItem) => {
    console.log('History item clicked:', item);
    // Could implement functionality to reload the generation parameters
    // For now, just switch to generation view to show the workflow
    setState(prev => ({
      ...prev,
      showHistory: false
    }));
  }, []);

  // Navigation handlers with memoization
  const showGenerationView = useCallback(() => {
    setState(prev => ({ ...prev, showHistory: false }));
  }, []);

  const showHistoryView = useCallback(() => {
    setState(prev => ({ ...prev, showHistory: true }));
  }, []);

  // Reset workflow handler with memoization
  const resetWorkflow = useCallback(() => {
    setState(prev => ({
      ...prev,
      uploadedFile: null,
      previewUrl: null,
      selectedTemplate: null,
      currentPrompt: '',
      lastGenerationResult: null
    }));
  }, []);

  // Memoized computed values for performance
  const canSelectTemplate = useMemo(() => uploadedFile !== null, [uploadedFile]);
  const canEditPrompt = useMemo(() => canSelectTemplate && selectedTemplate !== null, [canSelectTemplate, selectedTemplate]);
  const canGenerate = useMemo(() => canEditPrompt && currentPrompt.trim().length > 0, [canEditPrompt, currentPrompt]);

  // Progress calculation with memoization
  const progress = useMemo(() => {
    if (!uploadedFile) return 0;
    if (!selectedTemplate) return 25;
    if (!currentPrompt.trim()) return 50;
    if (!lastGenerationResult) return 75;
    return 100;
  }, [uploadedFile, selectedTemplate, currentPrompt, lastGenerationResult]);

  // Memoized navigation tabs to prevent unnecessary re-renders
  const navigationTabs = useMemo(() => (
    <div className="flex justify-center mb-6 sm:mb-8">
      <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200 w-full max-w-md sm:w-auto">
        <button
          onClick={showGenerationView}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
            !showHistory
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center sm:space-x-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="hidden sm:inline">图片生成</span>
            <span className="sm:hidden">生成</span>
          </div>
        </button>
        <button
          onClick={showHistoryView}
          className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
            showHistory
              ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-center sm:space-x-2">
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">历史记录</span>
            <span className="sm:hidden">历史</span>
          </div>
        </button>
      </div>
    </div>
  ), [showHistory, showGenerationView, showHistoryView]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-4">
            Photo Butler
          </h1>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-1 sm:mb-2">
            基于豆包API的AI图片生成应用
          </p>
          <p className="text-xs sm:text-sm text-gray-500">
            上传图片 → 选择模板 → 编辑提示词 → 生成AI艺术作品
          </p>
        </div>

        {/* Progress Indicator */}
        {!showHistory && (
          <div className="max-w-2xl mx-auto mb-6 sm:mb-8">
            <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mb-2">
              <span>进度</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        {navigationTabs}
        
        {showHistory ? (
          /* History View */
          <div className="max-w-7xl mx-auto">
            <HistoryViewer onItemClick={handleHistoryItemClick} />
          </div>
        ) : (
          /* Generation Flow - Desktop: Multi-column, Mobile: Single column */
          <div className="space-y-6 sm:space-y-8">
            {/* Desktop Layout: Two-column grid for larger screens */}
            <div className="hidden lg:block">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {/* Left Column */}
                <div className="space-y-8">
                  {/* Step 1: Image Upload */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8">
                    <div className="flex items-center mb-6">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-bold mr-3">
                        1
                      </div>
                      <h2 className="text-xl lg:text-2xl font-semibold text-gray-900">上传参考图片</h2>
                      {uploadedFile && (
                        <div className="ml-auto">
                          <button
                            onClick={resetWorkflow}
                            className="text-sm text-gray-500 hover:text-gray-700 underline"
                          >
                            重新开始
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <ImageUploader
                      onImageUpload={handleImageUpload}
                      acceptedFormats={['image/jpeg', 'image/png']}
                    />
                    
                    {uploadedFile && (
                      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <p className="text-sm text-green-700 font-medium">
                            图片上传成功: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 3: Prompt Editor */}
                  <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8 transition-all duration-500 ${
                    canEditPrompt ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-4'
                  }`}>
                    <div className="flex items-center mb-6">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${
                        canEditPrompt 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-300 text-gray-500'
                      }`}>
                        3
                      </div>
                      <h2 className={`text-xl lg:text-2xl font-semibold ${
                        canEditPrompt ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        编辑提示词
                      </h2>
                    </div>
                    
                    <PromptEditor
                      initialPrompt={selectedTemplate?.prompt || ''}
                      onPromptChange={handlePromptChange}
                      selectedTemplate={selectedTemplate}
                      disabled={!canEditPrompt}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-8">
                  {/* Step 2: Template Selection */}
                  <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8 transition-all duration-500 ${
                    canSelectTemplate ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-4'
                  }`}>
                    <div className="flex items-center mb-6">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${
                        canSelectTemplate 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-300 text-gray-500'
                      }`}>
                        2
                      </div>
                      <h2 className={`text-xl lg:text-2xl font-semibold ${
                        canSelectTemplate ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        选择风格模板
                      </h2>
                    </div>
                    
                    <TemplateGallery
                      selectedTemplate={selectedTemplate}
                      onTemplateSelect={handleTemplateSelect}
                      disabled={!canSelectTemplate}
                    />
                  </div>

                  {/* Step 4: Image Generator */}
                  <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-6 lg:p-8 transition-all duration-500 ${
                    canGenerate ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-4'
                  }`}>
                    <div className="flex items-center mb-6">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold mr-3 ${
                        canGenerate 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-gray-300 text-gray-500'
                      }`}>
                        4
                      </div>
                      <h2 className={`text-xl lg:text-2xl font-semibold ${
                        canGenerate ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        生成AI图片
                      </h2>
                    </div>
                    
                    <ImageGenerator
                      referenceImage={uploadedFile}
                      prompt={currentPrompt}
                      selectedTemplate={selectedTemplate}
                      onGenerationComplete={handleGenerationComplete}
                      disabled={!canGenerate}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Layout: Single column for smaller screens */}
            <div className="lg:hidden space-y-6">
              {/* Step 1: Image Upload */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full text-sm font-bold mr-3">
                    1
                  </div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900">上传参考图片</h2>
                  {uploadedFile && (
                    <div className="ml-auto">
                      <button
                        onClick={resetWorkflow}
                        className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 underline"
                      >
                        重新开始
                      </button>
                    </div>
                  )}
                </div>
                
                <ImageUploader
                  onImageUpload={handleImageUpload}
                  acceptedFormats={['image/jpeg', 'image/png']}
                />
                
                {uploadedFile && (
                  <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <p className="text-xs sm:text-sm text-green-700 font-medium">
                        图片上传成功: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Step 2: Template Selection */}
              <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 transition-all duration-500 ${
                canSelectTemplate ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-4'
              }`}>
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-bold mr-3 ${
                    canSelectTemplate 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    2
                  </div>
                  <h2 className={`text-lg sm:text-xl font-semibold ${
                    canSelectTemplate ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    选择风格模板
                  </h2>
                </div>
                
                <TemplateGallery
                  selectedTemplate={selectedTemplate}
                  onTemplateSelect={handleTemplateSelect}
                  disabled={!canSelectTemplate}
                />
              </div>

              {/* Step 3: Prompt Editor */}
              <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 transition-all duration-500 ${
                canEditPrompt ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-4'
              }`}>
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-bold mr-3 ${
                    canEditPrompt 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    3
                  </div>
                  <h2 className={`text-lg sm:text-xl font-semibold ${
                    canEditPrompt ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    编辑提示词
                  </h2>
                </div>
                
                <PromptEditor
                  initialPrompt={selectedTemplate?.prompt || ''}
                  onPromptChange={handlePromptChange}
                  selectedTemplate={selectedTemplate}
                  disabled={!canEditPrompt}
                />
              </div>

              {/* Step 4: Image Generator */}
              <div className={`bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 transition-all duration-500 ${
                canGenerate ? 'opacity-100 transform translate-y-0' : 'opacity-50 transform translate-y-4'
              }`}>
                <div className="flex items-center mb-4 sm:mb-6">
                  <div className={`flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-sm font-bold mr-3 ${
                    canGenerate 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-300 text-gray-500'
                  }`}>
                    4
                  </div>
                  <h2 className={`text-lg sm:text-xl font-semibold ${
                    canGenerate ? 'text-gray-900' : 'text-gray-500'
                  }`}>
                    生成AI图片
                  </h2>
                </div>
                
                <ImageGenerator
                  referenceImage={uploadedFile}
                  prompt={currentPrompt}
                  selectedTemplate={selectedTemplate}
                  onGenerationComplete={handleGenerationComplete}
                  disabled={!canGenerate}
                />
              </div>
            </div>

            {/* Success Message and Next Steps */}
            {lastGenerationResult && (
              <div className="max-w-4xl mx-auto">
                <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-4 sm:p-6 lg:p-8">
                  <div className="text-center">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-500 text-white rounded-full text-lg sm:text-xl font-bold mx-auto mb-3 sm:mb-4">
                      ✓
                    </div>
                    <h3 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 mb-2">
                      图片生成完成！
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
                      您的AI艺术作品已成功生成并保存到历史记录中
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
                      <button
                        onClick={resetWorkflow}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium text-sm sm:text-base"
                      >
                        生成新图片
                      </button>
                      <button
                        onClick={showHistoryView}
                        className="px-4 sm:px-6 py-2 sm:py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                      >
                        查看历史记录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Tips */}
            <div className="max-w-4xl mx-auto">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
                <h4 className="text-base sm:text-lg font-medium text-blue-900 mb-2 sm:mb-3">💡 使用技巧</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm text-blue-800">
                  <div className="space-y-1 sm:space-y-2">
                    <p>• 选择高质量、清晰的参考图片效果更佳</p>
                    <p>• 尝试不同的模板来获得多样化的艺术风格</p>
                  </div>
                  <div className="space-y-1 sm:space-y-2">
                    <p>• 在提示词中添加具体的描述词汇</p>
                    <p>• 生成的图片会自动保存到历史记录中</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
