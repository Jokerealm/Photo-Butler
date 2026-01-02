/**
 * Template Description Service Tests
 */

import { templateDescriptionService, generateTemplateDescription, getTemplateDisplayText } from './templateDescriptionService';
import { Template } from '../types';

describe('TemplateDescriptionService', () => {
  describe('generateDescription', () => {
    it('should return existing description if available', () => {
      const template: Template = {
        id: '1',
        name: 'Test Template',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        description: 'Existing description'
      };

      const result = templateDescriptionService.generateDescription(template);
      expect(result).toBe('Existing description');
    });

    it('should generate description from prompt when no description exists', () => {
      const template: Template = {
        id: '1',
        name: 'Test Template',
        previewUrl: '/test.jpg',
        prompt: '人像摄影，日常快照风格'
      };

      const result = templateDescriptionService.generateDescription(template);
      expect(result).toBe('人像摄影、日常快照风格');
    });

    it('should generate description from metadata when no prompt or description', () => {
      const template: Template = {
        id: '1',
        name: 'Modern Art',
        previewUrl: '/test.jpg',
        prompt: '',
        category: '现代艺术'
      };

      const result = templateDescriptionService.generateDescription(template);
      expect(result).toBe('现代艺术风格');
    });

    it('should fallback to default when no useful information available', () => {
      const template: Template = {
        id: '1',
        name: '',
        previewUrl: '/test.jpg',
        prompt: ''
      };

      const result = templateDescriptionService.generateDescription(template);
      expect(result).toBe('艺术图像生成');
    });
  });

  describe('getDisplayText', () => {
    it('should prioritize existing description', () => {
      const template: Template = {
        id: '1',
        name: 'Test',
        previewUrl: '/test.jpg',
        prompt: 'test prompt',
        description: 'Manual description'
      };

      const result = templateDescriptionService.getDisplayText(template);
      expect(result).toBe('Manual description');
    });

    it('should generate from prompt when no description', () => {
      const template: Template = {
        id: '1',
        name: 'Test',
        previewUrl: '/test.jpg',
        prompt: '现代艺术风格，抽象表现'
      };

      const result = templateDescriptionService.getDisplayText(template);
      expect(result).toBe('抽象风格，现代艺术风格、抽象表现');
    });
  });

  describe('isDescriptionGenerated', () => {
    it('should return false when template has description', () => {
      const template: Template = {
        id: '1',
        name: 'Test',
        previewUrl: '/test.jpg',
        prompt: 'test',
        description: 'Has description'
      };

      const result = templateDescriptionService.isDescriptionGenerated(template);
      expect(result).toBe(false);
    });

    it('should return true when template has no description but has prompt', () => {
      const template: Template = {
        id: '1',
        name: 'Test',
        previewUrl: '/test.jpg',
        prompt: 'test prompt'
      };

      const result = templateDescriptionService.isDescriptionGenerated(template);
      expect(result).toBe(true);
    });
  });

  describe('utility functions', () => {
    it('generateTemplateDescription should work', () => {
      const template: Template = {
        id: '1',
        name: 'Test',
        previewUrl: '/test.jpg',
        prompt: '人像摄影，日常快照风格，高质量'
      };

      const result = generateTemplateDescription(template);
      expect(result).toBe('人像摄影、日常快照风格');
    });

    it('getTemplateDisplayText should work', () => {
      const template: Template = {
        id: '1',
        name: 'Test',
        previewUrl: '/test.jpg',
        prompt: '风景摄影，自然光线，美丽景色'
      };

      const result = getTemplateDisplayText(template);
      expect(result).toBe('风景，风景摄影、自然光线');
    });
  });
});