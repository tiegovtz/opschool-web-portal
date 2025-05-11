<script setup>
import HeroSection from "~/components/home/HeroSection.vue";
import TopicCard from "~/components/home/TopicCard.vue";
import TabBar from "~/components/home/TabBar.vue";
import LoadingIndicator from "~/components/loading/loadingIndicator.vue";
import { ref, computed, onMounted, watch } from "vue";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  screenWidth,
} from "@/utilities/controlls";
import InputsSelection from "~/components/home/InputsSelection.vue";
import apiDocs from "~/utilities/api-docs";
import {
  filterKeyDataFromArrayOfJson,
  removeDataFromArrayOfJson,
} from "~/utilities/filterJson";
import customGridOne from "~/components/home/customGridOne.vue";
import customGridTwo from "~/components/home/customGridTwo.vue";
import DropDownMenu from "~/components/customDropDown/dropDownMenu.vue";
import SubjectCard from "~/components/home/SubjectCard.vue";
import { layoutEffect } from "~/utilities/controlls";
import { fetchAsyncData } from "~/composable/useAsyncFetch";

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
let tab = route.query?.tab;

// Define Ref state
const error = ref(); // Initial Error State
const status = ref("pending"); // Initial Status State
const data = ref([]); // Initial Topics State
const slicedData = ref(); // Initial slice data to 9
const hideFilter = ref(false); // Initial Hide Filters
const activeTab = ref("home"); // Initial Active Tab State
const filterValue = ref(); // Initial Filter Value State
const subjectId = ref(); // Initial subjectId Value State
const seeMoreDetails = ref(route.query?.subject?.toLowerCase() ?? null); // Initial See More

// Define Filters Reactive State
const filters = reactive({
  level: null,
  subject: null,
});

// loadoing indicator
const { progress, isLoading } = useLoadingIndicator();

// Checking Tab if is corresponde to route
if (tab) {
  tab == "experiments" ? (activeTab.value = "Experiments") : "";
  tab == "video" ? (activeTab.value = "Video") : "";
  tab == "audio" ? (activeTab.value = "Audio") : "";
  tab == "interactive" ? (activeTab.value = "Interactive Books") : "";
}

