<template>
  <!-- Floating AI Assistant Button -->
  <button
    v-if="!isOpen"
    @click="toggleAssistant"
    class="fixed bottom-6 right-6 z-50 bg-oceanBlue hover:bg-deepBlue text-white rounded-full p-4 shadow-lg transition-all duration-300 flex items-center gap-2"
    title="Ask Madam Ana"
  >
    <Icon name="mdi:robot" size="24" />
    <span class="hidden md:block">Madam Ana</span>
  </button>

  <!-- AI Assistant Panel -->
  <div
    v-if="isOpen"
    class="fixed bottom-6 right-6 z-50 w-full max-w-md bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col"
    style="height: 600px;"
  >
    <!-- Header -->
    <div class="flex items-center justify-between p-4 border-b bg-oceanBlue text-white rounded-t-lg">
      <div>
        <h3 class="font-semibold">Madam Ana</h3>
        <p class="text-xs opacity-90">{{ chapterName }}</p>
      </div>
      <button @click="toggleAssistant" class="hover:bg-white/20 rounded p-1">
        <Icon name="mdi:close" size="20" />
      </button>
    </div>

    <!-- Messages Container -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
      <div v-if="messages.length === 0" class="text-center text-gray-500 py-8">
        <Icon name="mdi:robot" size="48" class="mx-auto mb-2 text-oceanBlue" />
        <p>Hello! I'm <strong>Madam Ana</strong>, your STEM subjects teacher.</p>
        <p class="text-sm mt-2">I'm here to help you understand <strong>{{ chapterName }}</strong>.</p>
        <p class="text-xs mt-1 opacity-75">Feel free to ask me any questions about this competence!</p>
      </div>

      <div
        v-for="(message, index) in messages"
        :key="index"
        :class="[
          'flex',
          message.role === 'user' ? 'justify-end' : 'justify-start'
        ]"
      >
        <div
          :class="[
            'max-w-[85%] rounded-xl p-4 shadow-md',
            message.role === 'user'
              ? 'bg-gradient-to-br from-oceanBlue to-deepBlue text-white'
              : 'bg-gradient-to-br from-blue-50 to-gray-50 text-gray-900 border border-gray-200'
          ]"
        >
          <div 
            class="text-sm leading-relaxed"
            :class="message.role === 'user' ? 'text-white' : 'text-gray-800'"
            v-html="formatMessage(message.content)"
          ></div>
          <p 
            class="text-xs mt-3 opacity-60 font-medium"
            :class="message.role === 'user' ? 'text-blue-100' : 'text-gray-500'"
          >
            {{ message.timestamp }}
          </p>
        </div>
      </div>

      <div v-if="isLoading" class="flex justify-start">
        <div class="bg-gradient-to-br from-blue-50 to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm">
          <div class="flex gap-1.5">
            <span class="w-2.5 h-2.5 bg-oceanBlue rounded-full animate-bounce"></span>
            <span class="w-2.5 h-2.5 bg-oceanBlue rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
            <span class="w-2.5 h-2.5 bg-oceanBlue rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Action Buttons -->
    <div class="px-4 pt-4 pb-2 border-t border-gray-200">
      <div class="flex flex-wrap gap-2">
        <button
          @click="handleSummarize"
          :disabled="isLoading || isSummarizing || !chapterId"
          class="flex-1 min-w-[100px] px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-oceanBlue to-deepBlue text-white rounded-lg hover:from-deepBlue hover:to-oceanBlue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon name="mdi:file-document-outline" size="18" />
          <span>{{ isSummarizing ? 'Summarizing...' : 'Summarize' }}</span>
        </button>
        <button
          @click="handleEnglishCrashCourse"
          :disabled="isLoading || isEnglishCrashCourse || !chapterId"
          class="flex-1 min-w-[100px] px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon name="mdi:translate" size="18" />
          <span>{{ isEnglishCrashCourse ? 'Loading...' : 'English Crash Course' }}</span>
        </button>
        <button
          @click="isPlayingAudio ? stopReading() : handleRead()"
          :disabled="isLoading || !chapterId"
          class="flex-1 min-w-[100px] px-3 py-2 text-xs sm:text-sm bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
        >
          <Icon :name="isPlayingAudio ? 'mdi:pause' : 'mdi:volume-high'" size="18" />
          <span>{{ isPlayingAudio ? 'Stop Reading' : 'Read' }}</span>
        </button>
      </div>
    </div>

    <!-- Input Area -->
    <div class="p-4 border-t border-gray-200">
      <form @submit.prevent="askQuestion" class="flex gap-2">
        <input
          v-model="currentQuestion"
          type="text"
          placeholder="Ask about this competence..."
          class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-oceanBlue"
          :disabled="isLoading || !chapterId"
        />
        <button
          type="submit"
          :disabled="!currentQuestion.trim() || isLoading || !chapterId"
          class="px-4 py-2 bg-oceanBlue text-white rounded-lg hover:bg-deepBlue disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Icon name="mdi:send" size="20" />
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';

