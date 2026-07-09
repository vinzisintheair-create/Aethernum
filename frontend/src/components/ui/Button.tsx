import React, { ButtonHTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-vault-bg disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          // Variant mappings
          {
            'bg-accent hover:bg-accent-dark text-white shadow-lg shadow-accent/15 focus-visible:ring-accent': variant === 'primary',
            'bg-primary-light hover:bg-primary border border-vault-border hover:border-vault-border/80 text-vault-text focus-visible:ring-vault-border': variant === 'secondary',
            'bg-transparent hover:bg-white/5 border border-vault-border text-vault-text focus-visible:ring-vault-border': variant === 'outline',
            'bg-danger hover:bg-red-700 text-white shadow-lg shadow-danger/15 focus-visible:ring-danger': variant === 'danger',
          },
          // Size mappings
          {
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-5 py-2.5 text-sm': size === 'md',
            'px-6 py-3.5 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
