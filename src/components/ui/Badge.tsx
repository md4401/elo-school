import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'amber' | 'outline'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-dark-700 text-dark-200',
  success: 'bg-green-500/15 text-green-400 border border-green-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  danger: 'bg-red-500/15 text-red-400 border border-red-500/20',
  info: 'bg-electric-500/15 text-electric-400 border border-electric-500/20',
  purple: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
  amber: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  outline: 'border border-dark-600 text-dark-300',
}

const sizeClasses = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export function Badge({ variant = 'default', size = 'md', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
