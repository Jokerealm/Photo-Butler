'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { SearchBarProps } from '../../types/promptTemplate';

/**
 * 提示词模板搜索栏组件
 * 支持实时搜索和搜索建议
 */
export default function SearchBar({ 
  value = '',
  onChange,
  onSearch,
  placeholder = '搜索提示词模板...', 
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // 同步外部值变化
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // 防抖搜索
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (onChange) {
        onChange(query);
      }
      if (onSearch) {
        setIsSearching(true);
        onSearch(query);
        // 模拟搜索延迟
        setTimeout(() => setIsSearching(false), 300);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onChange, onSearch]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setQuery('');
    if (onChange) {
      onChange('');
    }
    if (onSearch) {
      onSearch('');
    }
    inputRef.current?.focus();
  }, [onChange, onSearch]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    } else if (e.key === 'Enter') {
      if (onSearch) {
        onSearch(query);
      }
    }
  }, [handleClear, onSearch, query]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // 延迟隐藏建议，允许点击建议项
    setTimeout(() => setIsFocused(false), 200);
  }, []);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    if (onChange) {
      onChange(suggestion);
    }
    if (onSearch) {
      onSearch(suggestion);
    }
    setIsFocused(false);
  }, [onChange, onSearch]);

  // 搜索建议
  const suggestions = [
    '水彩风格',
    '赛博朋克',
    '油画古典',
    '动漫风格',
    '写实人像',
    '抽象艺术',
    '科幻场景',
    '自然风光'
  ];

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'transform scale-105' : ''
      }`}>
        {/* 搜索图标 */}
        <div className="absolute left-3 z-10">
          {isSearching ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
          ) : (
            <svg 
              className={`w-5 h-5 transition-colors duration-200 ${
                isFocused ? 'text-blue-500' : 'text-gray-400'
              }`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
              />
            </svg>
          )}
        </div>

        {/* 输入框 */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-2.5 sm:py-3 bg-white border-2 rounded-xl text-sm sm:text-base text-gray-900 placeholder-gray-500 transition-all duration-200 focus:outline-none touch-manipulation ${
            isFocused 
              ? 'border-blue-500 shadow-lg' 
              : 'border-gray-200 hover:border-gray-300'
          }`}
          data-testid="search-input"
        />

        {/* 清除按钮 */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 z-10 p-1.5 sm:p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 touch-manipulation"
            aria-label="清除搜索"
            data-testid="clear-button"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* 搜索建议 */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20" data-testid="search-suggestions">
          {query ? (
            <div className="p-3">
              <div className="flex items-center text-sm text-gray-600">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>搜索 &ldquo;{query}&rdquo;</span>
                {isSearching && (
                  <div className="ml-2 animate-spin rounded-full h-3 w-3 border-b border-blue-500"></div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-3">
              <div className="text-sm text-gray-500 mb-2">搜索建议</div>
              <div className="space-y-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="block w-full text-left px-3 py-2.5 sm:px-2 sm:py-1 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 touch-manipulation"
                    data-testid={`suggestion-${index}`}
                  >
                    <div className="flex items-center">
                      <svg className="w-3 h-3 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {suggestion}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}