<script setup>
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import experimentParser from "~/utilities/parsers/experimentParser";
import modelParser from "~/utilities/parsers/modelParser";
import videoParser from "~/utilities/parsers/videoParser";
import { currentTopic, experimrntUrl } from "~/utilities/controlls";
import QuestionsContainer from "~/components/chapter/questionsContainer.vue";
import { isTokenExpiringSoon, refreshToken } from "~/utilities/jwToken";
import apiDocs from "~/utilities/api-docs";
import { updateChapterProgress } from "~/utilities/progress";

const route = useRoute();
const router = useRouter();
const topicId = route.fullPath.split("/").pop();
const topicTitle = String(route.fullPath.split("/")[4])
  .toString()
  .replaceAll("%20", " ");
const topicStandard = String(route.fullPath.split("/")[2])
  .toString()
  .replaceAll("%20", " ");
const topicLevel = String(route.fullPath.split("/")[3])
  .toString()
  .replaceAll("%20", " ");
currentTopic.value = topicTitle;

// tokens
const signInAccessToken = useCookie("signInAccessToken");
const chapterProgress = useCookie("chapterProgress").value;

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
  notesStatus: "pending",
  questions: null,
  number: 1,
  isAttemptingQuizes: false,
});

// notes container reference
const notesContainer = ref(null);
const scrollTop = ref(0);
const scrollHeight = ref(0);
const clientHeight = ref(0);
const scrollPercent = ref(0);
// Track previous scrollTop
let previousScrollTop = 0;


// flag for toggling experiment fullscreeen
const isFullscreen = ref(false);

// Changer Chapter
const changeChapter = (action) => {
  if (chapters.number >= 1 && chapters.number <= chapters.list?.length) {
    // p = Previous and n = Next
    if (action.toLowerCase() == "p") {
      chapters.number == 1 ? "" : chapters.number--;
      getChapter(chapters.list[chapters.number - 1]._id);
      chapters.isAttemptingQuizes = false; //close quiz
    } else if (action.toLowerCase() == "n") {
      // n = Next Chapter
      chapters.number == chapters.list?.length ? "" : chapters.number++;
      getChapter(chapters.list[chapters.number - 1]._id);
      chapters.isAttemptingQuizes = false; //close quiz
    } else if (action.toLowerCase() == "r") {
      // Read again
      chapters.isAttemptingQuizes = false; //close quiz
    }
    // Scroll Up when chapter changed
    window.scrollTo({
      top: 0,
      behavior: "smooth", // Smooth scrolling effect
    });
  }
};

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
};

// const istoggleSidebar = ref(false)

const toggleSidebar = () => {
  if (import.meta.client) {
    const sidebar = document.querySelector(".sidebar");
    sidebar.classList.toggle("right-0");
  }
};

// fetch chapters information
const getChapter = async (chapterId) => {
  chapters.notesStatus = "pending";
  chapters.currentChapterId = chapterId;

  const expiredSoon = isTokenExpiringSoon(signInAccessToken.value, 60);
  if (expiredSoon) {
    await refreshToken()
      .then((response) => {
        if (response) {
          signInAccessToken.value = response?.access_token;
        } else {
          router.replace("/auth");
        }
      })
      .catch(() => {
        router.replace("/auth");
      });
  }

  await $fetch(`/api/topics/chapters/${chapterId}`)
    .then(async (response) => {
      chapters.notesStatus = "success";
      chapters.notes = response;

      const tasks = [];
      // Add related QN fetch
      tasks.push(getQNTopicChapter(chapterId));
      // Conditionally update progress
      if (
        chapterProgress?.userId === userToken.value?._id &&
        chapterProgress?.chapterId === chapterId
      ) {
        tasks.push(updateChapterProgress());
      }
      // Always attempt to post initial progress (if needed)
      tasks.push(
        $fetch("/api/progress/post-progress", {
          method: "POST",
          body: {
            userId: userToken.value?._id,
            chapterId: chapterId,
            videoProgress: 0,
            notesProgress: 0,
            experimentsAttempted: 0,
            totalExperiments: 0,
            assessmentsAttempted: 0,
            totalAssessments: 0,
          },
        }).catch((error) => {
          chapters.notesStatus = "success";
        })
      );

      await Promise.allSettled(tasks);
    })
    .catch((error) => {
      chapters.notesStatus = "error";
      chapters.error = error;
    });
};

