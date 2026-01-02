'use client';

import { useState, useCallback } from 'react';
import { TagFilterProps } from '../../types/promptTemplate';

/**
 * 提示词模板标签筛选组件
 * 支持多选标签筛选和快速清除
 */
export default function TagFilter({ 
  availableTags,
  selectedTags,
  onTagToggle,
  onClearAll,
  className = ''
}: TagFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // 过滤标签
  const filteredTags = availableTags.filter(tag =>
    tag.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 显示的标签数量限制
  const displayLimit = isExpanded ? filteredTags.length : 8;
  const displayTags = filteredTags.slice(0, displayLimit);
  const hasMoreTags = filteredTags.length > displayLimit;

  const handleTagClick = useCallback((tag: string) => {
    onTagToggle(tag);
  }, [onTagToggle]);

  const handleClearAll = useCallback(() => {
    onClearAll();
  }, [onClearAll]);

  const handleToggleExpanded = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`} data-testid="tag-filter">
      {/* 标题和清除按钮 */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">
          标签筛选
          {selectedTags.length > 0 && (
            <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              {selectedTags.length}
            </span>
          )}
        </h3>
        {selectedTags.length > 0 && (
          <button
            onClick={handleClearAll}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
            data-testid="clear-all-button"
          >
            清除全部
          </button>
        )}
      </div>

      {/* 标签搜索 */}
      {availableTags.length > 10 && (
        <div className="relative mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="搜索标签..."
            className="w-full pl-8 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 transition-colors duration-200"
            data-testid="tag-search-input"
          />
          <svg 
            className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2.5 top-2.5 p-0.5 rounded-full hover:bg-gray-100 transition-colors duration-200"
              aria-label="清除搜索"
            >
              <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      )}

      {/* 标签列表 */}
      <div className="space-y-2">
        {/* 已选择的标签 */}
        {selectedTags.length > 0 && (
          <div className="pb-2 border-b border-gray-100">
            <div className="text-xs text-gray-500 mb-2">已选择</div>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-sm rounded-full hover:bg-blue-600 transition-colors duration-200"
                  data-testid={`selected-tag-${tag}`}
                >
                  <span>{tag}</span>
                  <svg className="ml-1.5 w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 可选择的标签 */}
        <div>
          {selectedTags.length > 0 && (
            <div className="text-xs text-gray-500 mb-2">可选择</div>
          )}
          <div className="flex flex-wrap gap-2">
            {displayTags
              .filter(tag => !selectedTags.includes(tag))
              .map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors duration-200"
                  data-testid={`available-tag-${tag}`}
                >
                  {tag}
                </button>
              ))}
          </div>
        </div>

        {/* 展开/收起按钮 */}
        {hasMoreTags && (
          <div className="pt-2">
            <button
              onClick={handleToggleExpanded}
              className="flex items-center text-sm text-blue-500 hover:text-blue-600 transition-colors duration-200"
              data-testid="toggle-expand-button"
            >
              <span>{isExpanded ? '收起' : `显示更多 (+${filteredTags.length - displayLimit})`}</span>
              <svg 
                className={`ml-1 w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 无结果提示 */}
      {searchQuery && filteredTags.length === 0 && (
        <div className="text-center py-4 text-sm text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <div>未找到匹配的标签</div>
          <button
            onClick={handleClearSearch}
            className="mt-1 text-blue-500 hover:text-blue-600 transition-colors duration-200"
          >
            清除搜索
          </button>
        </div>
      )}

      {/* 统计信息 */}
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        共 {availableTags.length} 个标签
        {searchQuery && ` · 找到 ${filteredTags.length} 个匹配`}
        {selectedTags.length > 0 && ` · 已选择 ${selectedTags.length} 个`}
      </div>
    </div>
  );
}