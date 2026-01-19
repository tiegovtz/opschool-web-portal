import type { 
  ChatSession, 
  ChatMessage, 
  CreateSessionRequest, 
  AddMessageRequest 
} from '~/types/chat.interface';
import apiDocs from '~/utilities/apiDocs';

export const useChatHistory = () => {
  const baseURL = apiDocs.baseURL;
  const token = useCookie('signInAccessToken').value;

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });

  // Create a new chat session
  const createSession = async (request: CreateSessionRequest): Promise<ChatSession> => {
    try {
      const response = await $fetch<ChatSession>(
        apiDocs.chat.createSession,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: request,
        }
      );
      return response;
    } catch (error: any) {
      console.error('[ChatHistory] Error creating session:', error);
      throw error;
    }
  };

  // Get all sessions for the current user
  const getSessions = async (): Promise<ChatSession[]> => {
    try {
      const response = await $fetch<ChatSession[]>(
        apiDocs.chat.getSessions,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return response || [];
    } catch (error: any) {
      console.error('[ChatHistory] Error fetching sessions:', error);
      throw error;
    }
  };

  // Get a specific session with messages
  const getSession = async (sessionId: string): Promise<ChatSession & { messages?: ChatMessage[] }> => {
    try {
      const url = apiDocs.chat.getSession.replace(':id', sessionId);
      const response = await $fetch<ChatSession & { messages?: ChatMessage[] }>(
        url,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return response;
    } catch (error: any) {
      console.error('[ChatHistory] Error fetching session:', error);
      throw error;
    }
  };

  // Update a session (e.g., title)
  const updateSession = async (
    sessionId: string, 
    updates: Partial<Pick<ChatSession, 'title'>>
  ): Promise<ChatSession> => {
    try {
      const url = apiDocs.chat.updateSession.replace(':id', sessionId);
      const response = await $fetch<ChatSession>(
        url,
        {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: updates,
        }
      );
      return response;
    } catch (error: any) {
      console.error('[ChatHistory] Error updating session:', error);
      throw error;
    }
  };

  // Delete a session
  const deleteSession = async (sessionId: string): Promise<void> => {
    try {
      const url = apiDocs.chat.deleteSession.replace(':id', sessionId);
      await $fetch(
        url,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      );
    } catch (error: any) {
      console.error('[ChatHistory] Error deleting session:', error);
      throw error;
    }
  };

  // Add a message to a session
  const addMessage = async (
    sessionId: string, 
    message: AddMessageRequest
  ): Promise<ChatMessage> => {
    try {
      const url = apiDocs.chat.addMessage.replace(':id', sessionId);
      const response = await $fetch<ChatMessage>(
        url,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: message,
        }
      );
      return response;
    } catch (error: any) {
      console.error('[ChatHistory] Error adding message:', error);
      throw error;
    }
  };

  // Get messages for a session (paginated)
  const getMessages = async (
    sessionId: string,
    options?: { page?: number; limit?: number }
  ): Promise<ChatMessage[]> => {
    try {
      const url = apiDocs.chat.getMessages.replace(':id', sessionId);
      const queryParams = new URLSearchParams();
      if (options?.page) queryParams.append('page', options.page.toString());
      if (options?.limit) queryParams.append('limit', options.limit.toString());
      
      const fullUrl = queryParams.toString() 
        ? `${url}?${queryParams.toString()}` 
        : url;
      
      const response = await $fetch<ChatMessage[]>(
        fullUrl,
        {
          method: 'GET',
          headers: getAuthHeaders(),
        }
      );
      return response || [];
    } catch (error: any) {
      console.error('[ChatHistory] Error fetching messages:', error);
      throw error;
    }
  };

  // Enforce retention policy
  const enforceRetention = async (request: { userId: string; maxSessions?: number }): Promise<{ success: boolean; deletedCount: number; maxSessions: number }> => {
    try {
      const response = await $fetch<{ success: boolean; deletedCount: number; maxSessions: number }>(
        apiDocs.chat.enforceRetention,
        {
          method: 'POST',
          headers: getAuthHeaders(),
          body: request,
        }
      );
      return response;
    } catch (error: any) {
      console.error('[ChatHistory] Error enforcing retention:', error);
      throw error;
    }
  };

  return {
    createSession,
    getSessions,
    getSession,
    updateSession,
    deleteSession,
    addMessage,
    getMessages,
    enforceRetention,
  };
};
