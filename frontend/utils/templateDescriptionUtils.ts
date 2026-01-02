/**
 * Template Description Utilities
 * Helper functions for working with template descriptions in the marketplace
 */

import { Template } from '../types';
import { templateDescriptionService, EnhancedTemplate } from '../services/templateDescriptionService';

/**
 * Enhance a template with generated description metadata
 */
export function enhanceTemplateWithDescription(template: Template): EnhancedTemplate {
  const enhanced: EnhancedTemplate = {
    ...template,
    displayDescription: templateDescriptionService.getDisplayText(template),
    hasGeneratedDescription: templateDescriptionService.isDescriptionGenerated(template),
    descriptionSource: getDescriptionSource(template)
  };

  return enhanced;
}

/**
 * Enhance multiple templates with description metadata
 */
export function enhanceTemplatesWithDescriptions(templates: Template[]): EnhancedTemplate[] {
  return templates.map(enhanceTemplateWithDescription);
}

/**
 * Get the source of a template's description
 */
function getDescriptionSource(template: Template): 'manual' | 'generated' | 'prompt-based' {
  if (template.description && template.description.trim()) {
    return 'manual';
  }
  
  if (template.prompt && template.prompt.trim()) {
    return 'prompt-based';
  }
  
  return 'generated';
}

/**
 * Check if a template needs description generation
 */
export function needsDescriptionGeneration(template: Template): boolean {
  return !template.description || template.description.trim().length === 0;
}

/**
 * Batch process templates to ensure they all have descriptions
 */
export function ensureTemplateDescriptions(templates: Template[]): Template[] {
  return templates.map(template => {
    if (needsDescriptionGeneration(template)) {
      return {
        ...template,
        description: templateDescriptionService.generateDescription(template)
      };
    }
    return template;
  });
}

/**
 * Get display priority score for template (higher = better for display)
 */
export function getTemplateDisplayPriority(template: Template): number {
  let score = 0;
  
  // Has manual description
  if (template.description && template.description.trim()) {
    score += 10;
  }
  
  // Has prompt for generation
  if (template.prompt && template.prompt.trim()) {
    score += 5;
  }
  
  // Has category
  if (template.category) {
    score += 3;
  }
  
  // Has tags
  if (template.tags && template.tags.length > 0) {
    score += 2;
  }
  
  // Has preview image
  if (template.previewUrl) {
    score += 1;
  }
  
  return score;
}

/**
 * Sort templates by display quality (templates with better descriptions first)
 */
export function sortTemplatesByDisplayQuality(templates: Template[]): Template[] {
  return [...templates].sort((a, b) => {
    const scoreA = getTemplateDisplayPriority(a);
    const scoreB = getTemplateDisplayPriority(b);
    return scoreB - scoreA;
  });
}