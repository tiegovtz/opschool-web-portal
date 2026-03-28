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
import { nyumbaniTopics } from "~/data/nyumbani.mock";
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

const { $router } = useNuxtApp();
const query = $router.currentRoute.value.query;

// extract query params
const educationLevel = computed(() =>
  (query.edl as string) == "primary" ? "primary" : "secondary",
);
const language = computed(() =>
  (query.lang as string) == "sw" ? "kiswahili" : "english",
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

  return filterKeyDataFromArrayOfJson(
    activeItems,
    "subject.name",
    TOPIC_SUBJECT_ORDER,
  );
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

// Then, update fetchTopics to call sliceData after data is loaded
const fetchTopics = async (params?: any) => {
  const url = apiDocs.topics.filterTopics;
  if (userToken.value) {
    params = { ...params, userId: (userToken.value as any)?._id };
  }
  try {
    status.value = "pending";
    const { data: response, status: fetchStatus } = await fetchAsyncData(
      "interactive",
      () =>
        $fetch(url, {
          params: params,
        }),
    );

    const resolvedTopics =
      educationLevel.value === "primary"
        ? nyumbaniTopics
        : response.value ?? [];

    topic.value = buildTopicGroups(resolvedTopics);
    status.value = fetchStatus.value;

    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value,
    );
  } catch (error) {
    status.value = "error";
    slicedData.value = [];
  }
};

// Call Fetch Topics function
fetchTopics({});

//  assigning page size based on screen sizes
// total pages data
const totalPages = computed(() => {
  if (topic.value && Array.isArray(topic.value)) {
    return Math.ceil(topic.value.length / pageSize.value);
  }
  return 0; // Default to 0 if no data
});

// Watch screen width and update page size accordingly
watch(
  () => screenWidth.value,
  () => {
    pageSize.value = getPageSize();

    // slice data per page size
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value,
    );
  },
);

// once pages are more than 5, handle pagination
const nextPage = () => {
  currentPage.value++;
  currentPage.value =
    currentPage.value > totalPages.value ? totalPages.value : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  );
};

const prevPage = () => {
  currentPage.value--;
  currentPage.value = currentPage.value < 1 ? 1 : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value,
  );
};

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

const TAB_TO_ROUTE: Record<
  string,
  { path: string; query?: Record<string, any> }
> = {
  subjects: { path: "/home" },
  "interactive-contents": { path: "/interactive" },
  "learn-activities": { path: "/experiments" },
  video: { path: "/video", query: { type: "conc" } },
  "class-videos": { path: "/video", query: { type: "oth" } },
  audio: { path: "/audio" },
  "smart-class": { path: "/smart-class" },
};

const switchTab = async (tab: any) => {
  if (!tab) return;
  activeTab.value = tab;
  const target = TAB_TO_ROUTE[tab] ?? { path: "/home" };
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
  <NuxtLayout
    name="home-layout"
    :language="contentLayoutLanguage"
  >
    <div :class="[' ', { ' animate-pulse': isLoading }]">
      <!-- User Token Available -->
      <div
        v-if="userToken"
        class="flex flex-col items-center justify-center w-full gap-4 pt-4"
      >
        <HomeSearchbar appearance="rounded" />
        <TabBar
          :is-logged-in="true"
          :active-tab="activeTab"
          @emit-active-tab="switchTab($event)"
          :tab-group="educationLevel"
          :language
        />
      </div>

      <!-- User Token Not Available -->
      <div v-else>
        <HeroSection :language />
        <InputsSelection
          @emit-level="level = $event"
          @emit-standard="filters.level = $event"
          @emit-subject="filters.subject = $event"
          :education-level
          :language
        />
      </div>

      <div
        class="items-center justify-end hidden gap-2 md:flex"
        role="group"
        aria-label="Layout options"
      >
        <button
          @click="layoutEffect = 'grid'"
          :aria-pressed="layoutEffect === 'grid'"
          aria-label="Grid layout"
          :class="[
            'cursor-pointer transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? '!text-darkBlue' : 'text-oceanBlue',
          ]"
        >
          <Icon
            name="bxs:grid-alt"
            size="1.5rem"
            aria-hidden="true"
          />
        </button>
        <button
          @click="layoutEffect = 'list'"
          :aria-pressed="layoutEffect === 'list'"
          aria-label="List layout"
          :class="[
            'text-oceanBlue cursor-pointer transition-all duration-500 ease-in-out',
            layoutEffect == 'list' ? '!text-darkBlue' : 'text-oceanBlue',
          ]"
        >
          <Icon
            name="fa-solid:list"
            size="1.5rem"
            aria-hidden="true"
          />
        </button>
      </div>

      <HomeTabContentShell
        :active-tab="activeTab"
        :results-count="topic?.length || 0"
        :filter-value="filterValue"
        :show-filters="!!userToken"
        @update-filter="filterValue = $event"
        @reset-filter="filterValue = {}"
      >
        <div
          v-if="status === 'pending'"
          class="flex flex-col items-center justify-center"
        >
          <LoadingIndicator :is-loading="true" />
        </div>
        <!-- Status Error -->
        <div
          v-else-if="status === 'error'"
          class="md:min-h-[342px] flex flex-col justify-center items-center"
        >
          <Icon
            name="codicon:errorr"
            class="mb-4 text-red-500"
            size="20"
          />
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
              <HomeCustomScrollView
                :data="slicedData"
                active-tab="interactive-contents"
              />

              <!-- pagination numbers based on data length greater to 9 -->
              <div
                v-if="totalPages > 1"
                class="flex justify-center my-10"
              >
                <div
                  v-if="totalPages <= 5"
                  class="flex justify-center gap-2"
                >
                  <PaginationBtn
                    v-for="page in totalPages"
                    :key="page"
                    :page-number="page"
                    :is-active="page === currentPage"
                    :disabled="page === currentPage"
                    @click="sliceData((page - 1) * pageSize, page * pageSize)"
                    @send-page-number="currentPage = $event"
                  />
                </div>
                <div
                  v-else
                  class="flex justify-center gap-2"
                >
                  <!-- previous -->
                  <div
                    class="flex items-center justify-center"
                    v-if="currentPage > 5"
                  >
                    <Icon
                      name="iconamoon:arrow-left-2-fill"
                      size="2rem"
                      @click="prevPage"
                    />
                  </div>

                  <PaginationBtn
                    v-for="page in totalPages"
                    :key="page"
                    :page-number="page"
                    :is-active="page === currentPage"
                    :disabled="page === currentPage"
                    @click="sliceData((page - 1) * pageSize, page * pageSize)"
                    @send-page-number="currentPage = $event"
                  />

                  <!-- next button -->
                  <div
                    class="flex items-center justify-center"
                    v-if="currentPage > 4"
                  >
                    <Icon
                      name="iconamoon:arrow-right-2-fill"
                      size="2rem"
                      @click="nextPage"
                    />
                  </div>
                </div>
              </div>
            </div>
          </ClientOnly>
          <MessageTopicNotFound v-else />
        </div>

        <!-- Even Data was not success should be handle here -->
        <div
          class="flex flex-col w-full"
          v-else
        >
          <div class="">Try to refresh the page, Something went Wrong</div>
        </div>
      </HomeTabContentShell>
    </div>
  </NuxtLayout>
</template>
