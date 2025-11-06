/**
 * Asset Error Boundary Component
 * 
 * Provides error boundaries specifically for asset-related components
 * with graceful fallbacks and error reporting.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Asset error boundary state
 */
interface AssetErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
}

/**
 * Props for the asset error boundary
 */
export interface AssetErrorBoundaryProps {
  children: React.ReactNode;
  /** Fallback component to render on error */
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  /** Maximum number of retry attempts */
  maxRetries?: number;
  /** Callback when an error occurs */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Default fallback component for asset errors
 */
const DefaultAssetFallback: React.FC<{ error: Error; retry: () => void }> = ({ error, retry }) => (
  <div className="flex flex-col items-center justify-center p-4 bg-gray-800 border border-red-600 rounded-lg text-center">
    <div className="text-red-400 mb-2">⚠️ Asset Error</div>
    <div className="text-sm text-gray-300 mb-3">
      {error.message || 'Failed to load asset'}
    </div>
    <button
      onClick={retry}
      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
    >
      Retry
    </button>
  </div>
);

/**
 * Asset Error Boundary component
 */
export class AssetErrorBoundary extends React.Component<AssetErrorBoundaryProps, AssetErrorBoundaryState> {
  private retryTimeoutId: NodeJS.Timeout | null = null;

  constructor(props: AssetErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<AssetErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Call error callback if provided
    this.props.onError?.(error, errorInfo);

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Asset Error Boundary caught an error:', error, errorInfo);
    }
  }

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      console.warn(`Asset error boundary: Maximum retry attempts (${maxRetries}) reached`);
      return;
    }

    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1,
    }));

    // Add a small delay before retry to prevent rapid retries
    this.retryTimeoutId = setTimeout(() => {
      this.forceUpdate();
    }, 1000);
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultAssetFallback;
      
      return (
        <div className={cn("asset-error-boundary", this.props.className)}>
          <FallbackComponent 
            error={this.state.error} 
            retry={this.handleRetry}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for handling asset errors in functional components
 */
export function useAssetErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Asset error:', error);
    }
  }, []);

  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  return {
    error,
    retryCount,
    handleError,
    retry,
    reset,
    hasError: error !== null,
  };
}

/**
 * Higher-order component for wrapping components with asset error boundary
 */
export function withAssetErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<AssetErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <AssetErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </AssetErrorBoundary>
  );

  WrappedComponent.displayName = `withAssetErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}