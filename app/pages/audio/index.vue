<script setup lang="ts">
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import { ref, computed, watch } from 'vue';
import { isGreaterToXL, isGreaterToLG, isGreaterToMD, isGreaterToSM, screenWidth } from '@/utilities/controlls';
import apiDocs from "~/utilities/apiDocs";
import HomeTabContentShell from "~/components/home/HomeTabContentShell.vue";
import { filterKeyDataFromArrayOfJson, removeDataFromArrayOfJson } from '~/utilities/filterJson';
import { HomeCustomScrollView } from "#components";
import { fetchAsyncData } from '~/composables/useAsyncFetch';
import type { tabs } from '~/types/types.data';
import { layoutEffect } from '@/utilities/controlls';
import InputsSelection from '~/components/home/InputsSelection.vue';
import {
  getApiContentLanguage,
  getEducationRouteQuery,
  getHubLanguage,
  getHubPath,
  resolveRouteLanguage,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";

useHead({
  title: "TIE - Audio Resource",
  meta: [
    {
      name: 'description',
      content: 'TIE is a digital learning platform providing quality educational resources for students and teachers in Tanzania.'
    },
    { name: 'keywords', content: 'Tanzania, education, interactive learning, e-learning, students, teachers' },
    { name: 'author', content: 'Tanzania Institute of Education' },

    // Open Graph (OG) meta tags for social sharing
    { property: 'og:title', content: 'TIE - Tanzania Interactive Learning Platform' },
    { property: 'og:description', content: 'Explore interactive educational resources for students and teachers in Tanzania.' },
    { property: 'og:image', content: 'https://example.com/preview-image.jpg' }, // Replace with actual image URL
    { property: 'og:url', content: 'https://tie.tz' },
    { property: 'og:type', content: 'website' },

    // Twitter Card meta tags
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: 'TIE - Tanzania Interactive Learning Platform' },
    { name: 'twitter:description', content: 'Access quality educational content for students and teachers in Tanzania.' },
    { name: 'twitter:image', content: 'https://example.com/preview-image.jpg' } // Replace with actual image URL
  ]
})

// Define Ref state variables
const error = ref(null);        // Initial Error State
const status = ref('pending'); // Initial Status State
const audios = ref();         // Initial Audios State
const slicedData = ref();    // Initial slice data to 9
const route = useRoute();
const primaryContentLanguage = usePrimaryContentLanguage();
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
const apiLanguage = computed(() =>
  getApiContentLanguage(educationLevel.value, language.value),
);

// Define Cookie
const userToken = useCookie("signInUserToken");

