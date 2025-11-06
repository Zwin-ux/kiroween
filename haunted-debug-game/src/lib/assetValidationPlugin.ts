/**
 * Next.js Asset Validation Plugin
 * 
 * Integrates asset validation into the Next.js build process
 * to catch asset issues before deployment.
 */

import { AssetValidator, generateValidationReport } from './assetValidator';

/**
 * Next.js plugin configuration
 */
export interface AssetValidationPluginConfig {
  /** Whether to fail the build on validation errors */
  failOnError: boolean;
  /** Whether to show warnings in the console */
  showWarnings: boolean;
  /** Whether to generate a validation report file */
  generateReport: boolean;
  /** Path to save the validation report */
  reportPath: string;
}

/**
 * Default plugin configuration
 */
const DEFAULT_CONFIG: AssetValidationPluginConfig = {
  failOnError: true,
  showWarnings: true,
  generateReport: false,
  reportPath: './asset-validation-report.txt',
};

/**
 * Asset validation plugin for Next.js
 */
export function withAssetValidation(nextConfig: any = {}, pluginConfig: Partial<AssetValidationPluginConfig> = {}) {
  const config = { ...DEFAULT_CONFIG, ...pluginConfig };
  
  return {
    ...nextConfig,
    webpack: (webpackConfig: any, { dev, isServer }: { dev: boolean; isServer: boolean }) => {
      // Only run validation during build (not in dev mode) and on server side
      if (!dev && isServer) {
        webpackConfig.plugins = webpackConfig.plugins || [];
        
        webpackConfig.plugins.push({
          apply: (compiler: any) => {
            compiler.hooks.beforeCompile.tapAsync('AssetValidationPlugin', async (params: any, callback: any) => {
              try {
                console.log('🔍 Validating game assets...');
                
                const validator = new AssetValidator();
                const result = await validator.validateAll();
                
                if (config.showWarnings || !result.isValid) {
                  const report = generateValidationReport(result);
                  console.log(report);
                }
                
                if (config.generateReport) {
                  const fs = await import('fs');
                  const report = generateValidationReport(result);
                  fs.writeFileSync(config.reportPath, report);
                  console.log(`📄 Validation report saved to ${config.reportPath}`);
                }
                
                if (!result.isValid && config.failOnError) {
                  callback(new Error('Asset validation failed. Please fix the errors above.'));
                  return;
                }
                
                callback();
              } catch (error) {
                console.error('Asset validation plugin error:', error);
                if (config.failOnError) {
                  callback(error);
                } else {
                  callback();
                }
              }
            });
          },
        });
      }
      
      // Call the original webpack function if it exists
      if (typeof nextConfig.webpack === 'function') {
        return nextConfig.webpack(webpackConfig, { dev, isServer });
      }
      
      return webpackConfig;
    },
  };
}

/**
 * Standalone validation function for build scripts
 */
export async function validateAssetsForBuild(): Promise<boolean> {
  try {
    console.log('🔍 Running asset validation for build...');
    
    const validator = new AssetValidator();
    const result = await validator.validateAll();
    
    const report = generateValidationReport(result);
    console.log(report);
    
    return result.isValid;
  } catch (error) {
    console.error('Asset validation error:', error);
    return false;
  }
}