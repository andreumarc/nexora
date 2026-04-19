'use client'

import { useState } from 'react'
import { formatMessageTime } from '@/lib/utils/format'
import { Avatar } from '@/components/common/Avatar'
import { cn } from '@/lib/utils/cn'
import {
  MoreHorizontal,
  Reply,
  Pin,
  Edit2,
  Trash2,
  Smile,
  Check,
} from 'lucide-react'
import type { MessageWithRelations } from '@/types'

interface MessageItemProps {
  message: MessageWithRelations
  currentUserId: string
  canPin?: boolean
  canDeleteAny?: boolean
  onReply?: (message: MessageWithRelations) => void
  onEdit?: (message: MessageWithRelations) => void
  onDelete?: (messageId: string) => void
  onPin?: (messageId: string) => void
  onReact?: (messageId: string, emoji: string) => void
  isThread?: boolean
}

const QUICK_EMOJIS = ['👍', '✅', '❤️', '😂', '🙏']

export function MessageItem({
  message,
  currentUserId,
  canPin,
  canDeleteAny,
  onReply,
  onEdit,
  onDelete,
  onPin,
  onReact,
  isThread,
}: MessageItemProps) {
  const [showActions, setShowActions] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const isOwn = message.sender.id === currentUserId
  const displayName =
    message.sender.firstName && message.sender.lastName
      ? `${message.sender.firstName} ${message.sender.lastName}`
      : message.sender.name ?? 'Usuario'

  const groupedReactions = message.reactions.reduce<Record<string, { count: number; hasOwn: boolean }>>((acc, r) => {
    if (!acc[r.emoji]) acc[r.emoji] = { count: 0, hasOwn: false }
    acc[r.emoji].count++
    if (r.userId === currentUserId) acc[r.emoji].hasOwn = true
    return acc
  }, {})

  if (message.isDeleted) {
    return (
      <div className="px-4 py-1.5">
        <span className="text-xs text-gray-400 italic">Este mensaje fue eliminado</span>
      </div>
    )
  }

  return (
    <div
      className="group relative flex items-start gap-3 px-4 py-1.5 hover:bg-gray-50/60 transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false)
        setShowEmojiPicker(false)
      }}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <Avatar
          name={message.sender.name}
          firstName={message.sender.firstName}
          lastName={message.sender.lastName}
          avatarUrl={message.sender.avatarUrl}
          size="sm"
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-900">{displayName}</span>
          {message.sender.jobTitle && (
            <span className="text-xs text-gray-400">{message.sender.jobTitle}</span>
          )}
          <span className="text-xs text-gray-400">{formatMessageTime(message.createdAt)}</span>
          {message.editedAt && (
            <span className="text-[10px] text-gray-400 italic">(editado)</span>
          )}
          {message.isPinned && (
            <span className="text-[10px] font-medium text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded">
              📌 Fijado
            </span>
          )}
        </div>

        {/* Text content */}
        <p className="mt-0.5 text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">
          {message.content}
        </p>

        {/* Attachments */}
        {message.attachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {message.attachments.map((att) => (
              <a
                key={att.id}
                href={att.publicUrl ?? att.storageKey}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs text-gray-700 font-medium transition-colors max-w-xs"
              >
                <span className="truncate">{att.fileName}</span>
              </a>
            ))}
          </div>
        )}

        {/* Reactions */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {Object.entries(groupedReactions).map(([emoji, { count, hasOwn }]) => (
              <button
                key={emoji}
                onClick={() => onReact?.(message.id, emoji)}
                className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border transition-colors',
                  hasOwn
                    ? 'bg-brand-50 border-brand-200 text-brand-700'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                )}
              >
                {emoji} {count}
              </button>
            ))}
          </div>
        )}

        {/* Thread count */}
        {!isThread && message._count.replies > 0 && (
          <button className="mt-2 flex items-center gap-1.5 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors">
            <Reply className="w-3.5 h-3.5" />
            {message._count.replies} respuesta{message._count.replies !== 1 ? 's' : ''}
          </button>
        )}
      </div>

      {/* Actions overlay */}
      {showActions && (
        <div className="message-actions absolute right-4 top-1 flex items-center gap-0.5 bg-white border border-gray-200 rounded-lg shadow-card-hover px-1 py-0.5 z-10 opacity-100">
          {/* Quick emojis */}
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => onReact?.(message.id, emoji)}
              className="p-1.5 rounded hover:bg-gray-100 text-base leading-none transition-colors"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
          <div className="w-px h-5 bg-gray-200 mx-0.5" />
          {!isThread && (
            <button
              onClick={() => onReply?.(message)}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Responder en hilo"
            >
              <Reply className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
          {isOwn && (
            <button
              onClick={() => onEdit?.(message)}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title="Editar mensaje"
            >
              <Edit2 className="w-3.5 h-3.5 text-gray-500" />
            </button>
          )}
          {canPin && (
            <button
              onClick={() => onPin?.(message.id)}
              className="p-1.5 rounded hover:bg-gray-100 transition-colors"
              title={message.isPinned ? 'Desfijar' : 'Fijar mensaje'}
            >
              <Pin className={cn('w-3.5 h-3.5', message.isPinned ? 'text-brand-500' : 'text-gray-500')} />
            </button>
          )}
          {(isOwn || canDeleteAny) && (
            <button
              onClick={() => onDelete?.(message.id)}
              className="p-1.5 rounded hover:bg-red-50 transition-colors"
              title="Eliminar mensaje"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
