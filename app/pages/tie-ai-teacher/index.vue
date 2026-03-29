<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { ref, watch, onMounted, onBeforeUnmount, computed } from "vue";
import { useChatStore } from "~/stores/chatStore";
import type { ChatMessage } from "~/types/chat.interface";
import type { PendingNavigation } from "~/types/tie-ai-teacher.interface";

const route = useRoute();
const router = useRouter();
const contentLayoutLanguage = useContentLayoutLanguage();
const chatStore = useChatStore();
const canMinimize = computed(() => {
  const stateFromRoute = (route as any).state as
    | Record<string, unknown>
    | undefined;
  const stateFromHistory =
    typeof window !== "undefined"
      ? (window.history.state as Record<string, unknown> | null)
      : null;
  const background =
    (stateFromRoute?.aiOverlayBackground as string) ||
    (stateFromHistory?.aiOverlayBackground as string) ||
    "";
  return Boolean(background);
});
const backgroundUrl = computed(() => {
  const stateFromRoute = (route as any).state as
    | Record<string, unknown>
    | undefined;
  const stateFromHistory =
    typeof window !== "undefined"
      ? (window.history.state as Record<string, unknown> | null)
      : null;
  const background =
    (stateFromRoute?.aiOverlayBackground as string) ||
    (stateFromHistory?.aiOverlayBackground as string) ||
    "";
  return background || "";
});

const minimizeToOverlay = async () => {
  if (!backgroundUrl.value) return;
  const sessionId =
    typeof route.query.sessionId === "string" ? route.query.sessionId : "";
  await router.push({
    path: backgroundUrl.value,
    query: {
      overlay: "1",
      ...(sessionId ? { sessionId } : {}),
    },
    state: {
      aiOverlay: true,
      aiOverlayBackground: backgroundUrl.value,
      aiOverlayPushed: true,
    },
  });
};

const closeToBackground = async () => {
  if (!backgroundUrl.value) return;
  await router.replace(backgroundUrl.value);
};

// Chat instance
const chat = new Chat({});

// Local state
const isTyping = ref(false);
// Sidebar open by default, persist user preference
const sidebarStateKey = "tie-ai-teacher-sidebar-open";
const isHistoryOpen = ref(true); // Always default to true
const isSmallScreen = ref(false);

const isInitializing = ref(true);
const lastMessageCount = ref(0);
const savedMessageIds = ref(new Set<string>());
const hasTitleBeenSet = ref(false);
const pendingNavigation = ref<PendingNavigation | null>(null);
const requestSessionId = ref<string | null>(null);
const isSessionNavigationLocked = computed(
  () =>
    isTyping.value ||
    chat.status === "submitted" ||
    chat.status === "streaming",
);
const navigationMessage = computed(() => {
  if (pendingNavigation.value) {
    return "Switching chats shortly.";
  }
  return "";
});

const updateViewportState = () => {
  if (typeof window === "undefined") return;
  isSmallScreen.value = window.innerWidth < 768;
};

const shouldUseDrawerSidebar = computed(() => isSmallScreen.value);
const { draft, version, consumeDraft } = useAiTeacherDraft();
const draftMessage = ref("");
const draftVersion = ref(0);

const applyDraftMessage = () => {
  const nextDraft = consumeDraft();
  if (!nextDraft.trim()) return;
  draftMessage.value = nextDraft;
  draftVersion.value += 1;
};

// Initialize session on mount
onMounted(async () => {
  updateViewportState();
  applyDraftMessage();
  // Load saved sidebar preference
  if (typeof window !== "undefined") {
    window.addEventListener("resize", updateViewportState);
    window.addEventListener("orientationchange", updateViewportState);
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
      const reused = await reuseEmptySessionIfAvailable();
      if (!reused) {
        chatStore.clearActiveSession();
        resetLocalSessionState();
      }
    }
  } catch (error) {
    console.error("[TIE AI Teacher] Initialization error:", error);
    const reused = await reuseEmptySessionIfAvailable();
    if (!reused) {
      chatStore.clearActiveSession();
      resetLocalSessionState();
    }
  } finally {
    isInitializing.value = false;
  }
});

