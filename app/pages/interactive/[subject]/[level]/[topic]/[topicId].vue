<script setup lang="ts">
import LoadingIndicator from "@/components/loading/loadingIndicator.vue";
import Activity from "~/components/activities/Activity.vue";
import activityParser from "~/utilities/parsers/activityParser";
import experimentParser from "~/utilities/parsers/experimentParser";
import modelParser from "~/utilities/parsers/modelParser";
import { mediaParser } from "~/utilities/parsers/mediaParser";
import conversationParser from "~/utilities/parsers/conversationParser";
import { activityPopupId, currentTopic, experimrntUrl } from "~/utilities/controlls";
import QuestionsContainer from "~/components/chapter/questionsContainer.vue";
import AIAssistant from "~/components/chapter/AIAssistant.vue";
import { isTokenExpiringSoon, refreshToken } from "~/utilities/jwToken";
import apiDocs from "~/utilities/apiDocs";
import { updateChapterProgress } from "~/utilities/progress";
import { enhanceAccessibility } from "~/utilities/parsers/html.readable";
import { moveFocus } from "~/utilities/focus.helper";
import { fetchAsyncData } from "~/composables/useAsyncFetch";
import { handleAudio, initAudioCanvasPlayers } from "~/utilities/initAudioPlayer";
import {
  normalizeLanguageSupport,
  resolveEducationLevelFromRoute,
} from "~/utilities/educationRoute";
const route = useRoute();
const router = useRouter();
const contentLayoutLanguage = useContentLayoutLanguage(() => route.params.level);
const safeDecode = (value: unknown) => {
  const raw = typeof value === "string" ? value : "";
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};
const topicId = String(route.params.topicId ?? "");
const topicLanguageData = ref<{ name: string, _id: string }>()
const topicTitle = safeDecode(route.params.topic).replaceAll("-", " ");
const topicStandard = safeDecode(route.params.subject);
const topicLevel = safeDecode(route.params.level);
currentTopic.value = topicTitle;

const goToPreviousPage = () => {
  router.back();
};

const redirectToAuth = () =>
  router.replace({
    path: "/auth",
    query: { redirect: route.fullPath },
  });

// tokens cookies
const signInAccessToken = useCookie("signInAccessToken");
const userToken = useCookie("signInUserToken");
// search anouncement to screen reders
const announcement = ref();
const chapterProgress = useCookie<any>("chapterProgress");
const userViewedTopic = useState("userViewedTopic");

