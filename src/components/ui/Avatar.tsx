import { type HTMLAttributes } from 'react'
import { cn, initials, getAvatarUrl } from '@/lib/utils'

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  name: string
  src?: string
  size?: AvatarSize
  online?: boolean
}

const sizeClasses: Record<AvatarSize, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const onlineSizes: Record<AvatarSize, string> = {
  xs: 'w-1.5 h-1.5',
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
  xl: 'w-3.5 h-3.5',
}

export function Avatar({ name, src, size = 'md', online, className, ...props }: AvatarProps) {
  const avatarSrc = src ?? getAvatarUrl(name)
  const fallback = initials(name)

  return (
    <div className={cn('relative shrink-0', className)} {...props}>
      <div
        className={cn(
          'rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center font-semibold text-white border-2 border-dark-700',
          sizeClasses[size]
        )}
      >
        <img
          src={avatarSrc}
          alt={name}
          className="w-full h-full object-cover"
          onError={(e) => {
            const target = e.currentTarget
            target.style.display = 'none'
            const parent = target.parentElement
            if (parent) {
              parent.textContent = fallback
            }
          }}
        />
      </div>
      {online !== undefined && (
        <span
          className={cn(
            'absolute bottom-0 right-0 rounded-full border-2 border-dark-800',
            onlineSizes[size],
            online ? 'bg-green-400' : 'bg-dark-500'
          )}
        />
      )}
    </div>
  )
}
