<script setup>
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import experimentParser from "~/utilities/parsers/experimentParser";
import modelParser from '~/utilities/parsers/modelParser'
import videoParser from "~/utilities/parsers/videoParser";
import { experimrntUrl } from "~/utilities/controlls";
import apiDocs from "~/utilities/api-docs";
import QuestionsContainer from "~/components/chapter/questionsContainer.vue";
import { isTokenExpiringSoon, refreshToken } from "~/utilities/jwToken";


const route = useRoute();
const topicId = route.fullPath.split("/").pop();
const topicTitle = String(route.fullPath.split("/")[4]).toString().replaceAll('%20', ' ');
const topicStandard = String(route.fullPath.split("/")[2]).toString().replaceAll('%20', ' ');
const topicLevel = String(route.fullPath.split("/")[3]).toString().replaceAll('%20', ' ');


// Define meta info about page
useHead({
  title: `TIE - Tanzania/${topicTitle}`,
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
  notesStatus: 'pending',
  questions: null,
  number: 1,
  isAttemptingQuizes: false,
});

// flag for toggling experiment fullscreeen
const isFullscreen = ref(false);

// Changer Chapter
const changeChapter = (action) => {
  if (chapters.number >= 1 && chapters.number <= chapters.list?.length) {
    // p = Previous and n = Next
    if (action.toLowerCase() == 'p') {
      chapters.number == 1 ? '' : chapters.number--;
      getChapter(chapters.list[chapters.number - 1]._id);
    }
    else
      if (action.toLowerCase() == 'n') {
        chapters.number == chapters.list?.length ? '' : chapters.number++;
        getChapter(chapters.list[chapters.number - 1]._id);
      }
    // Scroll Up when chapter changed
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scrolling effect
    });
  }
}

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



// fetch chapters information
const getChapter = async (chapterId) => {
  chapters.notesStatus = "pending";
  chapters.currentChapterId = chapterId;

  const expiredSoon = isTokenExpiringSoon(userToken.value, 60)
  if (expiredSoon) {
    await refreshToken().then((response) => {
      console.log(response)
      userToken.value = response?.access_token
    }).catch(() => {
      navigateTo('/auth')
    })

  }

  await $fetch(`/api/topics/chapters/${chapterId}`)
    .then((response) => {
      chapters.notesStatus = 'success'
      chapters.notes = response;
      getQNTopicChapter(chapterId);
    })
    .catch((error) => {
      chapters.notesStatus = 'error'
      chapters.error = error;
    });
};

// Submit Topic viewed Read
const topicViewedRead = async (topicId) => {
  chapters.notesStatus = "pending";
  chapters.currentChapterId = topicId;
  await $fetch(apiDocs.topics.topicViewedRead.replaceAll('{id}', topicId), {
    headers: {
      'Authorization': `Bearer ${useCookie('signInAccessToken').value}`
    }
  })
};

// Fetch Questions by Topic Chapter
const getQNTopicChapter = async (chapterId) => {
  try {
    const response = await $fetch(apiDocs.chapters.getTopicChapterQNs, {
      method: "GET",
      headers: {
        'Authorization': `Bearer ${useCookie('signInAccessToken').value}`
      },
      params: {
        topic: topicId,
        chapter: chapterId,
      }
    })

    if (response) {
      chapters.questions = response;
    }
  } catch (error) {
    console.log(error);
  }
}

// Fetch chapters
await useFetch(`/api/topics/${topicId}`)
  .then((response) => {
    chapters.status = "success";
    chapters.list = response.data.value;
    getChapter(response.data.value[0]?._id);
    // Call Submit Topic Viewed Read
    topicViewedRead(topicId);
  })
  .catch((error) => {
    (chapters.status = "error"), (chapters.error = error);
  });


watch(userToken, (token) => {
  // Get the router instance
  const router = useRouter();

  if (!token) {
    router.replace("/");
  }
});

onMounted(async () => {
  // Trigger MathJax rendering
  window.MathJax.typeset();

  // Call functin for set Pic Center
  setPicCenter();

});

// Watch chapter notes and Then, Set Pic Center
watch(() => chapters.notes, (newNotes) => {
  if (newNotes) {
    setPicCenter();
  }
})

// set Pic center
const setPicCenter = async () => {
  // Wait for MathJax to finish rendering (you can wrap this in a Promise or check for its readiness)
  await new Promise(resolve => setTimeout(resolve, 500));

  // Perform the image styling after a small delay
  setTimeout(() => {
    document.querySelectorAll(".notes > p").forEach((p) => {
      let images = p.querySelectorAll("img");
      if (images.length === 1 && p.childNodes.length === 1) {
        images[0].style.display = "block";
        images[0].style.margin = "0 auto";
      }
    });
  }, 500);
}


