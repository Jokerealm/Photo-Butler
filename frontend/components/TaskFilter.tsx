'use client';

import { useState, useCallback } from 'react';
import { TaskFilter, TaskStatus, TaskSortOption } from '../types';

interface TaskFilterProps {
  filter: TaskFilter;
  sortBy: TaskSortOption;
  onFilterChange: (filter: TaskFilter) => void;
  onSortChange: (sortBy: TaskSortOption) => void;
}

export default function TaskFilterComponent({
  filter,
  sortBy,
  onFilterChange,
  onSortChange,
}: TaskFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleStatusFilter = useCallback((status: TaskStatus) => {
    const currentStatuses = filter.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFilterChange({
      ...filter,
      status: newStatuses.length > 0 ? newStatuses : undefined,
    });
  }, [filter, onFilterChange]);

  const handleClearFilters = useCallback(() => {
    onFilterChange({});
  }, [onFilterChange]);

  const getStatusText = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.PENDING:
        return '等待中';
      case TaskStatus.PROCESSING:
        return '生成中';
      case TaskStatus.COMPLETED:
        return '已完成';
      case TaskStatus.FAILED:
        return '失败';
      default:
        return '未知';
    }
  };

  const getSortText = (sort: TaskSortOption) => {
    switch (sort) {
      case TaskSortOption.CREATED_DESC:
        return '最新创建';
      case TaskSortOption.CREATED_ASC:
        return '最早创建';
      case TaskSortOption.STATUS:
        return '按状态';
      case TaskSortOption.TEMPLATE:
        return '按模板';
      default:
        return '默认';
    }
  };

  const hasActiveFilters = filter.status && filter.status.length > 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Filter Toggle and Active Filters */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg border transition-colors ${
              showFilters || hasActiveFilters
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>筛选</span>
            {hasActiveFilters && (
              <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5">
                {filter.status?.length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 underline"
            >
              清除筛选
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">排序:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as TaskSortOption)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value={TaskSortOption.CREATED_DESC}>{getSortText(TaskSortOption.CREATED_DESC)}</option>
            <option value={TaskSortOption.CREATED_ASC}>{getSortText(TaskSortOption.CREATED_ASC)}</option>
            <option value={TaskSortOption.STATUS}>{getSortText(TaskSortOption.STATUS)}</option>
            <option value={TaskSortOption.TEMPLATE}>{getSortText(TaskSortOption.TEMPLATE)}</option>
          </select>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-4">
            {/* Status Filter */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">状态</h4>
              <div className="flex flex-wrap gap-2">
                {Object.values(TaskStatus).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusFilter(status)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      filter.status?.includes(status)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {getStatusText(status)}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter (placeholder for future implementation) */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">时间范围</h4>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <span>日期范围筛选功能即将推出</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}