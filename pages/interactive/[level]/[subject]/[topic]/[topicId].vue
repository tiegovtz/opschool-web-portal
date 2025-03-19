<script setup>
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import experimentParser from "~/utilities/parsers/experimentParser";
import modelParser from '~/utilities/parsers/modelParser'
import videoParser from "~/utilities/parsers/videoParser";
import { experimrntUrl } from "~/utilities/controlls";
// Define meta info about page
useHead({
  title: "TIE - Tanzania/volumetric analysis",
  meta: [
    {
      name: "description",
      content:
        "TIE is a digital learning platform providiclearng quality educational resources for students and teachers in Tanzania.",
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

// Define State
const userToken = useCookie("signInUserToken");
//  chapters informations
const chapters = reactive({
  list: null,
  notes: null,
  status: "pending",
  error: null,
  currentChapterId: null,
  notesStatus: 'pending'
});

// flag for toggling experiment fullscreeen
const isFullscreen = ref(false);

// function for toggling  experiment fullscreeen
const fullScreen = () => {

  // experiment container
  const experimentContainer = document.getElementById(`experiment-container`);
  if (import.meta.client) {
    if (!isFullscreen.value) {
      experimentContainer.requestFullscreen();

    } else {
      document.exitFullscreen();

    }
    // set flag to opposite
    isFullscreen.value = !isFullscreen.value;
  }
}

// const istoggleSidebar = ref(false)

const toggleSidebar = () => {
  if (import.meta.client) {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('right-0')
  }
}

const route = useRoute();
const topicId = route.fullPath.split("/").pop();
const topicTitle = String(route.fullPath.split("/")[4]).toString().replaceAll('%20', ' ');
const topicStandard = String(route.fullPath.split("/")[2]).toString().replaceAll('%20', ' ');
const topicLevel = String(route.fullPath.split("/")[3]).toString().replaceAll('%20', ' ');



// fetch chapters information
const getChapter = async (chapterId) => {
  chapters.notesStatus = "pending";
  chapters.currentChapterId = chapterId;
  await $fetch(`/api/topics/chapters/${chapterId}`)
    .then((response) => {
      chapters.notesStatus = 'success'
      chapters.notes = response;
    })
    .catch((error) => {
      chapters.notesStatus = 'error'
      chapters.error = error;
    });
};

// pull chapters
await useFetch(`/api/topics/${topicId}`)
  .then((response) => {
    chapters.status = "success";
    chapters.list = response.data.value;
    getChapter(response.data.value[0]?._id);
  })
  .catch((error) => {
    (chapters.status = "error"), (chapters.error = error);
  });

definePageMeta({
  middleware: "auth",
});

watch(userToken, (token) => {
  // Get the router instance
  const router = useRouter();

  if (!token) {
    router.replace("/");
  }
});

</script>

<template>
  <NuxtLayout name="home-layout">
    <section v-if="experimrntUrl" class="relative w-full center-height" id="experiment-container">
      <div
        class="absolute top-0 right-0 p-2 cursor-pointer h-10 w-10 rounded-full bg-red-500 flex items-center justify-center"
        @click="experimrntUrl = null">
        <Icon name="formkit:close" size="24" class="text-white font-bold" />
      </div>
      <iframe :src="experimrntUrl" frameborder="0" class="h-full w-full center-height rounded-md !bg-white "></iframe>
      <!-- full screen controls -->
      <div
        class="screen-control absolute bottom-0 right-0 p-2 cursor-pointer h-10 w-10 bg-oceanBlue hover:bg-white hover:text-oceanBlue transition-all duration-500 text-white flex items-center justify-center rounded-md"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'" @click="fullScreen">
        <Icon v-if="isFullscreen" name="qlementine-icons:fullscreen-exit-16" size="24" />
        <Icon v-else name="qlementine-icons:fullscreen-16" size="24" />
      </div>
    </section>
    <section v-else class=" relative w-full h-full inline-flex center-height overflow-hidden">
      <!-- Loading state -->
      <div v-if="chapters.status == 'pending'" class="loading content-height flex items-center justify-center w-full">
        <LoadingIndicator :is-loading="true" />
      </div>

      <!-- Error state -->
      <div v-else-if="chapters.status == 'error'" class="error flex w-full items-center justify-center gap-2 flex-col">
        <MessagePageNotFound message="Error while loading chapter"
          subMessage="Make sure you are connected to the stable internet or try to reload the page" />
      </div>

      <!-- Success state -->
      <div v-else-if="chapters.status == 'success'" class="success w-full flex justify-center">
        <!-- Notes loading -->
        <div v-if="chapters.notesStatus == 'pending'"
          class="flex w-full items-center justify-center lg:w-3/4 scroll-height overflow-y-scroll p-5 flex-col h-full">
          <div class="flex-1 flex items-center justify-center">
            <LoadingIndicator :is-loading="true" />
          </div>
        </div>

        <!-- Notes loaded successfully -->
        <div v-else-if="chapters.notesStatus == 'success'"
          class="lg:w-3/4 w-full scroll-height overflow-y-scroll py-5 lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          <!-- Topic Level Standard and Subject Indicator -->
          <div class="flex items-center justify-between ">
            <div class="flex items-center gap-2">
              <NuxtLink to="/" class="capitalize text-oceanBlue text-small hidden md:flex items-center gap-2">
                {{ topicLevel != null && topicLevel != undefined && topicLevel != "null" ? topicLevel : `Secondary` }}
                <Icon name="weui:arrow-outlined" size="18" class="text-black" />
              </NuxtLink>

              <NuxtLink to="/" class="capitalize text-oceanBlue text-small hidden md:flex items-center gap-2">
                {{ topicStandard != null && topicStandard != undefined && topicStandard != "null" ? topicStandard :
                  `Form One` }}
                <Icon name="weui:arrow-outlined" size="18" class=" text-black" />
              </NuxtLink>

              <p class="text-medium uppercase md:capitalize font-medium">
                {{ topicTitle != null && topicTitle != undefined && topicTitle != "null" ? topicTitle : `Introduction to
                Physics` }}
              </p>
            </div>

            <!-- Header Description -->
            <div class="flex lg:hidden" @click="toggleSidebar()">
              <Icon name="basil:menu-outline" class="cursor-pointer" size="2rem" />
            </div>
          </div>

          <!-- Description -->
          <div class="content-view w-full flex flex-col gap-2 py-3" @click="toggleSidebar()">
            <p class="notes md:px-4" v-html="experimentParser(modelParser(videoParser(chapters.notes?.content)))"></p>
          </div>
        </div>

        <!-- Notes failed to load -->
        <div v-else class="flex w-full items-center justify-center lg:w-3/4 scroll-height overflow-y-scroll p-5">
          <MessageTopicNotFound message="This chapter currently not available" />
        </div>

        <!-- Sidebar -->
        <div
          class="sidebar transition-all duration-700 ease-in-out absolute -right-[500px] lg:right-0 top-0 md:w-[400px] w-full lg:w-1/4 h-full p-2  lg:static bg-white">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-medium font-medium capitalize pt-5">
              Chapters
            </h1>
            <!-- toggle menu -->
            <div
              class="hover:bg-oceanBlue cursor-pointer rounded-full w-5 h-5 flex lg:hidden items-center justify-center group transition-all duration-500 ease-in-out"
              @click="toggleSidebar">
              <!-- Cancel Icon -->
              <Icon name="iconoir:cancel" size="18" class="group-hover:text-white" />
            </div>
          </div>
          <!-- UL list of chapters -->
          <ChapterContainer :chapters="chapters?.list" @emit-chapter-id="getChapter($event)"
            :active-chapter-id="chapters.currentChapterId" />
        </div>
      </div>

      <!-- Default/idle state -->
      <div v-else class="idle">
        <p>Try to reload the page, something went wrong</p>
      </div>
    </section>
  </NuxtLayout>
</template>