<script setup lang="ts">
import { Chat } from "@ai-sdk/vue";
import { computed, ref, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from "vue";
import { useChatStore } from "~/stores/chatStore";
import { useChatHistory } from "~/composables/useChatHistory";
import type { ChatMessage } from "~/types/chat.interface";

const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();

const props = defineProps<{
  externalSessionId?: string;
  compact?: boolean;
}>();

const AiTeacherChatHistorySidebar = defineAsyncComponent(
  () => import("~/components/ai-teacher/ChatHistorySidebar.vue")
);
const AiTeacherHeader = defineAsyncComponent(
  () => import("~/components/ai-teacher/Header.vue")
);
const AiTeacherMessages = defineAsyncComponent(
  () => import("~/components/ai-teacher/Messages.vue")
);
const AiTeacherInput = defineAsyncComponent(
  () => import("~/components/ai-teacher/Input.vue")
);

const chat = new Chat({});
const isTyping = ref(false);
const sidebarStateKey = "tie-ai-teacher-sidebar-open";
const isHistoryOpen = ref(true);
const isInitializing = ref(true);
const isSmallScreen = ref(false);
const lastMessageCount = ref(0);
const savedMessageIds = ref(new Set<string>());
const hasTitleBeenSet = ref(false);
const chatHistory = useChatHistory();

const updateViewportState = () => {
  if (typeof window === "undefined") return;
  isSmallScreen.value = window.innerWidth < 768;
};

const shouldUseDrawerSidebar = computed(
  () => isSmallScreen.value
);

const shouldUseCompactOverlaySidebar = computed(
  () => props.compact && !isSmallScreen.value
);

onMounted(async () => {
  updateViewportState();
  if (typeof window !== "undefined") {
    window.addEventListener("resize", updateViewportState);
    window.addEventListener("orientationchange", updateViewportState);
  }
  if (props.compact) {
    // Compact overlay starts with drawer closed; open via header button.
    isHistoryOpen.value = false;
  } else if (typeof window !== "undefined") {
    const saved = localStorage.getItem(sidebarStateKey);
    if (saved !== null) {
      isHistoryOpen.value = saved === "true";
    }
  }

  try {
    await chatStore.loadSessions();
    // Always start with a blank draft view; create/load only on user action.
    // @ts-ignore
    chat.messages.splice(0, chat.messages.length);
    chatStore.clearActiveSession();
    lastMessageCount.value = 0;
    savedMessageIds.value = new Set();
    hasTitleBeenSet.value = false;
  } catch (error) {
    console.error("[TIE AI Teacher] Initialization error:", error);
    // Keep workspace usable; session will be created on first message.
    // @ts-ignore
    chat.messages.splice(0, chat.messages.length);
    chatStore.clearActiveSession();
  } finally {
    isInitializing.value = false;
  }
});

const loadSession = async (sessionId: string) => {
  try {
    const session = await chatStore.loadSession(sessionId);

    if (session.messages?.length) {
      const chatMessages = session.messages.map(convertToChatMessage);
      // @ts-ignore
      chat.messages.splice(0, chat.messages.length, ...chatMessages);
      lastMessageCount.value = session.messages.length;
      savedMessageIds.value = new Set(
        session.messages.map((m: ChatMessage) => m.id)
      );
      hasTitleBeenSet.value = !!session.title;
    } else {
      // @ts-ignore
      chat.messages.splice(0, chat.messages.length);
      lastMessageCount.value = 0;
      savedMessageIds.value = new Set();
      hasTitleBeenSet.value = false;
    }

    router.replace({ query: { ...route.query, sessionId } });
  } catch (error) {
    console.error("[TIE AI Teacher] Error loading session:", error);
    await createNewSession();
  }
};

const createNewSession = async () => {
  try {
    const session = await chatStore.createSession();
    // @ts-ignore
    chat.messages.splice(0, chat.messages.length);
    lastMessageCount.value = 0;
    savedMessageIds.value = new Set();
    hasTitleBeenSet.value = false;
    router.replace({ query: { ...route.query, sessionId: session.id } });
  } catch (error) {
    console.error("[TIE AI Teacher] Error creating session:", error);
  }
};

const convertToChatMessage = (msg: ChatMessage) => ({
  id: msg.id,
  role: msg.role,
  parts: msg.parts || [{ type: "text", text: msg.content }],
  content: msg.content,
});

const extractMessageContent = (message: any): string => {
  if (message.content) return message.content;
  const textPart = message.parts?.find((p: any) => p.type === "text");
  return textPart?.text || "";
};

const generateTitleFromMessage = (message: string): string => {
  const cleaned = message.trim();

  if (!cleaned) return "New Conversation";

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
  for (const prefix of prefixes) {
    if (prefix.test(title)) {
      title = title.replace(prefix, "").trim();
      break;
    }
  }

  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  }

  title = title.replace(/[?]+$/, "").trim();
  if (title.length > 50) {
    title = title.substring(0, 47) + "...";
  }

  return title || "New Conversation";
};

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

