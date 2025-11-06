# 📁 Project Structure

This document provides an overview of the KiroWeen project organization and architecture.

## 🏗️ Repository Structure

```
kiroween/
├── .github/                    # GitHub workflows and templates
│   └── workflows/
│       └── ci.yml             # CI/CD pipeline
├── .kiro/                     # Kiro IDE specifications and configs
│   ├── specs/                 # Feature specifications
│   ├── steering/              # Development guidelines
│   └── vibe/                  # AI context and prompts
├── haunted-debug-game/        # Main Next.js application
│   ├── public/                # Static assets
│   ├── scripts/               # Build and utility scripts
│   ├── src/                   # Source code
│   └── package.json           # App dependencies
├── CONTRIBUTING.md            # Contribution guidelines
├── DEPLOYMENT.md              # Deployment instructions
├── LICENSE                    # MIT license
├── README.md                  # Project overview
└── package.json               # Root package.json
```

## 🎮 Application Structure

### `/haunted-debug-game/src/`

```
src/
├── app/                       # Next.js App Router
│   ├── globals.css           # Global styles and Tailwind imports
│   ├── layout.tsx            # Root layout component
│   ├── page.tsx              # Home page
│   ├── test-ghosts/          # Ghost testing page
│   └── visual-demo/          # Visual system showcase
├── components/               # React components
│   ├── ui/                   # Base UI components
│   │   ├── button.tsx        # Button component
│   │   ├── dialog.tsx        # Modal dialogs
│   │   ├── progress.tsx      # Progress bars
│   │   ├── SpectralGameInterface.tsx  # Main game UI
│   │   ├── EnhancedTerminal.tsx       # Terminal component
│   │   ├── AccessibilityControls.tsx # A11y settings
│   │   └── ...               # Other UI components
│   ├── examples/             # Demo and showcase components
│   │   ├── VisualDesignShowcase.tsx  # Design system demo
│   │   ├── AssetIntegrationExample.tsx
│   │   └── ...
│   └── dev/                  # Development tools
│       ├── AssetInspector.tsx
│       └── PerformanceDashboard.tsx
├── engine/                   # Game engine (pure TypeScript)
│   ├── __tests__/            # Engine tests
│   ├── ghosts/               # Ghost implementations
│   │   ├── DataLeakGhost.ts
│   │   ├── CircularDependencyGhost.ts
│   │   └── ...
│   ├── GameEngine.ts         # Core game engine
│   ├── MeterSystem.ts        # Stability/Insight meters
│   ├── PatchSystem.ts        # Code patching system
│   ├── DialogueEngine.ts     # Conversation system
│   ├── SecurityValidationSystem.ts
│   ├── AccessibilityManager.ts
│   └── ...                   # Other engine modules
├── hooks/                    # Custom React hooks
│   ├── useGameEngine.ts      # Game engine integration
│   ├── useAssets.ts          # Asset management
│   ├── usePlayerChoice.ts    # Player decision handling
│   └── ...
├── lib/                      # Utility libraries
│   ├── __tests__/            # Library tests
│   ├── assets.ts             # Asset management
│   ├── assetLoader.ts        # Asset loading utilities
│   ├── assetOptimizer.ts     # Asset optimization
│   ├── VisualPerformanceMonitor.ts  # Performance tracking
│   ├── BrowserCompatibility.ts     # Cross-browser support
│   └── utils.ts              # General utilities
├── store/                    # State management
│   └── gameStore.ts          # Zustand game state
├── styles/                   # CSS files
│   ├── consolidated-visual-system.css  # Main visual system
│   ├── typography-system.css           # Typography styles
│   ├── asset-performance.css           # Asset-specific styles
│   └── README.md             # Style system documentation
└── types/                    # TypeScript definitions
    ├── game.ts               # Game state types
    ├── patch.ts              # Patch system types
    ├── dialogue.ts           # Conversation types
    ├── encounter.ts          # Ghost encounter types
    └── ...
```

## 🏛️ Architecture Layers

### 1. Engine Layer (Pure TypeScript)
**Location**: `/src/engine/`
**Purpose**: Core game logic, no React dependencies
**Key Modules**:
- `GameEngine.ts` - Central game coordinator
- `MeterSystem.ts` - Stability/Insight tracking
- `PatchSystem.ts` - Code modification system
- `DialogueEngine.ts` - Conversation management
- `SecurityValidationSystem.ts` - Code safety validation
- `ghosts/` - Individual ghost implementations

**Principles**:
- No React dependencies
- Unit testable in isolation
- Dependency injection for external services
- Pure functions where possible

### 2. Component Layer (React)
**Location**: `/src/components/`
**Purpose**: UI presentation and user interaction
**Structure**:
- `ui/` - Reusable base components
- `examples/` - Demo and showcase components
- `dev/` - Development and debugging tools

**Principles**:
- Consume engine modules via hooks
- Handle UI interactions only
- Delegate business logic to engine
- TypeScript interfaces for all props

