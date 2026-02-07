<template>
  <!-- Desktop Sidebar (beside content) -->
  <div
    v-if="isOpen"
    :class="[
      'flex-shrink-0 w-80 h-full bg-white shadow-lg relative flex-col',
      compact ? 'flex' : 'hidden md:flex'
    ]"
  >
    <!-- Header -->
    <div class="p-5">
      <div class="flex items-center justify-between mb-4">
        <div class="flex w-full items-center gap-3">
          <div
            tabindex="0"
            aria-label="bulb icon with black strokes on white background"
            class="w-12 h-12 rounded-full flex items-center justify-center shadow-md"
          >
            <Icon
              name="heroicons:light-bulb"
              class="w-6 h-6"
            />
          </div>
          <div class="">
            <h2 class="text-lg font-bold tracking-tight">Chat History</h2>
            <p class="text-xs font-medium">Your conversations</p>
          </div>
          <!-- <button
            @click="handleNewChat"
            class="w-7 h-7 text-oceanBlue p-2 rounded-full font-semibold hover:bg-gray-50 transition-all duration-200 shadow-[0px_0px_50px_5px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
          >
            <Icon
              name="heroicons:plus"
              class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
            />
          </button> -->
        </div>
        <button
          @click="$emit('close')"
          class="md:hidden text-oceanBlue hover:bg-white/20 p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Close sidebar"
        >
          <Icon
            name="heroicons:x-mark"
            class="w-5 h-5"
          />
        </button>
      </div>
      <button
        @click="handleNewChat"
        class="w-full text-oceanBlue text-sm px-4 py-3 rounded-xl hover:bg-gray-50 transition-all duration-200 shadow-[0px_0px_50px_5px_rgba(0,0,0,0.1)] hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
      >
        <Icon
          name="heroicons:plus"
          class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
        />
        <span>New Chat</span>
      </button>
    </div>

    <!-- Search Bar (optional enhancement) -->

    <!-- Sessions List -->
    <div
      ref="sessionsContainer"
      class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
    >
      <div
        v-if="sessions.length > 3"
        class="p-4 border-b border-gray-100 bg-gray-50/50"
      >
        <div class="relative">
          <Icon
            name="heroicons:magnifying-glass"
            class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search conversations..."
            class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanBlue/20 focus:border-oceanBlue/50 bg-white transition-all"
          />
        </div>
      </div>
      <div
        v-if="chatStore.loading && sessions.length === 0"
        class="p-4"
      >
        <div class="flex flex-col items-center justify-center py-12">
          <div class="relative">
            <div
              class="animate-spin rounded-full h-10 w-10 border-3 border-oceanBlue/20 border-t-oceanBlue"
            ></div>
            <div
              class="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-oceanBlue/30"
            ></div>
          </div>
          <p class="mt-4 text-sm text-gray-500 font-medium">
            Loading conversations...
          </p>
        </div>
      </div>

      <div
        v-else-if="filteredSessions.length === 0"
        class="p-4"
      >
        <div class="text-center py-12">
          <div
            class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center"
          >
            <Icon
              :name="
                searchQuery ? 'heroicons:magnifying-glass' : 'heroicons:bars-3'
              "
              class="w-10 h-10 text-gray-400"
            />
          </div>
          <p class="text-sm font-semibold text-gray-700 mb-1">
            {{ searchQuery ? "No conversations found" : "No chat history yet" }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{
              searchQuery
                ? "Try a different search term"
                : "Start a new conversation to see it here"
            }}
          </p>
          <button
            v-if="!searchQuery"
            @click="handleNewChat"
            class="mt-4 px-4 py-2 text-xs font-medium text-oceanBlue hover:text-deepBlue hover:bg-oceanBlue/5 rounded-lg transition-colors"
          >
            Create your first chat →
          </button>
        </div>
      </div>

      <div
        v-else
        class="p-3 space-y-2"
      >
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          :ref="
            (el) => {
              if (chatStore.activeSessionId === session.id)
                activeSessionRef = el as HTMLElement;
            }
          "
          @click="handleSelectSession(session.id)"
          class="group relative p-4 rounded-xl cursor-pointer transition-all duration-200"
          :class="
            chatStore.activeSessionId === session.id
              ? 'bg-gradient-to-r from-oceanBlue/15 via-blue-50 to-deepBlue/10 border-2 border-oceanBlue/40 shadow-md scale-[1.02]'
              : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:shadow-sm'
          "
        >
          <!-- Active Indicator -->
          <div
            v-if="chatStore.activeSessionId === session.id"
            class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-oceanBlue to-deepBlue rounded-l-xl"
          ></div>

          <!-- Session Content -->
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm"
              :class="
                chatStore.activeSessionId === session.id
                  ? 'bg-oceanBlue text-white shadow-lg scale-110'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-gray-200 group-hover:to-gray-300 group-hover:scale-105'
              "
            >
              <Icon
                name="heroicons:chat-bubble-left"
                class="w-6 h-6"
              />
            </div>

            <div class="flex-1 min-w-0">
              <h3
                class="text-sm font-semibold truncate mb-1 leading-tight"
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
                class="text-xs mt-1.5 line-clamp-2 leading-relaxed"
                :class="
                  chatStore.activeSessionId === session.id
                    ? 'text-oceanBlue/80'
                    : 'text-gray-600'
                "
              >
                {{ session.topic || session.details || "No description" }}
              </p>
              <div class="flex items-center gap-2.5 mt-2.5 flex-wrap">
                <div class="flex items-center gap-1.5">
                  <Icon
                    name="heroicons:clock"
                    class="w-3.5 h-3.5"
                    :class="
                      chatStore.activeSessionId === session.id
                        ? 'text-oceanBlue/70'
                        : 'text-gray-400'
                    "
                  />
                  <span
                    class="text-xs font-medium"
                    :class="
                      chatStore.activeSessionId === session.id
                        ? 'text-oceanBlue/80'
                        : 'text-gray-500'
                    "
                  >
                    {{ formatDate(session.lastMessageAt || session.createdAt) }}
                  </span>
                </div>
                <span
                  v-if="session.messageCount > 0"
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="
                    chatStore.activeSessionId === session.id
                      ? 'bg-oceanBlue/20 text-oceanBlue'
                      : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ session.messageCount }}
                  {{ session.messageCount === 1 ? "msg" : "msgs" }}
                </span>
              </div>
            </div>

            <!-- Delete Button -->
            <button
              @click.stop="handleDeleteSession(session.id)"
              class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Delete conversation"
            >
              <Icon
                name="heroicons:trash"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex-shrink-0 p-4 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50/50 backdrop-blur-sm"
    >
      <div class="flex items-center justify-between">
        <div class="text-xs text-gray-600 font-semibold">
          <span class="text-oceanBlue font-bold">{{ sessions.length }}</span>
          <span class="ml-1">{{
            sessions.length === 1 ? "conversation" : "conversations"
          }}</span>
        </div>
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="text-xs text-oceanBlue hover:text-deepBlue font-medium hover:underline"
        >
          Clear
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Sidebar (overlay) -->
  <div
    v-show="isOpen && !compact"
    class="md:hidden fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-xl z-30 w-80 flex flex-col"
  >
    <!-- Header -->
    <div class="p-5 border-b bg-oceanBlue shadow-lg">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/10"
          >
            <Icon
              name="heroicons:bars-3"
              class="text-white w-6 h-6"
            />
          </div>
          <div>
            <h2 class="text-lg font-bold text-white tracking-tight">
              Chat History
            </h2>
            <p class="text-xs text-white/80 font-medium">Your conversations</p>
          </div>
        </div>
        <button
          @click="$emit('close')"
          class="text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95"
          aria-label="Close sidebar"
        >
          <Icon
            name="heroicons:x-mark"
            class="w-5 h-5"
          />
        </button>
      </div>
      <button
        @click="handleNewChat"
        class="w-full bg-white text-oceanBlue px-4 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 group"
      >
        <Icon
          name="heroicons:plus"
          class="w-5 h-5 group-hover:rotate-90 transition-transform duration-300"
        />
        <span>New Chat</span>
      </button>
    </div>

    <!-- Search Bar -->
    <div
      v-if="sessions.length > 3"
      class="p-4 border-b border-gray-100 bg-gray-50/50"
    >
      <div class="relative">
        <Icon
          name="heroicons:magnifying-glass"
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
        />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search conversations..."
          class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanBlue/20 focus:border-oceanBlue/50 bg-white transition-all"
        />
      </div>
    </div>

    <!-- Sessions List -->
    <div
      class="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
    >
      <div
        v-if="chatStore.loading && sessions.length === 0"
        class="p-4"
      >
        <div class="flex flex-col items-center justify-center py-12">
          <div class="relative">
            <div
              class="animate-spin rounded-full h-10 w-10 border-3 border-oceanBlue/20 border-t-oceanBlue"
            ></div>
            <div
              class="absolute inset-0 animate-ping rounded-full h-10 w-10 border border-oceanBlue/30"
            ></div>
          </div>
          <p class="mt-4 text-sm text-gray-500 font-medium">
            Loading conversations...
          </p>
        </div>
      </div>

      <div
        v-else-if="filteredSessions.length === 0"
        class="p-4"
      >
        <div class="text-center py-12">
          <div
            class="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center"
          >
            <Icon
              :name="
                searchQuery ? 'heroicons:magnifying-glass' : 'heroicons:bars-3'
              "
              class="w-10 h-10 text-gray-400"
            />
          </div>
          <p class="text-sm font-semibold text-gray-700 mb-1">
            {{ searchQuery ? "No conversations found" : "No chat history yet" }}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            {{
              searchQuery
                ? "Try a different search term"
                : "Start a new conversation to see it here"
            }}
          </p>
          <button
            v-if="!searchQuery"
            @click="handleNewChat"
            class="mt-4 px-4 py-2 text-xs font-medium text-oceanBlue hover:text-deepBlue hover:bg-oceanBlue/5 rounded-lg transition-colors"
          >
            Create your first chat →
          </button>
        </div>
      </div>

      <div
        v-else
        class="p-3 space-y-2"
      >
        <div
          v-for="session in filteredSessions"
          :key="session.id"
          @click="handleSelectSession(session.id)"
          class="group relative p-4 rounded-xl cursor-pointer transition-all duration-200"
          :class="
            chatStore.activeSessionId === session.id
              ? 'bg-gradient-to-r from-oceanBlue/15 via-blue-50 to-deepBlue/10 border-2 border-oceanBlue/40 shadow-md scale-[1.02]'
              : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:shadow-sm'
          "
        >
          <!-- Active Indicator -->
          <div
            v-if="chatStore.activeSessionId === session.id"
            class="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-oceanBlue to-deepBlue rounded-l-xl"
          ></div>

          <!-- Session Content -->
          <div class="flex items-start gap-3">
            <div
              class="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200 shadow-sm"
              :class="
                chatStore.activeSessionId === session.id
                  ? 'bg-oceanBlue text-white shadow-lg scale-110'
                  : 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 group-hover:from-gray-200 group-hover:to-gray-300 group-hover:scale-105'
              "
            >
              <Icon
                name="heroicons:chat-bubble-left"
                class="w-6 h-6"
              />
            </div>

            <div class="flex-1 min-w-0">
              <h3
                class="text-sm font-semibold truncate mb-1 leading-tight"
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
                class="text-xs mt-1.5 line-clamp-2 leading-relaxed"
                :class="
                  chatStore.activeSessionId === session.id
                    ? 'text-oceanBlue/80'
                    : 'text-gray-600'
                "
              >
                {{ session.topic || session.details || "No description" }}
              </p>
              <div class="flex items-center gap-2.5 mt-2.5 flex-wrap">
                <div class="flex items-center gap-1.5">
                  <Icon
                    name="heroicons:clock"
                    class="w-3.5 h-3.5"
                    :class="
                      chatStore.activeSessionId === session.id
                        ? 'text-oceanBlue/70'
                        : 'text-gray-400'
                    "
                  />
                  <span
                    class="text-xs font-medium"
                    :class="
                      chatStore.activeSessionId === session.id
                        ? 'text-oceanBlue/80'
                        : 'text-gray-500'
                    "
                  >
                    {{ formatDate(session.lastMessageAt || session.createdAt) }}
                  </span>
                </div>
                <span
                  v-if="session.messageCount > 0"
                  class="text-xs px-2 py-0.5 rounded-full font-medium"
                  :class="
                    chatStore.activeSessionId === session.id
                      ? 'bg-oceanBlue/20 text-oceanBlue'
                      : 'bg-gray-100 text-gray-600'
                  "
                >
                  {{ session.messageCount }}
                  {{ session.messageCount === 1 ? "msg" : "msgs" }}
                </span>
              </div>
            </div>

            <!-- Delete Button -->
            <button
              @click.stop="handleDeleteSession(session.id)"
              class="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 hover:scale-110 active:scale-95"
              aria-label="Delete conversation"
            >
              <Icon
                name="heroicons:trash"
                class="w-4 h-4"
              />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div
      class="flex-shrink-0 p-4 border-t border-gray-200 bg-gradient-to-b from-white to-gray-50/50 backdrop-blur-sm"
    >
      <div class="flex items-center justify-between">
        <div class="text-xs text-gray-600 font-semibold">
          <span class="text-oceanBlue font-bold">{{ sessions.length }}</span>
          <span class="ml-1">{{
            sessions.length === 1 ? "conversation" : "conversations"
          }}</span>
        </div>
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="text-xs text-oceanBlue hover:text-deepBlue font-medium hover:underline"
        >
          Clear
        </button>
      </div>
    </div>
  </div>

  <!-- Mobile Overlay -->
  <div
    v-if="isOpen"
    @click="$emit('close')"
    class="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-20 transition-opacity duration-300"
  ></div>

  <!-- Confirmation Modal -->
  <ConfirmationModal
    :is-open="showDeleteConfirm"
    title="Delete Conversation"
    :message="deleteConfirmMessage"
    confirm-text="Delete"
    cancel-text="Cancel"
    variant="danger"
    icon="heroicons:trash"
    @confirm="confirmDelete"
    @cancel="cancelDelete"
    @close="showDeleteConfirm = false"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { useChatStore } from "~/stores/chatStore";
