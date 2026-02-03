<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import { extractSubjectSlugs, normalizeSubjectSlug } from "~/config/aiLauncherConfig";

const route = useRoute();
const router = useRouter();

const userToken = useCookie("signInUserToken");
const accessToken = useCookie("signInAccessToken");

const tieOverlayOpening = useState<boolean>("tie-ai-overlay-opening", () => false);
const tieOverlayOpen = useState<boolean>("tie-ai-overlay-open", () => false);
const tieOverlayBackground = useState<string>("tie-ai-overlay-background", () => "");
const tieOverlayPushed = useState<boolean>("tie-ai-overlay-pushed", () => false);
const subjectTeacherOpen = useState<boolean>("ai-subject-teacher-is-open", () => false);
const allowedSubjectSlugs = useState<string[]>("ai-launcher-allowed-subjects", () => []);
const openSubjectTeacherSignal = useState<number>(
  "ai-subject-teacher-open-signal",
  () => 0
);
const isLoadingAllowedSubjects = ref(false);

const EXCLUDED_PREFIXES = [
  "/tie-ai-teacher",
  "/auth",
  "/admin",
  "/smart-class",
];
const EXCLUDED_EXACT = [
];

const isLoggedIn = computed(() => !!(userToken.value || accessToken.value));
const isBusy = computed(
  () => tieOverlayOpening.value || tieOverlayOpen.value || subjectTeacherOpen.value
);

const isExcluded = computed(() => {
  const path = route.path.toLowerCase();
  if (EXCLUDED_EXACT.includes(path)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix));
});

const loadAllowedSubjects = async () => {
  if (!isLoggedIn.value) return;
  if (isLoadingAllowedSubjects.value || allowedSubjectSlugs.value.length > 0) return;

  isLoadingAllowedSubjects.value = true;
  try {
    const response = await $fetch(apiDocs.subjects.getPublicSubjects);
    allowedSubjectSlugs.value = extractSubjectSlugs(response);
  } catch (error) {
    console.warn("[GlobalLauncher] Failed to load allowed subjects:", error);
  } finally {
    isLoadingAllowedSubjects.value = false;
  }
};

watch(isLoggedIn, (loggedIn) => {
  if (loggedIn) loadAllowedSubjects();
}, { immediate: true });

const hasValidSubjectContext = computed(() => {
  const params = route.params as Record<string, unknown>;
  const idCandidates = [
    params.topicId,
    params.chapterId,
    params.subjectId,
    params.videoId,
    params.audioId,
    params.experimentId,
    params.id,
  ];
  const hasValidId = idCandidates.some(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  const querySubject =
    typeof route.query.subject === "string" ? route.query.subject : "";
  const subjectSlugRaw = params.level ?? params.subject ?? params.subjectSlug ?? querySubject;
  const subjectSlug = normalizeSubjectSlug(subjectSlugRaw);
  const isAllowed =
    allowedSubjectSlugs.value.length === 0
      ? Boolean(subjectSlug)
      : allowedSubjectSlugs.value.includes(subjectSlug);

  return hasValidId && isAllowed;
});

const showLauncher = computed(
  () => isLoggedIn.value && !isExcluded.value && !isBusy.value
);

const openTieOverlay = async () => {
  if (tieOverlayOpen.value || tieOverlayOpening.value) return;
  tieOverlayOpening.value = true;
  try {
    tieOverlayBackground.value = route.fullPath;
    tieOverlayPushed.value = true;
    const query = {
      ...route.query,
      overlay: "1",
    } as Record<string, unknown>;
    const state = {
      aiOverlay: true,
      aiOverlayBackground: route.fullPath,
    };
    await router.push({ query, state });
    tieOverlayOpen.value = true;
  } finally {
    tieOverlayOpening.value = false;
  }
};

const handleClick = async () => {
  if (!showLauncher.value) return;
  if (hasValidSubjectContext.value) {
    openSubjectTeacherSignal.value += 1;
    return;
  }
  await openTieOverlay();
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="showLauncher"
      class="fixed z-[80] right-4 bottom-[calc(16px+env(safe-area-inset-bottom))]"
    >
      <div class="absolute inset-0 rounded-full bg-[rgba(245,245,245,0.35)] backdrop-blur-sm pointer-events-none"></div>
      <button
        type="button"
        class="relative flex h-14 w-14 items-center justify-center rounded-full bg-oceanBlue text-white border border-white/80 ring-2 ring-white/90 shadow-2xl transition hover:bg-deepBlue focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-oceanBlue"
        aria-label="Open AI assistant"
        :disabled="isBusy"
        @click="handleClick"
      >
        <Icon name="fluent:bot-28-filled" size="24" />
      </button>
    </div>
  </Teleport>
</template>
