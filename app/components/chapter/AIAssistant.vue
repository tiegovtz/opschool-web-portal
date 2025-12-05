<script setup>
import { ref, watch, nextTick, onUnmounted, onMounted, computed } from "vue";
import { Chat } from "@ai-sdk/vue";
import apiDocs from "~/utilities/apiDocs";

const isHtml = (str) => /<\/?[a-z][\s\S]*>/i.test(str?.trim());

const formatMessage = (content) => {
  if (!content) return "";
  if (isHtml(content)) {
    return content; // DO NOT escape or format — just render it
  }

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  };

  let formatted = content;

  // Step 1: Extract code blocks and inline code as placeholders
  const codeBlocks = [];
  formatted = formatted.replace(
    /```(\w+)?\n?([\s\S]*?)```/g,
    (match, lang, code) => {
      const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ placeholder, code: code.trim() });
      return placeholder;
    }
  );

  const inlineCodes = [];
  formatted = formatted.replace(/`([^`\n]+)`/g, (match, code) => {
    const placeholder = `__INLINECODE_${inlineCodes.length}__`;
    inlineCodes.push({ placeholder, code });
    return placeholder;
  });

  // Step 2: Escape the rest
  formatted = escapeHtml(formatted);

  // Step 3: Restore code blocks (escaped)
  codeBlocks.forEach(({ placeholder, code }) => {
    const escapedCode = escapeHtml(code);
    formatted = formatted.replace(
      placeholder,
      `<pre class="p-3 my-3 overflow-x-auto bg-gray-100 border border-gray-300 rounded-lg"><code class="font-mono text-sm whitespace-pre">${escapedCode}</code></pre>`
    );
  });

  // Links [text](url)
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-words hover:text-blue-800">$1</a>'
  );

  // Bold
  formatted = formatted.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold">$1</strong>'
  );
  formatted = formatted.replace(
    /__([^_]+)__/g,
    '<strong class="font-semibold">$1</strong>'
  );

  // Italic
  formatted = formatted.replace(
    /(?<!\*)\*([^*\n]+?)\*(?!\*)/g,
    '<em class="italic">$1</em>'
  );
  formatted = formatted.replace(
    /(?<!_)_([^_\n]+?)_(?!_)/g,
    '<em class="italic">$1</em>'
  );

  // Strikethrough
  formatted = formatted.replace(
    /~~([^~]+)~~/g,
    '<del class="line-through opacity-75">$1</del>'
  );

  // Blockquote
  formatted = formatted.replace(
    /^&gt;\s+(.+)$/gm,
    '<blockquote class="pl-4 my-2 italic text-gray-700 border-l-4 border-gray-300">$1</blockquote>'
  );

  // Headers
  formatted = formatted.replace(
    /^(#{4})\s+(.+)$/gm,
    (m, h, t) =>
      `<h4 class="pt-2 mt-3 mb-2 text-sm font-semibold">${t.trim()}</h4>`
  );
  formatted = formatted.replace(
    /^(#{3})\s+(.+)$/gm,
    (m, h, t) =>
      `<h3 class="pt-2 mt-4 mb-3 text-base font-semibold border-t border-opacity-20">${t.trim()}</h3>`
  );
  formatted = formatted.replace(
    /^(#{2})\s+(.+)$/gm,
    (m, h, t) =>
      `<h2 class="pt-3 mt-5 mb-3 text-lg font-bold border-t-2 border-opacity-30">${t.trim()}</h2>`
  );
  formatted = formatted.replace(
    /^(#{1})\s+(.+)$/gm,
    (m, h, t) =>
      `<h1 class="pt-4 mt-6 mb-4 text-xl font-bold border-t-2 border-opacity-40">${t.trim()}</h1>`
  );

  // Paragraphs & lists
  const paragraphs = formatted.split(/\n\n+/);
  formatted = paragraphs
    .map((para) => {
      para = para.trim();
      if (!para) return "";
      if (
        para.startsWith("<h1") ||
        para.startsWith("<h2") ||
        para.startsWith("<h3") ||
        para.startsWith("<h4")
      )
        return para;

      if (/^[-*_]{3,}$/.test(para))
        return '<hr class="my-4 border-gray-300" />';
      if (para.startsWith("<blockquote")) return para;

      const isTaskList = /^[-*]\s\[([ xX])\]\s/m.test(para);
      const isBulletList = /^[-•*]\s/m.test(para);
      const isNumberedList = /^\d+\.\s/m.test(para);

      if (isTaskList) {
        let taskItems = para.replace(
          /^[-*]\s\[([ xX])\]\s+(.+)$/gim,
          (m, checked, text) => {
            const isChecked = checked.toLowerCase() === "x";
            return `<li class="flex items-start gap-2 mb-1"><input type="checkbox" ${
              isChecked ? "checked" : ""
            } disabled class="mt-1" /><span>${text}</span></li>`;
          }
        );
        return `<ul class="my-2 ml-2 space-y-1 list-none">${taskItems}</ul>`;
      } else if (isBulletList || isNumberedList) {
        let listItems = para.replace(
          /^[-•*]\s+(.+)$/gim,
          '<li class="mb-1">$1</li>'
        );
        listItems = listItems.replace(
          /^\d+\.\s+(.+)$/gim,
          '<li class="mb-1">$1</li>'
        );
        if (listItems.includes("<li")) {
          const listTag = isNumberedList ? "ol" : "ul";
          const listClass = isNumberedList
            ? "list-decimal list-inside space-y-1 my-2 ml-4"
            : "list-disc list-inside space-y-1 my-2 ml-4";
          return `<${listTag} class="${listClass}">${listItems}</${listTag}>`;
        }
      }

      para = para.replace(/\n/g, "<br>");
      return `<p class="mb-2 leading-relaxed">${para}</p>`;
    })
    .filter(Boolean)
    .join("");

  // Restore inline code
  inlineCodes.forEach(({ placeholder, code }) => {
    const escapedCode = escapeHtml(code);
    formatted = formatted.replace(
      placeholder,
      `<code class="bg-opacity-20 px-1.5 py-0.5 rounded text-xs font-mono">${escapedCode}</code>`
    );
  });

  return formatted;
};

// Props
const props = defineProps({
  chapterId: { type: String, required: true },
  chapterName: { type: String, default: "this competence" },
  subject: { type: String, default: "" },
  level: { type: String, default: "" },
  topic: { type: String, default: "" },
  chapterNo: { type: Number, default: null },
});

// state refs
const isOpen = ref(false);
const currentQuestion = ref("");
const isLoading = ref(false);
const messages = ref([]);
const messagesContainer = ref(null);
const previousChapterId = ref(null); // will store the previous ID (old value)
const shouldAutoScroll = ref(true);

// Cookie ref (reactive)
const token = useCookie("signInAccessToken"); // keep as ref; use token.value when needed

// Provider tracking
const currentProvider = ref(null);
const currentModel = ref(null);

// Chat component for regular messages (using /api/chat)
// Use computed to ensure chapterName is reactive
const currentChapterName = computed(() => props.chapterName || "this competence");

// Log chapterName when component mounts or chapter changes
watch(
  () => props.chapterName,
  (newChapterName) => {
    console.log("[Subject AI Teacher] Chapter name prop:", newChapterName);
    console.log("[Subject AI Teacher] Computed chapter name:", currentChapterName.value);
  },
  { immediate: true }
);

// Create reactive headers and body that include context
const getContextHeaders = () => {
  const headers = {};
  const chapterNameValue = currentChapterName.value;
  
  headers["X-Chapter-Name"] = chapterNameValue;
  if (props.subject) headers["X-Subject"] = props.subject;
  if (props.level) headers["X-Level"] = props.level;
  if (props.topic) headers["X-Topic"] = props.topic;
  if (props.chapterNo !== null && props.chapterNo !== undefined) {
    headers["X-Chapter-No"] = String(props.chapterNo);
  }
  
  const currentTokenValue = token?.value;
  if (currentTokenValue) {
    headers["Authorization"] = `Bearer ${currentTokenValue}`;
  }
  
  return headers;
};

const getContextBody = () => {
  const body = {};
  const chapterNameValue = currentChapterName.value;
  
  body.chapterName = chapterNameValue;
  if (props.subject) body.subject = props.subject;
  if (props.level) body.level = props.level;
  if (props.topic) body.topic = props.topic;
  if (props.chapterNo !== null && props.chapterNo !== undefined) {
    body.chapterNo = props.chapterNo;
  }
  
  return body;
};

// Create a custom fetch that wraps the default fetch
const createCustomFetch = () => {
  return async (url, options = {}) => {
    const chapterNameValue = currentChapterName.value;
    
    console.log("[Subject AI Teacher] 🔵 Custom fetch called");
    console.log("[Subject AI Teacher] URL:", url);
    console.log("[Subject AI Teacher] ChapterName:", chapterNameValue);
    
    // Merge headers
    const contextHeaders = getContextHeaders();
    const mergedHeaders = {
      ...(options.headers || {}),
      ...contextHeaders,
    };
    
    // Try to merge body
    let body = options.body;
    if (body && typeof body === 'string') {
      try {
        const bodyObj = JSON.parse(body);
        const contextBody = getContextBody();
        Object.assign(bodyObj, contextBody);
        body = JSON.stringify(bodyObj);
        console.log("[Subject AI Teacher] ✅ Modified request body with context");
      } catch (e) {
        console.warn("[Subject AI Teacher] Could not parse body:", e);
      }
    }
    
    console.log("[Subject AI Teacher] Context being sent:", {
      chapterName: chapterNameValue,
      subject: props.subject,
      level: props.level,
      topic: props.topic,
      chapterNo: props.chapterNo
    });
    
    return fetch(url, {
      ...options,
      headers: mergedHeaders,
      body,
    });
  };
};

// Initialize Chat component
const chat = new Chat({
  api: "/api/chat",
});

// Intercept fetch calls by overriding the global fetch temporarily
// Store original fetch
const originalFetch = window.fetch;

// Override fetch to add context
window.fetch = async function(url, options = {}) {
  // Only intercept calls to our API endpoint
  if (typeof url === 'string' && url.includes('/api/chat')) {
    const chapterNameValue = currentChapterName.value;
    
    console.log("[Subject AI Teacher] 🔵 Intercepted fetch call");
    console.log("[Subject AI Teacher] URL:", url);
    console.log("[Subject AI Teacher] ChapterName:", chapterNameValue);
    
    // Add context headers
    const contextHeaders = getContextHeaders();
    const mergedHeaders = {
      ...(options.headers || {}),
      ...contextHeaders,
    };
    
    // Add context to body if it's a JSON string
    let body = options.body;
    if (body && typeof body === 'string') {
      try {
        const bodyObj = JSON.parse(body);
        const contextBody = getContextBody();
        Object.assign(bodyObj, contextBody);
        body = JSON.stringify(bodyObj);
        console.log("[Subject AI Teacher] ✅ Added context to request body");
      } catch (e) {
        console.warn("[Subject AI Teacher] Could not parse body:", e);
      }
    }
    
    console.log("[Subject AI Teacher] Context being sent:", {
      chapterName: chapterNameValue,
      subject: props.subject,
      level: props.level,
      topic: props.topic,
      chapterNo: props.chapterNo
    });
    
    // Call original fetch with modified options
    return originalFetch(url, {
      ...options,
      headers: mergedHeaders,
      body,
    });
  }
  
  // For other URLs, use original fetch
  return originalFetch(url, options);
};

console.log("[Subject AI Teacher] Chat component created with fetch interceptor");

// Sync Chat component messages with local messages state
// Use a debounced approach to avoid too many updates during streaming
let syncTimeout = null;
watch(
  () => chat.messages,
  (chatMessages) => {
    if (!Array.isArray(chatMessages)) return;

    // Clear any pending sync
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    // Debounce updates during streaming to avoid excessive re-renders
    syncTimeout = setTimeout(() => {
      // Build a map of Chat messages by ID for efficient lookup
      const chatMessagesMap = new Map();
      chatMessages.forEach((chatMsg) => {
        if (chatMsg && chatMsg.id) {
          chatMessagesMap.set(chatMsg.id, chatMsg);
        }
      });

      // Get all Chat message IDs
      const chatMessageIds = Array.from(chatMessagesMap.keys());

      // Remove local messages that no longer exist in Chat (shouldn't happen, but safety check)
      messages.value = messages.value.filter(
        (m) => !m.fromChat || chatMessageIds.includes(m.chatId)
      );

      // Process each Chat message
      chatMessages.forEach((chatMsg) => {
        if (!chatMsg || !chatMsg.id) return;

        // Extract text content from message parts
        let textContent = "";
        if (Array.isArray(chatMsg.parts) && chatMsg.parts.length > 0) {
          textContent = chatMsg.parts
            .filter((p) => p && p.type === "text" && p.text)
            .map((p) => String(p.text))
            .join("");
        } else if (chatMsg.content) {
          // Fallback: if message has direct content property
          textContent = String(chatMsg.content);
        }

        // Find existing message by chatId
        const existingIndex = messages.value.findIndex(
          (m) => m.fromChat && m.chatId === chatMsg.id
        );

        const messageData = {
          role: chatMsg.role,
          content: textContent,
          timestamp: existingIndex >= 0 
            ? messages.value[existingIndex].timestamp 
            : new Date().toLocaleTimeString(),
          fromChat: true,
          chatId: chatMsg.id,
        };

        if (chatMsg.role === "user") {
          messageData.actualContent = textContent;
        }

        if (existingIndex >= 0) {
          // Update existing message (for streaming updates)
          messages.value[existingIndex] = messageData;
        } else {
          // Add new message
          // For user messages, always add (they're complete immediately)
          // For assistant messages, only add if we have some content (streaming will update it)
          if (chatMsg.role === "user" || textContent.length > 0) {
            messages.value.push(messageData);
          }
        }
      });

      // Update loading state based on Chat component status
      // Chat component has status: 'ready' | 'streaming' | 'error'
      const chatIsLoading = chat.status === 'streaming' || chat.isLoading || false;
      isLoading.value = chatIsLoading;
      scrollToBottom(true);
    }, 50); // 50ms debounce for streaming updates
  },
  { deep: true, immediate: false }
);

// Watch Chat component status to update loading state
watch(
  () => chat.status,
  (newStatus) => {
    // Update isLoading when Chat status changes
    isLoading.value = newStatus === 'streaming' || chat.isLoading || false;
    if (newStatus === 'streaming') {
      scrollToBottom(true);
    }
  }
);

// Quick action states
const isSummarizing = ref(false);
const isEnglishCrashCourse = ref(false);
const isPlayingAudio = ref(false);
const currentAudio = ref(null);

// Voice preference state
const voiceGender = ref("female");
const showSettings = ref(false);

// Abort controller for network calls
let activeAbortController = null;

// Load voice preference
const loadVoicePreference = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("tie-teacher-voice");
    if (saved === "male" || saved === "female") {
      voiceGender.value = saved;
    }
  }
};

const saveVoicePreference = (gender) => {
  voiceGender.value = gender;
  if (typeof window !== "undefined") {
    localStorage.setItem("tie-teacher-voice", gender);
  }
};

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// Combine onMounted tasks
onMounted(() => {
  loadVoicePreference();

  // Click outside handler for settings
  const handleClickOutside = (event) => {
    if (!showSettings.value) return;
    const target = event.target;
    const settingsContainer = target.closest(".settings-container");
    const settingsButton = target.closest('[title="Voice Settings"]');
    if (!settingsContainer && !settingsButton) {
      showSettings.value = false;
    }
  };

  // Escape key to close assistant
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      if (showSettings.value) {
        showSettings.value = false;
      } else if (isOpen.value) {
        isOpen.value = false;
      }
    }
  };

  const stopListeners = () => {
    document.removeEventListener("click", handleClickOutside);
    document.removeEventListener("keydown", handleKeyDown);
  };

  watch(
    showSettings,
    (open) => {
      if (open) {
        // Delay to avoid immediate trigger from the opening click
        setTimeout(
          () => document.addEventListener("click", handleClickOutside),
          0
        );
      } else {
        document.removeEventListener("click", handleClickOutside);
      }
    },
    { immediate: false }
  );

  document.addEventListener("keydown", handleKeyDown);

  onUnmounted(() => {
    stopListeners();
    // Restore original fetch when component unmounts
    if (typeof window !== 'undefined' && originalFetch) {
      window.fetch = originalFetch;
    }
  });
});

// Toggle assistant open/close and auto-scroll
const toggleAssistant = () => {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    shouldAutoScroll.value = true;
    nextTick(() => scrollToBottom(false));
  }
};

// Handle form submit - use Chat component for regular messages
const handleFormSubmit = async (e) => {
  e.preventDefault();
  const question = currentQuestion.value.trim();
  if (!question || isLoading.value || !props.chapterId) return;

  console.log("[Subject AI Teacher] 🟢 handleFormSubmit called with question:", question);
  console.log("[Subject AI Teacher] Chat object:", chat);
  console.log("[Subject AI Teacher] Chat.sendMessage exists:", typeof chat.sendMessage);

  // Validate token
  const currentTokenValue = token?.value;
  if (!currentTokenValue) {
    messages.value.push({
      role: "assistant",
      content: "Please sign in to use the AI assistant.",
      timestamp: new Date().toLocaleTimeString(),
    });
    return;
  }

  currentQuestion.value = "";
  isLoading.value = true;

  try {
    console.log("[Subject AI Teacher] 🟡 About to call chat.sendMessage");
    await chat.sendMessage({ text: question });
    console.log("[Subject AI Teacher] 🟢 chat.sendMessage completed");
  } catch (error) {
    console.error("[AI Subject Teacher] Chat error:", error);
    messages.value.push({
      role: "assistant",
      content:
        error?.message || "Sorry, I encountered an error. Please try again.",
      timestamp: new Date().toLocaleTimeString(),
    });
  } finally {
    isLoading.value = false;
  }
};

// Reset conversation when chapter changes
watch(
  () => props.chapterId,
  (newChapterId, oldChapterId) => {
    // If there's an old chapter, store it in previousChapterId (so the name matches)
    if (oldChapterId && newChapterId !== oldChapterId) {
      stopReading();
      messages.value = [];
      chat.messages = []; // Clear Chat component messages too
      previousChapterId.value = oldChapterId; // store old value
      isSummarizing.value = false;
      isEnglishCrashCourse.value = false;
      showSettings.value = false;
    }
  },
  { immediate: true }
);

// Format any non-string safely
const safeContent = (value) => {
  if (typeof value === "string") return value;
  if (value === undefined || value === null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

// askQuestion with AbortController, reactive token usage, and better error handling
const askQuestion = async (
  actualQuestion = null,
  maskedMessage = null,
  options = {}
) => {
  const { useDocsAPI = false } = options;

  const question = actualQuestion ?? currentQuestion.value.trim();
  if (!question || isLoading.value || !props.chapterId) return;

  if (!actualQuestion) currentQuestion.value = "";

  const userMessage = {
    role: "user",
    content: maskedMessage || question,
    timestamp: new Date().toLocaleTimeString(),
    actualContent: question,
  };
  messages.value.push(userMessage);
  scrollToBottom(true);

  isLoading.value = true;

  // Abort any previous active request
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch (e) {
      /* ignore */
    }
    activeAbortController = null;
  }
  activeAbortController = new AbortController();
  const signal = activeAbortController.signal;

  try {
    // Validate token at the moment of sending
    const currentTokenValue = token?.value;
    if (!currentTokenValue) {
      messages.value.push({
        role: "assistant",
        content: "Please sign in to use the AI assistant.",
        timestamp: new Date().toLocaleTimeString(),
      });
      isLoading.value = false;
      return;
    }

    if (!props.chapterId) {
      messages.value.push({
        role: "assistant",
        content: "Chapter ID is missing. Please reload the page.",
        timestamp: new Date().toLocaleTimeString(),
      });
      isLoading.value = false;
      return;
    }

    console.log("[AI Subject Teacher] Sending request:", {
      question,
      chapterId: props.chapterId,
      useDocsAPI,
    });

    const conversationHistory = messages.value.map((msg) => ({
      role: msg.role,
      content: safeContent(msg.actualContent || msg.content),
    }));

    let answer = "";
    let provider = "";
    let model = "";

    if (useDocsAPI) {
      // Docs API fetch
      const url = apiDocs.chapters.getChapterId.replace(":id", props.chapterId);
      const summaryData = await $fetch(url, {
        method: "GET",
        headers: { Authorization: `Bearer ${currentTokenValue}` },
        signal,
      });
      console.log("data", summaryData);

      answer =
        safeContent(summaryData?.crashCourse) ||
        // safeContent(summaryData?.summary) ||
        // safeContent(summaryData?.description) ||
        // safeContent(summaryData?.content) ||
        
        JSON.stringify(summaryData, null, 2);
      provider = "Docs API";
      model = "getChapterId";
    } else {
      // Normal AI assistant
      const response = await $fetch("/api/ai-assistant/ask", {
        method: "POST",
        body: { question, chapterId: props.chapterId, conversationHistory },
        headers: { Authorization: `Bearer ${currentTokenValue}` },
        signal,
      });
      console.log(response.answer);

      answer = safeContent(response.answer);
      provider = response.provider || "Unknown";
      model = response.model || "Unknown";
      console.log(`[AI] Response received from ${provider} (${model})`);
    }

    currentProvider.value = provider;
    currentModel.value = model;

    messages.value.push({
      role: "assistant",
      content: safeContent(answer),
      timestamp: new Date().toLocaleTimeString(),
      provider,
      model,
    });
  } catch (error) {
    // Distinguish abort vs other errors
    if (error?.name === "AbortError") {
      // aborted - don't spam the UI
      console.warn("Request aborted");
    } else {
      console.error("[AI Subject Teacher] Error:", error);
      messages.value.push({
        role: "assistant",
        content:
          error?.data?.message ||
          error?.message ||
          "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      });
    }
  } finally {
    isLoading.value = false;
    activeAbortController = null;
    scrollToBottom(true);
  }
};

// Scroll helpers
const scrollToBottom = (smooth = true) => {
  if (!messagesContainer.value || !shouldAutoScroll.value) return;
  nextTick(() => {
    if (!messagesContainer.value) return;
    if (smooth) {
      messagesContainer.value.scrollTo({
        top: messagesContainer.value.scrollHeight,
        behavior: "smooth",
      });
    } else {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

const isNearBottom = () => {
  if (!messagesContainer.value) return true;
  const threshold = 100;
  const distanceFromBottom =
    messagesContainer.value.scrollHeight -
    messagesContainer.value.scrollTop -
    messagesContainer.value.clientHeight;
  return distanceFromBottom < threshold;
};

const handleScroll = () => {
  shouldAutoScroll.value = isNearBottom();
};

// Watchers to auto-scroll on messages and loading
watch(
  messages,
  () => {
    scrollToBottom(true);
  },
  { deep: true }
);
watch(isLoading, (newVal) => {
  if (newVal) scrollToBottom(true);
});

// Summarize and Crash Course actions
const handleSummarize = async () => {
  if (isLoading.value || isSummarizing.value || !props.chapterId) return;
  isSummarizing.value = true;
  const prompt = `Please provide a comprehensive summary of this chapter/competence: ${props.chapterName}. Include main concepts, key points, and important information.`;
  try {
    await askQuestion(prompt, "Create a summary", { useDocsAPI: false });
  } finally {
    isSummarizing.value = false;
  }
};

const handleEnglishCrashCourse = async () => {
  if (isLoading.value || isEnglishCrashCourse.value || !props.chapterId) return;
  isEnglishCrashCourse.value = true;
  const prompt = `I'm a Tanzanian student who learned in Swahili. Please explain this chapter/competence "${props.chapterName}" in simple English, helping me understand the key concepts and terms. Use Tanzanian context, examples, and references that relate to Tanzania. Use simple language and provide examples where helpful. use swahili to make more emphasis on points.`;
  try {
    await askQuestion(prompt, "Help with English crash course", {
      useDocsAPI: false,
    });
  } finally {
    isEnglishCrashCourse.value = false;
  }
};

