/**
 * Progress component for meter displays using Radix UI
 */

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: 'stability' | 'insight' | 'default';
  }
>(({ className, value, variant = 'default', ...props }, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case 'stability':
        return {
          root: "bg-red-900/20 border border-red-800",
          indicator: value && value < 30 
            ? "bg-red-500 animate-pulse" 
            : "bg-red-400"
        };
      case 'insight':
        return {
          root: "bg-blue-900/20 border border-blue-800",
          indicator: "bg-blue-400"
        };
      default:
        return {
          root: "bg-secondary",
          indicator: "bg-primary"
        };
    }
  };

  const variantClasses = getVariantClasses();

  return (
    <ProgressPrimitive.Root
      ref={ref}
      className={cn(
        "relative h-4 w-full overflow-hidden rounded-full",
        variantClasses.root,
        className
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn(
          "h-full w-full flex-1 transition-all",
          variantClasses.indicator
        )}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
});
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };