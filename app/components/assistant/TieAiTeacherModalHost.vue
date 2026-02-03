<script setup lang="ts">
import TieAiTeacherWorkspace from "~/components/assistant/TieAiTeacherWorkspace.vue";

const route = useRoute();
const router = useRouter();

const accessToken = useCookie("signInAccessToken");
const userToken = useCookie("signInUserToken");

const tieOverlayOpen = useState<boolean>("tie-ai-overlay-open", () => false);
const tieOverlayOpening = useState<boolean>("tie-ai-overlay-opening", () => false);
const tieOverlayBackground = useState<string>("tie-ai-overlay-background", () => "");
const tieOverlayPushed = useState<boolean>("tie-ai-overlay-pushed", () => false);

const modalRef = ref<HTMLElement | null>(null);
const lastFocused = ref<HTMLElement | null>(null);
let previousBodyOverflow = "";

const hasOverlayMarker = computed(() => route.query.overlay === "1");
const isLoggedIn = computed(() => !!(accessToken.value || userToken.value));

const hasOverlayState = computed(() => {
  const stateFromRoute = route.state as Record<string, unknown> | undefined;
  const stateFromHistory =
    typeof window !== "undefined"
      ? (window.history.state as Record<string, unknown> | null)
      : null;

  const routeStateValid =
    stateFromRoute?.aiOverlay === true &&
    typeof stateFromRoute?.aiOverlayBackground === "string";
  const historyStateValid =
    stateFromHistory?.aiOverlay === true &&
    typeof stateFromHistory?.aiOverlayBackground === "string";
  const pushedStateValid = tieOverlayPushed.value && !!tieOverlayBackground.value;
  return routeStateValid || historyStateValid || pushedStateValid;
});

const overlaySessionId = computed(() => {
  const sessionId = route.query.sessionId;
  return typeof sessionId === "string" ? sessionId : "";
});

const removeOverlayMarkers = async () => {
  const nextQuery = { ...route.query } as Record<string, unknown>;
  delete nextQuery.overlay;
  await router.replace({ query: nextQuery });
};

const clearOverlayState = () => {
  tieOverlayPushed.value = false;
  tieOverlayBackground.value = "";
  tieOverlayOpen.value = false;
  tieOverlayOpening.value = false;
};

const lockScroll = () => {
  if (typeof document === "undefined") return;
  previousBodyOverflow = document.body.style.overflow;
  document.body.style.overflow = "hidden";
};

const restoreScroll = () => {
  if (typeof document === "undefined") return;
  document.body.style.overflow = previousBodyOverflow;
};

const closeOverlay = async () => {
  tieOverlayOpen.value = false;
  const target = tieOverlayBackground.value || "/";
  clearOverlayState();
  await router.replace(target);
};

const expandToFullPage = async () => {
  const sessionId = overlaySessionId.value;
  tieOverlayOpen.value = false;
  tieOverlayOpening.value = false;
  await router.push({
    path: "/tie-ai-teacher",
    query: sessionId ? { sessionId } : {},
    state: {
      fromOverlay: true,
      aiOverlayBackground: tieOverlayBackground.value || route.fullPath,
    },
  });
};

const onKeydown = async (event: KeyboardEvent) => {
  if (!tieOverlayOpen.value) return;

  if (event.key === "Escape") {
    event.preventDefault();
    await closeOverlay();
    return;
  }

  if (event.key !== "Tab" || !modalRef.value) return;

  const focusable = modalRef.value.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  if (!focusable.length) return;

  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const active = document.activeElement as HTMLElement | null;

  if (event.shiftKey && (active === first || !active)) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
};

watch(
  () => [route.fullPath, isLoggedIn.value],
  async () => {
    if (!isLoggedIn.value) {
      await removeOverlayMarkers();
      clearOverlayState();
      return;
    }

    if (!hasOverlayMarker.value) {
      tieOverlayOpen.value = false;
      return;
    }

    // Non-sticky rule: overlay marker without valid state falls back to full page route.
    if (!hasOverlayState.value) {
      clearOverlayState();
      await removeOverlayMarkers();
      return;
    }

    tieOverlayOpen.value = true;
  },
  { immediate: true }
);

watch(
  () => tieOverlayOpen.value,
  async (open) => {
    if (typeof window === "undefined") return;

    if (open) {
      tieOverlayOpening.value = false;
      lastFocused.value = document.activeElement as HTMLElement | null;
      lockScroll();
      window.addEventListener("keydown", onKeydown);
      await nextTick();
      modalRef.value?.focus();
      return;
    }

    restoreScroll();
    window.removeEventListener("keydown", onKeydown);
    lastFocused.value?.focus?.();
  },
  { immediate: true }
);

onBeforeUnmount(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", onKeydown);
  }
  restoreScroll();
});
</script>

<template>
  <Teleport to="body">
    <div
      v-if="tieOverlayOpen"
      class="fixed inset-0 z-[120] bg-black/40"
      @click.self="closeOverlay"
    >
      <div
        ref="modalRef"
        class="fixed z-50 flex flex-col w-full max-w-md bg-white border border-gray-200 rounded-lg shadow-2xl right-6 overflow-visible"
        :style="{
          height: '600px',
          bottom: '24px',
          maxHeight: 'calc(100vh - 48px)',
          transition: 'bottom 0.3s ease-in-out, max-height 0.3s ease-in-out'
        }"
        role="dialog"
        aria-modal="true"
        aria-label="TIE AI Teacher"
        tabindex="-1"
      >
        <div class="absolute right-2 top-2 z-20 flex items-center gap-1">
          <button
            type="button"
            class="rounded bg-white/90 p-1 text-gray-700 shadow hover:text-black"
            aria-label="Open TIE AI Teacher page"
            @click.stop="expandToFullPage"
          >
            <Icon name="mdi:arrow-expand" size="18" />
          </button>
          <button
            type="button"
            class="rounded bg-white/90 p-1 text-gray-700 shadow hover:text-black"
            aria-label="Close TIE AI Teacher modal"
            @click.stop="closeOverlay"
          >
            <Icon name="mdi:close" size="18" />
          </button>
        </div>

        <TieAiTeacherWorkspace :external-session-id="overlaySessionId" :compact="true" />
      </div>
    </div>
  </Teleport>
</template>
