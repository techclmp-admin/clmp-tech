import React from 'react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface MobileProgressCardProps {
  title: string;
  status: string;
  statusColor?: 'success' | 'warning' | 'danger' | 'default';
  progress: number;
  className?: string;
}

/**
 * Mobile-native progress card with status indicator
 */
const MobileProgressCard: React.FC<MobileProgressCardProps> = ({
  title,
  status,
  statusColor = 'default',
  progress,
  className
}) => {
  const colorClasses = {
    success: 'text-green-500',
    warning: 'text-orange-500',
    danger: 'text-destructive',
    default: 'text-foreground'
  };

  const progressColorClasses = {
    success: '[&>div]:bg-green-500',
    warning: '[&>div]:bg-orange-500',
    danger: '[&>div]:bg-destructive',
    default: '[&>div]:bg-primary'
  };

  return (
    <div className={cn(
      "rounded-2xl p-4 bg-card border border-border space-y-3",
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </p>
      </div>
      
      <p className={cn(
        "text-xl font-bold",
        colorClasses[statusColor]
      )}>
        {status}
      </p>
      
      <Progress 
        value={Math.min(progress, 100)} 
        className={cn(
          "h-2 rounded-full",
          progressColorClasses[statusColor]
        )} 
      />
    </div>
  );
};

export default MobileProgressCard;
