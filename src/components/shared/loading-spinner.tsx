import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
  centered?: boolean;
}

const sizeMap = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

export function LoadingSpinner({ size = 'md', label, className, centered = true }: LoadingSpinnerProps) {
  const containerClasses = centered ? 'flex flex-col items-center justify-center w-full h-full p-8' : 'inline-flex items-center gap-2';

  return (
    <div className={cn(containerClasses, className)}>
      <Loader2 className={cn("animate-spin text-primary", sizeMap[size])} />
      {label && (
        <span className={cn("text-muted-foreground", size === 'sm' ? 'text-xs' : 'text-sm mt-2')}>
          {label}
        </span>
      )}
    </div>
  );
}
