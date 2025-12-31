import React from 'react';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import TemplateGallery from './TemplateGallery';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Template interface for property testing
interface Template {
  id: string;
  name: string;
  previewUrl: string;
  prompt: string;
  category?: string;
}

// Simple generator for template objects with unique identifiers
const templateArbitrary = fc.integer({ min: 0, max: 100 }).map(n => ({
  id: `template_${n}`,
  name: `Template ${n}`,
  previewUrl: `http://example.com/template_${n}.jpg`,
  prompt: `Prompt for template ${n}`,
  category: n % 2 === 0 ? `Category ${Math.floor(n / 2)}` : undefined
}));

// Generator for template arrays (small arrays to avoid timeout issues)
const templatesArrayArbitrary = fc.array(templateArbitrary, { minLength: 1, maxLength: 3 })
  .map(templates => {
    // Ensure unique templates by index
    return templates.map((_, index) => ({
      id: `template_${index}`,
      name: `Template ${index}`,
      previewUrl: `http://example.com/template_${index}.jpg`,
      prompt: `Prompt for template ${index}`,
      category: index % 2 === 0 ? `Category ${Math.floor(index / 2)}` : undefined
    }));
  });

describe('TemplateGallery Property Tests', () => {
  const mockOnTemplateSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    cleanup();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Feature: ai-image-generator, Property 4: 模板显示完整性**
   * **Validates: Requirements 2.3**
   * 
   * For any displayed template, the system should show both template name and preview image
   */
  it('Property 4: Template Display Completeness - all templates should display name and preview image', async () => {
    await fc.assert(
      fc.asyncProperty(templatesArrayArbitrary, async (templates) => {
        // Setup mock API response
        const mockApiResponse = {
          success: true,
          data: { templates }
        };
        
        mockFetch.mockResolvedValue({
          json: () => Promise.resolve(mockApiResponse)
        });

        // Render component
        const { unmount } = render(
          <TemplateGallery
            selectedTemplate={null}
            onTemplateSelect={mockOnTemplateSelect}
            disabled={false}
          />
        );

        try {
          // Wait for templates to load
          await waitFor(() => {
            expect(screen.queryByText('加载模板中...')).not.toBeInTheDocument();
          }, { timeout: 2000 });

          // Verify each template displays both name and preview image
          for (const template of templates) {
            // Check template name is displayed
            const nameElement = screen.getByText(template.name);
            expect(nameElement).toBeInTheDocument();

            // Check preview image is displayed with correct src
            const imageElement = screen.getByAltText(`${template.name} 预览`);
            expect(imageElement).toBeInTheDocument();
            expect(imageElement).toHaveAttribute('src', template.previewUrl);
          }

          return true;
        } finally {
          unmount();
        }
      }),
      { numRuns: 10, timeout: 3000 }
    );
  }, 10000);

  /**
   * **Feature: ai-image-generator, Property 5: 模板选择高亮**
   * **Validates: Requirements 2.4**
   * 
   * For any template clicked by user, the system should highlight that template and mark it as selected
   */
  it('Property 5: Template Selection Highlighting - selected template should be highlighted', async () => {
    await fc.assert(
      fc.asyncProperty(
        templatesArrayArbitrary,
        fc.integer({ min: 0 }),
        async (templates, indexSeed) => {
          // Ensure we have a valid index
          if (templates.length === 0) return true;
          
          const selectedIndex = indexSeed % templates.length;
          const selectedTemplate = templates[selectedIndex];

          // Setup mock API response
          const mockApiResponse = {
            success: true,
            data: { templates }
          };
          
          mockFetch.mockResolvedValue({
            json: () => Promise.resolve(mockApiResponse)
          });

          // Render component with selected template
          const { unmount } = render(
            <TemplateGallery
              selectedTemplate={selectedTemplate}
              onTemplateSelect={mockOnTemplateSelect}
              disabled={false}
            />
          );

          try {
            // Wait for templates to load
            await waitFor(() => {
              expect(screen.queryByText('加载模板中...')).not.toBeInTheDocument();
            }, { timeout: 2000 });

            // Wait for selected template to be rendered
            await waitFor(() => {
              expect(screen.getByText(selectedTemplate.name)).toBeInTheDocument();
            }, { timeout: 1000 });

            // Find the selected template element
            const selectedTemplateElement = screen.getByText(selectedTemplate.name).closest('[role="button"]');
            expect(selectedTemplateElement).toBeInTheDocument();

            // Verify highlighting classes are applied
            expect(selectedTemplateElement).toHaveClass('border-blue-500');
            expect(selectedTemplateElement).toHaveClass('ring-2');
            expect(selectedTemplateElement).toHaveClass('ring-blue-200');

            // Verify selection indicator (checkmark) is present
            const checkIcon = selectedTemplateElement!.querySelector('svg');
            expect(checkIcon).toBeInTheDocument();

            // Verify selected template info panel is displayed
            expect(screen.getByText(`已选择模板: ${selectedTemplate.name}`)).toBeInTheDocument();

            // Verify non-selected templates don't have highlighting
            for (const template of templates) {
              if (template.id !== selectedTemplate.id) {
                const templateElement = screen.getByText(template.name).closest('[role="button"]');
                expect(templateElement).not.toHaveClass('border-blue-500');
                expect(templateElement).not.toHaveClass('ring-2');
                expect(templateElement).not.toHaveClass('ring-blue-200');
                expect(templateElement).toHaveClass('border-gray-200');
              }
            }

            return true;
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );
  }, 15000);
});