import { Template } from '../types';

// Simple SVG data URL for empty template placeholder
const EMPTY_TEMPLATE_PLACEHOLDER = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
<svg width="340" height="240" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
      <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#f9fafb"/>
  <rect width="100%" height="100%" fill="url(#grid)"/>
  <circle cx="170" cy="120" r="40" fill="#dbeafe" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5"/>
  <text x="170" y="125" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#3b82f6">空白画布</text>
</svg>
`);

/**
 * Creates the default empty template that should be available across all pages
 */
export const createEmptyTemplate = (): Template => ({
  id: 'empty-template',
  name: '默认空模板',
  previewUrl: EMPTY_TEMPLATE_PLACEHOLDER,
  prompt: '',
  category: '默认',
  description: '从空白开始创作，完全自定义您的艺术作品',
  tags: ['自定义', '空白', '默认'],
  createdAt: new Date(),
  updatedAt: new Date()
});

/**
 * Combines the empty template with fetched templates, ensuring empty template is first
 */
export const combineWithEmptyTemplate = (templates: Template[]): Template[] => {
  const emptyTemplate = createEmptyTemplate();
  
  // Filter out any existing empty template to avoid duplicates
  const filteredTemplates = templates.filter(t => t.id !== 'empty-template');
  
  return [emptyTemplate, ...filteredTemplates];
};

/**
 * Checks if a template is the empty template
 */
export const isEmptyTemplate = (template: Template): boolean => {
  return template.id === 'empty-template';
};

/**
 * Gets the appropriate prompt for a template selection
 * Returns empty string for empty template, template prompt for others
 */
export const getTemplatePrompt = (template: Template): string => {
  return isEmptyTemplate(template) ? '' : template.prompt;
};

/**
 * Gets the appropriate success message for template selection
 */
export const getTemplateSelectionMessage = (template: Template): string => {
  return isEmptyTemplate(template) 
    ? `已选择: ${template.name}` 
    : `已选择模板: ${template.name}`;
};

/**
 * Sorts templates with empty template first, then by name
 */
export const sortTemplatesWithEmptyFirst = (templates: Template[]): Template[] => {
  return templates.sort((a, b) => {
    // Empty template always comes first
    if (isEmptyTemplate(a)) return -1;
    if (isEmptyTemplate(b)) return 1;
    
    // Sort others by name
    return a.name.localeCompare(b.name, 'zh-CN');
  });
};