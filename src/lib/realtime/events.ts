// NEXORA Realtime Event Types
// Socket.IO event definitions — shared between server and client

export interface ServerToClientEvents {
  // Messages
  'message:new': (data: RealtimeMessage) => void
  'message:updated': (data: RealtimeMessage) => void
  'message:deleted': (data: { messageId: string; channelId?: string; conversationId?: string }) => void
  'message:pinned': (data: { messageId: string; channelId: string; isPinned: boolean }) => void
  'message:reaction': (data: RealtimeReaction) => void

  // Typing
  'typing:start': (data: TypingPayload) => void
  'typing:stop': (data: TypingPayload) => void

  // Presence
  'presence:update': (data: PresenceUpdate) => void
  'presence:bulk': (data: PresenceUpdate[]) => void

  // Notifications
  'notification:new': (data: RealtimeNotification) => void
  'notification:read': (data: { notificationId: string }) => void

  // Channel
  'channel:updated': (data: { channelId: string; name?: string; description?: string }) => void
  'channel:member_added': (data: { channelId: string; userId: string }) => void
  'channel:member_removed': (data: { channelId: string; userId: string }) => void

  // DM
  'dm:new_conversation': (data: { conversationId: string }) => void

  // Read receipts
  'channel:read': (data: { channelId: string; userId: string; lastReadAt: string }) => void
}

export interface ClientToServerEvents {
  // Join/leave rooms
  'room:join': (data: { roomId: string }) => void
  'room:leave': (data: { roomId: string }) => void

  // Typing
  'typing:start': (data: { channelId?: string; conversationId?: string }) => void
  'typing:stop': (data: { channelId?: string; conversationId?: string }) => void

  // Presence
  'presence:set': (data: { status: string; statusText?: string }) => void

  // Read
  'channel:mark_read': (data: { channelId: string }) => void
}

// Room naming conventions
export const ROOMS = {
  company: (companyId: string) => `company:${companyId}`,
  channel: (channelId: string) => `channel:${channelId}`,
  conversation: (conversationId: string) => `dm:${conversationId}`,
  user: (userId: string) => `user:${userId}`,
} as const

// Payload types
export interface RealtimeMessage {
  id: string
  channelId?: string
  conversationId?: string
  parentId?: string | null
  content: string
  type: string
  createdAt: string
  editedAt?: string | null
  isPinned: boolean
  sender: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    jobTitle: string | null
  }
  attachments: Array<{
    id: string
    fileName: string
    fileSize: number
    mimeType: string
    publicUrl: string | null
  }>
  reactions: Array<{ emoji: string; userId: string; user: { name: string | null } }>
  _count: { replies: number }
}

export interface RealtimeReaction {
  messageId: string
  channelId?: string
  conversationId?: string
  emoji: string
  userId: string
  action: 'add' | 'remove'
  user: { name: string | null }
}

export interface TypingPayload {
  channelId?: string
  conversationId?: string
  userId: string
  userName: string | null
}

export interface PresenceUpdate {
  userId: string
  status: 'ONLINE' | 'AWAY' | 'BUSY' | 'OFFLINE'
  statusText?: string | null
  lastSeenAt: string
}

export interface RealtimeNotification {
  id: string
  type: string
  title: string
  body: string | null
  createdAt: string
  channelId?: string | null
  messageId?: string | null
  announcementId?: string | null
}