import type { ChatSession } from "~/types/chat.interface";
import ConfirmationModal from "./ConfirmationModal.vue";

const props = defineProps<{
  isOpen: boolean;
  compact?: boolean;
}>();

const emit = defineEmits<{
  close: [];
  newChat: [];
  sessionSelected: [sessionId: string];
}>();

const chatStore = useChatStore();
const sessions = computed(() => chatStore.sessions);
const searchQuery = ref("");
const sessionsContainer = ref<HTMLElement | null>(null);
const activeSessionRef = ref<HTMLElement | null>(null);

// Delete confirmation state
const showDeleteConfirm = ref(false);
const deleteConfirmMessage = ref("");
const pendingDeleteSessionId = ref<string | null>(null);

// Filter sessions based on search query
const filteredSessions = computed(() => {
  if (!searchQuery.value.trim()) {
    return sessions.value;
  }

  const query = searchQuery.value.toLowerCase().trim();
  return sessions.value.filter((session) => {
    const title = getSessionTitle(session).toLowerCase();
    const topic = (session.topic || "").toLowerCase();
    const details = (session.details || "").toLowerCase();
    const roomName = (session.room_name || "").toLowerCase();

    return (
      title.includes(query) ||
      topic.includes(query) ||
      details.includes(query) ||
      roomName.includes(query)
    );
  });
});

