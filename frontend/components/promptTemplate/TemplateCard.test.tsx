import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateCard from './TemplateCard';
import { PromptTemplate } from '../../types/promptTemplate';

// Mock template data
const mockTemplate: PromptTemplate = {
  id: '1',
  title: '水彩风格人像',
  description: '适合创建水彩风格的人像画作',
  content: 'watercolor portrait, soft brushstrokes, artistic',
  tags: ['水彩', '人像', '艺术'],
  thumbnailPath: '/images/watercolor-portrait.jpg',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  version: 1
};

describe('TemplateCard', () => {
  const mockOnClick = jest.fn();
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders template card with all information', () => {
    render(
      <TemplateCard 
        template={mockTemplate} 
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    expect(screen.getByTestId('prompt-template-card')).toBeInTheDocument();
    expect(screen.getByTestId('template-title')).toHaveTextContent('水彩风格人像');
    expect(screen.getByTestId('template-description')).toHaveTextContent('适合创建水彩风格的人像画作');
    expect(screen.getByTestId('template-tags')).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
    
    const card = screen.getByTestId('prompt-template-card');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockTemplate);
  });

  it('displays tags correctly', () => {
    render(<TemplateCard template={mockTemplate} onClick={mockOnClick} />);
    
    expect(screen.getByText('水彩')).toBeInTheDocument();
    expect(screen.getByText('人像')).toBeInTheDocument();
    expect(screen.getByText('艺术')).toBeInTheDocument();
  });

  it('shows edit and delete buttons when handlers provided', () => {
    render(
      <TemplateCard 
        template={mockTemplate} 
        onClick={mockOnClick}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );
    
    const editButton = screen.getByLabelText('编辑模板');
    const deleteButton = screen.getByLabelText('删除模板');
    
    expect(editButton).toBeInTheDocument();
    expect(deleteButton).toBeInTheDocument();
  });
});