// Read (audio) placeholder
const handleRead = async () => {
  if (isLoading.value || isPlayingAudio.value || !props.chapterId) return;
  messages.value.push({
    role: "assistant",
    content: `Text-to-speech feature is coming soon! The audio playback functionality will be available once the audio files are added. You can still use the voice settings to select your preferred voice (${
      voiceGender.value === "male" ? "male" : "female"
    }) for when the feature is ready.`,
    timestamp: new Date().toLocaleTimeString(),
  });
  nextTick(() => {
    if (messagesContainer.value)
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
  });
};

const stopReading = () => {
  try {
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
      currentAudio.value = null;
    }
    isPlayingAudio.value = false;
  } catch (error) {
    console.log("Stopped reading");
    isPlayingAudio.value = false;
    currentAudio.value = null;
  }
};

// cleanup
onUnmounted(() => {
  stopReading();
  showSettings.value = false;
  if (activeAbortController) {
    try {
      activeAbortController.abort();
    } catch (e) {
      /* ignore */
    }
  }
});
</script>

<template>
  <!-- Floating AI Assistant Button -->
  <button
    v-if="!isOpen"
    @click="toggleAssistant"
    class="fixed z-50 flex items-center gap-2 p-4 text-white transition-all duration-300 rounded-full shadow-lg bottom-6 right-6 bg-oceanBlue hover:bg-deepBlue"
    title="Ask AI Subject Teacher"
  >
    <Icon
      name="mdi:robot"
      size="24"
    />
    <span class="hidden md:block">AI Subject Teacher</span>
  </button>

  <!-- AI Assistant Panel -->
  <div
    v-if="isOpen"
    class="fixed z-50 flex flex-col w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-2xl bottom-6 right-6"
    style="height: 600px"
  >
    <!-- Header -->
    <div
      class="relative flex items-center justify-between p-4 text-white border-b rounded-t-lg bg-oceanBlue settings-container"
    >
      <div>
        <h3 class="font-semibold">AI Subject Teacher</h3>
        <p class="text-xs opacity-90">{{ chapterName }}</p>
      </div>
      <div class="relative flex items-center gap-2">
        <!-- Settings Button -->
        <button
          @click.stop="toggleSettings"
          class="p-1 rounded hover:bg-white/20"
          title="Voice Settings"
        >
          <Icon
            name="mdi:cog"
            size="20"
          />
        </button>
        <!-- Settings Dropdown -->
        <div
          v-if="showSettings"
          class="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-50 min-w-[200px] settings-container"
          @click.stop
        >
          <h4 class="mb-2 font-semibold text-gray-900">Voice Settings</h4>
          <p class="mb-3 text-xs text-gray-500">
            Select voice for audio responses
          </p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="female"
                :checked="voiceGender === 'female'"
                @change="saveVoicePreference('female')"
              />
              <span class="text-gray-900">Female Voice</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="male"
                :checked="voiceGender === 'male'"
                @change="saveVoicePreference('male')"
              />
              <span class="text-gray-900">Male Voice</span>
            </label>
          </div>
        </div>
        <button
          @click="toggleAssistant"
          class="p-1 rounded hover:bg-white/20"
        >
          <Icon
            name="mdi:close"
            size="20"
          />
        </button>
      </div>
    </div>

    <!-- Messages Container -->
    <!-- <div
      :class="[
        'flex-1 p-4 overflow-y-auto',
        messages.length === 0
          ? 'flex items-center justify-center'
          : 'flex flex-col space-y-4',
      ]"
      ref="messagesContainer"
      @scroll="handleScroll"
    > -->
    <div
      role="log"
      aria-live="polite"
      :class="[
        'flex-1 p-4 overflow-y-auto',
        messages.length === 0
          ? 'flex items-center justify-center'
          : 'flex flex-col space-y-4',
      ]"
      ref="messagesContainer"
      @scroll="handleScroll"
    >
      <ClientOnly>
        <div
          v-if="messages.length === 0"
          class="text-center text-gray-500"
        >
          <p>Hello! I'm your <strong>AI Subject Teacher</strong>.</p>
          <p class="mt-2 text-sm">
            I'm here to help you understand <strong>{{ chapterName }}</strong
            >.
          </p>
          <p class="mt-1 text-xs opacity-75">
            Feel free to ask me any questions about this competence!
          </p>
        </div>
        <template #fallback>
          <div
            v-if="messages.length === 0"
            class="text-center text-gray-500"
          >
            <p>Hello! I'm your <strong>AI Subject Teacher</strong>.</p>
            <p class="mt-2 text-sm">
              I'm here to help you understand <strong>{{ chapterName }}</strong
              >.
            </p>
            <p class="mt-1 text-xs opacity-75">
              Feel free to ask me any questions about this competence!
            </p>
          </div>
        </template>
      </ClientOnly>

      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="[
          'flex',
          message.role === 'user' ? 'justify-end' : 'justify-start',
        ]"
      >
        <div
          :class="[
            'max-w-[85%] rounded-xl p-4 shadow-md',
            message.role === 'user'
              ? 'bg-gradient-to-br from-oceanBlue to-deepBlue text-white'
              : 'bg-gradient-to-br from-blue-50 to-gray-50 text-gray-900 border border-gray-200',
          ]"
        >
          <div
            class="text-sm leading-relaxed"
            :class="message.role === 'user' ? 'text-white' : 'text-gray-800'"
            v-html="formatMessage(message.content)"
          ></div>
          <p
            class="mt-3 text-xs font-medium opacity-60"
            :class="message.role === 'user' ? 'text-blue-100' : 'text-gray-500'"
          >
            {{ message.timestamp }}
          </p>
        </div>
      </div>

      <!-- Typing Indicator - Similar to TIE AI Teacher -->
      <div
        v-if="isLoading || chat.status === 'streaming'"
        class="flex justify-start"
      >
        <div
          class="max-w-[85%] rounded-xl p-4 shadow-md bg-gradient-to-br from-blue-50 to-gray-50 text-gray-900 border border-gray-200"
        >
          <div class="flex items-center space-x-2">
            <div class="flex gap-1.5">
              <span
                class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-0"
              ></span>
              <span
                class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-200"
              ></span>
              <span
                class="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-400"
              ></span>
            </div>
            <span class="text-gray-500 text-sm ml-2">AI is typing...</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-gray-200">
      <form
        @submit.prevent="handleFormSubmit"
        class="flex gap-2"
      >
        <input
          v-model="currentQuestion"
          type="text"
          placeholder="Type your message..."
          aria-label="Type your question for AI Subject Teacher"
          class="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none"
          :disabled="isLoading || !chapterId"
        />

        <button
          type="submit"
          :disabled="!currentQuestion.trim() || isLoading || !chapterId"
          class="bg-oceanBlue text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>

    <!-- Quick Action Buttons -->
    <div class="px-4 pt-2 pb-4 border-t border-gray-200">
      <div class="flex flex-wrap gap-2">
        <button
          @click="handleSummarize"
          :disabled="isLoading || isSummarizing || !chapterId"
          class="flex-1 min-w-[100px] px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-oceanBlue to-deepBlue text-white rounded-lg hover:from-deepBlue hover:to-oceanBlue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon
            name="mdi:file-document-outline"
            size="18"
          />
          <span>{{ isSummarizing ? "Summarizing..." : "Summarize" }}</span>
        </button>
        <button
          @click="handleEnglishCrashCourse"
          :disabled="isLoading || isEnglishCrashCourse || !chapterId"
          class="flex-1 min-w-[100px] px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon
            name="mdi:translate"
            size="18"
          />
          <span>{{
            isEnglishCrashCourse ? "Loading..." : "English Crash Course"
          }}</span>
        </button>
        <button
          @click="isPlayingAudio ? stopReading() : handleRead()"
          :disabled="isLoading || !chapterId"
          class="flex-1 min-w-[100px] px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon
            :name="isPlayingAudio ? 'mdi:pause' : 'mdi:volume-high'"
            size="18"
          />
          <span>{{ isPlayingAudio ? "Stop Reading" : "Read" }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar for messages container */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}

