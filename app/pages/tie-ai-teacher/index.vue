<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref, watch, onMounted } from "vue";
import { useChatStore } from "~/stores/chatStore";
import type { ChatMessage } from "~/types/chat.interface";

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();

// Chat instance
const chat = new Chat({});

// Local state
const isTyping = ref(false);
// Sidebar open by default, persist user preference
const sidebarStateKey = "tie-ai-teacher-sidebar-open";
const isHistoryOpen = ref(true); // Always default to true

const isInitializing = ref(true);
const lastMessageCount = ref(0);
const savedMessageIds = ref(new Set<string>());
const hasTitleBeenSet = ref(false);

// Initialize session on mount
onMounted(async () => {
  // Load saved sidebar preference
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem(sidebarStateKey);
    if (saved !== null) {
      isHistoryOpen.value = saved === "true";
    }
  }

  try {
    await chatStore.loadSessions();

    const sessionId = route.query.sessionId as string | undefined;
    if (sessionId) {
      await loadSession(sessionId);
    } else {
      await createNewSession();
    }
  } catch (error) {
    console.error("[TIE AI Teacher] Initialization error:", error);
    await createNewSession();
  } finally {
    isInitializing.value = false;
  }
});

// Load existing session
const loadSession = async (sessionId: string) => {
  try {
    const session = await chatStore.loadSession(sessionId);

    if (session.messages?.length) {
      const chatMessages = session.messages.map(convertToChatMessage);
      // @ts-ignore - messages is reactive array
      chat.messages.splice(0, chat.messages.length, ...chatMessages);
      lastMessageCount.value = session.messages.length;
      // Track saved message IDs
      savedMessageIds.value = new Set(
        session.messages.map((m: ChatMessage) => m.id)
      );
      // If session has a title, mark it as set
      hasTitleBeenSet.value = !!session.title;
    } else {
      // @ts-ignore
      chat.messages.splice(0, chat.messages.length);
      lastMessageCount.value = 0;
      savedMessageIds.value = new Set();
      hasTitleBeenSet.value = false;
    }

    router.replace({ query: { sessionId } });
  } catch (error) {
    console.error("[TIE AI Teacher] Error loading session:", error);
    await createNewSession();
  }
};

// Create new session
const createNewSession = async () => {
  try {
    const session = await chatStore.createSession();
    // @ts-ignore
    chat.messages.splice(0, chat.messages.length);
    lastMessageCount.value = 0;
    savedMessageIds.value = new Set();
    hasTitleBeenSet.value = false;
    router.replace({ query: { sessionId: session.id } });
  } catch (error) {
    console.error("[TIE AI Teacher] Error creating session:", error);
  }
};

// Convert ChatMessage to Chat component format
const convertToChatMessage = (msg: ChatMessage) => ({
  id: msg.id,
  role: msg.role,
  parts: msg.parts || [{ type: "text", text: msg.content }],
  content: msg.content,
});

// Extract text content from message
const extractMessageContent = (message: any): string => {
  if (message.content) return message.content;
  const textPart = message.parts?.find((p: any) => p.type === "text");
  return textPart?.text || "";
};

// Generate a title from the first user message
const generateTitleFromMessage = (message: string): string => {
  // Clean the message
  const cleaned = message.trim();

  if (!cleaned) return "New Conversation";

  // Remove common question prefixes to make it more concise
  const prefixes = [
    /^explain\s+/i,
    /^what\s+is\s+/i,
    /^what\s+are\s+/i,
    /^tell\s+me\s+about\s+/i,
    /^tell\s+me\s+/i,
    /^how\s+do\s+/i,
    /^how\s+does\s+/i,
    /^how\s+can\s+/i,
    /^why\s+do\s+/i,
    /^why\s+does\s+/i,
    /^can\s+you\s+explain\s+/i,
    /^can\s+you\s+tell\s+me\s+/i,
    /^can\s+you\s+/i,
    /^help\s+me\s+understand\s+/i,
    /^help\s+me\s+/i,
    /^i\s+want\s+to\s+know\s+about\s+/i,
    /^i\s+want\s+to\s+learn\s+about\s+/i,
  ];

  let title = cleaned;

  // Remove prefixes
  for (const prefix of prefixes) {
    if (prefix.test(title)) {
      title = title.replace(prefix, "").trim();
      break;
    }
  }

  // Capitalize first letter
  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  // Remove question marks and extra punctuation at the end
  title = title.replace(/[?]+$/, "").trim();

  // Truncate to 50 characters max for better display
  if (title.length > 50) {
    title = title.substring(0, 47) + "...";
  }

  return title || "New Conversation";
};

