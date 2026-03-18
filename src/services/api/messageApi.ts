/**
 * Message API Client for PMK Child Mobile App
 * REST API client for messaging endpoints
 * Backend: parent-dashboard-BE at /api/v1/messaging/child
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import * as SecureStore from 'expo-secure-store';
import {
    Thread,
    Message,
    CreateThreadRequest,
    CreateThreadResponse,
    GetThreadsResponse,
    GetMessagesRequest,
    GetMessagesResponse,
    SendMessageRequest,
    SendMessageResponse,
    UpdateThreadRequest,
    UpdateThreadResponse,
    UploadFileResponse,
    AddReactionRequest,
    AddReactionResponse,
    AutoCreateThreadsResponse,
} from './types';

// Get API base URL from environment
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';

class MessageApiClient {
    private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: `${API_BASE_URL}/messaging/child`,  // Use child routes for device authentication
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add JWT token
        this.client.interceptors.request.use(
            async (config) => {
                try {
                    // Get token from secure storage (using same key as deviceService)
                    const credentials = await SecureStore.getItemAsync('pmk_device_credentials');
                    if (credentials) {
                        const { token } = JSON.parse(credentials);
                        if (token) {
                            config.headers.Authorization = `Bearer ${token}`;
                            console.log('[MessageApi] Added auth token to request');
                        } else {
                            console.warn('[MessageApi] No token found in credentials');
                        }
                    } else {
                        console.warn('[MessageApi] No credentials found in SecureStore');
                    }

                    // Debug log request data
                    if (config.url?.includes('/reactions')) {
                        console.log('[MessageApi] Reaction request interceptor - data:', config.data);
                        console.log('[MessageApi] Reaction request interceptor - headers:', config.headers);
                    }
                } catch (error) {
                    console.error('[MessageApi] Error getting auth token:', error);
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                console.error('[MessageApi] API Error:', {
                    url: error.config?.url,
                    method: error.config?.method,
                    status: error.response?.status,
                    message: error.message,
                });
                return Promise.reject(error);
            }
        );
    }

    // ==================== Thread Endpoints ====================

    /**
     * Get all threads for the current user/child
     */
    async getThreads(): Promise<Thread[]> {
        try {
            const response = await this.client.get<{ success: boolean; data: { threads: Thread[]; total: number } }>('/threads');
            // Backend returns data.data.threads (axios adds .data, backend has data: { threads })
            return response.data.data?.threads || [];
        } catch (error) {
            console.error('[MessageApi] getThreads error:', error);
            throw error;
        }
    }

    /**
     * Get a specific thread by ID
     */
    async getThread(threadId: string): Promise<Thread> {
        try {
            const response = await this.client.get<{ success: boolean; thread: Thread }>(`/threads/${threadId}`);
            return response.data.thread;
        } catch (error) {
            console.error('[MessageApi] getThread error:', error);
            throw error;
        }
    }

    /**
     * Create a new thread
     */
    async createThread(data: CreateThreadRequest): Promise<Thread> {
        try {
            const response = await this.client.post<CreateThreadResponse>('/threads', data);
            return response.data.thread;
        } catch (error) {
            console.error('[MessageApi] createThread error:', error);
            throw error;
        }
    }

    /**
     * Update a thread (name, settings, archive status, etc.)
     */
    async updateThread(threadId: string, data: UpdateThreadRequest): Promise<Thread> {
        try {
            const response = await this.client.put<UpdateThreadResponse>(`/threads/${threadId}`, data);
            return response.data.thread;
        } catch (error) {
            console.error('[MessageApi] updateThread error:', error);
            throw error;
        }
    }

    /**
     * Delete a thread
     */
    async deleteThread(threadId: string): Promise<void> {
        try {
            await this.client.delete(`/threads/${threadId}`);
        } catch (error) {
            console.error('[MessageApi] deleteThread error:', error);
            throw error;
        }
    }

    /**
     * Get or create a direct thread with a specific user
     */
    async getOrCreateDirectThread(userId: string): Promise<Thread> {
        try {
            const response = await this.client.post<CreateThreadResponse>('/direct', { userId });
            return response.data.thread;
        } catch (error) {
            console.error('[MessageApi] getOrCreateDirectThread error:', error);
            throw error;
        }
    }

    /**
     * Auto-create threads for all family members (sibling threads)
     */
    async autoCreateThreads(): Promise<AutoCreateThreadsResponse> {
        try {
            const response = await this.client.post<{ success: boolean; message: string; data: { createdThreads: Thread[]; totalSiblings: number } }>('/auto-create-sibling-threads');
            // Backend returns data.data.createdThreads
            return {
                success: response.data.success,
                message: response.data.message,
                createdThreads: response.data.data?.createdThreads || [],
            };
        } catch (error) {
            console.error('[MessageApi] autoCreateThreads error:', error);
            throw error;
        }
    }

    // ==================== Message Endpoints ====================

    /**
     * Get messages for a thread (paginated)
     */
    async getMessages(params: GetMessagesRequest): Promise<GetMessagesResponse> {
        try {
            const { threadId, limit = 100, cursor, before } = params;
            const response = await this.client.get<{
                success: boolean;
                data: { messages: Message[]; total: number; hasMore: boolean; nextCursor?: string }
            }>(`/threads/${threadId}/messages`, {
                params: { limit, cursor, before },
            });
            // Backend returns data.data (axios adds .data, backend has data: { messages, hasMore })
            return {
                success: response.data.success,
                messages: response.data.data?.messages || [],
                hasMore: response.data.data?.hasMore || false,
                nextCursor: response.data.data?.nextCursor,
            };
        } catch (error) {
            console.error('[MessageApi] getMessages error:', error);
            throw error;
        }
    }

    /**
     * Send a message to a thread
     */
    async sendMessage(threadId: string, data: SendMessageRequest): Promise<Message> {
        try {
            const response = await this.client.post<SendMessageResponse>(`/threads/${threadId}/messages`, data);
            return response.data.message;
        } catch (error) {
            console.error('[MessageApi] sendMessage error:', error);
            throw error;
        }
    }

    /**
     * Edit a message
     */
    async editMessage(messageId: string, content: string): Promise<Message> {
        try {
            const response = await this.client.put<SendMessageResponse>(`/messages/${messageId}`, { content });
            return response.data.message;
        } catch (error) {
            console.error('[MessageApi] editMessage error:', error);
            throw error;
        }
    }

    /**
     * Delete a message
     */
    async deleteMessage(messageId: string): Promise<void> {
        try {
            await this.client.delete(`/messages/${messageId}`);
        } catch (error) {
            console.error('[MessageApi] deleteMessage error:', error);
            throw error;
        }
    }

    /**
     * Mark thread as read
     */
    async markThreadAsRead(threadId: string): Promise<void> {
        try {
            await this.client.put(`/threads/${threadId}/read`);
        } catch (error) {
            console.error('[MessageApi] markThreadAsRead error:', error);
            throw error;
        }
    }

    /**
     * Search messages in a thread
     */
    async searchMessages(threadId: string, query: string): Promise<Message[]> {
        try {
            const response = await this.client.get<{ success: boolean; messages: Message[] }>(
                `/threads/${threadId}/search`,
                { params: { query } }
            );
            return response.data.messages || [];
        } catch (error) {
            console.error('[MessageApi] searchMessages error:', error);
            throw error;
        }
    }

    // ==================== Reaction Endpoints ====================

    /**
     * Add a reaction to a message
     */
    async addReaction(messageId: string, emoji: string): Promise<void> {
        try {
            console.log('[MessageApi] Adding reaction:', { messageId, emoji });
            const requestBody = { emoji };
            console.log('[MessageApi] Request body:', JSON.stringify(requestBody));
            await this.client.post<AddReactionResponse>(`/messages/${messageId}/reactions`, requestBody);
            console.log('[MessageApi] Reaction added successfully');
        } catch (error) {
            console.error('[MessageApi] addReaction error:', error);
            throw error;
        }
    }

    /**
     * Remove a reaction from a message
     */
    async removeReaction(messageId: string, emoji: string): Promise<void> {
        try {
            await this.client.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
        } catch (error) {
            console.error('[MessageApi] removeReaction error:', error);
            throw error;
        }
    }

    // ==================== Participant Endpoints ====================

    /**
     * Add a participant to a thread
     */
    async addParticipant(threadId: string, userId: string): Promise<void> {
        try {
            await this.client.post(`/threads/${threadId}/participants`, { userId });
        } catch (error) {
            console.error('[MessageApi] addParticipant error:', error);
            throw error;
        }
    }

    /**
     * Remove a participant from a thread
     */
    async removeParticipant(threadId: string, participantId: string): Promise<void> {
        try {
            await this.client.delete(`/threads/${threadId}/participants/${participantId}`);
        } catch (error) {
            console.error('[MessageApi] removeParticipant error:', error);
            throw error;
        }
    }

    // ==================== File Upload Endpoints ====================

    /**
     * Upload a file for message attachment
     */
    async uploadFile(file: {
        uri: string;
        name: string;
        type: string;
    }): Promise<UploadFileResponse['file']> {
        try {
            const formData = new FormData();
            formData.append('file', {
                uri: file.uri,
                name: file.name,
                type: file.type,
            } as any);

            const response = await axios.post<UploadFileResponse>(
                `${API_BASE_URL}/upload/message`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: await this.getAuthHeader(),
                    },
                    timeout: 60000, // 60 seconds for file upload
                }
            );

            return response.data.file;
        } catch (error) {
            console.error('[MessageApi] uploadFile error:', error);
            throw error;
        }
    }

    /**
     * Upload multiple files
     */
    async uploadMultipleFiles(files: Array<{
        uri: string;
        name: string;
        type: string;
    }>): Promise<UploadFileResponse['file'][]> {
        try {
            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append('files', {
                    uri: file.uri,
                    name: file.name,
                    type: file.type,
                } as any);
            });

            const response = await axios.post<{ success: boolean; files: UploadFileResponse['file'][] }>(
                `${API_BASE_URL}/upload/messages/multiple`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        Authorization: await this.getAuthHeader(),
                    },
                    timeout: 120000, // 2 minutes for multiple files
                }
            );

            return response.data.files;
        } catch (error) {
            console.error('[MessageApi] uploadMultipleFiles error:', error);
            throw error;
        }
    }

    // ==================== Helper Methods ====================

    /**
     * Get authorization header with JWT token
     */
    private async getAuthHeader(): Promise<string> {
        try {
            const credentials = await SecureStore.getItemAsync('pmk_device_credentials');
            if (credentials) {
                const { token } = JSON.parse(credentials);
                return `Bearer ${token}`;
            }
            return '';
        } catch (error) {
            console.error('[MessageApi] Error getting auth header:', error);
            return '';
        }
    }
}

// Export singleton instance
export const messageApi = new MessageApiClient();
export default messageApi;
