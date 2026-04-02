<script setup lang="ts">
import axios from "axios";
import MarkdownIt from "markdown-it";
import { computed, ref, reactive, watch, nextTick } from "vue";
import TopicCard from "./TopicCard.vue";
import apiDocs from "~/utilities/apiDocs";
import SearchResults from "./SearchResults.vue";
import type { Topic } from "~/types/topic.interface";
import type { LanguageSupport } from "~/types/language.interface";
import { normalizeEducationLevel } from "~/utilities/educationRoute";

declare global {
  interface Window {
    mathJaxLoaded?: Promise<void>;
    MathJaxRender?: (elements: HTMLElement[]) => Promise<void>;
  }
}

const userToken = useCookie("signInUserToken");

const props = withDefaults(
  defineProps<{
    appearance?: string;
    educationLevel?: string;
    language?: LanguageSupport;
  }>(),
  {
    appearance: "normal",
    language: "english",
  },
);

const normalizeValue = (value?: string | null) =>
  value?.trim().toLowerCase() ?? "";

const getEducationBucket = (value?: string | null) => {
  const normalizedValue = normalizeValue(value);
  return normalizedValue ? normalizeEducationLevel(normalizedValue) : "";
};

const localizedContent = computed(() =>
  props.language === "kiswahili"
    ? {
        searchBoxLabel: "Kisanduku cha utafutaji",
        searchBackgroundLabel:
          "Nyuma ya kisanduku cha utafutaji kuna picha ya jengo kuu la Taasisi ya Elimu Tanzania lenye miti mbele",
        searchLabel: "Tafuta maudhui ya kujifunzia",
        askQuestion: "Uliza swali",
        aiMode: "Mtindo wa AI",
        searchPlaceholder: "Unataka kujifunza nini?",
        aiPlaceholder: "Uliza swali...",
        searchButton: "Tafuta",
        searching: "Inatafuta...",
        aiAnalyzing: "AI inachambua utafutaji wako...",
        aiAnswer: "Jibu la AI",
        didAnswerHelp: "Je, jibu hili limekusaidia?",
        helpful: "Ndiyo, limenisaidia",
        notHelpful: "Halijasaidia",
        thanksForFeedback: "Asante kwa mrejesho wako!",
        relatedContent: "Maudhui Yanayohusiana",
        aiSuggestions: "Mapendekezo ya AI:",
        relatedTopics: "Mada Zinazohusiana",
        relatedVideos: "Video Zinazohusiana",
        relatedAudio: "Sauti Zinazohusiana",
        relatedExperiments: "Majaribio Yanayohusiana",
        noResults: "Hakuna matokeo yaliyopatikana kwa",
        searchFailed: "Utafutaji umeshindikana.",
        aiFailed: "Samahani, sikuweza kushughulikia swali lako kwa sasa.",
        aiErrorPrefix:
          "Samahani, hitilafu imetokea wakati wa kutengeneza jibu la AI:",
        goToRelatedTopic: "Fungua mada inayohusiana:",
        goToRelatedVideo: "Fungua video inayohusiana:",
        goToRelatedAudio: "Fungua sauti inayohusiana:",
        goToRelatedExperiment: "Fungua jaribio linalohusiana:",
        searchResultsLabel: "Matokeo ya utafutaji",
        topicLearnLabel: "Miongoni mwa matokeo ya utafutaji, bonyeza kujifunza",
        notAvailable: "Hakipatikani",
        markHelpful: "Weka alama kuwa jibu limefaa",
        markNotHelpful: "Weka alama kuwa jibu halijafaa",
        pressToSearch: "Bonyeza kutafuta",
        defaultLevel:
          getEducationBucket(props.educationLevel) === "primary"
            ? "Darasa la 1"
            : "Form 1",
      }
    : {
        searchBoxLabel: "Search box",
        searchBackgroundLabel:
          "in background of search box, is image of Tanzania instituteof education main building with trees in front",
        searchLabel: "Search for competence",
        askQuestion: "Ask Question",
        aiMode: "AI Mode",
        searchPlaceholder: "What do you want to learn?",
        aiPlaceholder: "Ask a question...",
        searchButton: "Search",
        searching: "Searching...",
        aiAnalyzing: "AI is analyzing your search...",
        aiAnswer: "AI Answer",
        didAnswerHelp: "Did this answer your question?",
        helpful: "Yes, helpful",
        notHelpful: "Not helpful",
        thanksForFeedback: "Thank you for your feedback!",
        relatedContent: "Related Content",
        aiSuggestions: "AI Suggestions:",
        relatedTopics: "Related Topics",
        relatedVideos: "Related Videos",
        relatedAudio: "Related Audio",
        relatedExperiments: "Related Experiments",
        noResults: "No results found for",
        searchFailed: "Search failed.",
        aiFailed: "Sorry, I couldn't process your question right now.",
        aiErrorPrefix: "Sorry, I encountered an error generating an AI answer:",
        goToRelatedTopic: "Go to related topic:",
        goToRelatedVideo: "Go to related video:",
        goToRelatedAudio: "Go to related audio:",
        goToRelatedExperiment: "Go to related experiment:",
        searchResultsLabel: "Search",
        topicLearnLabel: "Among the topics from search result, press to learn",
        notAvailable: "N/A",
        markHelpful: "Mark answer as helpful",
        markNotHelpful: "Mark answer as not helpful",
        pressToSearch: "Press to search",
        defaultLevel: "Form 1",
      },
);

