import { cn } from '@/lib/utils/cn'

interface PresenceDotProps {
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'
  size?: 'sm' | 'md'
  className?: string
}

const STATUS_COLORS = {
  ONLINE: 'bg-green-500',
  AWAY: 'bg-amber-400',
  BUSY: 'bg-red-500',
  OFFLINE: 'bg-gray-300',
}

export function PresenceDot({ status, size = 'sm', className }: PresenceDotProps) {
  return (
    <span
      className={cn(
        'rounded-full border-2 border-white flex-shrink-0',
        STATUS_COLORS[status],
        size === 'sm' ? 'w-2.5 h-2.5' : 'w-3 h-3',
        className
      )}
    />
  )
}

export const PRESENCE_LABELS = {
  ONLINE: 'En línea',
  AWAY: 'Ausente',
  BUSY: 'Ocupado',
  OFFLINE: 'Desconectado',
}
