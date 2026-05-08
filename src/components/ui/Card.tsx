import { type HTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  glass?: boolean
  noPadding?: boolean
}

export function Card({ hover, glass, noPadding, className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-dark-700 bg-dark-800',
        !noPadding && 'p-5',
        hover && 'transition-all duration-200 hover:border-dark-600 hover:shadow-card-hover cursor-pointer',
        glass && 'backdrop-blur-sm bg-dark-800/80',
        'dark:bg-dark-800 dark:border-dark-700',
        'light:bg-white light:border-gray-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={cn('flex items-center justify-between pt-4 mt-4 border-t border-dark-700', className)} {...props}>
      {children}
    </div>
  )
}
