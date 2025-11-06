/**
 * Asset Inspector Component (Development Only)
 * 
 * Visual debugging tool for inspecting asset usage, performance,
 * and optimization opportunities during development.
 */

import * as React from "react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { assetDebugger, AssetDebugInfo, AssetPerformanceMetrics } from "@/lib/assetDebugger";
import { assets, AssetRegistry } from "@/lib/assets";
import { GameAsset } from "@/components/ui/GameAsset";

/**
 * Asset Inspector Props
 */
interface AssetInspectorProps {
  /** Whether the inspector is visible */
  isVisible: boolean;
  /** Callback to close the inspector */
  onClose: () => void;
}

/**
 * Asset Inspector Component (Development Only)
 */
export const AssetInspector: React.FC<AssetInspectorProps> = ({ isVisible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assets' | 'performance' | 'validation'>('overview');
  const [assetDebugInfo, setAssetDebugInfo] = useState<AssetDebugInfo[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<AssetPerformanceMetrics | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  // Refresh data
  const refreshData = () => {
    setAssetDebugInfo(assetDebugger.getAllAssetDebugInfo());
    setPerformanceMetrics(assetDebugger.getPerformanceMetrics());
    setRefreshKey(prev => prev + 1);
  };

  // Auto-refresh data when visible
  useEffect(() => {
    if (isVisible) {
      refreshData();
      const interval = setInterval(refreshData, 2000);
      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const stats = assetDebugger.getUsageStats();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-4 bg-gray-900 border border-red-600 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-red-400">🎮 Asset Inspector</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshData}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={() => assetDebugger.clearStats()}
              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white text-sm rounded transition-colors"
            >
              Clear Stats
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700">
          {[
            { id: 'overview', label: '📊 Overview' },
            { id: 'assets', label: '🖼️ Assets' },
            { id: 'performance', label: '⚡ Performance' },
            { id: 'validation', label: '✅ Validation' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-red-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-800"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {activeTab === 'overview' && (
            <OverviewTab stats={stats} assetDebugInfo={assetDebugInfo} />
          )}
          {activeTab === 'assets' && (
            <AssetsTab assetDebugInfo={assetDebugInfo} />
          )}
          {activeTab === 'performance' && (
            <PerformanceTab metrics={performanceMetrics} />
          )}
          {activeTab === 'validation' && (
            <ValidationTab assetDebugInfo={assetDebugInfo} />
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Overview Tab Component
 */
const OverviewTab: React.FC<{ stats: any; assetDebugInfo: AssetDebugInfo[] }> = ({ stats, assetDebugInfo }) => {
  const suggestions = assetDebugger.getOptimizationSuggestions();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Assets" value={stats.totalAssets} color="blue" />
        <StatCard title="Loaded" value={stats.loadedAssets.size} color="green" />
        <StatCard title="Failed" value={stats.failedAssets.size} color="red" />
        <StatCard title="Avg Load Time" value={`${stats.averageLoadTime.toFixed(1)}ms`} color="yellow" />
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-white mb-3">Assets by Category</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {Object.entries(stats.categoryCounts).map(([category, count]) => (
            <div key={category} className="bg-gray-700 rounded p-2 text-center">
              <div className="text-sm text-gray-400 capitalize">{category}</div>
              <div className="text-lg font-bold text-white">{count as number}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Optimization Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-400 mb-3">💡 Optimization Suggestions</h3>
          <ul className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <li key={index} className="text-yellow-200 text-sm">
                • {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

/**
 * Assets Tab Component
 */
const AssetsTab: React.FC<{ assetDebugInfo: AssetDebugInfo[] }> = ({ assetDebugInfo }) => {
  const [filter, setFilter] = useState<'all' | 'loaded' | 'failed' | 'fallback'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredAssets = assetDebugInfo.filter(asset => {
    if (categoryFilter !== 'all' && asset.category !== categoryFilter) return false;
    
    switch (filter) {
      case 'loaded': return asset.isLoaded;
      case 'failed': return asset.hasFailed;
      case 'fallback': return asset.fallbackCount > 0;
      default: return true;
    }
  });

  const categories = ['all', ...Object.keys(assets)];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white"
        >
          <option value="all">All Assets</option>
          <option value="loaded">Loaded Only</option>
          <option value="failed">Failed Only</option>
          <option value="fallback">Using Fallbacks</option>
        </select>
        
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-gray-800 border border-gray-600 rounded px-3 py-1 text-white"
        >
          {categories.map(category => (
            <option key={category} value={category}>
              {category === 'all' ? 'All Categories' : category}
            </option>
          ))}
        </select>
      </div>

      {/* Asset List */}
      <div className="grid gap-2 max-h-96 overflow-auto">
        {filteredAssets.map(asset => (
          <AssetDebugCard key={`${asset.category}.${asset.name}`} asset={asset} />
        ))}
      </div>
    </div>
  );
};

/**
 * Performance Tab Component
 */
const PerformanceTab: React.FC<{ metrics: AssetPerformanceMetrics | null }> = ({ metrics }) => {
  if (!metrics) return <div className="text-gray-400">No performance data available</div>;

  return (
    <div className="space-y-6">
      {/* Slowest Assets */}
      {metrics.slowestAssets.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">🐌 Slowest Loading Assets</h3>
          <div className="space-y-2">
            {metrics.slowestAssets.map((asset, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700 rounded p-2">
                <span className="text-sm text-gray-300 font-mono">{asset.path}</span>
                <span className="text-sm text-red-400">{asset.loadTime.toFixed(1)}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Most Failed Assets */}
      {metrics.mostFailedAssets.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">❌ Most Failed Assets</h3>
          <div className="space-y-2">
            {metrics.mostFailedAssets.map((asset, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700 rounded p-2">
                <span className="text-sm text-gray-300 font-mono">{asset.path}</span>
                <span className="text-sm text-red-400">{asset.failures} failures</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fallback Usage */}
      {metrics.fallbackUsageStats.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">🔄 Fallback Usage</h3>
          <div className="space-y-2">
            {metrics.fallbackUsageStats.map((asset, index) => (
              <div key={index} className="flex justify-between items-center bg-gray-700 rounded p-2">
                <span className="text-sm text-gray-300 font-mono">{asset.path}</span>
                <span className="text-sm text-yellow-400">{asset.fallbackCount} fallbacks</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Validation Tab Component
 */
const ValidationTab: React.FC<{ assetDebugInfo: AssetDebugInfo[] }> = ({ assetDebugInfo }) => {
  const validAssets = assetDebugInfo.filter(asset => !asset.hasFailed && asset.metadata);
  const invalidAssets = assetDebugInfo.filter(asset => asset.hasFailed || !asset.metadata);

  return (
    <div className="space-y-6">
      {/* Validation Summary */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard title="Valid Assets" value={validAssets.length} color="green" />
        <StatCard title="Invalid Assets" value={invalidAssets.length} color="red" />
      </div>

      {/* Invalid Assets */}
      {invalidAssets.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-3">❌ Invalid Assets</h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {invalidAssets.map(asset => (
              <div key={`${asset.category}.${asset.name}`} className="bg-red-900/20 border border-red-600 rounded p-2">
                <div className="text-sm text-red-400 font-mono">{asset.category}.{asset.name}</div>
                <div className="text-xs text-gray-400">
                  {asset.hasFailed && "Failed to load"} 
                  {asset.hasFailed && !asset.metadata && " • "}
                  {!asset.metadata && "Missing metadata"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Stat Card Component
 */
const StatCard: React.FC<{ title: string; value: string | number; color: string }> = ({ title, value, color }) => {
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
 * Asset Debug Card Component
 */
const AssetDebugCard: React.FC<{ asset: AssetDebugInfo }> = ({ asset }) => {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="bg-gray-800 border border-gray-600 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-mono text-white">
            {asset.category}.{asset.name}
          </div>
          <div className="text-xs text-gray-400">{asset.path}</div>
          {asset.metadata?.description && (
            <div className="text-xs text-gray-500 mt-1">{asset.metadata.description}</div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* Status indicators */}
          {asset.isLoaded && <span className="text-green-400 text-xs">✓ Loaded</span>}
          {asset.hasFailed && <span className="text-red-400 text-xs">✗ Failed</span>}
          {asset.fallbackCount > 0 && <span className="text-yellow-400 text-xs">🔄 {asset.fallbackCount}</span>}
          {asset.loadTime && <span className="text-blue-400 text-xs">{asset.loadTime.toFixed(1)}ms</span>}
          
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="text-xs text-gray-400 hover:text-white"
          >
            {showPreview ? 'Hide' : 'Preview'}
          </button>
        </div>
      </div>
      
      {/* Preview */}
      {showPreview && (
        <div className="mt-2 p-2 bg-gray-700 rounded">
          <GameAsset
            category={asset.category as keyof AssetRegistry}
            name={asset.name}
            alt={`Preview of ${asset.name}`}
            className="max-w-24 max-h-24 object-contain"
          />
        </div>
      )}
    </div>
  );
};

/**
 * Hook to toggle asset inspector
 */
export function useAssetInspector() {
  const [isVisible, setIsVisible] = useState(false);

  // Keyboard shortcut to toggle inspector (Ctrl+Shift+A)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'A') {
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