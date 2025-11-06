# 🤝 Contributing to KiroWeen

Thank you for your interest in contributing to the KiroWeen Haunted Debug Game! This guide will help you get started.

## 🎯 Code of Conduct

This project follows a Code of Conduct to ensure a welcoming environment for all contributors. Please be respectful and constructive in all interactions.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm 8+
- Git
- Basic knowledge of TypeScript, React, and Next.js

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/kiroween.git
   cd kiroween
   ```

2. **Install Dependencies**
   ```bash
   cd haunted-debug-game
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📋 Development Guidelines

### Code Style
- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Follow the configured rules
- **Prettier**: Code formatting (run `npm run lint`)
- **Naming**: Use descriptive names, PascalCase for components, camelCase for functions

### Architecture Principles
- **Engine Layer**: Pure TypeScript, no React dependencies
- **Component Layer**: React components that consume engine modules
- **State Management**: Zustand for global state, React state for local UI state
- **Performance**: Maintain 60 FPS target for animations

### File Organization
```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
│   ├── ui/             # Base UI components
│   ├── examples/       # Demo components
│   └── dev/            # Development tools
├── engine/             # Game engine (pure TypeScript)
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── store/              # Zustand state management
├── styles/             # CSS files
└── types/              # TypeScript definitions
```

## 🎮 Contributing Areas

### 🐛 Bug Fixes
- Check existing issues before creating new ones
- Include reproduction steps and environment details
- Write tests for bug fixes when possible

### ✨ New Features
- Discuss major features in issues first
- Follow the existing game mechanics and visual design
- Ensure accessibility compliance (WCAG 2.1 AA)
- Add comprehensive tests

### 🎨 Visual Improvements
- Maintain the spectral theme (cyan/amber/blue palette)
- Ensure 60 FPS performance target
- Test across different devices and browsers
- Respect reduced motion preferences

### 🧪 Testing
- Write unit tests for engine modules
- Add integration tests for component interactions
- Include accessibility tests for new UI components
- Performance tests for animations and effects

### 📚 Documentation
- Update README for new features
- Add inline code comments for complex logic
- Create examples for new components
- Update deployment guides as needed

## 🔄 Pull Request Process

### Before Submitting
1. **Run the full test suite**
   ```bash
   npm test
   npm run lint
   npm run build
   ```

2. **Check accessibility**
   ```bash
   npm test -- --testNamePattern="Accessibility"
   ```

3. **Validate performance**
   ```bash
   npm test -- --testNamePattern="Performance"
   ```

### PR Guidelines
- **Title**: Use descriptive titles (e.g., "Add particle system performance optimization")
- **Description**: Explain what changes were made and why
- **Screenshots**: Include before/after screenshots for visual changes
- **Testing**: Describe how the changes were tested
- **Breaking Changes**: Clearly mark any breaking changes

### PR Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Performance improvement
- [ ] Documentation update
- [ ] Refactoring

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Accessibility tests pass
- [ ] Performance tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Before/after screenshots

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

## 🎨 Design System

### Visual Hierarchy
- **Primary**: Spectral cyan (#00ffff) - Maximum attention
- **Secondary**: Spectral blue (#2196f3) - Important elements  
- **Tertiary**: Muted cyan - Supporting information
- **Danger**: Red (#ff1744) - Critical states
- **Warning**: Orange (#ff6d00) - Caution states
- **Success**: Green (#00e676) - Positive states

### Typography
- **Display**: Orbitron (headings, important text)
- **Code**: Cascadia Code (terminal, code blocks)
- **UI**: Inter (body text, interface elements)

### Animation Guidelines
- **Performance**: 60 FPS target, GPU acceleration
- **Timing**: Use CSS custom properties for consistent timing
- **Accessibility**: Respect `prefers-reduced-motion`
- **Purpose**: Animations should enhance UX, not distract

## 🧪 Testing Standards

### Coverage Goals
- **Engine modules**: 90%+ coverage
- **UI components**: 80%+ coverage
- **Integration tests**: 70%+ coverage

### Test Categories
```bash
# Unit tests
npm test -- --testPathPattern="__tests__"

# Integration tests
npm test -- --testPathPattern="Integration"

# Accessibility tests
npm test -- --testNamePattern="Accessibility"

# Performance tests
npm test -- --testNamePattern="Performance"

# Visual regression tests
npm test -- --testNamePattern="VisualRegression"
```

### Writing Tests
- **Descriptive names**: Test names should explain what is being tested
- **Arrange-Act-Assert**: Clear test structure
- **Mock external dependencies**: Keep tests isolated
- **Test edge cases**: Include error conditions and boundary values

## 🚀 Release Process

### Version Numbering
- **Major**: Breaking changes (v2.0.0)
- **Minor**: New features (v1.1.0)
- **Patch**: Bug fixes (v1.0.1)

### Release Checklist
- [ ] All tests passing
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json

## 🎃 Halloween Theme Guidelines

### Atmosphere
- **Spooky but not scary**: Educational game, not horror
- **Phosphor glow aesthetic**: Terminal/CRT inspired
- **Subtle horror elements**: Breathing shadows, spectral effects
- **Professional quality**: Polished, not cheesy

### Educational Focus
- **Learning first**: Game mechanics should teach debugging
- **Real-world relevance**: Use actual software engineering concepts
- **Progressive difficulty**: Start simple, build complexity
- **Positive reinforcement**: Celebrate learning achievements

## 📞 Getting Help

### Communication Channels
- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Request Comments**: Code-specific discussions

### Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Performance Best Practices](https://web.dev/performance/)

## 🏆 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes for significant contributions
- GitHub contributor graphs
- Special mentions for major features

---

**Thank you for contributing to KiroWeen! 🎃👻**