'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useTemplateStore } from '../stores/templateStore';
import { apiService } from '../services/apiService';

interface SearchBarProps {
  value?: string;
  onChange?: (query: string) => void;
  placeholder?: string;
  className?: string;
  enableServerSearch?: boolean;
}

export default function SearchBar({ 
  value,
  onChange,
  placeholder = '搜索模板...', 
  className = '',
  enableServerSearch = false
}: SearchBarProps) {
  const { searchQuery, searchTemplates, setTemplates, setLoading, setError } = useTemplateStore();
  const [query, setQuery] = useState(value || searchQuery);
  const [isFocused, setIsFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Update local state when external value changes
  useEffect(() => {
    if (value !== undefined) {
      setQuery(value);
    }
  }, [value]);

  // Debounced search with server-side support
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      if (onChange) {
        onChange(query);
      } else if (enableServerSearch && query.trim()) {
        // Server-side search
        setIsSearching(true);
        try {
          const response = await apiService.searchTemplates(query.trim());
          if (response.success) {
            setTemplates(response.data.templates);
          }
        } catch (error) {
          setError('搜索失败，请重试');
        } finally {
          setIsSearching(false);
        }
      } else {
        // Client-side search
        searchTemplates(query);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, onChange, searchTemplates, enableServerSearch, setTemplates, setError]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  }, []);

  const handleClear = useCallback(async () => {
    setQuery('');
    if (onChange) {
      onChange('');
    } else if (enableServerSearch) {
      // Reload all templates when clearing search
      setLoading(true);
      try {
        const response = await apiService.getTemplates();
        if (response.success) {
          setTemplates(response.data.templates);
        }
      } catch (error) {
        setError('加载模板失败');
      } finally {
        setLoading(false);
      }
    } else {
      searchTemplates('');
    }
    inputRef.current?.focus();
  }, [onChange, searchTemplates, enableServerSearch, setTemplates, setLoading, setError]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      handleClear();
    }
  }, [handleClear]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className={`relative flex items-center transition-all duration-200 ${
        isFocused ? 'transform scale-105' : ''
      }`}>
        {/* Search Icon */}
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

        {/* Input Field */}
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
        />

        {/* Clear Button */}
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 z-10 p-1.5 sm:p-1 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors duration-200 touch-manipulation"
            aria-label="清除搜索"
          >
            <svg className="w-4 h-4 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Search Suggestions or Status */}
      {isFocused && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
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
                {['水彩风格', '赛博朋克', '油画古典', '动漫风格'].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(suggestion)}
                    className="block w-full text-left px-3 py-2.5 sm:px-2 sm:py-1 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded transition-colors duration-150 touch-manipulation"
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