const formatTraditionalAnnouncement = (count: number, searchTerm: string) =>
  props.language === "kiswahili"
    ? `${count} matokeo yamepatikana kwa ${searchTerm}.`
    : `${count} result${count > 1 ? "s" : ""} found for ${searchTerm}.`;

const formatAiFoundAnnouncement = (count: number, searchTerm: string) =>
  props.language === "kiswahili"
    ? `AI imepata matokeo ${count} na kutoa jibu kwa ${searchTerm}.`
    : `AI found ${count} result${count > 1 ? "s" : ""} and provided an answer for ${searchTerm}.`;

const formatAiAnswerAnnouncement = (
  searchTerm: string,
  resultCount?: number,
) =>
  props.language === "kiswahili"
    ? resultCount && resultCount > 0
      ? `AI imetoa jibu kwa ${searchTerm}. ${resultCount} matokeo yamepatikana.`
      : `AI imetoa jibu kwa ${searchTerm}.`
    : resultCount && resultCount > 0
      ? `AI provided an answer for ${searchTerm}. ${resultCount} result${resultCount > 1 ? "s" : ""} found.`
      : `AI provided an answer for ${searchTerm}.`;

// Markdown renderer with MathJax support
const md = new MarkdownIt({ html: true, breaks: true, linkify: true });

// Markdown renderer with MathJax support
const searchReactive = reactive<{
  search: string | null;
  searchResult: any[] | Topic[];
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
  topics: Array<{
    _id: string;
    name: string;
    thumbnail?: string;
    level?: { name: string } | string | any;
    subject?: { name: string } | string | any;
  }>;
  videos: Array<{
    _id: string;
    name: string;
    level?: { name: string } | any | string;
    subject?: { name: string } | string | any;
  }>;
  audio: Array<{
    _id: string;
    name: string;
    level?: { name: string } | any | string;
    subject?: { name: string } | any | string;
  }>;
  experiments: Array<{
    _id: string;
    name: string;
    level?: { name: string } | any | string;
    subject?: { name: string } | any | string;
  }>;
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
const processMathInText = (text: string) => {
  if (!text) return "";

  // Use a unique placeholder that markdown won't modify
  const mathPlaceholders: any[] = [];
  let counter = 0;

  // Extract display math first ($$...$$ or \[...\])
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (match, content) => {
    const placeholder = `MATHJAX_DISPLAY_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<div class="mathjax-display my-4">\\[${content.trim()}\\]</div>`,
    });
    counter++;
    return placeholder;
  });

  text = text.replace(/\\\[([\s\S]*?)\\\]/g, (match, content) => {
    const placeholder = `MATHJAX_DISPLAY_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<div class="mathjax-display my-4">\\[${content.trim()}\\]</div>`,
    });
    counter++;
    return placeholder;
  });

  // Extract inline math ($...$ or \(...\))
  // Process $...$ but avoid matching $$ (already processed)
  text = text.replace(
    /(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g,
    (match, content) => {
      const placeholder = `MATHJAX_INLINE_PLACEHOLDER_${counter}_END`;
      mathPlaceholders.push({
        placeholder,
        replacement: `<span class="mathjax-inline">\\(${content.trim()}\\)</span>`,
      });
      counter++;
      return placeholder;
    },
  );

  text = text.replace(/\\\(([^)]+?)\\\)/g, (match, content) => {
    const placeholder = `MATHJAX_INLINE_PLACEHOLDER_${counter}_END`;
    mathPlaceholders.push({
      placeholder,
      replacement: `<span class="mathjax-inline">\\(${content.trim()}\\)</span>`,
    });
    counter++;
    return placeholder;
  });

  // Now render markdown (placeholders will pass through as plain text)
  let rendered = md.render(text);

  // Restore math formulas
  mathPlaceholders.forEach(({ placeholder, replacement }) => {
    // Escape special regex characters in placeholder
    const escapedPlaceholder = placeholder.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&",
    );
    const regex = new RegExp(escapedPlaceholder, "g");
    rendered = rendered.replace(regex, replacement);
  });

  return rendered;
};

