'use client';

import { useState } from 'react';
import ImageUploader from '../components/ImageUploader';
import TemplateGallery from '../components/TemplateGallery';
import PromptEditor from '../components/PromptEditor';
import ImageGenerator from '../components/ImageGenerator';

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

export default function Home() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const [generationHistory, setGenerationHistory] = useState<GenerationResult[]>([]);

  const handleImageUpload = (file: File, preview: string) => {
    setUploadedFile(file);
    setPreviewUrl(preview);
    console.log('Image uploaded:', file.name, file.size, file.type);
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setCurrentPrompt(template.prompt); // Load template prompt
    console.log('Template selected:', template.name, template.prompt);
  };

  const handlePromptChange = (prompt: string) => {
    setCurrentPrompt(prompt);
  };

  const handleGenerationComplete = (result: GenerationResult) => {
    setGenerationHistory(prev => [result, ...prev]);
    console.log('Generation completed:', result);
    
    // Save to localStorage for persistence
    try {
      const existingHistory = localStorage.getItem('generation-history');
      const history = existingHistory ? JSON.parse(existingHistory) : [];
      const updatedHistory = [result, ...history];
      localStorage.setItem('generation-history', JSON.stringify(updatedHistory));
    } catch (error) {
      console.warn('Failed to save generation history to localStorage:', error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <main className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">
          Photo Butler - AI图片生成
        </h1>
        <p className="text-center text-gray-600 mb-8">
          欢迎使用Photo Butler，基于豆包API的AI图片生成应用
        </p>
        
        <div className="space-y-12">
          {/* Step 1: Image Upload */}
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">1. 上传参考图片</h2>
            <ImageUploader
              onImageUpload={handleImageUpload}
              acceptedFormats={['image/jpeg', 'image/png']}
            />
            
            {uploadedFile && (
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">
                  ✓ 图片上传成功: {uploadedFile.name} ({Math.round(uploadedFile.size / 1024)}KB)
                </p>
              </div>
            )}
          </div>

          {/* Step 2: Template Selection */}
          {uploadedFile && (
            <div className="max-w-6xl mx-auto">
              <TemplateGallery
                selectedTemplate={selectedTemplate}
                onTemplateSelect={handleTemplateSelect}
                disabled={!uploadedFile}
              />
            </div>
          )}

          {/* Step 3: Prompt Editor */}
          {uploadedFile && selectedTemplate && (
            <div className="max-w-4xl mx-auto">
              <PromptEditor
                initialPrompt={selectedTemplate.prompt}
                onPromptChange={handlePromptChange}
                selectedTemplate={selectedTemplate}
                disabled={false}
              />
            </div>
          )}

          {/* Step 4: Image Generator */}
          {uploadedFile && selectedTemplate && currentPrompt.trim().length > 0 && (
            <div className="max-w-4xl mx-auto">
              <ImageGenerator
                referenceImage={uploadedFile}
                prompt={currentPrompt}
                selectedTemplate={selectedTemplate}
                onGenerationComplete={handleGenerationComplete}
                disabled={false}
              />
            </div>
          )}

          {/* Generation History */}
          {generationHistory.length > 0 && (
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-semibold mb-4">生成历史</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generationHistory.slice(0, 6).map((result, index) => (
                  <div key={result.generationId} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <img
                      src={result.imageUrl}
                      alt={`生成图片 ${index + 1}`}
                      className="w-full h-48 object-cover"
                    />
                    <div className="p-4">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        模板: {result.template}
                      </p>
                      <p className="text-xs text-gray-600 mb-2">
                        {new Date(result.timestamp).toLocaleString('zh-CN')}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {result.prompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
