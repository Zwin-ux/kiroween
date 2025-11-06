/**
 * Asset Validation System
 * 
 * Provides build-time and runtime validation for game assets
 * including existence checks, format validation, and error reporting.
 */

import { assets, assetMetadata, AssetRegistry, AssetCategory } from './assets';

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: ValidationSummary;
}

/**
 * Validation error interface
 */
export interface ValidationError {
  type: 'missing_asset' | 'invalid_format' | 'size_too_large' | 'metadata_mismatch';
  asset: string;
  category: string;
  message: string;
  severity: 'error' | 'warning';
  suggestions?: string[];
}

/**
 * Validation warning interface
 */
export interface ValidationWarning {
  type: 'unused_asset' | 'missing_metadata' | 'suboptimal_size' | 'deprecated_format';
  asset: string;
  message: string;
  suggestions?: string[];
}

/**
 * Validation summary interface
 */
export interface ValidationSummary {
  totalAssets: number;
  validAssets: number;
  missingAssets: number;
  invalidAssets: number;
  warnings: number;
  categories: Record<string, number>;
}

/**
 * Asset validation configuration
 */
export interface ValidationConfig {
  /** Maximum file size in bytes (default: 5MB) */
  maxFileSize: number;
  /** Allowed image formats */
  allowedFormats: string[];
  /** Whether to check for unused assets */
  checkUnused: boolean;
  /** Whether to validate metadata completeness */
  validateMetadata: boolean;
  /** Public directory path for file system checks */
  publicDir: string;
}

/**
 * Default validation configuration
 */
const DEFAULT_CONFIG: ValidationConfig = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedFormats: ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
  checkUnused: true,
  validateMetadata: true,
  publicDir: './public',
};

/**
 * Asset Validator class for comprehensive asset validation
 */
export class AssetValidator {
  private config: ValidationConfig;
  private errors: ValidationError[];
  private warnings: ValidationWarning[];

  constructor(config: Partial<ValidationConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.errors = [];
    this.warnings = [];
  }

  /**
   * Validate all assets in the registry
   */
  async validateAll(): Promise<ValidationResult> {
    this.errors = [];
    this.warnings = [];

    // Validate asset existence and format
    await this.validateAssetExistence();
    
    // Validate asset metadata
    if (this.config.validateMetadata) {
      this.validateMetadata();
    }
    
    // Check for unused assets
    if (this.config.checkUnused) {
      await this.checkUnusedAssets();
    }

    return this.generateResult();
  }

  /**
   * Validate that all referenced assets exist and have correct formats
   * Note: File system validation only works in Node.js environment
   */
  private async validateAssetExistence(): Promise<void> {
    // Skip file system validation in browser environment
    if (typeof window !== 'undefined') {
      console.warn('Asset file system validation skipped in browser environment');
      return;
    }

    try {
      const { existsSync, statSync } = await import('fs');
      const { join } = await import('path');

      Object.entries(assets).forEach(([category, categoryAssets]) => {
        Object.entries(categoryAssets).forEach(([name, assetPath]) => {
          const fullPath = join(this.config.publicDir, assetPath);
          
          // Check if file exists
          if (!existsSync(fullPath)) {
            this.errors.push({
              type: 'missing_asset',
              asset: `${category}.${name}`,
              category,
              message: `Asset file not found: ${assetPath}`,
              severity: 'error',
              suggestions: [
                `Add the file to ${this.config.publicDir}${assetPath}`,
                `Check if the file name matches exactly (case-sensitive)`,
                `Verify the file extension is correct`,
              ],
            });
            return;
          }

          // Validate file format
          const extension = assetPath.toLowerCase().substring(assetPath.lastIndexOf('.'));
          if (!this.config.allowedFormats.includes(extension)) {
            this.errors.push({
              type: 'invalid_format',
              asset: `${category}.${name}`,
              category,
              message: `Invalid file format: ${extension}. Allowed formats: ${this.config.allowedFormats.join(', ')}`,
              severity: 'error',
              suggestions: [
                `Convert the file to one of the supported formats: ${this.config.allowedFormats.join(', ')}`,
                `Use PNG for images with transparency`,
                `Use WebP for better compression`,
              ],
            });
          }

          // Check file size
          try {
            const stats = statSync(fullPath);
            if (stats.size > this.config.maxFileSize) {
              this.warnings.push({
                type: 'suboptimal_size',
                asset: `${category}.${name}`,
                message: `File size (${this.formatBytes(stats.size)}) exceeds recommended maximum (${this.formatBytes(this.config.maxFileSize)})`,
                suggestions: [
                  'Optimize the image using tools like TinyPNG or ImageOptim',
                  'Consider using WebP format for better compression',
                  'Reduce image dimensions if appropriate',
                ],
              });
            }
          } catch (error) {
            // File exists but can't read stats - likely a permission issue
            this.warnings.push({
              type: 'missing_metadata',
              asset: `${category}.${name}`,
              message: `Cannot read file statistics: ${error instanceof Error ? error.message : 'Unknown error'}`,
            });
          }
        });
      });
    } catch (error) {
      console.warn('File system validation not available:', error);
    }
  }

