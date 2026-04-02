import { ref, computed } from 'vue';
import type { VideoSession, VideoInteraction } from '~/types/video-quiz.interface';
import apiDocs from '~/utilities/apiDocs';

export const useVideoSession = (videoId: string, userId: string) => {
  const currentSession = ref<VideoSession | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  
  const onSessionCreated = ref<((session: VideoSession) => void) | null>(null);
  const onSessionUpdated = ref<((session: VideoSession) => void) | null>(null);
  const onError = ref<((error: string) => void) | null>(null);
  const sessionEndpoints = {
    create: `/api/video/${videoId}/sessions`,
    read: (sessionId: string) => `/api/video/${videoId}/sessions/${sessionId}`,
    update: (sessionId: string) => `/api/video/${videoId}/sessions/${sessionId}`,
  };

  /**
   * Create new video session
   */
  const createSession = async (): Promise<VideoSession> => {
    try {
      isLoading.value = true;
      error.value = null;

      const newSession: VideoSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        videoId,
        userId,
        currentPath: [],
        interactions: [],
        totalScore: 0,
        completionPercentage: 0,
        startedAt: new Date(),
        lastUpdatedAt: new Date(),
      };

      // Try to save to backend if API endpoint exists
      try {
        const authToken = useCookie('signInAccessToken').value;
        if (authToken) {
          await $fetch(sessionEndpoints.create, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: newSession,
          });
        }
      } catch (apiError: any) {
        // If API call fails, still use local session (for offline support)
        console.warn('[useVideoSession] Failed to save session to backend, using local session:', apiError.message);
      }

      currentSession.value = newSession;

      // Save to localStorage as backup
      if (typeof window !== 'undefined') {
        localStorage.setItem(`video_session_${videoId}`, JSON.stringify(newSession));
      }

      if (onSessionCreated.value) {
        onSessionCreated.value(newSession);
      }

      return newSession;
    } catch (err: any) {
      const errorMsg = `Failed to create session: ${err.message}`;
      error.value = errorMsg;
      console.error('[useVideoSession]', errorMsg);
      if (onError.value) {
        onError.value(errorMsg);
      }
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Load existing session
   */
  const loadSession = async (sessionId?: string): Promise<VideoSession | null> => {
    try {
      isLoading.value = true;
      error.value = null;

      // Try to load from backend if sessionId provided
      if (sessionId) {
        try {
          const authToken = useCookie('signInAccessToken').value;
          if (authToken) {
            const session = await $fetch(sessionEndpoints.read(sessionId), {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
              },
            });
            currentSession.value = session as VideoSession;
            return session as VideoSession;
          }
        } catch (apiError: any) {
          console.warn('[useVideoSession] Failed to load session from backend, trying localStorage:', apiError.message);
        }
      }

      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(`video_session_${videoId}`);
        if (stored) {
          const session = JSON.parse(stored) as VideoSession;
          currentSession.value = session;
          return session;
        }
      }

      return null;
    } catch (err: any) {
      const errorMsg = `Failed to load session: ${err.message}`;
      error.value = errorMsg;
      console.error('[useVideoSession]', errorMsg);
      if (onError.value) {
        onError.value(errorMsg);
      }
      return null;
    } finally {
      isLoading.value = false;
    }
  };

  /**
   * Update session with new interaction
   */
  const addInteraction = (interaction: VideoInteraction) => {
    if (!currentSession.value) {
      console.warn('[useVideoSession] No active session, creating new one');
      createSession();
      return;
    }

    // Add interaction if not already present
    const existingIndex = currentSession.value.interactions.findIndex(i => i.quizId === interaction.quizId);
    if (existingIndex >= 0) {
      // Update existing interaction
      currentSession.value.interactions[existingIndex] = interaction;
    } else {
      // Add new interaction
      currentSession.value.interactions.push(interaction);
    }

    // Update session statistics
    updateSessionStats();
    
    // Save to backend and localStorage
    saveSession();
  };

  /**
   * Add branch to path
   */
  const addBranchToPath = (branchId: string) => {
    if (!currentSession.value) {
      console.warn('[useVideoSession] No active session, creating new one');
      createSession();
      return;
    }

    if (!currentSession.value.currentPath.includes(branchId)) {
      currentSession.value.currentPath.push(branchId);
      currentSession.value.lastUpdatedAt = new Date();
      saveSession();
    }
  };

  /**
   * Update session statistics
   */
  const updateSessionStats = () => {
    if (!currentSession.value) return;

    // Calculate total score
    currentSession.value.totalScore = currentSession.value.interactions.reduce(
      (sum, interaction) => sum + interaction.score,
      0
    );

    // Calculate completion percentage (based on interactions vs expected)
    // For now, we'll calculate based on interactions completed
    // Simple completion percentage based on interactions
    if (currentSession.value.interactions.length > 0) {
      const correctCount = currentSession.value.interactions.filter(i => i.isCorrect).length;
      currentSession.value.completionPercentage = Math.floor(
        (correctCount / currentSession.value.interactions.length) * 100
      );
    }

    currentSession.value.lastUpdatedAt = new Date();
  };

  /**
   * Save session to backend and localStorage
   */
  const saveSession = async () => {
    if (!currentSession.value) return;

    try {
      // Save to localStorage first (fast)
      if (typeof window !== 'undefined') {
        localStorage.setItem(`video_session_${videoId}`, JSON.stringify(currentSession.value));
      }

      // Try to save to backend
      try {
        const authToken = useCookie('signInAccessToken').value;
        if (authToken) {
          await $fetch(sessionEndpoints.update(currentSession.value.id), {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
            body: currentSession.value,
          });

          if (onSessionUpdated.value) {
            onSessionUpdated.value(currentSession.value);
          }
        }
      } catch (apiError: any) {
        console.warn('[useVideoSession] Failed to save session to backend:', apiError.message);
        // Continue with localStorage only
      }
    } catch (err: any) {
      const errorMsg = `Failed to save session: ${err.message}`;
      console.error('[useVideoSession]', errorMsg);
      if (onError.value) {
        onError.value(errorMsg);
      }
    }
  };

  /**
   * Get session progress
   */
  const sessionProgress = computed(() => {
    if (!currentSession.value) {
      return {
        score: 0,
        completionPercentage: 0,
        interactionsCount: 0,
        pathLength: 0,
      };
    }

    return {
      score: currentSession.value.totalScore,
      completionPercentage: currentSession.value.completionPercentage,
      interactionsCount: currentSession.value.interactions.length,
      pathLength: currentSession.value.currentPath.length,
      startedAt: currentSession.value.startedAt,
      lastUpdatedAt: currentSession.value.lastUpdatedAt,
    };
  });

  /**
   * Reset session
   */
  const reset = () => {
    currentSession.value = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`video_session_${videoId}`);
    }
  };

  /**
   * Initialize session (load existing or create new)
   */
  const initialize = async (sessionId?: string) => {
    if (sessionId) {
      const loaded = await loadSession(sessionId);
      if (loaded) {
        return loaded;
      }
    }

    // Try to load from localStorage first
    const localSession = await loadSession();
    if (localSession) {
      return localSession;
    }

    // Create new session if none exists
    return await createSession();
  };

  return {
    currentSession,
    isLoading,
    error,
    sessionProgress,
    createSession,
    loadSession,
    addInteraction,
    addBranchToPath,
    updateSessionStats,
    saveSession,
    reset,
    initialize,
    onSessionCreated,
    onSessionUpdated,
    onError,
  };
};
