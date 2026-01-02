import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import TagFilter from './TagFilter';

const mockAvailableTags = ['水彩', '人像', '艺术', '赛博朋克', '城市', '科幻', '油画', '古典'];
const mockSelectedTags = ['水彩', '人像'];

describe('TagFilter', () => {
  const mockOnTagToggle = jest.fn();
  const mockOnClearAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders tag filter with available tags', () => {
    render(
      <TagFilter
        availableTags={mockAvailableTags}
        selectedTags={[]}
        onTagToggle={mockOnTagToggle}
        onClearAll={mockOnClearAll}
      />
    );
    
    expect(screen.getByTestId('tag-filter')).toBeInTheDocument();
    expect(screen.getByText('标签筛选')).toBeInTheDocument();
  });

  it('shows selected tags separately', () => {
    render(
      <TagFilter
        availableTags={mockAvailableTags}
        selectedTags={mockSelectedTags}
        onTagToggle={mockOnTagToggle}
        onClearAll={mockOnClearAll}
      />
    );
    
    expect(screen.getByText('已选择')).toBeInTheDocument();
    expect(screen.getByTestId('selected-tag-水彩')).toBeInTheDocument();
    expect(screen.getByTestId('selected-tag-人像')).toBeInTheDocument();
  });

  it('calls onTagToggle when tag is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TagFilter
        availableTags={mockAvailableTags}
        selectedTags={[]}
        onTagToggle={mockOnTagToggle}
        onClearAll={mockOnClearAll}
      />
    );
    
    const tag = screen.getByTestId('available-tag-水彩');
    await user.click(tag);
    
    expect(mockOnTagToggle).toHaveBeenCalledWith('水彩');
  });

  it('shows clear all button when tags are selected', () => {
    render(
      <TagFilter
        availableTags={mockAvailableTags}
        selectedTags={mockSelectedTags}
        onTagToggle={mockOnTagToggle}
        onClearAll={mockOnClearAll}
      />
    );
    
    expect(screen.getByTestId('clear-all-button')).toBeInTheDocument();
  });

  it('calls onClearAll when clear all button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <TagFilter
        availableTags={mockAvailableTags}
        selectedTags={mockSelectedTags}
        onTagToggle={mockOnTagToggle}
        onClearAll={mockOnClearAll}
      />
    );
    
    const clearButton = screen.getByTestId('clear-all-button');
    await user.click(clearButton);
    
    expect(mockOnClearAll).toHaveBeenCalled();
  });

  it('does not render when no available tags', () => {
    const { container } = render(
      <TagFilter
        availableTags={[]}
        selectedTags={[]}
        onTagToggle={mockOnTagToggle}
        onClearAll={mockOnClearAll}
      />
    );
    
    expect(container.firstChild).toBeNull();
  });
});