watch(
  () => version.value,
  (nextVersion, previousVersion) => {
    if (nextVersion === previousVersion) return;
    if (!draft.value.trim()) return;
    applyDraftMessage();
  },
);

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
        session.messages.map((m: ChatMessage) => m.id),
      );
      // If session has a title, mark it as set
      hasTitleBeenSet.value = !!session.title;
    } else {
      resetLocalSessionState();
    }

    router.replace({ query: { sessionId } });
  } catch (error) {
    console.error("[TIE AI Teacher] Error loading session:", error);
    const reused = await reuseEmptySessionIfAvailable();
    if (!reused) {
      chatStore.clearActiveSession();
      resetLocalSessionState();
      clearSessionIdFromRoute();
    }
  }
};

// Create new session
const createNewSession = async () => {
  try {
    const session = await chatStore.createSession();
    resetLocalSessionState();
    router.replace({ query: { sessionId: session.id } });
  } catch (error) {
    console.error("[TIE AI Teacher] Error creating session:", error);
  }
};

const resetLocalSessionState = () => {
  // @ts-ignore
  chat.messages.splice(0, chat.messages.length);
  lastMessageCount.value = 0;
  savedMessageIds.value = new Set();
  hasTitleBeenSet.value = false;
};

const clearSessionIdFromRoute = () => {
  if (!route.query.sessionId) return;
  const nextQuery = { ...route.query };
  delete nextQuery.sessionId;
  router.replace({ query: nextQuery });
};

const getTargetSessionId = () =>
  requestSessionId.value || chatStore.activeSessionId;

const hasConversationStarted = () => {
  // Check local messages first (covers unsynced messages)
  // @ts-ignore
  if (Array.isArray(chat.messages) && chat.messages.length > 0) return true;

  const messageCount = chatStore.currentSession?.messageCount ?? 0;
  return messageCount > 0;
};

const getReusableEmptySessionId = () => {
  const emptySessions = chatStore.sessions.filter(
    (session) => session.messageCount === 0,
  );
  if (emptySessions.length === 0) return null;

  const latest = emptySessions.reduce((currentLatest, session) => {
    if (!currentLatest) return session;
    const currentTime = new Date(
      currentLatest.updatedAt || currentLatest.createdAt,
    ).getTime();
    const sessionTime = new Date(
      session.updatedAt || session.createdAt,
    ).getTime();
    return sessionTime > currentTime ? session : currentLatest;
  }, emptySessions[0]);

  return (latest as any).id;
};

const reuseEmptySessionIfAvailable = async () => {
  const reusableSessionId = getReusableEmptySessionId();
  if (!reusableSessionId) return false;

  if (
    chatStore.activeSessionId === reusableSessionId &&
    !hasConversationStarted()
  ) {
    if (route.query.sessionId !== reusableSessionId) {
      router.replace({ query: { sessionId: reusableSessionId } });
    }
    return true;
  }

  await loadSession(reusableSessionId);
  return true;
};

// Convert ChatMessage to Chat component format
const convertToChatMessage = (msg: ChatMessage) => ({
  id: msg.id,
  role: msg.role,
  parts: msg.parts || [{ type: "text", text: msg.content }],
  content: msg.content,
});

const inferAttachmentMediaType = (filename?: string, mediaType?: string) => {
  const normalizedMediaType =
    typeof mediaType === "string" ? mediaType.trim().toLowerCase() : "";

  if (normalizedMediaType && normalizedMediaType !== "application/octet-stream") {
    return normalizedMediaType;
  }

  const lowerName = typeof filename === "string" ? filename.toLowerCase() : "";
  if (lowerName.endsWith(".pdf")) return "application/pdf";
  if (lowerName.endsWith(".jpg") || lowerName.endsWith(".jpeg")) {
    return "image/jpeg";
  }
  if (lowerName.endsWith(".png")) return "image/png";
  if (lowerName.endsWith(".webp")) return "image/webp";
  if (lowerName.endsWith(".txt")) return "text/plain";
  if (lowerName.endsWith(".md")) return "text/markdown";
  if (lowerName.endsWith(".json")) return "application/json";

  return normalizedMediaType || "application/octet-stream";
};

