import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateList from './TemplateList';
import { PromptTemplate } from '../../types/promptTemplate';

// Mock template data
const mockTemplates: PromptTemplate[] = [
  {
    id: '1',
    title: '水彩风格人像',
    description: '适合创建水彩风格的人像画作',
    content: 'watercolor portrait, soft brushstrokes, artistic',
    tags: ['水彩', '人像', '艺术'],
    thumbnailPath: '/images/watercolor-portrait.jpg',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    version: 1
  },
  {
    id: '2',
    title: '赛博朋克城市',
    description: '未来主义的赛博朋克城市场景',
    content: 'cyberpunk city, neon lights, futuristic',
    tags: ['赛博朋克', '城市', '科幻'],
    thumbnailPath: '/images/cyberpunk-city.jpg',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    version: 1
  }
];

describe('TemplateList', () => {
  it('renders template list with templates', () => {
    render(<TemplateList templates={mockTemplates} />);
    
    expect(screen.getByTestId('template-list')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element?.textContent === '找到 2 个模板';
    })).toBeInTheDocument();
  });

  it('renders loading state', () => {
    render(<TemplateList templates={[]} loading={true} />);
    
    expect(screen.getByTestId('template-list-loading')).toBeInTheDocument();
    expect(screen.getByText('正在加载模板...')).toBeInTheDocument();
  });

  it('renders empty state when no templates', () => {
    render(<TemplateList templates={[]} />);
    
    expect(screen.getByTestId('template-list-empty')).toBeInTheDocument();
    expect(screen.getByText('暂无模板')).toBeInTheDocument();
  });
});