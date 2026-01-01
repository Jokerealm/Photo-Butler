import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PromptEditor from './PromptEditor';

describe('PromptEditor', () => {
  const mockOnPromptChange = jest.fn();
  const defaultProps = {
    initialPrompt: '',
    onPromptChange: mockOnPromptChange,
  };

  const mockTemplate = {
    id: 'template-1',
    name: '水彩风格',
    prompt: '水彩画风格，柔和的色彩，艺术感',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('基础结构 (Basic Structure)', () => {
    it('should render component with title', () => {
      render(<PromptEditor {...defaultProps} />);
      
      expect(screen.getByText('提示词编辑技巧:')).toBeInTheDocument();
    });

    it('should render textarea with placeholder when no template selected', () => {
      render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByPlaceholderText('请先选择一个模板，然后编辑提示词...');
      expect(textarea).toBeInTheDocument();
    });

    it('should render textarea with different placeholder when template selected', () => {
      render(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      const textarea = screen.getByPlaceholderText('编辑提示词以自定义生成效果...');
      expect(textarea).toBeInTheDocument();
    });
  });

  describe('提示词加载功能 (Prompt Loading Functionality)', () => {
    it('should load prompt from selected template', async () => {
      const { rerender } = render(<PromptEditor {...defaultProps} />);
      
      // Initially no template
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
      
      // Add template
      rerender(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      await waitFor(() => {
        expect(textarea.value).toBe(mockTemplate.prompt);
      });
      
      expect(mockOnPromptChange).toHaveBeenCalledWith(mockTemplate.prompt);
    });

    it('should display template info when template is selected', () => {
      render(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      expect(screen.getByText('当前模板:')).toBeInTheDocument();
      expect(screen.getByText(mockTemplate.name)).toBeInTheDocument();
    });

    it('should show reset button when template is selected', () => {
      render(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      const resetButton = screen.getByText('重置');
      expect(resetButton).toBeInTheDocument();
    });

    it('should not show reset button when no template is selected', () => {
      render(<PromptEditor {...defaultProps} />);
      
      expect(screen.queryByText('重置')).not.toBeInTheDocument();
    });
  });

  describe('提示词编辑功能 (Prompt Editing Functionality)', () => {
    it('should allow text editing', async () => {
      const user = userEvent.setup();
      render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const testText = '测试提示词内容';
      
      await user.type(textarea, testText);
      
      expect(textarea.value).toBe(testText);
      expect(mockOnPromptChange).toHaveBeenCalledWith(testText);
    });

    it('should update character count in real-time', async () => {
      const user = userEvent.setup();
      render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      const testText = '测试';
      
      await user.type(textarea, testText);
      
      expect(screen.getByText('2/2000')).toBeInTheDocument();
    });

    it('should handle initial prompt correctly', () => {
      const initialPrompt = '初始提示词';
      render(<PromptEditor {...defaultProps} initialPrompt={initialPrompt} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe(initialPrompt);
      expect(screen.getByText(`${initialPrompt.length}/2000`)).toBeInTheDocument();
    });

    it('should call onPromptChange on every text change', async () => {
      const user = userEvent.setup();
      render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      await user.type(textarea, 'a');
      expect(mockOnPromptChange).toHaveBeenCalledWith('a');
      
      await user.type(textarea, 'b');
      expect(mockOnPromptChange).toHaveBeenCalledWith('ab');
    });
  });

  describe('重置功能 (Reset Functionality)', () => {
    it('should reset prompt to template default when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // First, modify the prompt
      await user.clear(textarea);
      await user.type(textarea, '修改后的提示词');
      
      expect(textarea.value).toBe('修改后的提示词');
      
      // Then reset
      const resetButton = screen.getByText('重置');
      await user.click(resetButton);
      
      await waitFor(() => {
        expect(textarea.value).toBe(mockTemplate.prompt);
      });
      
      expect(mockOnPromptChange).toHaveBeenCalledWith(mockTemplate.prompt);
    });

    it('should reset to empty string when no template is selected', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      // First, modify the prompt
      await user.clear(textarea);
      await user.type(textarea, '修改后的提示词');
      
      // Remove template
      rerender(<PromptEditor {...defaultProps} selectedTemplate={null} />);
      
      // Reset button should not be visible
      expect(screen.queryByText('重置')).not.toBeInTheDocument();
    });
  });

  describe('状态指示 (Status Indicators)', () => {
    it('should show warning when prompt is empty', () => {
      render(<PromptEditor {...defaultProps} />);
      
      expect(screen.getByText('提示词不能为空，生成按钮将被禁用')).toBeInTheDocument();
    });

    it('should show ready status when prompt has content', async () => {
      const user = userEvent.setup();
      render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      await user.type(textarea, '有效的提示词');
      
      await waitFor(() => {
        expect(screen.getByText('提示词已准备就绪，可以开始生成图片')).toBeInTheDocument();
      });
    });

    it('should show template selection hint when no template is selected', () => {
      render(<PromptEditor {...defaultProps} />);
      
      expect(screen.getByText('请先选择一个模板以加载默认提示词')).toBeInTheDocument();
    });

    it('should not show template selection hint when template is selected', () => {
      render(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      expect(screen.queryByText('请先选择一个模板以加载默认提示词')).not.toBeInTheDocument();
    });
  });

  describe('禁用状态 (Disabled State)', () => {
    it('should disable textarea when disabled prop is true', () => {
      render(<PromptEditor {...defaultProps} disabled={true} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toBeDisabled();
    });

    it('should disable reset button when disabled prop is true', () => {
      render(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} disabled={true} />);
      
      const resetButton = screen.getByText('重置');
      expect(resetButton).toBeDisabled();
    });

    it('should not show status messages when disabled', () => {
      render(<PromptEditor {...defaultProps} disabled={true} />);
      
      expect(screen.queryByText('提示词不能为空，生成按钮将被禁用')).not.toBeInTheDocument();
      expect(screen.queryByText('提示词已准备就绪，可以开始生成图片')).not.toBeInTheDocument();
    });
  });

  describe('字符计数 (Character Count)', () => {
    it('should display initial character count', () => {
      const initialPrompt = '测试提示词';
      render(<PromptEditor {...defaultProps} initialPrompt={initialPrompt} />);
      
      expect(screen.getByText(`${initialPrompt.length}/2000`)).toBeInTheDocument();
    });

    it('should update character count when typing', async () => {
      const user = userEvent.setup();
      render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      
      await user.type(textarea, '测试');
      
      expect(screen.getByText('2/2000')).toBeInTheDocument();
    });

    it('should respect maxLength attribute', () => {
      render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea).toHaveAttribute('maxLength', '2000');
    });
  });

  describe('使用技巧 (Usage Tips)', () => {
    it('should display usage tips section', () => {
      render(<PromptEditor {...defaultProps} />);
      
      expect(screen.getByText('提示词编辑技巧:')).toBeInTheDocument();
      expect(screen.getByText('• 使用具体的形容词来描述想要的风格和效果')).toBeInTheDocument();
      expect(screen.getByText('• 可以添加颜色、光线、构图等细节描述')).toBeInTheDocument();
      expect(screen.getByText('• 避免使用过于复杂或矛盾的描述')).toBeInTheDocument();
      expect(screen.getByText('• 中文描述效果更佳')).toBeInTheDocument();
    });
  });

  describe('模板变更处理 (Template Change Handling)', () => {
    it('should update prompt when template changes', async () => {
      const { rerender } = render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
      
      // Change to a template
      rerender(<PromptEditor {...defaultProps} selectedTemplate={mockTemplate} />);
      
      await waitFor(() => {
        expect(textarea.value).toBe(mockTemplate.prompt);
      });
      
      expect(mockOnPromptChange).toHaveBeenCalledWith(mockTemplate.prompt);
    });

    it('should handle template change to different template', async () => {
      const template1 = { id: '1', name: '模板1', prompt: '提示词1' };
      const template2 = { id: '2', name: '模板2', prompt: '提示词2' };
      
      const { rerender } = render(<PromptEditor {...defaultProps} />);
      
      const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
      expect(textarea.value).toBe('');
      
      // Change to first template
      rerender(<PromptEditor {...defaultProps} selectedTemplate={template1} />);
      
      await waitFor(() => {
        expect(textarea.value).toBe(template1.prompt);
      });
      
      // Change to different template
      rerender(<PromptEditor {...defaultProps} selectedTemplate={template2} />);
      
      await waitFor(() => {
        expect(textarea.value).toBe(template2.prompt);
      });
      
      expect(mockOnPromptChange).toHaveBeenCalledWith(template2.prompt);
    });
  });
});