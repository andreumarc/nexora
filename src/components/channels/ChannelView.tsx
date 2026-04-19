'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { MessageComposer } from '@/components/chat/MessageComposer'
import { MessageItem } from '@/components/chat/MessageItem'
import { EmptyState } from '@/components/common/EmptyState'
import { ChannelHeader } from './ChannelHeader'
import { formatMessageDate } from '@/lib/utils/format'
import { MessageSquare, Pin } from 'lucide-react'
import { toast } from 'sonner'
import type { MessageWithRelations } from '@/types'

interface PinnedMessage {
  id: string
  content: string
  sender: { firstName: string | null; lastName: string | null; name: string | null }
  pinnedAt: Date | null
}

interface ChannelViewProps {
  channel: {
    id: string
    name: string
    description: string | null
    type: string
    isReadOnly: boolean
    isArchived: boolean
    isOperational: boolean
    clinic: { name: string; code: string | null } | null
    memberCount: number
  }
  initialMessages: MessageWithRelations[]
  pinnedMessages: PinnedMessage[]
  currentUserId: string
  canPin: boolean
  canDeleteAny: boolean
  canSend: boolean
}

export function ChannelView({
  channel,
  initialMessages,
  pinnedMessages,
  currentUserId,
  canPin,
  canDeleteAny,
  canSend,
}: ChannelViewProps) {
  const [messages, setMessages] = useState<MessageWithRelations[]>(initialMessages)
  const [replyTo, setReplyTo] = useState<MessageWithRelations | null>(null)
  const [showPinned, setShowPinned] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(content: string) {
    if (!content.trim()) return

    const optimistic: MessageWithRelations = {
      id: `temp-${Date.now()}`,
      content,
      type: 'TEXT',
      isPinned: false,
      isDeleted: false,
      editedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      parentId: replyTo?.id ?? null,
      sender: {
        id: currentUserId,
        name: 'Tú',
        firstName: null,
        lastName: null,
        avatarUrl: null,
        jobTitle: null,
      },
      reactions: [],
      attachments: [],
      _count: { replies: 0 },
    }

    setMessages((prev) => [...prev, optimistic])
    setReplyTo(null)

    try {
      const res = await fetch(`/api/channels/${channel.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId: replyTo?.id }),
      })

      if (!res.ok) throw new Error()

      const newMessage = await res.json()
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? newMessage : m))
      )
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      toast.error('No se pudo enviar el mensaje. Inténtalo de nuevo.')
    }
  }

  async function handleDelete(messageId: string) {
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: '' } : m
        )
      )
    } catch {
      toast.error('No se pudo eliminar el mensaje.')
    }
  }

  async function handleReact(messageId: string, emoji: string) {
    try {
      await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      })
    } catch {
      toast.error('No se pudo añadir la reacción.')
    }
  }

  // Group messages by date
  const grouped = messages.reduce<{ date: string; messages: MessageWithRelations[] }[]>(
    (acc, msg) => {
      const date = formatMessageDate(msg.createdAt)
      const last = acc[acc.length - 1]
      if (last?.date === date) {
        last.messages.push(msg)
      } else {
        acc.push({ date, messages: [msg] })
      }
      return acc
    },
    []
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <ChannelHeader
        channel={channel}
        pinnedCount={pinnedMessages.length}
        onTogglePinned={() => setShowPinned(!showPinned)}
      />

      {/* Pinned messages bar */}
      {showPinned && pinnedMessages.length > 0 && (
        <div className="border-b border-gray-200 bg-brand-50 px-4 py-2 space-y-1">
          {pinnedMessages.map((pm) => (
            <div key={pm.id} className="pinned-bar rounded-lg">
              <Pin className="w-3.5 h-3.5 text-brand-500 flex-shrink-0" />
              <span className="font-semibold text-brand-700">
                {pm.sender.firstName ?? pm.sender.name}:
              </span>
              <span className="truncate text-brand-600">{pm.content}</span>
            </div>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title={`Bienvenido a #${channel.name}`}
            description={
              channel.description ??
              'Este es el inicio de la conversación. Sé el primero en escribir.'
            }
          />
        ) : (
          <div className="pb-2">
            {grouped.map(({ date, messages: dayMessages }) => (
              <div key={date}>
                {/* Date divider */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 h-px bg-gray-100" />
                  <span className="text-xs font-medium text-gray-400 bg-white px-3 py-1 rounded-full border border-gray-100">
                    {date}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>

                {dayMessages.map((message) => (
                  <MessageItem
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    canPin={canPin}
                    canDeleteAny={canDeleteAny}
                    onReply={setReplyTo}
                    onDelete={handleDelete}
                    onReact={handleReact}
                  />
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Archived notice */}
      {channel.isArchived && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-200 text-sm text-amber-700 text-center">
          Este canal está archivado. Solo puedes leer mensajes anteriores.
        </div>
      )}

      {/* Composer */}
      {canSend && !channel.isArchived ? (
        <MessageComposer
          placeholder={`Mensaje en #${channel.name}`}
          replyTo={
            replyTo
              ? {
                  senderName:
                    replyTo.sender.firstName ??
                    replyTo.sender.name ??
                    'Usuario',
                  content: replyTo.content,
                }
              : null
          }
          onSend={handleSend}
          onCancelReply={() => setReplyTo(null)}
        />
      ) : !channel.isArchived ? (
        <div className="px-4 pb-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400 text-center">
            No tienes permisos para enviar mensajes en este canal.
          </div>
        </div>
      ) : null}
    </div>
  )
}
