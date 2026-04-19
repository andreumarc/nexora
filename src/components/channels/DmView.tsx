'use client'

import { useState, useEffect, useRef } from 'react'
import { MessageComposer } from '@/components/chat/MessageComposer'
import { MessageItem } from '@/components/chat/MessageItem'
import { EmptyState } from '@/components/common/EmptyState'
import { Avatar } from '@/components/common/Avatar'
import { formatMessageDate } from '@/lib/utils/format'
import { MessageSquare, Users, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import type { MessageWithRelations } from '@/types'

interface DmMember {
  id: string
  name: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  jobTitle: string | null
}

interface DmViewProps {
  conversationId: string
  title: string
  isGroup: boolean
  members: DmMember[]
  initialMessages: MessageWithRelations[]
  currentUserId: string
}

export function DmView({ conversationId, title, isGroup, members, initialMessages, currentUserId }: DmViewProps) {
  const [messages, setMessages] = useState<MessageWithRelations[]>(initialMessages)
  const [replyTo, setReplyTo] = useState<MessageWithRelations | null>(null)
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
      sender: { id: currentUserId, name: 'Tú', firstName: null, lastName: null, avatarUrl: null, jobTitle: null },
      reactions: [],
      attachments: [],
      _count: { replies: 0 },
    }

    setMessages((prev) => [...prev, optimistic])
    setReplyTo(null)

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentId: replyTo?.id }),
      })
      if (!res.ok) throw new Error()
      const newMsg = await res.json()
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? newMsg : m)))
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id))
      toast.error('No se pudo enviar el mensaje.')
    }
  }

  async function handleDelete(messageId: string) {
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' })
      setMessages((prev) => prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, content: '' } : m)))
    } catch {
      toast.error('No se pudo eliminar el mensaje.')
    }
  }

  const grouped = messages.reduce<{ date: string; messages: MessageWithRelations[] }[]>((acc, msg) => {
    const date = formatMessageDate(msg.createdAt)
    const last = acc[acc.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      acc.push({ date, messages: [msg] })
    }
    return acc
  }, [])

  const otherMember = !isGroup ? members.find((m) => m.id !== currentUserId) : null

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="h-14 border-b border-gray-200 bg-white flex items-center px-4 gap-3 flex-shrink-0">
        <Link href="/mensajes" className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-4 h-4 text-gray-500" />
        </Link>
        {isGroup ? (
          <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-brand-600" />
          </div>
        ) : (
          <Avatar
            name={otherMember?.name}
            firstName={otherMember?.firstName}
            lastName={otherMember?.lastName}
            avatarUrl={otherMember?.avatarUrl}
            size="sm"
          />
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
          {!isGroup && otherMember?.jobTitle && (
            <p className="text-xs text-gray-400 truncate">{otherMember.jobTitle}</p>
          )}
          {isGroup && (
            <p className="text-xs text-gray-400">{members.length} participantes</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="Empieza la conversación"
            description="Empieza una conversación directa con esta persona."
          />
        ) : (
          grouped.map(({ date, messages: dayMsgs }) => (
            <div key={date}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium px-2">{date}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="space-y-1">
                {dayMsgs.map((msg) => (
                  <MessageItem
                    key={msg.id}
                    message={msg}
                    currentUserId={currentUserId}
                    canPin={false}
                    canDeleteAny={false}
                    onDelete={handleDelete}
                    onReply={setReplyTo}
                    onReact={() => {}}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      {replyTo && (
        <div className="px-4 py-2 bg-brand-50 border-t border-brand-100 flex items-center justify-between text-xs text-brand-700">
          <span>Respondiendo a <strong>{replyTo.sender.firstName ?? replyTo.sender.name}</strong></span>
          <button onClick={() => setReplyTo(null)} className="text-brand-500 hover:text-brand-700 font-medium">✕</button>
        </div>
      )}
      <MessageComposer
        onSend={handleSend}
        placeholder={`Mensaje a ${title}...`}
        disabled={false}
      />
    </div>
  )
}
