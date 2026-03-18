import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    Animated,
    TouchableOpacity,
    Dimensions,
    Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { colors, spacing, typography, borderRadius, shadows } from '../theme/colors';
import { messageApi } from '../services/api/messageApi';
import { messageSocket } from '../services/socket/messageSocket';
import { Thread, Message } from '../services/api/types';

// Components
import ThreadList from '../components/messages/ThreadList';
import ChatArea from '../components/messages/ChatArea';
import EditMessageModal from '../components/messages/EditMessageModal';
import DeleteConfirmationModal from '../components/messages/DeleteConfirmationModal';
import ForwardModal from '../components/messages/ForwardModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const THREAD_LIST_WIDTH = SCREEN_WIDTH * 0.85;

const MessagesScreen: React.FC = () => {
    console.log('[MessagesScreen] Component rendering...');
    // Redux state
    const { deviceId, childId, childName } = useSelector((state: RootState) => state.auth);

    // State
    const [threads, setThreads] = useState<Thread[]>([]);
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showArchivedChats, setShowArchivedChats] = useState(false);
    const [isSocketConnected, setIsSocketConnected] = useState(false);
    const [isThreadListOpen, setIsThreadListOpen] = useState(false);

    // Modal states for message actions
    const [editingMessage, setEditingMessage] = useState<Message | null>(null);
    const [messageToDelete, setMessageToDelete] = useState<string | null>(null);
    const [messageToForward, setMessageToForward] = useState<Message | null>(null);
    const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);

    // Refs
    const socketConnectedRef = useRef(false);
    const messageCacheRef = useRef<Map<string, Message[]>>(new Map());
    const lastFetchedRef = useRef<Map<string, number>>(new Map());
    const slideAnimation = useRef(new Animated.Value(-THREAD_LIST_WIDTH)).current;

    // Initialize - Load threads and connect socket
    useEffect(() => {
        const initialize = async () => {
            try {
                console.log('[MessagesScreen] Initializing...');

                if (!deviceId) {
                    console.error('[MessagesScreen] No device ID available');
                    setLoading(false);
                    return;
                }

                // Connect to socket
                if (!socketConnectedRef.current) {
                    console.log('[MessagesScreen] Connecting to socket...');
                    try {
                        await messageSocket.connect();
                        socketConnectedRef.current = true;
                        setIsSocketConnected(true);
                        console.log('[MessagesScreen] Socket connected');
                    } catch (error) {
                        console.error('[MessagesScreen] Socket connection failed:', error);
                        // Continue without socket - will work in REST-only mode
                    }
                }

                // Auto-create parent-child threads
                console.log('[MessagesScreen] Auto-creating threads...');
                try {
                    const autoCreateResult = await messageApi.autoCreateThreads();
                    console.log('[MessagesScreen] Auto-create result:', autoCreateResult);
                } catch (error) {
                    console.error('[MessagesScreen] Auto-create failed:', error);
                    // Continue - threads might already exist
                }

                // Load threads
                console.log('[MessagesScreen] Loading threads...');
                const threadsData = await messageApi.getThreads();
                console.log('[MessagesScreen] Threads loaded:', threadsData.length);
                setThreads(threadsData);

                // Don't auto-select thread on mobile - show welcome screen instead
                setLoading(false);
                console.log('[MessagesScreen] Initialization complete');
            } catch (error) {
                console.error('[MessagesScreen] Failed to initialize:', error);
                Alert.alert('Error', 'Failed to load messages. Please try again.');
                setLoading(false);
            }
        };

        initialize();

        // Cleanup
        return () => {
            if (socketConnectedRef.current) {
                messageSocket.disconnect();
                socketConnectedRef.current = false;
            }
        };
    }, [deviceId]);

    // Load messages when thread selected - WITH CACHING
    useEffect(() => {
        if (!selectedThread) {
            setMessages([]);
            return;
        }

        console.log('[MessagesScreen] Thread selected:', selectedThread.id);

        const loadMessages = async () => {
            const threadId = selectedThread.id;

            // Check cache first
            const cachedMessages = messageCacheRef.current.get(threadId);
            const lastFetched = lastFetchedRef.current.get(threadId) || 0;
            const cacheAge = Date.now() - lastFetched;

            if (cachedMessages && cacheAge < 30000) {
                // Cache valid for 30 seconds
                console.log('[MessagesScreen] Using cached messages');
                setMessages(cachedMessages);
                setLoadingMessages(false);

                // Join thread room for real-time updates
                messageSocket.joinThread(threadId);
                messageApi.markThreadAsRead(threadId).catch(console.error);

                // Reset unread count in UI
                setThreads((prev) =>
                    prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
                );
                return;
            }

            // Fetch from server
            setLoadingMessages(true);
            try {
                console.log('[MessagesScreen] Fetching messages from server');
                const messagesData = await messageApi.getMessages({ threadId, limit: 100 });
                console.log('[MessagesScreen] Messages loaded:', messagesData.messages.length);

                // Update cache
                messageCacheRef.current.set(threadId, messagesData.messages);
                lastFetchedRef.current.set(threadId, Date.now());

                setMessages(messagesData.messages);

                // Mark as read
                messageApi.markThreadAsRead(threadId).catch(console.error);

                // Reset unread count in UI
                setThreads((prev) =>
                    prev.map((t) => (t.id === threadId ? { ...t, unreadCount: 0 } : t))
                );

                // Join thread room for real-time updates
                messageSocket.joinThread(threadId);
            } catch (error) {
                console.error('[MessagesScreen] Failed to load messages:', error);
                Alert.alert('Error', 'Failed to load messages');
            } finally {
                setLoadingMessages(false);
            }
        };

        loadMessages();

        // Cleanup - Leave thread room when switching threads
        return () => {
            if (selectedThread) {
                messageSocket.leaveThread(selectedThread.id);
            }
        };
    }, [selectedThread?.id]);

    // Socket event listeners
    useEffect(() => {
        console.log('[MessagesScreen] Setting up socket event listeners');

        const handleNewMessage = (message: Message) => {
            console.log('[MessagesScreen] New message received:', message.id);

            // Update cache for all threads
            const threadId = message.threadId;
            const cachedMessages = messageCacheRef.current.get(threadId) || [];

            if (!cachedMessages.some((m) => m.id === message.id)) {
                const updatedCache = [...cachedMessages, message];
                messageCacheRef.current.set(threadId, updatedCache);
                lastFetchedRef.current.set(threadId, Date.now());
            }

            // Add message to UI if it's for current thread
            if (selectedThread && message.threadId === selectedThread.id) {
                console.log('[MessagesScreen] Message for current thread - adding to UI');
                setMessages((prev) => {
                    if (prev.some((m) => m.id === message.id)) {
                        return prev;
                    }
                    return [...prev, message];
                });

                // Mark as read automatically
                messageApi.markThreadAsRead(selectedThread.id).catch(console.error);
            }

            // Update thread list
            setThreads((prevThreads) => {
                return prevThreads
                    .map((thread) => {
                        if (thread.id === message.threadId) {
                            const isCurrentThread = selectedThread?.id === message.threadId;
                            return {
                                ...thread,
                                lastMessage: message,
                                lastMessageAt: message.createdAt,
                                updatedAt: message.createdAt,
                                unreadCount: isCurrentThread ? 0 : (thread.unreadCount || 0) + 1,
                            };
                        }
                        return thread;
                    })
                    .sort((a, b) => {
                        const timeA = new Date(a.lastMessageAt || a.updatedAt).getTime();
                        const timeB = new Date(b.lastMessageAt || b.updatedAt).getTime();
                        return timeB - timeA;
                    });
            });
        };

        const handleMessageEdited = (message: Message) => {
            console.log('[MessagesScreen] Message edited:', message.id);
            setMessages((prev) => prev.map((m) => (m.id === message.id ? message : m)));

            // Update cache
            const cachedMessages = messageCacheRef.current.get(message.threadId) || [];
            const updatedCache = cachedMessages.map((m) => (m.id === message.id ? message : m));
            messageCacheRef.current.set(message.threadId, updatedCache);
        };

        const handleMessageDeleted = (data: { messageId: string; threadId: string }) => {
            console.log('[MessagesScreen] Message deleted:', data.messageId);
            setMessages((prev) => prev.filter((m) => m.id !== data.messageId));

            // Update cache
            if (data.threadId) {
                const cachedMessages = messageCacheRef.current.get(data.threadId) || [];
                const updatedCache = cachedMessages.filter((m) => m.id !== data.messageId);
                messageCacheRef.current.set(data.threadId, updatedCache);
            }
        };

        const handleConnectionStatus = (data: { connected: boolean }) => {
            setIsSocketConnected(data.connected);
        };

        const handleReactionAdded = (data: any) => {
            console.log('[MessagesScreen] Reaction added:', data);
            // Update message with new reaction
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.id === data.messageId) {
                        const existingReactions = m.reactions || [];
                        // Check if user already reacted with this emoji
                        const hasReaction = existingReactions.some(
                            (r) => r.emoji === data.emoji && r.userId === data.userId && r.childId === data.childId
                        );
                        if (!hasReaction) {
                            return {
                                ...m,
                                reactions: [
                                    ...existingReactions,
                                    {
                                        id: data.reactionId || `temp-${Date.now()}`,
                                        messageId: data.messageId,
                                        userId: data.userId,
                                        childId: data.childId,
                                        userType: data.userType || (data.userId ? 'user' : 'child'),
                                        emoji: data.emoji,
                                        createdAt: new Date().toISOString(),
                                    },
                                ],
                            };
                        }
                    }
                    return m;
                })
            );
        };

        const handleReactionRemoved = (data: any) => {
            console.log('[MessagesScreen] Reaction removed:', data);
            // Update message by removing reaction
            setMessages((prev) =>
                prev.map((m) => {
                    if (m.id === data.messageId) {
                        return {
                            ...m,
                            reactions: (m.reactions || []).filter(
                                (r) => !(r.emoji === data.emoji && r.userId === data.userId && r.childId === data.childId)
                            ),
                        };
                    }
                    return m;
                })
            );
        };

        messageSocket.onNewMessage(handleNewMessage);
        messageSocket.onMessageEdited(handleMessageEdited);
        messageSocket.onMessageDeleted(handleMessageDeleted);
        messageSocket.onConnectionStatus(handleConnectionStatus);
        messageSocket.onReaction(handleReactionAdded);
        messageSocket.on('reaction-removed', handleReactionRemoved);

        return () => {
            messageSocket.offNewMessage(handleNewMessage);
            messageSocket.offMessageEdited(handleMessageEdited);
            messageSocket.offMessageDeleted(handleMessageDeleted);
            messageSocket.offConnectionStatus(handleConnectionStatus);
            messageSocket.offReaction(handleReactionAdded);
            messageSocket.off('reaction-removed', handleReactionRemoved);
        };
    }, [selectedThread]);

    // Handle thread selection
    const handleThreadSelect = (thread: Thread) => {
        console.log('[MessagesScreen] Thread selected:', thread.id);
        setSelectedThread(thread);
        closeThreadList();
    };

    // Thread list animation controls
    const openThreadList = () => {
        setIsThreadListOpen(true);
        Animated.timing(slideAnimation, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
        }).start();
    };

    const closeThreadList = () => {
        Animated.timing(slideAnimation, {
            toValue: -THREAD_LIST_WIDTH,
            duration: 300,
            useNativeDriver: true,
        }).start(() => {
            setIsThreadListOpen(false);
        });
    };

    // Handle send message
    const handleSendMessage = async (
        content: string,
        attachments?: any[],
        replyToId?: string,
        messageType?: string,
        metadata?: any
    ) => {
        if (!selectedThread || !content.trim()) {
            return;
        }

        try {
            console.log('[MessagesScreen] Sending message...', { messageType, metadata });

            // Send via API to persist to database
            const sentMessage = await messageApi.sendMessage(selectedThread.id, {
                content,
                messageType: (messageType as any) || 'TEXT',
                attachments,
                replyToId,
                metadata,
            });

            console.log('[MessagesScreen] Message saved to database');

            // NOTE: Don't add message to UI here - let Socket.IO broadcast handle it
            // This prevents duplicate messages (API response + Socket broadcast)
            // The backend will broadcast via Socket.IO to all clients including sender

            // Update cache (but don't add to UI yet)
            const cachedMessages = messageCacheRef.current.get(selectedThread.id) || [];
            if (!cachedMessages.some((m) => m.id === sentMessage.id)) {
                messageCacheRef.current.set(selectedThread.id, [...cachedMessages, sentMessage]);
                lastFetchedRef.current.set(selectedThread.id, Date.now());
            }

            // Socket.IO will broadcast the message, which will:
            // 1. Add it to UI via handleNewMessage
            // 2. Update thread list with lastMessage

            console.log('[MessagesScreen] Message sent successfully');
        } catch (error) {
            console.error('[MessagesScreen] Failed to send message:', error);
            Alert.alert('Error', 'Failed to send message');
        }
    };

    // Handle edit message
    const handleEditMessage = (message: Message) => {
        console.log('[MessagesScreen] Edit message:', message.id);
        setEditingMessage(message);
    };

    const handleSaveEdit = async (messageId: string, newContent: string) => {
        try {
            console.log('[MessagesScreen] Saving edited message...');
            const updatedMessage = await messageApi.editMessage(messageId, newContent);

            // Update local state optimistically
            setMessages((prev) =>
                prev.map((m) => (m.id === messageId ? { ...m, content: newContent, editedAt: new Date().toISOString() } : m))
            );

            // Update cache
            if (selectedThread) {
                const cachedMessages = messageCacheRef.current.get(selectedThread.id) || [];
                const updatedCache = cachedMessages.map((m) => (m.id === messageId ? updatedMessage : m));
                messageCacheRef.current.set(selectedThread.id, updatedCache);
            }

            setEditingMessage(null);
            console.log('[MessagesScreen] Message edited successfully');
        } catch (error) {
            console.error('[MessagesScreen] Failed to edit message:', error);
            Alert.alert('Error', 'Failed to edit message');
        }
    };

    // Handle delete message
    const handleDeleteMessage = (messageId: string) => {
        console.log('[MessagesScreen] Delete message:', messageId);
        setMessageToDelete(messageId);
    };

    const handleConfirmDelete = async () => {
        if (!messageToDelete) return;

        try {
            console.log('[MessagesScreen] Deleting message...');
            await messageApi.deleteMessage(messageToDelete);

            // Remove from local state
            setMessages((prev) => prev.filter((m) => m.id !== messageToDelete));

            // Update cache
            if (selectedThread) {
                const cachedMessages = messageCacheRef.current.get(selectedThread.id) || [];
                const updatedCache = cachedMessages.filter((m) => m.id !== messageToDelete);
                messageCacheRef.current.set(selectedThread.id, updatedCache);
            }

            setMessageToDelete(null);
            console.log('[MessagesScreen] Message deleted successfully');
        } catch (error) {
            console.error('[MessagesScreen] Failed to delete message:', error);
            Alert.alert('Error', 'Failed to delete message');
        }
    };

    // Handle reply to message
    const handleReplyMessage = (message: Message) => {
        console.log('[MessagesScreen] Reply to message:', message.id);
        setReplyToMessage(message);
    };

    // Handle forward message
    const handleForwardMessage = (message: Message) => {
        console.log('[MessagesScreen] Forward message:', message.id);
        setMessageToForward(message);
    };

    const handleConfirmForward = async (threadIds: string[]) => {
        if (!messageToForward) return;

        try {
            console.log('[MessagesScreen] Forwarding message to threads:', threadIds);

            // Forward to each selected thread
            for (const threadId of threadIds) {
                await messageApi.sendMessage(threadId, {
                    content: messageToForward.content,
                    messageType: messageToForward.messageType,
                });
            }

            setMessageToForward(null);
            Alert.alert('Success', `Message forwarded to ${threadIds.length} conversation(s)`);
        } catch (error) {
            console.error('[MessagesScreen] Failed to forward message:', error);
            Alert.alert('Error', 'Failed to forward message');
        }
    };

    // Handle reaction to message
    const handleReactMessage = async (messageId: string, emoji: string) => {
        try {
            console.log('[MessagesScreen] Adding reaction:', emoji, 'to message:', messageId);
            await messageApi.addReaction(messageId, emoji);
            // WebSocket will handle real-time update
        } catch (error) {
            console.error('[MessagesScreen] Failed to add reaction:', error);
            Alert.alert('Error', 'Failed to add reaction');
        }
    };

    // Helper function to load/reload threads
    const loadThreads = async () => {
        try {
            console.log('[MessagesScreen] Loading threads...');
            const threadsData = await messageApi.getThreads();
            console.log('[MessagesScreen] Threads loaded:', threadsData.length);
            setThreads(threadsData);
        } catch (error) {
            console.error('[MessagesScreen] Failed to load threads:', error);
        }
    };

    // Handle archive thread
    const handleArchiveThread = async () => {
        if (!selectedThread) return;

        try {
            console.log('[MessagesScreen] Archiving thread:', selectedThread.id);
            await messageApi.updateThread(selectedThread.id, { isArchived: true });

            // Refresh threads
            await loadThreads();

            // Select another active thread
            const newActiveThreads = threads.filter(thread => {
                const currentChildParticipant = thread.participants.find(p => p.childId === childId);
                return !currentChildParticipant?.isArchived;
            }).filter(t => t.id !== selectedThread.id);

            if (newActiveThreads.length > 0) {
                setSelectedThread(newActiveThreads[0]);
            } else {
                setSelectedThread(null);
            }

            Alert.alert('Success', 'Conversation archived');
        } catch (error) {
            console.error('[MessagesScreen] Failed to archive thread:', error);
            Alert.alert('Error', 'Failed to archive conversation');
        }
    };

    // Handle unarchive thread
    const handleUnarchiveThread = async (threadId: string) => {
        try {
            console.log('[MessagesScreen] Unarchiving thread:', threadId);
            await messageApi.updateThread(threadId, { isArchived: false });

            // Refresh threads
            await loadThreads();

            Alert.alert('Success', 'Conversation unarchived');
        } catch (error) {
            console.error('[MessagesScreen] Failed to unarchive thread:', error);
            Alert.alert('Error', 'Failed to unarchive conversation');
        }
    };

    // Filter threads based on archive status
    const activeThreads = threads.filter((thread) => {
        if (!thread?.participants || !Array.isArray(thread.participants)) return true;
        const currentChildParticipant = thread.participants.find((p) => p.childId === childId);
        return !currentChildParticipant?.isArchived;
    });
    const archivedThreads = threads.filter((thread) => {
        if (!thread?.participants || !Array.isArray(thread.participants)) return false;
        const currentChildParticipant = thread.participants.find((p) => p.childId === childId);
        return currentChildParticipant?.isArchived === true;
    });
    const displayedThreads = showArchivedChats ? archivedThreads : activeThreads;

    // Filter by search term
    const filteredThreads = displayedThreads.filter((thread) => {
        if (!thread) return false;
        const threadName = thread.threadName || thread.name || '';
        const search = searchTerm || '';
        return threadName.toLowerCase().includes(search.toLowerCase());
    });

    if (loading) {
        return (
            <View style={styles.container}>
                <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={styles.gradient}>
                    <SafeAreaView style={styles.safeArea}>
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.accent.primary} />
                            <Text style={styles.loadingText}>Loading messages...</Text>
                        </View>
                    </SafeAreaView>
                </LinearGradient>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <LinearGradient colors={[colors.background.primary, colors.background.secondary]} style={styles.gradient}>
                <SafeAreaView style={styles.safeArea}>
                    {selectedThread ? (
                        // CHAT VIEW - Full screen when thread is selected
                        <View style={styles.chatContainer}>
                            {/* Chat Header with Menu Button */}
                            <View style={styles.chatHeader}>
                                <TouchableOpacity
                                    style={styles.menuButton}
                                    onPress={openThreadList}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons name="menu" size={24} color={colors.text.primary} />
                                </TouchableOpacity>

                                <View style={styles.chatHeaderInfo}>
                                    <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                                        {selectedThread.threadName || selectedThread.name || 'Unknown'}
                                    </Text>
                                    <View style={styles.chatHeaderSubtitleContainer}>
                                        <View style={[
                                            styles.connectionDot,
                                            { backgroundColor: isSocketConnected ? colors.accent.success : colors.status.warning }
                                        ]} />
                                        <Text style={styles.chatHeaderSubtitle}>
                                            {isSocketConnected ? 'Online' : 'Connecting...'}
                                        </Text>
                                    </View>
                                </View>

                                <TouchableOpacity
                                    style={styles.headerActionButton}
                                    onPress={() => {
                                        const isArchived = selectedThread.participants.find(p => p.childId === childId)?.isArchived === true;
                                        if (isArchived) {
                                            handleUnarchiveThread(selectedThread.id);
                                        } else {
                                            handleArchiveThread();
                                        }
                                    }}
                                    activeOpacity={0.7}
                                >
                                    <Ionicons
                                        name={selectedThread.participants.find(p => p.childId === childId)?.isArchived ? "arrow-undo" : "archive"}
                                        size={22}
                                        color={colors.text.secondary}
                                    />
                                </TouchableOpacity>
                            </View>

                            {/* Chat Area */}
                            <ChatArea
                                thread={selectedThread}
                                messages={messages}
                                loading={loadingMessages}
                                onSendMessage={handleSendMessage}
                                onEditMessage={handleEditMessage}
                                onDeleteMessage={handleDeleteMessage}
                                onReplyMessage={(message) => setReplyToMessage(message)}
                                onForwardMessage={handleForwardMessage}
                                onReactMessage={handleReactMessage}
                                replyToMessage={replyToMessage}
                                isArchived={selectedThread.participants.find(p => p.childId === childId)?.isArchived === true}
                                onArchive={handleArchiveThread}
                                onUnarchive={handleUnarchiveThread}
                            />
                        </View>
                    ) : (
                        // WELCOME SCREEN - Show when no thread is selected
                        <View style={styles.welcomeContainer}>
                            <View style={styles.welcomeContent}>
                                <LinearGradient
                                    colors={colors.gradient.primary}
                                    style={styles.welcomeIconContainer}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 1 }}
                                >
                                    <Ionicons name="chatbubbles" size={64} color="#FFFFFF" />
                                </LinearGradient>

                                <Text style={styles.welcomeTitle}>Welcome to Family Chat</Text>
                                <Text style={styles.welcomeSubtitle}>
                                    Stay connected with your family. Start a conversation now!
                                </Text>

                                <TouchableOpacity
                                    style={styles.viewConversationsButton}
                                    onPress={openThreadList}
                                    activeOpacity={0.8}
                                >
                                    <LinearGradient
                                        colors={colors.gradient.primary}
                                        style={styles.viewConversationsButtonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    >
                                        <Ionicons name="chatbubbles-outline" size={20} color="#FFFFFF" />
                                        <Text style={styles.viewConversationsButtonText}>View Conversations</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.welcomeStats}>
                                    <View style={styles.welcomeStat}>
                                        <Text style={styles.welcomeStatNumber}>{activeThreads.length}</Text>
                                        <Text style={styles.welcomeStatLabel}>Active Chats</Text>
                                    </View>
                                    <View style={styles.welcomeStatDivider} />
                                    <View style={styles.welcomeStat}>
                                        <Text style={styles.welcomeStatNumber}>
                                            {threads.reduce((sum, t) => sum + (t.unreadCount || 0), 0)}
                                        </Text>
                                        <Text style={styles.welcomeStatLabel}>Unread</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Sliding Thread List Drawer */}
                    {isThreadListOpen && (
                        <>
                            {/* Overlay */}
                            <Pressable
                                style={styles.overlay}
                                onPress={closeThreadList}
                            >
                                <Animated.View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.6)' }} />
                            </Pressable>

                            {/* Sliding Drawer */}
                            <Animated.View
                                style={[
                                    styles.threadListDrawer,
                                    {
                                        transform: [{ translateX: slideAnimation }],
                                    },
                                ]}
                            >
                                {/* Drawer Header */}
                                <View style={styles.drawerHeader}>
                                    <View style={styles.drawerHeaderContent}>
                                        <Text style={styles.drawerHeaderTitle}>Messages</Text>
                                        <View style={styles.drawerHeaderSubtitleContainer}>
                                            <View style={[
                                                styles.connectionDot,
                                                { backgroundColor: isSocketConnected ? colors.accent.success : colors.status.warning }
                                            ]} />
                                            <Text style={styles.drawerHeaderSubtitle}>
                                                {isSocketConnected ? 'Connected' : 'Reconnecting...'} • {childName || 'Family Chat'}
                                            </Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.closeDrawerButton}
                                        onPress={closeThreadList}
                                        activeOpacity={0.7}
                                    >
                                        <Ionicons name="close" size={24} color={colors.text.secondary} />
                                    </TouchableOpacity>
                                </View>

                                {/* Thread List */}
                                <ThreadList
                                    threads={filteredThreads}
                                    selectedThread={selectedThread}
                                    onThreadSelect={handleThreadSelect}
                                    searchTerm={searchTerm}
                                    onSearchChange={setSearchTerm}
                                    showArchivedChats={showArchivedChats}
                                    onToggleArchive={() => setShowArchivedChats(!showArchivedChats)}
                                    archivedCount={archivedThreads.length}
                                    activeCount={activeThreads.length}
                                />
                            </Animated.View>
                        </>
                    )}

                    {/* Edit Message Modal */}
                    {editingMessage && (
                        <EditMessageModal
                            visible={!!editingMessage}
                            originalContent={editingMessage.content}
                            onSave={(newContent) => handleSaveEdit(editingMessage.id, newContent)}
                            onClose={() => setEditingMessage(null)}
                        />
                    )}

                    {/* Delete Confirmation Modal */}
                    {messageToDelete && (
                        <DeleteConfirmationModal
                            visible={!!messageToDelete}
                            messageContent={messages.find(m => m.id === messageToDelete)?.content || ''}
                            onConfirm={handleConfirmDelete}
                            onClose={() => setMessageToDelete(null)}
                        />
                    )}

                    {/* Forward Message Modal */}
                    {messageToForward && (
                        <ForwardModal
                            visible={!!messageToForward}
                            threads={threads}
                            onForward={handleConfirmForward}
                            onClose={() => setMessageToForward(null)}
                        />
                    )}
                </SafeAreaView>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing.md,
    },
    loadingText: {
        ...typography.body,
        color: colors.text.secondary,
    },

    // Chat View Styles (when thread is selected)
    chatContainer: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        backgroundColor: colors.background.tertiary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        ...shadows.sm,
        minHeight: 60,
    },
    menuButton: {
        padding: spacing.xs,
        marginRight: spacing.sm,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    chatHeaderInfo: {
        flex: 1,
        marginRight: spacing.sm,
        justifyContent: 'center',
    },
    chatHeaderTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text.primary,
        marginBottom: 2,
    },
    chatHeaderSubtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    chatHeaderSubtitle: {
        ...typography.small,
        color: colors.text.secondary,
    },
    headerActionButton: {
        padding: spacing.xs,
        justifyContent: 'center',
        alignItems: 'center',
        width: 40,
        height: 40,
    },
    connectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },

    // Welcome Screen Styles (when no thread is selected)
    welcomeContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    welcomeContent: {
        alignItems: 'center',
        maxWidth: 400,
        width: '100%',
    },
    welcomeIconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.xl,
        ...shadows.lg,
    },
    welcomeTitle: {
        ...typography.h2,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    welcomeSubtitle: {
        ...typography.body,
        color: colors.text.secondary,
        textAlign: 'center',
        marginBottom: spacing.xl,
        lineHeight: 24,
    },
    viewConversationsButton: {
        width: '100%',
        marginBottom: spacing.xl,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        ...shadows.md,
    },
    viewConversationsButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
    },
    viewConversationsButtonText: {
        ...typography.body,
        color: '#FFFFFF',
        fontWeight: '600',
    },
    welcomeStats: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.background.elevated,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        width: '100%',
        ...shadows.sm,
    },
    welcomeStat: {
        flex: 1,
        alignItems: 'center',
    },
    welcomeStatNumber: {
        ...typography.h2,
        color: colors.accent.primary,
        marginBottom: spacing.xs,
    },
    welcomeStatLabel: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    welcomeStatDivider: {
        width: 1,
        height: 40,
        backgroundColor: colors.border.default,
        marginHorizontal: spacing.lg,
    },

    // Sliding Drawer Styles
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    threadListDrawer: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 0,
        width: THREAD_LIST_WIDTH,
        backgroundColor: colors.background.primary,
        zIndex: 101,
        ...shadows.xl,
    },
    drawerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        paddingTop: spacing.lg,
        backgroundColor: colors.background.tertiary,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    drawerHeaderContent: {
        flex: 1,
    },
    drawerHeaderTitle: {
        ...typography.h3,
        color: colors.text.primary,
    },
    drawerHeaderSubtitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        gap: spacing.xs,
    },
    drawerHeaderSubtitle: {
        ...typography.caption,
        color: colors.text.secondary,
    },
    closeDrawerButton: {
        padding: spacing.xs,
        marginLeft: spacing.sm,
    },
});

export default MessagesScreen;
