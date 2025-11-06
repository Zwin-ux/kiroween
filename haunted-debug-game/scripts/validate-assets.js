#!/usr/bin/env node

/**
 * Asset Validation Build Script
 * 
 * Runs asset validation during build process to catch missing or invalid assets
 * before deployment. Can be integrated into CI/CD pipelines.
 */

const path = require('path');

// Set up TypeScript compilation
require('ts-node').register({
  project: path.join(__dirname, '../tsconfig.json'),
  compilerOptions: {
    module: 'commonjs',
    target: 'es2020',
    moduleResolution: 'node',
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
    skipLibCheck: true,
  },
});

// Import and run validation
const { runValidation } = require('../src/lib/assetValidator');

// Run validation
runValidation().catch((error) => {
  console.error('Asset validation failed:', error);
  process.exit(1);
});