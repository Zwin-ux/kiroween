import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SpectralGameInterface } from '@/components/ui/SpectralGameInterface';
import { VisualDesignShowcase } from '@/components/examples/VisualDesignShowcase';
import { EnhancedTerminal } from '@/components/ui/EnhancedTerminal';
import { AccessibilityControls } from '@/components/ui/AccessibilityControls';

// Mock matchMedia for reduced motion testing
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Accessibility Compliance Tests', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  describe('WCAG 2.1 AA Compliance', () => {
    it('should provide proper ARIA labels and roles', () => {
      render(
        <SpectralGameInterface
          stabilityLevel={75}
          insightLevel={60}
          systemStatus="stable"
          activeGhosts={2}
          currentRoom="main-terminal"
        />
      );

      // Check for main landmarks
      const mainElement = document.querySelector('main') || document.querySelector('[role="main"]');
      expect(mainElement).toBeInTheDocument();
      
      // Check for status indicators
      const statusElements = document.querySelectorAll('[role="status"], [aria-live]');
      expect(statusElements.length).toBeGreaterThan(0);
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      render(
        <SpectralGameInterface
          stabilityLevel={75}
          insightLevel={60}
          systemStatus="stable"
          activeGhosts={2}
          currentRoom="main-terminal"
        />
      );

      // Test tab navigation
      await user.tab();
      expect(document.activeElement).toBeInTheDocument();
      
      // Test multiple tab navigation
      for (let i = 0; i < 3; i++) {
        await user.tab();
        expect(document.activeElement).toBeInTheDocument();
      }
    });

    it('should respect reduced motion preferences', () => {
      mockMatchMedia(true);
      
      render(
        <SpectralGameInterface
          stabilityLevel={75}
          insightLevel={60}
          systemStatus="stable"
          activeGhosts={2}
          currentRoom="main-terminal"
        />
      );

      // Check that reduced motion is respected
      const animatedElements = document.querySelectorAll('.breathing-shadow, .spectral-particle');
      
      animatedElements.forEach(element => {
        const styles = window.getComputedStyle(element);
        expect(
          styles.animationDuration === '0s' ||
          styles.animationPlayState === 'paused' ||
          element.classList.contains('reduced-motion')
        ).toBe(true);
      });
    });

    it('should provide proper focus indicators', async () => {
      const user = userEvent.setup();
      
      render(<VisualDesignShowcase />);

      const buttons = screen.getAllByRole('button');
      
      if (buttons.length > 0) {
        buttons[0].focus();
        
        const styles = window.getComputedStyle(buttons[0]);
        
        const hasFocusIndicator = (
          styles.outline !== 'none' ||
          styles.boxShadow.includes('glow') ||
          styles.boxShadow.includes('focus') ||
          buttons[0].classList.contains('focus-visible')
        );
        
        expect(hasFocusIndicator).toBe(true);
      }
    });
  });

  describe('Terminal Accessibility', () => {
    const mockTerminalData = {
      lines: [
        { text: '> System initialized', type: 'success' as const, timestamp: Date.now() },
        { text: '> Warning: Ghost detected', type: 'warning' as const, timestamp: Date.now() },
      ],
    };

    it('should provide proper terminal semantics', () => {
      render(
        <EnhancedTerminal 
          lines={mockTerminalData.lines}
          isActive={true}
        />
      );

      // Terminal should have proper role or live region
      const terminal = document.querySelector('[role="log"], [aria-live]');
      expect(terminal).toBeInTheDocument();

      // Each line should be accessible
      mockTerminalData.lines.forEach(line => {
        const lineElement = screen.getByText(line.text);
        expect(lineElement).toBeInTheDocument();
      });
    });
  });

  describe('High Contrast Support', () => {
    it('should provide high contrast mode', () => {
      render(<AccessibilityControls />);
      
      const highContrastControl = screen.getByLabelText(/high contrast/i) || 
                                 screen.getByText(/high contrast/i);
      
      if (highContrastControl) {
        fireEvent.click(highContrastControl);
        expect(document.body.classList.contains('high-contrast')).toBe(true);
      }
    });
  });
});