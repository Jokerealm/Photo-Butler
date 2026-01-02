'use client';

import React, { useState, useCallback } from 'react';
import { useTemplateStore } from '../stores/templateStore';
import { useUIStore } from '../stores/uiStore';
import { Template } from '../types';
import { getTemplatePrompt, getTemplateSelectionMessage } from '../utils/templateUtils';
import TemplateGallery from '../components/TemplateGallery';
import PromptEditor from '../components/PromptEditor';
import ImageUploader from '../components/ImageUploader';
import ImageGenerator from '../components/ImageGenerator';

interface GenerationResult {
  imageUrl: string;
  timestamp: number;
  template: string;
  prompt: string;
  generationId: string;
}

const CreateWorkflow: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  
  const { showToast } = useUIStore();

  // Handle template selection
  const handleTemplateSelect = useCallback((template: Template) => {
    setSelectedTemplate(template);
    
    // Use utility function to get appropriate prompt and message
    setPrompt(getTemplatePrompt(template));
    showToast(getTemplateSelectionMessage(template), 'success');
  }, [showToast]);

  // Handle prompt changes
  const handlePromptChange = useCallback((newPrompt: string) => {
    setPrompt(newPrompt);
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((file: File, previewUrl: string) => {
    setReferenceImage(file);
    showToast('参考图片上传成功', 'success');
  }, [showToast]);

  // Handle generation completion
  const handleGenerationComplete = useCallback((result: GenerationResult) => {
    setGenerationResult(result);
    showToast('图片生成完成！', 'success');
  }, [showToast]);

  // Check if we can generate
  const canGenerate = referenceImage && selectedTemplate && prompt.trim().length > 0;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI艺术创作</h1>
        <p className="text-gray-600">选择模板，上传参考图片，编辑提示词，生成您的专属艺术作品</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Template Selection and Prompt Editing */}
        <div className="space-y-8">
          {/* Step 1: Template Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-500 text-white rounded-full text-sm font-medium mr-3">
                1
              </div>
              <h2 className="text-xl font-semibold text-gray-900">选择艺术风格模板</h2>
            </div>
            
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <img 
                      src={selectedTemplate.previewUrl} 
                      alt={selectedTemplate.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div>
                      <p className="font-medium text-blue-900">{selectedTemplate.name}</p>
                      <p className="text-sm text-blue-700">已选择</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedTemplate(null)}
                    className="text-blue-600 hover:text-blue-800 text-sm underline"
                  >
                    重新选择
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                <TemplateGallery
                  onTemplateSelect={handleTemplateSelect}
                  selectedTemplate={selectedTemplate}
                  disabled={false}
                />
              </div>
            )}
          </div>

          {/* Step 2: Prompt Editing */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mr-3 ${
                selectedTemplate ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                2
              </div>
              <h2 className="text-xl font-semibold text-gray-900">编辑提示词</h2>
            </div>
            
            <PromptEditor
              initialPrompt={prompt}
              onPromptChange={handlePromptChange}
              selectedTemplate={selectedTemplate}
              disabled={!selectedTemplate}
            />
          </div>
        </div>

        {/* Right Column - Image Upload and Generation */}
        <div className="space-y-8">
          {/* Step 3: Image Upload */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mr-3 ${
                selectedTemplate ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                3
              </div>
              <h2 className="text-xl font-semibold text-gray-900">上传参考图片</h2>
            </div>
            
            <ImageUploader
              onImageUpload={handleImageUpload}
              acceptedFormats={['image/jpeg', 'image/png', 'image/webp']}
            />
            
            {referenceImage && (
              <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-sm text-green-800">
                    已上传: {referenceImage.name} ({(referenceImage.size / 1024 / 1024).toFixed(2)} MB)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Generation */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium mr-3 ${
                canGenerate ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                4
              </div>
              <h2 className="text-xl font-semibold text-gray-900">生成艺术作品</h2>
            </div>
            
            {canGenerate ? (
              <ImageGenerator
                referenceImage={referenceImage}
                prompt={prompt}
                selectedTemplate={selectedTemplate}
                onGenerationComplete={handleGenerationComplete}
              />
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-4">
                  <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">准备生成</h3>
                <p className="text-gray-600 mb-4">
                  请完成以上步骤后开始生成
                </p>
                <div className="text-sm text-gray-500 space-y-1">
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${selectedTemplate ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>选择模板</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${prompt.trim() ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>编辑提示词</span>
                  </div>
                  <div className="flex items-center justify-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${referenceImage ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    <span>上传参考图片</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generation Result */}
          {generationResult && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center mb-4">
                <div className="flex items-center justify-center w-8 h-8 bg-green-500 text-white rounded-full text-sm font-medium mr-3">
                  ✓
                </div>
                <h2 className="text-xl font-semibold text-gray-900">生成结果</h2>
              </div>
              
              <div className="space-y-4">
                <img 
                  src={generationResult.imageUrl} 
                  alt="Generated artwork"
                  className="w-full rounded-lg shadow-md"
                />
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    <p>模板: {generationResult.template}</p>
                    <p>生成时间: {new Date(generationResult.timestamp).toLocaleString()}</p>
                  </div>
                  <button
                    onClick={async () => {
                      if (!generationResult?.generationId) {
                        showToast('缺少生成ID，无法下载', 'error');
                        return;
                      }
                      
                      try {
                        showToast('开始下载图片', 'info');
                        
                        // 构建下载URL
                        const downloadUrl = `/api/download/${generationResult.generationId}?${new URLSearchParams({
                          url: generationResult.imageUrl,
                          template: generationResult.template,
                          timestamp: Date.now().toString()
                        })}`;
                        
                        // 创建隐藏的下载链接并触发下载
                        const link = document.createElement('a');
                        link.href = downloadUrl;
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        showToast('图片下载成功', 'success');
                      } catch (error) {
                        console.error('Download error:', error);
                        showToast('下载失败，请重试', 'error');
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    下载图片
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateWorkflow;