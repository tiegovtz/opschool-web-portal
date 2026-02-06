<script setup lang="ts">
import axios from "axios";
import MarkdownIt from "markdown-it";
import { ref, reactive, watch, nextTick } from "vue";
import TopicCard from "./TopicCard.vue";
import apiDocs from "~/utilities/apiDocs";
import SearchResults from "./SearchResults.vue";
import type { Topic } from "~/types/topic.interface";

declare global {
  interface Window {
    mathJaxLoaded?: Promise<void>;
    MathJaxRender?: (elements: HTMLElement[]) => Promise<void>;
  }
}

const userToken = useCookie("signInUserToken");

// Markdown renderer with MathJax support
const md = new MarkdownIt({ html: true, breaks: true, linkify: true });

// Markdown renderer with MathJax support
const searchReactive = reactive<{
  search:string|null,
  searchResult:any[] | Topic[]
}>({
  search: null,
  searchResult: [],
});

// AI search state
const aiSearchMode = ref(false);
const aiAnswer = ref("");
const isLoadingAI = ref(false);
const isLoadingTraditional = ref(false);
const showFeedback = ref(false);
const feedbackGiven = ref(false);
const relatedContent = ref<{
  topics: Array<{ _id: string; name: string; thumbnail?: string; level?: { name: string } | string |any; subject?: { name: string } | string|any }>;
  videos: Array<{ _id: string; name: string; level?: { name: string } |any | string; subject?: { name: string } | string |any }>;
  audio: Array<{ _id: string; name: string; level?: { name: string }|any | string; subject?: { name: string }|any | string }>;
  experiments: Array<{ _id: string; name: string; level?: { name: string }|any | string; subject?: { name: string }|any | string }>;
  suggestions: string;
}>({
  topics: [],
  videos: [],
  audio: [],
  experiments: [],
  suggestions: "",
});

// search anouncement to screen reders
const announcement = ref<string>("");

const handleSearch = async () => {
  if (!searchReactive.search || !searchReactive.search.trim()) return;

  // Always run traditional search first to show results immediately
  await performTraditionalSearch();

  // If AI search mode is enabled, run AI search in parallel (non-blocking)
  if (aiSearchMode.value) {
    // Don't await - let it run in background and add summary when ready
    performAISearch().catch((error) => {
      console.error("[AI Search Frontend] AI search failed:", error);
      // AI search failure doesn't affect traditional results
    });
  } else {
    // Clear AI-related state when AI mode is disabled
    aiAnswer.value = "";
    showFeedback.value = false;
    feedbackGiven.value = false;
    relatedContent.value = {
      topics: [],
      videos: [],
      audio: [],
      experiments: [],
      suggestions: "",
    };
  }
};

// Process math delimiters - extract before markdown, restore after
const processMathInText = (text:string) => {
  if (!text) return "";
  
  // Use a unique placeholder that markdown won't modify
  const mathPlaceholders:any[] = [];
  let counter = 0;
  
  // Extract display math first ($$...$$ or \[...\])
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
    const placeholder = `MATHJAX_DISPLAY_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<div class="mathjax-display my-4">\\[${content.trim()}\\]</div>`
    });
    counter++;
    return placeholder;
  });
  
  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
    const placeholder = `MATHJAX_DISPLAY_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<div class="mathjax-display my-4">\\[${content.trim()}\\]</div>`
    });
    counter++;
    return placeholder;
  });
  
  // Extract inline math ($...$ or \(...\))
  // Process $...$ but avoid matching $$ (already processed)
  text = text.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (match, content) => {
    const placeholder = `MATHJAX_INLINE_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<span class="mathjax-inline">\\(${content.trim()}\\)</span>`
    });
    counter++;
    return placeholder;
  });
  
  text = text.replace(/\\\(([^)]+?)\\\)/g, (match, content) => {
    const placeholder = `MATHJAX_INLINE_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<span class="mathjax-inline">\\(${content.trim()}\\)</span>`
    });
    counter++;
    return placeholder;
  });
  
  // Now render markdown (placeholders will pass through as plain text)
  let rendered = md.render(text);
  
  // Restore math formulas
  mathPlaceholders.forEach(({ placeholder, replacement }) => {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedPlaceholder, 'g');
    rendered = rendered.replace(regex, replacement);
  });
  
  return rendered;
};

// Render AI answer with markdown and MathJax support
const aiAnswerContainer = ref(null);
const renderAIAnswer = (text:string) => {
  if (!text) return "";
  return processMathInText(text);
};

// Render MathJax after AI answer is updated
const renderMathJax = async () => {
  if (import.meta.server) return;
  
  await nextTick();
  
  if (window?.mathJaxLoaded && window.MathJaxRender && aiAnswerContainer.value) {
    try {
      await window.mathJaxLoaded;
      await window.MathJaxRender([aiAnswerContainer.value]);
    } catch (error) {
      console.warn("MathJax rendering failed:", error);
    }
  }
};

// Watch aiAnswer to trigger MathJax rendering
watch(() => aiAnswer.value, () => {
  renderMathJax();
});

const performAISearch = async () => {
  isLoadingAI.value = true;
  // Don't clear search results - they may already be displayed from traditional search
  // Only clear AI-specific state
  aiAnswer.value = "";
  feedbackGiven.value = false;
  showFeedback.value = false;
  // Don't clear relatedContent immediately - will be updated when AI response arrives

  try {
    // Use $fetch for Nuxt server API routes
    
    const data = await $fetch<any>(apiDocs.search.aiSearch, {
      method: "POST",
      body: { query: searchReactive.search && searchReactive.search.trim() },
      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value || ""}`,
      },
    });

    if (data && data.success && data.answer) {
      aiAnswer.value = data.answer;
      showFeedback.value = true;

      // Store related content if available
      if (data.relatedContent) {
        relatedContent.value = {
          topics: data.relatedContent.topics || [],
          videos: data.relatedContent.videos || [],
          audio: data.relatedContent.audio || [],
          experiments: data.relatedContent.experiments || [],
          suggestions: data.relatedContent.suggestions || "",
        };
        console.log("[AI Search Frontend] Related content received:", {
          topics: relatedContent.value.topics.length,
          videos: relatedContent.value.videos.length,
          audio: relatedContent.value.audio.length,
          experiments: relatedContent.value.experiments.length,
        });
      }

      // Update results only if we don't already have traditional results
      // This ensures traditional results (shown first) are not overwritten
      if (data.results && Array.isArray(data.results) && data.results.length > 0) {
        // Only update if we don't have results yet, or if AI found more results
        if (!searchReactive.searchResult || searchReactive.searchResult.length === 0) {
          searchReactive.searchResult = data.results;
          announcement.value = `AI found ${data.resultCount || data.results.length} result${(data.resultCount || data.results.length) > 1 ? "s" : ""} and provided an answer for ${searchReactive.search}.`;
          console.log("[AI Search Frontend] Results set from AI search:", data.results.length, "items");
        } else {
          // Traditional results already shown, just update announcement for AI answer
          announcement.value = `AI provided an answer for ${searchReactive.search}. ${searchReactive.searchResult.length} result${searchReactive.searchResult.length > 1 ? "s" : ""} found.`;
          console.log("[AI Search Frontend] Traditional results already displayed, AI answer added");
        }
      } else {
        // No results from AI search, but traditional search may have already provided results
        if (!searchReactive.searchResult || searchReactive.searchResult.length === 0) {
          // No results at all, try traditional search as fallback
          console.log("[AI Search Frontend] No results from AI search, trying traditional search...");
          performTraditionalSearch().then(() => {
            console.log("[AI Search Frontend] Traditional search completed");
          }).catch(err => {
            console.warn("[AI Search Frontend] Traditional search failed:", err);
          });
        }
        announcement.value = `AI provided an answer for ${searchReactive.search}.`;
      }
    } else if (data && data.error) {
      // Show error message but don't block - traditional results may already be shown
      aiAnswer.value = `Sorry, I encountered an error generating an AI answer: ${data.error}.`;
      showFeedback.value = false;
      // Don't run traditional search here - it should have already run
      console.log("[AI Search Frontend] AI search error, but traditional results may already be displayed");
    } else {
      // No AI answer but traditional search should have already run
      console.log("[AI Search Frontend] No AI answer received, but traditional results should be displayed");
    }
  } catch (error) {
    console.error("[AI Search Frontend] Error:", error);
    // Show user-friendly error but don't block - traditional results may already be shown
    aiAnswer.value = "Sorry, I couldn't process your question right now.";
    showFeedback.value = false;
    // Don't run traditional search here - it should have already run
    console.log("[AI Search Frontend] AI search failed, but traditional results may already be displayed");
  } finally {
    isLoadingAI.value = false;
    // Trigger MathJax rendering after AI answer is set
    await renderMathJax();
  }
};

const performTraditionalSearch = async () => {
  isLoadingTraditional.value = true;
  if(!searchReactive.search) {
    isLoadingTraditional.value = false;
    return;
  }
  const url = userToken.value
    ? `${apiDocs.search.getSearch}?query=${ searchReactive.search.trim()}`
    : `${apiDocs.topics.filterTopics}?name=${searchReactive.search.trim()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
      },
    });
    
    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      searchReactive.searchResult = data;
      announcement.value = `${data.length} result${data.length > 1 ? "s" : ""} found for ${searchReactive.search}.`;
    } else {
      searchReactive.searchResult = [];
      announcement.value = `No results found for ${searchReactive.search}.`;
    }
  } catch (error) {
    console.error("[Traditional Search] Error:", error);
    announcement.value = `Search failed.`;
    searchReactive.searchResult = [];
  } finally {
    isLoadingTraditional.value = false;
  }
};

