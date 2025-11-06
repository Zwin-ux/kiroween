import { render, screen } from '@testing-library/react';
import { SpectralGameInterface } from '@/components/ui/SpectralGameInterface';
import { VisualDesignShowcase } from '@/components/examples/VisualDesignShowcase';
import { EnhancedTerminal } from '@/components/ui/EnhancedTerminal';
import { SeasonalDecorations } from '@/components/ui/SeasonalDecorations';

// Mock performance APIs for consistent testing
const mockPerformance = {
  now: jest.fn(() => 1000),
  mark: jest.fn(),
  measure: jest.fn(),
  getEntriesByType: jest.fn(() => []),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

// Mock CSS animations for consistent snapshots
const mockAnimate = jest.fn(() => ({
  finished: Promise.resolve(),
  cancel: jest.fn(),
  pause: jest.fn(),
  play: jest.fn(),
}));

Element.prototype.animate = mockAnimate;

describe('Visual Regression Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset CSS custom properties for consistent testing
    document.documentElement.style.setProperty('--animation-multiplier', '0');
    document.documentElement.style.setProperty('--particle-count', '0');
  });

  describe('SpectralGameInterface Component', () => {
    it('renders with default props consistently', () => {
      const { container } = render(
        <SpectralGameInterface
          stabilityLevel={75}
          insightLevel={60}
          systemStatus="stable"
          activeGhosts={2}
          currentRoom="main-terminal"
          performanceMode="medium"
        />
      );

      // Verify core structure is present
      expect(container.querySelector('.spectral-interface')).toBeInTheDocument();
      expect(screen.getByText('System Status: STABLE')).toBeInTheDocument();
      expect(screen.getByText('Active Ghosts: 2')).toBeInTheDocument();
      
      // Check visual hierarchy classes are applied
      const primaryElements = container.querySelectorAll('.focus-primary');
      const secondaryElements = container.querySelectorAll('.focus-secondary');
      const tertiaryElements = container.querySelectorAll('.focus-tertiary');
      
      expect(primaryElements.length).toBeGreaterThan(0);
      expect(secondaryElements.length).toBeGreaterThan(0);
      expect(tertiaryElements.length).toBeGreaterThan(0);
    });

    it('renders critical system status with proper styling', () => {
      const { container } = render(
        <SpectralGameInterface
          stabilityLevel={15}
          insightLevel={30}
          systemStatus="critical"
          activeGhosts={5}
          currentRoom="corrupted-sector"
          performanceMode="high"
        />
      );

      expect(screen.getByText('System Status: CRITICAL')).toBeInTheDocument();
      expect(container.querySelector('.status-critical')).toBeInTheDocument();
      expect(container.querySelector('.possessed-text')).toBeInTheDocument();
    });

    it('adapts to different performance modes', () => {
      const { container: lowPerf } = render(
        <SpectralGameInterface
          stabilityLevel={50}
          insightLevel={50}
          systemStatus="stable"
          activeGhosts={1}
          currentRoom="test-room"
          performanceMode="low"
        />
      );

      const { container: highPerf } = render(
        <SpectralGameInterface
          stabilityLevel={50}
          insightLevel={50}
          systemStatus="stable"
          activeGhosts={1}
          currentRoom="test-room"
          performanceMode="high"
        />
      );

      // Low performance should have fewer particle elements
      const lowPerfParticles = lowPerf.querySelectorAll('.spectral-particle');
      const highPerfParticles = highPerf.querySelectorAll('.spectral-particle');
      
      expect(lowPerfParticles.length).toBeLessThanOrEqual(highPerfParticles.length);
    });
  });

  describe('VisualDesignShowcase Component', () => {
    it('renders all visual hierarchy examples', () => {
      const { container } = render(<VisualDesignShowcase />);

      // Check for hierarchy sections
      expect(screen.getByText('Visual Hierarchy System')).toBeInTheDocument();
      expect(screen.getByText('Atmospheric Effects')).toBeInTheDocument();
      expect(screen.getByText('Typography System')).toBeInTheDocument();

      // Verify hierarchy classes are present
      expect(container.querySelector('.focus-primary')).toBeInTheDocument();
      expect(container.querySelector('.focus-secondary')).toBeInTheDocument();
      expect(container.querySelector('.focus-tertiary')).toBeInTheDocument();
    });

    it('displays performance controls correctly', () => {
      render(<VisualDesignShowcase />);

      expect(screen.getByText('Performance Mode:')).toBeInTheDocument();
      expect(screen.getByText('Low')).toBeInTheDocument();
      expect(screen.getByText('Medium')).toBeInTheDocument();
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  describe('EnhancedTerminal Component', () => {
    const mockTerminalData = {
      lines: [
        { text: '> System initialized', type: 'success' as const, timestamp: Date.now() },
        { text: '> Warning: Ghost detected', type: 'warning' as const, timestamp: Date.now() },
        { text: '> Error: Critical failure', type: 'error' as const, timestamp: Date.now() },
      ],
    };

    it('renders terminal lines with proper styling', () => {
      const { container } = render(
        <EnhancedTerminal 
          lines={mockTerminalData.lines}
          isActive={true}
        />
      );

      expect(screen.getByText('> System initialized')).toBeInTheDocument();
      expect(screen.getByText('> Warning: Ghost detected')).toBeInTheDocument();
      expect(screen.getByText('> Error: Critical failure')).toBeInTheDocument();

      // Check for CRT effects
      expect(container.querySelector('.crt-scanlines')).toBeInTheDocument();
      expect(container.querySelector('.terminal-glow')).toBeInTheDocument();
    });

    it('applies correct line type styling', () => {
      const { container } = render(
        <EnhancedTerminal 
          lines={mockTerminalData.lines}
          isActive={true}
        />
      );

      expect(container.querySelector('.line-success')).toBeInTheDocument();
      expect(container.querySelector('.line-warning')).toBeInTheDocument();
      expect(container.querySelector('.line-error')).toBeInTheDocument();
    });
  });

  describe('SeasonalDecorations Component', () => {
    it('renders KiroWeen decorations', () => {
      const { container } = render(<SeasonalDecorations season="kiroween" />);

      expect(container.querySelector('.seasonal-kiroween')).toBeInTheDocument();
      expect(container.querySelector('.floating-particles')).toBeInTheDocument();
    });

    it('handles different seasons appropriately', () => {
      const { container: winter } = render(<SeasonalDecorations season="winter" />);
      const { container: summer } = render(<SeasonalDecorations season="summer" />);

      expect(winter.querySelector('.seasonal-winter')).toBeInTheDocument();
      expect(summer.querySelector('.seasonal-summer')).toBeInTheDocument();
    });
  });

  describe('Animation Frame Validation', () => {
    it('validates breathing animation keyframes', () => {
      const { container } = render(
        <SpectralGameInterface
          stabilityLevel={75}
          insightLevel={60}
          systemStatus="stable"
          activeGhosts={2}
          currentRoom="main-terminal"
          performanceMode="high"
        />
      );

      const breathingElements = container.querySelectorAll('.breathing-shadow');
      expect(breathingElements.length).toBeGreaterThan(0);

      // Verify animation properties are set
      breathingElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.animationName).toBeTruthy();
        expect(computedStyle.animationDuration).toBeTruthy();
      });
    });

    it('validates particle animation consistency', () => {
      const { container } = render(
        <SpectralGameInterface
          stabilityLevel={75}
          insightLevel={60}
          systemStatus="stable"
          activeGhosts={2}
          currentRoom="main-terminal"
          performanceMode="high"
        />
      );

      const particles = container.querySelectorAll('.spectral-particle');
      particles.forEach(particle => {
        const computedStyle = window.getComputedStyle(particle);
        // Verify particles have consistent animation properties
        expect(computedStyle.animationName).toContain('float');
        expect(parseFloat(computedStyle.animationDuration)).toBeGreaterThan(0);
      });
    });

    it('validates possessed text glitch effects', () => {
      const { container } = render(
        <SpectralGameInterface
          stabilityLevel={15}
          insightLevel={30}
          systemStatus="critical"
          activeGhosts={5}
          currentRoom="corrupted-sector"
          performanceMode="high"
        />
      );

      const possessedElements = container.querySelectorAll('.possessed-text');
      expect(possessedElements.length).toBeGreaterThan(0);

      possessedElements.forEach(element => {
        const computedStyle = window.getComputedStyle(element);
        expect(computedStyle.animationName).toContain('glitch');
      });
    });
  });

  describe('CSS Custom Properties Validation', () => {
    it('validates spectral color palette consistency', () => {
      render(<VisualDesignShowcase />);

      const root = document.documentElement;
      const spectralCyan = getComputedStyle(root).getPropertyValue('--spectral-cyan');
      const spectralAmber = getComputedStyle(root).getPropertyValue('--spectral-amber');
      const spectralBlue = getComputedStyle(root).getPropertyValue('--spectral-blue');

      expect(spectralCyan).toBeTruthy();
      expect(spectralAmber).toBeTruthy();
      expect(spectralBlue).toBeTruthy();
    });

    it('validates visual hierarchy custom properties', () => {
      render(<VisualDesignShowcase />);

      const root = document.documentElement;
      const focusPrimary = getComputedStyle(root).getPropertyValue('--focus-primary-glow');
      const focusSecondary = getComputedStyle(root).getPropertyValue('--focus-secondary-glow');
      const focusTertiary = getComputedStyle(root).getPropertyValue('--focus-tertiary-glow');

      expect(focusPrimary).toBeTruthy();
      expect(focusSecondary).toBeTruthy();
      expect(focusTertiary).toBeTruthy();
    });
  });
});