// Render AI answer with markdown and MathJax support
const aiAnswerContainer = ref(null);
const renderAIAnswer = (text: string) => {
  if (!text) return "";
  return processMathInText(text);
};

// Render MathJax after AI answer is updated
const renderMathJax = async () => {
  if (import.meta.server) return;

  await nextTick();

  if (
    window?.mathJaxLoaded &&
    window.MathJaxRender &&
    aiAnswerContainer.value
  ) {
    try {
      await window.mathJaxLoaded;
      await window.MathJaxRender([aiAnswerContainer.value]);
    } catch (error) {
      console.warn("MathJax rendering failed:", error);
    }
  }
};

// Watch aiAnswer to trigger MathJax rendering
watch(
  () => aiAnswer.value,
  () => {
    renderMathJax();
  },
);

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
      }

      // Update results only if we don't already have traditional results
      // This ensures traditional results (shown first) are not overwritten
      if (
        data.results &&
        Array.isArray(data.results) &&
        data.results.length > 0
      ) {
        // Only update if we don't have results yet, or if AI found more results
        if (
          !searchReactive.searchResult ||
          searchReactive.searchResult.length === 0
        ) {
          searchReactive.searchResult = data.results;
          announcement.value = formatAiFoundAnnouncement(
            data.resultCount || data.results.length,
            searchReactive.search as string,
          );
        } else {
          // Traditional results already shown, just update announcement for AI answer
          announcement.value = formatAiAnswerAnnouncement(
            searchReactive.search as string,
            searchReactive.searchResult.length,
          );
        }
      } else {
        // No results from AI search, but traditional search may have already provided results
        if (
          !searchReactive.searchResult ||
          searchReactive.searchResult.length === 0
        ) {
          performTraditionalSearch().catch((err) => {
            console.error(
              "[AI Search Frontend] Traditional search failed:",
              err,
            );
          });
        }
        announcement.value = formatAiAnswerAnnouncement(
          searchReactive.search as string,
        );
      }
    } else if (data && data.error) {
      // Show error message but don't block - traditional results may already be shown
      aiAnswer.value = `${localizedContent.value.aiErrorPrefix} ${data.error}.`;
      showFeedback.value = false;
    }
  } catch (error) {
    console.error("[AI Search Frontend] Error:", error);
    // Show user-friendly error but don't block - traditional results may already be shown
    aiAnswer.value = localizedContent.value.aiFailed;
    showFeedback.value = false;
  } finally {
    isLoadingAI.value = false;
    // Trigger MathJax rendering after AI answer is set
    await renderMathJax();
  }
};

