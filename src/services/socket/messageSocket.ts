/**
 * Message Socket Client for PMK Child Mobile App
 * Socket.io client for real-time messaging
 * Backend: parent-dashboard-BE at /ws/messages path (not namespace)
 */

import { io, Socket } from 'socket.io-client';
import * as SecureStore from 'expo-secure-store';
import {
    Message,
    SocketMessageData,
    SocketTypingData,
    SocketReactionData,
    SocketLocationData,
} from './types';

// Get Socket URL from environment
const SOCKET_URL = process.env.EXPO_PUBLIC_SOCKET_URL || 'http://localhost:5000';

class MessageSocketClient {
    private socket: Socket | null = null;
    private isConnected: boolean = false;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 5;
    private eventHandlers: Map<string, Function[]> = new Map();

    constructor() {
        console.log('[MessageSocket] Client initialized');
    }

    /**
     * Connect to Socket.io server
     */
    async connect(token?: string): Promise<void> {
        try {
            // Get token from secure storage if not provided (using same key as deviceService)
            let authToken = token;
            if (!authToken) {
                const credentials = await SecureStore.getItemAsync('pmk_device_credentials');
                if (credentials) {
                    const parsed = JSON.parse(credentials);
                    authToken = parsed.token;
                    console.log('[MessageSocket] Retrieved auth token from SecureStore');
                } else {
                    console.warn('[MessageSocket] No credentials found in SecureStore');
                }
            }

            if (!authToken) {
                console.error('[MessageSocket] No auth token available');
                throw new Error('Authentication token required');
            }

            console.log('[MessageSocket] Connecting to:', SOCKET_URL, 'with path: /ws/messages');

            // Create socket connection
            this.socket = io(SOCKET_URL, {
                path: '/ws/messages',  // Use path option, not URL namespace
                auth: {
                    token: authToken,
                },
                transports: ['websocket', 'polling'],  // Add polling as fallback
                reconnection: true,
                reconnectionAttempts: this.maxReconnectAttempts,
                reconnectionDelay: 1000,
                reconnectionDelayMax: 5000,
                timeout: 20000,
            });

            // Setup event listeners
            this.setupEventListeners();

            // Wait for connection
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 20000);

                this.socket?.on('connect', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    console.log('[MessageSocket] Connected successfully');
                    resolve();
                });