const describeAttachmentParts = (parts: any[] = []) => {
  const attachmentParts = parts.filter(
    (part) => part?.type === "file" || part?.type === "data-attachment",
  );

  if (attachmentParts.length === 0) return "";

  const labels = attachmentParts.map((part) => {
    const filename =
      part?.type === "data-attachment"
        ? part?.data?.filename
        : part?.filename;
    const mediaType = inferAttachmentMediaType(
      filename,
      part?.type === "data-attachment"
        ? part?.data?.mediaType
        : part?.mediaType,
    );

    if (filename) return filename;
    if (mediaType === "application/pdf") return "PDF document";
    if (typeof mediaType === "string" && mediaType.startsWith("image/")) {
      return "image";
    }
    return "attachment";
  });

  return `Attachment${labels.length > 1 ? "s" : ""}: ${labels.join(", ")}`;
};

// Extract text content from message
const extractMessageContent = (message: any): string => {
  if (message.content) return message.content;

  const textParts = Array.isArray(message.parts)
    ? message.parts
        .filter((p: any) => p?.type === "text" && typeof p?.text === "string")
        .map((p: any) => p.text.trim())
        .filter(Boolean)
    : [];

  if (textParts.length > 0) return textParts.join(" ");

  return describeAttachmentParts(message.parts || []);
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
const updateSessionTitleIfNeeded = async (
  sessionId: string,
  firstUserMessage: string,
) => {
  if (!sessionId || hasTitleBeenSet.value) return;

  try {
    const title = generateTitleFromMessage(firstUserMessage);
    if (title && title !== "New Conversation") {
      await chatStore.updateSessionTitle(sessionId, title);
      hasTitleBeenSet.value = true;
    }
  } catch (error) {
    console.error("[TIE AI Teacher] Error updating session title:", error);
  }
};

const sanitizePartsForPersistence = (
  parts: any[] = [],
  options?: { includePreview?: boolean },
) =>
  parts.map((part: any) => {
    if (part?.type === "file") {
      const mediaType = inferAttachmentMediaType(part.filename, part.mediaType);
      const previewUrl =
        options?.includePreview &&
        mediaType.startsWith("image/") &&
        typeof part.url === "string"
          ? part.url
          : undefined;

      return {
        type: "data-attachment",
        data: {
          filename: part.filename || "Attachment",
          mediaType,
          ...(previewUrl ? { previewUrl } : {}),
        },
      };
    }

    return part;
  });

const replaceLiveAttachmentsInChat = () => {
  if (!Array.isArray(chat.messages)) return;

  let didChange = false;
  const updatedMessages = chat.messages.map((message: any) => {
    if (message.role !== "user" || !Array.isArray(message.parts)) {
      return message;
    }

    const hasLiveFileParts = message.parts.some((part: any) => part?.type === "file");
    if (!hasLiveFileParts) return message;

    didChange = true;
    return {
      ...message,
      parts: sanitizePartsForPersistence(message.parts, { includePreview: true }),
    };
  });

  if (didChange) {
    // @ts-ignore
    chat.messages.splice(0, chat.messages.length, ...updatedMessages);
  }
};

// Save a message to backend
const saveMessage = async (sessionId: string, message: any) => {
  if (!message.id || savedMessageIds.value.has(message.id)) {
    return; // Already saved
  }

  const content = extractMessageContent(message);
  if (!content.trim()) return;

  try {
    await chatStore.addMessage(
      {
        role: message.role as "user" | "assistant" | "system",
        content,
        parts:
          message.role === "user"
            ? sanitizePartsForPersistence(message.parts)
            : message.parts,
        metadata: { messageId: message.id },
      },
      sessionId,
    );
    savedMessageIds.value.add(message.id);
  } catch (error) {
    console.error("[TIE AI Teacher] Error saving message:", error);
  }
};

// Watch for new messages - save user messages immediately, assistant messages after streaming
watch(
  () => chat.messages,
  async (messages) => {
    const targetSessionId = getTargetSessionId();
    if (!targetSessionId || isInitializing.value || !Array.isArray(messages)) {
      return;
    }

    const currentCount = messages.length;

    // Save user messages immediately (they're complete when added)
    const newMessages = messages.slice(lastMessageCount.value);
    for (const message of newMessages) {
      // Save user messages immediately
      if (message.role === "user" && message.id) {
        await saveMessage(targetSessionId, message);

        // Generate title from first user message
        if (!hasTitleBeenSet.value) {
          const content = extractMessageContent(message);
          if (content.trim()) {
            await updateSessionTitleIfNeeded(targetSessionId, content);
          }
        }
      }
      // Assistant messages will be saved when streaming completes
    }

    lastMessageCount.value = currentCount;
  },
  { deep: true },
);

// Watch chat status to save assistant messages when streaming completes
watch(
  () => chat.status,
  async (status, previousStatus) => {
    const targetSessionId = getTargetSessionId();
    if (isInitializing.value) return;

    // When streaming is complete, save any unsaved assistant messages
    if (status === "ready" && targetSessionId) {
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
          await saveMessage(targetSessionId, message);
        }
      }

      replaceLiveAttachmentsInChat();
    }

    const wasGenerating =
      previousStatus === "submitted" || previousStatus === "streaming";
    const isGenerating = status === "submitted" || status === "streaming";

    if (wasGenerating && !isGenerating) {
      requestSessionId.value = null;

      if (pendingNavigation.value) {
        const pending = pendingNavigation.value;
        pendingNavigation.value = null;

        if (pending.type === "new-chat") {
          await startNewChat();
        } else {
          await loadSession(pending.sessionId);
        }
      }
    }
  },
);