// Format message content for better display - enhanced markdown support
const formatMessage = (content) => {
  if (!content) return '';
  
  // Escape HTML to prevent XSS
  const escapeHtml = (text) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  };
  
  let formatted = content;
  
  // Step 1: Process code blocks first (before escaping) - triple backticks
  const codeBlocks = [];
  formatted = formatted.replace(/```(\w+)?\n?([\s\S]*?)```/g, (match, lang, code) => {
    const placeholder = `__CODEBLOCK_${codeBlocks.length}__`;
    codeBlocks.push({ placeholder, code: code.trim() });
    return placeholder;
  });
  
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
    formatted = formatted.replace(placeholder, `<pre class="bg-gray-100 p-3 rounded-lg overflow-x-auto my-3 border border-gray-300"><code class="text-sm font-mono whitespace-pre">${escapedCode}</code></pre>`);
  });
  
  // Step 5: Process links [text](url)
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline break-words">$1</a>');
  
  // Step 6: Process bold **text** or __text__
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>');
  formatted = formatted.replace(/__([^_]+)__/g, '<strong class="font-semibold">$1</strong>');
  
  // Step 7: Process italic *text* or _text_ (but not when part of **bold**)
  formatted = formatted.replace(/(?<!\*)\*([^*\n]+?)\*(?!\*)/g, '<em class="italic">$1</em>');
  formatted = formatted.replace(/(?<!_)_([^_\n]+?)_(?!_)/g, '<em class="italic">$1</em>');
  
  // Step 8: Process strikethrough ~~text~~
  formatted = formatted.replace(/~~([^~]+)~~/g, '<del class="line-through opacity-75">$1</del>');
  
  // Step 9: Process blockquotes > text
  formatted = formatted.replace(/^&gt;\s+(.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 my-2 italic text-gray-700">$1</blockquote>');
  
  // Step 10: Process headers on individual lines BEFORE paragraph splitting
  // Match headings that start with # at the beginning of a line (allowing whitespace)
  // Process all heading levels, checking from longest to shortest
  formatted = formatted.replace(/^(#{4})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h4 class="font-semibold text-sm mt-3 mb-2 pt-2">${text.trim()}</h4>`;
  });
  formatted = formatted.replace(/^(#{3})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h3 class="font-semibold text-base mt-4 mb-3 pt-2 border-t border-opacity-20">${text.trim()}</h3>`;
  });
  formatted = formatted.replace(/^(#{2})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h2 class="font-bold text-lg mt-5 mb-3 pt-3 border-t-2 border-opacity-30">${text.trim()}</h2>`;
  });
  formatted = formatted.replace(/^(#{1})\s+(.+)$/gm, (match, hashes, text) => {
    return `<h1 class="font-bold text-xl mt-6 mb-4 pt-4 border-t-2 border-opacity-40">${text.trim()}</h1>`;
  });
  
  // Step 11: Split into paragraphs and process block elements
  // Use regex to split on double newlines, but preserve single newlines
  const paragraphs = formatted.split(/\n\n+/);
  
  formatted = paragraphs.map(para => {
    para = para.trim();
    if (!para) return '';
    
    // Check if already a header (from previous step)
    if (para.startsWith('<h1') || para.startsWith('<h2') || para.startsWith('<h3') || para.startsWith('<h4')) {
      return para;
    }
    
    // Check if paragraph contains multiple headers (split them)
    if (para.includes('</h1>') || para.includes('</h2>') || para.includes('</h3>') || para.includes('</h4>')) {
      // Split by header tags and process each part
      const parts = para.split(/(<\/h[1-4]>)/);
      return parts.map(part => {
        const trimmed = part.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('<h')) return trimmed;
        // Check if this part itself is a header
        if (/^####\s+(.+)$/.test(trimmed)) {
          const headerText = trimmed.replace(/^####\s+/, '').trim();
          return `<h4 class="font-semibold text-sm mt-3 mb-2 pt-2">${headerText}</h4>`;
        }
        if (/^###\s+(.+)$/.test(trimmed)) {
          const headerText = trimmed.replace(/^###\s+/, '').trim();
          return `<h3 class="font-semibold text-base mt-4 mb-3 pt-2 border-t border-opacity-20">${headerText}</h3>`;
        }
        if (/^##\s+(.+)$/.test(trimmed)) {
          const headerText = trimmed.replace(/^##\s+/, '').trim();
          return `<h2 class="font-bold text-lg mt-5 mb-3 pt-3 border-t-2 border-opacity-30">${headerText}</h2>`;
        }
        if (/^#\s+(.+)$/.test(trimmed)) {
          const headerText = trimmed.replace(/^#\s+/, '').trim();
          return `<h1 class="font-bold text-xl mt-6 mb-4 pt-4 border-t-2 border-opacity-40">${headerText}</h1>`;
        }
        return `<p class="mb-2 leading-relaxed">${trimmed.replace(/\n/g, '<br>')}</p>`;
      }).join('');
    }
    
    // Check for horizontal rule
    if (/^[-*_]{3,}$/.test(para)) {
      return '<hr class="my-4 border-gray-300" />';
    }
    
    // Check if paragraph is already a blockquote
    if (para.startsWith('<blockquote')) {
      return para;
    }
    
    // Check if paragraph is a list
    const isBulletList = /^[-•*]\s/m.test(para);
    const isNumberedList = /^\d+\.\s/m.test(para);
    const isTaskList = /^[-*]\s\[([ xX])\]\s/m.test(para);
    
    if (isTaskList) {
      // Handle task lists
      let taskItems = para.replace(/^[-*]\s\[([ xX])\]\s+(.+)$/gim, (match, checked, text) => {
        const isChecked = checked.toLowerCase() === 'x';
        return `<li class="mb-1 flex items-start gap-2"><input type="checkbox" ${isChecked ? 'checked' : ''} disabled class="mt-1" /><span>${text}</span></li>`;
      });
      return `<ul class="list-none space-y-1 my-2 ml-2">${taskItems}</ul>`;
    } else if (isBulletList || isNumberedList) {
      // Handle bullet points (including * as bullet)
      let listItems = para.replace(/^[-•*]\s+(.+)$/gim, '<li class="mb-1">$1</li>');
      // Handle numbered lists
      listItems = listItems.replace(/^\d+\.\s+(.+)$/gim, '<li class="mb-1">$1</li>');
      
      if (listItems.includes('<li')) {
        const listTag = isNumberedList ? 'ol' : 'ul';
        const listClass = isNumberedList 
          ? 'list-decimal list-inside space-y-1 my-2 ml-4' 
          : 'list-disc list-inside space-y-1 my-2 ml-4';
        return `<${listTag} class="${listClass}">${listItems}</${listTag}>`;
      }
    }
    
    // Regular paragraph with line breaks
    para = para.replace(/\n/g, '<br>');
    return `<p class="mb-2 leading-relaxed">${para}</p>`;
  }).filter(p => p).join('');
  
  // Step 11: Restore inline code
  inlineCodes.forEach(({ placeholder, code }) => {
    const escapedCode = escapeHtml(code);
    formatted = formatted.replace(placeholder, `<code class="bg-opacity-20 px-1.5 py-0.5 rounded text-xs font-mono">${escapedCode}</code>`);
  });
  
  return formatted;
};

const props = defineProps({
  chapterId: {
    type: String,
    required: true
  },
  chapterName: {
    type: String,
    default: 'this competence'
  }
});

const isOpen = ref(false);
const currentQuestion = ref('');
const isLoading = ref(false);
const messages = ref([]);
const messagesContainer = ref(null);
const previousChapterId = ref(null);

// Quick action states
const isSummarizing = ref(false);
const isEnglishCrashCourse = ref(false);
const isPlayingAudio = ref(false);
const speechSynthesis = ref(null);
const currentUtterance = ref(null);

const toggleAssistant = () => {
  isOpen.value = !isOpen.value;
};

// Reset conversation when chapter changes
watch(() => props.chapterId, (newChapterId, oldChapterId) => {
  if (oldChapterId && newChapterId !== oldChapterId) {
    // Chapter changed - clear conversation history and stop any audio
    stopReading();
    messages.value = [];
    previousChapterId.value = newChapterId;
    isSummarizing.value = false;
    isEnglishCrashCourse.value = false;
  }
}, { immediate: true });

const askQuestion = async () => {
  if (!currentQuestion.value.trim() || isLoading.value || !props.chapterId) {
    return;
  }

  const question = currentQuestion.value.trim();
  currentQuestion.value = '';

  // Add user message
  messages.value.push({
    role: 'user',
    content: question,
    timestamp: new Date().toLocaleTimeString()
  });

  isLoading.value = true;

  try {
    const token = useCookie('signInAccessToken').value;
    
    if (!token) {
      messages.value.push({
        role: 'assistant',
        content: 'Please sign in to use the AI assistant.',
        timestamp: new Date().toLocaleTimeString()
      });
      isLoading.value = false;
      return;
    }

    if (!props.chapterId) {
      messages.value.push({
        role: 'assistant',
        content: 'Chapter ID is missing. Please reload the page.',
        timestamp: new Date().toLocaleTimeString()
      });
      isLoading.value = false;
      return;
    }

    console.log('Sending request:', { question, chapterId: props.chapterId });

    // Prepare conversation history (without timestamps, just role and content)
    const conversationHistory = messages.value.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await $fetch('/api/ai-assistant/ask', {
      method: 'POST',
      body: {
        question: question,
        chapterId: props.chapterId,
        conversationHistory: conversationHistory
      }
      // $fetch automatically includes cookies, no need to set Authorization header
    });

    // Add AI response
    messages.value.push({
      role: 'assistant',
      content: response.answer,
      timestamp: new Date().toLocaleTimeString()
    });

  } catch (error) {
    console.error('AI Assistant error:', error);
    const errorMessage = error?.data?.message || error?.message || 'Sorry, I encountered an error. Please try again.';
    messages.value.push({
      role: 'assistant',
      content: errorMessage,
      timestamp: new Date().toLocaleTimeString()
    });
  } finally {
    isLoading.value = false;
    // Scroll to bottom
    nextTick(() => {
      if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
      }
    });
  }
};

// Auto-scroll to bottom when new messages arrive
watch(messages, () => {
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
  });
}, { deep: true });

// Handle Summarize action
const handleSummarize = async () => {
  if (isLoading.value || isSummarizing.value || !props.chapterId) {
    return;
  }

  isSummarizing.value = true;
  const prompt = `Please provide a comprehensive summary of this chapter/competence: ${props.chapterName}. Include the main concepts, key points, and important information.`;
  
  // Set the prompt and trigger the question
  currentQuestion.value = prompt;
  try {
    await askQuestion();
  } finally {
    currentQuestion.value = '';
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
  
  // Set the prompt and trigger the question
  currentQuestion.value = prompt;
  try {
    await askQuestion();
  } finally {
    currentQuestion.value = '';
    isEnglishCrashCourse.value = false;
  }
};

// Handle Read (Text-to-Speech) action
const handleRead = async () => {
  if (isLoading.value || isPlayingAudio.value || !props.chapterId) {
    return;
  }

  // Check if browser supports speech synthesis
  if (!('speechSynthesis' in window)) {
    messages.value.push({
      role: 'assistant',
      content: 'Sorry, your browser does not support text-to-speech. Please try a different browser.',
      timestamp: new Date().toLocaleTimeString()
    });
    return;
  }

  try {
    isLoading.value = true;
    isPlayingAudio.value = true;

    // Fetch chapter content
    const token = useCookie('signInAccessToken').value;
    if (!token) {
      throw new Error('Please sign in to use this feature.');
    }

    const chapterData = await $fetch(`/api/topics/chapters/${props.chapterId}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (!chapterData || !chapterData.content) {
      throw new Error('Chapter content not available.');
    }

    // Extract text content (similar to server-side extraction)
    const extractTextContent = (html) => {
      if (!html || typeof html !== 'string') return '';
      
      let text = html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/expPackage="[^"]*"/g, '')
        .replace(/model="[^"]*"/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      return text;
    };

    const textContent = extractTextContent(chapterData.content || chapterData.notes || chapterData.description || '');
    
    if (!textContent || textContent.length === 0) {
      throw new Error('No readable content found in this chapter.');
    }

    // Stop any existing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Create speech utterance
    const utterance = new SpeechSynthesisUtterance(textContent);
    utterance.lang = 'en-US';
    utterance.rate = 0.9; // Slightly slower for better comprehension
    utterance.pitch = 1;
    utterance.volume = 1;

    // Set up event handlers
    utterance.onend = () => {
      isPlayingAudio.value = false;
      currentUtterance.value = null;
    };

    utterance.onerror = (error) => {
      console.error('Speech synthesis error:', error);
      isPlayingAudio.value = false;
      currentUtterance.value = null;
      
      // Only show error message if it's not a user-initiated cancellation
      // error.error === 'interrupted' means user cancelled, which is normal
      if (error.error !== 'interrupted' && error.error !== 'canceled') {
        messages.value.push({
          role: 'assistant',
          content: 'An error occurred while reading. Please try again.',
          timestamp: new Date().toLocaleTimeString()
        });
      }
    };

    currentUtterance.value = utterance;
    window.speechSynthesis.speak(utterance);

    // Show confirmation message
    messages.value.push({
      role: 'assistant',
      content: `Reading chapter: ${chapterData.name || props.chapterName}. Click "Stop Reading" to pause.`,
      timestamp: new Date().toLocaleTimeString()
    });

  } catch (error) {
    console.error('Read error:', error);
    messages.value.push({
      role: 'assistant',
      content: error.message || 'Failed to read chapter content. Please try again.',
      timestamp: new Date().toLocaleTimeString()
    });
    isPlayingAudio.value = false;
  } finally {
    isLoading.value = false;
  }
};

// Stop reading
const stopReading = () => {
  try {
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    // Reset state without showing error message
    isPlayingAudio.value = false;
    currentUtterance.value = null;
  } catch (error) {
    // Silently handle any errors when stopping
    console.log('Stopped reading');
    isPlayingAudio.value = false;
    currentUtterance.value = null;
  }
};

// Clean up speech synthesis on component unmount
onUnmounted(() => {
  stopReading();
});
</script>

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
  font-family: 'Courier New', monospace;
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

ul, ol {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

li {
  margin: 0.25rem 0;
}

h1, h2, h3 {
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

h1:first-child, h2:first-child, h3:first-child {
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

