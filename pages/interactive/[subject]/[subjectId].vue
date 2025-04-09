<script setup>
import TopicCard from "@/components/home/TopicCard.vue";
import HeroSection from "@/components/home/HeroSection.vue";
import TabBar from "@/components/home/TabBar.vue";
import { ref, computed, onMounted, watch } from "vue";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  screenWidth,
} from "@/utilities/controlls";
import InputsSelection from "@/components/home/InputsSelection.vue";
import apiDocs from "~/utilities/api-docs";

// Defin Route
const route = useRoute();
const topicId = route.fullPath.split("/").pop();
const subjectTitle = String(route.fullPath.split("/")[2]).toString().replaceAll('%20', ' ');

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

const userToken = useCookie("signInUserToken");

// Define Ref State
const status = ref("pending"); // Initial Status State
const topic = ref([]); // Initial Topics State
const slicedData = ref(); // Initial slice data to 9

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

// current page data
const currentPage = ref(1);
const pageSize = ref();

// Then, update fetchTopics to call sliceData after data is loaded
const fetchTopics = async (params) => {
  const url = userToken.value
    ? apiDocs.topics.filterTopicsByUser.replace(
        "{userId}",
        userToken.value?._id
      )
    : apiDocs.topics.filterTopics;

  try {
    status.value = "pending";
    const response = await $fetch(url, {
      params: params,
    });

    // Call State Define above
    topic.value = response;
    status.value = "success";

    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
  } catch (error) {
    status.value = "error";
    slicedData.value = [];
  }
};

// Call Fetch Topics function
fetchTopics({});

//  assigning page size based on screen sizes
if (isGreaterToXL) {
  pageSize.value = 12; // 12 topic cards
} else if (isGreaterToLG) {
  pageSize.value = 9; // 9 topic cards
} else if (isGreaterToMD) {
  pageSize.value = 6; // 6 topic cards per page
} else {
  pageSize.value = 4; // 4 topics card per page
}

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
    if (screenWidth.value >= 1280) {
      pageSize.value = 12;
    } else if (screenWidth.value >= 1024 && screenWidth.value < 1280) {
      pageSize.value = 9;
    } else if (screenWidth.value >= 768 && screenWidth.value < 1024) {
      pageSize.value = 6;
    } else if (screenWidth.value >= 640 && screenWidth.value < 768) {
      pageSize.value = 4;
    } else {
      pageSize.value = 4;
    }

    // slice data per page size
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
  }
);

// once pages are more than 5, handle pagination
const nextPage = () => {
  currentPage.value++;
  currentPage.value =
    currentPage.value > totalPages.value ? totalPages.value : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
};

const prevPage = () => {
  currentPage.value--;
  currentPage.value = currentPage.value < 1 ? 1 : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
};

// loadoing indicator
const { progress, isLoading } = useLoadingIndicator();

// Define Filters Reactive State
const filters = reactive({
  level: null,
  subject: null,
});

const level = ref(); // Initial Level State
// watch emits changes
watch(filters, (filters) => {
  fetchTopics({
    level: filters.level.toString(),
    subject: filters.subject.toString(),
  });
});
</script>

<template>
  <NuxtLayout name="home-layout">
    <div class="wrapper-container" :class="{ ' animate-pulse': isLoading }">
      <HeroSection />
        <InputsSelection
          @emit-level="level = $event"
          @emit-standard="filters.level = $event"
          @emit-subject="filters.subject = $event"
        />
        <TabBar 
          :subject-title="subjectTitle"
          :topic-id="topicId"
        />
      <div
        v-if="status === 'pending'"
        class="flex flex-col justify-center items-center"
      >
        <LoadingIndicator :is-loading="true" />
      </div>
      <!-- Status Error -->
      <div v-else-if="status === 'error'">Error: {{ error?.message }}</div>

      <!-- Status Success -->
      <div v-else-if="status == 'success'" class="">
        <!-- client only -->
        <ClientOnly v-if="slicedData?.length > 0">
          <div class="w-full flex flex-col">
            <div class="flex items-start gap-4">
              <!-- Topic Cards are in Grid -->
              <div class="flex flex-col items-start container">
                <div
                  class="!grid 3xl:grid-cols-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 my-5 grid-col">
                  <TopicCard
                    v-for="topic in slicedData"
                    :key="topic._id"
                    :topic-id="topic._id"
                    :topic-image="topic.thumbnail"
                    :topic-title="topic.name"
                    :topic-description="topic.descriptions"
                    :topic-duration="
                      topic.topic_duration ? topic.topic_duration : '10 min'
                    "
                    :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
                    :topic-views="topic.views ? topic.views : 0"
                    :topic-level="level"
                    :topic-standard="topic.level.name"
                    :subject-name="topic.subject.name"
                    :topic-viewed="topic.isViewed"
                    :topic-progress="topic.progressPercent"
                  />
                </div>
              </div>
            </div>

            <!-- pagination numbers based on data length greater to 9 -->
            <div class="flex justify-center my-5">
              <div v-if="totalPages <= 5" class="flex justify-center gap-2">
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
              <div v-else class="flex justify-center gap-2">
                <!-- previous -->
                <div
                  class="flex justify-center items-center"
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
                  class="flex justify-center items-center"
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
      <div class="w-full flex flex-col" v-else>
        <div class="" v-if="slicedData?.length === 0">
          Try to refresh the page, Something went Wrong
        </div>

        <!-- client only  -->
        <ClientOnly v-else>
          <div
            class="!grid 3xl:grid-cols-5 lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-4 my-5"
          >
            <!-- container filter -->
            <div
              class="sticky top-0 z-10 xl:flex flex-col hidden items-start px-4 py-2 my-5 w-1/4 bg-white custom-box-shadow"
            >
              <h2 class="text-medium font-bold tracking-wider">Filters</h2>
            </div>
            <!-- Topic Cards are in Grid -->
            <div class="flex flex-col items-start">
             <p class="text-small font-medium">Viewing {{ topic.length }} Results</p>
              <div
                class="!grid 3xl:grid-cols-4 xl:grid-cols-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 my-5 grid-col"
              >
                <TopicCard
                  v-for="topic in slicedData"
                  :key="topic._id"
                  :topic-id="topic._id"
                  :topic-image="topic.thumbnail"
                  :topic-title="topic.name"
                  :topic-description="topic.descriptions"
                  :topic-duration="
                    topic.topic_duration ? topic.topic_duration : '10 min'
                  "
                  :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
                  :topic-views="topic.views ? topic.views : 0"
                  :topic-level="level"
                  :topic-standard="topic.level.name"
                  :subject-name="topic.subject.name"
                  :topic-viewed="topic.isViewed"
                  :topic-progress="topic.progressPercent"
                />
              </div>
            </div>

            <!-- pagination numbers based on data length greater to 9 -->
            <div class="flex justify-center my-5">
              <div v-if="totalPages <= 5" class="flex justify-center gap-2">
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

              <div v-else class="flex justify-center gap-2">
                <!-- previous -->
                <div
                  class="flex justify-center items-center"
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
                  class="flex justify-center items-center"
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
      </div>
    </div>
  </NuxtLayout>
</template>
