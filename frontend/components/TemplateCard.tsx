'use client';

import { useState } from 'react';
import { Template } from '../types';
import LazyImage from './LazyImage';

interface TemplateCardProps {
  template: Template;
  onClick: (template: Template) => void;
  className?: string;
}

export default function TemplateCard({ template, onClick, className = '' }: TemplateCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleClick = () => {
    onClick(template);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className={`group bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:border-blue-300 ${className}`}
      onClick={handleClick}
      data-testid="template-card"
    >
      {/* Template Image */}
      <div className="relative w-full bg-gray-100 overflow-hidden" style={{ aspectRatio: '340/240' }}>
        {!imageError ? (
          <LazyImage
            src={template.previewUrl}
            alt={template.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            onLoad={handleImageLoad}
            onError={handleImageError}
            data-testid="template-image"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Loading overlay */}
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Hover overlay with enhanced effects */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-end justify-center pb-4">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
            <div className="flex items-center space-x-2 text-sm font-medium text-gray-800">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>查看详情</span>
            </div>
          </div>
        </div>

        {/* Category badge */}
        {template.category && (
          <div className="absolute top-3 left-3">
            <span className="bg-blue-500/90 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full font-medium">
              {template.category}
            </span>
          </div>
        )}
      </div>

      {/* Template Info */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1 group-hover:text-blue-600 transition-colors duration-200" data-testid="template-name">
          {template.name}
        </h3>
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 leading-relaxed" data-testid="template-description">
          {template.description || template.prompt || '暂无描述'}
        </p>
        
        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100 hover:bg-blue-100 transition-colors duration-200"
              >
                {tag}
              </span>
            ))}
            {template.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-200">
                +{template.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer with creation date */}
        <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
          <div className="flex items-center">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{template.createdAt ? new Date(template.createdAt).toLocaleDateString('zh-CN') : '最近创建'}</span>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}