definePageMeta({
  middleware: ["auth"],
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

    <!-- quiz -->
    <div v-else-if="chapters.questions && chapters.isAttemptingQuizes" class="relative">
      <div class="flex items-center justify-end" @click="chapters.isAttemptingQuizes = false">
        <div class="p-2 cursor-pointer h-10 w-10 rounded-full bg-red-500 flex items-center justify-center">
          <Icon name="formkit:close" size="24" class="text-white font-bold" />
        </div>
      </div>
      <!-- Chapter Questions -->
      <QuestionsContainer :questions="chapters?.questions"
       :is-attempting-quiz="chapters.isAttemptingQuizes"
       :change-chapter="changeChapter"
       :chapters-list="chapters.list?.length"
       :chapters-number="chapters?.number"
       />

    </div>
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
          class="flex w-full items-center justify-center lg:w-3/4 lg:scroll-height lg:overflow-y-scroll p-5 flex-col h-full">
          <div class="flex-1 flex items-center justify-center">
            <LoadingIndicator :is-loading="true" />
          </div>
        </div>

        <!-- Notes loaded successfully -->
        <div v-else-if="chapters.notesStatus == 'success'"
          class="lg:w-3/4 w-full lg:scroll-height lg:overflow-y-scroll py-5 lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
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
          <div class="content-view relative w-full flex flex-col gap-2 py-3 justify-center">
            <!-- <p class="notes md:px-4 max-w-7xl mx-auto"
              v-math-html="experimentParser(modelParser(videoParser(chapters.notes?.content)))"></p> -->

            <!-- Chapter Notes -->
            <div class="notes md:px-4 max-w-7xl mx-auto" v-mathjax
              v-html="experimentParser(modelParser(videoParser(chapters.notes?.content)))">
            </div>

            <!-- Chapter Button -->
            <div v-if="chapters.questions && chapters.questions?.length > 0" class="flex items-center justify-center w-full">
              <button
                class="bg-oceanBlue hover:bg-deepBlue px-4 text-white h-10 rounded-md cursor-pointer transition-colors duration-500 ease-in-out uppercase"
                @click="chapters.isAttemptingQuizes = true;">
                Attempt This Quiz
              </button>
            </div>

            <!-- Next and Previous chapter Action -->
            <div class="flex lg:hidden flex-row-reverse items-center justify-between">
              <!-- Next Chapter -->
              <button @click="changeChapter('n')" :disabled="chapters.number == chapters.list?.length"
                :class="{ 'opacity-0': chapters.number == chapters.list?.length }"
                class="flex items-center justify-center gap-4 bg-oceanBlue hover:bg-deepBlue rounded-md h-10 px-4 text-white">
                <p class="capitalize flex gap-2">Next <span class="hidden md:flex"></span></p>
                <div class="flex items-center justify-center h-4 w-4 rounded-full bg-white animate-bounce-horizontal">
                  <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue" />
                </div>
              </button>
              <!-- Previous Chapter -->
              <button @click="changeChapter('p')" :disabled="chapters.number <= 1"
                :class="{ 'opacity-0': chapters.number <= 1 }"
                class="flex items-center justify-center gap-4 bg-oceanBlue hover:bg-deepBlue rounded-md h-10 px-4 text-white">
                <div class="flex items-center justify-center h-4 w-4 rounded-full bg-white animate-bounce-horizontal">
                  <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue transform rotate-180" />
                </div>
                <p class="capitalize flex gap-2">Previous <span class="hidden md:flex">Chapter</span></p>
              </button>
            </div>

          </div>
        </div>

        <!-- Notes failed to load -->
        <div v-else class="flex w-full items-center justify-center lg:w-3/4 lg:scroll-height lg:overflow-y-scroll p-5">
          <MessageTopicNotFound message="This chapter currently not available" />
        </div>

        <!-- Sidebar -->
        <div
          class="sidebar transition-all duration-700 ease-in-out absolute -right-[500%] lg:right-0 top-0 md:w-[400px] w-full lg:w-1/4 h-full p-2  lg:static bg-white">
          <div class="flex items-center justify-between mb-4">
            <h1 class="text-medium font-medium capitalize pt-5">
              Subtopic
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
            :active-chapter-id="chapters.currentChapterId" @click="toggleSidebar" />
        </div>
      </div>

      <!-- Default/idle state -->
      <div v-else class="idle">
        <p>Try to reload the page, something went wrong</p>
      </div>
    </section>
  </NuxtLayout>
</template>