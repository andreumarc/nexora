import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface KpiCardProps {
  label: string
  value: string | number
  badge?: string
  trend?: { pct: number; direction: 'up' | 'down' | 'flat' }
  color?: 'green' | 'red' | 'yellow' | 'blue' | 'neutral' | 'accent'
  compact?: boolean
  className?: string
}

const COLOR_MAP = {
  green: { bar: 'bg-green-500', badge: 'text-green-700 bg-green-50', trend: 'text-green-600' },
  red: { bar: 'bg-red-500', badge: 'text-red-700 bg-red-50', trend: 'text-red-600' },
  yellow: { bar: 'bg-amber-500', badge: 'text-amber-700 bg-amber-50', trend: 'text-amber-600' },
  blue: { bar: 'bg-brand-500', badge: 'text-brand-700 bg-brand-50', trend: 'text-brand-600' },
  neutral: { bar: 'bg-gray-400', badge: 'text-gray-600 bg-gray-100', trend: 'text-gray-500' },
  accent: { bar: 'bg-accent-500', badge: 'text-accent-700 bg-accent-50', trend: 'text-accent-600' },
}

export function KpiCard({ label, value, badge, trend, color = 'blue', compact, className }: KpiCardProps) {
  const colors = COLOR_MAP[color]

  const TrendIcon =
    trend?.direction === 'up'
      ? TrendingUp
      : trend?.direction === 'down'
        ? TrendingDown
        : Minus

  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-gray-100 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 kpi-card',
        compact ? 'p-3.5' : 'p-4',
        className
      )}
    >
      {/* Color bar */}
      <div className={cn('h-0.5 rounded-full mb-3', colors.bar)} />

      <p className={cn('font-medium text-gray-500 truncate', compact ? 'text-xs' : 'text-sm')}>
        {label}
      </p>

      <div className="flex items-end justify-between mt-1.5 gap-2">
        <p className={cn('font-bold text-gray-900 leading-none', compact ? 'text-lg' : 'text-2xl')}>
          {value}
        </p>
        {badge && (
          <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-md', colors.badge)}>
            {badge}
          </span>
        )}
      </div>

      {trend && (
        <div className={cn('flex items-center gap-1 mt-2', colors.trend)}>
          <TrendIcon className="w-3.5 h-3.5" />
          <span className="text-xs font-medium">
            {Math.abs(trend.pct).toFixed(1)}% vs anterior
          </span>
        </div>
      )}
    </div>
  )
}