// First, fix the sliceData function
const sliceData = (start: number, end: number) => {

  if (!audios.value || !Array.isArray(audios.value) || audios.value.length === 0) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (audios.value.length <= pageSize.value) {
    slicedData.value = audios.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = audios.value.slice(start, end);
};

// Define current page and Page size variable
const currentPage = ref<number>(1);
const pageSize = ref<number>(12);
const getPageSize = () => {
  if (screenWidth.value >= 1280 || isGreaterToXL.value) return 12;
  if (screenWidth.value >= 1024 || isGreaterToLG.value) return 9;
  if (screenWidth.value >= 768 || isGreaterToMD.value) return 6;
  return 4;
};
const activeTab = ref<tabs>("audio")
const TAB_TO_ROUTE = computed<Record<string, { path: string; query?: Record<string, any> }>>(() => ({
  subjects: { path: getHubPath(educationLevel.value) },
  "interactive-contents": { path: "/interactive", query: educationRouteQuery.value },
  "learn-activities": { path: "/experiments", query: educationRouteQuery.value },
  video: { path: "/video", query: { ...educationRouteQuery.value, type: "conc" } },
  "class-videos": { path: "/video", query: { ...educationRouteQuery.value, type: "oth" } },
  audio: { path: "/audio", query: educationRouteQuery.value },
  "smart-class": { path: "/smart-class" },
}));

const switchTab = async (tab: string) => {
  if (!tab) return;
  activeTab.value = tab as tabs;
  const target = TAB_TO_ROUTE.value[tab] ?? { path: getHubPath(educationLevel.value) };
  await useRouter().push(target);
};
// Fetch audios From Server
const fetchAudios = async (param?: any) => {
  try {
    status.value = 'pending';
    currentPage.value = 1;
    const { data: response, status: fetchStatus } = await fetchAsyncData(`audios-${educationLevel.value}-${language.value}-${param?.toString()}`, () => $fetch(apiDocs.audio.getPublicAudio, {
      method: 'GET',
      params: {
        educationLevel: educationLevel.value,
        ...(apiLanguage.value ? { language: apiLanguage.value } : {}),
        ...param
      },
    }));

    // Call State Define above
    audios.value = removeDataFromArrayOfJson(response.value, 'isDeleted', true);
    audios.value = removeDataFromArrayOfJson(audios.value, 'audioType', 'NARRATION');
    audios.value = educationLevel.value !== "primary"
      ? filterKeyDataFromArrayOfJson(audios.value, "subject.name", ['physics', 'chemistry', 'mathematics', 'biology', 'geography'])
      : audios.value;
    status.value = fetchStatus.value;

    goToPage(1);

  } catch (error: any) {
    status.value = 'error';
    error.value = error;
    console.error(error);
  }
}

// Call Fetchaudios Function
fetchAudios();

//  assigning page size based on screen sizes
pageSize.value = getPageSize();

// total pages data
const totalPages = computed(() => {
  if (audios.value && Array.isArray(audios.value)) {
    return Math.ceil(audios.value.length / pageSize.value);
  }
  return 0; // Default to 0 if no data
});

const goToPage = (page: number) => {
  const nextPageNumber = Math.min(Math.max(page, 1), Math.max(totalPages.value, 1));
  currentPage.value = nextPageNumber;
  sliceData((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
};

// Watch screen width and update page size accordingly
watch(() => screenWidth.value, () => {
  pageSize.value = getPageSize();
  goToPage(currentPage.value);
});

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
const { progress, isLoading } = useLoadingIndicator()
watch(() => route.query?.type, () => {
  useCookie("signInAccessToken").value;
  // fetchAudios({
  //   AudioType: route.query?.type == 'conc'? 'Conceptual' : 'others'
  // })
})

// Define Filters Reactive State
const filterValue = ref<Record<string, any> | any[]>({});
watch(
  () => filterValue.value,
  (newFilterValue) => {
    if (Array.isArray(newFilterValue)) {
      fetchAudios();
      return;
    }
    const filteredParams = Object.fromEntries(
      Object.entries(newFilterValue || {}).filter(([_, v]) => v)
    );
    fetchAudios(filteredParams);
  },
  { deep: true }
);

// Define Filters Reactive State
const filters = reactive<{
  level: string | number | null;
  subject: string | number | null;
}>({
  level: null,
  subject: null,
});

const level = ref()  // Initial Level State
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

  fetchAudios(payload);
});

const contentLayoutLanguage = useContentLayoutLanguage();
</script>

<template>
  <NuxtLayout name="home-layout" :language="contentLayoutLanguage">
    <section :class="[
      ' ',
      { ' animate-pulse': isLoading }
    ]">

      <!-- User Token Available -->
      <div v-if="userToken" class="flex flex-col items-center justify-center w-full gap-4 pt-4">
        <HomeSearchbar appearance="rounded" :language :education-level="educationLevel" />
        <TabBar :is-logged-in="true" :active-tab="activeTab" @emit-active-tab="switchTab($event)" :language :education-level="educationLevel" :tab-group="educationLevel" />
      </div>

      <!-- User Token Not Available -->
      <div v-else>
        <HeroSection :language :education-level="educationLevel" />
        <InputsSelection :language :education-level="educationLevel" @emit-level="level = $event" @emit-standard="filters.level = $event"
          @emit-subject="filters.subject = $event" />
        <TabBar :active-tab="activeTab" :language :education-level="educationLevel" :tab-group="educationLevel" />
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
      <HomeTabContentShell
        :active-tab="activeTab"
        :language="language"
        :education-level="educationLevel"
        :results-count="audios?.length || 0"
        :filter-value="filterValue"
        :show-filters="!!userToken"
        @update-filter="filterValue = $event"
        @reset-filter="filterValue = {}"
      >
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
              <HomeCustomScrollView :data="slicedData" active-tab="audio" />

              <AppPagination
                :current-page="currentPage"
                :total-pages="totalPages"
                :first-label="contentLayoutLanguage=='kiswahili' ? 'Mwanzo' :'First'"
                :last-label="contentLayoutLanguage=='kiswahili' ? 'Mwisho' :'Last'"
                @change="goToPage"
              />
            </div>
          </ClientOnly>
          <MessageTopicNotFound v-else />
        </div>

        <!-- Even Data was not success should be handle here -->
        <div class="flex flex-col w-full" v-else>
          <div class="">Try to refresh the page, Something went Wrong</div>
        </div>
      </HomeTabContentShell>
    </section>
  </NuxtLayout>
</template>