// First, fix the sliceData function
const sliceData = (start, end) => {
  if (!data || !Array.isArray(data.value) || data.value.length === 0) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (data.value?.length <= pageSize.value) {
    slicedData.value = data.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = data.value?.slice(start, end);
};

// current page data
const currentPage = ref(1);
const pageSize = ref();

// Then, update fetchData to call sliceData after data is loaded
const fetchData = async (params) => {
  let url;
  data.value = [];
  status.value = "pending";
  error.value = null;
  const tab = activeTab.value.toLowerCase();

  if (userToken.value) {
    // Check for specific tabs
    if (tab === "experiments") {
      url = apiDocs.experiments.getPublicExperiments;
      params = {
        ...params,
      };
    } else if (tab === "video") {
      url = apiDocs.videos.getPublicVideo;
      params = {
        ...params,
        videoType: "Conceptual",
      };
    } else if (tab === "othervideo") {
      url = apiDocs.videos.getPublicVideo;
      params = {
        ...params,
        videoType: "others",
      };
    } else if (tab === "home") {
      url = apiDocs.subjects.getPublicSubjects;
      params = {
        ...params,
      };
    } else if (tab === "interactive books") {
      url = apiDocs.topics.filterTopics;
      params = {
        ...params,
        userId: userToken.value?._id,
      };
    }

    // Subject-specific tab overrides
    if (subjectId.value) {
      if (tab === "experiments") {
        url = apiDocs.experiments.getPublicExperimentsBySubjectId.replace(
          "{subjectId}",
          subjectId.value
        );

        params = {
          ...params,
        };
      } else if (tab === "video") {
        url = apiDocs.videos.getPublicVideoBySubjectId.replace(
          "{subjectId}",
          subjectId.value
        );

        params = {
          ...params,
          videoType: "Conceptual",
        };
      } else if (tab === "othervideo") {
        url = apiDocs.videos.getPublicVideoBySubjectId.replace(
          "{subjectId}",
          subjectId.value
        );

        params = {
          ...params,
          videoType: "others",
        };
      } else if (tab === "interactive books") {
        url = apiDocs.topics.getSubjectId.replace(
          "{subjectId}",
          subjectId.value
        );
        params = {
          ...params,
          userId: userToken.value?._id,
        };
      }
    }
  } else {
    if (params) {
      url = apiDocs.topics.filterTopics;
    } else {
      url = apiDocs.subjects.getPublicSubjects;
    }
  }

  try {
    const {data:response, status:fetchStatus} = await fetchAsyncData(`tab-${tab}`,()=> $fetch(url, {
      params: {
        ...params,
      },
      headers: {
        Authorization: `Bearer ${useCookie("signInAccessToken").value}`,
      },
    }));
    

    // Call State Define above
    if (subjectId.value) {
      data.value = removeDataFromArrayOfJson(response.value, "isDeleted", true);
    } else if (!subjectId.value && tab !== "home") {
      data.value = filterKeyDataFromArrayOfJson(response.value, "subject.name", [
        "physics",
        "chemistry",
        "mathematics",
        "biology",
        "geography",
      ]);
    } else {
      data.value = removeDataFromArrayOfJson(response.value, "isDeleted", true);
    }

    status.value = fetchStatus.value;

    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
  } catch (err) {
    status.value = "error";
    error.value = err;
  }
};

// Call Fetch Topics function
fetchData();

// shuffle Subject
const shuffleSubject = (subjects) => {
  return subjects
    .map((subject) => ({ subject, sort: Math.random() })) // Assign a random sort key
    .sort((a, b) => a.sort - b.sort) // Sort by random key
    .map(({ subject }) => subject); // Extract shuffled choices
};

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
  if (data && Array.isArray(data.value)) {
    return Math.ceil(data.value?.length / pageSize.value);
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
const nextPage = (event) => {
  currentPage.value++;
  currentPage.value =
    currentPage.value > totalPages.value ? totalPages.value : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
};

const prevPage = (event) => {
  currentPage.value--;
  currentPage.value = currentPage.value < 1 ? 1 : currentPage.value;
  sliceData(
    (currentPage.value - 1) * pageSize.value,
    currentPage.value * pageSize.value
  );
};

const level = ref(); // Initial Level State

// watch emits changes
watch(filters, (newFilters) => {
  if (newFilters.level !== null && newFilters.subject !== null) {
    fetchData({
      level: filters.level.toString(),
      subject: filters.subject.toString(),
    });
  }
});

// Call sliceData after data is loaded
sliceData(
  (currentPage.value - 1) * pageSize.value,
  currentPage.value * pageSize.value
);

// watch current tab
watch(
  () => activeTab.value,
  (activeTab) => {
    if (activeTab) {
      seeMoreDetails.value = null;
      if (activeTab.toLowerCase() === "home") {
        subjectId.value = "";
        fetchData();
      } else if (activeTab.toLowerCase() === "interactive books") {
        fetchData();
      } else if (activeTab.toLowerCase() === "experiments") {
        fetchData();
      } else if (activeTab.toLowerCase() === "video") {
        fetchData();
      } else if (activeTab.toLowerCase() === "othervideo") {
        fetchData();
      } else if (activeTab.toLowerCase() === "audio") {
        // fetchData();
        data.value = [];
      }
    }
  }
);

// Watch User Token
watch(
  () => userToken.value,
  (userToken) => {
    if (userToken == null || userToken == undefined) {
      activeTab.value = "home";
      layoutEffect.value = "grid";
      fetchData();
    }
  }
);

// Watch Filter Value
watch(
  () => filterValue.value,
  (newfilterValue) => {
    if (Object.keys(newfilterValue).length > 0) {
      // Remove empty or falsy values
      const filteredParams = Object.fromEntries(
        Object.entries(newfilterValue).filter(([_, v]) => v)
      );
      fetchData(filteredParams);
      data.value = [];
    } else {
      // Call sliceData after data is loaded
      fetchData();
    }
  }
);

// watch Subject Id
watch(
  () => subjectId.value,
  (valueId) => {
    if (valueId) {
      activeTab.value = "Interactive Books";
    }
  }
);
</script>

<template>
  <NuxtLayout name="home-layout">
    <!-- User Has a Token -->
    <section v-if="userToken" :class="[' ', { ' animate-pulse': isLoading }]">
      <HomeSearchbar appearance="rounded" />
      <TabBar
        :is-logged-in="true"
        @emit-active-tab="activeTab = $event"
        :active-tab="activeTab"
      />

      <!-- container filter Mobile -->
      <div class="flex items-center justify-between py-2 xl:hidden">
        <p class="font-medium text-small">Viewing {{ data?.length }} Results</p>
        <div
          class="flex items-center gap-2 cursor-pointer text-deepBlue"
          @click="hideFilter = !hideFilter"
        >
          <Icon name="mage:filter-fill" size="24" class="" />
          <p class="text-medium">Filters</p>
        </div>

        <!-- Side Bar Container Filter For Mobile View Only -->
        <div
          :class="[
            'fixed top-0 left-0 h-full w-full flex flex-col items-start justify-center transition-all duration-700 ease-in-out bg-black/40',
            hideFilter ? 'z-30' : '-z-30',
          ]"
        >
          <div class="w-full h-full bg-white md:w-80">
            <!-- Close Button -->
            <div class="flex items-center justify-end">
              <button
                class="flex items-center justify-center w-10 h-10 p-2 cursor-pointer rounded-bl-md bg-deepBlue"
                @click="hideFilter = !hideFilter"
              >
                <Icon
                  name="formkit:close"
                  size="24"
                  class="font-bold text-white"
                />
              </button>
            </div>

            <div class="flex flex-col gap-4 mt-10">
              <!-- Home Drop Down Menu -->
              <DropDownMenu
                :active-tab="activeTab"
                @emit-update-filter-value="filterValue = $event"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- LayoutEffect  -->
      <div class="flex items-center justify-end gap-2">
        <Icon
          name="bxs:grid-alt"
          size="1.5rem"
          @click="layoutEffect = 'grid'"
          :class="[
            'cursor-pointer transition-all duration-500 ease-in-out',
            layoutEffect == 'grid' ? '!text-darkBlue' : 'text-oceanBlue',
          ]"
        />
        <Icon
          name="fa-solid:list"
          size="1.5rem"
          @click="layoutEffect = 'list'"
          :class="[
            'text-oceanBlue cursor-pointer transition-all duration-500 ease-in-out',
            layoutEffect == 'list' ? '!text-darkBlue' : 'text-oceanBlue',
          ]"
        />
      </div>
      <div class="flex items-center justify-center w-full gap-4 xl:items-start">
        <!-- container filter Desktop -->
        <div
          class="sticky flex-col items-start hidden w-1/4 p-2 pb-4 my-5 bg-white rounded-md xl:flex top-10 custom-box-shadow"
        >
          <!-- Home Drop Down Menu -->
          <DropDownMenu
            @emit-update-filter-value="filterValue = $event"
            :active-tab="activeTab"
            :filter-value="[]"
          />

          <!-- <HomeDropFilters :filter-data="keys" @emit-update-filter-value="filterValue = $event" /> -->
        </div>

        <!-- data are in Grid -->
        <div class="w-full xl:w-3/4">
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
            <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" />
            <p class="text-center">
              Oops! Something went wrong.<br />
              Try refreshing the page or check your internet connection.
            </p>

            <span
              v-if="
                (Array.isArray(filterValue) && filterValue.length > 0) ||
                (typeof filterValue == 'object' &&
                  Object.keys(filterValue).length > 0)
              "
              @click="filterValue = []"
              class="cursor-pointer text-oceanBlue"
            >
              Reset filters
            </span>
          </div>

          <!-- Status Success -->
          <div
            v-else-if="status == 'success' && subjectId && data.length > 0"
            class=""
          >
            <ClientOnly>
              <customGridOne v-if="activeTab.toLowerCase() === 'home'">
                <template #data>
                  <!-- Subject Cards are in Grid -->
                  <SubjectCard
                    v-for="subject in shuffleSubject(slicedData)"
                    :key="subject._id"
                    :subject-id="subject._id"
                    :subject-name="subject.name"
                    :subject-image="subject.thumbnail"
                    :total-views="subject.views ?? 0"
                    :is-logged-in="userToken != null || userToken != undefined"
                    @emit-subject-name="activeTab = $event"
                    @emit-subject-id="subjectId = $event"
                  />
                </template>
              </customGridOne>

              <customGridOne
                v-else-if="activeTab.toLowerCase() === 'interactive books'"
              >
                <template #data>
                  <!-- Topic Cards are in Grid -->
                  <TopicCard
                    v-for="topic in slicedData"
                    :key="topic._id" :topic-id="topic._id"
                    :topic-image="topic.thumbnail" :topic-title="topic.name"
                    :topic-description="topic.descriptions"
                    :topic-duration="topic.topic_duration ? topic.topic_duration : '10 min'"
                    :topic-likes="topic.topic_likes ? topic.topic_likes : 100"
                    :topic-level="level" :topic-standard="topic.level?.name"
                    :subject-name="topic.subject?.name" :topic-viewed="topic.isViewed"
                    :topic-progress="topic.avgProgress"
                    :topic-views="topic.viewedBy?.length ? topic.viewedBy?.length : topic.views ? topic.views : 0"
                  />
                </template>
              </customGridOne>

              <customGridOne
                v-else-if="activeTab.toLowerCase() === 'experiments'"
              >
                <template #data>
                  <!-- Experiment Cards are in Grid -->
                  <ExperimentsCard
                    v-for="experiment in slicedData"
                    :key="experiment._id"
                    :experiment-id="experiment._id"
                    :experiment-thumbnail="experiment.thumbnail"
                    :experiment-title="experiment.title"
                    :experiment-description="experiment.description"
                    :experiment-type="experiment.category"
                    :experiment-subject="experiment.subject?.name"
                    :experiment-level="experiment.level?.name"
                    :experiment-name="experiment.name"
                    :experiment-file-url="experiment.stepsFileUrl"
                  />
                </template>
              </customGridOne>

              <customGridOne
                v-else-if="
                  activeTab.toLowerCase() === 'video' ||
                  activeTab.toLowerCase() === 'othervideo'
                "
              >
                <template #data>
                  <!-- Video Cards are in Grid -->
                  <VideoCard
                    v-for="video in slicedData"
                    :key="video._id"
                    :video-id="video._id"
                    :video-name="video.name"
                    :video-thumbnail="video.thumbnail"
                    :video-file-url="video.videoFileUrl"
                    :is-deleted="video.isDeleted"
                    :video-description="video.description"
                    :video-subject="video.subject?.name"
                    :video-type="video.videoType"
                  />
                </template>
              </customGridOne>
              <div v-else-if="activeTab.toLowerCase() === 'audio'">
                <MessageTopicNotFound
                  message="This page will be updated soon"
                />
              </div>
            </ClientOnly>

            <!-- pagination numbers based on data length greater to 9 -->
            <div v-if="totalPages > 1" class="flex justify-center my-5">
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
              <div v-else class="flex items-center gap-2">
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

                <div
                  class="overflow-x-scroll scrollbar-none max-w-[250px] flex items-center justify-start gap-2"
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

            <!-- <PaginationSliderBtn  v-if="totalPages > 1"
                  :pages="totalPages" :current-page="currentPage"
                  @send-slider-page-number="currentPage = $event"
                  @sendSliderCurrentPageNumber="sliceData(($event - 1) * pageSize, $event * pageSize)"
                /> -->
          </div>

          <!-- data sorted if no subject -->
          <div
            v-else-if="status == 'success' && !subjectId && data.length > 0"
            class=""
          >
            <ClientOnly>
              <HomeCustomScrollView
                :shuffle-subject="shuffleSubject"
                :see-more-details="seeMoreDetails"
                :data="data"
                :active-tab="activeTab"
                @emittedSubjectId="subjectId = $event"
                @emittedActiveTab="activeTab = $event"
              />
            </ClientOnly>
          </div>
          <MessageTopicNotFound v-else />
        </div>
      </div>
    </section>

    <!-- User has no token -->
    <section v-else :class="[' ', { ' animate-pulse': isLoading }]">
      <HeroSection />
      <InputsSelection
        @emit-level="level = $event"
        @emit-standard="filters.level = $event"
        @emit-subject="filters.subject = $event"
      />
      <TabBar />

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
        <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" />
        <p class="text-center">
          Oops! Something went wrong.<br />
          Try refreshing the page or check your internet connection.
        </p>
      </div>

      <!-- Status Success -->
      <div v-else-if="status == 'success'" class="">
        <!-- client only -->
        <ClientOnly v-if="data.length > 0">
          <div class="flex flex-col w-full">
            <customGridTwo
              v-if="filters.level !== null && filters.subject !== null"
            >
              <template #data>
                <!-- Topic Cards -->
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
                  :topic-views="
                    topic.viewedBy?.length
                      ? topic.viewedBy?.length
                      : topic.views
                      ? topic.views
                      : 0
                  "
                  :topic-level="level"
                  :topic-standard="topic.level?.name"
                  :subject-name="topic.subject?.name"
                  :topic-viewed="topic.isViewed"
                  :topic-progress="topic.avgProgress"
                />
              </template>
            </customGridTwo>

            <customGridTwo v-else>
              <template #data>
                <!-- Subject Cards are in Grid -->
                <SubjectCard
                  v-for="subject in shuffleSubject(slicedData)"
                  :key="subject._id"
                  :subject-id="subject._id"
                  :subject-name="subject.name"
                  :subject-image="subject.thumbnail"
                  :total-views="subject.views ?? 0"
                  :is-logged-in="userToken != null || userToken != undefined"
                  @emit-subject-name="activeTab = $event"
                />
              </template>
            </customGridTwo>

            <!-- pagination numbers based on data length greater to 9 -->
            <div v-if="totalPages > 1" class="flex justify-center my-5">
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
      <div class="flex flex-col w-full" v-else>
        <p class="text-center text-medium">
          Try to refresh the page, Something went Wrong
        </p>
      </div>
    </section>
  </NuxtLayout>
</template>
