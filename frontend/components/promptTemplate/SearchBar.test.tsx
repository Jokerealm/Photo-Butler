import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SearchBar from './SearchBar';

describe('SearchBar', () => {
  const mockOnChange = jest.fn();
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input', () => {
    render(<SearchBar onChange={mockOnChange} onSearch={mockOnSearch} />);
    
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('搜索提示词模板...')).toBeInTheDocument();
  });

  it('calls onChange when typing', async () => {
    const user = userEvent.setup();
    render(<SearchBar onChange={mockOnChange} onSearch={mockOnSearch} />);
    
    const input = screen.getByTestId('search-input');
    await user.type(input, 'test');
    
    await waitFor(() => {
      expect(mockOnChange).toHaveBeenCalledWith('test');
    });
  });

  it('shows clear button when there is text', async () => {
    const user = userEvent.setup();
    render(<SearchBar onChange={mockOnChange} onSearch={mockOnSearch} />);
    
    const input = screen.getByTestId('search-input');
    await user.type(input, 'test');
    
    expect(screen.getByTestId('clear-button')).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<SearchBar onChange={mockOnChange} onSearch={mockOnSearch} />);
    
    const input = screen.getByTestId('search-input');
    await user.type(input, 'test');
    
    const clearButton = screen.getByTestId('clear-button');
    await user.click(clearButton);
    
    expect(input).toHaveValue('');
  });

  it('shows suggestions when focused', async () => {
    const user = userEvent.setup();
    render(<SearchBar onChange={mockOnChange} onSearch={mockOnSearch} />);
    
    const input = screen.getByTestId('search-input');
    await user.click(input);
    
    expect(screen.getByTestId('search-suggestions')).toBeInTheDocument();
  });
});