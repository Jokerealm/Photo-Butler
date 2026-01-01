'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useToast } from './Toast';
import { FileError, ValidationError, logError } from '../utils/errorHandler';

interface ImageUploaderProps {
  onImageUpload: (file: File, previewUrl: string) => void;
  acceptedFormats: string[];
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageUpload,
  acceptedFormats = ['image/jpeg', 'image/png']
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { error: showErrorToast } = useToast();

  const validateFile = useCallback((file: File): boolean => {
    setError(null);

    try {
      // Check file format
      if (!acceptedFormats.includes(file.type)) {
        const error = new FileError('仅支持JPG和PNG格式的图片', 'INVALID_FILE_TYPE');
        setError(error.message);
        showErrorToast('文件格式错误', error.message);
        logError(error, { fileName: file.name, fileType: file.type });
        return false;
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB in bytes
      if (file.size > maxSize) {
        const error = new FileError('文件大小不能超过10MB', 'FILE_TOO_LARGE');
        setError(error.message);
        showErrorToast('文件大小错误', error.message);
        logError(error, { fileName: file.name, fileSize: file.size });
        return false;
      }

      return true;
    } catch (error) {
      const appError = error instanceof Error ? error : new Error('文件验证失败');
      setError(appError.message);
      showErrorToast('文件验证失败', appError.message);
      logError(appError, { fileName: file.name });
      return false;
    }
  }, [acceptedFormats, showErrorToast]);

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) {
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          setPreviewUrl(result);
          onImageUpload(file, result);
          setError(null); // Clear any previous errors
        } catch (error) {
          const appError = error instanceof Error ? error : new Error('图片预览失败');
          setError(appError.message);
          showErrorToast('图片预览失败', appError.message);
          logError(appError, { fileName: file.name });
        }
      };
      
      reader.onerror = () => {
        const error = new FileError('图片读取失败', 'FILE_READ_ERROR');
        setError(error.message);
        showErrorToast('图片读取失败', error.message);
        logError(error, { fileName: file.name });
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      const appError = error instanceof Error ? error : new Error('文件处理失败');
      setError(appError.message);
      showErrorToast('文件处理失败', appError.message);
      logError(appError, { fileName: file.name });
    }
  }, [validateFile, onImageUpload, showErrorToast]);

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-4 sm:p-6 text-center cursor-pointer
          transition-colors duration-200 ease-in-out
          ${isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${error ? 'border-red-500' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFormats.join(',')}
          capture="environment" // Enable camera access on mobile
          onChange={handleFileInputChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-3 sm:space-y-4">
            <img
              src={previewUrl}
              alt="预览图"
              className="max-w-full max-h-32 sm:max-h-48 mx-auto rounded-lg shadow-md"
            />
            <p className="text-xs sm:text-sm text-gray-600">
              点击重新选择图片
            </p>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 text-gray-400">
              <svg
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <div>
              <p className="text-base sm:text-lg font-medium text-gray-900">
                上传参考图片
              </p>
              <p className="text-xs sm:text-sm text-gray-600">
                <span className="hidden sm:inline">点击选择或拖拽图片到此处</span>
                <span className="sm:hidden">点击选择图片或拍照</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                支持JPG、PNG格式，最大10MB
              </p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-xs sm:text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;