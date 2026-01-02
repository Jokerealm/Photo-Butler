/**
 * Template Description Service
 * Handles generation and management of user-friendly template descriptions
 */

import { Template } from '../types';

export interface TemplateDescriptionService {
  generateDescription(template: Template): string;
  getDisplayText(template: Template): string;
  isDescriptionGenerated(template: Template): boolean;
}

/**
 * Enhanced Template interface with description metadata
 */
export interface EnhancedTemplate extends Template {
  displayDescription?: string;
  hasGeneratedDescription?: boolean;
  descriptionSource?: 'manual' | 'generated' | 'prompt-based';
}

class TemplateDescriptionServiceImpl implements TemplateDescriptionService {
  
  /**
   * Generate a user-friendly description from template content
   */
  generateDescription(template: Template): string {
    // If template already has a description, use it
    if (template.description && template.description.trim()) {
      return template.description.trim();
    }

    // Generate description from prompt content
    if (template.prompt && template.prompt.trim()) {
      return this.generateFromPrompt(template.prompt);
    }

    // Fallback based on template name and category
    return this.generateFromMetadata(template);
  }

  /**
   * Get the display text for a template, prioritizing descriptions over prompts
   */
  getDisplayText(template: Template): string {
    // First priority: existing description
    if (template.description && template.description.trim()) {
      return template.description.trim();
    }

    // Second priority: generate from prompt
    if (template.prompt && template.prompt.trim()) {
      return this.generateFromPrompt(template.prompt);
    }

    // Third priority: generate from metadata
    return this.generateFromMetadata(template);
  }

  /**
   * Check if the template description was auto-generated
   */
  isDescriptionGenerated(template: Template): boolean {
    // If template has no description but has a prompt, it would be generated
    return !template.description && !!template.prompt;
  }

  /**
   * Generate description from prompt content
   */
  private generateFromPrompt(prompt: string): string {
    const cleanPrompt = prompt.trim();
    
    // Handle empty or very short prompts
    if (cleanPrompt.length < 10) {
      return '简约风格图像生成';
    }

    // Extract key descriptive elements from prompt
    const keywords = this.extractKeywords(cleanPrompt);
    const style = this.extractStyle(cleanPrompt);
    const subject = this.extractSubject(cleanPrompt);

    // Build description based on extracted elements
    let description = '';

    if (subject) {
      description += subject;
    }

    if (style) {
      description += (description ? '，' : '') + style + '风格';
    }

    if (keywords.length > 0 && !description.includes(keywords[0])) {
      const keywordText = keywords.slice(0, 2).join('、');
      description += (description ? '，' : '') + keywordText;
    }

    // Ensure description is not too long
    if (description.length > 50) {
      description = description.substring(0, 47) + '...';
    }

    return description || '创意图像生成';
  }

  /**
   * Generate description from template metadata
   */
  private generateFromMetadata(template: Template): string {
    let description = '';

    // Use category if available
    if (template.category) {
      description = `${template.category}风格`;
    }

    // Use template name as fallback
    if (!description && template.name) {
      // Clean up template name for description
      const cleanName = template.name
        .replace(/模板|template/gi, '')
        .replace(/\d+/g, '')
        .trim();
      
      if (cleanName) {
        description = `${cleanName}风格图像`;
      }
    }

    return description || '艺术图像生成';
  }

  /**
   * Extract style keywords from prompt
   */
  private extractStyle(prompt: string): string {
    const styleKeywords = [
      '写实', '卡通', '动漫', '油画', '水彩', '素描', '抽象',
      '现代', '古典', '复古', '未来', '科幻', '奇幻',
      '简约', '华丽', '优雅', '可爱', '酷炫', '温馨',
      'realistic', 'cartoon', 'anime', 'oil painting', 'watercolor',
      'sketch', 'abstract', 'modern', 'classical', 'vintage',
      'futuristic', 'sci-fi', 'fantasy', 'minimalist', 'elegant'
    ];

    const lowerPrompt = prompt.toLowerCase();
    
    for (const style of styleKeywords) {
      if (lowerPrompt.includes(style.toLowerCase())) {
        return style;
      }
    }

    return '';
  }

  /**
   * Extract subject keywords from prompt
   */
  private extractSubject(prompt: string): string {
    const subjectKeywords = [
      '人物', '风景', '动物', '建筑', '花卉', '食物', '车辆',
      '肖像', '全身', '半身', '特写', '远景',
      'portrait', 'landscape', 'animal', 'architecture', 'flower',
      'food', 'vehicle', 'person', 'character', 'nature'
    ];

    const lowerPrompt = prompt.toLowerCase();
    
    for (const subject of subjectKeywords) {
      if (lowerPrompt.includes(subject.toLowerCase())) {
        return subject;
      }
    }

    return '';
  }

  /**
   * Extract important keywords from prompt
   */
  private extractKeywords(prompt: string): string[] {
    // Remove common prompt modifiers and technical terms
    const stopWords = [
      'high quality', 'detailed', 'masterpiece', 'best quality',
      '高质量', '详细', '杰作', '最佳质量', '精美', '精致',
      'ultra', 'super', 'hyper', 'extremely', 'very',
      '超', '非常', '极其', '特别', '格外'
    ];

    let cleanPrompt = prompt.toLowerCase();
    
    // Remove stop words
    stopWords.forEach(word => {
      cleanPrompt = cleanPrompt.replace(new RegExp(word, 'gi'), '');
    });

    // Extract meaningful words (longer than 2 characters)
    const words = cleanPrompt
      .split(/[,，\s]+/)
      .map(word => word.trim())
      .filter(word => word.length > 2)
      .slice(0, 5); // Limit to first 5 meaningful words

    return words;
  }
}

// Export singleton instance
export const templateDescriptionService = new TemplateDescriptionServiceImpl();

// Export utility functions for direct use
export const generateTemplateDescription = (template: Template): string => {
  return templateDescriptionService.generateDescription(template);
};

export const getTemplateDisplayText = (template: Template): string => {
  return templateDescriptionService.getDisplayText(template);
};

export const isTemplateDescriptionGenerated = (template: Template): boolean => {
  return templateDescriptionService.isDescriptionGenerated(template);
};