/* Message content styling */
strong {
  font-weight: 600;
}

em {
  font-style: italic;
}

code {
  background-color: rgba(0, 0, 0, 0.1);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  font-family: "Courier New", monospace;
  display: inline-block;
}

pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 0.75rem 0;
}

pre code {
  background: none;
  padding: 0;
  font-size: 0.875rem;
}

.text-white code {
  background-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.text-white pre {
  background-color: rgba(255, 255, 255, 0.1);
}

.text-white pre code {
  color: rgba(255, 255, 255, 0.95);
}

blockquote {
  border-left: 4px solid rgba(0, 0, 0, 0.2);
  padding-left: 1rem;
  margin: 0.5rem 0;
  font-style: italic;
  color: rgba(0, 0, 0, 0.7);
}

.text-white blockquote {
  border-left-color: rgba(255, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

a {
  color: #2563eb;
  text-decoration: underline;
  word-break: break-word;
}

.text-white a {
  color: rgba(255, 255, 255, 0.9);
  text-decoration: underline;
}

hr {
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.2);
  margin: 1rem 0;
}

.text-white hr {
  border-top-color: rgba(255, 255, 255, 0.3);
}

ul,
ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

li {
  margin: 0.25rem 0;
}

h1,
h2,
h3 {
  line-height: 1.4;
  font-weight: 600;
}

h1 {
  font-size: 1.25rem;
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  padding-top: 1rem;
  border-top: 2px solid;
  border-top-color: rgba(0, 0, 0, 0.1);
}

h2 {
  font-size: 1.125rem;
  margin-top: 1.25rem;
  margin-bottom: 0.75rem;
  padding-top: 0.75rem;
  border-top: 2px solid;
  border-top-color: rgba(0, 0, 0, 0.1);
}

h3 {
  font-size: 1rem;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid;
  border-top-color: rgba(0, 0, 0, 0.05);
}

h1:first-child,
h2:first-child,
h3:first-child {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

/* For user messages (white text) */
.text-white h1,
.text-white h2,
.text-white h3 {
  border-top-color: rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.95);
}

.text-white h1 {
  border-top-color: rgba(255, 255, 255, 0.3);
}

.text-white h2 {
  border-top-color: rgba(255, 255, 255, 0.25);
}

p {
  line-height: 1.6;
}

/* Typing indicator animation - matching TIE AI Teacher */
@keyframes bounce {
  0%,
  80%,
  100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.animate-bounce {
  animation: bounce 1.4s infinite ease-in-out both;
}

.delay-0 {
  animation-delay: 0s;
}

.delay-200 {
  animation-delay: 0.2s;
}

.delay-400 {
  animation-delay: 0.4s;
}
</style>