const performTraditionalSearch = async () => {
  isLoadingTraditional.value = true;
  if (!searchReactive.search) {
    isLoadingTraditional.value = false;
    return;
  }
  const searchQuery = encodeURIComponent(searchReactive.search.trim());
  const educationFilter = getEducationBucket(props.educationLevel);
  const publicSearchParams = new URLSearchParams({
    name: searchReactive.search.trim(),
  });

  if (educationFilter) {
    publicSearchParams.set("educationLevel", educationFilter);
  }

  const url = userToken.value
    ? `${apiDocs.search.getSearch}?query=${searchQuery}${educationFilter ? `&educationLevel=${encodeURIComponent(educationFilter)}` : ""}`
    : `${apiDocs.topics.filterTopics}?${publicSearchParams.toString()}`;

  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
      },
    });

    const data = response.data;
    if (Array.isArray(data) && data.length > 0) {
      searchReactive.searchResult = data;
      announcement.value = formatTraditionalAnnouncement(
        data.length,
        searchReactive.search,
      );
    } else {
      searchReactive.searchResult = [];
      announcement.value = `${localizedContent.value.noResults} ${searchReactive.search}.`;
    }
  } catch (error) {
    console.error("[Traditional Search] Error:", error);
    announcement.value = localizedContent.value.searchFailed;
    searchReactive.searchResult = [];
  } finally {
    isLoadingTraditional.value = false;
  }
};

