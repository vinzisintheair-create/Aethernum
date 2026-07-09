import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverEffect = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "glass-panel rounded-xl p-6 transition-all duration-300",
          {
            'hover:border-vault-border/80 hover:shadow-2xl hover:shadow-black/25 hover:-translate-y-0.5': hoverEffect,
          },
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = 'Card';
