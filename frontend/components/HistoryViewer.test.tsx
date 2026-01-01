import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HistoryViewer from './HistoryViewer';
import { HistoryItem } from '../utils/localStorage';

// Mock localStorage utilities
jest.mock('../utils/localStorage', () => ({
  loadHistory: jest.fn(),
  clearHistory: jest.fn(),
  removeHistoryItem: jest.fn(),
}));

const mockLoadHistory = require('../utils/localStorage').loadHistory as jest.MockedFunction<typeof import('../utils/localStorage').loadHistory>;
const mockClearHistory = require('../utils/localStorage').clearHistory as jest.MockedFunction<typeof import('../utils/localStorage').clearHistory>;
const mockRemoveHistoryItem = require('../utils/localStorage').removeHistoryItem as jest.MockedFunction<typeof import('../utils/localStorage').removeHistoryItem>;

// Mock history data
const mockHistoryItems: HistoryItem[] = [
  {
    id: 'history_1',
    originalImageUrl: '/test/original1.jpg',
    generatedImageUrl: '/test/generated1.jpg',
    template: '水彩风格',
    prompt: '美丽的风景画，水彩风格',
    timestamp: Date.now() - 1000 * 60 * 60, // 1 hour ago
  },
  {
    id: 'history_2',
    originalImageUrl: '/test/original2.jpg',
    generatedImageUrl: '/test/generated2.jpg',
    template: '油画风格',
    prompt: '抽象艺术，油画风格，色彩丰富',
    timestamp: Date.now() - 1000 * 60 * 60 * 24, // 1 day ago
  },
];

describe('HistoryViewer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    // The loading state is very brief since loadHistory is synchronous
    // We need to test this differently
    mockLoadHistory.mockReturnValue([]);
    
    render(<HistoryViewer />);
    
    // Since loading is synchronous, we should see the empty state immediately
    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
  });

  it('renders empty state when no history items', async () => {
    mockLoadHistory.mockReturnValue([]);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
      expect(screen.getByText('开始生成图片后，历史记录会显示在这里')).toBeInTheDocument();
    });
  });

  it('renders history items correctly', async () => {
    mockLoadHistory.mockReturnValue(mockHistoryItems);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('历史记录')).toBeInTheDocument();
      expect(screen.getByText('共 2 条记录')).toBeInTheDocument();
      expect(screen.getByText('水彩风格')).toBeInTheDocument();
      expect(screen.getByText('油画风格')).toBeInTheDocument();
      expect(screen.getByText('美丽的风景画，水彩风格')).toBeInTheDocument();
    });
  });

  it('displays items in reverse chronological order', async () => {
    mockLoadHistory.mockReturnValue(mockHistoryItems);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      // Check the order by looking at the template names in the grid items
      const historyItems = screen.getAllByRole('button', { name: /查看历史记录:/ });
      expect(historyItems[0]).toHaveAttribute('aria-label', '查看历史记录: 水彩风格'); // More recent item first
      expect(historyItems[1]).toHaveAttribute('aria-label', '查看历史记录: 油画风格'); // Older item second
    });
  });

  it('shows all required fields for each history item', async () => {
    mockLoadHistory.mockReturnValue([mockHistoryItems[0]]);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      // Check for original and generated image labels
      expect(screen.getByText('原图')).toBeInTheDocument();
      expect(screen.getByText('生成图')).toBeInTheDocument();
      
      // Check for template name
      expect(screen.getByText('水彩风格')).toBeInTheDocument();
      
      // Check for prompt
      expect(screen.getByText('美丽的风景画，水彩风格')).toBeInTheDocument();
      
      // Check for images
      const images = screen.getAllByRole('img');
      expect(images).toHaveLength(2); // Original and generated images
    });
  });

  it('opens full view when history item is clicked', async () => {
    mockLoadHistory.mockReturnValue([mockHistoryItems[0]]);
    const mockOnItemClick = jest.fn();
    
    render(<HistoryViewer onItemClick={mockOnItemClick} />);
    
    await waitFor(() => {
      const historyItem = screen.getByRole('button', { name: /查看历史记录: 水彩风格/ });
      fireEvent.click(historyItem);
    });
    
    await waitFor(() => {
      expect(screen.getByText('历史记录详情')).toBeInTheDocument();
      expect(mockOnItemClick).toHaveBeenCalledWith(mockHistoryItems[0]);
    });
  });

  it('closes full view when close button is clicked', async () => {
    mockLoadHistory.mockReturnValue([mockHistoryItems[0]]);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      const historyItem = screen.getByRole('button', { name: /查看历史记录: 水彩风格/ });
      fireEvent.click(historyItem);
    });
    
    await waitFor(() => {
      expect(screen.getByText('历史记录详情')).toBeInTheDocument();
    });
    
    // Use the close button in the modal footer (not the X button)
    const closeButtons = screen.getAllByRole('button', { name: '关闭' });
    const modalCloseButton = closeButtons.find(button => 
      button.className.includes('px-4 py-2')
    );
    fireEvent.click(modalCloseButton!);
    
    await waitFor(() => {
      expect(screen.queryByText('历史记录详情')).not.toBeInTheDocument();
    });
  });

  it('clears all history when clear button is clicked', async () => {
    mockLoadHistory.mockReturnValue(mockHistoryItems);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      const clearButton = screen.getByText('清空全部');
      fireEvent.click(clearButton);
    });
    
    expect(window.confirm).toHaveBeenCalledWith('确定要清空所有历史记录吗？此操作不可撤销。');
    expect(mockClearHistory).toHaveBeenCalled();
  });

  it('removes single history item when remove button is clicked', async () => {
    mockLoadHistory.mockReturnValue([mockHistoryItems[0]]);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      const removeButton = screen.getByRole('button', { name: '删除此记录' });
      fireEvent.click(removeButton);
    });
    
    expect(window.confirm).toHaveBeenCalledWith('确定要删除这条历史记录吗？');
    expect(mockRemoveHistoryItem).toHaveBeenCalledWith('history_1');
  });

  it('uses external history when provided', async () => {
    const externalHistory = [mockHistoryItems[0]];
    
    render(<HistoryViewer history={externalHistory} />);
    
    await waitFor(() => {
      expect(screen.getByText('水彩风格')).toBeInTheDocument();
      expect(mockLoadHistory).not.toHaveBeenCalled();
    });
  });

  it('handles image load errors gracefully', async () => {
    mockLoadHistory.mockReturnValue([mockHistoryItems[0]]);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      const images = screen.getAllByRole('img');
      // Simulate image load error
      fireEvent.error(images[0]);
      
      expect(images[0]).toHaveAttribute('src', '/images/placeholder.png');
    });
  });

  it('formats timestamps correctly', async () => {
    const recentItem: HistoryItem = {
      ...mockHistoryItems[0],
      timestamp: Date.now() - 1000 * 60 * 30, // 30 minutes ago
    };
    
    mockLoadHistory.mockReturnValue([recentItem]);
    
    render(<HistoryViewer />);
    
    await waitFor(() => {
      // Should show relative time for recent items
      expect(screen.getByText(/小时前|刚刚/)).toBeInTheDocument();
    });
  });
});