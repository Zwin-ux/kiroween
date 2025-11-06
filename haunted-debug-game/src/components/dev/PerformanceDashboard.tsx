/**
 * Performance Dashboard Component (Development Only)
 * 
 * Real-time performance monitoring dashboard for asset loading metrics,
 * cache performance, and optimization insights.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAssetPerformanceMonitor, PerformanceStats } from "@/lib/assetPerformanceMonitor";
import { useAssetCache } from "@/lib/assetCache";

/**
 * Performance Dashboard Props
 */
interface PerformanceDashboardProps {
  /** Whether the dashboard is visible */
  isVisible: boolean;
  /** Callback to close the dashboard */
  onClose: () => void;
}

/**
 * Performance Dashboard Component (Development Only)
 */
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isVisible, onClose }) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const performanceMonitor = useAssetPerformanceMonitor();
  const { getStats: getCacheStats, clearCache } = useAssetCache();

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Auto-refresh stats
  useEffect(() => {
    if (!isVisible) return;

    const updateStats = () => {
      setStats(performanceMonitor.getStats());
    };

    updateStats(); // Initial load
    const interval = setInterval(updateStats, refreshInterval);

    return () => clearInterval(interval);
  }, [isVisible, refreshInterval, performanceMonitor]);

  if (!isVisible) return null;

  const cacheStats = getCacheStats();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-4 bg-gray-900 border border-blue-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-blue-400">📊 Performance Dashboard</h2>
          <div className="flex items-center gap-2">
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm"
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            <button
              onClick={() => performanceMonitor.clearMetrics()}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
            >
              Clear Metrics
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {stats ? (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  title="Total Requests"
                  value={stats.totalRequests}
                  color="blue"
                />
                <MetricCard
                  title="Success Rate"
                  value={`${((stats.successfulRequests / Math.max(stats.totalRequests, 1)) * 100).toFixed(1)}%`}
                  color={stats.successfulRequests / Math.max(stats.totalRequests, 1) > 0.95 ? "green" : "yellow"}
                />
                <MetricCard
                  title="Avg Load Time"
                  value={`${stats.averageLoadTime.toFixed(1)}ms`}
                  color={stats.averageLoadTime < 500 ? "green" : stats.averageLoadTime < 1000 ? "yellow" : "red"}
                />
                <MetricCard
                  title="Cache Hit Rate"
                  value={`${(stats.cacheHitRate * 100).toFixed(1)}%`}
                  color={stats.cacheHitRate > 0.8 ? "green" : stats.cacheHitRate > 0.5 ? "yellow" : "red"}
                />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Load Time Distribution */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Load Time Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Average:</span>
                      <span className="text-white">{stats.averageLoadTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Median:</span>
                      <span className="text-white">{stats.medianLoadTime.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">95th Percentile:</span>
                      <span className="text-white">{stats.p95LoadTime.toFixed(1)}ms</span>
                    </div>
                  </div>
                </div>

                {/* Data Transfer */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">Data Transfer</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Total Loaded:</span>
                      <span className="text-white">{formatBytes(stats.totalBytesLoaded)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cache Entries:</span>
                      <span className="text-white">{cacheStats.totalEntries}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Cache Size:</span>
                      <span className="text-white">{formatBytes(cacheStats.totalSize)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Performance */}
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-3">Performance by Category</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-2 text-gray-400">Category</th>
                        <th className="text-right py-2 text-gray-400">Requests</th>
                        <th className="text-right py-2 text-gray-400">Avg Time</th>
                        <th className="text-right py-2 text-gray-400">Cache Hit</th>
                        <th className="text-right py-2 text-gray-400">Failure Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(stats.categoryStats).map(([category, categoryStats]) => (
                        <tr key={category} className="border-b border-gray-700/50">
                          <td className="py-2 text-white capitalize">{category}</td>
                          <td className="py-2 text-right text-gray-300">{categoryStats.requests}</td>
                          <td className="py-2 text-right text-gray-300">{categoryStats.averageLoadTime.toFixed(1)}ms</td>
                          <td className="py-2 text-right text-gray-300">{(categoryStats.cacheHitRate * 100).toFixed(1)}%</td>
                          <td className="py-2 text-right">
                            <span className={cn(
                              categoryStats.failureRate < 0.05 ? "text-green-400" :
                              categoryStats.failureRate < 0.15 ? "text-yellow-400" : "text-red-400"
                            )}>
                              {(categoryStats.failureRate * 100).toFixed(1)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Slowest Assets */}
              {stats.slowestAssets.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">🐌 Slowest Assets</h3>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {stats.slowestAssets.slice(0, 10).map((asset, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-700 rounded p-2">
                        <div className="flex-1">
                          <div className="text-sm text-white font-mono">{asset.category}.{asset.name}</div>
                          <div className="text-xs text-gray-400">{asset.url}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-red-400">{asset.duration.toFixed(1)}ms</div>
                          {asset.size > 0 && (
                            <div className="text-xs text-gray-400">{formatBytes(asset.size)}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Largest Assets */}
              {stats.largestAssets.length > 0 && (
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">📦 Largest Assets</h3>
                  <div className="space-y-2 max-h-48 overflow-auto">
                    {stats.largestAssets.slice(0, 10).map((asset, index) => (
                      <div key={index} className="flex justify-between items-center bg-gray-700 rounded p-2">
                        <div className="flex-1">
                          <div className="text-sm text-white font-mono">{asset.category}.{asset.name}</div>
                          <div className="text-xs text-gray-400">{asset.url}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-orange-400">{formatBytes(asset.size)}</div>
                          <div className="text-xs text-gray-400">{asset.duration.toFixed(1)}ms</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Recommendations */}
              <PerformanceRecommendations stats={stats} cacheStats={cacheStats} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400">Loading performance data...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Metric Card Component
 */
const MetricCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => {
  const colorClasses = {
    blue: 'border-blue-600 text-blue-400',
    green: 'border-green-600 text-green-400',
    red: 'border-red-600 text-red-400',
    yellow: 'border-yellow-600 text-yellow-400',
  };

  return (
    <div className={cn("bg-gray-800 border rounded-lg p-3", colorClasses[color as keyof typeof colorClasses])}>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-xl font-bold">{value}</div>
    </div>
  );
};

/**
 * Performance Recommendations Component
 */
const PerformanceRecommendations: React.FC<{ stats: PerformanceStats; cacheStats: any }> = ({ stats, cacheStats }) => {
  const recommendations: string[] = [];

  // Analyze performance and generate recommendations
  if (stats.averageLoadTime > 1000) {
    recommendations.push("Consider optimizing asset sizes - average load time is high");
  }

  if (stats.cacheHitRate < 0.7) {
    recommendations.push("Cache hit rate is low - consider preloading critical assets");
  }

  if (stats.failedRequests / Math.max(stats.totalRequests, 1) > 0.1) {
    recommendations.push("High failure rate detected - check asset availability");
  }

  if (stats.totalBytesLoaded > 10 * 1024 * 1024) { // 10MB
    recommendations.push("Large amount of data loaded - consider lazy loading non-critical assets");
  }

  if (stats.slowestAssets.length > 0 && stats.slowestAssets[0].duration > 2000) {
    recommendations.push(`Slowest asset (${stats.slowestAssets[0].category}.${stats.slowestAssets[0].name}) takes ${stats.slowestAssets[0].duration.toFixed(1)}ms - consider optimization`);
  }

  if (recommendations.length === 0) {
    recommendations.push("Performance looks good! 🎉");
  }

  return (
    <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-blue-400 mb-3">💡 Performance Recommendations</h3>
      <ul className="space-y-2">
        {recommendations.map((recommendation, index) => (
          <li key={index} className="text-blue-200 text-sm">
            • {recommendation}
          </li>
        ))}
      </ul>
    </div>
  );
};

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Hook to toggle performance dashboard
 */
export function usePerformanceDashboard() {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle dashboard (Ctrl+Shift+P)
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'P') {
        event.preventDefault();
        setIsVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return {
    isVisible,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev),
  };
}