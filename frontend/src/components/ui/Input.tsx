import React, { InputHTMLAttributes, useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, type = 'text', ...props }, ref) => {
    const defaultId = useId();
    const id = props.id || defaultId;
    const errorId = `${id}-error`;

    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label
          htmlFor={id}
          className="text-xs font-semibold uppercase tracking-wider text-vault-muted select-none"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          type={type}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            "w-full px-4 py-3 bg-primary-dark/40 border border-vault-border/60 hover:border-vault-border/90 rounded-lg text-sm text-vault-text placeholder-vault-muted/40 transition-all focus:border-accent focus:ring-1 focus:ring-accent",
            {
              'border-danger focus:border-danger focus:ring-danger': !!error,
            },
            className
          )}
          {...props}
        />
        {error && (
          <span
            id={errorId}
            role="alert"
            className="text-xs text-danger font-medium mt-0.5"
          >
            {error}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
