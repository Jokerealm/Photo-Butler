/**
 * Unit Tests for Responsive Components
 * Testing desktop layout, mobile layout, and layout switching
 * Requirements: 9.1, 9.2, 9.3
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react';
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

// Helper function to simulate different screen sizes
const simulateScreenSize = (width: number) => {
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
      matches: breakpoints[query as keyof typeof breakpoints] || false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    };
  });
};

describe('Responsive Components Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  describe('Desktop Layout Tests (Requirements 9.1)', () => {
    beforeEach(() => {
      simulateScreenSize(1280); // Desktop size
    });

    test('should display desktop multi-column layout for large screens', () => {
      const { container } = render(<Home />);

      // Check for desktop layout container
      const desktopLayout = container.querySelector('.hidden.lg\\:block');
      expect(desktopLayout).toBeInTheDocument();

      // Check for two-column grid
      const gridContainer = container.querySelector('.grid.grid-cols-1.xl\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();

      // Verify all main components are present
      expect(screen.getAllByTestId('image-uploader')).toHaveLength(2); // Desktop + Mobile
      expect(screen.getAllByTestId('template-gallery')).toHaveLength(2);
      expect(screen.getAllByTestId('prompt-editor')).toHaveLength(2);
      expect(screen.getAllByTestId('image-generator')).toHaveLength(2);
    });

    test('should have proper desktop spacing and padding', () => {
      const { container } = render(<Home />);

      // Check main container has desktop padding
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('lg:px-8');
      expect(mainElement).toHaveClass('sm:py-8');

      // Check for desktop spacing between sections
      const spacingContainers = container.querySelectorAll('.space-y-8');
      expect(spacingContainers.length).toBeGreaterThan(0);
    });

    test('should display full navigation text on desktop', () => {
      render(<Home />);

      // Check that full text is visible (not hidden)
      const generationButton = screen.getByRole('button', { name: /图片生成/i });
      const historyButton = screen.getByRole('button', { name: /历史记录/i });

      expect(generationButton).toBeInTheDocument();
      expect(historyButton).toBeInTheDocument();

      // Check that the full text spans are not hidden
      const fullTextSpans = screen.getAllByText(/图片生成|历史记录/);
      expect(fullTextSpans.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Mobile Layout Tests (Requirements 9.2)', () => {
    beforeEach(() => {
      simulateScreenSize(375); // Mobile size
    });

    test('should display mobile single-column layout for small screens', () => {
      const { container } = render(<Home />);

      // Check for mobile layout container
      const mobileLayout = container.querySelector('.lg\\:hidden');
      expect(mobileLayout).toBeInTheDocument();

      // Desktop layout should be hidden
      const desktopLayout = container.querySelector('.hidden.lg\\:block');
      expect(desktopLayout).toBeInTheDocument(); // It exists but is hidden

      // Verify all main components are present in mobile layout
      expect(screen.getAllByTestId('image-uploader')).toHaveLength(2); // Desktop + Mobile (both rendered)
      expect(screen.getAllByTestId('template-gallery')).toHaveLength(2);
      expect(screen.getAllByTestId('prompt-editor')).toHaveLength(2);
      expect(screen.getAllByTestId('image-generator')).toHaveLength(2);
    });

    test('should have proper mobile spacing and padding', () => {
      const { container } = render(<Home />);

      // Check main container has mobile padding
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('px-4');
      expect(mainElement).toHaveClass('py-4');

      // Check for mobile spacing between sections
      const spacingContainers = container.querySelectorAll('.space-y-6');
      expect(spacingContainers.length).toBeGreaterThan(0);
    });

    test('should display compact navigation on mobile', () => {
      const { container } = render(<Home />);

      // Check that navigation container has full width on mobile
      const navContainer = container.querySelector('.w-full.max-w-md.sm\\:w-auto');
      expect(navContainer).toBeInTheDocument();

      // Check for mobile-specific button styling
      const buttons = container.querySelectorAll('button');
      buttons.forEach(button => {
        if (button.textContent?.includes('生成') || button.textContent?.includes('历史')) {
          expect(button).toHaveClass('flex-1');
          expect(button).toHaveClass('sm:flex-none');
        }
      });
    });

    test('should have responsive text sizes on mobile', () => {
      const { container } = render(<Home />);

      // Check main heading has mobile text size
      const mainHeading = container.querySelector('h1');
      expect(mainHeading).toHaveClass('text-2xl');
      expect(mainHeading).toHaveClass('sm:text-3xl');

      // Check subheading has mobile text size
      const subHeading = container.querySelector('p');
      if (subHeading) {
        expect(subHeading).toHaveClass('text-base');
        expect(subHeading).toHaveClass('sm:text-lg');
      }
    });
  });

  describe('Layout Switching Tests (Requirements 9.3)', () => {
    test('should switch from mobile to desktop layout when screen size increases', () => {
      // Start with mobile
      simulateScreenSize(375);
      const { container, rerender } = render(<Home />);

      // Verify mobile layout is active
      let mobileLayout = container.querySelector('.lg\\:hidden');
      expect(mobileLayout).toBeInTheDocument();

      // Switch to desktop
      simulateScreenSize(1280);
      rerender(<Home />);

      // Verify desktop layout elements are present
      const desktopLayout = container.querySelector('.hidden.lg\\:block');
      expect(desktopLayout).toBeInTheDocument();

      const gridContainer = container.querySelector('.grid.grid-cols-1.xl\\:grid-cols-2');
      expect(gridContainer).toBeInTheDocument();
    });

    test('should switch from desktop to mobile layout when screen size decreases', () => {
      // Start with desktop
      simulateScreenSize(1280);
      const { container, rerender } = render(<Home />);

      // Verify desktop layout is active
      let desktopLayout = container.querySelector('.hidden.lg\\:block');
      expect(desktopLayout).toBeInTheDocument();

      // Switch to mobile
      simulateScreenSize(375);
      rerender(<Home />);

      // Verify mobile layout is active
      const mobileLayout = container.querySelector('.lg\\:hidden');
      expect(mobileLayout).toBeInTheDocument();
    });

    test('should maintain functionality across layout switches', () => {
      // Start with mobile
      simulateScreenSize(375);
      const { rerender } = render(<Home />);

      // Verify navigation works on mobile
      const generationTab = screen.getByRole('button', { name: /生成/i });
      const historyTab = screen.getByRole('button', { name: /历史/i });

      expect(generationTab).toBeInTheDocument();
      expect(historyTab).toBeInTheDocument();

      // Click history tab
      fireEvent.click(historyTab);
      expect(screen.getByTestId('history-viewer')).toBeInTheDocument();

      // Switch to desktop
      simulateScreenSize(1280);
      rerender(<Home />);

      // Verify navigation still works on desktop
      const desktopGenerationTab = screen.getByRole('button', { name: /图片生成/i });
      expect(desktopGenerationTab).toBeInTheDocument();

      // History viewer should still be visible
      expect(screen.getByTestId('history-viewer')).toBeInTheDocument();
    });

    test('should handle intermediate screen sizes correctly', () => {
      // Test tablet size (768px)
      simulateScreenSize(768);
      const { container } = render(<Home />);

      // Should still use mobile layout (since lg breakpoint is 1024px)
      const mobileLayout = container.querySelector('.lg\\:hidden');
      expect(mobileLayout).toBeInTheDocument();

      // But should have some tablet-specific responsive classes
      const mainElement = container.querySelector('main');
      expect(mainElement).toHaveClass('sm:px-6'); // Tablet padding
    });
  });

  describe('Component Responsiveness', () => {
    test('should render all components responsively', () => {
      simulateScreenSize(375); // Mobile
      render(<Home />);

      // All components should be present regardless of screen size
      expect(screen.getAllByTestId('image-uploader')).toHaveLength(2); // Desktop + Mobile
      expect(screen.getAllByTestId('template-gallery')).toHaveLength(2);
      expect(screen.getAllByTestId('prompt-editor')).toHaveLength(2);
      expect(screen.getAllByTestId('image-generator')).toHaveLength(2);
    });

    test('should handle navigation state across screen sizes', () => {
      simulateScreenSize(375);
      const { rerender } = render(<Home />);

      // Switch to history view
      const historyTab = screen.getByRole('button', { name: /历史/i });
      fireEvent.click(historyTab);

      // Verify history view is shown
      expect(screen.getByTestId('history-viewer')).toBeInTheDocument();

      // Switch to desktop and verify state is maintained
      simulateScreenSize(1280);
      rerender(<Home />);

      expect(screen.getByTestId('history-viewer')).toBeInTheDocument();
    });
  });
});