                this.socket?.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error('[MessageSocket] Connection error:', error);
                    reject(error);
                });
            });
        } catch (error) {
            console.error('[MessageSocket] Connect error:', error);
            throw error;
        }
    }

    /**
     * Disconnect from Socket.io server
     */
    disconnect(): void {
        if (this.socket) {
            console.log('[MessageSocket] Disconnecting...');
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.eventHandlers.clear();
        }
    }

    /**
     * Check if socket is connected
     */
    isSocketConnected(): boolean {
        return this.isConnected && this.socket?.connected === true;
    }

    /**
     * Setup socket event listeners
     */
    private setupEventListeners(): void {
        if (!this.socket) return;

        // Connection events
        this.socket.on('connect', () => {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('[MessageSocket] Connected');
            this.emit('connection-status', { connected: true });
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnected = false;
            console.log('[MessageSocket] Disconnected:', reason);
            this.emit('connection-status', { connected: false, reason });
        });

        this.socket.on('connect_error', (error) => {
            this.reconnectAttempts++;
            console.error('[MessageSocket] Connection error:', error, `(Attempt ${this.reconnectAttempts})`);
            this.emit('connection-error', { error, attempts: this.reconnectAttempts });
        });

        this.socket.on('reconnect', (attemptNumber) => {
            console.log('[MessageSocket] Reconnected after', attemptNumber, 'attempts');
            this.emit('reconnected', { attempts: attemptNumber });
        });

        // Message events
        this.socket.on('message:new', (message: Message) => {
            console.log('[MessageSocket] New message received:', message.id);
            this.emit('message:new', message);
        });

        this.socket.on('message-sent', (data: any) => {
            console.log('[MessageSocket] Message sent confirmation:', data);
            this.emit('message-sent', data);
        });

        this.socket.on('message:edited', (message: Message) => {
            console.log('[MessageSocket] Message edited:', message.id);
            this.emit('message:edited', message);
        });

        this.socket.on('message:deleted', (data: { messageId: string; threadId: string }) => {
            console.log('[MessageSocket] Message deleted:', data.messageId);
            this.emit('message:deleted', data);
        });

        // Typing events
        this.socket.on('user-typing', (data: SocketTypingData) => {
            this.emit('user-typing', data);
        });

        // Reaction events
        this.socket.on('reaction-added', (data: SocketReactionData) => {
            console.log('[MessageSocket] Reaction added:', data);
            this.emit('reaction-added', data);
        });

        this.socket.on('reaction-removed', (data: SocketReactionData) => {
            console.log('[MessageSocket] Reaction removed:', data);
            this.emit('reaction-removed', data);
        });

        // Read receipts
        this.socket.on('messages-read', (data: { threadId: string; userId: string; timestamp: string }) => {
            this.emit('messages-read', data);
        });

        // Online status
        this.socket.on('user-online', (data: { userId: string }) => {
            this.emit('user-online', data);
        });

        this.socket.on('user-offline', (data: { userId: string }) => {
            this.emit('user-offline', data);
        });

        // Thread events
        this.socket.on('thread-joined', (data: { threadId: string }) => {
            console.log('[MessageSocket] Thread joined:', data.threadId);
            this.emit('thread-joined', data);
        });

        // Error events
        this.socket.on('error', (error: any) => {
            console.error('[MessageSocket] Socket error:', error);
            this.emit('error', error);
        });

        this.socket.on('message-error', (error: any) => {
            console.error('[MessageSocket] Message error:', error);
            this.emit('message-error', error);
        });
    }

    // ==================== Emit Methods (Client → Server) ====================

    /**
     * Join a thread room
     */
    joinThread(threadId: string): void {
        if (!this.socket) {
            console.warn('[MessageSocket] Cannot join thread - not connected');
            return;
        }
        console.log('[MessageSocket] Joining thread:', threadId);
        this.socket.emit('join-thread', { threadId });
    }

    /**
     * Leave a thread room
     */
    leaveThread(threadId: string): void {
        if (!this.socket) return;
        console.log('[MessageSocket] Leaving thread:', threadId);
        this.socket.emit('leave-thread', { threadId });
    }

    /**
     * Send a message
     */
    sendMessage(data: SocketMessageData): void {
        if (!this.socket) {
            console.warn('[MessageSocket] Cannot send message - not connected');
            return;
        }
        console.log('[MessageSocket] Sending message to thread:', data.threadId);
        this.socket.emit('send-message', data);
    }

    /**
     * Start typing indicator
     */
    startTyping(threadId: string, userName: string): void {
        if (!this.socket) return;
        this.socket.emit('typing-start', { threadId, userName });
    }

    /**
     * Stop typing indicator
     */
    stopTyping(threadId: string): void {
        if (!this.socket) return;
        this.socket.emit('typing-stop', { threadId });
    }

    /**
     * Mark messages as read
     */
    markAsRead(threadId: string): void {
        if (!this.socket) return;
        this.socket.emit('mark-read', { threadId });
    }

    /**
     * Add reaction to message
     */
    addReaction(messageId: string, emoji: string): void {
        if (!this.socket) return;
        this.socket.emit('add-reaction', { messageId, emoji });
    }

    /**
     * Remove reaction from message
     */
    removeReaction(messageId: string, emoji: string): void {
        if (!this.socket) return;
        this.socket.emit('remove-reaction', { messageId, emoji });
    }

    /**
     * Share location
     */
    shareLocation(data: SocketLocationData): void {
        if (!this.socket) return;
        console.log('[MessageSocket] Sharing location to thread:', data.threadId);
        this.socket.emit('share-location', data);
    }

    // ==================== Event Handler Methods ====================

    /**
     * Register event handler
     */
    on(event: string, handler: Function): void {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, []);
        }
        this.eventHandlers.get(event)?.push(handler);
    }

    /**
     * Unregister event handler
     */
    off(event: string, handler: Function): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            const index = handlers.indexOf(handler);
            if (index > -1) {
                handlers.splice(index, 1);
            }
        }
    }

    /**
     * Emit event to registered handlers
     */
    private emit(event: string, data: any): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.forEach((handler) => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`[MessageSocket] Error in ${event} handler:`, error);
                }
            });
        }
    }

    /**
     * Convenience methods for common events
     */
    onNewMessage(handler: (message: Message) => void): void {
        this.on('message:new', handler);
    }

    offNewMessage(handler: (message: Message) => void): void {
        this.off('message:new', handler);
    }

    onMessageEdited(handler: (message: Message) => void): void {
        this.on('message:edited', handler);
    }

    offMessageEdited(handler: (message: Message) => void): void {
        this.off('message:edited', handler);
    }

    onMessageDeleted(handler: (data: { messageId: string; threadId: string }) => void): void {
        this.on('message:deleted', handler);
    }

    offMessageDeleted(handler: (data: { messageId: string; threadId: string }) => void): void {
        this.off('message:deleted', handler);
    }

    onReaction(handler: (data: SocketReactionData) => void): void {
        this.on('reaction-added', handler);
        this.on('reaction-removed', handler);
    }

    offReaction(handler: (data: SocketReactionData) => void): void {
        this.off('reaction-added', handler);
        this.off('reaction-removed', handler);
    }

    onTyping(handler: (data: SocketTypingData) => void): void {
        this.on('user-typing', handler);
    }

    offTyping(handler: (data: SocketTypingData) => void): void {
        this.off('user-typing', handler);
    }

    onConnectionStatus(handler: (data: { connected: boolean; reason?: string }) => void): void {
        this.on('connection-status', handler);
    }

    offConnectionStatus(handler: (data: { connected: boolean; reason?: string }) => void): void {
        this.off('connection-status', handler);
    }
}

// Export singleton instance
export const messageSocket = new MessageSocketClient();
export default messageSocket;