### 3. Hook Layer (React Integration)
**Location**: `/src/hooks/`
**Purpose**: Bridge between React and engine
**Key Hooks**:
- `useGameEngine.ts` - Main game state integration
- `usePlayerChoice.ts` - Decision handling
- `useAssets.ts` - Asset loading and management
- `useDialogueSession.ts` - Conversation state

**Principles**:
- Encapsulate engine interactions
- Provide React-friendly APIs
- Handle side effects and cleanup
- Memoize expensive operations

### 4. State Layer (Zustand)
**Location**: `/src/store/`
**Purpose**: Global application state
**Features**:
- Persistent game state
- Meter tracking
- Evidence board
- Player choices
- Settings and preferences

## 🎨 Visual System Architecture

### CSS Organization
```
styles/
├── consolidated-visual-system.css    # Main system
│   ├── Design tokens & variables
│   ├── Visual hierarchy classes
│   ├── Component styles
│   ├── Animation definitions
│   ├── Accessibility features
│   └── Performance optimizations
├── typography-system.css             # Font system
├── asset-performance.css             # Asset-specific styles
└── README.md                         # Documentation
```

### Design Token Structure
```css
:root {
  /* Spectral Colors */
  --spectral-cyan: #00ffff;
  --spectral-amber: #ffb300;
  --spectral-blue: #2196f3;
  
  /* Typography */
  --font-display: 'Orbitron', monospace;
  --font-code: 'Cascadia Code', monospace;
  --font-ui: 'Inter', sans-serif;
  
  /* Spacing (Golden Ratio) */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 0.75rem;
  --space-lg: 1.25rem;
  
  /* Animation Timing */
  --timing-fast: 0.2s;
  --timing-normal: 0.4s;
  --timing-slow: 0.8s;
}
```

## 🧪 Testing Architecture

### Test Organization
```
__tests__/
├── engine/                    # Engine module tests
│   ├── GameEngine.test.ts
│   ├── MeterSystem.test.ts
│   └── ghosts/
├── components/                # Component tests
│   ├── VisualRegression.test.tsx
│   ├── AccessibilityCompliance.test.tsx
│   └── ui/
├── lib/                       # Utility tests
│   ├── VisualPerformance.test.ts
│   ├── CrossBrowserCompatibility.test.ts
│   └── AccessibilityUtils.test.ts
└── integration/               # Integration tests
    ├── GameFlow.test.ts
    └── EncounterWorkflow.test.ts
```

### Test Categories
- **Unit Tests**: Individual modules and functions
- **Integration Tests**: System interactions
- **Visual Regression**: UI consistency
- **Performance Tests**: Animation and memory
- **Accessibility Tests**: WCAG compliance
- **Cross-Browser Tests**: Compatibility validation

## 📦 Asset Management

### Asset Organization
```
public/
├── assets/                    # Game assets
│   ├── images/               # Static images
│   ├── audio/                # Sound effects
│   └── fonts/                # Custom fonts
├── sw.js                     # Service worker
└── manifest.json             # PWA manifest
```

### Asset Pipeline
1. **Validation** - Check format, size, optimization
2. **Optimization** - Compress, convert, resize
3. **Caching** - Service worker and browser cache
4. **Loading** - Progressive loading with fallbacks
5. **Performance** - Monitor usage and impact

## 🔧 Build System

### Build Pipeline
```
npm run build
├── Asset validation          # Check all assets
├── Asset optimization        # Compress and optimize
├── TypeScript compilation    # Type checking
├── Next.js build            # App compilation
├── Bundle analysis          # Size optimization
└── Performance validation   # Speed checks
```

### Development Scripts
```bash
npm run dev              # Development server
npm run build            # Production build
npm run test             # Test suite
npm run lint             # Code linting
npm run validate:assets  # Asset validation
npm run optimize:assets  # Asset optimization
npm run analyze:bundle   # Bundle analysis
```

## 🚀 Deployment Architecture

### Vercel Configuration
- **Build Command**: `npm run build`
- **Output Directory**: `.next`
- **Node Version**: 18.x
- **Regions**: US East, US West
- **Edge Functions**: API routes
- **Static Generation**: Pre-rendered pages

### Performance Optimizations
- **Code Splitting**: Route-based automatic splitting
- **Image Optimization**: Next.js automatic optimization
- **Asset Caching**: Long-term caching with versioning
- **Service Worker**: Offline support and caching
- **Bundle Analysis**: Size monitoring and optimization

## 📊 Monitoring & Analytics

### Performance Tracking
- **Core Web Vitals**: LCP, FID, CLS
- **Custom Metrics**: Game-specific performance
- **Error Tracking**: Runtime error monitoring
- **User Analytics**: Usage patterns and behavior

### Development Metrics
- **Build Times**: CI/CD pipeline performance
- **Test Coverage**: Code coverage tracking
- **Bundle Size**: Asset size monitoring
- **Accessibility**: Compliance validation

---

This structure supports the project's goals of educational gameplay, accessibility, performance, and maintainability while providing clear separation of concerns and scalable architecture.