const educationLevel = computed(() => resolveEducationLevelFromRoute(route));
const normalizedTopicLanguage = computed(() =>
  normalizeLanguageSupport(topicLanguageData.value?.name, contentLayoutLanguage.value),
);
const usesSwahiliInstructions = computed(
  () =>
    normalizedTopicLanguage.value === "kiswahili" ||
    normalizeLanguageSupport(contentLayoutLanguage.value, "english") === "kiswahili",
);
const pageUi = computed(() =>
  usesSwahiliInstructions.value
    ? {
      errorLoadingChapter: "Hitilafu wakati wa kupakia chapo",
      loadingChapterHelp: "Hakikisha upo kwa mtandao imara au jaribu kupakia upya ukurasa",
      noContentAvailable: "Hakuna maudhui yaliyopatikana",
      notesSummary:
        "Vidokezo hivi vinajumlisha angalau video moja, picha za kawaida za pande mbili kama GIF, majaribio ya kimwingiliano yaliyo katika mfumo wa mchezo, modeli ya pande tatu, na zoezi fupi mwishoni mwa kila umahiri.",
      quiz: "Zoezi",
      next: "Inayofuata",
      previous: "Awali",
      activityUnavailable: "Shughuli hii kwa sasa haipatikani",
      learningContents: "Maudhui ya ujifunzaji",
      reloadPage: "Tafadhali pakia upya ukurasa, kuna hitilafu",
    }
    : {
      errorLoadingChapter: "Error while loading chapter",
      loadingChapterHelp:
        "Make sure you are connected to stable internet or try to reload the page",
      noContentAvailable: "No content available",
      notesSummary:
        "These notes include at least one video, two-dimensional images such as GIFs, interactive gamified experiments, a three-dimensional model, and a short quiz at the end of each competency.",
      quiz: "Quiz",
      next: "Next",
      previous: "Previous",
      activityUnavailable: "This activity currently not available",
      learningContents: "Learning contents",
      reloadPage: "Try to reload the page, something went wrong",
    },
);
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
const chapters = reactive<{
  list: any[];
  notes: any | null;
  status: string;
  error: any;
  currentChapterId: string | null;
  notesStatus: "pending" | "success" | "error" | "empty";
  questions: any[] | null;
  number: number;
  isAttemptingQuizes: boolean;
}>({
  list: [],
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
const activePopupActivityId = computed(() => String(activityPopupId.value ?? ""));

// Changer Chapter
const changeChapter = (action: string) => {
  if (chapters.number >= 1 && chapters.number <= chapters.list?.length) {
    // p = Previous and n = Next
    if (action.toLowerCase() == "p") {
      chapters.number == 1 ? "" : chapters.number--;
      getChapter(chapters.list && chapters.list[chapters.number - 1]._id);
      chapters.isAttemptingQuizes = false; //close quiz
    } else if (action.toLowerCase() == "n") {
      // n = Next Chapter
      chapters.number == (chapters.list)?.length ? "" : chapters.number++;
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
  const experimentContainer = document.getElementById(`experiment-container`) as HTMLElement;
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

const closeInteractivePopup = async () => {
  experimrntUrl.value = null;
  activityPopupId.value = "";

  if (import.meta.client && document.fullscreenElement) {
    await document.exitFullscreen().catch(() => null);
  }

  isFullscreen.value = false;
};

// const istoggleSidebar = ref(false)

const toggleSidebar = () => {
  if (import.meta.client) {
    const sidebar = document.querySelector(".sidebar");
    sidebar?.classList.toggle("right-0");
  }
};

// Helper functions 
const ensureAccessTokenValid = async () => {
  if (isTokenExpiringSoon(signInAccessToken.value as string, 60)) {
    const response = await refreshToken().catch(() => null);

    if (response && 'access_token' in response) {
      signInAccessToken.value = (response as { access_token: string }).access_token;
    } else {
      redirectToAuth();
    }
  }
};

const initializeChapterProgress = (chapterId: string) => {
  chapterProgress.value = {
    userId: (userToken.value as any)?._id,
    chapterId: chapterId,
    videoProgress: 0,
    notesProgress: 0,
    experimentsAttempted: 0,
    totalExperiments: 0,
    assessmentsAttempted: 0,
    totalAssessments: 0,
  };
};

const postInitialProgressIfNeeded = async (chapterId: string) => {
  try {
    await $fetch("/api/progress/post-progress", {
      method: "POST",
      body: {
        userId: (userToken.value as any)?._id,
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

const syncRemoteProgress = async (chapterId: string) => {
  try {
    const remoteProgress = await $fetch<{
      userId: string;
      chapterId: string;
      videoProgress: number;
      notesProgress: number;
      experimentsAttempted: number;
      totalExperiments: number;
      assessmentsAttempted: number;
      totalAssessments: number;
    }>(
      apiDocs.progressTracking.getProgresschapterId.replace("{chapterId}", chapterId),
      { headers: { Authorization: `Bearer ${signInAccessToken.value}` } }
    );

    if (
      remoteProgress.userId === chapterProgress.value?.userId &&
      remoteProgress.chapterId === chapterProgress.value?.chapterId
    ) {
      Object.keys(remoteProgress).forEach((key) => {
        const typedKey = key as keyof typeof remoteProgress;
        if (
          typeof remoteProgress[typedKey] === "number" &&
          remoteProgress[typedKey] > chapterProgress.value[typedKey]
        ) {
          chapterProgress.value[typedKey] = remoteProgress[typedKey];
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

// Store context in localStorage for AI Assistant
const storeChapterContext = (chapterId: string, chapterNotes: any) => {
  if (!import.meta.client) return; // Only run on client
  const fallbackChapterName =
    chapterNotes?.name ||
    chapters.list?.find((chapter: any) => chapter?._id === chapterId)?.name ||
    "";

  const context = {
    chapterId: chapterId,
    chapterName: fallbackChapterName || 'this competence',
    subject: topicStandard,
    level: topicLevel,
    topic: topicTitle,
    chapterNo: chapterNotes?.chapterNo || null,
    timestamp: Date.now(), // Store timestamp for cache invalidation
  };

  // Only store if chapterName is valid (not "this competence" or empty)
  if (!context.chapterName || context.chapterName === 'this competence' || !context.chapterName.trim()) {
    console.warn('[Topic Page] ⚠️ Skipping context storage - invalid chapter name:', context.chapterName);
    return;
  }

  try {
    localStorage.setItem('tie-ai-assistant-context', JSON.stringify(context));
    console.log('[Topic Page] ✅ Stored chapter context in localStorage:', context);
  } catch (error) {
    console.warn('[Topic Page] ⚠️ Failed to store context in localStorage:', error);
  }
};

// Main function 
const getChapter = async (chapterId: string) => {
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
  activityPopupId.value = "";
  experimrntUrl.value = null;
  isFullscreen.value = false;
  handleAudio(); // Pause any playing audio when chapter changes
  await ensureAccessTokenValid();
  announcement.value = `Loading activity of ${chapters.list?.find(c => c._id === chapterId)?.name} content please wait`;
  try {
    const response = await $fetch(
      apiDocs.chapters.getChapterId.replaceAll(":id", chapterId),
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${signInAccessToken.value}`,
        },
      }
    );

    if (response) {
      chapters.notesStatus = "success";
      chapters.notes = response;

      // Store context in localStorage for AI Assistant
      storeChapterContext(chapterId, response);

      const tasks = [
        getQNTopicChapter(chapterId),
        postInitialProgressIfNeeded(chapterId),
        syncRemoteProgress(chapterId),
      ];

      if (
        (chapterProgress.value as any)?.userId === (userToken.value as any)?._id &&
        (chapterProgress.value as any)?.chapterId === chapterId
      ) {
        tasks.push(updateChapterProgress());
      }

      await Promise.allSettled(tasks);
      announcement.value = `content of ${chapters.list?.find(c => c._id === chapterId)?.name} loaded successfully you may continue reading`;
      await nextTick(() => {
        moveFocus('main-container');
      });
    }
  } catch (error) {
    chapters.notesStatus = "error";
    chapters.error = error;
    console.error("[Error fetching activity detail details]:", error);
    announcement.value = 'Something went wrong , fetch failed'
  }
};


// Submit Topic viewed Read
const topicViewedRead = async (topicId: string) => {
  await $fetch(apiDocs.topics.topicViewedRead.replaceAll("{id}", topicId), {
    headers: {
      Authorization: `Bearer ${signInAccessToken.value}`,
    },
  });
};

// Fetch Questions by Topic Chapter
const getQNTopicChapter = async (chapterId: string) => {
  try {
    const response = await $fetch<any[]>(apiDocs.chapters.getTopicChapterQNs, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${signInAccessToken.value}`,
      },
      params: {
        topic: topicId as string,
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

// Fetch topic information
try {
  const { data: response, status } = await fetchAsyncData(
    `chapters-${topicId}`,
    () => $fetch(apiDocs.topics.getTopicId.replaceAll(':id', topicId as string), {
      headers: {
        Authorization: `Bearer ${signInAccessToken.value}`,
      },
    })
  );

  if (response) {
    chapters.status = status.value;
    chapters.list = (response.value.chapters as any[]) || [];
    const firstChapterId = chapters.list[0]?._id;
    chapters.currentChapterId = firstChapterId || null;
    topicLanguageData.value = (response.value.languageData as any[])?.[0] || { name: contentLayoutLanguage.value, _id: "" };

    if (firstChapterId && chapters.list.length) {
      const firstChapter = chapters.list[0];
      storeChapterContext(firstChapterId, {
        name: firstChapter.name,
        chapterNo: firstChapter.chapterNo,
      });
      getChapter(firstChapterId);
    } else {
      chapters.notesStatus = "empty";
      announcement.value = "No content available for this topic";
    }
  }
} catch (error) {
  chapters.status = "error";
  chapters.error = error;
  signInAccessToken.value = null;
  userToken.value = null;
  redirectToAuth();
}

// Call Submit Topic Viewed Read
if (!userViewedTopic.value) {
  topicViewedRead(topicId as string);
}

watch(
  () => userToken.value,
  (token) => {
    // Get the router instance
    if (!token) {
      redirectToAuth();
    }
  }
);

onMounted(async () => {
  // Trigger MathJax rendering (guard for environments without typeset)
  const mathJax = (window as any).MathJax;
  if (mathJax && typeof mathJax.typeset === 'function') {
    mathJax.typeset();
  } else if (mathJax && typeof mathJax.typesetPromise === 'function') {
    mathJax.typesetPromise();
  } else if ((window as any).mathJaxLoaded && (window as any).MathJaxRender) {
    (window as any).MathJaxRender([document.body]);
  }

  // Call functin for set Pic Center
  setPicCenter();
});

const updateInteractiveVideoLinks = async () => {
  if (!import.meta.client || !notesContainer.value) return;

  const container = notesContainer.value as HTMLElement;
  if (!signInAccessToken.value || !container) return;
  const links = Array.from(
    container?.querySelectorAll<HTMLAnchorElement>(
      'a[data-interactive-video-link="true"][data-video-id]'
    )
  );

  if (links.length === 0) return;

  await ensureAccessTokenValid();

  const videoIds = Array.from(
    new Set(
      links
        .map((link) => link.dataset.videoId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const availability = new Map<string, boolean>();

  await Promise.all(
    videoIds.map(async (videoId) => {
      try {
        const data = await $fetch<any>(
          apiDocs.videos.getVideoInteractionsLoad.replace("{id}", videoId),
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${signInAccessToken.value}`,
            },
          }
        );
        availability.set(videoId, Array.isArray(data) && data.length > 0);
      } catch (err) {
        availability.set(videoId, false);
      }
    })
  );

  links.forEach((link) => {
    const videoId = link.dataset.videoId;
    if (!videoId) return;
    if (availability.get(videoId)) {
      link.classList.remove("hidden");
      link.classList.add("inline-flex");
    } else {
      link.classList.add("hidden");
      link.classList.remove("inline-flex");
    }
  });
};

// Watch chapter notes and Then, Set Pic Center
watch(
  () => chapters.notes,
  async (newNotes) => {
    if (newNotes) {
      await nextTick();
      setPicCenter();
      await updateInteractiveVideoLinks();
      // Update localStorage context when notes change
      if (chapters.currentChapterId) {
        storeChapterContext(chapters.currentChapterId, newNotes);
      }

      // initilize audio players if any
      initAudioCanvasPlayers();
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
        images[0]?.classList.add("pic-center");
      } else {
        // Style spans only if they (or their descendants) contain <img>
        p.querySelectorAll("span").forEach((span) => {
          if (span.querySelector("img")) {
            const images = span.querySelectorAll("img")
            if (images.length === 1 &&
              (images[0]?.classList.contains('desc-img') ||
                images[0]?.classList.contains('desc-img-eng-think') || images[0]?.classList.contains('desc-img-eng-doyoknow')))
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
            (images[0]?.classList.contains('desc-img') ||
              images[0]?.classList.contains('desc-img-eng-think') || images[0]?.classList.contains('desc-img-eng-doyoknow')))
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

  const el = notesContainer.value as HTMLElement;

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
    (notesContainer.value as HTMLElement).addEventListener("scroll", handleScroll);
    const videoPlayer = (notesContainer.value as HTMLElement).querySelector("#video-player") as HTMLVideoElement;
    if (videoPlayer) {
      //setting user id and chapter id on play
      if (chapterProgress) {
        if (
          (chapterProgress?.value as any).userId !== (userToken.value as any)?._id ||
          (chapterProgress?.value as any).chapterId !== chapters.currentChapterId
        ) {
          (chapterProgress.value as any).userId = (userToken.value as any)?._id;
          (chapterProgress.value as any).chapterId = chapters.currentChapterId;
        }
      }
      else {
        initializeChapterProgress(chapters.currentChapterId as string)
      }

      // returning to previous progress is are available when video loaded
      videoPlayer.addEventListener("loadedmetadata", () => {
        if (
          chapterProgress?.value &&
          (chapterProgress?.value as any).userId === (userToken.value as any)?._id &&
          (chapterProgress?.value as any).chapterId === chapters.currentChapterId
        ) {
          const targetTime = Math.floor(
            ((chapterProgress?.value as any).videoProgress / 100) *
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
          (chapterProgress.value as any).userId = (userToken.value as any)._id;
          (chapterProgress.value as any).chapterId = chapters.currentChapterId;
        }
      });

      // tracking video playing
      videoPlayer.addEventListener("timeupdate", () => {
        const progress = Math.floor(
          (videoPlayer.currentTime / videoPlayer.duration) * 100
        );
        (chapterProgress?.value as any).videoProgress < progress
          ? ((chapterProgress.value as any).videoProgress = progress)
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
      (notesContainer.value as HTMLElement).addEventListener("scroll", () => {
        if (scrollTop.value > (videoPlayer?.clientHeight / 2)) {
          videoPlayer.pause()
        }
      });

      videoPlayer.setAttribute("controlsList", "nodownload");
    }

    // zoom 3d models
    const modelViewer = (notesContainer?.value as any)?.querySelectorAll('model-viewer')
    const zoomInIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M8.195 0c4.527 0 8.196 3.62 8.196 8.084a8 8 0 0 1-1.977 5.267l5.388 5.473a.686.686 0 0 1-.015.98a.71.71 0 0 1-.993-.014l-5.383-5.47a8.23 8.23 0 0 1-5.216 1.849C3.67 16.169 0 12.549 0 8.084C0 3.62 3.67 0 8.195 0m0 1.386c-3.75 0-6.79 2.999-6.79 6.698s3.04 6.699 6.79 6.699s6.791-3 6.791-6.699c0-3.7-3.04-6.698-6.79-6.698m.11 2.19c.383 0 .693.314.693.702v2.976h2.976c.388 0 .703.31.703.693a.7.7 0 0 1-.703.693l-2.976-.001v2.977c0 .388-.31.703-.693.703a.7.7 0 0 1-.693-.703V8.64H4.636a.7.7 0 0 1-.702-.692c0-.383.314-.693.702-.693h2.976V4.278c0-.388.31-.703.693-.703"/></svg>`
    const zoomOutIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20"><path fill="currentColor" d="M8.195 0c4.527 0 8.196 3.62 8.196 8.084a8 8 0 0 1-1.977 5.267l5.388 5.473a.686.686 0 0 1-.015.98a.71.71 0 0 1-.993-.014l-5.383-5.47a8.23 8.23 0 0 1-5.216 1.849C3.67 16.169 0 12.549 0 8.084C0 3.62 3.67 0 8.195 0m0 1.386c-3.75 0-6.79 2.999-6.79 6.698s3.04 6.699 6.79 6.699s6.791-3 6.791-6.699c0-3.7-3.04-6.698-6.79-6.698m3.78 5.868c.387 0 .702.31.702.693a.7.7 0 0 1-.703.693H4.636a.7.7 0 0 1-.702-.693c0-.383.314-.693.702-.693z"/></svg>`
    const icon3D = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24"><path fill="currentColor" d="M7.47 21.5C4.2 19.94 1.86 16.76 1.5 13H0c.5 6.16 5.66 11 11.95 11l.66-.03l-3.81-3.81zm.89-6.54c-.19 0-.36-.03-.52-.08a1.1 1.1 0 0 1-.4-.24c-.11-.1-.2-.22-.26-.37c-.06-.14-.09-.3-.09-.47h-1.3c0 .36.07.7.21.95s.33.5.56.69c.24.18.51.32.82.41q.45.15.96.15c.37 0 .72-.05 1.03-.15c.32-.1.6-.25.83-.44s.42-.41.55-.72c.13-.29.2-.61.2-.97c0-.19-.02-.38-.07-.56c-.05-.16-.12-.35-.23-.51c-.1-.15-.24-.3-.4-.43c-.17-.13-.37-.22-.61-.31a2.07 2.07 0 0 0 .89-.75c.1-.16.17-.3.22-.46s.07-.32.07-.48q0-.54-.18-.96c-.14-.26-.29-.51-.51-.69c-.2-.19-.47-.33-.77-.43C9.05 8.05 8.71 8 8.34 8c-.34 0-.69.05-1 .16c-.3.11-.57.26-.79.45c-.21.19-.38.39-.51.67c-.12.26-.18.54-.18.85h1.3q0-.255.09-.45a.94.94 0 0 1 .25-.34c.11-.09.23-.17.38-.22s.3-.08.48-.08c.4 0 .7.1.89.31c.19.2.29.49.29.86c0 .18-.04.34-.08.49a.87.87 0 0 1-.25.37c-.11.1-.25.18-.41.24s-.36.09-.58.09h-.77v1.03h.77c.22 0 .42.02.6.07s.33.13.45.23c.12.11.23.24.29.4c.07.16.1.37.1.57c0 .41-.12.72-.35.93c-.23.23-.55.33-.95.33m8.55-5.92c-.32-.33-.7-.59-1.14-.77c-.43-.18-.92-.27-1.46-.27h-2.36v8h2.3c.55 0 1.06-.09 1.51-.27s.84-.43 1.16-.76s.58-.73.74-1.19c.17-.47.26-.99.26-1.57v-.4c0-.58-.09-1.1-.26-1.57c-.16-.47-.43-.87-.75-1.2m-.41 3.16c0 .42-.03.8-.12 1.13c-.1.33-.24.62-.43.85s-.45.41-.71.53q-.435.18-.99.18h-.91V9.12h.97c.72 0 1.27.23 1.64.69c.38.46.55 1.12.55 1.99M11.95 0l-.66.03l3.81 3.81l1.33-1.34c3.27 1.56 5.61 4.73 5.96 8.5h1.5c-.5-6.16-5.65-11-11.94-11"/></svg>`
    const showIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M17 8q-.425 0-.712-.288T16 7t.288-.712T17 6t.713.288T18 7t-.288.713T17 8m-8 6l2.7-3.5l1.55 2l2.3-3L19 14zm-5 8q-.825 0-1.412-.587T2 20V6h2v14h14v2zM6 9.375V4q0-.825.588-1.412T8 2h5v2H8v5.375zM8 18q-.825 0-1.412-.587T6 16v-4.625h2V16h5v2zm7 0v-2h5v-4.625h2V16q0 .825-.587 1.413T20 18zm5-8.625V4h-5V2h5q.825 0 1.413.588T22 4v5.375z"/></svg>`

    modelViewer.forEach((element: HTMLElement) => {
      // === Elements Creation ===
      const zoomButton = document.createElement('button');
      const label = document.createElement('button');
      const span = document.createElement('span');
      const coverImg = document.createElement('img');

      let isZoomed = false;
      let isCovered = true; // Initially covered

      // === Cover Image Setup ===
      coverImg.setAttribute('src', element.getAttribute('poster') as string);
      coverImg.className = `
    absolute top-0 -left-full h-full w-full z-4
    transition-all duration-500 ease-in-out  object-contain
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
      const match = text.match(/^(task|activity|example|exercise|revision (exercise|exercice))\s*\d+(\.\d+)?/i);

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
        getChapter(chapters.currentChapterId as string);
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
    (chapterProgress?.value as any).userId.toString().trim() == ""
      ? ((chapterProgress.value as any).userId = (userToken.value as any)?._id)
      : "";
    (chapterProgress?.value as any).chapterId.toString().trim() == ""
      ? ((chapterProgress.value as any).chapterId = chapters.currentChapterId)
      : "";
    (chapterProgress?.value as any).notesProgress < newPercent
      ? ((chapterProgress.value as any).notesProgress = newPercent)
      : "";
  }
  else {
    initializeChapterProgress(chapters.currentChapterId as string);
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

// Watch Exit interactive popup
watch(() => [experimrntUrl.value, activityPopupId.value], async ([newExperimentUrl, newActivityId]) => {
  if (!newExperimentUrl && !newActivityId) {
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
  <NuxtLayout name="home-layout" :language="contentLayoutLanguage" :education-level>
    <section v-if="experimrntUrl || activityPopupId" class="relative w-full center-height" id="experiment-container">
      <div
        class="absolute top-0 right-0 flex items-center justify-center w-10 h-10 p-2 bg-red-500 rounded-full cursor-pointer"
        @click="closeInteractivePopup">
        <Icon name="formkit:close" size="24" class="font-bold text-white" />
      </div>
      <iframe v-if="experimrntUrl" :src="experimrntUrl" frameborder="0" :class="[
        ' w-full  rounded-md !bg-white',
        isFullscreen ? ' min-h-dvh min-w-full' : 'h-full center-height',
      ]"></iframe>
      <div v-else :class="[
        'w-full rounded-md !bg-white overflow-y-auto',
        isFullscreen ? ' min-h-dvh min-w-full' : 'h-full center-height',
      ]">
        <div class="mx-auto w-full max-w-7xl p-3 md:p-6">
          <Activity v-if="activePopupActivityId" :key="activePopupActivityId" :activity-id="activePopupActivityId" />
        </div>
      </div>
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
        :topic-id="chapters.notes?.topic?._id ?? topicId" :subject-id="chapters.notes?.subject?._id ?? null"
        :level-id="chapters.notes?.level?._id ?? ((userToken as any)?.value?.level?._id ?? null)"
        :chapters-list="chapters.list?.length" :chapters-number="chapters?.number"
        :topic-language="topicLanguageData?.name"
        @emit-quiz-score="updateChapterProgress" />
    </div>

    <section v-else class="relative inline-flex w-full h-full overflow-hidden center-height">
      <!-- Loading state -->
      <div v-if="chapters.status == 'pending'" class="flex items-center justify-center w-full loading content-height">
        <LoadingIndicator :is-loading="true" />
      </div>

      <!-- Error state -->
      <div v-else-if="chapters.status == 'error'" class="flex flex-col items-center justify-center w-full gap-2 error">
        <MessagePageNotFound
          :message="pageUi.errorLoadingChapter"
          :subMessage="pageUi.loadingChapterHelp" />
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

        <div v-else-if="chapters.notesStatus == 'empty'"
          class="flex items-center justify-center w-full p-5 lg:w-3/4 lg:scroll-height lg:overflow-y-scroll">
          <MessageTopicNotFound
            :message="pageUi.noContentAvailable" />
        </div>

        <!-- Notes loaded successfully -->
        <div id="main-container" tabindex="-1" aria-live="polite" aria-label="compitence content loaded successfully"
          ref="notesContainer" v-else-if="chapters.notesStatus == 'success'"
          class="w-full py-5 lg:w-3/4 lg:scroll-height lg:overflow-y-scroll lg:px-5 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
          <!-- Topic Level Standard and Subject Indicator -->
          <div class="flex w-full min-w-0 items-center justify-between gap-2">
            <div class="flex min-w-0 flex-1 items-center gap-2">
              <button type="button"
                class="inline-flex shrink-0 items-center justify-center rounded-full border-2 border-oceanBlue p-2 text-oceanBlue transition-colors hover:bg-oceanBlue/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/50"
                aria-label="Back to interactive contents" @click="goToPreviousPage">
                <Icon name="vaadin:arrow-backward" size="22" class="text-oceanBlue" aria-hidden="true" />
              </button>

              <p :aria-label="`Competence header, ${chapters.notes?.name}`" role="heading"
                class="min-w-0 flex-1 truncate font-medium text-medium" v-if="chapters.status === 'success'">
                {{ chapters.notes?.name }}
              </p>
            </div>

            <div class="flex shrink-0 lg:hidden" @click="toggleSidebar()">
              <Icon name="basil:menu-outline" class="cursor-pointer" size="2rem" aria-hidden="true" />
            </div>
          </div>

          <!-- Description -->
          <div class="relative flex flex-col justify-center w-full gap-2 py-3 content-view">

            <!-- Chapter Notes -->
            <div v-mathjax class="mx-auto notes md:px-4 w-full max-w-7xl flex-1" aria-label="Compitencies notes"
              aria-details="notes-extra-details" role="region"
              v-html="enhanceAccessibility(conversationParser(activityParser(experimentParser(modelParser(mediaParser(chapters.notes?.content))))))">
            </div>

            <p id="notes-extra-details" class="sr-only">
              {{ pageUi.notesSummary }}
            </p>

            <!-- Chapter Button - (Quiz) -->
            <div v-if="chapters.questions && chapters.questions?.length > 0"
              class="flex items-center justify-center w-full">
              <button
                class="h-10 px-4 text-white uppercase transition-colors duration-500 ease-in-out rounded-md cursor-pointer bg-oceanBlue hover:bg-deepBlue"
                @click="chapters.isAttemptingQuizes = true">
                {{ pageUi.quiz }}
              </button>
            </div>

            <!-- Next and Previous chapter Action -->
            <div class="flex flex-row-reverse items-center justify-between lg:hidden">
              <!-- Next Chapter -->
              <button @click="changeChapter('n')" :disabled="chapters.number == chapters.list?.length" :class="[
                'flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue',
                { 'opacity-0': chapters.number == chapters.list?.length }]">
                <p class="flex gap-2 capitalize">
                  {{ pageUi.next }}
                </p>
                <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                  <Icon name="weui:arrow-filled" size="20" class="text-oceanBlue" />
                </div>
              </button>

              <!-- Previous Chapter -->
              <button @click="changeChapter('p')" :disabled="chapters.number <= 1" :class="[
                'flex items-center justify-center h-10 gap-4 px-4 text-white rounded-md bg-oceanBlue hover:bg-deepBlue',
                { 'opacity-0': chapters.number <= 1 }
              ]">
                <div class="flex items-center justify-center w-4 h-4 bg-white rounded-full animate-bounce-horizontal">
                  <Icon name="weui:arrow-filled" size="20" class="transform rotate-180 text-oceanBlue" />
                </div>
                <p class="flex gap-2 capitalize">
                  {{ pageUi.previous }}
                </p>
              </button>
            </div>
          </div>
        </div>

        <!-- Notes failed to load -->
        <div aria-live="polite" aria-label="error,activity not found" v-else
          class="flex items-center justify-center w-full p-5 lg:w-3/4 lg:scroll-height lg:overflow-y-scroll">
          <MessageTopicNotFound
            :message="pageUi.activityUnavailable" />
        </div>

        <!-- Sidebar w-1/4 -->
        <div tabindex="0"
          class="sidebar transition-all duration-700 ease-in-out absolute -right-[500%] lg:right-0 top-0 md:w-[400px] w-full lg:w-1/4 h-full p-2 lg:static bg-white lg:scroll-height lg:overflow-y-scroll">
          <div class="flex items-center justify-between mb-4">
            <h1 aria-label="Activity list" class="pt-5 pl-4 font-medium  text-medium">{{ pageUi.learningContents }}</h1>
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
        <p>{{ pageUi.reloadPage }}</p>
      </div>
    </section>

    <!-- AI Assistant -->
    <!-- Use chapters.notes._id as primary source since it's the actual ID from API response -->
    <AIAssistant v-if="chapters.notes?._id" :chapter-id="chapters.notes._id" :topic-language="topicLanguageData?.name"
      :chapter-name="chapters.notes?.name || 'this competence'" :subject="topicStandard" :level="topicLevel"
      :topic="topicTitle" :chapter-no="chapters.notes?.chapterNo" :audios="chapters.notes?.audios || []" />

    <!--  -->
    <!-- screen reader notifier -->
    <div class="sr-only" aria-live="assertive" aria-atomic role="status">
      {{ announcement }}
    </div>
    {{ console.log(topicLanguageData) }}
  </NuxtLayout>

</template>
