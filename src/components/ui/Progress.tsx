import { cn } from '@/lib/utils'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md' | 'lg'
  color?: 'amber' | 'blue' | 'green' | 'red' | 'purple'
  animated?: boolean
  showLabel?: boolean
  label?: string
  className?: string
}

const sizeClasses = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' }

const colorClasses = {
  amber: 'bg-amber-500',
  blue: 'bg-electric-400',
  green: 'bg-green-500',
  red: 'bg-red-500',
  purple: 'bg-purple-500',
}

export function Progress({ value, max = 100, size = 'md', color = 'amber', animated, showLabel, label, className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && (
        <div className="flex items-center justify-between mb-1.5">
          {label && <span className="text-xs text-dark-400">{label}</span>}
          {showLabel && <span className="text-xs font-medium text-dark-300">{Math.round(pct)}%</span>}
        </div>
      )}
      <div className={cn('w-full bg-dark-700 rounded-full overflow-hidden', sizeClasses[size])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            colorClasses[color],
            animated && 'animate-pulse-soft'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
