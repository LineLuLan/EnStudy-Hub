import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        'flex h-9 w-full rounded-md border border-zinc-200 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-zinc-500 focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:placeholder:text-zinc-400',
        className
      )}
      {...props}
    />
  )
);
Input.displayName = 'Input';

export { Input };
