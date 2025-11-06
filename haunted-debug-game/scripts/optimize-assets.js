#!/usr/bin/env node

/**
 * Asset Optimization Build Script
 * 
 * Optimizes assets for production builds including format conversion,
 * compression, and bundle analysis.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Configuration
 */
const CONFIG = {
  publicDir: './public',
  outputDir: './public/optimized',
  formats: ['webp', 'avif'],
  quality: 85,
  enableCompression: true,
  generateManifest: true,
};

/**
 * Asset optimization results
 */
const optimizationResults = {
  processed: 0,
  optimized: 0,
  errors: 0,
  totalSizeBefore: 0,
  totalSizeAfter: 0,
  formats: {},
};

/**
 * Main optimization function
 */
async function optimizeAssets() {
  console.log('🎨 Starting asset optimization...');
  
  try {
    // Create output directory
    if (!fs.existsSync(CONFIG.outputDir)) {
      fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    }

    // Find all image assets
    const imageFiles = findImageFiles(CONFIG.publicDir);
    console.log(`📁 Found ${imageFiles.length} image files`);

    // Process each image
    for (const filePath of imageFiles) {
      await processImage(filePath);
    }

    // Generate optimization manifest
    if (CONFIG.generateManifest) {
      generateOptimizationManifest();
    }

    // Print results
    printOptimizationResults();

  } catch (error) {
    console.error('❌ Asset optimization failed:', error);
    process.exit(1);
  }
}

/**
 * Find all image files in directory
 */
function findImageFiles(dir) {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif'];
  const files = [];

  function scanDirectory(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      
      if (entry.isDirectory() && entry.name !== 'optimized') {
        scanDirectory(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  scanDirectory(dir);
  return files;
}

/**
 * Process individual image file
 */
async function processImage(filePath) {
  try {
    optimizationResults.processed++;
    
    const relativePath = path.relative(CONFIG.publicDir, filePath);
    const fileName = path.basename(filePath, path.extname(filePath));
    const outputDir = path.join(CONFIG.outputDir, path.dirname(relativePath));
    
    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Get original file size
    const originalStats = fs.statSync(filePath);
    optimizationResults.totalSizeBefore += originalStats.size;

    let optimized = false;

    // Generate WebP version if supported
    if (CONFIG.formats.includes('webp')) {
      const webpPath = path.join(outputDir, `${fileName}.webp`);
      
      try {
        // Use sharp or imagemin for actual conversion (mock for now)
        console.log(`🔄 Converting ${relativePath} to WebP...`);
        
        // Mock conversion - in real implementation, use sharp:
        // await sharp(filePath).webp({ quality: CONFIG.quality }).toFile(webpPath);
        
        // For now, just copy the file with .webp extension for demonstration
        fs.copyFileSync(filePath, webpPath);
        
        const webpStats = fs.statSync(webpPath);
        optimizationResults.totalSizeAfter += webpStats.size;
        
        if (!optimizationResults.formats.webp) {
          optimizationResults.formats.webp = 0;
        }
        optimizationResults.formats.webp++;
        
        optimized = true;
      } catch (error) {
        console.warn(`⚠️ Failed to convert ${relativePath} to WebP:`, error.message);
      }
    }

    // Generate AVIF version if supported
    if (CONFIG.formats.includes('avif')) {
      const avifPath = path.join(outputDir, `${fileName}.avif`);
      
      try {
        console.log(`🔄 Converting ${relativePath} to AVIF...`);
        
        // Mock conversion - in real implementation, use sharp:
        // await sharp(filePath).avif({ quality: CONFIG.quality }).toFile(avifPath);
        
        // For now, just copy the file with .avif extension for demonstration
        fs.copyFileSync(filePath, avifPath);
        
        const avifStats = fs.statSync(avifPath);
        optimizationResults.totalSizeAfter += avifStats.size;
        
        if (!optimizationResults.formats.avif) {
          optimizationResults.formats.avif = 0;
        }
        optimizationResults.formats.avif++;
        
        optimized = true;
      } catch (error) {
        console.warn(`⚠️ Failed to convert ${relativePath} to AVIF:`, error.message);
      }
    }

    // Copy original file to optimized directory
    const originalOutputPath = path.join(outputDir, path.basename(filePath));
    fs.copyFileSync(filePath, originalOutputPath);
    optimizationResults.totalSizeAfter += originalStats.size;

    if (optimized) {
      optimizationResults.optimized++;
    }

  } catch (error) {
    console.error(`❌ Failed to process ${filePath}:`, error);
    optimizationResults.errors++;
  }
}

/**
 * Generate optimization manifest
 */
function generateOptimizationManifest() {
  const manifest = {
    timestamp: new Date().toISOString(),
    buildId: `build-${Date.now()}`,
    optimization: {
      ...optimizationResults,
      compressionRatio: optimizationResults.totalSizeBefore > 0 
        ? (1 - optimizationResults.totalSizeAfter / optimizationResults.totalSizeBefore) * 100 
        : 0,
    },
    config: CONFIG,
  };

  const manifestPath = path.join(CONFIG.outputDir, 'optimization-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  
  console.log(`📄 Optimization manifest saved to ${manifestPath}`);
}

/**
 * Print optimization results
 */
function printOptimizationResults() {
  console.log('\n📊 Asset Optimization Results:');
  console.log('================================');
  console.log(`Files Processed: ${optimizationResults.processed}`);
  console.log(`Files Optimized: ${optimizationResults.optimized}`);
  console.log(`Errors: ${optimizationResults.errors}`);
  console.log(`Original Size: ${formatBytes(optimizationResults.totalSizeBefore)}`);
  console.log(`Optimized Size: ${formatBytes(optimizationResults.totalSizeAfter)}`);
  
  if (optimizationResults.totalSizeBefore > 0) {
    const savings = optimizationResults.totalSizeBefore - optimizationResults.totalSizeAfter;
    const percentage = (savings / optimizationResults.totalSizeBefore) * 100;
    console.log(`Size Savings: ${formatBytes(savings)} (${percentage.toFixed(1)}%)`);
  }
  
  console.log('\nFormats Generated:');
  Object.entries(optimizationResults.formats).forEach(([format, count]) => {
    console.log(`  ${format.toUpperCase()}: ${count} files`);
  });
  
  console.log('\n✅ Asset optimization complete!');
}

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

/**
 * Check if required tools are available
 */
function checkDependencies() {
  const requiredTools = [];
  
  // In a real implementation, check for sharp, imagemin, etc.
  // For now, we'll just log that we're using mock optimization
  console.log('ℹ️ Using mock optimization (install sharp for real optimization)');
  
  return requiredTools;
}

// Run optimization if called directly
if (require.main === module) {
  const missingDeps = checkDependencies();
  
  if (missingDeps.length > 0) {
    console.error('❌ Missing dependencies:', missingDeps.join(', '));
    console.log('Install with: npm install sharp imagemin imagemin-webp imagemin-avif');
    process.exit(1);
  }
  
  optimizeAssets().catch((error) => {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  });
}

module.exports = { optimizeAssets, CONFIG };