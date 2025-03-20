<script setup>
import TopicCard from "@/components/home/TopicCard.vue";
import HeroSection from '@/components/home/HeroSection.vue'
import TabBar from '@/components/home/TabBar.vue'
import { ref, computed, onMounted, watch } from 'vue';
import { isGreaterToXL, isGreaterToLG, isGreaterToMD, isGreaterToSM, screenWidth } from '@/utilities/controlls';
import InputsSelection from '@/components/home/InputsSelection.vue'
import apiDocs from "~/utilities/api-docs";



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


// slice data to 9
const slicedData = ref();

// First, fix the sliceData function
const sliceData = (start, end) => {

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


// Define status
const status = ref('pending'); // Initial status

// Fetch topics
const topic = ref([]);

// Then, update fetchTopics to call sliceData after data is loaded
const fetchTopics = async (params) => {
  try {
    status.value = 'pending';
    const response = await $fetch(apiDocs.topics.filterTopics,{
      params: params
    });

    topic.value = response;
    status.value = 'success';
    // console.log(topic.value)
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

// current page data
const currentPage = ref(1);
const pageSize = ref();

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
const { progress, isLoading} =useLoadingIndicator()

// define Emited
const filters =reactive(
  {
    level: null,
    subject: null,
  }
)

const level = ref()
// watch emits changes
watch(filters,(filters)=>{
  fetchTopics({
    "level": filters.level.toString(),
    "subject":filters.subject.toString()
  })
})
</script>

<template>
  <NuxtLayout name="home-layout">
    <div class="lg:px-4" :class="{' animate-pulse':isLoading}" >
      <HeroSection />
      <InputsSelection @emit-level="level = $event" @emit-standard="filters.level = $event"
        @emit-subject="filters.subject = $event" />
      <TabBar />

      <div v-if="status === 'pending'" class="flex flex-col justify-center items-center">
        <LoadingIndicator :is-loading="true" />
      </div>
      <div v-else-if="status === 'error'">Error: {{ error?.message }}</div>
      <div v-else-if="status == 'success'">
        <div class="w-full flex flex-col" v-if="slicedData?.length > 0">
          <div class=" grid grid-cols-1   2xl:grid-cols-6  xl:grid-cols-4  lg:grid-cols-3 md:grid-cols-2 gap-6 xl:gap-10 mb-10">
            <TopicCard v-for="topic in slicedData" :key="topic._id" :topic-id="topic._id" :topic-image="topic.thumbnail"
              :topic-title="topic.name" :topic-description="topic.descriptions"
              :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'" 
              :topic-likes="topic.topic_likes ? topic.topic_likes : 100" :topic-views="topic.views ? topic.views : 100"
              :topic-level="level" :topic-standard="topic.level.name" :subject-name="topic.subject.name" />
          </div>

          <!-- pagination numbers based on data length greater to 9 -->
          <div class="flex justify-center mb-10">
            <div v-if="totalPages <= 5" class="flex justify-center gap-2">
              <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                :is-active="page === currentPage" :disabled="page === currentPage"
                @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />
            </div>
            <div v-else class="flex justify-center gap-2">
              <!-- previous -->
              <div class="flex justify-center items-center" v-if="currentPage > 5">
                <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
              </div>

              <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                :is-active="page === currentPage" :disabled="page === currentPage"
                @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />

              <!-- next button -->
              <div class="flex justify-center items-center" v-if="currentPage > 4">
                <Icon name="iconamoon:arrow-right-2-fill" size="2rem" @click="nextPage" />
              </div>
            </div>
          </div>
        </div>
        <MessageTopicNotFound v-else />

      </div>
      <div v-else>
        <div class="" v-if="slicedData?.length === 0">Try to refresh the page, Something went Wrong</div>
        <div class=" grid grid-cols-1 2xl:grid-cols-6 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 gap-6 mb-10" v-else>

          <TopicCard v-for="topic in slicedData" :key="topic._id" :topic-id="topic._id" :topic-image="topic.thumbnail"
            :topic-title="topic.name" :topic-description="topic.descriptions"
            :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'"
            :topic-likes="topic.topic_likes ? topic.topic_likes : 100" :topic-views="topic.views ? topic.views : 100"
            :topic-level="level" :topic-standard="topic.level.name" :subject-name="topic.subject.name" />

          <!-- pagination numbers based on data length greater to 9 -->
          <div class="flex justify-center mb-10">
            <div v-if="totalPages <= 5" class="flex justify-center gap-2">

              <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                :is-active="page === currentPage" :disabled="page === currentPage"
                @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />
            </div>

            <div v-else class="flex justify-center gap-2">
              <!-- previous -->
              <div class="flex justify-center items-center" v-if="currentPage > 5">
                <Icon name="iconamoon:arrow-left-2-fill" size="2rem" @click="prevPage" />
              </div>
              <PaginationBtn v-for="page in totalPages" :key="page" :page-number="page"
                :is-active="page === currentPage" :disabled="page === currentPage"
                @click="sliceData((page - 1) * pageSize, page * pageSize)" @send-page-number="currentPage = $event" />

              <!-- next button -->
              <div class="flex justify-center items-center" v-if="currentPage > 4">
                <Icon name="iconamoon:arrow-right-2-fill" size="2rem" @click="nextPage" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