// Watch URL for session changes
watch(
  () => route.query.sessionId,
  async (sessionId) => {
    if (!sessionId || sessionId === chatStore.activeSessionId) {
      return;
    }

    if (isSessionNavigationLocked.value) {
      pendingNavigation.value = {
        type: "session",
        sessionId: sessionId as string,
      };
      return;
    }

    await loadSession(sessionId as string);
  },
);

// Handle message submission
const handleSubmit = async (
  payload: string | { message: string; files?: FileList },
) => {
  const message = typeof payload === "string" ? payload : payload.message;
  const files = typeof payload === "string" ? undefined : payload.files;
  const trimmedMessage = message.trim();

  if (!trimmedMessage && !files?.length) return;

  if (!chatStore.activeSessionId) {
    const reused = await reuseEmptySessionIfAvailable();
    if (!reused) {
      await createNewSession();
    }
  }

  const sessionId = chatStore.activeSessionId;
  if (!sessionId) return;

  isTyping.value = true;
  pendingNavigation.value = null;
  requestSessionId.value = sessionId;

  try {
    // Send message to AI - the watch function will save user messages when they appear in chat.messages
    const outgoingMessage = files?.length
      ? trimmedMessage
        ? { text: trimmedMessage, files }
        : { files }
      : { text: trimmedMessage };

    await chat.sendMessage(
      outgoingMessage as any,
      {
        body: { sessionId },
        metadata: { sessionId },
      },
    );
  } catch (error) {
    console.error("[TIE AI Teacher] Error sending message:", error);
  } finally {
    isTyping.value = false;
  }
};

const startNewChat = async () => {
  if (!hasConversationStarted()) {
    if (chatStore.activeSessionId) {
      if (route.query.sessionId !== chatStore.activeSessionId) {
        router.replace({ query: { sessionId: chatStore.activeSessionId } });
      }
      return;
    }

    const reused = await reuseEmptySessionIfAvailable();
    if (reused) return;

    resetLocalSessionState();
    clearSessionIdFromRoute();
    return;
  }

  const reused = await reuseEmptySessionIfAvailable();
  if (reused) return;

  chatStore.clearActiveSession();
  resetLocalSessionState();
  clearSessionIdFromRoute();
  // Keep sidebar open when starting a new chat
};

