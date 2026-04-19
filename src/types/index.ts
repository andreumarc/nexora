import type { RoleType, PresenceStatus, ChannelType, AnnouncementPriority, NotificationType, InvitationStatus, MessageType } from '@prisma/client'
export type { RoleType, PresenceStatus, ChannelType, AnnouncementPriority, NotificationType, InvitationStatus, MessageType }

export interface UserProfile {
  id: string
  email: string
  name: string | null
  firstName: string | null
  lastName: string | null
  avatarUrl: string | null
  jobTitle: string | null
  isSuperadmin: boolean
  membership?: MembershipWithRelations | null
  presence?: { status: PresenceStatus; statusText: string | null } | null
}

export interface MembershipWithRelations {
  id: string
  role: string
  companyId: string
  clinicId: string | null
  departmentId: string | null
  teamId: string | null
  company: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
  }
  clinic?: {
    id: string
    name: string
    code: string | null
  } | null
  department?: {
    id: string
    name: string
  } | null
}

export interface ChannelWithMeta {
  id: string
  name: string
  slug: string
  description: string | null
  type: string
  isArchived: boolean
  isReadOnly: boolean
  isPinned: boolean
  isOperational: boolean
  clinicId: string | null
  clinic?: { name: string; code: string | null } | null
  _count: { members: number; messages: number }
  unreadCount?: number
  lastMessage?: MessagePreview | null
}

export interface MessagePreview {
  id: string
  content: string
  createdAt: Date
  sender: { name: string | null; firstName: string | null }
}

export interface MessageWithRelations {
  id: string
  content: string
  type: string
  isPinned: boolean
  isDeleted: boolean
  editedAt: Date | null
  createdAt: Date
  updatedAt: Date
  parentId: string | null
  sender: {
    id: string
    name: string | null
    firstName: string | null
    lastName: string | null
    avatarUrl: string | null
    jobTitle: string | null
  }
  reactions: Array<{
    emoji: string
    userId: string
    user: { name: string | null }
  }>
  attachments: Array<{
    id: string
    fileName: string
    fileSize: number
    mimeType: string
    publicUrl: string | null
    storageKey: string
  }>
  _count: { replies: number }
}

export interface AnnouncementWithMeta {
  id: string
  title: string
  content: string
  priority: string
  requiresRead: boolean
  isPinned: boolean
  isPublished: boolean
  publishedAt: Date | null
  createdAt: Date
  createdBy: {
    name: string | null
    firstName: string | null
    jobTitle: string | null
  }
  audiences: Array<{
    clinicId: string | null
    departmentId: string | null
    role: string | null
  }>
  _count: { reads: number }
  userRead?: { readAt: Date; confirmedAt: Date | null } | null
}

export interface DirectConversationWithMeta {
  id: string
  isGroup: boolean
  name: string | null
  members: Array<{
    user: {
      id: string
      name: string | null
      firstName: string | null
      avatarUrl: string | null
      presence?: { status: string } | null
    }
  }>
  lastMessage?: MessagePreview | null
  unreadCount?: number
}

export interface NotificationWithMeta {
  id: string
  type: string
  title: string
  body: string | null
  isRead: boolean
  createdAt: Date
  channelId: string | null
  messageId: string | null
  announcementId: string | null
}

