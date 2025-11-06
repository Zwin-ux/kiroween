/**
 * Performance tests for ghost image rendering
 */

import { preloadImage } from '@/lib/assets';

describe('Ghost Image Performance', () => {
  beforeEach(() => {
    // Mock Image constructor for testing
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      
      constructor() {
        // Simulate successful image load after short delay
        setTimeout(() => {
          if (this.onload) {
            this.onload();
          }
        }, 10);
      }
    } as any;
  });

  test('preloadImage should resolve quickly for valid images', async () => {
    const startTime = performance.now();
    
    await preloadImage('/icon_ghost_surprised.png');
    
    const endTime = performance.now();
    const loadTime = endTime - startTime;
    
    // Should complete within reasonable time (allowing for test environment)
    expect(loadTime).toBeLessThan(100);
  });

  test('multiple ghost images should load concurrently', async () => {
    const startTime = performance.now();
    
    const imagePromises = [
      preloadImage('/icon_ghost_surprised.png'),
      preloadImage('/icon_ghost_surprised.png'),
      preloadImage('/icon_ghost_surprised.png'),
    ];
    
    await Promise.all(imagePromises);
    
    const endTime = performance.now();
    const totalTime = endTime - startTime;
    
    // Concurrent loading should not be significantly slower than single load
    expect(totalTime).toBeLessThan(150);
  });

  test('ghost image loading should handle errors gracefully', async () => {
    // Mock failed image load
    global.Image = class {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      src: string = '';
      
      constructor() {
        setTimeout(() => {
          if (this.onerror) {
            this.onerror();
          }
        }, 10);
      }
    } as any;

    await expect(preloadImage('/nonexistent.png')).rejects.toThrow('Failed to load image');
  });
});