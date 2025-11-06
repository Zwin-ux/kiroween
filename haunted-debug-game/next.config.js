/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@radix-ui/react-dialog', '@radix-ui/react-progress'],
  },

  // Turbopack configuration (Next.js 16+ default)
  turbopack: {
    // Empty config to silence the warning - Turbopack handles assets automatically
  },

  // Image optimization configuration
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Asset optimization
  assetPrefix: process.env.NODE_ENV === 'production' ? '/assets' : '',

  // Headers for asset caching
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          }
        ],
      },
      {
        // Cache static assets for 1 year
        source: '/(.*)\\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // Cache service worker
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ];
  },

  // Webpack configuration for asset optimization (fallback for non-Turbopack builds)
  webpack: (config, { dev, isServer }) => {
    // Only apply webpack config if not using Turbopack
    if (process.env.TURBOPACK !== '1') {
      // Bundle analyzer
      if (process.env.ANALYZE === 'true') {
        const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
        config.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            openAnalyzer: true,
            reportFilename: '../bundle-analysis.html',
          })
        );
      }

      // Optimize asset loading in production
      if (!dev && !isServer) {
        // Enhanced code splitting for assets
        config.optimization.splitChunks = {
          ...config.optimization.splitChunks,
          cacheGroups: {
            ...config.optimization.splitChunks.cacheGroups,
            // Critical assets bundle
            criticalAssets: {
              test: /\/(Compiler Room|asset icon|icon_ghost_surprised)\.(png|jpg|jpeg|gif|webp|svg)$/,
              name: 'critical-assets',
              chunks: 'all',
              priority: 20,
              enforce: true,
            },
            // Regular assets bundle
            assets: {
              test: /\.(png|jpg|jpeg|gif|webp|svg)$/,
              name: 'assets',
              chunks: 'all',
              priority: 10,
              minSize: 0,
            },
            // Vendor libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 5,
            },
          },
        };

        // Asset optimization plugin
        config.plugins.push({
          apply: (compiler) => {
            compiler.hooks.afterEmit.tap('AssetOptimizationPlugin', (compilation) => {
              const assets = Object.keys(compilation.assets);
              const imageAssets = assets.filter(asset => 
                /\.(png|jpg|jpeg|gif|webp|svg)$/.test(asset)
              );
              const totalSize = Object.values(compilation.assets)
                .reduce((sum, asset) => sum + asset.size(), 0);
              
              console.log(`📦 Built ${imageAssets.length} optimized assets`);
              console.log(`📊 Total bundle size: ${formatBytes(totalSize)}`);
              
              // Generate asset manifest
              const assetManifest = {
                timestamp: new Date().toISOString(),
                totalAssets: assets.length,
                imageAssets: imageAssets.length,
                totalSize,
                assets: imageAssets.map(asset => ({
                  name: asset,
                  size: compilation.assets[asset].size(),
                })),
              };
              
              compilation.assets['asset-manifest.json'] = {
                source: () => JSON.stringify(assetManifest, null, 2),
                size: () => JSON.stringify(assetManifest, null, 2).length,
              };
            });
          },
        });

        // Tree shaking optimization
        config.optimization.usedExports = true;
        config.optimization.sideEffects = false;
      }

      // Enhanced asset handling
      config.module.rules.push({
        test: /\.(png|jpg|jpeg|gif|webp|svg)$/,
        use: [
          {
            loader: 'file-loader',
            options: {
              publicPath: '/_next/static/images/',
              outputPath: 'static/images/',
              name: dev ? '[name].[ext]' : '[name].[contenthash:8].[ext]',
            },
          },
          // Add image optimization loader in production
          ...(!dev ? [{
            loader: 'image-webpack-loader',
            options: {
              mozjpeg: { progressive: true, quality: 85 },
              optipng: { enabled: true },
              pngquant: { quality: [0.65, 0.90], speed: 4 },
              gifsicle: { interlaced: false },
              webp: { quality: 85 },
            },
          }] : []),
        ],
      });
    }

    return config;
  },

  // Enable compression
  compress: true,

  // Power optimizations
  poweredByHeader: false,

  // Output configuration to silence workspace root warning
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),

  // Generate service worker manifest
  generateBuildId: async () => {
    // Use timestamp for cache busting
    return `build-${Date.now()}`;
  },

  // Redirect configuration for asset optimization
  async redirects() {
    return [
      // Redirect old asset paths if needed
    ];
  },

  // Rewrite configuration for asset serving
  async rewrites() {
    return [
      // Serve assets from optimized paths
      {
        source: '/assets/:path*',
        destination: '/:path*',
      },
    ];
  },
};

module.exports = nextConfig;