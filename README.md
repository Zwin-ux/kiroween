# 🎃 KiroWeen: Haunted Debug Game

A spooky educational debugging game built for Halloween, where players navigate through haunted code repositories to fix software bugs while learning about software engineering principles.

## 🌟 Features

### 🎮 Core Gameplay
- **Interactive Ghost Encounters**: Face different types of software "ghosts" representing common bugs and code smells
- **Dynamic Patch System**: Generate and apply code fixes with real-time feedback
- **Educational Progression**: Learn debugging techniques through hands-on experience
- **Atmospheric Horror Theme**: Immersive spooky experience with spectral visual effects

### 🎨 Visual System
- **Spectral Design Language**: Custom phosphor-glow aesthetic with cyan/amber color palette
- **Advanced Animations**: 60 FPS breathing shadows, particle effects, and CRT-style terminals
- **Responsive Design**: Optimized for desktop and mobile devices
- **Performance Modes**: Adaptive rendering based on device capabilities

### ♿ Accessibility
- **WCAG 2.1 AA Compliant**: Full accessibility support with screen readers
- **Reduced Motion Support**: Respects user preferences for motion sensitivity
- **High Contrast Mode**: Enhanced visibility options
- **Keyboard Navigation**: Complete keyboard accessibility

### 🧪 Testing & Quality
- **Comprehensive Test Suite**: Visual regression, performance, and accessibility testing
- **Cross-Browser Compatibility**: Tested across Chrome, Firefox, Safari, and Edge
- **Performance Monitoring**: Real-time FPS and memory usage tracking
- **Type Safety**: Full TypeScript implementation with strict mode

## 🚀 Tech Stack

- **Framework**: Next.js 16.0.1 with App Router
- **Language**: TypeScript 5 with strict mode
- **Styling**: Tailwind CSS 4 with custom spectral theme
- **State Management**: Zustand 5.0.8 with localStorage persistence
- **Animations**: Framer Motion 12.23.24 for 60 FPS effects
- **UI Components**: Radix UI primitives for accessibility
- **Testing**: Jest with React Testing Library
- **Deployment**: Optimized for Vercel

## 🛠️ Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/Zwin-ux/kiroween.git
cd kiroween

# Navigate to the game directory
cd haunted-debug-game

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev          # Start development server
npm run dev:turbo    # Start with Turbopack (faster)

# Building
npm run build        # Full production build with validation
npm run build:fast   # Quick build without asset validation
npm run start        # Start production server

# Testing
npm test             # Run test suite
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report

# Asset Management
npm run validate:assets    # Validate all game assets
npm run optimize:assets    # Optimize assets for production
npm run analyze:bundle     # Analyze bundle size
```

## 🎯 Game Mechanics

### Ghost Types
- **Data Leak Ghost**: Teaches about data privacy and security
- **Circular Dependency Ghost**: Explores architectural patterns
- **Stale Cache Ghost**: Covers caching strategies and invalidation
- **Prompt Injection Ghost**: Security-focused debugging scenarios
- **Unbounded Recursion Ghost**: Performance and algorithm optimization

### Player Actions
- **Apply**: Direct implementation of suggested patches
- **Refactor**: Alternative approach requiring deeper code changes  
- **Question**: Seek clarification or challenge assumptions

### Progression System
- **Stability Meter**: Tracks code health and system integrity (0-100)
- **Insight Meter**: Measures debugging understanding and progress (0-100)
- **Evidence Board**: Collects debugging decisions and learning outcomes
- **Room Progression**: Unlock new areas by completing encounters

## 🎨 Visual Design

### Spectral Theme
- **Primary Colors**: Spectral cyan (#00ffff), amber (#ffb300), blue (#2196f3)
- **Typography**: Orbitron display font, Cascadia Code monospace
- **Effects**: Breathing shadows, particle systems, CRT scanlines
- **Performance**: GPU-accelerated animations with fallbacks

### Accessibility Features
- **Color Contrast**: Minimum 4.5:1 ratio for all text
- **Focus Indicators**: Clear visual focus states for keyboard navigation
- **Screen Reader Support**: Comprehensive ARIA labels and live regions
- **Motion Controls**: User preference respect with disable options

## 📱 Deployment

### Vercel Deployment
The project is optimized for Vercel deployment with:

- **Static Generation**: Pre-rendered pages for optimal performance
- **Edge Functions**: Server-side logic at the edge
- **Asset Optimization**: Automatic image and bundle optimization
- **Analytics**: Built-in performance monitoring

### Environment Variables
```bash
# Optional: Analytics and monitoring
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id
```

## 🧪 Testing Strategy

### Test Categories
- **Unit Tests**: Engine modules and utility functions
- **Integration Tests**: Component interactions and game flow
- **Visual Regression**: Screenshot comparison for UI consistency
- **Performance Tests**: FPS monitoring and memory usage validation
- **Accessibility Tests**: WCAG compliance and screen reader compatibility
- **Cross-Browser Tests**: Feature detection and graceful degradation

### Coverage Goals
- **Engine Layer**: 90%+ coverage for game logic
- **Component Layer**: 80%+ coverage for UI components
- **Integration**: 70%+ coverage for system interactions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript strict mode requirements
- Maintain 60 FPS performance target
- Ensure WCAG 2.1 AA accessibility compliance
- Write tests for new features
- Use semantic commit messages

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎃 Halloween Special

Built with spooky love for the Halloween season! This educational game combines the thrill of horror aesthetics with practical software engineering learning.

---

**Happy Debugging! 👻**