// Scroll to active session when sidebar opens
watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen && chatStore.activeSessionId) {
      await nextTick();
      scrollToActiveSession();
    }
  },
);

// Scroll to active session when it changes
watch(
  () => chatStore.activeSessionId,
  async () => {
    if (props.isOpen) {
      await nextTick();
      scrollToActiveSession();
    }
  },
);

// Scroll to active session
const scrollToActiveSession = () => {
  if (activeSessionRef.value && sessionsContainer.value) {
    const container = sessionsContainer.value;
    const element = activeSessionRef.value as HTMLElement;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const scrollTop = container.scrollTop;
    const elementTop = elementRect.top - containerRect.top + scrollTop;
    const elementBottom = elementTop + elementRect.height;
    const containerHeight = container.clientHeight;

    // Scroll if element is not fully visible
    if (elementTop < scrollTop) {
      container.scrollTo({ top: elementTop - 20, behavior: "smooth" });
    } else if (elementBottom > scrollTop + containerHeight) {
      container.scrollTo({
        top: elementBottom - containerHeight + 20,
        behavior: "smooth",
      });
    }
  }
};

// Get session title
const getSessionTitle = (session: ChatSession): string => {
  // Prioritize custom title (generated from first message)
  if (session.title && session.title !== "New Conversation") {
    return session.title;
  }
  // Fallback to other fields
  if (session.topic) return session.topic;
  if (session.room_name) return session.room_name;
  if (session.details) {
    return session.details.length > 40
      ? session.details.substring(0, 40) + "..."
      : session.details;
  }
  return "New Conversation";
};