  /**
   * Validate that all assets have corresponding metadata
   */
  private validateMetadata(): void {
    Object.entries(assets).forEach(([category, categoryAssets]) => {
      Object.keys(categoryAssets).forEach((name) => {
        const metadataKey = `${category}.${name}`;
        
        if (!assetMetadata[metadataKey]) {
          this.warnings.push({
            type: 'missing_metadata',
            asset: `${category}.${name}`,
            message: `No metadata found for asset`,
            suggestions: [
              `Add metadata entry in assetMetadata object`,
              `Include description, category, and usage information`,
              `Consider adding visual properties like lighting and tags`,
            ],
          });
        } else {
          const metadata = assetMetadata[metadataKey];
          
          // Validate metadata completeness
          if (!metadata.description) {
            this.warnings.push({
              type: 'missing_metadata',
              asset: `${category}.${name}`,
              message: `Asset metadata missing description`,
              suggestions: ['Add a descriptive description to help developers understand the asset purpose'],
            });
          }
          
          if (!metadata.usage || metadata.usage.length === 0) {
            this.warnings.push({
              type: 'missing_metadata',
              asset: `${category}.${name}`,
              message: `Asset metadata missing usage information`,
              suggestions: ['Add usage array to indicate where and how this asset should be used'],
            });
          }
        }
      });
    });
  }

  /**
   * Check for assets in the public directory that aren't referenced in the registry
   */
  private async checkUnusedAssets(): Promise<void> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      
      // Get all PNG files in public directory
      const publicFiles = fs.readdirSync(this.config.publicDir)
        .filter(file => this.config.allowedFormats.some(ext => file.toLowerCase().endsWith(ext)))
        .map(file => `/${file}`);

      // Get all referenced assets
      const referencedAssets = new Set<string>();
      Object.values(assets).forEach(categoryAssets => {
        Object.values(categoryAssets).forEach(assetPath => {
          referencedAssets.add(assetPath);
        });
      });

      // Find unused assets
      publicFiles.forEach(file => {
        if (!referencedAssets.has(file)) {
          this.warnings.push({
            type: 'unused_asset',
            asset: file,
            message: `Asset file exists but is not referenced in the asset registry`,
            suggestions: [
              'Add the asset to the appropriate category in the asset registry',
              'Remove the file if it\'s no longer needed',
              'Consider if this asset should be used somewhere in the game',
            ],
          });
        }
      });
    } catch (error) {
      // Can't read directory - likely in browser environment
      console.warn('Cannot check for unused assets in browser environment');
    }
  }

  /**
   * Generate validation result summary
   */
  private generateResult(): ValidationResult {
    const totalAssets = Object.values(assets).reduce(
      (total, categoryAssets) => total + Object.keys(categoryAssets).length,
      0
    );

    const categories: Record<string, number> = {};
    Object.entries(assets).forEach(([category, categoryAssets]) => {
      categories[category] = Object.keys(categoryAssets).length;
    });

    const missingAssets = this.errors.filter(e => e.type === 'missing_asset').length;
    const invalidAssets = this.errors.filter(e => e.type !== 'missing_asset').length;

    return {
      isValid: this.errors.length === 0,
      errors: this.errors,
      warnings: this.warnings,
      summary: {
        totalAssets,
        validAssets: totalAssets - missingAssets - invalidAssets,
        missingAssets,
        invalidAssets,
        warnings: this.warnings.length,
        categories,
      },
    };
  }

  /**
   * Format bytes to human readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

/**
 * Validate specific asset by category and name
 */
