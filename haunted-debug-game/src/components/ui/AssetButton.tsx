/**
 * AssetButton Component - Enhanced button with integrated icon assets
 * 
 * Extends the base Button component to include icon assets from the asset registry
 * with hover states, interaction feedback, and consistent styling.
 */

import * as React from "react";
import { Button, ButtonProps, buttonVariants } from "./button";
import { IconAsset } from "./GameAsset";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

/**
 * Props interface for the AssetButton component
 */
export interface AssetButtonProps extends ButtonProps {
  /** Icon asset name from the icons category */
  icon?: string;
  /** Icon position relative to text */
  iconPosition?: 'left' | 'right' | 'only';
  /** Icon size variant */
  iconSize?: 'sm' | 'md' | 'lg';
  /** Whether to show hover effects on the icon */
  iconHover?: boolean;
  /** Loading state */
  loading?: boolean;
  /** Success state (shows checkmark) */
  success?: boolean;
  /** Error state (shows error icon) */
  error?: boolean;
}

/**
 * AssetButton component with integrated icon assets
 */
export const AssetButton = React.forwardRef<HTMLButtonElement, AssetButtonProps>(
  ({ 
    children,
    icon,
    iconPosition = 'left',
    iconSize = 'md',
    iconHover = true,
    loading = false,
    success = false,
    error = false,
    className,
    disabled,
    ...props 
  }, ref) => {
    // Determine which icon to show based on state
    const getDisplayIcon = () => {
      if (loading) return 'asset'; // Use asset icon as loading indicator
      if (success) return 'ghost'; // Use ghost icon as success indicator
      if (error) return 'asset'; // Use asset icon as error indicator
      return icon;
    };

    const displayIcon = getDisplayIcon();
    const isIconOnly = iconPosition === 'only' || (!children && displayIcon);
    const showIcon = displayIcon && !disabled;

    // Icon component with hover effects
    const IconComponent = showIcon ? (
      <IconAsset
        iconName={displayIcon}
        size={iconSize}
        className={cn(
          "transition-all duration-200",
          iconHover && "group-hover:scale-110",
          loading && "animate-pulse",
          success && "text-green-400",
          error && "text-red-400",
          !isIconOnly && iconPosition === 'left' && "mr-2",
          !isIconOnly && iconPosition === 'right' && "ml-2"
        )}
      />
    ) : null;

    return (
      <Button
        ref={ref}
        className={cn(
          "group relative overflow-hidden",
          // Add extra padding for icons
          showIcon && !isIconOnly && "px-6",
          // Icon-only button styling
          isIconOnly && "aspect-square",
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-current opacity-20 animate-pulse" />
        )}
        
        {/* Icon and text content */}
        <div className="flex items-center justify-center">
          {iconPosition === 'left' && IconComponent}
          {!isIconOnly && children}
          {iconPosition === 'right' && IconComponent}
          {isIconOnly && IconComponent}
        </div>
        
        {/* Success/Error state overlay */}
        {(success || error) && (
          <div 
            className={cn(
              "absolute inset-0 opacity-20 transition-opacity duration-300",
              success && "bg-green-500",
              error && "bg-red-500"
            )}
          />
        )}
      </Button>
    );
  }
);

AssetButton.displayName = "AssetButton";

/**
 * Specialized button variants with predefined icons and styling
 */

export const GhostButton = React.forwardRef<HTMLButtonElement, Omit<AssetButtonProps, 'icon'>>(
  (props, ref) => (
    <AssetButton
      ref={ref}
      icon="ghost"
      variant="horror"
      {...props}
    />
  )
);
GhostButton.displayName = "GhostButton";

export const AssetIconButton = React.forwardRef<HTMLButtonElement, Omit<AssetButtonProps, 'icon'>>(
  (props, ref) => (
    <AssetButton
      ref={ref}
      icon="asset"
      variant="outline"
      {...props}
    />
  )
);
AssetIconButton.displayName = "AssetIconButton";

/**
 * Button group component for consistent spacing and styling
 */
export interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'sm' | 'md' | 'lg';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'md',
}) => {
  const spacingClasses = {
    sm: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    md: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    lg: orientation === 'horizontal' ? 'space-x-6' : 'space-y-6',
  };

  return (
    <div 
      className={cn(
        "flex",
        orientation === 'horizontal' ? 'flex-row items-center' : 'flex-col',
        spacingClasses[spacing],
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * Status indicator button that changes icon based on state
 */
export interface StatusButtonProps extends Omit<AssetButtonProps, 'icon' | 'success' | 'error'> {
  status: 'idle' | 'active' | 'success' | 'error' | 'warning';
}

export const StatusButton = React.forwardRef<HTMLButtonElement, StatusButtonProps>(
  ({ status, className, ...props }, ref) => {
    const getStatusConfig = (status: StatusButtonProps['status']) => {
      switch (status) {
        case 'idle':
          return { icon: 'asset', variant: 'outline' as const };
        case 'active':
          return { icon: 'ghost', variant: 'horror' as const };
        case 'success':
          return { icon: 'ghost', variant: 'default' as const, success: true };
        case 'error':
          return { icon: 'asset', variant: 'destructive' as const, error: true };
        case 'warning':
          return { icon: 'asset', variant: 'outline' as const };
        default:
          return { icon: 'asset', variant: 'outline' as const };
      }
    };

    const config = getStatusConfig(status);

    return (
      <AssetButton
        ref={ref}
        className={cn(
          "transition-all duration-300",
          status === 'active' && "animate-pulse",
          className
        )}
        {...config}
        {...props}
      />
    );
  }
);
StatusButton.displayName = "StatusButton";