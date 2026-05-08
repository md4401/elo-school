import { cn } from '@/lib/utils'

interface SkeletonProps {
  className?: string
  rounded?: boolean
  circle?: boolean
}

export function Skeleton({ className, rounded, circle }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-dark-700 animate-pulse',
        rounded && 'rounded-lg',
        circle ? 'rounded-full' : !rounded && 'rounded',
        className
      )}
    />
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-xl border border-dark-700 bg-dark-800 p-5 space-y-3">
      <div className="flex items-center gap-3">
        <Skeleton circle className="w-10 h-10" />
        <div className="flex-1 space-y-2">
          <Skeleton rounded className="h-4 w-3/4" />
          <Skeleton rounded className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton rounded className="h-3 w-full" />
      <Skeleton rounded className="h-3 w-5/6" />
      <Skeleton rounded className="h-3 w-4/6" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 py-3">
      <Skeleton circle className="w-8 h-8" />
      <div className="flex-1 space-y-2">
        <Skeleton rounded className="h-4 w-48" />
        <Skeleton rounded className="h-3 w-32" />
      </div>
      <Skeleton rounded className="h-6 w-16" />
    </div>
  )
}