const handleFeedback = (helpful: boolean) => {
  feedbackGiven.value = true;
  showFeedback.value = false;
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

// watch search
const inputSearch = (event: Event) => {
  if (!event.target) return;
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
  <div
    :class="[
      ' flex items-center justify-center w-full',
      props.appearance === 'normal'
        ? 'max-w-md'
        : `md:h-72 h-32 bg-background3 bg-cover bg-center bg-no-repeat rounded-md`,
    ]"
    tabindex="0"
    :aria-label="
      props.appearance === 'normal'
        ? localizedContent.searchBoxLabel
        : localizedContent.searchBackgroundLabel
    "
    role="region"
  >
    <div
      :class="[
        ' relative flex items-center justify-center w-full h-full rounded-md',
        props.appearance === 'normal'
          ? 'md:px-0 lg:px-0'
          : 'bg-textGray bg-opacity-40 md:px-10 lg:px-[100px] p-1',
      ]"
    >
      <!-- Apperance Normal -->
      <template v-if="props.appearance === 'normal'">
        <div class="flex flex-col w-full gap-2">
          <!-- AI Search Toggle -->
          <!-- <div class="flex items-center gap-2 text-sm">
            <button
              type="button"
              @click="toggleAISearchMode"
              :class="[
                'flex items-center gap-2 px-3 py-1 rounded-md transition-colors duration-200',
              aiSearchMode
                  ? 'bg-oceanBlue text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
              :aria-label="aiSearchMode ? localizedContent.aiMode : localizedContent.askQuestion"
              tabindex="0"
              @keydown.enter="toggleAISearchMode"
            >
              <IconsRobot :size="20" aria-hidden="true" />
              <span class="text-xs">{{ aiSearchMode ? localizedContent.aiMode : localizedContent.askQuestion }}</span>
            </button>
          </div> -->

          <form
            action=""
            @submit.prevent="handleSearch"
            class="flex w-full h-10 border-b border-gray-300 focus:outline-none focus:ring-0 focus:border-oceanBlue"
            role="search"
            :aria-label="localizedContent.searchLabel"
          >
            <div class="flex items-center w-full">
              <!-- Search Icon -->
              <IconsMagnify
                aria-label="search icon"
                class="text-gray-400"
                :size="24"
                aria-hidden="true"
              />

              <!-- Search Input -->
              <label
                for="search-normal"
                class="sr-only"
                >{{ localizedContent.searchLabel }}</label
              >
              <input
                type="text"
                id="search-normal"
                @input="inputSearch"
                v-model="searchReactive.search"
                :placeholder="
                  aiSearchMode
                    ? localizedContent.aiPlaceholder
                    : localizedContent.searchPlaceholder
                "
                class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue"
                :aria-expanded="searchReactive.searchResult ? 'true' : 'false'"
              />
            </div>

            <!-- Search Button -->
            <button
              type="submit"
              :disabled="isLoadingTraditional || isLoadingAI"
              class="items-center justify-center hidden px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-t-md bg-oceanBlue hover:bg-deepBlue disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleSearch"
              :aria-label="
                isLoadingTraditional || isLoadingAI
                  ? localizedContent.searching
                  : localizedContent.searchButton
              "
            >
              <IconsLoading
                v-if="isLoadingTraditional || isLoadingAI"
                class="animate-spin"
                :size="20"
                aria-hidden="true"
              />
              <span v-else>{{ localizedContent.searchButton }}</span>
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
                  : 'bg-white text-gray-700 hover:bg-gray-100',
              ]"
              :aria-label="
                aiSearchMode
                  ? localizedContent.aiMode
                  : localizedContent.askQuestion
              "
              tabindex="0"
              @keydown.enter="toggleAISearchMode"
            >
              <Icon
                name="mdi:robot"
                size="1rem"
                aria-hidden="true"
              />
              <span class="text-xs">{{
                aiSearchMode
                  ? localizedContent.aiMode
                  : localizedContent.askQuestion
              }}</span>
            </button>
          </div>

          <form
            action=""
            class="flex items-center w-full max-w-3xl p-2 bg-white rounded-md h-15"
            @submit.prevent="handleSearch"
            role="search"
            :aria-label="localizedContent.searchLabel"
          >
            <div class="flex items-center w-full pl-4">
              <!-- Search Icon -->
              <IconsMagnify
                aria-label="search icon"
                class="text-gray-400"
                :size="24"
                aria-hidden="true"
              />

              <!-- Search Input -->
              <label
                for="search-large"
                class="sr-only"
                >{{ localizedContent.searchLabel }}</label
              >
              <input
                type="text"
                id="search-large"
                @input="inputSearch"
                v-model="searchReactive.search"
                :placeholder="
                  aiSearchMode
                    ? localizedContent.aiPlaceholder
                    : localizedContent.searchPlaceholder
                "
                class="flex flex-1 h-full px-2 focus:outline-none focus:ring-0 focus:border-oceanBlue"
                :aria-expanded="searchReactive.searchResult ? 'true' : 'false'"
              />
            </div>

            <!-- Search Button -->
            <button
              type="submit"
              role="button"
              :aria-label="localizedContent.pressToSearch"
              :disabled="isLoadingTraditional || isLoadingAI"
              class="items-center justify-center hidden h-full px-4 py-2 overflow-hidden text-white transition-colors duration-500 ease-in-out rounded-b-none cursor-pointer md:flex rounded-r-md bg-oceanBlue hover:bg-deepBlue disabled:opacity-50 disabled:cursor-not-allowed"
              @click="handleSearch"
            >
              <Icon
                v-if="isLoadingTraditional || isLoadingAI"
                name="mdi:loading"
                class="animate-spin"
                size="1rem"
                aria-hidden="true"
              />
              <span v-else>{{ localizedContent.searchButton }}</span>
            </button>
          </form>
        </div>
      </template>

      <!-- AI Answer Snippet -->
      <div
        v-if="aiAnswer && searchReactive.search && !isLoadingAI"
        :class="[
          'absolute z-[55] w-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-md shadow-lg p-4',
          props.appearance === 'normal'
            ? 'top-16 left-0 max-w-md'
            : 'top-[140px] max-w-3xl',
        ]"
        role="region"
        :aria-label="localizedContent.aiAnswer"
        @click.stop.prevent
      >
        <div class="flex items-start gap-3">
          <IconsRobot
            class="text-oceanBlue flex-shrink-0 mt-1"
            :size="18"
            aria-hidden="true"
          />
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-gray-800 mb-2">
              {{ localizedContent.aiAnswer }}
            </h3>
            <div
              ref="aiAnswerContainer"
              class="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none"
              v-html="renderAIAnswer(aiAnswer)"
            ></div>

            <!-- Feedback Section -->
            <div
              v-if="showFeedback && !feedbackGiven"
              class="mt-3 pt-3 border-t border-blue-200"
            >
              <p class="text-xs text-gray-600 mb-2">
                {{ localizedContent.didAnswerHelp }}
              </p>
              <div class="flex gap-2">
                <button
                  @click="handleFeedback(true)"
                  class="px-3 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                  :aria-label="localizedContent.markHelpful"
                  tabindex="0"
                  @keydown.enter="handleFeedback(true)"
                >
                  {{ localizedContent.helpful }}
                </button>
                <button
                  @click="handleFeedback(false)"
                  class="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
                  :aria-label="localizedContent.markNotHelpful"
                  tabindex="0"
                  @keydown.enter="handleFeedback(false)"
                >
                  {{ localizedContent.notHelpful }}
                </button>
              </div>
            </div>
            <div
              v-else-if="feedbackGiven"
              class="mt-3 pt-3 border-t border-blue-200"
            >
              <p class="text-xs text-green-600">
                {{ localizedContent.thanksForFeedback }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading Indicator for Traditional Search -->
      <div
        v-if="
          isLoadingTraditional &&
          searchReactive.search &&
          !searchReactive.searchResult
        "
        :class="[
          'absolute z-50 w-full bg-white border border-gray-200 rounded-md shadow-md p-4',
          props.appearance === 'normal'
            ? 'top-16 left-0 max-w-md'
            : 'top-[140px] max-w-3xl',
        ]"
        role="status"
        :aria-label="localizedContent.searching"
      >
        <div class="flex items-center gap-3">
          <IconsLoading
            name="mdi:loading"
            class="animate-spin text-oceanBlue"
            :size="20"
            aria-hidden="true"
          />
          <p class="text-sm text-gray-600">{{ localizedContent.searching }}</p>
        </div>
      </div>

      <!-- Loading Indicator for AI Search (only shows when AI is loading and results are already displayed) -->
      <div
        v-if="
          isLoadingAI &&
          searchReactive.search &&
          searchReactive.searchResult &&
          searchReactive.searchResult.length > 0
        "
        :class="[
          'absolute z-[54] w-full bg-blue-50 border border-blue-200 rounded-md shadow-md p-3',
          props.appearance === 'normal'
            ? 'top-16 left-0 max-w-md'
            : 'top-[140px] max-w-3xl',
        ]"
        role="status"
        :aria-label="localizedContent.aiAnalyzing"
      >
        <div class="flex items-center gap-2">
          <IconsLoading
            name="mdi:loading"
            class="animate-spin text-oceanBlue"
            :size="20"
            aria-hidden="true"
          />
          <p class="text-xs text-gray-600">
            {{ localizedContent.aiAnalyzing }}
          </p>
        </div>
      </div>

      <!-- Result Search with NO userToken -->
      <div
        v-if="
          searchReactive.searchResult && searchReactive.search && !userToken
        "
        :class="[
          'absolute z-[60] w-full bg-white shadow-md rounded-md max-h-[400px] overflow-y-auto',
          props.appearance === 'normal'
            ? aiAnswer
              ? 'top-[200px] left-0 max-w-md'
              : 'top-10 left-0 max-w-md'
            : aiAnswer
              ? 'top-[280px] max-w-3xl px-1'
              : 'top-[96px] max-w-3xl px-1',
        ]"
        role="list"
        :aria-label="`${localizedContent.searchResultsLabel} ${searchReactive.searchResult?.length} results`"
        aria-live="polite"
        style="pointer-events: auto !important"
      >
        <div
          v-for="result in searchReactive.searchResult"
          :key="result._id || result.id"
          style="pointer-events: auto"
        >
          <TopicCard
            model-type="search"
            :topic-id="result._id || result.id"
            :topic-title="result.name || result.title"
            :topic-image="
              result.thumbnail || result.image || '/images/background2.webp'
            "
            :topic-standard="
              result.standard ||
              result.level?.name ||
              result.level ||
              localizedContent.defaultLevel
            "
            :topic-subject="
              result.subject?.name ||
              result.subject ||
              localizedContent.notAvailable
            "
            :topic-description="result.descriptions || result.description || ''"
            :topic-level="
              result.level?.name ||
              result.level ||
              localizedContent.defaultLevel
            "
            :topic-likes="0"
            :topic-views="result?.viewedBy?.length ? result.viewedBy.length : 0"
            topic-duration="0"
            :aria-label="`${localizedContent.topicLearnLabel} ${result.name || result.title}`"
          />
        </div>
      </div>

      <!-- Result Search with userToken -->
      <div
        v-else-if="
          searchReactive.searchResult && searchReactive.search && userToken
        "
        :class="[
          'absolute z-[60] w-full bg-white shadow-md rounded-md max-h-[400px] overflow-y-auto',
          props.appearance === 'normal'
            ? aiAnswer
              ? 'top-[200px] left-0 max-w-md'
              : 'top-10 left-0 max-w-md'
            : aiAnswer
              ? 'top-[280px] max-w-3xl px-1'
              : 'top-[180px] max-w-3xl px-1',
        ]"
        role="list"
        :aria-label="`${localizedContent.searchResultsLabel} ${searchReactive.searchResult?.length} results`"
        aria-live="polite"
        style="pointer-events: auto !important"
      >
        <div
          v-for="result in searchReactive.searchResult"
          :key="result._id || result.id"
          style="pointer-events: auto"
        >
          <SearchResults
            role="option"
            :id="result._id || result.id"
            :title="result.name || result.title"
            :thumbnail="result.thumbnail || result.image"
            :level="
              result?.level?.name ||
              result?.level ||
              localizedContent.defaultLevel
            "
            :subject="
              result?.subject?.name ||
              result?.subject ||
              localizedContent.notAvailable
            "
            :type="result?.type || 'topic'"
          />
        </div>
      </div>

      <!-- Related Content Section -->
      <div
        v-if="
          relatedContent.topics.length > 0 ||
          relatedContent.suggestions ||
          relatedContent.videos.length > 0 ||
          relatedContent.audio.length > 0 ||
          relatedContent.experiments.length > 0
        "
        :class="[
          'absolute z-[45] w-full bg-white border border-gray-200 rounded-md shadow-lg p-4 pointer-events-auto',
          props.appearance === 'normal'
            ? searchReactive.searchResult &&
              searchReactive.searchResult.length > 0
              ? aiAnswer
                ? 'top-[600px] left-0 max-w-md'
                : 'top-[410px] left-0 max-w-md'
              : aiAnswer
                ? 'top-[200px] left-0 max-w-md'
                : 'top-10 left-0 max-w-md'
            : searchReactive.searchResult &&
                searchReactive.searchResult.length > 0
              ? aiAnswer
                ? 'top-[680px] max-w-3xl px-1'
                : 'top-[490px] max-w-3xl px-1'
              : aiAnswer
                ? 'top-[280px] max-w-3xl px-1'
                : 'top-[96px] max-w-3xl px-1',
        ]"
        role="region"
        :aria-label="localizedContent.relatedContent"
        @click.stop
      >
        <h3
          class="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2"
        >
          <IconsLightbulbOn
            class="text-yellow-500"
            :size="20"
            aria-hidden="true"
          />
          {{ localizedContent.relatedContent }}
        </h3>

        <!-- AI Suggestions -->
        <div
          v-if="relatedContent.suggestions"
          class="mb-4 p-3 bg-blue-50 border-l-4 border-blue-400 rounded"
        >
          <p class="text-xs font-medium text-blue-800 mb-1">
            {{ localizedContent.aiSuggestions }}
          </p>
          <p class="text-sm text-gray-700">{{ relatedContent.suggestions }}</p>
        </div>

        <!-- Related Topics -->
        <div
          v-if="relatedContent.topics.length > 0"
          class="mb-4"
        >
          <h4 class="text-xs font-semibold text-gray-700 mb-2">
            {{ localizedContent.relatedTopics }}
          </h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="topic in relatedContent.topics.slice(0, 5)"
              :key="topic._id"
              :to="`/interactive/${topic.level?.name || topic.level || localizedContent.defaultLevel}/${topic.subject?.name || topic.subject || localizedContent.notAvailable}/${topic.name}/${topic._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`${localizedContent.goToRelatedTopic} ${topic.name}`"
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
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ topic?.name || (topic as any).title }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    topic.subject?.name ||
                    topic.subject ||
                    localizedContent.notAvailable
                  }}
                  -
                  {{
                    topic.level?.name ||
                    topic.level ||
                    localizedContent.defaultLevel
                  }}
                </p>
              </div>
              <IconsChevronRight
                class="text-gray-400 flex-shrink-0"
                :size="16"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </div>

        <!-- Related Videos -->
        <div
          v-if="relatedContent.videos.length > 0"
          class="mb-4"
        >
          <h4 class="text-xs font-semibold text-gray-700 mb-2">
            {{ localizedContent.relatedVideos }}
          </h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="video in relatedContent.videos.slice(0, 3)"
              :key="video._id"
              :to="`/video/${video.level?.name || video.level || localizedContent.defaultLevel}/${video.subject?.name || video.subject || localizedContent.notAvailable}/${video.name}/${video._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`${localizedContent.goToRelatedVideo} ${video.name}`"
            >
              <Icon
                name="fluent:video-24-filled"
                class="text-red-500 flex-shrink-0"
                size="1.5rem"
                aria-hidden="true"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ video.name || (video as any).title }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    video.subject?.name ||
                    video.subject ||
                    localizedContent.notAvailable
                  }}
                </p>
              </div>
              <IconsChevronRight
                class="text-gray-400 flex-shrink-0"
                :size="16"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </div>

        <!-- Related Audio -->
        <div
          v-if="relatedContent.audio.length > 0"
          class="mb-4"
        >
          <h4 class="text-xs font-semibold text-gray-700 mb-2">
            {{ localizedContent.relatedAudio }}
          </h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="audioItem in relatedContent.audio.slice(0, 3)"
              :key="audioItem._id"
              :to="`/audio/${audioItem.level?.name || audioItem.level || localizedContent.defaultLevel}/${audioItem.subject?.name || audioItem.subject || localizedContent.notAvailable}/${audioItem.name}/${audioItem._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`${localizedContent.goToRelatedAudio} ${audioItem.name}`"
            >
              <Icon
                name="famicons:headset-sharp"
                class="text-purple-500 flex-shrink-0"
                size="1.5rem"
                aria-hidden="true"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ audioItem.name || (audioItem as any).title }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    audioItem.subject?.name ||
                    audioItem.subject ||
                    localizedContent.notAvailable
                  }}
                </p>
              </div>
              <IconsChevronRight
                class="text-gray-400 flex-shrink-0"
                :size="16"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </div>

        <!-- Related Experiments -->
        <div
          v-if="relatedContent.experiments.length > 0"
          class="mb-4"
        >
          <h4 class="text-xs font-semibold text-gray-700 mb-2">
            {{ localizedContent.relatedExperiments }}
          </h4>
          <div class="space-y-2">
            <NuxtLink
              v-for="experiment in relatedContent.experiments.slice(0, 3)"
              :key="experiment._id"
              :to="`/experiments/${experiment.level?.name || experiment.level || localizedContent.defaultLevel}/${experiment.subject?.name || experiment.subject || localizedContent.notAvailable}/${experiment.name}/${experiment._id}`"
              class="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 transition-colors border border-gray-100"
              :aria-label="`${localizedContent.goToRelatedExperiment} ${experiment.name}`"
            >
              <Icon
                name="icon-park-solid:experiment-one"
                class="text-green-500 flex-shrink-0"
                size="1.5rem"
                aria-hidden="true"
              />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 truncate">
                  {{ experiment.name || (experiment as any).title }}
                </p>
                <p class="text-xs text-gray-500">
                  {{
                    experiment.subject?.name ||
                    experiment.subject ||
                    localizedContent.notAvailable
                  }}
                </p>
              </div>
              <IconsChevronRight
                class="text-gray-400 flex-shrink-0"
                :size="16"
                aria-hidden="true"
              />
            </NuxtLink>
          </div>
        </div>
      </div>

      <!-- screen reader notifier -->
      <div
        class="sr-only"
        aria-live="polite"
        role="status"
      >
        {{ announcement }}
      </div>
    </div>
  </div>
</template>
