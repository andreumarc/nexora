'use client'

import { Hash, Lock, Megaphone, Wrench, Users, Pin, Info } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface ChannelHeaderProps {
  channel: {
    name: string
    description: string | null
    type: string
    isReadOnly: boolean
    isArchived: boolean
    isOperational: boolean
    clinic: { name: string; code: string | null } | null
    memberCount: number
  }
  pinnedCount?: number
  onTogglePinned?: () => void
  onOpenInfo?: () => void
}

const TYPE_ICONS = {
  PUBLIC: Hash,
  PRIVATE: Lock,
  ANNOUNCEMENT: Megaphone,
  OPERATIONAL: Wrench,
}

const TYPE_LABELS = {
  PUBLIC: 'Canal público',
  PRIVATE: 'Canal privado',
  ANNOUNCEMENT: 'Canal de anuncios',
  OPERATIONAL: 'Canal operativo',
}

export function ChannelHeader({ channel, pinnedCount = 0, onTogglePinned, onOpenInfo }: ChannelHeaderProps) {
  const Icon = TYPE_ICONS[channel.type as keyof typeof TYPE_ICONS] ?? Hash

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Icon + name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <Icon className="w-5 h-5 text-gray-400 flex-shrink-0" />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-semibold text-gray-900 truncate">{channel.name}</h2>
            {channel.clinic && (
              <span className="text-[10px] font-medium text-accent-700 bg-accent-50 border border-accent-100 px-1.5 py-0.5 rounded-full">
                {channel.clinic.name}
              </span>
            )}
            {channel.isArchived && (
              <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                Archivado
              </span>
            )}
            {channel.isReadOnly && (
              <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full">
                Solo lectura
              </span>
            )}
          </div>
          {channel.description && (
            <p className="text-xs text-gray-400 truncate mt-0.5">{channel.description}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {pinnedCount > 0 && (
          <button
            onClick={onTogglePinned}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
            title={`${pinnedCount} mensajes fijados`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{pinnedCount}</span>
          </button>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-400 px-2">
          <Users className="w-3.5 h-3.5" />
          <span>{channel.memberCount}</span>
        </div>
        {onOpenInfo && (
          <button
            onClick={onOpenInfo}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Información del canal"
          >
            <Info className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
