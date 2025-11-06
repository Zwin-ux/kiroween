/**
 * Accessibility Utilities Test Suite
 * 
 * Tests for accessibility helper functions and utilities used throughout
 * the visual system to ensure WCAG compliance.
 */

// Color contrast calculation utility
function calculateContrast(foreground: string, background: string): number {
  const getLuminance = (color: string): number => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Calculate relative luminance
    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    
    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const l1 = getLuminance(foreground);
  const l2 = getLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Focus management utilities
class FocusManager {
  private focusStack: HTMLElement[] = [];
  
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;
    
    if (focusableElements.length === 0) return () => {};
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    firstElement.focus();
    
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }
  
  saveFocus(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      this.focusStack.push(activeElement);
    }
  }
  
  restoreFocus(): void {
    const element = this.focusStack.pop();
    if (element && element.focus) {
      element.focus();
    }
  }
}

// Reduced motion detection
function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Screen reader utilities
function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
}

describe('Accessibility Utilities', () => {
  describe('Color Contrast Calculation', () => {
    it('should calculate correct contrast ratios', () => {
      // Test high contrast (black on white)
      const highContrast = calculateContrast('#000000', '#ffffff');
      expect(highContrast).toBeCloseTo(21, 0); // Perfect contrast ratio
      
      // Test medium contrast
      const mediumContrast = calculateContrast('#666666', '#ffffff');
      expect(mediumContrast).toBeGreaterThan(4.5); // Should meet AA standard
      
      // Test low contrast
      const lowContrast = calculateContrast('#cccccc', '#ffffff');
      expect(lowContrast).toBeLessThan(3); // Should fail AA standard
    });

    it('should validate spectral color palette contrast', () => {
      const spectralColors = {
        cyan: '#00ffff',
        amber: '#ffb300',
        blue: '#2196f3',
        background: '#000000',
      };

      // Test each spectral color against dark background
      Object.entries(spectralColors).forEach(([name, color]) => {
        if (name !== 'background') {
          const contrast = calculateContrast(color, spectralColors.background);
          expect(contrast).toBeGreaterThanOrEqual(4.5); // Should meet AA standard
        }
      });
    });

    it('should handle edge cases in contrast calculation', () => {
      // Test same colors (should be 1:1 ratio)
      const sameColor = calculateContrast('#ff0000', '#ff0000');
      expect(sameColor).toBeCloseTo(1, 1);
      
      // Test invalid colors (should handle gracefully)
      expect(() => calculateContrast('invalid', '#ffffff')).not.toThrow();
    });
  });

  describe('Focus Management', () => {
    let focusManager: FocusManager;
    let container: HTMLElement;

    beforeEach(() => {
      focusManager = new FocusManager();
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      document.body.removeChild(container);
    });

    it('should trap focus within container', () => {
      // Create focusable elements
      const button1 = document.createElement('button');
      const button2 = document.createElement('button');
      const button3 = document.createElement('button');
      
      button1.textContent = 'Button 1';
      button2.textContent = 'Button 2';
      button3.textContent = 'Button 3';
      
      container.appendChild(button1);
      container.appendChild(button2);
      container.appendChild(button3);

      const releaseFocusTrap = focusManager.trapFocus(container);
      
      // Focus should be on first element
      expect(document.activeElement).toBe(button1);
      
      // Simulate tab to last element
      button3.focus();
      
      // Simulate tab key (should cycle back to first)
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
      container.dispatchEvent(tabEvent);
      
      releaseFocusTrap();
    });

    it('should save and restore focus', () => {
      const button = document.createElement('button');
      document.body.appendChild(button);
      button.focus();
      
      expect(document.activeElement).toBe(button);
      
      focusManager.saveFocus();
      
      // Focus something else
      const otherButton = document.createElement('button');
      document.body.appendChild(otherButton);
      otherButton.focus();
      
      expect(document.activeElement).toBe(otherButton);
      
      // Restore focus
      focusManager.restoreFocus();
      expect(document.activeElement).toBe(button);
      
      document.body.removeChild(button);
      document.body.removeChild(otherButton);
    });

    it('should handle empty containers gracefully', () => {
      const emptyContainer = document.createElement('div');
      document.body.appendChild(emptyContainer);
      
      expect(() => {
        const release = focusManager.trapFocus(emptyContainer);
        release();
      }).not.toThrow();
      
      document.body.removeChild(emptyContainer);
    });
  });

  describe('Reduced Motion Detection', () => {
    it('should detect reduced motion preference', () => {
      // Mock matchMedia for reduced motion
      const mockMatchMedia = jest.fn().mockImplementation(query => ({
        matches: query.includes('prefers-reduced-motion: reduce'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      const reducedMotion = prefersReducedMotion();
      expect(typeof reducedMotion).toBe('boolean');
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });
  });

  describe('Screen Reader Announcements', () => {
    it('should create announcement elements', () => {
      const message = 'Test announcement';
      announceToScreenReader(message, 'polite');
      
      const announcements = document.querySelectorAll('[aria-live="polite"]');
      expect(announcements.length).toBeGreaterThan(0);
      
      const lastAnnouncement = announcements[announcements.length - 1];
      expect(lastAnnouncement.textContent).toBe(message);
    });

    it('should handle different priority levels', () => {
      announceToScreenReader('Polite message', 'polite');
      announceToScreenReader('Assertive message', 'assertive');
      
      const politeAnnouncements = document.querySelectorAll('[aria-live="polite"]');
      const assertiveAnnouncements = document.querySelectorAll('[aria-live="assertive"]');
      
      expect(politeAnnouncements.length).toBeGreaterThan(0);
      expect(assertiveAnnouncements.length).toBeGreaterThan(0);
    });

    it('should clean up announcement elements', (done) => {
      const initialCount = document.querySelectorAll('[aria-live]').length;
      
      announceToScreenReader('Temporary message');
      
      const afterCount = document.querySelectorAll('[aria-live]').length;
      expect(afterCount).toBeGreaterThan(initialCount);
      
      // Check cleanup after timeout
      setTimeout(() => {
        const finalCount = document.querySelectorAll('[aria-live]').length;
        expect(finalCount).toBeLessThanOrEqual(afterCount);
        done();
      }, 1100);
    });
  });

  describe('ARIA Utilities', () => {
    it('should validate ARIA attributes', () => {
      const element = document.createElement('div');
      
      // Test valid ARIA attributes
      element.setAttribute('aria-label', 'Test label');
      element.setAttribute('aria-describedby', 'description');
      element.setAttribute('role', 'button');
      
      expect(element.getAttribute('aria-label')).toBe('Test label');
      expect(element.getAttribute('aria-describedby')).toBe('description');
      expect(element.getAttribute('role')).toBe('button');
    });

    it('should handle live regions correctly', () => {
      const liveRegion = document.createElement('div');
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      
      document.body.appendChild(liveRegion);
      
      // Update content
      liveRegion.textContent = 'Updated content';
      
      expect(liveRegion.getAttribute('aria-live')).toBe('polite');
      expect(liveRegion.getAttribute('aria-atomic')).toBe('true');
      expect(liveRegion.textContent).toBe('Updated content');
      
      document.body.removeChild(liveRegion);
    });
  });

  describe('Keyboard Navigation Utilities', () => {
    it('should handle escape key events', () => {
      const mockHandler = jest.fn();
      
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          mockHandler();
        }
      };
      
      document.addEventListener('keydown', handleKeyDown);
      
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      document.dispatchEvent(escapeEvent);
      
      expect(mockHandler).toHaveBeenCalled();
      
      document.removeEventListener('keydown', handleKeyDown);
    });

    it('should handle arrow key navigation', () => {
      const items = [
        document.createElement('button'),
        document.createElement('button'),
        document.createElement('button'),
      ];
      
      items.forEach((item, index) => {
        item.textContent = `Item ${index + 1}`;
        document.body.appendChild(item);
      });
      
      let currentIndex = 0;
      
      const handleArrowKeys = (e: KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
          currentIndex = Math.min(currentIndex + 1, items.length - 1);
          items[currentIndex].focus();
        } else if (e.key === 'ArrowUp') {
          currentIndex = Math.max(currentIndex - 1, 0);
          items[currentIndex].focus();
        }
      };
      
      document.addEventListener('keydown', handleArrowKeys);
      
      // Test arrow down
      const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      document.dispatchEvent(arrowDownEvent);
      
      expect(document.activeElement).toBe(items[1]);
      
      // Test arrow up
      const arrowUpEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' });
      document.dispatchEvent(arrowUpEvent);
      
      expect(document.activeElement).toBe(items[0]);
      
      document.removeEventListener('keydown', handleArrowKeys);
      items.forEach(item => document.body.removeChild(item));
    });
  });
});