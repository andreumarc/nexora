import { cn } from '@/lib/utils/cn'
import { getInitials } from '@/lib/utils/format'

interface AvatarProps {
  name?: string | null
  firstName?: string | null
  lastName?: string | null
  avatarUrl?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_MAP = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
  xl: 'w-14 h-14 text-lg',
}

export function Avatar({ name, firstName, lastName, avatarUrl, size = 'md', className }: AvatarProps) {
  const initials = getInitials(name, firstName, lastName)

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name ?? initials}
        className={cn('rounded-full object-cover flex-shrink-0', SIZE_MAP[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0',
        SIZE_MAP[size],
        className
      )}
      style={{ background: '#0d9488' }}
    >
      {initials}
    </div>
  )
}
