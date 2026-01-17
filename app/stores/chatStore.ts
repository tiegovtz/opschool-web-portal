import { defineStore } from 'pinia';
import type { ChatSession, ChatMessage, ChatContext, AddMessageRequest, CreateSessionRequest } from '~/types/chat.interface';
import { useChatHistory } from '~/composable/useChatHistory';

export const useChatStore = defineStore('chat', {
  state: () => ({
    activeSessionId: null as string | null,
    sessions: [] as ChatSession[],
    currentSession: null as (ChatSession & { messages?: ChatMessage[] }) | null,
    loading: false,
    error: null as string | null,
  }),

  getters: {
    activeSession: (state) => {
      if (!state.activeSessionId) return null;
      return state.sessions.find(s => s.id === state.activeSessionId) || null;
    },
    
    hasActiveSession: (state) => !!state.activeSessionId,
    
    sessionMessages: (state) => {
      return state.currentSession?.messages || [];
    },
  },

  actions: {
    async loadSessions() {
      this.loading = true;
      this.error = null;
      try {
        const chatHistory = useChatHistory();
        this.sessions = await chatHistory.getSessions();
        // Sort by lastMessageAt descending (most recent first)
        this.sessions.sort((a, b) => {
          const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
          const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
          return bTime - aTime;
        });
      } catch (error: any) {
        this.error = error.message || 'Failed to load sessions';
        console.error('[ChatStore] Error loading sessions:', error);
      } finally {
        this.loading = false;
      }
    },

    async createSession(context?: ChatContext | CreateSessionRequest) {
      this.loading = true;
      this.error = null;
      try {
        const chatHistory = useChatHistory();
        
        // Get user from cookie to auto-populate teacher fields
        const userCookie = useCookie('signInUserToken');
        const user = userCookie.value as any;
        
        // Build request - support both new API structure and legacy structure
        const request: CreateSessionRequest = {
          // New API structure fields
          teacherId: (context as any)?.teacherId || user?._id,
          topic: (context as any)?.topic || context?.topic,
          start_time: (context as any)?.start_time || new Date().toISOString(),
          end_time: (context as any)?.end_time,
          school_class: (context as any)?.school_class || context?.school_class,
          subject: (context as any)?.subject || context?.subject,
          room_name: (context as any)?.room_name || context?.room_name,
          details: (context as any)?.details || context?.details,
          school_registration_number: (context as any)?.school_registration_number || context?.school_registration_number,
          teacherEmail: (context as any)?.teacherEmail || context?.teacherEmail || user?.email || user?.username,
          // Legacy fields for backward compatibility
          contextType: (context as any)?.contextType || (context?.chapterName ? 'chapter' : 'general'),
          chapterName: context?.chapterName,
          level: context?.level,
          chapterNo: context?.chapterNo,
        };
        
        const newSession = await chatHistory.createSession(request);
        this.sessions.unshift(newSession); // Add to beginning
        this.activeSessionId = newSession.id;
        this.currentSession = { ...newSession, messages: [] };
        return newSession;
      } catch (error: any) {
        this.error = error.message || 'Failed to create session';
        console.error('[ChatStore] Error creating session:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async loadSession(sessionId: string) {
      this.loading = true;
      this.error = null;
      try {
        const chatHistory = useChatHistory();
        const session = await chatHistory.getSession(sessionId);
        this.currentSession = session;
        this.activeSessionId = sessionId;
        
        // Update session in sessions list if it exists
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          this.sessions[index] = { ...session };
        } else {
          this.sessions.unshift(session);
        }
        
        return session;
      } catch (error: any) {
        this.error = error.message || 'Failed to load session';
        console.error('[ChatStore] Error loading session:', error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateSessionTitle(sessionId: string, title: string) {
      try {
        const chatHistory = useChatHistory();
        const updated = await chatHistory.updateSession(sessionId, { title });
        
        // Update in sessions list
        const index = this.sessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
          this.sessions[index] = updated;
        }
        
        // Update current session if active
        if (this.currentSession?.id === sessionId) {
          this.currentSession.title = updated.title;
        }
        
        return updated;
      } catch (error: any) {
        this.error = error.message || 'Failed to update session';
        console.error('[ChatStore] Error updating session:', error);
        throw error;
      }
    },

    async deleteSession(sessionId: string) {
      try {
        const chatHistory = useChatHistory();
        await chatHistory.deleteSession(sessionId);
        
        // Remove from sessions list
        this.sessions = this.sessions.filter(s => s.id !== sessionId);
        
        // Clear active session if deleted
        if (this.activeSessionId === sessionId) {
          this.activeSessionId = null;
          this.currentSession = null;
        }
      } catch (error: any) {
        this.error = error.message || 'Failed to delete session';
        console.error('[ChatStore] Error deleting session:', error);
        throw error;
      }
    },

    async addMessage(message: AddMessageRequest) {
      if (!this.activeSessionId) {
        throw new Error('No active session');
      }
      
      try {
        const chatHistory = useChatHistory();
        const savedMessage = await chatHistory.addMessage(this.activeSessionId, message);
        
        // Add to current session messages
        if (this.currentSession) {
          if (!this.currentSession.messages) {
            this.currentSession.messages = [];
          }
          this.currentSession.messages.push(savedMessage);
          
          // Update message count and last message time
          this.currentSession.messageCount = this.currentSession.messages.length;
          this.currentSession.lastMessageAt = savedMessage.createdAt;
        }
        
        // Update session in sessions list
        const index = this.sessions.findIndex(s => s.id === this.activeSessionId);
        if (index !== -1 && this.currentSession) {
          this.sessions[index] = { ...this.currentSession };
        }
        
        return savedMessage;
      } catch (error: any) {
        this.error = error.message || 'Failed to add message';
        console.error('[ChatStore] Error adding message:', error);
        throw error;
      }
    },

    setActiveSession(sessionId: string | null) {
      this.activeSessionId = sessionId;
      if (!sessionId) {
        this.currentSession = null;
      }
    },

    clearActiveSession() {
      this.activeSessionId = null;
      this.currentSession = null;
    },

    // Helper to add message locally (before sync)
    addMessageLocally(message: Omit<ChatMessage, 'id' | 'sessionId' | 'createdAt'>) {
      if (!this.currentSession) return;
      
      const tempMessage: ChatMessage = {
        ...message,
        id: `temp-${Date.now()}`,
        sessionId: this.activeSessionId!,
        createdAt: new Date().toISOString(),
      };
      
      if (!this.currentSession.messages) {
        this.currentSession.messages = [];
      }
      this.currentSession.messages.push(tempMessage);
    },

    // Enforce retention policy
    async enforceRetention(maxSessions?: number) {
      try {
        const userCookie = useCookie('signInUserToken');
        const user = userCookie.value as any;
        
        if (!user?._id) {
          throw new Error('User ID not found');
        }

        const chatHistory = useChatHistory();
        const result = await chatHistory.enforceRetention({
          userId: user._id,
          maxSessions,
        });

        // Reload sessions after retention enforcement
        await this.loadSessions();

        return result;
      } catch (error: any) {
        this.error = error.message || 'Failed to enforce retention policy';
        console.error('[ChatStore] Error enforcing retention:', error);
        throw error;
      }
    },
  },
});
