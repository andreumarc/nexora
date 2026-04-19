'use client'

import { useState, useRef, useCallback } from 'react'
import { Paperclip, Send, X, AtSign } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface MessageComposerProps {
  placeholder?: string
  disabled?: boolean
  replyTo?: { senderName: string; content: string } | null
  onSend: (content: string, attachments?: File[]) => Promise<void>
  onCancelReply?: () => void
  className?: string
}

export function MessageComposer({
  placeholder = 'Escribe un mensaje...',
  disabled,
  replyTo,
  onSend,
  onCancelReply,
  className,
}: MessageComposerProps) {
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState<File[]>([])
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function autoResize() {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  async function handleSend() {
    const trimmed = content.trim()
    if (!trimmed && attachments.length === 0) return
    if (sending) return

    setSending(true)
    try {
      await onSend(trimmed, attachments)
      setContent('')
      setAttachments([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setAttachments((prev) => [...prev, ...files].slice(0, 5))
    e.target.value = ''
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !sending && !disabled

  return (
    <div className={cn('flex-shrink-0 px-4 pb-4', className)}>
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {/* Reply preview */}
        {replyTo && (
          <div className="flex items-start gap-2 px-3 py-2 bg-brand-50 border-b border-brand-100">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-brand-700">{replyTo.senderName}</p>
              <p className="text-xs text-brand-600 truncate">{replyTo.content}</p>
            </div>
            <button
              onClick={onCancelReply}
              className="p-0.5 rounded text-brand-400 hover:text-brand-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 py-2 border-b border-gray-100">
            {attachments.map((file, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2 py-1 bg-gray-100 rounded-lg text-xs text-gray-700"
              >
                <span className="truncate max-w-[120px]">{file.name}</span>
                <button
                  onClick={() => removeAttachment(i)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input area */}
        <div className="flex items-end gap-2 px-3 py-2.5">
          {/* Attach */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => fileInputRef.current?.click()}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
            title="Adjuntar archivo"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={handleFileChange}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={content}
            onChange={(e) => {
              setContent(e.target.value)
              autoResize()
            }}
            onKeyDown={handleKeyDown}
            placeholder={disabled ? 'Este canal es de solo lectura' : placeholder}
            disabled={disabled}
            className="composer-input flex-1 py-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          />

          {/* Send button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!canSend}
            className={cn(
              'p-2 rounded-lg flex-shrink-0 transition-all duration-150',
              canSend
                ? 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
            )}
            title="Enviar (Enter)"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pb-2 flex items-center justify-between">
          <p className="text-[10px] text-gray-300">
            <kbd className="font-mono">Enter</kbd> para enviar ·{' '}
            <kbd className="font-mono">Shift+Enter</kbd> para nueva línea
          </p>
          <p className="text-[10px] text-gray-300">{content.length > 0 ? `${content.length} caracteres` : ''}</p>
        </div>
      </div>
    </div>
  )
}