// Handle new chat
const handleNewChat = async () => {
  if (isSessionNavigationLocked.value) {
    pendingNavigation.value = { type: "new-chat" };
    return;
  }

  await startNewChat();
};

// Handle session selection
const handleSessionSelected = async (sessionId: string) => {
  if (isSessionNavigationLocked.value) {
    pendingNavigation.value = { type: "session", sessionId };
    return;
  }

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
  if (isSmallScreen.value) return;
  if (typeof window !== "undefined") {
    localStorage.setItem(sidebarStateKey, String(newValue));
  }
});

onBeforeUnmount(() => {
  if (typeof window === "undefined") return;
  window.removeEventListener("resize", updateViewportState);
  window.removeEventListener("orientationchange", updateViewportState);
});
</script>

<template>
  <NuxtLayout name="home-layout" :language="contentLayoutLanguage">
    <div
      class="relative flex min-h-0 overflow-hidden"
      :style="{
        height: 'calc(100dvh - 120px)',
        minHeight: 'calc(100dvh - 120px)',
      }"
    >
      <div
        v-if="canMinimize"
        class="absolute right-3 top-3 z-20 flex items-center gap-1"
      >
        <button
          type="button"
          class="rounded bg-white/90 p-1 text-gray-700 shadow hover:text-black"
          aria-label="Minimize to overlay"
          @click="minimizeToOverlay"
        >
          <Icon
            name="mdi:arrow-collapse"
            size="20"
          />
        </button>
        <button
          type="button"
          class="rounded bg-white/90 p-1 text-gray-700 shadow hover:text-black"
          aria-label="Close and return"
          @click="closeToBackground"
        >
          <Icon
            name="mdi:close"
            size="20"
          />
        </button>
      </div>
      <template v-if="shouldUseDrawerSidebar">
        <Transition
          enter-active-class="transition-opacity duration-200 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-150 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <button
            v-if="isHistoryOpen"
            type="button"
            class="absolute inset-0 z-10 bg-slate-900/30 md:hidden"
            aria-label="Close chat history"
            @click="isHistoryOpen = false"
          />
        </Transition>
        <Transition
          enter-active-class="transition-all duration-200 ease-out"
          enter-from-class="opacity-0 -translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-150 ease-in"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 -translate-x-4"
        >
          <div
            v-if="isHistoryOpen"
            class="absolute inset-y-0 left-0 z-20 w-[min(22rem,calc(100%-1rem))] max-w-full min-h-0"
          >
            <AiTeacherChatHistorySidebar
              :is-open="true"
              :compact="true"
              :navigation-message="navigationMessage"
              :disable-delete="isSessionNavigationLocked"
              @close="isHistoryOpen = false"
              @new-chat="handleNewChat"
              @session-selected="handleSessionSelected"
            />
          </div>
        </Transition>
      </template>
      <AiTeacherChatHistorySidebar
        v-else
        :is-open="isHistoryOpen"
        :navigation-message="navigationMessage"
        :disable-delete="isSessionNavigationLocked"
        @close="isHistoryOpen = false"
        @new-chat="handleNewChat"
        @session-selected="handleSessionSelected"
      />

      <!-- Main Content -->
      <div class="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden">
        <AiTeacherHeader @toggle-sidebar="toggleHistory" />

        <div
          v-if="isInitializing"
          class="flex min-h-0 flex-1 items-center justify-center"
        >
          <div
            class="animate-spin rounded-full h-8 w-8 border-b-2 border-oceanBlue"
          ></div>
        </div>

        <main
          role="main"
          aria-label="AI Teacher conversation"
          v-else
          class="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
          <AiTeacherMessages
            :messages="chat.messages"
            :isTyping="isTyping"
          />
          <AiTeacherInput
            :chat="chat"
            :draft-message="draftMessage"
            :draft-version="draftVersion"
            @sendMessage="handleSubmit"
          />
        </main>
      </div>
    </div>
  </NuxtLayout>
</template>