// Format date with better relative time
const formatDate = (dateString?: string): string => {
  if (!dateString) return "Just now";

  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffWeeks < 4) return `${diffWeeks}w ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    if (diffYears < 1) return `${diffYears}y ago`;

    // For older dates, show formatted date
    const isThisYear = date.getFullYear() === now.getFullYear();
    if (isThisYear) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return "Recently";
  }
};

// Handle new chat
const handleNewChat = async () => {
  emit("newChat");
  // Clear search when creating new chat
  searchQuery.value = "";
  // Don't close sidebar - keep it open like modern chat interfaces
};

// Handle session selection
const handleSelectSession = async (sessionId: string) => {
  if (chatStore.activeSessionId === sessionId) {
    // If clicking the same session, close sidebar on mobile
    if (window.innerWidth < 768) {
      emit("close");
    }
    return;
  }

  emit("sessionSelected", sessionId);
  // Clear search when selecting session
  searchQuery.value = "";
  // Keep sidebar open when selecting different session
};

// Handle delete session - show confirmation modal
const handleDeleteSession = (sessionId: string) => {
  const session = sessions.value.find((s) => s.id === sessionId);
  const sessionTitle = session ? getSessionTitle(session) : "this conversation";

  pendingDeleteSessionId.value = sessionId;
  deleteConfirmMessage.value = `Are you sure you want to delete <strong>"${sessionTitle}"</strong>?<br><br>This action cannot be undone.`;
  showDeleteConfirm.value = true;
};

// Confirm delete action
const confirmDelete = async () => {
  if (!pendingDeleteSessionId.value) return;

  try {
    const sessionId = pendingDeleteSessionId.value;
    const wasActive = chatStore.activeSessionId === sessionId;

    await chatStore.deleteSession(sessionId);

    // If deleted session was active, create a new one
    if (wasActive) {
      emit("newChat");
    }

    // Clear search if no results
    if (filteredSessions.value.length === 0) {
      searchQuery.value = "";
    }
  } catch (error) {
    console.error("[ChatHistory] Error deleting session:", error);
    // Show error message (could be enhanced with a toast notification)
    deleteConfirmMessage.value =
      "Failed to delete conversation. Please try again.";
    // Keep modal open to show error, then close after a delay
    setTimeout(() => {
      showDeleteConfirm.value = false;
      pendingDeleteSessionId.value = null;
    }, 2000);
  } finally {
    if (pendingDeleteSessionId.value) {
      pendingDeleteSessionId.value = null;
    }
  }
};

// Cancel delete action
const cancelDelete = () => {
  pendingDeleteSessionId.value = null;
  deleteConfirmMessage.value = "";
};

// Keyboard navigation
const handleKeyDown = (e: KeyboardEvent) => {
  if (!props.isOpen) return;

  // Close on Escape
  if (e.key === "Escape" && !(e.target instanceof HTMLInputElement)) {
    emit("close");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeyDown);
});
</script>
