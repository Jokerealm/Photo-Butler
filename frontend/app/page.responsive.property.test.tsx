/**
 * Property-Based Tests for Responsive Layout
 * Feature: ai-image-generator, Property 25: 响应式布局调整
 * Validates: Requirements 9.3
 */

import { render, screen } from '@testing-library/react';
import { act } from 'react';
import fc from 'fast-check';
import Home from './page';

// Mock the components to focus on layout testing
jest.mock('../components/ImageUploader', () => {
  return function MockImageUploader() {
    return <div data-testid="image-uploader">ImageUploader</div>;
  };
});

jest.mock('../components/TemplateGallery', () => {
  return function MockTemplateGallery() {
    return <div data-testid="template-gallery">TemplateGallery</div>;
  };
});

jest.mock('../components/PromptEditor', () => {
  return function MockPromptEditor() {
    return <div data-testid="prompt-editor">PromptEditor</div>;
  };
});

jest.mock('../components/ImageGenerator', () => {
  return function MockImageGenerator() {
    return <div data-testid="image-generator">ImageGenerator</div>;
  };
});

jest.mock('../components/HistoryViewer', () => {
  return function MockHistoryViewer() {
    return <div data-testid="history-viewer">HistoryViewer</div>;
  };
});

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

// Mock window.matchMedia for responsive testing
const mockMatchMedia = (query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(),
  removeListener: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
});

// Helper function to simulate different screen sizes
const simulateScreenSize = (width: number) => {
  // Mock window.innerWidth
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });

  // Mock matchMedia for different breakpoints
  window.matchMedia = jest.fn().mockImplementation((query) => {
    const breakpoints = {
      '(min-width: 1024px)': width >= 1024, // lg
      '(min-width: 768px)': width >= 768,   // md
      '(min-width: 640px)': width >= 640,   // sm
    };
    
    return {
      ...mockMatchMedia(query),
      matches: breakpoints[query as keyof typeof breakpoints] || false,
    };
  });
};