// Update session title if not set
const updateSessionTitleIfNeeded = async (firstUserMessage: string) => {
  if (!chatStore.activeSessionId || hasTitleBeenSet.value) return;

  try {
    const title = generateTitleFromMessage(firstUserMessage);
    if (title && title !== "New Conversation") {
      await chatStore.updateSessionTitle(chatStore.activeSessionId, title);
      hasTitleBeenSet.value = true;
    }
  } catch (error) {
    console.error("[TIE AI Teacher] Error updating session title:", error);
  }
};

// Save a message to backend
const saveMessage = async (message: any) => {
  if (!message.id || savedMessageIds.value.has(message.id)) {
    return; // Already saved
  }

  const content = extractMessageContent(message);
  if (!content.trim()) return;

  try {
    await chatStore.addMessage({
      role: message.role as "user" | "assistant" | "system",
      content,
      parts: message.parts,
      metadata: { messageId: message.id },
    });
    savedMessageIds.value.add(message.id);
  } catch (error) {
    console.error("[TIE AI Teacher] Error saving message:", error);
  }
};

// Watch for new messages - save user messages immediately, assistant messages after streaming
watch(
  () => chat.messages,
  async (messages) => {
    if (
      !chatStore.activeSessionId ||
      isInitializing.value ||
      !Array.isArray(messages)
    ) {
      return;
    }

    const currentCount = messages.length;

    // Save user messages immediately (they're complete when added)
    const newMessages = messages.slice(lastMessageCount.value);
    for (const message of newMessages) {
      // Save user messages immediately
      if (message.role === "user" && message.id) {
        await saveMessage(message);

        // Generate title from first user message
        if (!hasTitleBeenSet.value) {
          const content = extractMessageContent(message);
          if (content.trim()) {
            await updateSessionTitleIfNeeded(content);
          }
        }
      }
      // Assistant messages will be saved when streaming completes
    }

    lastMessageCount.value = currentCount;
  },
  { deep: true }
);

// Watch chat status to save assistant messages when streaming completes
watch(
  () => chat.status,
  async (status) => {
    if (!chatStore.activeSessionId || isInitializing.value) return;

    // When streaming is complete, save any unsaved assistant messages
    if (status === "ready") {
      // Small delay to ensure message is fully complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // @ts-ignore
      const messages = chat.messages || [];
      for (const message of messages) {
        // Save assistant messages that haven't been saved yet
        if (
          message.role === "assistant" &&
          message.id &&
          !savedMessageIds.value.has(message.id)
        ) {
          await saveMessage(message);
        }
      }
    }
  }
);

// Watch URL for session changes
watch(
  () => route.query.sessionId,
  async (sessionId) => {
    if (sessionId && sessionId !== chatStore.activeSessionId) {
      await loadSession(sessionId as string);
    }
  }
);

// Handle message submission
const handleSubmit = async (message: string) => {
  if (!message.trim()) return;

  if (!chatStore.activeSessionId) {
    await createNewSession();
  }

  isTyping.value = true;

  try {
    // Send message to AI - the watch function will save user messages when they appear in chat.messages
    await chat.sendMessage({ text: message });
  } catch (error) {
    console.error("[TIE AI Teacher] Error sending message:", error);
  } finally {
    isTyping.value = false;
  }
};

// Handle new chat
const handleNewChat = async () => {
  await createNewSession();
  // Keep sidebar open when creating new chat
};

// Handle session selection
const handleSessionSelected = async (sessionId: string) => {
  await loadSession(sessionId);
  // Keep sidebar open when selecting session
};

// Toggle history sidebar (can be called from sidebar itself)
const toggleHistory = () => {
  isHistoryOpen.value = !isHistoryOpen.value;
  // State is persisted automatically via watch
};

// Watch sidebar state to persist changes
watch(isHistoryOpen, (newValue) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(sidebarStateKey, String(newValue));
  }
});
</script>

<template>
  <NuxtLayout name="home-layout">
    <div class="flex h-[calc(100vh-120px)] min-h-[calc(100vh-120px)]">
      <!-- Chat History Sidebar -->
      <AiTeacherChatHistorySidebar
        :is-open="isHistoryOpen"
        @close="isHistoryOpen = false"
        @new-chat="handleNewChat"
        @session-selected="handleSessionSelected"
      />

      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AiTeacherHeader @toggle-sidebar="toggleHistory" />

        <div
          v-if="isInitializing"
          class="flex items-center justify-center h-64"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-oceanBlue"
          ></div>
        </div>

        <template role="main" aria-label="AI Teacher conversation" v-else>
          <AiTeacherMessages
            :messages="chat.messages"
            :isTyping="isTyping"
          />
          <AiTeacherInput
            :chat="chat"
            @sendMessage="handleSubmit"
          />
        </template>
      </div>
    </div>
  </NuxtLayout>
</template>

