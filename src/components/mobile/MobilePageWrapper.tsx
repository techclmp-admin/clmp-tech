import React from 'react';
import { cn } from '@/lib/utils';
import MobilePageHeader from './MobilePageHeader';

interface MobilePageWrapperProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  fullWidth?: boolean;
}

/**
 * A unified wrapper component for all pages to ensure consistent Mobile Native App styling.
 * Handles edge-to-edge layout on mobile and proper spacing on desktop.
 */
const MobilePageWrapper: React.FC<MobilePageWrapperProps> = ({
  title,
  subtitle,
  actions,
  children,
  className,
  fullWidth = false
}) => {
  return (
    <div className={cn(
      "space-y-4 md:space-y-6",
      !fullWidth && "px-4 pt-4",
      // Add padding bottom for mobile navigation (increased from pb-24 to pb-28)
      "pb-28 md:pb-4",
      className
    )}>
      {/* Page Header */}
      <MobilePageHeader
        title={title}
        subtitle={subtitle}
        actions={actions}
      />
      
      {/* Content */}
      <div className="space-y-4 md:space-y-6">
        {children}
      </div>
    </div>
  );
};

export default MobilePageWrapper;
