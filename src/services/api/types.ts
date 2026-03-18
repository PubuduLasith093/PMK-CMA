/**
 * TypeScript types for PMK Messaging System
 * Matches backend schema from parent-dashboard-BE/prisma/schema.prisma
 */

// Enums
export type ThreadType = 'DIRECT' | 'GROUP' | 'FAMILY';
export type MessageType = 'TEXT' | 'IMAGE' | 'LOCATION' | 'VOICE' | 'VIDEO' | 'FILE';
export type SenderType = 'USER' | 'CHILD';
export type ParticipantRole = 'ADMIN' | 'MEMBER';

// Thread Participant
export interface ThreadParticipant {
    id: string;
    threadId: string;
    userId?: string;
    childId?: string;
    role: ParticipantRole;
    joinedAt: string;
    lastReadAt?: string;
    isAdmin: boolean;
    isArchived?: boolean;
    // Populated fields (from joins)
    user?: {
        id: string;
        name: string;
        email: string;
        avatarUrl?: string;
    };
    child?: {
        id: string;
        name: string;
        avatarUrl?: string;
    };
}

// Message Attachment
export interface MessageAttachment {
    id: string;
    messageId: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    url: string;
    thumbnailUrl?: string;
    metadata?: any;
    createdAt: string;
}

// Message Reaction
export interface MessageReaction {
    id: string;
    messageId: string;
    userId?: string;
    childId?: string;
    userType: 'user' | 'child';
    emoji: string;
    createdAt: string;
}

// Message
export interface Message {
    id: string;
    threadId: string;
    senderId?: string;
    senderType: SenderType;
    content: string;
    messageType: MessageType;
    replyToId?: string;
    isEmergency: boolean;
    readBy: any; // JSON field
    deliveredAt?: string;
    editedAt?: string;
    deletedAt?: string;
    createdAt: string;
    // Relations
    replyTo?: Message;
    replies?: Message[];
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
    // Metadata for location messages
    metadata?: {
        latitude?: number;
        longitude?: number;
        address?: string;
        name?: string;
    };
}

// Message Thread
export interface Thread {
    id: string;
    familyId: string;
    threadName?: string;
    name?: string; // Alias for threadName
    threadType: ThreadType;
    isGroup: boolean;
    createdBy?: string;
    avatarUrl?: string;
    isPinned: boolean;
    isMuted: boolean;
    lastMessageAt?: string;
    settings?: any; // JSON field
    createdAt: string;
    updatedAt: string;
    // Relations
    participants: ThreadParticipant[];
    messages?: Message[];
    lastMessage?: Message;
    // Computed fields
    unreadCount?: number;
}

// API Request/Response Types

export interface CreateThreadRequest {
    familyId: string;
    threadName?: string;
    threadType: ThreadType;
    isGroup: boolean;
    participantChildIds?: string[];
    settings?: any;
}

export interface CreateThreadResponse {
    success: boolean;
    message: string;
    thread: Thread;
}

export interface GetThreadsResponse {
    success: boolean;
    threads: Thread[];
}

export interface GetMessagesRequest {
    threadId: string;
    limit?: number;
    cursor?: string;
    before?: string;
}

export interface GetMessagesResponse {
    success: boolean;
    messages: Message[];
    hasMore: boolean;
    nextCursor?: string;
}

export interface SendMessageRequest {
    content: string;
    messageType?: MessageType;
    replyToId?: string;
    attachments?: MessageAttachment[];
    metadata?: any;
    isEmergency?: boolean;
}

export interface SendMessageResponse {
    success: boolean;
    message: Message;
}

export interface UpdateThreadRequest {
    threadName?: string;
    isPinned?: boolean;
    isMuted?: boolean;
    isArchived?: boolean;
    settings?: any;
}

export interface UpdateThreadResponse {
    success: boolean;
    message: string;
    thread: Thread;
}

export interface UploadFileResponse {
    success: boolean;
    message: string;
    file: {
        fileName: string;
        fileType: string;
        fileSize: number;
        url: string;
        thumbnailUrl?: string;
    };
}

export interface AddReactionRequest {
    emoji: string;
}

export interface AddReactionResponse {
    success: boolean;
    message: string;
    reaction: MessageReaction;
}

export interface AutoCreateThreadsResponse {
    success: boolean;
    message: string;
    createdThreads: Thread[];
}

// Socket.io Event Types

export interface SocketMessageData {
    threadId: string;
    content: string;
    messageType?: MessageType;
    replyToId?: string;
    attachments?: any[];
    metadata?: any;
    tempId?: string;
}

export interface SocketTypingData {
    threadId: string;
    userId?: string;
    childId?: string;
    userName: string;
}

export interface SocketReactionData {
    messageId: string;
    emoji: string;
    userId?: string;
    childId?: string;
    action: 'add' | 'remove';
    threadId: string;
}

export interface SocketLocationData {
    threadId: string;
    latitude: number;
    longitude: number;
    address: string;
    name?: string;
}