const handleFeedback = (helpful:boolean) => {
  feedbackGiven.value = true;
  showFeedback.value = false;
  // Could send feedback to analytics endpoint here
  console.log(`User feedback: ${helpful ? "helpful" : "not helpful"} for query: ${searchReactive.search}`);
};

const toggleAISearchMode = () => {
  aiSearchMode.value = !aiSearchMode.value;
  // Clear previous results when switching modes
  searchReactive.searchResult = [];
  aiAnswer.value = "";
  showFeedback.value = false;
  feedbackGiven.value = false;
  relatedContent.value = {
    topics: [],
    videos: [],
    audio: [],
    experiments: [],
    suggestions: "",
  };
};

defineProps({
  appearance: {
    type: String,
    default: "normal",
  },
});

// watch search
const inputSearch = (event:Event) => {
  if(!event.target) return;
  const newVal = (event.target as HTMLInputElement)?.value;

  if (newVal && newVal.trim() !== "") {
    // search();
  } else {
    searchReactive.searchResult = [];
    aiAnswer.value = "";
    showFeedback.value = false;
    relatedContent.value = {
      topics: [],
      videos: [],
      audio: [],
      experiments: [],
      suggestions: "",
    };
  }
};

const mouseOut = () => {
  // Keep results visible on mouse out for better UX
  // searchReactive.searchResult = null;
};
</script>

