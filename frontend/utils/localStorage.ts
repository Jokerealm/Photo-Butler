/**
 * localStorage utility functions for managing history records
 * Handles saving, loading, and clearing generation history
 */

export interface HistoryItem {
  id: string;                    // 唯一标识符
  originalImageUrl: string;      // 原图URL
  generatedImageUrl: string;     // 生成图URL
  template: string;              // 使用的模板名称
  prompt: string;                // 使用的提示词
  timestamp: number;             // 生成时间戳
}

const HISTORY_STORAGE_KEY = 'ai-image-generator-history';
const MAX_HISTORY_ITEMS = 100; // 限制历史记录数量以防止存储过满

/**
 * 检查localStorage是否可用
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 保存历史记录到localStorage
 * @param historyItem 要保存的历史记录项
 * @throws Error 当localStorage不可用或已满时
 */
export function saveHistoryItem(historyItem: HistoryItem): void {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage不可用，无法保存历史记录');
  }

  try {
    const existingHistory = loadHistory();
    
    // 添加新记录到数组开头（最新的在前面）
    const updatedHistory = [historyItem, ...existingHistory];
    
    // 限制历史记录数量
    const trimmedHistory = updatedHistory.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      throw new Error('存储空间已满，请清理历史记录');
    }
    throw new Error('保存历史记录失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
}

/**
 * 从localStorage读取历史记录
 * @returns 历史记录数组，按时间戳倒序排列（最新的在前面）
 */
export function loadHistory(): HistoryItem[] {
  if (!isLocalStorageAvailable()) {
    console.warn('localStorage不可用，返回空历史记录');
    return [];
  }

  try {
    const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
    
    if (!historyData) {
      return [];
    }

    const parsedHistory = JSON.parse(historyData) as HistoryItem[];
    
    // 验证数据格式并按时间戳倒序排序
    const validHistory = parsedHistory
      .filter(item => isValidHistoryItem(item))
      .sort((a, b) => b.timestamp - a.timestamp);

    return validHistory;
  } catch (error) {
    console.error('读取历史记录失败：', error);
    return [];
  }
}

/**
 * 清空所有历史记录
 * @throws Error 当localStorage不可用时
 */
export function clearHistory(): void {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage不可用，无法清空历史记录');
  }

  try {
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  } catch (error) {
    throw new Error('清空历史记录失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
}

/**
 * 删除指定的历史记录项
 * @param itemId 要删除的历史记录项ID
 */
export function removeHistoryItem(itemId: string): void {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage不可用，无法删除历史记录');
  }

  try {
    const existingHistory = loadHistory();
    const updatedHistory = existingHistory.filter(item => item.id !== itemId);
    
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    throw new Error('删除历史记录失败：' + (error instanceof Error ? error.message : '未知错误'));
  }
}

/**
 * 获取历史记录统计信息
 * @returns 包含总数和存储大小的统计信息
 */
export function getHistoryStats(): { count: number; storageSize: number } {
  if (!isLocalStorageAvailable()) {
    return { count: 0, storageSize: 0 };
  }

  try {
    const historyData = localStorage.getItem(HISTORY_STORAGE_KEY);
    const history = loadHistory();
    
    return {
      count: history.length,
      storageSize: historyData ? new Blob([historyData]).size : 0
    };
  } catch (error) {
    console.error('获取历史记录统计失败：', error);
    return { count: 0, storageSize: 0 };
  }
}

/**
 * 验证历史记录项是否有效
 * @param item 要验证的历史记录项
 * @returns 是否为有效的历史记录项
 */
function isValidHistoryItem(item: any): item is HistoryItem {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.id === 'string' &&
    typeof item.originalImageUrl === 'string' &&
    typeof item.generatedImageUrl === 'string' &&
    typeof item.template === 'string' &&
    typeof item.prompt === 'string' &&
    typeof item.timestamp === 'number' &&
    item.id.length > 0 &&
    item.originalImageUrl.length > 0 &&
    item.generatedImageUrl.length > 0 &&
    item.template.length > 0 &&
    item.prompt.length > 0 &&
    item.timestamp > 0
  );
}

/**
 * 生成唯一的历史记录ID
 * @returns 唯一标识符字符串
 */
export function generateHistoryId(): string {
  return `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}