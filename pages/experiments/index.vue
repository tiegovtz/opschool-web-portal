<script setup>
import HeroSection from "@/components/home/HeroSection.vue";
import TabBar from "@/components/home/TabBar.vue";
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import { ref, computed, onMounted, watch } from "vue";
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  screenWidth,
} from "@/utilities/controlls";
import apiDocsFile from "~/utilities/api-docs";
const apiDocs = apiDocsFile.setup()
import { HomeCustomScrollView } from "#components";
import { filterKeyDataFromArrayOfJson, removeDataFromArrayOfJson } from '~/utilities/filterJson';
import { fetchAsyncData } from "~/composable/useAsyncFetch";

const route = useRoute();
// const router = useRouter();
const experimentId = route.fullPath.split("/").pop();
const experimentTitle = String(route.fullPath.split("/")[4])
  .toString()
  .replaceAll("%20", " ")
  .replaceAll("-", " ");
const experimentStandard = String(route.fullPath.split("/")[2])
  .toString()
  .replaceAll("%20", " ");
const experimentLevel = String(route.fullPath.split("/")[3])
  .toString()
  .replaceAll("%20", " ");
const experimentUrl = `/api/experiments/${experimentId}`;

// Header
useHead({
  title: `TIE - Tanzania/${experimentTitle}`,
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

// Define Ref state variables
const error = ref(null); // Initial Error State
const status = ref("pending"); // Initial Status State
const experiments = ref(); // Initial experiments State
const slicedData = ref(); // Initial slice data to 9

// Define Cookie
const auth_token = useCookie("signInAccessToken").value;
const userToken = useCookie("signInUserToken");

// First, fix the sliceData function
const sliceData = (start, end) => {
  if (
    !experiments.value ||
    !Array.isArray(experiments.value) ||
    experiments.value.length === 0
  ) {
    slicedData.value = [];
    return;
  }

  // If only one page of data or less, return all data
  if (experiments.value.length <= pageSize.value) {
    slicedData.value = experiments.value;
    return;
  }

  // Otherwise slice the data
  slicedData.value = experiments.value.slice(start, end);
};

// Define current page and Page size variable
const currentPage = ref(1);
const pageSize = ref();

// Fetch Experiments From Server
const fetchExperiments = async () => {
  try {
    status.value = "pending";
    const {data:response,status:fetchStatus} = await fetchAsyncData(`experiments`,()=>$fetch(apiDocs.experiments.getPublicExperiments, {
      method: "GET",
    }));

    // Call State Define above
    experiments.value = removeDataFromArrayOfJson(response.value, "isDeleted", true);
    experiments.value = filterKeyDataFromArrayOfJson( experiments.value,"subject.name",['physics','chemistry','mathematics','biology','geography']);
    status.value = fetchStatus.value;

    // Call sliceData after data is loaded
    sliceData(
      (currentPage.value - 1) * pageSize.value,
      currentPage.value * pageSize.value
    );
  } catch (error) {
    status.value = "error";
    error.value = error;
    console.log(error);
  }
};

// Call FetchExperiments Function
fetchExperiments();

//  assigning page size based on screen sizes
if (isGreaterToXL) {
  pageSize.value = 12; // 12 experiments cards
} else if (isGreaterToLG) {
  pageSize.value = 9; // 9 experiments cards
} else if (isGreaterToMD) {
  pageSize.value = 6; // 6 experiments cards per page
} else {
  pageSize.value = 4; // 4 topics card per page
}

// total pages data
const totalPages = computed(() => {
  if (experiments.value && Array.isArray(experiments.value)) {
    return Math.ceil(experiments.value.length / pageSize.value);
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
</script>

<template>
  <NuxtLayout name="home-layout">
    <section :class="[' ', { ' animate-pulse': isLoading }]">
      <!-- User Token Available -->
      <div
        v-if="userToken"
        class="flex flex-col items-center justify-center w-full gap-4 pt-4"
      >
        <HomeSearchbar appearance="rounded" />
        <TabBar :is-logged-in="true" @emit-active-tab="activeTab = $event" />
      </div>

      <!-- User Token Not Available -->
      <div v-else>
        <HeroSection />
        <TabBar />
      </div>

      <div
        v-if="status === 'pending'" v-trusted
        class="flex flex-col items-center justify-center"
      >
        <LoadingIndicator :is-loading="true" />
      </div>

     <!-- Status Error -->
          <div
           
        v-else-if="status === 'error'"
            v-trusted
           
        class="md:min-h-[342px] flex flex-col justify-center items-center"
      >
            <Icon name="codicon:errorr" class="mb-4 text-red-500" size="20" />
            <p class="text-center">
              Oops! Something went wrong.<br />
              Try refreshing the page or check your internet connection.
            </p>
          </div>
      <!-- Status Success -->
      <div v-else-if="status == 'success'" v-trusted>
        <!-- client only -->
        <ClientOnly v-if="slicedData?.length > 0">
          <div class="flex flex-col w-full px-2 lg:px-4" v-trusted>
           <HomeCustomScrollView :data="experiments" active-tab="experiments" />
           
            <!-- pagination numbers based on data length greater to 9 -->
            <div v-if="totalPages > 1" class="flex justify-center my-10" v-trusted>
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
                  @send-page-number="currentPage = $event" v-trusted
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
        <MessageTopicNotFound v-else  v-trusted/>
      </div>
    </section>
  </NuxtLayout>
</template>
