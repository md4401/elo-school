import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: ReactNode
  iconRight?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, iconRight, fullWidth, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '_')

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-dark-200">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3 text-dark-400 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 bg-dark-900 border border-dark-600 rounded-lg text-sm text-dark-100 placeholder-dark-500',
              'transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              icon ? 'pl-10 pr-4' : 'px-4',
              iconRight ? 'pr-10' : '',
              error && 'border-red-500/50 focus:ring-red-500/30',
              className
            )}
            {...props}
          />
          {iconRight && (
            <span className="absolute right-3 text-dark-400">
              {iconRight}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-dark-400">{hint}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