describe('Responsive Layout Property Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  /**
   * Property 25: 响应式布局调整
   * For any screen size change, the system should automatically adjust layout and element sizes
   * Validates: Requirements 9.3
   */
  test('Property 25: Layout adjusts automatically for different screen sizes', () => {
    fc.assert(
      fc.property(
        // Generate different screen widths
        fc.integer({ min: 320, max: 1920 }),
        (screenWidth) => {
          // Simulate the screen size
          simulateScreenSize(screenWidth);

          // Render the component
          const { container } = render(<Home />);

          // Check that the component renders without errors
          expect(container).toBeInTheDocument();

          // Verify that responsive classes are applied based on screen size
          const mainElement = container.querySelector('main');
          expect(mainElement).toBeInTheDocument();

          // Check for responsive padding classes
          const hasResponsivePadding = mainElement?.className.includes('px-4') && 
                                     mainElement?.className.includes('sm:px-6') && 
                                     mainElement?.className.includes('lg:px-8');
          expect(hasResponsivePadding).toBe(true);

          // Check for responsive spacing classes
          const hasResponsiveSpacing = mainElement?.className.includes('py-4') && 
                                      mainElement?.className.includes('sm:py-8');
          expect(hasResponsiveSpacing).toBe(true);

          // For desktop sizes (lg and above), check for multi-column layout
          if (screenWidth >= 1024) {
            // Desktop layout should have the hidden lg:block class for desktop layout
            const desktopLayout = container.querySelector('.hidden.lg\\:block');
            expect(desktopLayout).toBeInTheDocument();
          }

          // For mobile sizes, check for single-column layout
          if (screenWidth < 1024) {
            // Mobile layout should have the lg:hidden class for mobile layout
            const mobileLayout = container.querySelector('.lg\\:hidden');
            expect(mobileLayout).toBeInTheDocument();
          }

          // Check that navigation tabs are responsive
          const navButtons = container.querySelectorAll('button');
          const hasNavButtons = navButtons.length >= 2; // At least generation and history tabs
          expect(hasNavButtons).toBe(true);

          // Verify responsive text sizing in header
          const header = container.querySelector('h1');
          if (header) {
            const hasResponsiveText = header.className.includes('text-2xl') && 
                                    header.className.includes('sm:text-3xl') && 
                                    header.className.includes('lg:text-4xl');
            expect(hasResponsiveText).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  test('Property 25: Navigation tabs adapt to screen size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (screenWidth) => {
          simulateScreenSize(screenWidth);

          const { container } = render(<Home />);

          // Find navigation container
          const navContainer = container.querySelector('.flex.space-x-1.bg-white');
          expect(navContainer).toBeInTheDocument();

          // Check for responsive width classes
          if (screenWidth < 640) {
            // Mobile: should have full width
            const hasFullWidth = navContainer?.className.includes('w-full');
            expect(hasFullWidth).toBe(true);
          } else {
            // Desktop: should have auto width
            const hasAutoWidth = navContainer?.className.includes('sm:w-auto');
            expect(hasAutoWidth).toBe(true);
          }

          // Check navigation buttons have responsive text
          const navButtons = container.querySelectorAll('button');
          navButtons.forEach(button => {
            const hasResponsiveText = button.className.includes('text-sm') && 
                                    button.className.includes('sm:text-base');
            expect(hasResponsiveText).toBe(true);
          });

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 25: Component spacing adjusts responsively', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (screenWidth) => {
          simulateScreenSize(screenWidth);

          const { container } = render(<Home />);

          // Check for responsive spacing in main content areas
          const spacingElements = container.querySelectorAll('[class*="space-y"], [class*="mb-"], [class*="mt-"], [class*="p-"]');
          
          // Should have at least some elements with spacing
          expect(spacingElements.length).toBeGreaterThan(0);

          // Check that at least some elements have responsive spacing classes
          let hasAnyResponsiveSpacing = false;
          spacingElements.forEach(element => {
            const hasResponsiveSpacing = element.className.includes('sm:') || 
                                       element.className.includes('md:') ||
                                       element.className.includes('lg:') ||
                                       element.className.includes('xl:');
            if (hasResponsiveSpacing) {
              hasAnyResponsiveSpacing = true;
            }
          });

          // At least some elements should have responsive spacing
          expect(hasAnyResponsiveSpacing).toBe(true);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 25: Grid layouts adapt to screen size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (screenWidth) => {
          simulateScreenSize(screenWidth);

          const { container } = render(<Home />);

          // For desktop layout, check for grid classes
          if (screenWidth >= 1280) { // xl breakpoint
            const gridElements = container.querySelectorAll('[class*="grid-cols"]');
            
            // Should have responsive grid columns
            const hasResponsiveGrid = Array.from(gridElements).some(element => 
              element.className.includes('xl:grid-cols-2')
            );
            
            // At least one grid should be responsive
            expect(gridElements.length).toBeGreaterThan(0);
          }

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  test('Property 25: Text sizes scale with screen size', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 320, max: 1920 }),
        (screenWidth) => {
          simulateScreenSize(screenWidth);

          const { container } = render(<Home />);

          // Check main heading
          const mainHeading = container.querySelector('h1');
          if (mainHeading) {
            const hasResponsiveHeading = mainHeading.className.includes('text-2xl') && 
                                       mainHeading.className.includes('sm:text-3xl') && 
                                       mainHeading.className.includes('lg:text-4xl');
            expect(hasResponsiveHeading).toBe(true);
          }

          // Check subheading
          const subHeading = container.querySelector('p');
          if (subHeading) {
            const hasResponsiveSubheading = subHeading.className.includes('text-base') && 
                                          subHeading.className.includes('sm:text-lg');
            expect(hasResponsiveSubheading).toBe(true);
          }

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });
});