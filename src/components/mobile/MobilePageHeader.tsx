import React from 'react';
import { cn } from '@/lib/utils';

interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Mobile-native page header component
 * - Compact title styling
 * - Inline actions for mobile
 */
const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  subtitle,
  actions,
  className
}) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Title Row */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight truncate">
          {title}
        </h1>
        {/* Mobile: Actions appear inline */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
      
      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm md:text-base text-muted-foreground line-clamp-2">
          {subtitle}
        </p>
      )}
    </div>
  );
};

export default MobilePageHeader;
