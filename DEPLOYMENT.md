# 🚀 Deployment Guide

This guide covers deploying the KiroWeen Haunted Debug Game to various platforms, with a focus on Vercel.

## 📋 Pre-deployment Checklist

### ✅ Code Quality
- [ ] All TypeScript errors resolved
- [ ] Tests passing (`npm test`)
- [ ] Build successful (`npm run build`)
- [ ] Assets optimized (`npm run optimize:assets`)
- [ ] Bundle size analyzed (`npm run analyze:bundle`)

### ✅ Performance
- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] Images optimized
- [ ] Service Worker configured

### ✅ Accessibility
- [ ] WCAG 2.1 AA compliance verified
- [ ] Screen reader testing completed
- [ ] Keyboard navigation tested
- [ ] Color contrast validated

## 🌐 Vercel Deployment (Recommended)

### Quick Deploy
1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from project root
   vercel --prod
   ```

2. **Automatic Deployment**
   - Push to `main` branch triggers automatic deployment
   - Pull requests create preview deployments
   - Environment variables managed in Vercel dashboard

### Configuration
The project includes optimized `vercel.json` configuration:

- **Build Command**: `cd haunted-debug-game && npm run build`
- **Output Directory**: `haunted-debug-game/.next`
- **Framework**: Next.js with App Router
- **Regions**: US East (iad1) and US West (sfo1)
- **Security Headers**: CSP, XSS protection, frame options
- **Caching**: Optimized for static assets and dynamic content

### Environment Variables
Set in Vercel dashboard:
```bash
# Optional: Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id

# Optional: Error tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## 🐳 Docker Deployment

### Dockerfile
```dockerfile
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY haunted-debug-game/package*.json ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY haunted-debug-game ./

# Build application
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### Docker Commands
```bash
# Build image
docker build -t kiroween .

# Run container
docker run -p 3000:3000 kiroween

# Docker Compose
docker-compose up -d
```

## ☁️ Other Platforms

### Netlify
1. **Build Settings**
   - Build command: `cd haunted-debug-game && npm run build`
   - Publish directory: `haunted-debug-game/.next`
   - Node version: 18

2. **Redirects** (`_redirects` file)
   ```
   /*    /index.html   200
   ```

### AWS Amplify
1. **Build Specification** (`amplify.yml`)
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - cd haunted-debug-game
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: haunted-debug-game/.next
       files:
         - '**/*'
     cache:
       paths:
         - haunted-debug-game/node_modules/**/*
   ```

### Railway
1. **Railway Configuration**
   ```toml
   [build]
   builder = "nixpacks"
   buildCommand = "cd haunted-debug-game && npm run build"
   
   [deploy]
   startCommand = "cd haunted-debug-game && npm start"
   ```

## 🔧 Performance Optimization

### Build Optimization
```bash
# Analyze bundle size
npm run analyze:bundle

# Optimize assets
npm run optimize:assets

# Validate assets
npm run validate:assets
```

### Runtime Optimization
- **Service Worker**: Caches static assets and API responses
- **Image Optimization**: Next.js automatic image optimization
- **Code Splitting**: Automatic route-based splitting
- **Tree Shaking**: Unused code elimination

### Monitoring
- **Vercel Analytics**: Built-in performance monitoring
- **Core Web Vitals**: Automatic tracking
- **Error Tracking**: Optional Sentry integration
- **Performance API**: Custom metrics collection

## 🔒 Security

### Headers
Configured security headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Content Security Policy
```javascript
// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob:;
      font-src 'self';
      connect-src 'self';
    `.replace(/\s{2,}/g, ' ').trim()
  }
];
```

## 📊 Monitoring & Analytics

### Performance Monitoring
- **Vercel Analytics**: Page views, performance metrics
- **Core Web Vitals**: LCP, FID, CLS tracking
- **Custom Metrics**: Game-specific performance data

### Error Tracking
```javascript
// Optional Sentry configuration
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
});
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear cache and rebuild
   rm -rf .next node_modules
   npm install
   npm run build
   ```

2. **Asset Loading Issues**
   ```bash
   # Validate and optimize assets
   npm run validate:assets
   npm run optimize:assets
   ```

3. **Performance Issues**
   ```bash
   # Analyze bundle
   npm run analyze:bundle
   
   # Check performance mode
   # Ensure performance mode is set correctly
   ```

4. **TypeScript Errors**
   ```bash
   # Type check
   npx tsc --noEmit
   
   # Fix common issues
   npm run lint
   ```

### Support
- Check [GitHub Issues](https://github.com/Zwin-ux/kiroween/issues)
- Review deployment logs
- Test locally first: `npm run build && npm start`

---

**Happy Deploying! 🎃**