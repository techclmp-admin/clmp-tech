import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface SegmentOption {
  value: string;
  label: string;
  icon?: React.ReactNode | LucideIcon;
}

interface MobileSegmentedControlProps {
  options: SegmentOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Grid columns - auto calculates based on options count if not specified */
  columns?: 2 | 3 | 4;
  /** Card variant with larger touch targets and icons */
  variant?: 'default' | 'card';
}

/**
 * Mobile-native grid-based tab control for better discoverability
 * Displays all options in a grid without scrolling
 * Supports 'card' variant with icon + label for mobile native app style
 */
const MobileSegmentedControl: React.FC<MobileSegmentedControlProps> = ({
  options,
  value,
  onChange,
  className,
  size = 'md',
  columns,
  variant = 'default'
}) => {
  // Calculate optimal columns based on options count
  const getOptimalColumns = () => {
    if (columns) return columns;
    const count = options.length;

    // Card variant: keep buttons large (avoid 4 cols unless many options)
    if (variant === 'card') {
      if (count <= 2) return 2;
      if (count <= 4) return 2;
      if (count <= 8) return 3;
      return 4;
    }

    if (count <= 2) return 2;
    if (count <= 4) return 2;
    if (count <= 6) return 3;
    return 4;
  };

  const gridCols = getOptimalColumns();

  const sizeClasses = {
    sm: variant === 'card' ? 'py-3 px-2 text-xs' : 'py-2 px-2 text-xs',
    md: variant === 'card' ? 'py-4 px-3 text-sm' : 'py-2.5 px-3 text-sm',
    lg: variant === 'card' ? 'py-5 px-4 text-base' : 'py-3 px-4 text-base'
  };

  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  // Render icon - handle React nodes, LucideIcon components (ForwardRef), and function components
  const renderIcon = (icon: React.ReactNode | LucideIcon | undefined) => {
    if (!icon) return null;

    // If it's already a valid React element (e.g., <Icon />), render it directly
    if (React.isValidElement(icon)) {
      return icon;
    }

    // Check if it's a component (function or ForwardRef object with $$typeof)
    if (
      typeof icon === 'function' ||
      (typeof icon === 'object' && icon !== null && '$$typeof' in icon)
    ) {
      const IconComponent = icon as LucideIcon;
      return <IconComponent className="h-5 w-5" />;
    }

    // Fallback: return null to avoid rendering invalid objects
    return null;
  };

  if (variant === 'card') {
    return (
      <div className={cn("w-full", className)}>
        <div className={cn(
          "grid gap-2",
          gridColsClass[gridCols]
        )}>
          {options.map((option) => {
            const isActive = value === option.value;
            return (
              <button
                key={option.value}
                onClick={() => onChange(option.value)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-xl font-medium transition-all duration-200 min-h-[72px]",
                  sizeClasses[size],
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-md" 
                    : "bg-muted/60 text-muted-foreground hover:bg-muted active:bg-muted/80"
                )}
              >
                {option.icon && (
                  <span className={cn(isActive ? "text-primary-foreground" : "text-muted-foreground")}>
                    {renderIcon(option.icon)}
                  </span>
                )}
                <span className="truncate text-center leading-tight">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className={cn(
        "grid gap-2 p-1.5 bg-muted/50 rounded-xl",
        gridColsClass[gridCols]
      )}>
        {options.map((option) => {
          const isActive = value === option.value;
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-lg font-medium transition-all duration-200",
                sizeClasses[size],
                isActive 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:text-foreground active:bg-background/50"
              )}
            >
              {option.icon && renderIcon(option.icon)}
              <span className="truncate">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MobileSegmentedControl;
