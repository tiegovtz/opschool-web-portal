<script setup lang="ts">
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import { ref, computed, onMounted, watch, reactive } from 'vue';
import { isGreaterToXL, isGreaterToLG, isGreaterToMD, isGreaterToSM, screenWidth } from '@/utilities/controlls';
import InputsSelection from '@/components/home/InputsSelection.vue'
import apiDocs from "~/utilities/apiDocs";
import { HomeCustomScrollView } from "#components";
import { filterKeyDataFromArrayOfJson, removeDataFromArrayOfJson } from '~/utilities/filterJson';
import { fetchAsyncData } from "~/composables/useAsyncFetch";
import type { User } from "~/types/user.interface";
import type { Subjects } from "~/types/subject.interface";

// Define meta info about page
useHead({
  title: "TIE - Tanzania Interactive Learning Platform",
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

// Define Cookie
const userToken = useCookie('signInUserToken');

// Define Ref status
const status = ref('pending'); // Initial Status State
const topic = ref<any[]>();        // Initial Topics State
const slicedData = ref();    // Initial slice data to 9

// First, fix the sliceData function
const sliceData = (start:number, end:number) => {

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
const pageSize = ref();

// Then, update fetchTopics to call sliceData after data is loaded
const fetchTopics = async (params?:any) => {

  const url = userToken.value ?
    apiDocs.topics.filterTopicsByUser.replace('{userId}', (userToken.value as unknown as User)?._id) :
    apiDocs.topics.filterTopics

  try {
    status.value = 'pending';
    const {data:response,status:fetchStatus} = await  fetchAsyncData('interactive',()=>$fetch(url, {
      params: params
    }))

    // Call State Define above
    topic.value = removeDataFromArrayOfJson(response.value, "isDeleted", true);
    topic.value = filterKeyDataFromArrayOfJson(topic.value,"subject.name",['physics','chemistry','mathematics','biology','geography']);
    status.value = fetchStatus.value;

    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
  } catch (error) {
    status.value = 'error';
    slicedData.value = [];
  }
};

// Call Fetch Topics function
fetchTopics({})

//  assigning page size based on screen sizes
if (isGreaterToXL) {
  pageSize.value = 12; // 12 topic cards
}
else if (isGreaterToLG) {
  pageSize.value = 9; // 9 topic cards
}
else if (isGreaterToMD) {
  pageSize.value = 6; // 6 topic cards per page
}
else {
  pageSize.value = 4;// 4 topics card per page
}

// total pages data
const totalPages = computed(() => {
  if (topic.value && Array.isArray(topic.value)) {
    return Math.ceil(topic.value.length / pageSize.value);
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

// Define Filters Reactive State
const filters = reactive<{ level: string | number | null; subject: string | null }>(
  {
    level: null,
    subject: null,
  }
)

const level = ref<string | null>(null)  // Initial Level State
// watch emits changes
watch(filters, (current) => {
  const payload: Record<string, string> = {};

  if (current.level != null) {
    payload.level = String(current.level);
  }

  if (current.subject != null) {
    payload.subject = String(current.subject);
  }

  fetchTopics(payload);
}, { deep: true });

</script>

<template>
  <NuxtLayout name="home-layout">
    <div :class="[
      ' ',
      { ' animate-pulse': isLoading }
    ]">

      <!-- User Token Available -->
      <div v-if="userToken" class="flex flex-col items-center justify-center w-full gap-4 pt-4">
        <HomeSearchbar appearance="rounded" />
        <TabBar />
      </div>

      <!-- User Token Not Available -->
      <div v-else>
        <HeroSection />
        <InputsSelection @emit-level="level = $event" @emit-standard="filters.level = $event"
          @emit-subject="filters.subject = $event" />
        <TabBar />
      </div>

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
           <HomeCustomScrollView :data="topic ??[]" active-tab="interactive-contents" />

            <!-- pagination numbers based on data length greater to 9 -->
            <div v-if="totalPages > 1" class="flex justify-center my-10">
              <div v-if="totalPages <= 5" class="flex justify-center gap-2">
                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                  :is-active="page === currentPage" :disabled="page === currentPage"
                  @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />
              </div>
              <div v-else class="flex justify-center gap-2">
                <!-- previous -->
                <div class="flex items-center justify-center" v-if="currentPage > 5">
                  <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
                </div>

                <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                  :is-active="page === currentPage" :disabled="page === currentPage"
                  @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />

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
    </div>
  </NuxtLayout>
</template>