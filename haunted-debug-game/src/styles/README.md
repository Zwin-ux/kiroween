# Core Visual System Foundation

This directory contains the foundational CSS architecture for the Haunted Debug Game's enhanced visual system. The system has been completely overhauled to provide a spectral, atmospheric aesthetic with proper visual hierarchy and accessibility.

## Architecture Overview

### Core Files

1. **`core-visual-system.css`** - Main consolidated CSS with design tokens, hierarchy system, and foundational styles
2. **`enhanced-spectral-system.css`** - Advanced atmospheric effects, particles, and spectral theming
3. **`typography-system.css`** - Complete typography hierarchy with Orbitron, Cascadia Code, and Inter fonts
4. **`asset-performance.css`** - Performance optimizations for asset-heavy components (existing)

### Design Tokens

The system uses CSS custom properties for consistent theming:

```css
/* Spectral Colors */
--spectral-cyan: #00ffff;
--spectral-amber: #ffb300;
--spectral-blue: #2196f3;

/* Status Colors */
--danger-red: #ff1744;
--warning-orange: #ff6d00;
--success-green: #00e676;

/* Typography */
--font-display: 'Orbitron', 'Cascadia Code', monospace;
--font-code: 'Cascadia Code', 'Source Code Pro', monospace;
--font-ui: 'Inter', 'Segoe UI', system-ui, sans-serif;
```

## Visual Hierarchy System

### Three-Tier System

1. **Primary Focus (`.focus-primary`)** - Critical elements requiring immediate attention
   - Spectral cyan glow with animated borders
   - Orbitron font family
   - Maximum visual prominence (z-index: 100)

2. **Secondary Focus (`.focus-secondary`)** - Important but not critical elements
   - Moderate spectral glow
   - Cascadia Code font family
   - Medium visual prominence (z-index: 50)

3. **Tertiary Elements (`.focus-tertiary`)** - Supporting information
   - Subtle styling with minimal glow
   - Inter font family
   - Low visual prominence (z-index: 25)

### Status States

- **`.state-danger`** - Critical system alerts with pulsing red glow
- **`.state-warning`** - Important warnings with orange flicker
- **`.state-success`** - Positive feedback with green glow
- **`.state-info`** - Informational content with cyan glow

## Typography Hierarchy

### Font Usage

- **Orbitron** - Display text and critical headings for maximum impact
- **Cascadia Code** - Terminal content, code blocks, and technical headings
- **Inter** - Body text and UI elements for optimal readability

### Typography Classes

```css
.text-display-1    /* Largest display text */
.text-heading-1    /* Primary headings */
.text-body         /* Standard body text */
.text-code         /* Code and terminal text */
.text-caption      /* Small labels and captions */
```

### Status Typography

```css
.text-status-critical  /* Critical alerts with pulsing animation */
.text-status-warning   /* Warnings with flicker effect */
.text-status-success   /* Success messages with green glow */
.text-status-info      /* Information with cyan glow */
```

## Atmospheric Effects

### Lighting System

- **Volumetric Glows** - Depth-creating light effects around important elements
- **CRT Scanlines** - Authentic retro terminal simulation
- **Vignette Lighting** - Focus-directing edge darkening
- **Phosphor Effects** - Realistic monitor glow simulation

### Particle System

- **Floating Particles** - Ambient spectral particles that respond to system state
- **Multiple Colors** - Cyan, amber, green, and blue particles with varied timing
- **Performance Adaptive** - Automatically reduces on mobile devices

### Animation Effects

- **Breathing Panels** - Subtle scale and shadow animations for organic feel
- **Possessed Text** - Glitch effects for supernatural elements
- **System Corruption** - Visual distortion for critical states

## Performance Optimizations

### CSS Containment

All major components use CSS containment for optimal performance:

```css
.spectral-panel {
  contain: layout style;
  transform: translateZ(0);
}
```

### Performance Modes

- **High Performance** - Full effects with GPU acceleration
- **Medium Performance** - Balanced effects with reduced particle count
- **Low Performance** - Minimal effects optimized for mobile

### Responsive Design

- Mobile devices automatically receive reduced complexity
- Animations are simplified or disabled on smaller screens
- Font sizes scale appropriately across breakpoints

## Accessibility Features

### Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  /* All animations disabled */
  animation: none !important;
}
```

### High Contrast Mode

```css
@media (prefers-contrast: high) {
  /* Enhanced borders and contrast */
  border-width: 2px;
}
```

### Focus Indicators

All interactive elements have proper focus indicators with spectral glow:

```css
:focus-visible {
  outline: 2px solid var(--spectral-cyan);
  box-shadow: var(--glow-spectral);
}
```

## Usage Guidelines

### Importing Styles

Import the core system in your main CSS file:

```css
@import './core-visual-system.css';
@import './enhanced-spectral-system.css';
@import './typography-system.css';
```

### Component Classes

Use the provided classes for consistent styling:

```html
<!-- Primary focus element -->
<div class="focus-primary spectral-panel">
  <h1 class="text-display-1">Critical System Alert</h1>
</div>

<!-- Secondary element with atmospheric effects -->
<div class="focus-secondary breathing-panel crt-effect">
  <h2 class="text-heading-2">System Status</h2>
</div>

<!-- Status-based typography -->
<p class="text-status-critical">System Failure Detected</p>
<p class="text-status-success">Patch Applied Successfully</p>
```

### Performance Considerations

- Use `.gpu-accelerated` for elements that will be animated
- Apply `.contain-layout` to complex components
- Use performance mode classes for adaptive rendering

## Browser Support

- Modern browsers with CSS Grid and Custom Properties support
- Graceful degradation for older browsers
- Progressive enhancement approach for advanced effects

## Maintenance

When updating the visual system:

1. Modify design tokens in `:root` for global changes
2. Test across all performance modes
3. Verify accessibility compliance
4. Update documentation for new classes or patterns

This foundational system provides a solid base for the enhanced visual experience while maintaining performance and accessibility standards.