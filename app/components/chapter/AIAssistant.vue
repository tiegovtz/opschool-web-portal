<script setup>
import { ref, watch, nextTick, onUnmounted, onMounted, computed } from "vue";
import { Chat } from "@ai-sdk/vue";
import apiDocs from "~/utilities/apiDocs";
import { tr } from "zod/v4/locales";

// Development mode flag for conditional logging
const isDev = import.meta.dev;

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

  // Math formulas - Convert LaTeX to MathJax format
  // Process display math first to avoid conflicts with inline math
  // Display math: $$...$$ or \[...\]
  formatted = formatted.replace(
    /\$\$([\s\S]*?)\$\$/g,
    '<div class="mathjax-display my-4">\\[$1\\]</div>'
  );
  formatted = formatted.replace(
    /\\\[([\s\S]*?)\\\]/g,
    '<div class="mathjax-display my-4">\\[$1\\]</div>'
  );
  
  // Inline math: $...$ or \(...\)
  // Use negative lookbehind/lookahead to avoid matching $$ (already processed)
  formatted = formatted.replace(
    /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
    '<span class="mathjax-inline">\\($1\\)</span>'
  );
  formatted = formatted.replace(
    /\\\(([^)]+?)\\\)/g,
    '<span class="mathjax-inline">\\($1\\)</span>'
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
      } else if (isNumberedList) {
        // Handle numbered lists - preserve order and proper numbering
        // Split by lines and process each numbered item sequentially
        const lines = para.split(/\n/);
        const listItems = [];
        let listCounter = 0;
        
        for (const line of lines) {
          const trimmed = line.trim();
          const match = trimmed.match(/^(\d+)\.\s+(.+)$/);
          if (match) {
            const originalNumber = parseInt(match[1], 10);
            const content = match[2];
            listCounter++;
            // Use explicit value attribute to ensure proper numbering even during re-renders
            // This prevents Vue re-renders from resetting the counter
            listItems.push(`<li value="${originalNumber}" class="mb-1">${content}</li>`);
          }
        }
        
        if (listItems.length > 0) {
          // Use proper ordered list with explicit value attributes to prevent counter resets
          // during Vue re-renders (especially during streaming)
          return `<ol class="my-2 ml-6 space-y-1" style="list-style-type: decimal; list-style-position: outside; padding-left: 1.5rem;">${listItems.join('')}</ol>`;
        }
      } else if (isBulletList) {
        // Handle bullet lists
        let listItems = para.replace(
          /^[-•*]\s+(.+)$/gim,
          '<li class="mb-1 ml-4">$1</li>'
        );
        if (listItems.includes("<li")) {
          return `<ul class="list-disc space-y-1 my-2 ml-6" style="list-style-type: disc;">${listItems}</ul>`;
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
  audios: { type: Array, default: () => [] },
  topicLanguage:{type:String,default:'English'}
});
const contentLayoutLanguage = useContentLayoutLanguage(() => props.level);
const isSwahili = computed(() => contentLayoutLanguage.value === "kiswahili" || props.topicLanguage.toLowerCase().trim() === "kiswahili" );
const subjectUi = computed(() => ({
  launcherTitle: isSwahili.value  ? "Uliza Mwalimu wa Somo wa AI" : "Ask AI Subject Teacher",
  title: isSwahili.value ? "Mwalimu wa Somo wa AI" : "AI Subject Teacher",
  voiceSettings: isSwahili.value ? "Mipangilio ya Sauti" : "Voice Settings",
  voiceSettingsHelp: isSwahili.value ? "Chagua sauti ya majibu ya sauti" : "Select voice for audio responses",
  femaleVoice: isSwahili.value ? "Sauti ya Mwanamke" : "Female Voice",
  maleVoice: isSwahili.value ? "Sauti ya Mwanaume" : "Male Voice",
  welcome: isSwahili.value ? "Hujambo! Mimi ni" : "Hello! I'm your",
  intro: isSwahili.value ? "Niko hapa kukusaidia kuelewa" : "I'm here to help you understand",
  prompt: isSwahili.value ? "Usisite kuniuliza maswali yoyote kuhusu umahiri huu!" : "Feel free to ask me any questions about this competence!",
  typing: isSwahili.value ? "AI inaandika..." : "AI is typing...",
  inputPlaceholder: isSwahili.value ? "Andika ujumbe wako..." : "Type your message...",
  inputAria: isSwahili.value ? "Andika swali lako kwa Mwalimu wa Somo wa AI" : "Type your question for AI Subject Teacher",
  send: isSwahili.value ? "Tuma" : "Send",
  summarizeIdle: isSwahili.value ? "Fupisha" : "Summarize",
  summarizeBusy: isSwahili.value ? "Inafupisha..." : "Summarizing...",
  englishCrashCourseIdle: isSwahili.value ? "Kozi Fupi ya Kiswahili" : "English Crash Course",
  englishCrashCourseBusy: isSwahili.value ? "Inapakia..." : "Loading...",
  stopReading: isSwahili.value ? "Simamisha Kusoma" : "Stop Reading",
  read: isSwahili.value ? "Soma" : "Read",
}));

// state refs
const isOpen = ref(false);
const showLocalLauncher = false;
const openFromGlobalSignal = useState(
  "ai-subject-teacher-open-signal",
  () => 0
);
const subjectTeacherOpenState = useState(
  "ai-subject-teacher-is-open",
  () => false
);
const currentQuestion = ref("");
const isLoading = ref(false);
const messages = ref([]);
const messagesContainer = ref(null);
const previousChapterId = ref(null); // will store the previous ID (old value)
const shouldAutoScroll = ref(true); // Re-enabled for Subject AI Teacher
const bottomOffset = ref(24); // Dynamic bottom offset in pixels (default: 24px near bottom)
const footerObserver = ref(null); // Footer intersection observer
const isSmallScreen = ref(false);

watch(
  () => isOpen.value,
  (open) => {
    subjectTeacherOpenState.value = open;
  },
  { immediate: true }
);

// Cookie ref (reactive)
const token = useCookie("signInAccessToken"); // keep as ref; use token.value when needed

// Provider tracking
const currentProvider = ref(null);
const currentModel = ref(null);

// Memoized localStorage context - initialized once and updated reactively
const storedContext = ref(null);

// Initialize stored context on mount
const initializeStoredContext = () => {
  if (!import.meta.client) return;
  
  try {
    const stored = localStorage.getItem('tie-ai-assistant-context');
    if (stored) {
      const context = JSON.parse(stored);
      // Check if context is recent (within 1 hour)
      const oneHour = 60 * 60 * 1000;
      if (Date.now() - context.timestamp < oneHour) {
        storedContext.value = context;
        return;
      } else {
        localStorage.removeItem('tie-ai-assistant-context');
      }
    }
  } catch (error) {
    if (isDev) {
      console.warn('[Subject AI Teacher] ⚠️ Failed to read context from localStorage:', error);
    }
  }
  storedContext.value = null;
};

// Watch for localStorage changes from other tabs/windows
if (import.meta.client) {
  window.addEventListener('storage', (e) => {
    if (e.key === 'tie-ai-assistant-context') {
      initializeStoredContext();
    }
  });
}

// Get effective context with fallback to localStorage (computed for reactivity)
const effectiveContext = computed(() => {
  const stored = storedContext.value;
  
  // Prefer props, but use stored context as fallback
  return {
    chapterName: props.chapterName && props.chapterName !== 'this competence' 
      ? props.chapterName 
      : (stored?.chapterName || props.chapterName || 'this competence'),
    subject: props.subject || stored?.subject || '',
    level: props.level || stored?.level || '',
    topic: props.topic || stored?.topic || '',
    chapterNo: props.chapterNo !== null && props.chapterNo !== undefined 
      ? props.chapterNo 
      : (stored?.chapterNo ?? null),
  };
});

// Chat component for regular messages (using /api/chat)
// Use computed to ensure chapterName is reactive with localStorage fallback
const currentChapterName = computed(() => effectiveContext.value.chapterName);
const updateViewportState = () => {
  if (typeof window === "undefined") return;
  isSmallScreen.value = window.innerWidth < 768;
};

const launcherClass = computed(() =>
  isSmallScreen.value
    ? "fixed z-50 flex items-center gap-2 rounded-full bg-oceanBlue px-3 py-3 text-white shadow-lg transition-all duration-300 hover:bg-deepBlue right-3"
    : "fixed z-50 flex items-center gap-2 rounded-full bg-oceanBlue p-4 text-white shadow-lg transition-all duration-300 hover:bg-deepBlue right-6"
);

const launcherStyle = computed(() => ({
  bottom: isSmallScreen.value
    ? `max(${bottomOffset.value}px, calc(12px + env(safe-area-inset-bottom)))`
    : `${bottomOffset.value}px`,
  transition: "bottom 0.3s ease-in-out",
}));

const panelClass = computed(() =>
  isSmallScreen.value
    ? "fixed inset-x-2 top-2 z-50 flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
    : "fixed right-6 z-50 flex w-full max-w-md min-h-0 flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-2xl"
);

const panelStyle = computed(() =>
  isSmallScreen.value
    ? {
        bottom: "max(8px, env(safe-area-inset-bottom))",
        height: "min(calc(100dvh - 16px), calc(100svh - 16px))",
        maxHeight: "min(calc(100dvh - 16px), calc(100svh - 16px))",
        transition: "inset 0.3s ease-in-out, height 0.3s ease-in-out, max-height 0.3s ease-in-out",
      }
    : {
        height: "min(600px, calc(100dvh - 48px), calc(100svh - 48px))",
        bottom: `${bottomOffset.value}px`,
        maxHeight: `min(600px, calc(100dvh - ${bottomOffset.value + 24}px), calc(100svh - ${bottomOffset.value + 24}px))`,
        transition: "bottom 0.3s ease-in-out, max-height 0.3s ease-in-out, height 0.3s ease-in-out",
      }
);

// Computed property to determine if typing indicator should be visible
// This will be defined after chat is initialized
let showTypingIndicator;

// Create reactive headers and body that include context
const getContextHeaders = () => {
  const headers = {};
  const context = effectiveContext.value;
  const chapterNameValue = context.chapterName;
  
  headers["X-Chapter-Name"] = chapterNameValue;
  if (context.subject) headers["X-Subject"] = context.subject;
  if (context.level) headers["X-Level"] = context.level;
  if (context.topic) headers["X-Topic"] = context.topic;
  if (context.chapterNo !== null && context.chapterNo !== undefined) {
    headers["X-Chapter-No"] = String(context.chapterNo);
  }
  
  // Authentication is handled via cookies automatically by $fetch for Nuxt API routes
  // No need to send Authorization header
  
  return headers;
};

const getContextBody = () => {
  const body = {};
  const context = effectiveContext.value;
  const chapterNameValue = context.chapterName;
  
  body.chapterName = chapterNameValue;
  if (context.subject) body.subject = context.subject;
  if (context.level) body.level = context.level;
  if (context.topic) body.topic = context.topic;
  if (context.chapterNo !== null && context.chapterNo !== undefined) {
    body.chapterNo = context.chapterNo;
  }
  
  return body;
};

// Create a custom fetch that wraps the default fetch (unused, kept for reference)
const createCustomFetch = () => {
  return async (url, options = {}) => {
    const chapterNameValue = currentChapterName.value;
    
    
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
      } catch (e) {
        if (isDev) {
          console.warn("[Subject AI Teacher] Could not parse body:", e);
        }
      }
    }
    
    
    return fetch(url, {
      ...options,
      headers: mergedHeaders,
      body,
    });
  };
};

// Intercept fetch calls by overriding the global fetch BEFORE Chat component initialization
// This ensures the Chat component uses our intercepted fetch
// Store original fetch
const originalFetch = window.fetch;

// Override fetch to add context
window.fetch = async function(url, options = {}) {
  // Only intercept calls to our API endpoint
  if (typeof url === 'string' && url.includes('/api/chat')) {
    const context = effectiveContext.value;
    const chapterNameValue = context.chapterName;
    
    
    // Add context headers
    const contextHeaders = getContextHeaders();
    
    // Properly merge headers - handle both Headers object and plain object
    let mergedHeaders;
    if (options.headers instanceof Headers) {
      mergedHeaders = new Headers(options.headers);
      Object.entries(contextHeaders).forEach(([key, value]) => {
        mergedHeaders.set(key, value);
      });
    } else {
      mergedHeaders = {
        ...(options.headers || {}),
        ...contextHeaders,
      };
    }
    
    // Add context to body if it's a JSON string
    let body = options.body;
    if (body && typeof body === 'string') {
      try {
        const bodyObj = JSON.parse(body);
        const contextBody = getContextBody();
        // Merge context into body
        Object.assign(bodyObj, contextBody);
        body = JSON.stringify(bodyObj);
      } catch (e) {
        if (isDev) {
          console.warn("[Subject AI Teacher] Could not parse body:", e);
          console.warn("[Subject AI Teacher] Body type:", typeof body, "Body:", body?.substring(0, 200));
        }
      }
    } else if (isDev) {
      console.warn("[Subject AI Teacher] Body is not a string, type:", typeof body);
    }
    
    const contextToSend = {
      chapterName: chapterNameValue,
      subject: context.subject,
      level: context.level,
      topic: context.topic,
      chapterNo: context.chapterNo
    };
    
    
    // Validate that we're sending a valid chapter name
    if (!chapterNameValue || chapterNameValue === "this competence" || !chapterNameValue.trim()) {
      console.error("[Subject AI Teacher] ⚠️ WARNING: Invalid chapter name being sent:", chapterNameValue);
    }
    
    try {
      // Call original fetch with modified options
      const response = await originalFetch(url, {
        ...options,
        headers: mergedHeaders,
        body,
      });
      
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error("[Subject AI Teacher] ❌ Response error:", errorText);
      }
      
      return response;
    } catch (error) {
      console.error("[Subject AI Teacher] ❌ Fetch error:", error);
      throw error;
    }
  }
  
  // For other URLs, use original fetch
  return originalFetch(url, options);
};


// Initialize Chat component AFTER fetch interceptor is set up
// This ensures Chat uses our intercepted fetch
const chat = new Chat({
  api: "/api/chat",
});


// Computed property to determine if typing indicator should be visible
// Defined after chat is initialized so it can access chat.status
showTypingIndicator = computed(() => {
  const isCurrentlyLoading = isLoading.value;
  const isStreaming = chat.status === 'streaming';
  const isChatLoading = chat.isLoading || false;
  const shouldShow = isCurrentlyLoading || isStreaming || isChatLoading;
  return shouldShow;
});

// Sync Chat component messages with local messages state
// Use a debounced approach to avoid too many updates during streaming
let syncTimeout = null;
watch(
  () => chat.messages,
  (chatMessages) => {
    
    if (!Array.isArray(chatMessages)) {
      if (isDev) {
        console.warn("[Subject AI Teacher] ⚠️ chatMessages is not an array:", chatMessages);
      }
      return;
    }

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
      // Don't auto-scroll during streaming - let student read at their own pace
      // Only scroll when NOT streaming
      if (chat.status !== 'streaming') {
        scrollToBottom(true);
      }
    }, 50); // 50ms debounce for streaming updates
  },
  { deep: true, immediate: false }
);

// Consolidated watcher for chat status and loading state
// Handles both chat.status and chat.isLoading changes efficiently
let loadingTimeout = null;

// Helper function to handle streaming completion
const handleStreamingComplete = () => {
  // Clear any pending timeout
  if (loadingTimeout) {
    clearTimeout(loadingTimeout);
  }
  
  // Check if we have assistant messages (responses)
  const hasAssistantMessage = chat.messages.some(m => m.role === 'assistant');
  if (hasAssistantMessage) {
    // Add a small delay to ensure the last message chunk is rendered
    loadingTimeout = setTimeout(() => {
      // Double-check that streaming is really done
      if (chat.status === 'ready' && !chat.isLoading) {
        isLoading.value = false;
        // Scroll to bottom when streaming completes to show final message
        scrollToBottom(true);
      }
    }, 150);
  }
  // If no assistant message yet, keep isLoading true (waiting for response)
};

// Watch both chat.status and chat.isLoading together
watch(
  () => [chat.status, chat.isLoading],
  ([newStatus, isChatLoading]) => {
    // Always turn on when streaming starts or loading begins
    if (newStatus === 'streaming' || isChatLoading) {
      isLoading.value = true;
      // Scroll once when streaming starts to show typing indicator/beginning of response
      // But then stop auto-scrolling during streaming so student can read
      if (newStatus === 'streaming') {
        scrollToBottom(true);
      }
    } 
    // Only turn off when status is 'ready' AND not loading
    else if (newStatus === 'ready' && !isChatLoading) {
      handleStreamingComplete();
    }
  }
);

// Quick action states
const isSummarizing = ref(false);
const isEnglishCrashCourse = ref(false);
const isPlayingAudio = ref(false);
const currentAudio = ref(null);
const audioElement = ref(null);

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
  if (isPlayingAudio.value) {
    stopReading();
  }
};

const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// Check footer position and calculate dynamic bottom offset
const checkFooterPosition = () => {
  if (!import.meta.client) return;
  
  const footer = document.querySelector('footer');
  if (!footer) {
    // No footer found, keep at default bottom position
    bottomOffset.value = 24;
    return;
  }
  
  const footerRect = footer.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const footerTop = footerRect.top;
  const footerHeight = footerRect.height;
  
  // AI Assistant dimensions
  const assistantHeight = 600; // Fixed height from style
  const defaultBottomOffset = 24; // Default position from bottom (always near bottom)
  const minSpacing = 16; // Minimum spacing between assistant and footer
  
  // Calculate distance from viewport bottom to footer top
  // If footer is below viewport, footerTop > viewportHeight
  // If footer is visible, footerTop < viewportHeight
  const distanceFromBottom = viewportHeight - footerTop;
  
  if (distanceFromBottom <= 0) {
    // Footer is below viewport, use default bottom position
    bottomOffset.value = defaultBottomOffset;
  } else {
    // Footer is visible or approaching viewport
    // Calculate required space: assistant height + default offset + spacing
    const requiredSpace = assistantHeight + defaultBottomOffset + minSpacing;
    
    // Available space from viewport bottom to footer top
    const availableSpace = distanceFromBottom;
    
    if (availableSpace >= requiredSpace) {
      // Enough space to fit assistant at default position without overlapping footer
      bottomOffset.value = defaultBottomOffset;
    } else {
      // Not enough space - position assistant above footer with spacing
      // Position assistant so its bottom is minSpacing pixels above footer top
      // bottomOffset = distance from viewport bottom to assistant bottom
      // = (viewportHeight - footerTop) + minSpacing
      const calculatedOffset = distanceFromBottom + minSpacing;
      
      // Ensure it's never less than defaultBottomOffset (always near bottom when possible)
      bottomOffset.value = Math.max(defaultBottomOffset, calculatedOffset);
      
      // Also ensure assistant doesn't go off top of screen
      // If calculated position would push assistant above viewport, cap it
      const maxOffset = viewportHeight - assistantHeight - 16; // 16px margin from top
      if (bottomOffset.value > maxOffset) {
        bottomOffset.value = maxOffset;
      }
    }
  }
  
};

// Use Intersection Observer for more efficient footer detection
const setupFooterObserver = () => {
  if (!import.meta.client || typeof IntersectionObserver === 'undefined') {
    // Fallback to scroll-based detection if IntersectionObserver is not available
    return;
  }
  
  // Wait a bit for DOM to be ready
  setTimeout(() => {
    const footer = document.querySelector('footer');
    if (!footer) return;
    
    // Clean up existing observer
    if (footerObserver.value) {
      footerObserver.value.disconnect();
    }
    
    // Create intersection observer with root margin to trigger before footer enters viewport
    footerObserver.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Recalculate position when footer visibility changes
          checkFooterPosition();
        });
      },
      {
        root: null,
        rootMargin: '0px 0px -100px 0px', // Trigger 100px before footer enters viewport
        threshold: [0, 0.1, 0.5, 1],
      }
    );
    
    footerObserver.value.observe(footer);
  }, 100);
};

// Scroll/resize handlers for footer detection
let scrollTimeout = null;
const throttledCheckFooter = () => {
  if (scrollTimeout) return;
  scrollTimeout = setTimeout(() => {
    checkFooterPosition();
    scrollTimeout = null;
  }, 50); // Check every 50ms during scroll
};

// Combine onMounted tasks
onMounted(() => {
  updateViewportState();
  // Initialize stored context from localStorage
  initializeStoredContext();
  
  loadVoicePreference();
  
  // Setup footer observer for better detection
  setupFooterObserver();
  
  // Also check on scroll/resize as fallback - use throttled version for performance
  window.addEventListener('scroll', throttledCheckFooter, { passive: true });
  window.addEventListener('resize', checkFooterPosition, { passive: true });
  window.addEventListener('resize', updateViewportState, { passive: true });
  window.addEventListener('orientationchange', updateViewportState);
  
  // Initial check
  checkFooterPosition();
  
  // Periodic check as backup (in case footer loads after component)
  const footerCheckInterval = setInterval(() => {
    checkFooterPosition();
    const footer = document.querySelector('footer');
    if (footer) {
      // Footer found, stop checking
      clearInterval(footerCheckInterval);
    }
  }, 500);
  
  // Clean up interval on unmount
  onUnmounted(() => {
    clearInterval(footerCheckInterval);
  });

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
    // Clear any pending timeouts
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    if (loadingTimeout) {
      clearTimeout(loadingTimeout);
    }
    // Remove scroll/resize listeners
    window.removeEventListener('scroll', throttledCheckFooter);
    window.removeEventListener('resize', checkFooterPosition);
    window.removeEventListener('resize', updateViewportState);
    window.removeEventListener('orientationchange', updateViewportState);
    
    // Clear any pending scroll timeout
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
      scrollTimeout = null;
    }
    
    // Disconnect footer observer
    if (footerObserver.value) {
      footerObserver.value.disconnect();
      footerObserver.value = null;
    }
    // Restore original fetch when component unmounts
    if (typeof window !== 'undefined' && originalFetch) {
      window.fetch = originalFetch;
    }
  });
});

const openAssistant = () => {
  if (isOpen.value) return;
  isOpen.value = true;
  if (isOpen.value) {
    shouldAutoScroll.value = true;
    nextTick(() => scrollToBottom(false));
  }
};

watch(
  () => openFromGlobalSignal.value,
  (next, prev) => {
    if (next !== prev) {
      openAssistant();
    }
  }
);

// Toggle assistant open/close and auto-scroll
const toggleAssistant = () => {
  if (isOpen.value) {
    isOpen.value = false;
    return;
  }
  openAssistant();
};

// Handle form submit - use legacy AI assistant (/api/ai-assistant/ask) for subject teacher
const handleFormSubmit = async (e) => {
  e.preventDefault();
  const question = currentQuestion.value.trim();
  if (!question || isLoading.value || !props.chapterId) return;

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
  await askQuestion(question, question, { useDocsAPI: false });
};

const getAvailableAudios = () =>
  Array.isArray(props.audios) ? props.audios : [];

const getPreferredAudio = () => {
  const audios = getAvailableAudios();
  if (audios.length === 0) return null;
  const preferredType = voiceGender.value;
  return (
    audios.find(
      (audio) => String(audio?.type || "").toLowerCase() === preferredType
    ) || null
  );
};

// Reset conversation when chapter changes
watch(
  () => props.chapterId,
  (newChapterId, oldChapterId) => {
    // Log chapter change for debugging
    
    // If there's an old chapter, store it in previousChapterId (so the name matches)
    if (oldChapterId && newChapterId !== oldChapterId) {
      stopReading();
      messages.value = [];
      chat.messages = []; // Clear Chat component messages too
      previousChapterId.value = oldChapterId; // store old value
      isSummarizing.value = false;
      isEnglishCrashCourse.value = false;
      showSettings.value = false;
    } else if (newChapterId && !oldChapterId) {
      // Initial load - no audio pre-fetch needed
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
  const { useDocsAPI = false, docsField = null } = options;

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

      const preferredField = docsField || "crashCourse";
      const preferredContent = safeContent(summaryData?.[preferredField]);
      const fallbackContent =
        preferredField === "summary"
          ? safeContent(summaryData?.summary) ||
            safeContent(summaryData?.content) ||
            safeContent(summaryData?.description)
          : safeContent(summaryData?.crashCourse) ||
            safeContent(summaryData?.content) ||
            safeContent(summaryData?.description) ||
            safeContent(summaryData?.summary);

      answer = preferredContent || fallbackContent || JSON.stringify(summaryData, null, 2);
      provider = "Docs API";
      model = "getChapterId";
    } else {
      // Normal AI assistant
      // $fetch automatically sends cookies for same-origin requests
      const response = await $fetch("/api/ai-assistant/ask", {
        method: "POST",
        body: { question, chapterId: props.chapterId, conversationHistory },
        signal,
      });

      answer = safeContent(response.answer);
      provider = response.provider || "Unknown";
      model = response.model || "Unknown";
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
    // Add a small offset (50px) to scroll a bit more than the bottom
    // This ensures the last message is fully visible with some padding
    const scrollOffset = 50;
    const targetScroll = messagesContainer.value.scrollHeight + scrollOffset;
    
    if (smooth) {
      messagesContainer.value.scrollTo({
        top: targetScroll,
        behavior: "smooth",
      });
    } else {
      messagesContainer.value.scrollTop = targetScroll;
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
// Watchers to auto-scroll on messages (but not during streaming)
watch(
  messages,
  () => {
    // Only auto-scroll if not currently streaming
    // This allows student to read during streaming without constant scrolling
    if (chat.status !== 'streaming') {
      scrollToBottom(true);
    }
    
    // Fix numbered lists after Vue re-renders (prevents all items showing as "1.")
    nextTick(() => {
      if (messagesContainer.value) {
        const orderedLists = messagesContainer.value.querySelectorAll('ol');
        orderedLists.forEach((ol) => {
          const items = ol.querySelectorAll('li[value]');
          items.forEach((li, index) => {
            const value = li.getAttribute('value');
            if (value) {
              // Ensure the value attribute is respected
              li.setAttribute('value', value);
            }
          });
        });
      }
    });
  },
  { deep: true }
);
watch(isLoading, (newVal) => {
  // Scroll once when loading starts (streaming begins) to show typing indicator
  // But don't continue scrolling during streaming
  if (newVal && chat.status === 'streaming') {
    // Scroll once when streaming starts
    scrollToBottom(true);
  } else if (!newVal && chat.status === 'ready') {
    // Scroll when streaming completes to show final message
    scrollToBottom(true);
    // Render MathJax after message is complete
    renderMathJax();
  }
});

// Render MathJax formulas
const messageContainers = ref([]);
const renderMathJax = async () => {
  if (import.meta.server) return;
  
  await nextTick();
  
  if (window.mathJaxLoaded && window.MathJaxRender) {
    try {
      await window.mathJaxLoaded;
      const containers = Array.isArray(messageContainers.value) 
        ? messageContainers.value 
        : messageContainers.value 
          ? [messageContainers.value] 
          : [];
      
      if (containers.length > 0) {
        await window.MathJaxRender(containers);
      }
    } catch (error) {
      if (isDev) {
        console.warn("MathJax rendering failed:", error);
      }
    }
  }
};

// Watch messages to trigger MathJax rendering
watch(() => messages.value, () => {
  renderMathJax();
}, { deep: true });

// Summarize and Crash Course actions
const handleSummarize = async () => {
  if (isLoading.value || isSummarizing.value || !props.chapterId) return;
  isSummarizing.value = true;
  const prompt = `Please provide a comprehensive summary of this chapter/competence: ${props.chapterName}. Include main concepts, key points, and important information.`;
  try {
    await askQuestion(prompt, "Create a summary", {
      useDocsAPI: true,
      docsField: "summary",
    });
  } finally {
    isSummarizing.value = false;
  }
};

const handleEnglishCrashCourse = async () => {
  if (isLoading.value || isEnglishCrashCourse.value || !props.chapterId) return;
  isEnglishCrashCourse.value = true;
  const prompt = `I'm a Tanzanian student who learned in Swahili. Please explain this chapter/competence "${props.chapterName}" in simple English, helping me understand the key concepts and terms. Use Tanzanian context, examples, and references that relate to Tanzania. Use simple language and provide examples where helpful. use swahili to make more emphasis on points.`;
  try {
    await askQuestion(prompt,  isSwahili.value ? "Nisaidie kujifunza kiswahili" : "Help with English crash course", {
      useDocsAPI: true,
      docsField: "crashCourse",
    });
  } finally {
    isEnglishCrashCourse.value = false;
  }
};

// Helper function to generate user-friendly error messages for audio playback
const getAudioErrorMessage = (errorMessage, errorCode, networkState, audioSrc) => {
  const is404 = errorMessage?.includes('404') || errorMessage?.includes('not found') || 
                (audioSrc?.includes('/api/audio/') && (networkState === 3 || errorCode === 2));
  const isFormatError = errorMessage?.includes('Format error') || 
                        errorMessage?.includes('no supported source') || 
                        errorCode === 4 || errorCode === 3;
  const isNetworkError = networkState === 3 || errorCode === 2;
  
  let message = 'Unable to play audio. ';
  
  if (is404) {
    message += 'The audio file was not found. It may not be available yet. Please try again later or contact support.';
  } else if (isFormatError) {
    message += 'The audio format is not supported or the file is corrupted. Please try again or contact support.';
  } else if (errorMessage?.includes('Audio URL not found')) {
    message += 'The audio file information is missing. Please try refreshing the page or contact support.';
  } else if (isNetworkError) {
    message += 'There was a network error loading the audio. Please check your connection and try again.';
  } else {
    message += `${errorMessage || 'Unknown error'}. Please try again.`;
  }
  
  return message;
};

// Helper function to add error message to chat and scroll
const addErrorMessageToChat = (message) => {
  messages.value.push({
    role: "assistant",
    content: message,
    timestamp: new Date().toLocaleTimeString(),
  });
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Read (audio) - plays chapter audio files
const handleRead = async () => {
  if (isLoading.value || !props.chapterId) return;

  // If already playing, do nothing (use stopReading to pause)
  if (isPlayingAudio.value) {
    return;
  }

  const audios = getAvailableAudios();
  if (audios.length === 0) {
    messages.value.push({
      role: "assistant",
      content:
        "No audio is available for this topic yet. The audio files will be added soon! You can still read the content above or ask me questions about the topic.",
      timestamp: new Date().toLocaleTimeString(),
    });
    nextTick(() => {
      if (messagesContainer.value)
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    });
    return;
  }

  const audio = getPreferredAudio();
  if (!audio) {
    messages.value.push({
      role: "assistant",
      content: `No ${voiceGender.value} audio is available for this topic yet. Please try the other voice option.`,
      timestamp: new Date().toLocaleTimeString(),
    });
    nextTick(() => {
      if (messagesContainer.value)
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    });
    return;
  }

  let audioId;
  let finalAudioUrl;

  try {
    // Extract audio ID - handle both formats from props and API
    audioId = audio._id || audio.id;

    if (!audioId) {
      throw new Error("Audio ID not found");
    }

    isPlayingAudio.value = true;

    // Create audio element if it doesn't exist
    if (!audioElement.value) {
      audioElement.value = new Audio();

      // Handle audio ended - stop playback and reset state
      audioElement.value.addEventListener("ended", () => {
        isPlayingAudio.value = false;
        currentAudio.value = null;
      });

      // Handle audio errors
      audioElement.value.addEventListener("error", (e) => {
        const target = e.target;
        const errorCode = target?.error?.code;
        const errorMessage = target?.error?.message || "Unknown audio error";
        const networkState = target?.networkState;
        const audioSrc = target?.src;

        isPlayingAudio.value = false;
        const userMessage = getAudioErrorMessage(
          errorMessage,
          errorCode,
          networkState,
          audioSrc
        );
        addErrorMessageToChat(userMessage);
      });
    }

    // Set audio source and preload for faster playback
    // Check all possible URL fields (filepath is primary from API, then url, audioFileUrl, audio_url)
    const audioUrl =
      audio.filepath || audio.url || audio.audioFileUrl || audio.audio_url;

    if (!audioUrl) {
      throw new Error(
        `Audio URL not found for audio ID: ${audioId}. Audio object missing filepath, url, audioFileUrl, and audio_url fields.`
      );
    }

    if (
      audioUrl &&
      (audioUrl.startsWith("http://") || audioUrl.startsWith("https://"))
    ) {
      finalAudioUrl = audioUrl;
    } else {
      // Use the /api/audio endpoint which handles audio streaming
      finalAudioUrl = `/api/audio/${audioId}`;
    }

    // Set source and configure for streaming
    audioElement.value.src = finalAudioUrl;
    audioElement.value.preload = "auto";

    // For streaming, we can start playing immediately - the browser will handle Range requests
    await audioElement.value.load();
    await audioElement.value.play();
  } catch (error) {
    const errorMessage = error?.message || "Unknown error";
    const networkState = audioElement.value?.networkState;
    const errorCode = audioElement.value?.error?.code;

    isPlayingAudio.value = false;
    const userMessage = getAudioErrorMessage(
      errorMessage,
      errorCode,
      networkState,
      finalAudioUrl
    );
    addErrorMessageToChat(userMessage);
  }
};

const stopReading = () => {
  try {
    // Stop the audio element
    if (audioElement.value) {
      audioElement.value.pause();
      audioElement.value.currentTime = 0;
    }
    // Also handle legacy currentAudio if it exists
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
      currentAudio.value = null;
    }
    isPlayingAudio.value = false;
  } catch (error) {
    isPlayingAudio.value = false;
    currentAudio.value = null;
  }
};

// cleanup
onUnmounted(() => {
  subjectTeacherOpenState.value = false;
  stopReading();
  // Clean up audio element
  if (audioElement.value) {
    audioElement.value.src = '';
    audioElement.value = null;
  }
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
    v-if="showLocalLauncher && !isOpen"
    @click="toggleAssistant"
    :class="launcherClass"
    :style="launcherStyle"
    :title="subjectUi.launcherTitle"
  >
    <Icon
      name="fluent:bot-28-filled"
      size="24"
    />
    <span class="hidden md:block">{{ subjectUi.title }}</span>
  </button>

  <!-- AI Assistant Panel -->
  <div
    v-if="isOpen"
    :class="panelClass"
    :style="panelStyle"
  >
    <!-- Header -->
    <div
      class="relative flex items-center justify-between border-b bg-oceanBlue p-4 text-white settings-container"
      :class="isSmallScreen ? 'rounded-t-2xl' : 'rounded-t-lg'"
    >
      <div class="min-w-0 pr-2">
        <h3 class="font-semibold">{{ subjectUi.title }}</h3>
        <p class="truncate text-xs opacity-90">{{ chapterName }}</p>
      </div>
      <div class="relative flex items-center gap-2">
        <!-- Settings Button -->
        <button
          @click.stop="toggleSettings"
          class="p-1 rounded hover:bg-white/20"
          :title="subjectUi.voiceSettings"
        >
          <Icon
            name="mdi:cog"
            size="20"
          />
        </button>
        <!-- Settings Dropdown -->
        <div
          v-if="showSettings"
          class="absolute top-full right-0 z-50 mt-2 min-w-[200px] max-w-[min(18rem,calc(100vw-2rem))] rounded-lg bg-white p-4 shadow-lg settings-container"
          @click.stop
        >
          <h4 class="mb-2 font-semibold text-gray-900">{{ subjectUi.voiceSettings }}</h4>
          <p class="mb-3 text-xs text-gray-500">
            {{ subjectUi.voiceSettingsHelp }}
          </p>
          <div class="space-y-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="female"
                :checked="voiceGender === 'female'"
                @change="saveVoicePreference('female')"
              />
              <span class="text-gray-900">{{ subjectUi.femaleVoice }}</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                value="male"
                :checked="voiceGender === 'male'"
                @change="saveVoicePreference('male')"
              />
              <span class="text-gray-900">{{ subjectUi.maleVoice }}</span>
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
        'flex-1 min-h-0 overflow-y-auto p-4',
        messages.length === 0
          ? 'flex items-center justify-center'
          : 'flex flex-col space-y-4',
      ]"
      style="padding-bottom: 80px;"
      ref="messagesContainer"
      @scroll="handleScroll"
    >
      <ClientOnly>
        <div
          v-if="messages.length === 0"
          class="text-center text-gray-500"
        >
          <p>{{ subjectUi.welcome }} <strong>{{ subjectUi.title }}</strong>.</p>
          <p class="mt-2 text-sm">
            {{ subjectUi.intro }} <strong>{{ chapterName }}</strong
            >.
          </p>
          <p class="mt-1 text-xs opacity-75">
            {{ subjectUi.prompt }}
          </p>
        </div>
        <template #fallback>
          <div
            v-if="messages.length === 0"
            class="text-center text-gray-500"
          >
            <p>{{ subjectUi.welcome }} <strong>{{ subjectUi.title }}</strong>.</p>
            <p class="mt-2 text-sm">
              {{ subjectUi.intro }} <strong>{{ chapterName }}</strong
              >.
            </p>
            <p class="mt-1 text-xs opacity-75">
              {{ subjectUi.prompt }}
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
            ref="messageContainers"
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
      <!-- Show immediately when form is submitted or when chat is streaming -->
      <div
        v-show="showTypingIndicator"
        class="flex justify-start"
        style="min-height: 60px;"
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
            <span class="text-gray-500 text-sm ml-2">{{ subjectUi.typing }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="border-t border-gray-200 p-4">
      <form
        @submit.prevent="handleFormSubmit"
        class="flex flex-col gap-2 sm:flex-row"
      >
        <input
          v-model="currentQuestion"
          type="text"
          :placeholder="subjectUi.inputPlaceholder"
          :aria-label="subjectUi.inputAria"
          class="flex-1 rounded-lg border border-gray-300 p-3 focus:outline-none"
          :disabled="isLoading || !chapterId"
        />

        <button
          type="submit"
          :disabled="!currentQuestion.trim() || isLoading || !chapterId"
          class="rounded-lg bg-oceanBlue px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ subjectUi.send }}
        </button>
      </form>
    </div>

    <!-- Quick Action Buttons -->
    <div class="border-t border-gray-200 px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
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
          <span>{{ isSummarizing ? subjectUi.summarizeBusy : subjectUi.summarizeIdle }}</span>
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
            isEnglishCrashCourse ? subjectUi.englishCrashCourseBusy : subjectUi.englishCrashCourseIdle
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
          <span>{{ isPlayingAudio ? subjectUi.stopReading : subjectUi.read }}</span>
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

/* Ensure ordered lists maintain proper sequential numbering */
ol {
  list-style-type: decimal;
  list-style-position: outside;
}

ol li {
  display: list-item;
  margin: 0.25rem 0;
  padding-left: 0.25rem;
}

/* Ensure value attribute is respected for proper numbering */
ol li[value] {
  counter-reset: none;
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