<template>
  <div :class="[
    ' flex items-center justify-center w-full',
    appearance === 'normal'
      ? 'max-w-md'
      : `md:h-72 h-32 bg-background3 bg-cover bg-center bg-no-repeat rounded-md`,]" tabindex="0"
    :aria-label="appearance === 'normal' ? `Search box` : 'in background of search box, is image of Tanzania instituteof education main building with trees in front'"
    role="region">
    <div :class="[
      ' relative flex items-center justify-center w-full h-full rounded-md',
      appearance === 'normal'
        ? 'md:px-0 lg:px-0'
        : 'bg-textGray bg-opacity-40 md:px-10 lg:px-[100px] p-1',]">

      <!-- Apperance Normal -->
      <template v-if="appearance === 'normal'">
        <div class="flex flex-col w-full gap-2">
          <!-- AI Search Toggle -->
          <div class="flex items-center gap-2 text-sm">
            <button
              type="button"
              @click="toggleAISearchMode"
              :class="[
                'flex items-center gap-2 px-3 py-1 rounded-md transition-colors duration-200',
                aiSearchMode
                  ? 'bg-oceanBlue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
              :aria-label="aiSearchMode ? 'AI search mode enabled, click to disable' : 'AI search mode disabled, click to enable'"
              tabindex="0"
              @keydown.enter="toggleAISearchMode"
            >
              <IconsRobot :size="20" aria-hidden="true" />
              <span class="text-xs">{{ aiSearchMode ? 'AI Mode' : 'Ask Question' }}</span>
            </button>
          </div>

          <form action="" @submit.prevent="handleSearch"
        class="flex w-full h-10 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue"
        role="search" aria-label="Search for compitence">

        <div class="flex items-center w-full">
          <!-- Search Icon -->
          <IconsMagnify aria-label="search icon" class="text-gray-400" :size="24" aria-hidden="true" />

          <!-- Search Input -->
          <label for="search-normal" class="sr-only">Search for compitence</label>
          <input type="text" id="search-normal" @input="inputSearch" v-model="searchReactive.search"
                :placeholder="aiSearchMode ? 'Ask a question...' : 'What do you want to learn?'"
            class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue"
            :aria-expanded="searchReactive.searchResult ? 'true' : 'false'" />
        </div>

        <!-- Search Button -->
        <button type="submit"
              :disabled="isLoadingTraditional || isLoadingAI"
              class="items-center justify-center hidden px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-t-md bg-oceanBlue hover:bg-deepBlue disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleSearch"
              :aria-label="(isLoadingTraditional || isLoadingAI) ? 'Searching...' : 'Search'">
              <IconsLoading v-if="isLoadingTraditional || isLoadingAI" class="animate-spin" :size="20" aria-hidden="true" />
              <span v-else>Search</span>
        </button>
      </form>
        </div>
      </template>

      <!-- Apperance Not Normal -->
      <template v-else>
        <div class="flex flex-col w-full max-w-3xl gap-2">
        <!-- AI Search Toggle -->
        <div class="flex items-center justify-end gap-2 text-sm">
          <button
            type="button"
            @click="toggleAISearchMode"
            :class="[
              'flex items-center gap-2 px-3 py-1 rounded-md transition-colors duration-200',
              aiSearchMode
                ? 'bg-oceanBlue text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            ]"
            :aria-label="aiSearchMode ? 'AI search mode enabled, click to disable' : 'AI search mode disabled, click to enable'"
            tabindex="0"
            @keydown.enter="toggleAISearchMode"
          >
            <Icon name="mdi:robot" size="1rem" aria-hidden="true" />
            <span class="text-xs">{{ aiSearchMode ? 'AI Mode' : 'Ask Question' }}</span>
          </button>
        </div>

        <form action=""
          class="flex items-center w-full max-w-3xl p-2 bg-white rounded-md h-15" @submit.prevent="handleSearch" role="search"
        aria-label="Search for compitence">

        <div class="flex items-center w-full pl-4">
          <!-- Search Icon -->
          <IconsMagnify aria-label="search icon" class="text-gray-400" :size="24" aria-hidden="true" />

          <!-- Search Input -->
          <label for="search-large" class="sr-only">Search for compitence</label>
          <input type="text" id="search-large" @input="inputSearch" v-model="searchReactive.search"
              :placeholder="aiSearchMode ? 'Ask a question...' : 'What do you want to learn?'"
            class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue"
              :aria-expanded="searchReactive.searchResult ? 'true' : 'false'" />
        </div>

        <!-- Search Button -->
        <button type="submit" role="button" aria-label="press to search"
            :disabled="isLoadingTraditional || isLoadingAI"
            class="items-center justify-center hidden h-full px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-r-md bg-oceanBlue hover:bg-deepBlue disabled:opacity-50 disabled:cursor-not-allowed"
            @click="handleSearch">
            <Icon v-if="isLoadingTraditional || isLoadingAI" name="mdi:loading" class="animate-spin" size="1rem" aria-hidden="true" />
            <span v-else>Search</span>
        </button>
      </form>
        </div>
      </template>

      <!-- AI Answer Snippet -->
      <div
        v-if="aiAnswer && searchReactive.search && !isLoadingAI"
        :class="[
          'absolute z-[55] w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md shadow-lg p-4',
          appearance === 'normal'
            ? 'top-16 left-0 max-w-md'
            : 'top-[140px] max-w-3xl',
        ]"
        role="region"
        aria-label="AI generated answer"
        @click.stop.prevent
      >
        <div class="flex items-start gap-3">
          <IconsRobot class="text-oceanBlue flex-shrink-0 mt-1" :size="18" aria-hidden="true" />
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-gray-800 mb-2">AI Answer</h3>
            <div 
              ref="aiAnswerContainer"
              class="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
              v-html="renderAIAnswer(aiAnswer)"
            ></div>
            
            <!-- Feedback Section -->
            <div v-if="showFeedback && !feedbackGiven" class="mt-3 pt-3 border-t border-blue-200">
              <p class="text-xs text-gray-600 mb-2">Did this answer your question?</p>
              <div class="flex gap-2">
                <button
                  @click="handleFeedback(true)"
                  class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  aria-label="Mark answer as helpful"
                  tabindex="0"
                  @keydown.enter="handleFeedback(true)"
                >
                  Yes, helpful
                </button>
                <button
                  @click="handleFeedback(false)"
                  class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  aria-label="Mark answer as not helpful"
                  tabindex="0"
                  @keydown.enter="handleFeedback(false)"
                >
                  Not helpful
                </button>
              </div>
            </div>
            <div v-else-if="feedbackGiven" class="mt-3 pt-3 border-t border-blue-200">
              <p class="text-xs text-green-600">Thank you for your feedback!</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Indicator for Traditional Search -->
      <div
        v-if="isLoadingTraditional && searchReactive.search && !searchReactive.searchResult"
        :class="[
          'absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-md p-4',
          appearance === 'normal'
            ? 'top-16 left-0 max-w-md'
            : 'top-[140px] max-w-3xl',
        ]"
        role="status"
        aria-label="Searching"
      >
        <div class="flex items-center gap-3">
          <IconsLoading name="mdi:loading" class="animate-spin text-oceanBlue" :size="20" aria-hidden="true" />
          <p class="text-sm text-gray-600">Searching...</p>
        </div>
      </div>

      <!-- Loading Indicator for AI Search (only shows when AI is loading and results are already displayed) -->
      <div
        v-if="isLoadingAI && searchReactive.search && searchReactive.searchResult && searchReactive.searchResult.length > 0"
        :class="[
          'absolute z-[54] w-full bg-blue-50 border border-blue-200 rounded-md shadow-md p-3',
          appearance === 'normal'
            ? 'top-16 left-0 max-w-md'
            : 'top-[140px] max-w-3xl',
        ]"
        role="status"
        aria-label="AI is analyzing"
      >
        <div class="flex items-center gap-2">
          <IconsLoading name="mdi:loading" class="animate-spin text-oceanBlue" :size="20" aria-hidden="true" />
          <p class="text-xs text-gray-600">AI is analyzing your search...</p>
        </div>
      </div>

      <!-- Result Search with NO userToken -->
      <div
        v-if="searchReactive.searchResult && searchReactive.search && !userToken"
        :class="[
          'absolute z-[60] w-full bg-white shadow-md rounded-md max-h-[400px] overflow-y-auto',
        appearance === 'normal'
            ? aiAnswer ? 'top-[200px] left-0 max-w-md' : 'top-10 left-0 max-w-md'
            : aiAnswer ? 'top-[280px] max-w-3xl px-1' : 'top-[96px] max-w-3xl px-1',
        ]"
        role="list"
        :aria-label="`Search ${searchReactive.searchResult?.length} results`"
        aria-live="polite"
        style="pointer-events: auto !important;"
      >
        <div
          v-for="result in searchReactive.searchResult"
          :key="result._id || result.id"
          style="pointer-events: auto;"
        >
          <TopicCard
            model-type="search"
            :topic-id="result._id || result.id"
            :topic-title="result.name || result.title"
            :topic-image="result.thumbnail || result.image || '/images/background2.webp'"
            :topic-standard="result.standard || result.level?.name || result.level || 'Form 1'"
            :topic-subject="result.subject?.name || result.subject || 'N/A'"
            :topic-description="result.descriptions || result.description || ''"
            :topic-level="result.level?.name || result.level || 'Form 1'"
            :topic-likes="0"
            :topic-views="result?.viewedBy?.length ? result.viewedBy.length : 0"
            topic-duration="0"
            :aria-label="`Among the topics from search result,${result.name || result.title} press to learn`"
          />
        </div>
      </div>

      <!-- Result Search with userToken -->
      <div
        v-else-if="searchReactive.searchResult && searchReactive.search && userToken"
        :class="[
          'absolute z-[60] w-full bg-white shadow-md rounded-md max-h-[400px] overflow-y-auto',
          appearance === 'normal'
            ? aiAnswer ? 'top-[200px] left-0 max-w-md' : 'top-10 left-0 max-w-md'
            : aiAnswer ? 'top-[280px] max-w-3xl px-1' : 'top-[180px] max-w-3xl px-1',
        ]"
        role="list"
        :aria-label="`Search ${searchReactive.searchResult?.length} results`"
        aria-live="polite"
        style="pointer-events: auto !important;"
      >
        <div
          v-for="result in searchReactive.searchResult"
          :key="result._id || result.id"
          style="pointer-events: auto;"
        >
          <SearchResults
            role="option"
            :id="result._id || result.id"
            :title="result.name || result.title"
            :thumbnail="result.thumbnail || result.image"
            :level="result?.level?.name || result?.level || 'Form 1'"
            :subject="result?.subject?.name || result?.subject || 'N/A'"
            :type="result?.type || 'topic'"
          />
        </div>
      </div>

      <!-- Related Content Section -->
      <div
        v-if="relatedContent.topics.length > 0 || relatedContent.suggestions || relatedContent.videos.length > 0 || relatedContent.audio.length > 0 || relatedContent.experiments.length > 0"
        :class="[
          'absolute z-[45] w-full bg-white border border-gray-200 rounded-md shadow-lg p-4 pointer-events-auto',
        appearance === 'normal'
            ? (searchReactive.searchResult && searchReactive.searchResult.length > 0)
              ? (aiAnswer ? 'top-[600px] left-0 max-w-md' : 'top-[410px] left-0 max-w-md')
              : (aiAnswer ? 'top-[200px] left-0 max-w-md' : 'top-10 left-0 max-w-md')
            : (searchReactive.searchResult && searchReactive.searchResult.length > 0)
              ? (aiAnswer ? 'top-[680px] max-w-3xl px-1' : 'top-[490px] max-w-3xl px-1')
              : (aiAnswer ? 'top-[280px] max-w-3xl px-1' : 'top-[96px] max-w-3xl px-1'),
        ]"
        role="region"
        aria-label="Related educational content"
        @click.stop
      >
        <h3 class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <IconsLightbulbOn class="text-yellow-500" :size="20" aria-hidden="true" />
          Related Content
        </h3>

        <!-- AI Suggestions -->
        <div v-if="relatedContent.suggestions" class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
          <p class="text-xs font-medium text-blue-800 mb-1">AI Suggestions:</p>
          <p class="text-sm text-gray-700">{{ relatedContent.suggestions }}</p>
        </div>

        <!-- Related Topics -->
        <div v-if="relatedContent.topics.length > 0" class="mb-4">
          <h4 class="text-xs font-semibold text-gray-700 mb-2">Related Topics</h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="topic in relatedContent.topics.slice(0, 5)"
              :key="topic._id"
              :to="`/interactive/${topic.level?.name || topic.level || 'Form 1'}/${topic.subject?.name || topic.subject || 'N/A'}/${topic.name}/${topic._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`Go to related topic: ${topic.name}`"
            >
              <div class="flex-shrink-0 w-12 h-12 overflow-hidden rounded-md">
                <NuxtImg
                  :src="topic.thumbnail || '/images/background2.webp'"
                  :alt="topic.name"
                  class="object-cover w-full h-full"
                  loading="lazy"
                />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ topic?.name || (topic as any).title }}</p>
                <p class="text-xs text-gray-500">
                  {{ topic.subject?.name || topic.subject || 'N/A' }} - {{ topic.level?.name || topic.level || 'Form 1' }}
                </p>
              </div>
              <IconsChevronRight class="text-gray-400 flex-shrink-0" :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <!-- Related Videos -->
        <div v-if="relatedContent.videos.length > 0" class="mb-4">
          <h4 class="text-xs font-semibold text-gray-700 mb-2">Related Videos</h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="video in relatedContent.videos.slice(0, 3)"
              :key="video._id"
              :to="`/video/${video.level?.name || video.level || 'Form 1'}/${video.subject?.name || video.subject || 'N/A'}/${video.name}/${video._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`Go to related video: ${video.name}`"
            >
              <Icon name="fluent:video-24-filled" class="text-red-500 flex-shrink-0" size="1.5rem" aria-hidden="true" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ video.name || (video as any).title }}</p>
                <p class="text-xs text-gray-500">
                  {{ video.subject?.name || video.subject || 'N/A' }}
                </p>
              </div>
              <IconsChevronRight class="text-gray-400 flex-shrink-0" :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <!-- Related Audio -->
        <div v-if="relatedContent.audio.length > 0" class="mb-4">
          <h4 class="text-xs font-semibold text-gray-700 mb-2">Related Audio</h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="audioItem in relatedContent.audio.slice(0, 3)"
              :key="audioItem._id"
              :to="`/audio/${audioItem.level?.name || audioItem.level || 'Form 1'}/${audioItem.subject?.name || audioItem.subject || 'N/A'}/${audioItem.name}/${audioItem._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`Go to related audio: ${audioItem.name}`"
            >
              <Icon name="famicons:headset-sharp" class="text-purple-500 flex-shrink-0" size="1.5rem" aria-hidden="true" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ audioItem.name || (audioItem as any).title }}</p>
                <p class="text-xs text-gray-500">
                  {{ audioItem.subject?.name || audioItem.subject || 'N/A' }}
                </p>
              </div>
              <IconsChevronRight class="text-gray-400 flex-shrink-0" :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>

        <!-- Related Experiments -->
        <div v-if="relatedContent.experiments.length > 0" class="mb-4">
          <h4 class="text-xs font-semibold text-gray-700 mb-2">Related Experiments</h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="experiment in relatedContent.experiments.slice(0, 3)"
              :key="experiment._id"
              :to="`/experiments/${experiment.level?.name || experiment.level || 'Form 1'}/${experiment.subject?.name || experiment.subject || 'N/A'}/${experiment.name}/${experiment._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`Go to related experiment: ${experiment.name}`"
            >
              <Icon name="icon-park-solid:experiment-one" class="text-green-500 flex-shrink-0" size="1.5rem" aria-hidden="true" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">{{ experiment.name || (experiment as any).title }}</p>
                <p class="text-xs text-gray-500">
                  {{ experiment.subject?.name || experiment.subject || 'N/A' }}
                </p>
              </div>
              <IconsChevronRight class="text-gray-400 flex-shrink-0" :size="16" aria-hidden="true" />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- screen reader notifier -->
      <div class="sr-only" aria-live="polite" role="status">
        {{ announcement }}
      </div>

    </div>
  </div>
</template>