export async function validateAsset(category: keyof AssetRegistry, name: string): Promise<ValidationError | null> {
  const categoryAssets = assets[category];
  
  if (!categoryAssets || !(name in categoryAssets)) {
    return {
      type: 'missing_asset',
      asset: `${category}.${name}`,
      category,
      message: `Asset not found in registry: ${category}.${name}`,
      severity: 'error',
      suggestions: [
        `Add the asset to the ${category} category in the asset registry`,
        `Check if the asset name is spelled correctly`,
        `Verify the category is correct`,
      ],
    };
  }

  // Skip file system validation in browser environment
  if (typeof window !== 'undefined') {
    return null;
  }

  try {
    const { existsSync } = await import('fs');
    const { join } = await import('path');
    
    const assetPath = (categoryAssets as any)[name];
    const fullPath = join('./public', assetPath);
    
    if (!existsSync(fullPath)) {
      return {
        type: 'missing_asset',
        asset: `${category}.${name}`,
        category,
        message: `Asset file not found: ${assetPath}`,
        severity: 'error',
        suggestions: [
          `Add the file to ./public${assetPath}`,
          `Check if the file name matches exactly (case-sensitive)`,
        ],
      };
    }
  } catch (error) {
    console.warn('File system validation not available:', error);
  }

  return null;
}

/**
 * Runtime asset validation for development
 */
export function validateAssetRuntime(category: keyof AssetRegistry, name: string): boolean {
  const categoryAssets = assets[category];
  
  if (!categoryAssets || !(name in categoryAssets)) {
    console.warn(`[Asset Validator] Asset not found in registry: ${category}.${name}`);
    return false;
  }

  const metadataKey = `${category}.${name}`;
  if (!assetMetadata[metadataKey]) {
    console.warn(`[Asset Validator] No metadata found for asset: ${category}.${name}`);
  }

  return true;
}

/**
 * Generate validation report for console output
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];
  
  lines.push('🎮 Asset Validation Report');
  lines.push('========================');
  lines.push('');
  
  // Summary
  lines.push(`📊 Summary:`);
  lines.push(`   Total Assets: ${result.summary.totalAssets}`);
  lines.push(`   Valid Assets: ${result.summary.validAssets}`);
  lines.push(`   Missing Assets: ${result.summary.missingAssets}`);
  lines.push(`   Invalid Assets: ${result.summary.invalidAssets}`);
  lines.push(`   Warnings: ${result.summary.warnings}`);
  lines.push('');
  
  // Categories
  lines.push(`📁 By Category:`);
  Object.entries(result.summary.categories).forEach(([category, count]) => {
    lines.push(`   ${category}: ${count} assets`);
  });
  lines.push('');
  
  // Errors
  if (result.errors.length > 0) {
    lines.push(`❌ Errors (${result.errors.length}):`);
    result.errors.forEach(error => {
      lines.push(`   • ${error.asset}: ${error.message}`);
      if (error.suggestions) {
        error.suggestions.forEach(suggestion => {
          lines.push(`     💡 ${suggestion}`);
        });
      }
    });
    lines.push('');
  }
  
  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`⚠️  Warnings (${result.warnings.length}):`);
    result.warnings.forEach(warning => {
      lines.push(`   • ${warning.asset}: ${warning.message}`);
      if (warning.suggestions) {
        warning.suggestions.forEach(suggestion => {
          lines.push(`     💡 ${suggestion}`);
        });
      }
    });
    lines.push('');
  }
  
  // Status
  if (result.isValid) {
    lines.push('✅ All assets are valid!');
  } else {
    lines.push('❌ Asset validation failed. Please fix the errors above.');
  }
  
  return lines.join('\n');
}

/**
 * CLI validation function for build scripts
 */
export async function runValidation(): Promise<void> {
  console.log('🔍 Running asset validation...\n');
  
  const validator = new AssetValidator();
  const result = await validator.validateAll();
  
  const report = generateValidationReport(result);
  console.log(report);
  
  if (!result.isValid) {
    process.exit(1);
  }
}