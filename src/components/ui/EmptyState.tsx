import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-dark-700 flex items-center justify-center mb-4 text-dark-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-dark-200 mb-1">{title}</h3>
      {description && <p className="text-sm text-dark-400 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
