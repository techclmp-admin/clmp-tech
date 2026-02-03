import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface MobileActionButtonProps {
  label: string;
  icon?: LucideIcon;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  fullWidth?: boolean;
}

/**
 * Mobile-native action button with proper touch targets
 */
const MobileActionButton: React.FC<MobileActionButtonProps> = ({
  label,
  icon: Icon,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className,
  fullWidth = false
}) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";
  
  const variantClasses = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/90",
    outline: "border-2 border-border bg-transparent hover:bg-muted",
    ghost: "hover:bg-muted"
  };
  
  const sizeClasses = {
    sm: "h-9 px-3 text-sm",
    md: "h-11 px-4 text-sm",
    lg: "h-12 px-6 text-base"
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && "w-full",
        className
      )}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      <span>{label}</span>
    </button>
  );
};

export default MobileActionButton;
