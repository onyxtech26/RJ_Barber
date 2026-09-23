import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  label: string;
  value: string;
}

export interface StepIndicatorProps {
  steps: Step[];
  currentStep: string;
  completedSteps: string[];
  className?: string;
}

export function StepIndicator({ steps, currentStep, completedSteps, className }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(step => step.value === currentStep);

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile View */}
      <div className="md:hidden flex flex-col space-y-2">
        <div className="flex justify-between items-center text-sm">
          <span className="font-medium text-foreground">{steps[currentIndex]?.label}</span>
          <span className="text-muted-foreground">Step {currentIndex + 1} of {steps.length}</span>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-in-out" 
            style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop View */}
      <div className="hidden md:flex justify-between items-center relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-secondary -z-10 -translate-y-1/2" />
        
        {steps.map((step, index) => {
          const isCurrent = step.value === currentStep;
          const isCompleted = completedSteps.includes(step.value) || index < currentIndex;
          
          return (
            <div key={step.value} className="flex flex-col items-center relative z-10">
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mb-3 transition-colors duration-300",
                  isCurrent 
                    ? "bg-primary text-primary-foreground ring-4 ring-background" 
                    : isCompleted
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground border-2 border-background"
                )}
              >
                {isCompleted && !isCurrent ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span 
                className={cn(
                  "text-sm absolute top-10 whitespace-nowrap",
                  isCurrent ? "text-primary font-medium" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
