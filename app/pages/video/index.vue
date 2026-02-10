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
import type { tabs } from "~/types/types.data";
import { layoutEffect } from '@/utilities/controlls';
import InputsSelection from '~/components/home/InputsSelection.vue';

useHead({
  title: "TIE - Video Resource",
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
const videos = ref();         // Initial videos State
const slicedData = ref();    // Initial slice data to 9
const route = useRoute();
const videoType = computed<string>(() => {
  let type = route.query?.type as string;
  if (type === 'oth') return 'Others';
  if (type === 'conc') return 'Conceptual';

  return '';
});
const activeTab = ref<tabs>(videoType.value === 'Others' ? 'class-videos' : 'video');

// Define Cookie
const userToken = useCookie("signInUserToken");

// First, fix the sliceData function
const sliceData = (start: number, end: number) => {

  if (!videos.value || !Array.isArray(videos.value) || videos.value.length === 0) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (videos.value.length <= pageSize.value) {
    slicedData.value = videos.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = videos.value.slice(start, end);
};

// Define current page and Page size variable
const currentPage = ref(1);
const pageSize = ref();

const VIDEO_TAB_TO_ROUTE: Record<string, { path: string; query?: Record<string, any> }> = {
  subjects: { path: "/home" },
  "interactive-contents": { path: "/interactive" },
  "learn-activities": { path: "/experiments" },
  video: { path: "/video", query: { type: "conc" } },
  "class-videos": { path: "/video", query: { type: "oth" } },
  audio: { path: "/audio" },
  "smart-class": { path: "/smart-class" },
};

const switchTab = async (tab: string) => {
  if (!tab) return;
  activeTab.value = tab as tabs;
  const target = VIDEO_TAB_TO_ROUTE[tab] ?? { path: "/home" };
  await useRouter().push(target);
};

// Fetch Videos From Server
const fetchVideos = async (param?: any) => {
  param = {
    ...param,
    videoType: videoType.value
  }

  try {
    status.value = 'pending';
    const { data: response, status: fetchStatus } = await fetchAsyncData(`videos-${videoType.value}`, () => $fetch(apiDocs.videos.getPublicVideo, {
      method: 'GET',
      params: {
        ...param
      },
    }));


    // Call State Define above
    videos.value = removeDataFromArrayOfJson(response.value, 'isDeleted', true);
    // remove type
    // videos.value = videoType === 'conc' ? removeDataFromArrayOfJson( videos.value, 'videoType','Others' ):removeDataFromArrayOfJson( videos.value, 'videoType', 'Conceptual');
    videos.value = filterKeyDataFromArrayOfJson(videos.value, "subject.name", ['physics', 'chemistry', 'mathematics', 'biology', 'geography'])
    status.value = fetchStatus.value;

    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );

  } catch (erro) {
    status.value = 'error';
    error.value = erro as any;
    console.log(error);
  }
}

// Call FetchVideos Function
fetchVideos({});

//  assigning page size based on screen sizes
if (isGreaterToXL) {
  pageSize.value = 12;  // 12 videos cards
}
else if (isGreaterToLG) {
  pageSize.value = 9;   // 9 videos cards
}
else if (isGreaterToMD) {
  pageSize.value = 6;    // 6 videos cards per page
}
else {
  pageSize.value = 4; // 4 topics card per page
}

// total pages data
const totalPages = computed(() => {
  if (videos.value && Array.isArray(videos.value)) {
    return Math.ceil(videos.value.length / pageSize.value);
  }
  return 0; // Default to 0 if no data
});

// Watch screen width and update page size accordingly
watch(() => screenWidth.value, () => {
  if (screenWidth.value >= 1280) {
    pageSize.value = 12;

  } else if (screenWidth.value >= 1024 && screenWidth.value < 1280) {
    pageSize.value = 9
  } else if (screenWidth.value >= 768 && screenWidth.value < 1024) {
    pageSize.value = 6
  } else if (screenWidth.value >= 640 && screenWidth.value < 768) {
    pageSize.value = 4
  } else {
    pageSize.value = 4
  }

  // slice data per page size
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  )
});

// once pages are more than 5, handle pagination
const nextPage = () => {
  currentPage.value++;
  currentPage.value = currentPage.value > totalPages.value ? totalPages.value : currentPage.value;
  sliceData((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
}

const prevPage = () => {
  currentPage.value--;
  currentPage.value = currentPage.value < 1 ? 1 : currentPage.value;
  sliceData((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value);
}

// loadoing indicator
const { progress, isLoading } = useLoadingIndicator()
watch(() => route.query?.type, () => {

  fetchVideos({
    videoType: route.query?.type == 'conc' ? 'Conceptual' : 'others'
  })
})

// Define Filters Reactive State
const filterValue = ref<Record<string, any> | any[]>({});
watch(
  () => filterValue.value,
  (newFilterValue) => {
   
    if (Array.isArray(newFilterValue)) {
      fetchVideos({});
      return;
    }
    const filteredParams = Object.fromEntries(
      Object.entries(newFilterValue || {}).filter(([_, v]) => v)
    );
    fetchVideos({
      ...filteredParams,
    });
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

  fetchVideos(payload);
});

</script>

<template>
  <NuxtLayout name="home-layout">
    <section :class="[
      ' ',
      { ' animate-pulse': isLoading }
    ]">
      <!-- User Token Not Available -->
      <div v-if="!userToken">
        <HeroSection />
        <InputsSelection @emit-level="level = $event" @emit-standard="filters.level = $event"
          @emit-subject="filters.subject = $event" />
        <TabBar :active-tab="activeTab" />
      </div>
      <div v-else class="flex flex-col items-center justify-center w-full gap-4 pt-4">
        <HomeSearchbar appearance="rounded" />
        <TabBar :is-logged-in="true" :active-tab="activeTab" @emit-active-tab="switchTab($event)" />
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
      <HomeTabContentShell :active-tab="activeTab" :results-count="videos?.length || 0" :filter-value="filterValue"
        :show-filters="!!userToken" @update-filter="filterValue = $event" @reset-filter="filterValue = {}">
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
              <HomeCustomScrollView :data="videos" active-tab="video" />

              <!-- pagination numbers based on data length greater to 9 -->
              <div v-if="totalPages > 1" class="flex justify-center my-10">
                <div v-if="totalPages <= 5" class="flex justify-center gap-2">
                  <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                    :is-active="page === currentPage" :disabled="page === currentPage"
                    @click="sliceData((page - 1) * pageSize, page * pageSize)"
                    @send-page-number="currentPage = $event" />
                </div>
                <div v-else class="flex justify-center gap-2">
                  <!-- previous -->
                  <div class="flex items-center justify-center" v-if="currentPage > 5">
                    <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
                  </div>

                  <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                    :is-active="page === currentPage" :disabled="page === currentPage"
                    @click="sliceData((page - 1) * pageSize, page * pageSize)"
                    @send-page-number="currentPage = $event" />

                  <!-- next button -->
                  <div class="flex items-center justify-center" v-if="currentPage > 4">
                    <Icon name="iconamoon:arrow-right-2-fill" size="2rem" @click="nextPage" />
                  </div>
                </div>
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
    </section>
  </NuxtLayout>
</template>
