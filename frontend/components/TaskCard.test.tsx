import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from './TaskCard';
import { GenerationTask, TaskStatus } from '../types';

// Mock template data
const mockTemplate = {
  id: 'template_1',
  name: '测试模板',
  description: '测试描述',
  previewUrl: '/test-preview.jpg',
  prompt: '测试提示词',
  tags: ['test'],
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock task data for different states
const createMockTask = (status: TaskStatus, progress = 0): GenerationTask => ({
  id: 'task_1',
  userId: 'user_1',
  templateId: 'template_1',
  template: mockTemplate,
  originalImageUrl: '/test-original.jpg',
  generatedImageUrl: status === TaskStatus.COMPLETED ? '/test-generated.jpg' : undefined,
  status,
  progress,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: status === TaskStatus.COMPLETED ? new Date() : undefined,
  estimatedCompletionTime: status === TaskStatus.PROCESSING ? new Date(Date.now() + 60000) : undefined
});

describe('TaskCard Real-time Status Updates', () => {
  const mockHandlers = {
    onDownload: jest.fn(),
    onRetry: jest.fn(),
    onDelete: jest.fn(),
    onRefresh: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should display processing status with progress bar', () => {
    const processingTask = createMockTask(TaskStatus.PROCESSING, 45);
    
    const { container } = render(<TaskCard task={processingTask} {...mockHandlers} />);
    
    // Check status display
    expect(screen.getByText('生成中')).toBeInTheDocument();
    expect(screen.getAllByText('45%')).toHaveLength(2); // One in progress section, one in image area
    
    // Check progress bar exists
    const progressBars = container.querySelectorAll('.bg-blue-500');
    expect(progressBars).toHaveLength(1);
    expect(progressBars[0]).toHaveStyle('width: 45%');
    
    // Check estimated completion time
    expect(screen.getByText(/预计完成:/)).toBeInTheDocument();
  });

  test('should display completed status with download button', () => {
    const completedTask = createMockTask(TaskStatus.COMPLETED, 100);
    
    render(<TaskCard task={completedTask} {...mockHandlers} />);
    
    // Check status display
    expect(screen.getByText('已完成')).toBeInTheDocument();
    
    // Check download button is present
    const downloadButton = screen.getByRole('button', { name: /下载/ });
    expect(downloadButton).toBeInTheDocument();
    
    fireEvent.click(downloadButton);
    expect(mockHandlers.onDownload).toHaveBeenCalledWith(completedTask);
  });

  test('should display failed status with retry button', () => {
    const failedTask = {
      ...createMockTask(TaskStatus.FAILED),
      errorMessage: '生成失败：网络错误'
    };
    
    render(<TaskCard task={failedTask} {...mockHandlers} />);
    
    // Check status display
    expect(screen.getByText('失败')).toBeInTheDocument();
    expect(screen.getByText('生成失败：网络错误')).toBeInTheDocument();
    
    // Check retry button is present
    const retryButton = screen.getByRole('button', { name: /重试/ });
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockHandlers.onRetry).toHaveBeenCalledWith(failedTask);
  });

  test('should display refresh button for pending/processing tasks', () => {
    const pendingTask = createMockTask(TaskStatus.PENDING);
    
    render(<TaskCard task={pendingTask} {...mockHandlers} />);
    
    // Check refresh button is present
    const refreshButton = screen.getByRole('button', { name: /刷新/ });
    expect(refreshButton).toBeInTheDocument();
    
    fireEvent.click(refreshButton);
    expect(mockHandlers.onRefresh).toHaveBeenCalledWith(pendingTask);
  });

  test('should handle processing task with no progress', () => {
    const processingTask = createMockTask(TaskStatus.PROCESSING, 0);
    
    render(<TaskCard task={processingTask} {...mockHandlers} />);
    
    // Should show initialization message
    expect(screen.getByText('初始化中...')).toBeInTheDocument();
    // The "正在计算预计完成时间..." text only shows when there's no estimatedCompletionTime
    // But our mock task has estimatedCompletionTime, so let's check for the actual displayed text
    expect(screen.getByText(/预计完成:/)).toBeInTheDocument();
  });

  test('should show calculating completion time message when no estimate available', () => {
    const processingTask = {
      ...createMockTask(TaskStatus.PROCESSING, 25),
      estimatedCompletionTime: undefined
    };
    
    render(<TaskCard task={processingTask} {...mockHandlers} />);
    
    // Should show calculating message when no estimated completion time
    expect(screen.getByText('正在计算预计完成时间...')).toBeInTheDocument();
  });

  test('should display delete button for all tasks', () => {
    const task = createMockTask(TaskStatus.COMPLETED);
    
    render(<TaskCard task={task} {...mockHandlers} />);
    
    const deleteButton = screen.getByRole('button', { name: /删除/ });
    expect(deleteButton).toBeInTheDocument();
    
    fireEvent.click(deleteButton);
    expect(mockHandlers.onDelete).toHaveBeenCalledWith(task);
  });
});