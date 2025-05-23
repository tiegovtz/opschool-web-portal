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
import { fetchAsyncData } from "~/composable/useAsyncFetch";

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

// tokens cookies
const signInAccessToken = useCookie("signInAccessToken");
const userToken = useCookie("signInUserToken");

const chapterProgress = useCookie("chapterProgress");

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

// Helper functions 
const ensureAccessTokenValid = async () => {
  if (isTokenExpiringSoon(signInAccessToken.value, 60)) {
    const response = await refreshToken().catch(() => null);

    if (response?.access_token) {
      signInAccessToken.value = response.access_token;
    } else {
      router.replace("/auth");
    }
  }
};

const initializeChapterProgress = (chapterId) => {
  chapterProgress.value = {
    userId: userToken.value?._id,
    chapterId: chapterId,
    videoProgress: 0,
    notesProgress: 0,
    experimentsAttempted: 0,
    totalExperiments: 0,
    assessmentsAttempted: 0,
    totalAssessments: 0,
  };
};

const postInitialProgressIfNeeded = async (chapterId) => {
  try {
    await $fetch("/api/progress/post-progress", {
      method: "POST",
      body: {
        userId: userToken.value?._id,
        chapterId,
        videoProgress: 0,
        notesProgress: 0,
        experimentsAttempted: 0,
        totalExperiments: 0,
        assessmentsAttempted: 0,
        totalAssessments: 0,
      },
    });

    initializeChapterProgress(chapterId);
  } catch (error) {
    console.error("Error posting initial progress:", error);
  }
};

const syncRemoteProgress = async (chapterId) => {
  try {
    const remoteProgress = await $fetch(
      apiDocs.progressTracking.getProgresschapterId.replace("{chapterId}", chapterId),
      { headers: { Authorization: `Bearer ${signInAccessToken.value}` } }
    );

    if (
      remoteProgress.userId === chapterProgress.value?.userId &&
      remoteProgress.chapterId === chapterProgress.value?.chapterId
    ) {
      Object.keys(remoteProgress).forEach((key) => {
        if (
          typeof remoteProgress[key] === "number" &&
          remoteProgress[key] > chapterProgress.value[key]
        ) {
          chapterProgress.value[key] = remoteProgress[key];
        }
      });
    } else {
      console.warn("Progress belongs to a different user or chapter. Ignored.");
      initializeChapterProgress(chapterId);
    }
  } catch (error) {
    console.error("Error fetching remote progress:", error);
  }
};

// Main function 
const getChapter = async (chapterId) => {
  // validate if chapterId is null or undefined
  if (!chapterId) {
    console.error("Chapter ID is null or undefined");
    return;
  }
  chapters.notesStatus = "pending";
  chapters.notes = null;
  chapters.questions = null;
  chapters.isAttemptingQuizes = false; //close quiz
  chapters.currentChapterId = chapterId;

  await ensureAccessTokenValid();

  try {
    const { data: response, status } = await fetchAsyncData(
      `chapter-${chapterId}`,
      () => $fetch(`/api/topics/chapters/${chapterId}`)
    );

    if (response) {
      chapters.notesStatus = status.value;
      chapters.notes = response;

      const tasks = [
        getQNTopicChapter(chapterId),
        postInitialProgressIfNeeded(chapterId),
        syncRemoteProgress(chapterId),
      ];

      if (
        chapterProgress.value?.userId === userToken.value?._id &&
        chapterProgress.value?.chapterId === chapterId
      ) {
        tasks.push(updateChapterProgress());
      }

      await Promise.allSettled(tasks);
    }
  } catch (error) {
    chapters.notesStatus = "error";
    chapters.error = error;
    console.error("Error fetching chapter details:", error);
  }
};


// Submit Topic viewed Read
const topicViewedRead = async (topicId) => {
  chapters.notesStatus = "pending";
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
    })
    if (response) {
      chapters.questions = response;
    }
  } catch (error) {
    console.error(error);
  }
};

