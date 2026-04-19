import { cn } from '@/lib/utils/cn'

interface SectionCardProps {
  title?: string
  subtitle?: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
  noPadding?: boolean
}

export function SectionCard({ title, subtitle, action, children, className, noPadding }: SectionCardProps) {
  return (
    <div className={cn('bg-white rounded-xl border border-gray-100 shadow-card', noPadding ? '' : 'p-5', className)}>
      {(title || action) && (
        <div className={cn('flex items-center justify-between', noPadding ? 'px-5 pt-5 pb-4' : 'mb-4')}>
          <div>
            {title && <h3 className="text-sm font-semibold text-gray-800">{title}</h3>}
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
