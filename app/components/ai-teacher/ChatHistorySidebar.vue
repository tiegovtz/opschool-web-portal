<template>
  <div
    class="fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-50 transition-transform duration-300 ease-in-out"
    :class="isOpen ? 'translate-x-0 w-80' : '-translate-x-full w-80'"
  >
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 bg-gradient-to-r from-oceanBlue to-deepBlue">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">Chat History</h2>
        <button
          @click="$emit('close')"
          class="text-white hover:bg-white/20 p-1.5 rounded-lg transition-colors"
        >
          <Icon name="heroicons:x-mark" class="w-5 h-5" />
        </button>
      </div>
      <button
        @click="handleNewChat"
        class="w-full bg-white text-oceanBlue px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
      >
        <Icon name="heroicons:plus" class="w-5 h-5" />
        <span>New Chat</span>
      </button>
    </div>

    <!-- Sessions List -->
    <div class="h-[calc(100vh-140px)] overflow-y-auto">
      <div v-if="chatStore.loading && sessions.length === 0" class="p-4">
        <div class="flex items-center justify-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-oceanBlue"></div>
        </div>
      </div>

      <div v-else-if="sessions.length === 0" class="p-4">
        <div class="text-center py-8 text-gray-500">
          <Icon name="heroicons:chat-bubble-left-right" class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p class="text-sm">No chat history yet</p>
          <p class="text-xs mt-1">Start a new conversation to see it here</p>
        </div>
      </div>

      <div v-else class="p-2 space-y-1">
        <div
          v-for="session in sessions"
          :key="session.id"
          @click="handleSelectSession(session.id)"
          class="group relative p-3 rounded-lg cursor-pointer transition-all"
          :class="
            chatStore.activeSessionId === session.id
              ? 'bg-oceanBlue/10 border border-oceanBlue/20'
              : 'hover:bg-gray-50 border border-transparent'
          "
        >
          <!-- Session Content -->
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
              :class="
                chatStore.activeSessionId === session.id
                  ? 'bg-oceanBlue text-white'
                  : 'bg-gray-100 text-gray-600'
              "
            >
              <Icon name="heroicons:chat-bubble-left" class="w-5 h-5" />
            </div>

            <div class="flex-1 min-w-0">
              <h3
                class="text-sm font-medium truncate"
                :class="
                  chatStore.activeSessionId === session.id
                    ? 'text-oceanBlue'
                    : 'text-gray-900'
                "
              >
                {{ getSessionTitle(session) }}
              </h3>
              <p
                v-if="session.topic || session.details"
                class="text-xs mt-1 truncate"
                :class="
                  chatStore.activeSessionId === session.id
                    ? 'text-oceanBlue/70'
                    : 'text-gray-500'
                "
              >
                {{ session.topic || session.details || 'No description' }}
              </p>
              <div class="flex items-center gap-2 mt-1.5">
                <span
                  class="text-xs"
                  :class="
                    chatStore.activeSessionId === session.id
                      ? 'text-oceanBlue/70'
                      : 'text-gray-400'
                  "
                >
                  {{ formatDate(session.lastMessageAt || session.createdAt) }}
                </span>
                <span
                  v-if="session.messageCount > 0"
                  class="text-xs px-1.5 py-0.5 rounded bg-gray-100"
                  :class="
                    chatStore.activeSessionId === session.id
                      ? 'bg-oceanBlue/20 text-oceanBlue'
                      : 'text-gray-500'
                  "
                >
                  {{ session.messageCount }} {{ session.messageCount === 1 ? 'message' : 'messages' }}
                </span>
              </div>
            </div>

            <!-- Delete Button -->
            <button
              @click.stop="handleDeleteSession(session.id)"
              class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
            >
              <Icon name="heroicons:trash" class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-white">
      <div class="text-xs text-gray-500 text-center">
        <p>{{ sessions.length }} {{ sessions.length === 1 ? 'conversation' : 'conversations' }}</p>
      </div>
    </div>
  </div>

  <!-- Overlay -->
  <div
    v-if="isOpen"
    @click="$emit('close')"
    class="fixed inset-0 bg-black/20 z-40 transition-opacity"
  ></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useChatStore } from '~/stores/chatStore';
import type { ChatSession } from '~/types/chat.interface';

const props = defineProps<{
  isOpen: boolean;
}>();

const emit = defineEmits<{
  close: [];
  newChat: [];
  sessionSelected: [sessionId: string];
}>();

const chatStore = useChatStore();
const route = useRoute();
const router = useRouter();

const sessions = computed(() => chatStore.sessions);

// Get session title
const getSessionTitle = (session: ChatSession): string => {
  if (session.title) return session.title;
  if (session.topic) return session.topic;
  if (session.room_name) return session.room_name;
  if (session.details) {
    return session.details.length > 30
      ? session.details.substring(0, 30) + '...'
      : session.details;
  }
  return 'New Conversation';
};

// Format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Just now';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// Handle new chat
const handleNewChat = async () => {
  emit('newChat');
  emit('close');
};

// Handle session selection
const handleSelectSession = async (sessionId: string) => {
  if (chatStore.activeSessionId === sessionId) {
    emit('close');
    return;
  }

  emit('sessionSelected', sessionId);
  emit('close');
};

// Handle delete session
const handleDeleteSession = async (sessionId: string) => {
  if (!confirm('Are you sure you want to delete this conversation? This action cannot be undone.')) {
    return;
  }

  try {
    await chatStore.deleteSession(sessionId);
    
    // If deleted session was active, create a new one
    if (chatStore.activeSessionId === sessionId) {
      await chatStore.createSession();
      router.replace({ query: { sessionId: chatStore.activeSessionId } });
    }
  } catch (error) {
    console.error('[ChatHistory] Error deleting session:', error);
    alert('Failed to delete conversation. Please try again.');
  }
};
</script>