const saveMessage = async (message: any) => {
  if (!message.id || savedMessageIds.value.has(message.id)) return;

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
    const newMessages = messages.slice(lastMessageCount.value);
    for (const message of newMessages) {
      if (message.role === "user" && message.id) {
        await saveMessage(message);
        if (!hasTitleBeenSet.value) {
          const content = extractMessageContent(message);
          if (content.trim()) {
            await updateSessionTitleIfNeeded(content);
          }
        }
      }
    }

    lastMessageCount.value = currentCount;
  },
  { deep: true }
);

watch(
  () => chat.status,
  async (status) => {
    if (!chatStore.activeSessionId || isInitializing.value) return;
    if (status === "ready") {
      await new Promise((resolve) => setTimeout(resolve, 100));
      // @ts-ignore
      const messages = chat.messages || [];
      for (const message of messages) {
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

const handleSubmit = async (message: string) => {
  if (!message.trim()) return;
  if (!chatStore.activeSessionId) {
    await createNewSession();
  }
  isTyping.value = true;
  try {
    await chat.sendMessage({ text: message });
  } catch (error) {
    console.error("[TIE AI Teacher] Error sending message:", error);
  } finally {
    isTyping.value = false;
  }
};

const handleNewChat = async () => {
  await createNewSession();
};

const handleSessionSelected = async (sessionId: string) => {
  await loadSession(sessionId);
};

const toggleHistory = () => {
  isHistoryOpen.value = !isHistoryOpen.value;
};

watch(isHistoryOpen, (newValue) => {
  if (props.compact || isSmallScreen.value) return;
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
  <div
    class="relative flex h-full min-h-0"
    :class="shouldUseCompactOverlaySidebar ? 'overflow-visible' : 'overflow-hidden'"
  >
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
          class="absolute inset-0 z-20 bg-slate-900/30 md:hidden"
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
          class="absolute inset-y-0 left-0 z-30 w-[min(22rem,calc(100%-1rem))] max-w-full min-h-0 pointer-events-auto"
        >
          <AiTeacherChatHistorySidebar
            :is-open="true"
            :compact="true"
            @close="isHistoryOpen = false"
            @new-chat="handleNewChat"
            @session-selected="handleSessionSelected"
          />
        </div>
      </Transition>
    </template>
    <template v-else-if="shouldUseCompactOverlaySidebar">
      <Transition
        enter-active-class="transition-all duration-200 ease-out"
        enter-from-class="opacity-0 -translate-x-2"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-150 ease-in"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 -translate-x-2"
      >
        <div
          v-if="isHistoryOpen"
          class="absolute -left-80 top-0 bottom-0 z-30 w-80 max-w-[90%] rounded-l-lg border border-gray-200 bg-white shadow-xl pointer-events-auto"
        >
          <AiTeacherChatHistorySidebar
            :is-open="true"
            :compact="true"
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
      @close="isHistoryOpen = false"
      @new-chat="handleNewChat"
      @session-selected="handleSessionSelected"
    />

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
        v-else
        role="main"
        aria-label="AI Teacher conversation"
        class="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <AiTeacherMessages
          :messages="chat.messages"
          :isTyping="isTyping"
        />
        <AiTeacherInput
          :chat="chat"
          @sendMessage="handleSubmit"
        />
      </main>
    </div>
  </div>
</template>
