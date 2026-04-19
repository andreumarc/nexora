import { create } from 'zustand'
import type { MessageWithRelations } from '@/types'

interface TypingUser {
  userId: string
  userName: string | null
}

interface ChatStore {
  messages: Record<string, MessageWithRelations[]>
  typing: Record<string, TypingUser[]>
  unread: Record<string, number>

  addMessage: (roomId: string, message: MessageWithRelations) => void
  updateMessage: (roomId: string, message: MessageWithRelations) => void
  deleteMessage: (roomId: string, messageId: string) => void
  setTyping: (roomId: string, users: TypingUser[]) => void
  addTyping: (roomId: string, user: TypingUser) => void
  removeTyping: (roomId: string, userId: string) => void
  setUnread: (roomId: string, count: number) => void
  clearUnread: (roomId: string) => void
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: {},
  typing: {},
  unread: {},

  addMessage: (roomId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: [...(s.messages[roomId] ?? []), message],
      },
      unread: { ...s.unread, [roomId]: (s.unread[roomId] ?? 0) + 1 },
    })),

  updateMessage: (roomId, message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === message.id ? message : m
        ),
      },
    })),

  deleteMessage: (roomId, messageId) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [roomId]: (s.messages[roomId] ?? []).map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: '' } : m
        ),
      },
    })),

  setTyping: (roomId, users) =>
    set((s) => ({ typing: { ...s.typing, [roomId]: users } })),

  addTyping: (roomId, user) =>
    set((s) => ({
      typing: {
        ...s.typing,
        [roomId]: [
          ...(s.typing[roomId] ?? []).filter((u) => u.userId !== user.userId),
          user,
        ],
      },
    })),

  removeTyping: (roomId, userId) =>
    set((s) => ({
      typing: {
        ...s.typing,
        [roomId]: (s.typing[roomId] ?? []).filter((u) => u.userId !== userId),
      },
    })),

  setUnread: (roomId, count) =>
    set((s) => ({ unread: { ...s.unread, [roomId]: count } })),

  clearUnread: (roomId) =>
    set((s) => ({ unread: { ...s.unread, [roomId]: 0 } })),
}))
