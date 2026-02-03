import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MobileCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle?: string;
  icon?: LucideIcon | React.ReactElement;
  iconClassName?: string;
  className?: string;
  variant?: 'default' | 'filled' | 'outline';
  onClick?: () => void;
}

/**
 * Mobile-native summary card with native app styling
 */
const MobileCard: React.FC<MobileCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconClassName,
  className,
  variant = 'default',
  onClick
}) => {
  const isClickable = !!onClick;
  
  // Render the icon - check if it's a valid React element or a component
  const renderIcon = () => {
    if (!icon) return null;
    
    // If it's already a React element (JSX), render it directly
    if (React.isValidElement(icon)) {
      return icon;
    }
    
    // If it's a LucideIcon component (function/ForwardRef), render it as JSX
    const IconComponent = icon as LucideIcon;
    return <IconComponent className="w-5 h-5 text-muted-foreground" />;
  };
  
  return (
    <div 
      className={cn(
        "rounded-2xl p-4 transition-all duration-200",
        // Base styling
        variant === 'default' && "bg-card border border-border",
        variant === 'filled' && "bg-muted",
        variant === 'outline' && "border-2 border-border bg-transparent",
        // Clickable states
        isClickable && "active:scale-[0.98] cursor-pointer",
        className
      )}
      onClick={onClick}
      role={isClickable ? 'button' : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1">
          {/* Title */}
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {title}
          </p>
          
          {/* Value */}
          <div className="text-xl md:text-2xl font-bold truncate">
            {value}
          </div>
          
          {/* Subtitle */}
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">
              {subtitle}
            </p>
          )}
        </div>
        
        {/* Icon */}
        {icon && (
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            "bg-muted/50",
            iconClassName
          )}>
            {renderIcon()}
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileCard;
