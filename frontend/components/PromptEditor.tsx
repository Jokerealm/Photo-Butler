'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';

interface PromptEditorProps {
  initialPrompt: string;
  onPromptChange: (prompt: string) => void;
  disabled?: boolean;
  selectedTemplate?: {
    id: string;
    name: string;
    prompt: string;
  } | null;
}

const PromptEditor: React.FC<PromptEditorProps> = ({
  initialPrompt,
  onPromptChange,
  disabled = false,
  selectedTemplate
}) => {
  const [prompt, setPrompt] = useState<string>(initialPrompt);
  const [charCount, setCharCount] = useState<number>(initialPrompt.length);

  // Load prompt from selected template
  useEffect(() => {
    if (selectedTemplate?.prompt) {
      const templatePrompt = selectedTemplate.prompt;
      setPrompt(templatePrompt);
      setCharCount(templatePrompt.length);
      onPromptChange(templatePrompt);
    } else if (selectedTemplate === null) {
      // Clear prompt when template is removed
      setPrompt('');
      setCharCount(0);
      onPromptChange('');
    }
  }, [selectedTemplate?.id, selectedTemplate?.prompt, onPromptChange]);

  // Update prompt when initialPrompt changes
  useEffect(() => {
    setPrompt(initialPrompt);
    setCharCount(initialPrompt.length);
  }, [initialPrompt]);

  // Handle text change with real-time updates
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = event.target.value;
    setPrompt(newPrompt);
    setCharCount(newPrompt.length);
    onPromptChange(newPrompt);
  }, [onPromptChange]);

  // Reset prompt to template default
  const resetPrompt = useCallback(() => {
    const resetValue = selectedTemplate?.prompt || '';
    setPrompt(resetValue);
    setCharCount(resetValue.length);
    onPromptChange(resetValue);
  }, [selectedTemplate, onPromptChange]);

  // Check if prompt is empty (for button state) - memoized
  const isPromptEmpty = useMemo(() => prompt.trim().length === 0, [prompt]);

  // Memoized status messages to prevent unnecessary re-renders
  const statusMessages = useMemo(() => {
    const messages = [];

    if (isPromptEmpty && !disabled) {
      messages.push(
        <div key="empty" className="flex items-center space-x-2 text-amber-600">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-xs sm:text-sm">提示词不能为空，生成按钮将被禁用</span>
        </div>
      );
    }

    if (!selectedTemplate) {
      messages.push(
        <div key="no-template" className="flex items-center space-x-2 text-gray-500">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span className="text-xs sm:text-sm">请先选择一个模板以加载默认提示词</span>
        </div>
      );
    }

    if (prompt.trim().length > 0 && !disabled) {
      messages.push(
        <div key="ready" className="flex items-center space-x-2 text-green-600">
          <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-xs sm:text-sm">提示词已准备就绪，可以开始生成图片</span>
        </div>
      );
    }

    return messages;
  }, [isPromptEmpty, disabled, selectedTemplate, prompt]);

  // Memoized usage tips to prevent unnecessary re-renders
  const usageTips = useMemo(() => (
    <div className="p-3 sm:p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h4 className="text-xs sm:text-sm font-medium text-gray-900 mb-2">提示词编辑技巧:</h4>
      <ul className="text-xs text-gray-600 space-y-1">
        <li>• 使用具体的形容词来描述想要的风格和效果</li>
        <li>• 可以添加颜色、光线、构图等细节描述</li>
        <li>• 避免使用过于复杂或矛盾的描述</li>
        <li>• 中文描述效果更佳</li>
      </ul>
    </div>
  ), []);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        {selectedTemplate && (
          <button
            onClick={resetPrompt}
            disabled={disabled}
            className={`
              px-2 py-1 sm:px-3 sm:py-1 text-xs sm:text-sm rounded-md transition-colors
              ${disabled 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
            `}
            title="重置为模板默认提示词"
          >
            重置
          </button>
        )}
      </div>

      <div className="space-y-3 sm:space-y-4">
        {/* Template Info */}
        {selectedTemplate && (
          <div className="p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-800">
              <span className="font-medium">当前模板:</span> {selectedTemplate.name}
            </p>
          </div>
        )}

        {/* Prompt Input Area */}
        <div className="relative">
          <textarea
            value={prompt}
            onChange={handleChange}
            disabled={disabled}
            placeholder={
              selectedTemplate 
                ? "编辑提示词以自定义生成效果..." 
                : "请先选择一个模板，然后编辑提示词..."
            }
            className={`
              w-full min-h-[100px] sm:min-h-[120px] p-3 sm:p-4 border rounded-lg resize-y text-sm sm:text-base
              transition-colors duration-200
              ${disabled 
                ? 'bg-gray-50 border-gray-200 text-gray-500 cursor-not-allowed' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
              }
              ${isPromptEmpty && !disabled ? 'border-red-300' : ''}
            `}
            rows={4}
            maxLength={2000}
            data-testid="prompt-editor"
          />
          
          {/* Character Count */}
          <div className="absolute bottom-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded">
            {charCount}/2000
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2">
          {statusMessages}
        </div>

        {/* Usage Tips */}
        {usageTips}
      </div>
    </div>
  );
};

export default PromptEditor;