// Submit Topic viewed Read
const topicViewedRead = async (topicId) => {
  chapters.notesStatus = "pending";
  chapters.currentChapterId = topicId;
  await $fetch(apiDocs.topics.topicViewedRead.replaceAll("{id}", topicId), {
    headers: {
      Authorization: `Bearer ${signInAccessToken.value}`,
    },
  });
};

// Fetch Questions by Topic Chapter
const getQNTopicChapter = async (chapterId) => {
  try {
    const response = await $fetch(apiDocs.chapters.getTopicChapterQNs, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${signInAccessToken.value}`,
      },
      params: {
        topic: topicId,
        chapter: chapterId,
      },
    });

    if (response) {
      chapters.questions = response;
    }
  } catch (error) {
    console.log(error);
  }
};

// Fetch chapters
await useFetch(`/api/topics/${topicId}`)
  .then((response) => {
    chapters.status = "success";
    chapters.list = response.data.value;
    getChapter(response.data.value[0]?._id);
    // Call Submit Topic Viewed Read

    if (!useState("userViewedTopic").value) {
      topicViewedRead(topicId);
    }
  })
  .catch((error) => {
    (chapters.status = "error"), (chapters.error = error);
  });

watch(
  () => userToken.value,
  (token) => {
    // Get the router instance
    if (!token) {
      router.replace("/home");
    }
  }
);

onMounted(async () => {
  // Trigger MathJax rendering
  window.MathJax.typeset();

  // Call functin for set Pic Center
  setPicCenter();
});

// Watch chapter notes and Then, Set Pic Center
watch(
  () => chapters.notes,
  (newNotes) => {
    if (newNotes) {
      setPicCenter();
    }
  }
);

// set Pic center
const setPicCenter = async () => {
  // Wait for MathJax to finish rendering (you can wrap this in a Promise or check for its readiness)
  await new Promise((resolve) => setTimeout(resolve, 500));

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
};

// Define Function To Handle Scroll
const handleScroll = () => {
  if (!notesContainer.value) return;

  const el = notesContainer.value;

  const currentScrollTop = el.scrollTop;

  // Only continue if scrolling down
  if (currentScrollTop <= previousScrollTop) {
    previousScrollTop = currentScrollTop;
    return;
  }

  scrollTop.value = currentScrollTop;
  scrollHeight.value = el.scrollHeight;
  clientHeight.value = el.clientHeight;

  // Scroll percentage (0 - 100)
  scrollPercent.value = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
  // Update the previous scroll position
  previousScrollTop = currentScrollTop;
};


// Define Watch
watch(
  () => chapters.notesStatus,
  async (newStatus) => {
    if (newStatus === "success") {
      await nextTick()

      if (notesContainer.value) {
        notesContainer.value.addEventListener("scroll", handleScroll);
        const videoPlayer = notesContainer.value.querySelector("#video-player");
        if (videoPlayer) {
          //setting user id and chapter id on play
          if (!chapterProgress.userId != userToken.value?._id || chapterProgress.chapterId != chapters.currentChapterId) {
            chapterProgress.userId = userToken.value?._id;
            chapterProgress.chapterId = chapters.currentChapterId;
          }

          // returning to previous progress is are available when video loaded
          videoPlayer.addEventListener("loadedmetadata", () => {
            if (
              chapterProgress &&
              chapterProgress.userId === userToken.value?._id &&
              chapterProgress.chapterId === chapters.currentChapterId
            ) {
              const targetTime = Math.floor((chapterProgress.videoProgress / 100) * videoPlayer.duration);

              // FastSeek Is Same To Resume a video player
              if (typeof videoPlayer.fastSeek === "function") {
                videoPlayer.fastSeek(targetTime);
              } else {
                videoPlayer.currentTime = targetTime;
              }
            }
          });

          // tracking video playing
          videoPlayer.addEventListener("timeupdate", () => {
            const progress = Math.floor((videoPlayer.currentTime / videoPlayer.duration) * 100)
            chapterProgress.videoProgress < progress ? chapterProgress.videoProgress = progress : '';

            // update progress
            switch (progress) {
              case 25:
                updateChapterProgress()
                break;
              case 50:
                updateChapterProgress()
                break;
              case 75:
                updateChapterProgress()
                break;
              case 100:
                updateChapterProgress()
                break;
              default:
                break;
            }
          });

          // contols no download
          videoPlayer.addEventListener("contextmenu", (e) => {
            e.preventDefault(); // disables right-click menu
          });

          videoPlayer.controlsList = "nodownload";

        }
      }
    }
  }
);

// wacth over scroll percent
watch(scrollPercent, async (newPercent) => {
  // Submit to cookies only when scrolling down
  if (chapterProgress) {
    !chapterProgress.userId == '' ? chapterProgress.userId = userToken.value?._id : '';
    !chapterProgress.chapterId == '' ? chapterProgress.chapterId = chapters.currentChapterId : '';
    chapterProgress.notesProgress < newPercent ? chapterProgress.notesProgress = newPercent : '';
  }

  switch (newPercent) {
    case 25:
      updateChapterProgress()
      break;
    case 50:
      updateChapterProgress()
      break;
    case 75:
      updateChapterProgress()
      break;
    case 100:
      updateChapterProgress()
      break;
    default:
      break;
  }
});

definePageMeta({
  middleware: "auth",
});

</script>

<template>
  <NuxtLayout name="home-layout">
    <section v-if="experimrntUrl" class="relative w-full center-height" id="experiment-container">
      <div
        class="absolute top-0 right-0 flex items-center justify-center w-10 h-10 p-2 bg-red-500 rounded-full cursor-pointer"
        @click="experimrntUrl = null">
        <Icon name="formkit:close" size="24" class="font-bold text-white" />
      </div>
      <iframe :src="experimrntUrl" frameborder="0" class="h-full w-full center-height rounded-md !bg-white"></iframe>
      <!-- full screen controls -->
      <div
        class="absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 p-2 text-white transition-all duration-500 rounded-md cursor-pointer screen-control bg-oceanBlue hover:bg-white hover:text-oceanBlue"
        :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'" @click="fullScreen">
        <Icon v-if="isFullscreen" name="qlementine-icons:fullscreen-exit-16" size="24" />
        <Icon v-else name="qlementine-icons:fullscreen-16" size="24" />
      </div>
    </section>

    <!-- quiz -->
    <!-- bg-[url('/public/images/background2.webp')] bg-cover bg-center bg-no-repeat -->
    <div v-else-if="chapters.questions && chapters.isAttemptingQuizes" class="relative flex flex-col justify-center">
      <!-- Chapter Questions -->
      <QuestionsContainer v-mathjax :questions="chapters?.questions" :is-attempting-quiz="chapters.isAttemptingQuizes"
        :change-chapter="changeChapter" :chapters-list="chapters.list?.length" :chapters-number="chapters?.number" />
    </div>
    <section v-else class="relative inline-flex w-full h-full overflow-hidden center-height">
      <!-- Loading state -->
      <div v-if="chapters.status == 'pending'" class="flex items-center justify-center w-full loading content-height">
        <LoadingIndicator :is-loading="true" />
      </div>

      <!-- Error state -->
      <div v-else-if="chapters.status == 'error'" class="flex flex-col items-center justify-center w-full gap-2 error">
        <MessagePageNotFound message="Error while loading chapter"
          subMessage="Make sure you are connected to the stable internet or try to reload the page" />
      </div>

      <!-- Success state -->
      <div v-else-if="chapters.status == 'success'" class="flex justify-center w-full success">
        <!-- Notes loading w-3/4 -->
        <div v-if="chapters.notesStatus == 'pending'"
          class="flex flex-col items-center justify-center w-full h-full p-5 lg:w-3/4 lg:scroll-height lg:overflow-y-scroll">
          <div class="flex items-center justify-center flex-1">
            <LoadingIndicator :is-loading="true" />
          </div>
        </div>

        <!-- Notes loaded successfully -->
        <div ref="notesContainer" v-else-if="chapters.notesStatus == 'success'"
          class="w-full py-5 lg:w-3/4 lg:scroll-height lg:overflow-y-scroll lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          <!-- Topic Level Standard and Subject Indicator -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <NuxtLink :to="{
      path: '/',
      query: {
        tab: 'interactive',
        subject: topicLevel,
        class: topicStandard,
      },
    }" class="items-center hidden gap-2 capitalize text-oceanBlue text-small md:flex">
                {{
      topicLevel != null &&
        topicLevel != undefined &&
        topicLevel != "null"
        ? topicLevel
        : `Secondary`
    }}
                <Icon name="weui:arrow-outlined" size="18" class="text-black" />
              </NuxtLink>

              <NuxtLink :to="{
        path: '/',
        query: {
          tab: 'interactive',
          subject: topicLevel,
          class: topicStandard,
        },
      }" class="items-center hidden gap-2 capitalize text-oceanBlue text-small md:flex">
                {{
      topicStandard != null &&
        topicStandard != undefined &&
        topicStandard != "null"
        ? topicStandard
        : `Form One`
    }}
                <Icon name="weui:arrow-outlined" size="18" class="text-black" />
              </NuxtLink>

              <p class="font-medium uppercase text-medium md:capitalize">
                {{
        topicTitle != null &&
          topicTitle != undefined &&
          topicTitle != "null"
          ? topicTitle
          : `Introduction to
                Physics`
      }}
              </p>
            </div>

            <!-- Header Description -->
            <div class="flex lg:hidden" @click="toggleSidebar()">
              <Icon name="basil:menu-outline" class="cursor-pointer" size="2rem" />
            </div>
          </div>

          <!-- Description -->
          <div class="relative flex flex-col justify-center w-full gap-2 py-3 content-view">
            <!-- <p class="mx-auto notes md:px-4 max-w-7xl"
              v-math-html="experimentParser(modelParser(videoParser(chapters.notes?.content)))"></p> -->

            <!-- Chapter Notes -->
            <div class="mx-auto notes md:px-4 max-w-7xl" v-mathjax v-html="experimentParser(
      modelParser(videoParser(chapters.notes?.content))
    )
      "></div>

            <!-- Chapter Button - (Test your knowledge) -->
            <div v-if="chapters.questions && chapters.questions?.length > 0"
              class="flex items-center justify-center w-full">
              <button
                class="h-10 px-4 text-white uppercase transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue"
                @click="chapters.isAttemptingQuizes = true">
                Test your knowledge
              </button>
            </div>

            <!-- Next and Previous chapter Action -->
            <div class="flex flex-row-reverse items-center justify-between lg:hidden">
              <!-- Next Chapter -->
              <button @click="changeChapter('n')" :disabled="chapters.number == chapters.list?.length" :class="{
      'opacity-0': chapters.number == chapters.list?.length,
    }" class="flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                <p class="flex gap-2 capitalize">
                  Next <span class="hidden md:flex">Chapter</span>
                </p>
                <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                  <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue" />
                </div>
              </button>
              <!-- Previous Chapter -->
              <button @click="changeChapter('p')" :disabled="chapters.number <= 1"
                :class="{ 'opacity-0': chapters.number <= 1 }"
                class="flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                  <Icon name="weui:arrow-filled" size="20" class="transform rotate-180 text-oceanBlue" />
                </div>
                <p class="flex gap-2 capitalize">
                  Previous <span class="hidden md:flex">Chapter</span>
                </p>
              </button>
            </div>
          </div>
        </div>

        <!-- Notes failed to load -->
        <div v-else class="flex items-center justify-center w-full p-5 lg:w-3/4 lg:scroll-height lg:overflow-y-scroll">
          <MessageTopicNotFound message="This chapter currently not available" />
        </div>

        <!-- Sidebar w-1/4 -->
        <div
          class="sidebar transition-all duration-700 ease-in-out absolute -right-[500%] lg:right-0 top-0 md:w-[400px] w-full lg:w-1/4 h-full p-2 lg:static bg-white">
          <div class="flex items-center justify-between mb-4">
            <h1 class="pt-5 font-medium capitalize text-medium">Subtopic</h1>
            <!-- toggle menu -->
            <div
              class="flex items-center justify-center w-5 h-5 transition-all duration-500 ease-in-out rounded-full cursor-pointer hover:bg-oceanBlue lg:hidden group"
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
