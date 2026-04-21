<script setup lang="ts">
import HeroSection from "@/components/home/HeroSection.vue";
import TabBar from "@/components/home/TabBar.vue";
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import { ref, computed, watch } from "vue";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  screenWidth,
} from "@/utilities/controlls";
import HomeTabContentShell from "~/components/home/HomeTabContentShell.vue";
import apiDocs from "~/utilities/apiDocs";
import { HomeCustomScrollView } from "#components";
import {
  filterKeyDataFromArrayOfJson,
  removeDataFromArrayOfJson,
} from "~/utilities/filterJson";
import { fetchAsyncData } from "~/composables/useAsyncFetch";

import type { tabs } from "~/types/types.data";
import { layoutEffect } from "@/utilities/controlls";
import InputsSelection from "~/components/home/InputsSelection.vue";
import {
  getApiEducationLevelName,
  getEducationRouteQuery,
  getHubLanguage,
  getHubPath,
  resolveRouteLanguage,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";
// Define meta info about page
useHead({
  title: "TIE - Tanzania Interactive Learning Platform",
  meta: [
    {
      name: "description",
      content:
        "TIE is a digital learning platform providing quality educational resources for students and teachers in Tanzania.",
    },
    {
      name: "keywords",
      content:
        "Tanzania, education, interactive learning, e-learning, students, teachers",
    },
    { name: "author", content: "Tanzania Institute of Education" },

    // Open Graph (OG) meta tags for social sharing
    {
      property: "og:title",
      content: "TIE - Tanzania Interactive Learning Platform",
    },
    {
      property: "og:description",
      content:
        "Explore interactive educational resources for students and teachers in Tanzania.",
    },
    { property: "og:image", content: "https://example.com/preview-image.jpg" }, // Replace with actual image URL
    { property: "og:url", content: "https://tie.tz" },
    { property: "og:type", content: "website" },

    // Twitter Card meta tags
    { name: "twitter:card", content: "summary_large_image" },
    {
      name: "twitter:title",
      content: "TIE - Tanzania Interactive Learning Platform",
    },
    {
      name: "twitter:description",
      content:
        "Access quality educational content for students and teachers in Tanzania.",
    },
    { name: "twitter:image", content: "https://example.com/preview-image.jpg" }, // Replace with actual image URL
  ],
});

// Define Cookie
const userToken = useCookie("signInUserToken");
const route = useRoute();
const primaryContentLanguage = usePrimaryContentLanguage();

// extract query params
const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
const language = computed(() =>
  getHubLanguage(
    educationLevel.value,
    resolveRouteLanguage(route, educationLevel.value, primaryContentLanguage.value),
  ),
);
const educationRouteQuery = computed(() =>
  getEducationRouteQuery(educationLevel.value, {}, language.value),
);

const contentLayoutLanguage = useContentLayoutLanguage();

const TOPIC_SUBJECT_ORDER = [
  "physics",
  "chemistry",
  "mathematics",
  "biology",
  "geography",
];

const getPageSize = () => {
  if (screenWidth.value >= 1280 || isGreaterToXL.value) return 12;
  if (screenWidth.value >= 1024 || isGreaterToLG.value) return 9;
  if (screenWidth.value >= 768 || isGreaterToMD.value) return 6;
  return 4;
};

const normalizeTopicCollection = (items: any[] = []) =>
  items.map((item) => ({
    ...item,
    level:
      typeof item?.level === "string" ? { name: item.level } : item?.level,
    subject:
      typeof item?.subject === "string"
        ? { name: item.subject }
        : item?.subject,
  }));

const buildTopicGroups = (items: any[] = []) => {
  const normalizedItems = normalizeTopicCollection(items);
  const activeItems = removeDataFromArrayOfJson(
    normalizedItems,
    "isDeleted",
    true,
  );

  return educationLevel.value !== "primary"
    ? filterKeyDataFromArrayOfJson(activeItems, "subject.name", TOPIC_SUBJECT_ORDER)
    : activeItems;
};

// Define Ref status
const status = ref("pending"); // Initial Status State
const topic = ref<any[]>([]); // Initial Topics State
const slicedData = ref<any[]>([]); // Initial slice data to 9

// First, fix the sliceData function
const sliceData = (start: number, end: number) => {
  if (!topic.value || !Array.isArray(topic.value) || topic.value.length === 0) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (topic.value.length <= pageSize.value) {
    slicedData.value = topic.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = topic.value.slice(start, end);
};

// current page data
const currentPage = ref(1);
const pageSize = ref(getPageSize());

const totalPages = computed(() => {
  if (topic.value && Array.isArray(topic.value)) {
    return Math.ceil(topic.value.length / pageSize.value);
  }
  return 0;
});

const goToPage = (page: number) => {
  const availablePages = Math.max(totalPages.value, 1);
  const nextPageNumber = Math.min(Math.max(page, 1), availablePages);

  currentPage.value = nextPageNumber;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  );
};

// Then, update fetchTopics to call sliceData after data is loaded
const fetchTopics = async (params?: any) => {
  const url = apiDocs.topics.filterTopics;
  params = {
    educationLevel: getApiEducationLevelName(educationLevel.value),
    ...params,
  };
  if (userToken.value) {
    params = { ...params, userId: (userToken.value as any)?._id };
  }
  try {
    status.value = "pending";
    currentPage.value = 1;
    const { data: response, status: fetchStatus } = await fetchAsyncData(
      `interactive-${educationLevel.value}-${language.value}`,
      () =>
        $fetch(url, {
          params: params,
        }),
    );

    topic.value = buildTopicGroups(response.value ?? []);
    status.value = fetchStatus.value;

    goToPage(1);
  } catch (error) {
    status.value = "error";
    slicedData.value = [];
  }
};

// Call Fetch Topics function
fetchTopics({});

// Watch screen width and update page size accordingly
watch(
  () => screenWidth.value,
  () => {
    pageSize.value = getPageSize();
    goToPage(currentPage.value);
  },
);

watch(totalPages, (pages) => {
  if (pages === 0) {
    currentPage.value = 1;
    slicedData.value = [];
    return;
  }

  if (currentPage.value > pages) {
    goToPage(pages);
  }
});

// loadoing indicator
const { progress, isLoading } = useLoadingIndicator();

const filterValue = ref<Record<string, any> | any[]>({});
const activeTab = ref<tabs>("interactive-contents");
watch(
  () => filterValue.value,
  (newFilterValue) => {
    if (Array.isArray(newFilterValue)) {
      fetchTopics({});
      return;
    }
    const filteredParams = Object.fromEntries(
      Object.entries(newFilterValue || {}).filter(([_, v]) => v),
    );
    fetchTopics(filteredParams);
  },
  { deep: true },
);

/** Tab targets except `subjects` (Masomo vs Subjects is handled in switchTab). */
const TAB_TO_ROUTE = computed<Record<
  string,
  { path: string; query?: Record<string, any> }
>>(() => ({
  "interactive-contents": { path: "/interactive", query: educationRouteQuery.value },
  "learn-activities": { path: "/experiments", query: educationRouteQuery.value },
  video: { path: "/video", query: { ...educationRouteQuery.value, type: "conc" } },
  "class-videos": { path: "/video", query: { ...educationRouteQuery.value, type: "oth" } },
  audio: { path: "/audio", query: educationRouteQuery.value },
  "smart-class": { path: "/smart-class" },
}));

const switchTab = async (tab: any) => {
  if (!tab) return;
  activeTab.value = tab;
  if (tab === "subjects") {
    await useRouter().push({
      path: getHubPath(educationLevel.value),
    });
    return;
  }
  const target = TAB_TO_ROUTE.value[tab] ?? { path: getHubPath(educationLevel.value) };
  await useRouter().push(target);
};

// Define Filters Reactive State
const filters = reactive<{
  level: string | number | null;
  subject: string | number | null;
}>({
  level: null,
  subject: null,
});

const level = ref(); // Initial Level State
// watch emits changes
watch(filters, (filters) => {
  const payload: any = {};

  if (filters.level) {
    payload.level = filters.level.toString();
  }

  if (filters.subject) {
    payload.subject = filters.subject.toString();
  }

  if (Object.keys(payload).length === 0) return;

  fetchTopics(payload);
});
</script>

<template>
  <NuxtLayout name="home-layout" :language="contentLayoutLanguage" :education-level>
    <div :class="[' ', { ' animate-pulse': isLoading }]">
      <!-- User Token Available -->
      <div v-if="userToken" class="flex flex-col items-center justify-center w-full gap-4 pt-4">
        <HomeSearchbar appearance="rounded" :language :education-level="educationLevel" />
        <TabBar :is-logged-in="true" :active-tab="activeTab" @emit-active-tab="switchTab($event)"
          :tab-group="educationLevel" :language />
      </div>

      <!-- User Token Not Available -->
      <div v-else>
        <HeroSection :language />
        <InputsSelection @emit-level="level = $event" @emit-standard="filters.level = $event"
          @emit-subject="filters.subject = $event" :education-level :language />
      </div>

      <div class="items-center justify-end hidden gap-2 md:flex" role="group" aria-label="Layout options">
        <button @click="layoutEffect = 'grid'" :aria-pressed="layoutEffect === 'grid'" aria-label="Grid layout" :class="[
          'cursor-pointer transition-all duration-500 ease-in-out',
          layoutEffect == 'grid' ? '!text-darkBlue' : 'text-oceanBlue',
        ]">
          <Icon name="bxs:grid-alt" size="1.5rem" aria-hidden="true" />
        </button>
        <button @click="layoutEffect = 'list'" :aria-pressed="layoutEffect === 'list'" aria-label="List layout" :class="[
          'text-oceanBlue cursor-pointer transition-all duration-500 ease-in-out',
          layoutEffect == 'list' ? '!text-darkBlue' : 'text-oceanBlue',
        ]">
          <Icon name="fa-solid:list" size="1.5rem" aria-hidden="true" />
        </button>
      </div>

      <HomeTabContentShell :active-tab="activeTab" :language="language" :education-level
        :results-count="topic?.length || 0" :filter-value="filterValue" :show-filters="!!userToken"
        @update-filter="filterValue = $event" @reset-filter="filterValue = {}">
        <div v-if="status === 'pending'" class="flex flex-col items-center justify-center">
          <LoadingIndicator :is-loading="true" />
        </div>
        <!-- Status Error -->
        <div v-else-if="status === 'error'" class="md:min-h-[342px] flex flex-col justify-center items-center">
          <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" />
          <p class="text-center">
            Oops! Something went wrong.<br />
            Try refreshing the page or check your internet connection.
          </p>
        </div>

        <!-- Status Success -->
        <div v-else-if="status == 'success'">
          <!-- client only -->
          <ClientOnly v-if="slicedData?.length > 0">
            <div class="flex flex-col w-full">
              <HomeCustomScrollView :data="slicedData" active-tab="interactive-contents" />

              <!-- pagination numbers based on data length greater to 9 -->
              <div class="flex justify-center">
                <AppPagination :current-page="currentPage" :total-pages="totalPages"
                  :first-label="useContentLayoutLanguage().value == 'kiswahili' ? 'Mwanzo' : 'First'"
                  :last-label="useContentLayoutLanguage().value == 'kiswahili' ? 'Mwisho' : 'Last'" @change="goToPage" />
              </div>
            </div>
          </ClientOnly>
          <MessageTopicNotFound v-else />
        </div>

        <!-- Even Data was not success should be handle here -->
        <div class="flex flex-col w-full" v-else>
          <div class="">Try to refresh the page, Something went Wrong</div>
        </div>
      </HomeTabContentShell>
    </div>
  </NuxtLayout>
</template>
