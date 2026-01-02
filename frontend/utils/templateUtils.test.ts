import { 
  createEmptyTemplate, 
  combineWithEmptyTemplate, 
  isEmptyTemplate, 
  getTemplatePrompt, 
  getTemplateSelectionMessage,
  sortTemplatesWithEmptyFirst 
} from './templateUtils';
import { Template } from '../types';

describe('templateUtils', () => {
  const mockTemplate: Template = {
    id: 'test-template',
    name: 'Test Template',
    previewUrl: 'test-url',
    prompt: 'test prompt',
    category: 'test'
  };

  describe('createEmptyTemplate', () => {
    it('should create empty template with correct properties', () => {
      const emptyTemplate = createEmptyTemplate();
      
      expect(emptyTemplate.id).toBe('empty-template');
      expect(emptyTemplate.name).toBe('默认空模板');
      expect(emptyTemplate.prompt).toBe('');
      expect(emptyTemplate.category).toBe('默认');
      expect(emptyTemplate.description).toBe('从空白开始创作，完全自定义您的艺术作品');
      expect(emptyTemplate.tags).toEqual(['自定义', '空白', '默认']);
      expect(emptyTemplate.previewUrl).toContain('data:image/svg+xml');
    });
  });

  describe('combineWithEmptyTemplate', () => {
    it('should add empty template as first item', () => {
      const templates = [mockTemplate];
      const combined = combineWithEmptyTemplate(templates);
      
      expect(combined).toHaveLength(2);
      expect(combined[0].id).toBe('empty-template');
      expect(combined[1]).toBe(mockTemplate);
    });

    it('should filter out existing empty template to avoid duplicates', () => {
      const existingEmpty = createEmptyTemplate();
      const templates = [existingEmpty, mockTemplate];
      const combined = combineWithEmptyTemplate(templates);
      
      expect(combined).toHaveLength(2);
      expect(combined[0].id).toBe('empty-template');
      expect(combined[1]).toBe(mockTemplate);
    });
  });

  describe('isEmptyTemplate', () => {
    it('should return true for empty template', () => {
      const emptyTemplate = createEmptyTemplate();
      expect(isEmptyTemplate(emptyTemplate)).toBe(true);
    });

    it('should return false for regular template', () => {
      expect(isEmptyTemplate(mockTemplate)).toBe(false);
    });
  });

  describe('getTemplatePrompt', () => {
    it('should return empty string for empty template', () => {
      const emptyTemplate = createEmptyTemplate();
      expect(getTemplatePrompt(emptyTemplate)).toBe('');
    });

    it('should return template prompt for regular template', () => {
      expect(getTemplatePrompt(mockTemplate)).toBe('test prompt');
    });
  });

  describe('getTemplateSelectionMessage', () => {
    it('should return appropriate message for empty template', () => {
      const emptyTemplate = createEmptyTemplate();
      const message = getTemplateSelectionMessage(emptyTemplate);
      expect(message).toBe('已选择: 默认空模板');
    });

    it('should return appropriate message for regular template', () => {
      const message = getTemplateSelectionMessage(mockTemplate);
      expect(message).toBe('已选择模板: Test Template');
    });
  });

  describe('sortTemplatesWithEmptyFirst', () => {
    it('should put empty template first', () => {
      const emptyTemplate = createEmptyTemplate();
      const templates = [mockTemplate, emptyTemplate];
      const sorted = sortTemplatesWithEmptyFirst(templates);
      
      expect(sorted[0]).toBe(emptyTemplate);
      expect(sorted[1]).toBe(mockTemplate);
    });

    it('should sort non-empty templates by name', () => {
      const template1: Template = { ...mockTemplate, id: 'template1', name: 'B Template' };
      const template2: Template = { ...mockTemplate, id: 'template2', name: 'A Template' };
      const emptyTemplate = createEmptyTemplate();
      
      const templates = [template1, emptyTemplate, template2];
      const sorted = sortTemplatesWithEmptyFirst(templates);
      
      expect(sorted[0]).toBe(emptyTemplate);
      expect(sorted[1].name).toBe('A Template');
      expect(sorted[2].name).toBe('B Template');
    });
  });
});