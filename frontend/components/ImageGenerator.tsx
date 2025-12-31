'use client';

import React, { useState, useCallback } from 'react';

// Types for the component
interface Template {
  id: string;
  name: string;
  previewUrl: string;
  prompt: string;
  category?: string;
}

interface GenerationResult {
  imageUrl: string;
  timestamp: number;
  template: string;
  prompt: string;
  generationId: string;
}

interface ImageGeneratorProps {
  referenceImage: File | null;
  prompt: string;
  selectedTemplate: Template | null;
  onGenerationComplete: (result: GenerationResult) => void;
  disabled?: boolean;
}

// API response types
interface GenerateResponse {
  success: boolean;
  data?: {
    generatedImageUrl: string;
    generationId: string;
  };
  error?: string;
}

interface UploadResponse {
  success: boolean;
  data?: {
    imageId: string;
    imageUrl: string;
  };
  error?: string;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({
  referenceImage,
  prompt,
  selectedTemplate,
  onGenerationComplete,
  disabled = false
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);

  // Check if generation can be started
  const canGenerate = referenceImage && prompt.trim().length > 0 && selectedTemplate && !disabled;

  // Upload image to backend
  const uploadImage = useCallback(async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data: UploadResponse = await response.json();

      if (data.success && data.data?.imageId) {
        console.log('Image uploaded successfully:', data.data.imageId);
        return data.data.imageId;
      } else {
        throw new Error(data.error || '图片上传失败');
      }
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
    }
  }, []);

  // Call generation API
  const callGenerateAPI = useCallback(async (imageId: string, prompt: string, templateId: string): Promise<GenerateResponse> => {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageId,
        prompt,
        templateId,
      }),
    });

    const data: GenerateResponse = await response.json();
    return data;
  }, []);

  // Handle generation process
  const handleGenerate = useCallback(async () => {
    if (!canGenerate) {
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setError(null);
    setGeneratedImage(null);
    setGenerationId(null);

    try {
      console.log('Starting image generation process...');
      
      // Step 1: Upload reference image (10% progress)
      setProgress(10);
      const imageId = await uploadImage(referenceImage!);
      
      if (!imageId) {
        throw new Error('图片上传失败，无法获取图片ID');
      }

      // Step 2: Call generation API (30% progress)
      setProgress(30);
      console.log('Calling generation API...');
      
      const generateResult = await callGenerateAPI(imageId, prompt, selectedTemplate!.id);

      if (!generateResult.success) {
        throw new Error(generateResult.error || '图片生成失败');
      }

      if (!generateResult.data?.generatedImageUrl) {
        throw new Error('生成失败：未返回图片URL');
      }

      // Step 3: Generation complete (100% progress)
      setProgress(100);
      const generatedImageUrl = generateResult.data.generatedImageUrl;
      const genId = generateResult.data.generationId;
      
      setGeneratedImage(generatedImageUrl);
      setGenerationId(genId);

      console.log('Image generation completed successfully');

      // Prepare result for parent component
      const result: GenerationResult = {
        imageUrl: generatedImageUrl,
        timestamp: Date.now(),
        template: selectedTemplate!.name,
        prompt: prompt,
        generationId: genId
      };

      // Notify parent component
      onGenerationComplete(result);

    } catch (err) {
      console.error('Generation error:', err);
      const errorMessage = err instanceof Error ? err.message : '图片生成失败，请重试';
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
      setProgress(0);
    }
  }, [canGenerate, referenceImage, prompt, selectedTemplate, uploadImage, callGenerateAPI, onGenerationComplete]);

  // Cancel generation (for future implementation)
  const cancelGeneration = useCallback(() => {
    if (isGenerating) {
      setIsGenerating(false);
      setProgress(0);
      setError('生成已取消');
    }
  }, [isGenerating]);

  // Retry generation
  const retryGeneration = useCallback(() => {
    setError(null);
    handleGenerate();
  }, [handleGenerate]);

  return (
    <div className="w-full">
      <h2 className="text-2xl font-semibold mb-4">4. 生成AI图片</h2>
      
      <div className="space-y-6">
        {/* Generation Status */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">生成状态</span>
            {isGenerating && (
              <span className="text-sm text-blue-600">{progress}%</span>
            )}
          </div>
          
          {/* Progress Bar */}
          {isGenerating && (
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Status Messages */}
          <div className="space-y-2">
            {!canGenerate && (
              <div className="flex items-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">
                  {!referenceImage && '请先上传参考图片'}
                  {referenceImage && !selectedTemplate && '请选择一个模板'}
                  {referenceImage && selectedTemplate && prompt.trim().length === 0 && '请输入提示词'}
                </span>
              </div>
            )}

            {canGenerate && !isGenerating && !generatedImage && (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">准备就绪，可以开始生成</span>
              </div>
            )}

            {isGenerating && (
              <div className="flex items-center space-x-2 text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                <span className="text-sm">
                  {progress <= 10 && '正在上传参考图片...'}
                  {progress > 10 && progress <= 30 && '正在调用AI生成服务...'}
                  {progress > 30 && progress < 100 && '正在生成图片，请稍候...'}
                  {progress === 100 && '生成完成！'}
                </span>
              </div>
            )}

            {generatedImage && (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm">图片生成成功！</span>
              </div>
            )}
          </div>
        </div>

        {/* Generation Button */}
        <div className="flex justify-center">
          <button
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className={`
              px-8 py-3 rounded-lg font-medium text-lg transition-all duration-200
              ${canGenerate && !isGenerating
                ? 'bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }
            `}
          >
            {isGenerating ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>生成中...</span>
              </div>
            ) : (
              '开始生成'
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-800 mb-1">生成失败</h4>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={retryGeneration}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                >
                  重试
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Generated Image Display */}
        {generatedImage && (
          <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">生成结果</h3>
            
            <div className="space-y-4">
              {/* Generated Image */}
              <div className="flex justify-center">
                <div className="relative">
                  <img
                    src={generatedImage}
                    alt="AI生成的图片"
                    className="max-w-full max-h-96 rounded-lg shadow-md"
                    onLoad={() => console.log('Generated image loaded successfully')}
                    onError={() => setError('生成的图片加载失败')}
                  />
                </div>
              </div>

              {/* Generation Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">使用模板:</span>
                    <span className="ml-2 text-gray-600">{selectedTemplate?.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">生成时间:</span>
                    <span className="ml-2 text-gray-600">
                      {new Date().toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium text-gray-700">生成ID:</span>
                    <span className="ml-2 text-gray-600 font-mono text-xs">
                      {generationId}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">提示词:</span>
                    <span className="ml-2 text-gray-600 truncate block">
                      {prompt}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-center space-x-4 pt-4 border-t border-gray-200">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  重新生成
                </button>
                
                <a
                  href={generatedImage}
                  download={`ai-generated-${selectedTemplate?.name}-${Date.now()}.jpg`}
                  className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                >
                  下载图片
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Usage Tips */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">生成提示:</h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• 生成过程通常需要10-30秒，请耐心等待</li>
            <li>• 如果生成失败，可以尝试调整提示词后重试</li>
            <li>• 生成的图片会自动保存到历史记录中</li>
            <li>• 可以多次生成不同效果的图片</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImageGenerator;