<script setup>
import { ref, watch, nextTick, onUnmounted, onMounted } from "vue";
import apiDocs from "~/utilities/api-docs";

// Format message content for better display - enhanced markdown support
const formatMessage = (content) => {
  if (!content) return "";

  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  };

  let formatted = content;

  // Step 1: Process code blocks first (before escaping) - triple backticks
  const codeBlocks = [];
  formatted = formatted.replace(
    /```(\w+)?\n?([\s\S]*?)```/g,
    (match, lang, code) => {
      const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ placeholder, code: code.trim() });
      return placeholder;
    }
  );

  // Step 2: Process inline code - single backticks
  const inlineCodes = [];
  formatted = formatted.replace(/`([^`\n]+)`/g, (match, code) => {
    const placeholder = `__INLINECODE_${inlineCodes.length}__`;
    inlineCodes.push({ placeholder, code });
    return placeholder;
  });

  // Step 3: Escape HTML
  formatted = escapeHtml(formatted);

  // Step 4: Restore code blocks
  codeBlocks.forEach(({ placeholder, code }) => {
    const escapedCode = escapeHtml(code);
    formatted = formatted.replace(
      placeholder,
      `<pre class="p-3 my-3 overflow-x-auto bg-gray-100 border border-gray-300 rounded-lg"><code class="font-mono text-sm whitespace-pre">${escapedCode}</code></pre>`
    );
  });

  // Step 5: Process links [text](url)
  formatted = formatted.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline break-words hover:text-blue-800">$1</a>'
  );

  // Step 6: Process bold **text** or __text__
  formatted = formatted.replace(
    /\*\*([^*]+)\*\*/g,
    '<strong class="font-semibold">$1</strong>'
  );
  formatted = formatted.replace(
    /__([^_]+)__/g,
    '<strong class="font-semibold">$1</strong>'
  );

  // Step 7: Process italic *text* or _text_ (but not when part of **bold**)
  formatted = formatted.replace(
    /(?<!\*)\*([^*\n]+?)\*(?!\*)/g,
    '<em class="italic">$1</em>'
  );
  formatted = formatted.replace(
    /(?<!_)_([^_\n]+?)_(?!_)/g,
    '<em class="italic">$1</em>'
  );

  // Step 8: Process strikethrough ~~text~~
  formatted = formatted.replace(
    /~~([^~]+)~~/g,
    '<del class="line-through opacity-75">$1</del>'
  );

  // Step 9: Process blockquotes > text
  formatted = formatted.replace(
    /^&gt;\s+(.+)$/gm,
    '<blockquote class="pl-4 my-2 italic text-gray-700 border-l-4 border-gray-300">$1</blockquote>'
  );

  // Step 10: Process headers on individual lines BEFORE paragraph splitting
  // Match headings that start with # at the beginning of a line (allowing whitespace)
  // Process all heading levels, checking from longest to shortest
  formatted = formatted.replace(/^(#{4})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h4 class="pt-2 mt-3 mb-2 text-sm font-semibold">${text.trim()}</h4>`;
  });
  formatted = formatted.replace(/^(#{3})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h3 class="pt-2 mt-4 mb-3 text-base font-semibold border-t border-opacity-20">${text.trim()}</h3>`;
  });
  formatted = formatted.replace(/^(#{2})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h2 class="pt-3 mt-5 mb-3 text-lg font-bold border-t-2 border-opacity-30">${text.trim()}</h2>`;
  });
  formatted = formatted.replace(/^(#{1})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h1 class="pt-4 mt-6 mb-4 text-xl font-bold border-t-2 border-opacity-40">${text.trim()}</h1>`;
  });

  // Step 11: Split into paragraphs and process block elements
  // Use regex to split on double newlines, but preserve single newlines
  const paragraphs = formatted.split(/\n\n+/);

  formatted = paragraphs
    .map((para) => {
      para = para.trim();
      if (!para) return "";

      // Check if already a header (from previous step)
      if (
        para.startsWith("<h1") ||
        para.startsWith("<h2") ||
        para.startsWith("<h3") ||
        para.startsWith("<h4")
      ) {
        return para;
      }

      // Check if paragraph contains multiple headers (split them)
      if (
        para.includes("</h1>") ||
        para.includes("</h2>") ||
        para.includes("</h3>") ||
        para.includes("</h4>")
      ) {
        // Split by header tags and process each part
        const parts = para.split(/(<\/h[1-4]>)/);
        return parts
          .map((part) => {
            const trimmed = part.trim();
            if (!trimmed) return "";
            if (trimmed.startsWith("<h")) return trimmed;
            // Check if this part itself is a header
            if (/^####\s+(.+)$/.test(trimmed)) {
              const headerText = trimmed.replace(/^####\s+/, "").trim();
              return `<h4 class="pt-2 mt-3 mb-2 text-sm font-semibold">${headerText}</h4>`;
            }
            if (/^###\s+(.+)$/.test(trimmed)) {
              const headerText = trimmed.replace(/^###\s+/, "").trim();
              return `<h3 class="pt-2 mt-4 mb-3 text-base font-semibold border-t border-opacity-20">${headerText}</h3>`;
            }
            if (/^##\s+(.+)$/.test(trimmed)) {
              const headerText = trimmed.replace(/^##\s+/, "").trim();
              return `<h2 class="pt-3 mt-5 mb-3 text-lg font-bold border-t-2 border-opacity-30">${headerText}</h2>`;
            }
            if (/^#\s+(.+)$/.test(trimmed)) {
              const headerText = trimmed.replace(/^#\s+/, "").trim();
              return `<h1 class="pt-4 mt-6 mb-4 text-xl font-bold border-t-2 border-opacity-40">${headerText}</h1>`;
            }
            return `<p class="mb-2 leading-relaxed">${trimmed.replace(
              /\n/g,
              "<br>"
            )}</p>`;
          })
          .join("");
      }

      // Check for horizontal rule
      if (/^[-*_]{3,}$/.test(para)) {
        return '<hr class="my-4 border-gray-300" />';
      }

      // Check if paragraph is already a blockquote
      if (para.startsWith("<blockquote")) {
        return para;
      }

      // Check if paragraph is a list
      const isBulletList = /^[-•*]\s/m.test(para);
      const isNumberedList = /^\d+\.\s/m.test(para);
      const isTaskList = /^[-*]\s\[([ xX])\]\s/m.test(para);

      if (isTaskList) {
        // Handle task lists
        let taskItems = para.replace(
          /^[-*]\s\[([ xX])\]\s+(.+)$/gim,
          (match, checked, text) => {
            const isChecked = checked.toLowerCase() === "x";
            return `<li class="flex items-start gap-2 mb-1"><input type="checkbox" ${
              isChecked ? "checked" : ""
            } disabled class="mt-1" /><span>${text}</span></li>`;
          }
        );
        return `<ul class="my-2 ml-2 space-y-1 list-none">${taskItems}</ul>`;
      } else if (isBulletList || isNumberedList) {
        // Handle bullet points (including * as bullet)
        let listItems = para.replace(
          /^[-•*]\s+(.+)$/gim,
          '<li class="mb-1">$1</li>'
        );
        // Handle numbered lists
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

      // Regular paragraph with line breaks
      para = para.replace(/\n/g, "<br>");
      return `<p class="mb-2 leading-relaxed">${para}</p>`;
    })
    .filter((p) => p)
    .join("");

  // Step 11: Restore inline code
  inlineCodes.forEach(({ placeholder, code }) => {
    const escapedCode = escapeHtml(code);
    formatted = formatted.replace(
      placeholder,
      `<code class="bg-opacity-20 px-1.5 py-0.5 rounded text-xs font-mono">${escapedCode}</code>`
    );
  });

  return formatted;
};

const props = defineProps({
  chapterId: {
    type: String,
    required: true,
  },
  chapterName: {
    type: String,
    default: "this competence",
  },
});

const isOpen = ref(false);
const currentQuestion = ref("");
const isLoading = ref(false);
const messages = ref([]);
const messagesContainer = ref(null);
const previousChapterId = ref(null);
const shouldAutoScroll = ref(true);
const token = useCookie("signInAccessToken").value;

// Provider tracking
const currentProvider = ref(null);
const currentModel = ref(null);

// Quick action states
const isSummarizing = ref(false);
const isEnglishCrashCourse = ref(false);
const isPlayingAudio = ref(false);
const speechSynthesis = ref(null);
const currentUtterance = ref(null);

// Voice preference state (for audio file selection)
const voiceGender = ref("female");
const showSettings = ref(false);
const currentAudio = ref(null);

// Load voice preference from localStorage
const loadVoicePreference = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("tie-teacher-voice");
    if (saved === "male" || saved === "female") {
      voiceGender.value = saved;
    }
  }
};

// Save voice preference to localStorage
const saveVoicePreference = (gender) => {
  voiceGender.value = gender;
  if (typeof window !== "undefined") {
    localStorage.setItem("tie-teacher-voice", gender);
  }
};

// Toggle settings dropdown
const toggleSettings = () => {
  showSettings.value = !showSettings.value;
};

// Load voice preference on mount
onMounted(() => {
  loadVoicePreference();
});

const toggleAssistant = () => {
  isOpen.value = !isOpen.value;
  // Enable auto-scroll and scroll to bottom when opening
  if (isOpen.value) {
    shouldAutoScroll.value = true;
    nextTick(() => {
      scrollToBottom(false); // Instant scroll when opening
    });
  }
};

// Reset conversation when chapter changes
watch(
  () => props.chapterId,
  (newChapterId, oldChapterId) => {
    if (oldChapterId && newChapterId !== oldChapterId) {
      // Chapter changed - clear conversation history and stop any audio
      stopReading();
      messages.value = [];
      previousChapterId.value = newChapterId;
      isSummarizing.value = false;
      isEnglishCrashCourse.value = false;
      showSettings.value = false;
    }
  },
  { immediate: true }
);

// Close settings dropdown when clicking outside
onMounted(() => {
  if (typeof window === "undefined") return;

  const handleClickOutside = (event) => {
    const target = event.target;
    const settingsContainer = target.closest(".settings-container");
    const settingsButton = target.closest('[title="Voice Settings"]');

    if (showSettings.value && !settingsContainer && !settingsButton) {
      showSettings.value = false;
    }
  };

  watch(showSettings, (isOpen) => {
    if (isOpen) {
      // Use setTimeout to avoid immediate trigger
      setTimeout(() => {
        document.addEventListener("click", handleClickOutside);
      }, 0);
    } else {
      document.removeEventListener("click", handleClickOutside);
    }
  });
});

const askQuestion = async (
  actualQuestion = null,
  maskedMessage = null,
  options = {}
) => {
  const { useDocsAPI = false } = options;

  // --- FIX: Convert any non-string into safe string for AI ---
  const safeContent = (value) => {
    if (typeof value === "string") return value;
    if (value === undefined || value === null) return "";
    return JSON.stringify(value);
  };

  // Use provided question or the input field
  const question = actualQuestion || currentQuestion.value.trim();

  if (!question || isLoading.value || !props.chapterId) return;

  // Clear input only when user typed manually
  if (!actualQuestion) currentQuestion.value = "";

  // Push user message to UI
  const userMessage = {
    role: "user",
    content: maskedMessage || question,
    timestamp: new Date().toLocaleTimeString(),
    actualContent: question,
  };
  messages.value.push(userMessage);
  scrollToBottom(true);

  isLoading.value = true;

  try {
    // --- Validate token ---
    if (!token) {
      messages.value.push({
        role: "assistant",
        content: "Please sign in to use the AI assistant.",
        timestamp: new Date().toLocaleTimeString(),
      });
      isLoading.value = false;
      return;
    }

    // --- Validate chapterId ---
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

    // ------------------------------------------
    // Build Clean Conversation History
    // ------------------------------------------
    const conversationHistory = messages.value.map((msg) => ({
      role: msg.role,
      content: safeContent(msg.actualContent || msg.content),
    }));

    let answer = "";
    let provider = "";
    let model = "";

    // ==========================================
    // OPTION A — USE DOCS API (Summaries)
    // ==========================================
    if (useDocsAPI) {
      const summaryData = await $fetch(
        apiDocs.chapters.getChapterId.replace(":id", props.chapterId),
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("[Docs API] Summary data:", summaryData);

      answer =
        safeContent(summaryData?.summary) ||
        safeContent(summaryData?.description) ||
        safeContent(summaryData?.content) ||
        JSON.stringify(summaryData, null, 2);

      provider = "Docs API";
      model = "getChapterId";
    } else {
      // ==========================================
      // OPTION B — NORMAL AI ASSISTANT
      // ==========================================
      const response = await $fetch("/api/ai-assistant/ask", {
        method: "POST",
        body: {
          question,
          chapterId: props.chapterId,
          conversationHistory,
        },
      });

      answer = safeContent(response.answer);
      provider = response.provider || "Unknown";
      model = response.model || "Unknown";

      console.log(`[AI] Response received from ${provider} (${model})`);
    }

    // Save provider + model
    currentProvider.value = provider;
    currentModel.value = model;

    // ------------------------------------------
    // Push assistant message to UI
    // ------------------------------------------
    messages.value.push({
      role: "assistant",
      content: safeContent(answer),
      timestamp: new Date().toLocaleTimeString(),
      provider,
      model,
    });
  } catch (error) {
    console.error("[AI Subject Teacher] Error:", error);

    messages.value.push({
      role: "assistant",
      content:
        error?.data?.message ||
        error?.message ||
        "Sorry, I encountered an error. Please try again.",
      timestamp: new Date().toLocaleTimeString(),
    });
  } finally {
    isLoading.value = false;
    scrollToBottom(true);
  }
};

// Smooth scroll function
const scrollToBottom = (smooth = true) => {
  if (!messagesContainer.value || !shouldAutoScroll.value) return;

  nextTick(() => {
    if (messagesContainer.value) {
      if (smooth) {
        messagesContainer.value.scrollTo({
          top: messagesContainer.value.scrollHeight,
          behavior: "smooth",
        });
      } else {
        messagesContainer.value.scrollTop =
          messagesContainer.value.scrollHeight;
      }
    }
  });
};

// Check if user is near bottom (within 100px)
const isNearBottom = () => {
  if (!messagesContainer.value) return true;
  const threshold = 100;
  const distanceFromBottom =
    messagesContainer.value.scrollHeight -
    messagesContainer.value.scrollTop -
    messagesContainer.value.clientHeight;
  return distanceFromBottom < threshold;
};

// Handle scroll event to determine if user has manually scrolled up
const handleScroll = () => {
  shouldAutoScroll.value = isNearBottom();
};

// Auto-scroll to bottom when new messages arrive
watch(
  messages,
  () => {
    scrollToBottom(true);
  },
  { deep: true }
);

// Auto-scroll when loading state changes
watch(isLoading, (newVal) => {
  if (newVal) {
    scrollToBottom(true);
  }
});

// Handle Summarize action
const handleSummarize = async () => {
  if (isLoading.value || isSummarizing.value || !props.chapterId) return;

  isSummarizing.value = true;

  const prompt = `Please provide a comprehensive summary of this chapter/competence: ${props.chapterName}. Include main concepts, key points, and important information.`;

  try {
    await askQuestion(prompt, "Create a summary", { useDocsAPI: true });
  } finally {
    isSummarizing.value = false;
  }
};

// Handle English Crash Course action
const handleEnglishCrashCourse = async () => {
  if (isLoading.value || isEnglishCrashCourse.value || !props.chapterId) {
    return;
  }

  isEnglishCrashCourse.value = true;
  const prompt = `I'm a Tanzanian student who learned in Swahili. Please explain this chapter/competence "${props.chapterName}" in simple English, helping me understand the key concepts and terms. Use Tanzanian context, examples, and references that relate to Tanzania (like Tanzanian cities, culture, industries, or local examples). Use simple language and provide examples where helpful. use swahili to make more more emphasis on points.`;

  try {
    await askQuestion(prompt, "Help with English crash course");
  } finally {
    isEnglishCrashCourse.value = false;
  }
};

// Handle Read (Audio File) action - PLACEHOLDER
const handleRead = async () => {
  if (isLoading.value || isPlayingAudio.value || !props.chapterId) {
    return;
  }

  // Placeholder message - text-to-speech feature coming soon
  messages.value.push({
    role: "assistant",
    content: `Text-to-speech feature is coming soon! The audio playback functionality will be available once the audio files are added. You can still use the voice settings to select your preferred voice (${
      voiceGender.value === "male" ? "male" : "female"
    }) for when the feature is ready.`,
    timestamp: new Date().toLocaleTimeString(),
  });

  // Scroll to show the message
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
};

// Stop reading
const stopReading = () => {
  try {
    // Stop audio file playback
    if (currentAudio.value) {
      currentAudio.value.pause();
      currentAudio.value.currentTime = 0;
      currentAudio.value = null;
    }
    // Reset state without showing error message
    isPlayingAudio.value = false;
  } catch (error) {
    // Silently handle any errors when stopping
    console.log("Stopped reading");
    isPlayingAudio.value = false;
    currentAudio.value = null;
  }
};

// Clean up audio on component unmount
onUnmounted(() => {
  stopReading();
  // Close settings dropdown if open
  showSettings.value = false;
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
    <div
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
          <!-- Female Voice Avatar -->
          <!-- <div class="flex items-center justify-center gap-6 mb-4">
            <button @click="saveVoicePreference('female')"
              :class="['flex flex-col items-center gap-2 p-3 rounded-xl transition-all', voiceGender === 'female' ? 'bg-oceanBlue text-white' : 'bg-gray-100 hover:bg-gray-200']"
              title="Select Female Voice">
              <Icon name="mdi:face-woman" size="48" />
              <span class="text-xs font-medium">Female Voice</span>
            </button>

            <button @click="saveVoicePreference('male')"
              :class="['flex flex-col items-center gap-2 p-3 rounded-xl transition-all', voiceGender === 'male' ? 'bg-oceanBlue text-white' : 'bg-gray-100 hover:bg-gray-200']"
              title="Select Male Voice">
              <Icon name="mdi:face-man" size="48" />
              <span class="text-xs font-medium">Male Voice</span>
            </button>
          </div> -->
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

      <div
        v-if="isLoading"
        class="flex justify-start"
      >
        <div
          class="p-4 border border-gray-200 shadow-sm bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl"
        >
          <div class="flex gap-1.5">
            <span
              class="w-2.5 h-2.5 bg-oceanBlue rounded-full animate-bounce"
            ></span>
            <span
              class="w-2.5 h-2.5 bg-oceanBlue rounded-full animate-bounce"
              style="animation-delay: 0.2s"
            ></span>
            <span
              class="w-2.5 h-2.5 bg-oceanBlue rounded-full animate-bounce"
              style="animation-delay: 0.4s"
            ></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-gray-200">
      <form
        @submit.prevent="askQuestion()"
        class="flex gap-2 mt-4 border-t pt-4"
      >
        <input
          v-model="currentQuestion"
          @keyup.enter="askQuestion()"
          type="text"
          placeholder="Type your message..."
          class="flex-1 p-3 rounded-lg border border-gray-300 focus:outline-none"
        />

        <button
          type="submit"
          class="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium"
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
</style>