// Fetch chapters
await useFetch(`/api/topics/${topicId}`)
  .then((response) => {
    //  Check if the response is successful
    if (response) {
      // extracting data ,status  from response
      const { data, status } = response;
      // on sucess save data to chapters
      if (status.value === 'success') {
        chapters.status = status.value;
        chapters.list = data.value;
        getChapter(data.value[0]?._id);
        chapters.currentChapterId = data.value[0]?._id;
      }
      else if (status.value === 'error') {
        chapters.status = status.value;
        signInAccessToken.value = null;
        userToken.value = null;
        return navigateTo('/auth', { replace: true });
      }
    }

    // Call Submit Topic Viewed Read
    if (!useState("userViewedTopic").value) {
      topicViewedRead(topicId);
    }
  })
  .catch((error) => {
    (chapters.status = "error"),
      (chapters.error = error);
    // clear all cookies
    signInAccessToken.value = null;
    userToken.value = null;
    return navigateTo('/auth', { replace: true });

  });

watch(
  () => userToken.value,
  (token) => {
    // Get the router instance
    if (!token) {
      router.replace("/auth");
    }
  }
);

onMounted(async () => {
  // Trigger MathJax rendering
  window.MathJax?.typeset();

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
    document.querySelectorAll(".notes p").forEach((p) => {
      const images = p.querySelectorAll("img");

      // Skip if <p> has no images
      if (images.length === 0) return;

      // If exactly one image and it's the only (element) child
      if (
        images.length === 1 &&
        p.childNodes.length === 1
      ) {
        images[0].classList.add("pic-center");
      } else {
        // Style spans only if they (or their descendants) contain <img>
        p.querySelectorAll("span").forEach((span) => {
          if (span.querySelector("img")) {
            const images = span.querySelectorAll("img")
            if (images.length === 1 &&
              images[0].classList.contains('desc-img'))
              return;

            span.className = "flex justify-center flex-wrap gap-2";
          }
        });

        // Style <b> only if it (or its descendants) contains <img>
        p.querySelectorAll("b").forEach((b) => {
          if (b.querySelector("img")) {
            b.className = "flex justify-center flex-wrap gap-2";
          }
        });
      }
    });


    document.querySelectorAll(".notes td").forEach((el) => {
      const images = el.querySelectorAll('img')

      if (images.length === 0) return;
      el.querySelectorAll('p').forEach((p) => {
        if (p.querySelector('img')) {

          const images = p.querySelectorAll("img")
          if (images.length === 1 &&
            images[0].classList.contains('desc-img'))
            return;

          p.className = "flex items-center justify-center flex-wrap"
        }
      })

    })



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
  scrollPercent.value = Math.round(
    (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100
  );
  // Update the previous scroll position
  previousScrollTop = currentScrollTop;
};

// Observer Content
const observerContent = () => {
  if (notesContainer.value) {
    notesContainer.value.addEventListener("scroll", handleScroll);
    const videoPlayer = notesContainer.value.querySelector("#video-player");
    if (videoPlayer) {
      //setting user id and chapter id on play
      if (chapterProgress) {
        if (
          chapterProgress?.value?.userId !== userToken.value?._id ||
          chapterProgress?.value?.chapterId !== chapters.currentChapterId
        ) {
          chapterProgress.value.userId = userToken.value?._id;
          chapterProgress.value.chapterId = chapters.currentChapterId;
        }
      }
      else {
        initializeChapterProgress(chapters.currentChapterId)
      }

      // returning to previous progress is are available when video loaded
      videoPlayer.addEventListener("loadedmetadata", () => {
        if (
          chapterProgress?.value &&
          chapterProgress?.value?.userId === userToken.value?._id &&
          chapterProgress?.value?.chapterId === chapters.currentChapterId
        ) {
          const targetTime = Math.floor(
            (chapterProgress?.value?.videoProgress / 100) *
            videoPlayer.duration
          );

          // FastSeek Is Same To Resume a video player
          if (typeof videoPlayer.fastSeek === "function") {
            videoPlayer.fastSeek(targetTime);
          } else {
            videoPlayer.currentTime = targetTime;
          }
        }

        else {
          chapterProgress.value.userId = userToken.value?._id
          chapterProgress.value.chapterId = chapters.currentChapterId
        }
      });

      // tracking video playing
      videoPlayer.addEventListener("timeupdate", () => {
        const progress = Math.floor(
          (videoPlayer.currentTime / videoPlayer.duration) * 100
        );
        chapterProgress?.value?.videoProgress < progress
          ? (chapterProgress.value.videoProgress = progress)
          : "";

        // update progress
        switch (progress) {
          case 25:
            updateChapterProgress();
            break;
          case 50:
            updateChapterProgress();
            break;
          case 75:
            updateChapterProgress();
            break;
          case 100:
            updateChapterProgress();
            break;
          default:
            break;
        }
      });

      // contols no download
      videoPlayer.addEventListener("contextmenu", (e) => {
        e.preventDefault(); // disables right-click menu
      });

      // controll to pause video while scrolling height exceesed video height
      notesContainer.value.addEventListener("scroll", () => {
        if (scrollTop.value > (videoPlayer?.clientHeight / 2)) {
          videoPlayer.pause()
        }
      });

      videoPlayer.controlsList = "nodownload";
    }

    // zoom 3d models
    const modelViewer = notesContainer?.value?.querySelectorAll('model-viewer')
    const zoomInIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M8.195 0c4.527 0 8.196 3.62 8.196 8.084a8 8 0 0 1-1.977 5.267l5.388 5.473a.686.686 0 0 1-.015.98a.71.71 0 0 1-.993-.014l-5.383-5.47a8.23 8.23 0 0 1-5.216 1.849C3.67 16.169 0 12.549 0 8.084C0 3.62 3.67 0 8.195 0m0 1.386c-3.75 0-6.79 2.999-6.79 6.698s3.04 6.699 6.79 6.699s6.791-3 6.791-6.699c0-3.7-3.04-6.698-6.79-6.698m.11 2.19c.383 0 .693.314.693.702v2.976h2.976c.388 0 .703.31.703.693a.7.7 0 0 1-.703.693l-2.976-.001v2.977c0 .388-.31.703-.693.703a.7.7 0 0 1-.693-.703V8.64H4.636a.7.7 0 0 1-.702-.692c0-.383.314-.693.702-.693h2.976V4.278c0-.388.31-.703.693-.703"/></svg>`
    const zoomOutIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M8.195 0c4.527 0 8.196 3.62 8.196 8.084a8 8 0 0 1-1.977 5.267l5.388 5.473a.686.686 0 0 1-.015.98a.71.71 0 0 1-.993-.014l-5.383-5.47a8.23 8.23 0 0 1-5.216 1.849C3.67 16.169 0 12.549 0 8.084C0 3.62 3.67 0 8.195 0m0 1.386c-3.75 0-6.79 2.999-6.79 6.698s3.04 6.699 6.79 6.699s6.791-3 6.791-6.699c0-3.7-3.04-6.698-6.79-6.698m3.78 5.868c.387 0 .702.31.702.693a.7.7 0 0 1-.703.693H4.636a.7.7 0 0 1-.702-.693c0-.383.314-.693.702-.693z"/></svg>`
    const icon3D = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M7.47 21.5C4.2 19.94 1.86 16.76 1.5 13H0c.5 6.16 5.66 11 11.95 11l.66-.03l-3.81-3.81zm.89-6.54c-.19 0-.36-.03-.52-.08a1.1 1.1 0 0 1-.4-.24c-.11-.1-.2-.22-.26-.37c-.06-.14-.09-.3-.09-.47h-1.3c0 .36.07.7.21.95s.33.5.56.69c.24.18.51.32.82.41q.45.15.96.15c.37 0 .72-.05 1.03-.15c.32-.1.6-.25.83-.44s.42-.41.55-.72c.13-.29.2-.61.2-.97c0-.19-.02-.38-.07-.56c-.05-.16-.12-.35-.23-.51c-.1-.15-.24-.3-.4-.43c-.17-.13-.37-.22-.61-.31a2.07 2.07 0 0 0 .89-.75c.1-.16.17-.3.22-.46s.07-.32.07-.48q0-.54-.18-.96c-.14-.26-.29-.51-.51-.69c-.2-.19-.47-.33-.77-.43C9.05 8.05 8.71 8 8.34 8c-.34 0-.69.05-1 .16c-.3.11-.57.26-.79.45c-.21.19-.38.39-.51.67c-.12.26-.18.54-.18.85h1.3q0-.255.09-.45a.94.94 0 0 1 .25-.34c.11-.09.23-.17.38-.22s.3-.08.48-.08c.4 0 .7.1.89.31c.19.2.29.49.29.86c0 .18-.04.34-.08.49a.87.87 0 0 1-.25.37c-.11.1-.25.18-.41.24s-.36.09-.58.09h-.77v1.03h.77c.22 0 .42.02.6.07s.33.13.45.23c.12.11.23.24.29.4c.07.16.1.37.1.57c0 .41-.12.72-.35.93c-.23.23-.55.33-.95.33m8.55-5.92c-.32-.33-.7-.59-1.14-.77c-.43-.18-.92-.27-1.46-.27h-2.36v8h2.3c.55 0 1.06-.09 1.51-.27s.84-.43 1.16-.76s.58-.73.74-1.19c.17-.47.26-.99.26-1.57v-.4c0-.58-.09-1.1-.26-1.57c-.16-.47-.43-.87-.75-1.2m-.41 3.16c0 .42-.03.8-.12 1.13c-.1.33-.24.62-.43.85s-.45.41-.71.53q-.435.18-.99.18h-.91V9.12h.97c.72 0 1.27.23 1.64.69c.38.46.55 1.12.55 1.99M11.95 0l-.66.03l3.81 3.81l1.33-1.34c3.27 1.56 5.61 4.73 5.96 8.5h1.5c-.5-6.16-5.65-11-11.94-11"/></svg>`
    const showIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17 8q-.425 0-.712-.288T16 7t.288-.712T17 6t.713.288T18 7t-.288.713T17 8m-8 6l2.7-3.5l1.55 2l2.3-3L19 14zm-5 8q-.825 0-1.412-.587T2 20V6h2v14h14v2zM6 9.375V4q0-.825.588-1.412T8 2h5v2H8v5.375zM8 18q-.825 0-1.412-.587T6 16v-4.625h2V16h5v2zm7 0v-2h5v-4.625h2V16q0 .825-.587 1.413T20 18zm5-8.625V4h-5V2h5q.825 0 1.413.588T22 4v5.375z"/></svg>`

    modelViewer.forEach(element => {
      // === Elements Creation ===
      const zoomButton = document.createElement('button');
      const label = document.createElement('button');
      const span = document.createElement('span');
      const coverImg = document.createElement('img');

      let isZoomed = false;
      let isCovered = true; // Initially covered

      // === Cover Image Setup ===
      coverImg.setAttribute('src', element.getAttribute('poster'));
      coverImg.className = `
    absolute top-0 -left-full h-full w-full z-4
    transition-all duration-500 ease-in-out 
  `.trim();

      // === Label Button Setup ===
      label.innerHTML = showIcon;
      label.title = 'Click to view image';
      label.className = `
    flex items-center justify-center
    absolute bottom-0 left-0
    bg-oceanBlue text-white p-1
    rounded-md z-10 capitalize active:scale-90 transition-all duration-800 ease-in-out
  `.trim();

      // === Zoom & 3D Button Setup ===
      zoomButton.innerHTML = zoomInIcon;
      span.innerHTML = icon3D;
      zoomButton.className = 'zoom-button';
      zoomButton.style.backgroundColor = '#56ade8';
      span.className = 'span-3D';

      // === Append Elements to <model-viewer> ===
      element.append(zoomButton, span, coverImg, label);

      // === Zoom Button Logic ===
      zoomButton.addEventListener('click', event => {
        event.stopPropagation();
        isZoomed = !isZoomed;

        element.scrollIntoView({ behavior: 'smooth', block: 'start' });

        if (isZoomed) {
          element.classList.add('zoomed');
          zoomButton.innerHTML = zoomOutIcon;
          zoomButton.style.backgroundColor = '#f00';
        } else {
          element.classList.remove('zoomed');
          zoomButton.innerHTML = zoomInIcon;
          zoomButton.style.backgroundColor = '#56ade8';
        }
      });

      // === Label Button Logic (Toggle Cover) ===
      label.addEventListener('click', event => {
        event.stopPropagation();
        isCovered = !isCovered;

        coverImg.classList.toggle('left-0', !isCovered);
        coverImg.classList.toggle('-left-full', isCovered);
        label.classList.toggle('bg-oceanBlue', isCovered);
        label.classList.toggle('bg-normalRed', !isCovered);
      });
    });




    document.querySelectorAll('.notes span').forEach((span) => {
      const text = span.textContent.trim().toLowerCase();

      // Match common patterns like "task 1.1", "activity 2.2", etc.
      const match = text.match(/^(task|activity|exercise|revision (exercise|exercice))\s*\d+(\.\d+)?/i);

      if (match) {
        let parent = span.parentElement;

        // Traverse up the DOM to find the nearest parent with a background color in its inline style
        while (parent && !parent.style.backgroundColor) {
          parent = parent.parentElement;
        }

        // If a parent with an inline background color is found
        if (parent && !text.includes(':')) {
          parent.classList.add('highlighted-task-table');
        }
      }
    });


  }
}

// Define Watch
watch(
  () => chapters.notesStatus,
  async (newStatus) => {
    if (newStatus === "success") {

      if (chapters.notes?._id !== chapters.currentChapterId) {
        getChapter(chapters.currentChapterId);
      }

      await nextTick();

      // Call Observer Content Function
      observerContent();
    }
  },
  { immediate: true }
);

// wacth over scroll percent
watch(scrollPercent, async (newPercent) => {
  // Submit to cookies only when scrolling down
  if (chapterProgress) {
    chapterProgress?.value?.userId.toString().trim() == ""
      ? (chapterProgress.value.userId = userToken.value?._id)
      : "";
    chapterProgress?.value?.chapterId.toString().trim() == ""
      ? (chapterProgress.value.chapterId = chapters.currentChapterId)
      : "";
    chapterProgress?.value?.notesProgress < newPercent
      ? (chapterProgress.value.notesProgress = newPercent)
      : "";
  }
  else {
    initializeChapterProgress(chapters.currentChapterId);
  }

  switch (newPercent) {
    case 25:
      updateChapterProgress();
      break;
    case 50:
      updateChapterProgress();
      break;
    case 75:
      updateChapterProgress();
      break;
    case 100:
      updateChapterProgress();
      break;
    default:
      break;
  }
});

// Watch Quiz
watch(() => chapters.isAttemptingQuizes, async (newAttemptingQuizes) => {
  if (!newAttemptingQuizes) {
    await nextTick();

    // Call Function
    setPicCenter();
    observerContent();
  }
})

// Watch Exit experiment
watch(() => experimrntUrl.value, async (newExperimentUrl) => {
  if (!newExperimentUrl) {
    await nextTick();

    // Call Function
    setPicCenter();
    observerContent();
  }
})

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
      <iframe :src="experimrntUrl" frameborder="0" :class="[
        ' w-full  rounded-md !bg-white',
        isFullscreen ? ' min-h-dvh min-w-full' : 'h-full center-height',
      ]"></iframe>
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
        :chapter-id="chapters.notes?._id ?? chapters.currentChapterId" :change-chapter="changeChapter"
        :chapters-list="chapters.list?.length" :chapters-number="chapters?.number"
        @emit-quiz-score="updateChapterProgress" />
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
              }"
                class="items-center hidden gap-2 p-1 capitalize border-2 rounded-full text-oceanBlue text-small md:flex border-oceanBlue">
                <!-- {{
                  topicLevel != null &&
                    topicLevel != undefined &&
                    topicLevel != "null"
                    ? topicLevel
                    : `Secondary`
                }} -->
                <Icon name="vaadin:arrow-backward" size="26" class="text-oceanBlue" />
                <!-- <span>Back</span> -->
              </NuxtLink>

              <p class="font-medium text-medium" v-if="chapters.status === 'success'">
                {{
                  chapters.notes?.name
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

            <!-- Chapter Notes -->
            <div class="mx-auto notes md:px-4 max-w-7xl" v-mathjax
              v-html="experimentParser(modelParser(videoParser(chapters.notes?.content)))"></div>

            <!-- Chapter Button - (Quiz) -->
            <div v-if="chapters.questions && chapters.questions?.length > 0"
              class="flex items-center justify-center w-full">
              <button
                class="h-10 px-4 text-white uppercase transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue"
                @click="chapters.isAttemptingQuizes = true">
                Quiz
              </button>
            </div>

            <!-- Next and Previous chapter Action -->
            <div class="flex flex-row-reverse items-center justify-between lg:hidden">
              <!-- Next Chapter -->
              <button @click="changeChapter('n')" :disabled="chapters.number == chapters.list?.length" :class="{
                'opacity-0': chapters.number == chapters.list?.length,
              }"
                class="flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue">
                <p class="flex gap-2 capitalize">
                  Next
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
                  Previous
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
            <h1 class="pt-5 font-medium capitalize text-medium">Competencies</h1>
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
            :active-chapter-id="chapters.notes?._id ?? chapters.currentChapterId" @click="toggleSidebar" />
        </div>
      </div>

      <!-- Default/idle state -->
      <div v-else class="idle">
        <p>Try to reload the page, something went wrong</p>
      </div>
    </section>
  </NuxtLayout>
</template>
