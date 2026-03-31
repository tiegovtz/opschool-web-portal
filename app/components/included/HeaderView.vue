<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import { layoutEffect } from "~/utilities/controlls";
import messages from "~/utilities/messages";
import ConfirmationModal from "~/components/ai-teacher/ConfirmationModal.vue";
import { useNavigationStore } from "~/stores/navigationStore";
import type { LanguageSupport } from "~/types/language.interface";
import {
  getHubLanguage,
  getHubLanguageCode,
  getHubPath,
  normalizeEducationLevel,
  normalizeLanguageSupport,
} from "~/utilities/educationRoute";

const props = withDefaults(
  defineProps<{ educationLevel?: string; language?: LanguageSupport }>(),
  {
    language: "english",
  },
);

const userToken = useCookie<any>("signInUserToken");
const accessToken = useCookie("signInAccessToken");
const refreshToken = useCookie("signInRefreshToken");
const route = useRoute();
const router = useRouter();
const navigationStore = useNavigationStore();
const hubEducationLevel = useHubEducationLevel();
const primaryContentLanguage = usePrimaryContentLanguage();
const hubHeaderLang = useHubHeaderLanguage();

const matchesPath = (path: string) =>
  route.path === path || route.path.startsWith(`${path}/`);

const isHomeRoute = computed(
  () =>
    route.path === "/" || matchesPath("/secondary") || matchesPath("/primary"),
);
const isSmartClassRoute = computed(() => matchesPath("/smart-class"));
const isLearningStatisticsRoute = computed(() =>
  matchesPath("/profile/learning-statistics"),
);
const isAccountRoute = computed(
  () =>
    route.path === "/profile" ||
    (matchesPath("/profile") && !isLearningStatisticsRoute.value),
);
const isAccountSectionRoute = computed(
  () => isAccountRoute.value || isLearningStatisticsRoute.value,
);

const desktopNavItemClass =
  "flex items-center gap-2 rounded-[6px] px-3 py-1 text-center text-white text-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-oceanBlue";
const mobileNavItemClass =
  "flex items-center justify-center gap-2 rounded-[6px] px-3 py-1 text-center text-white text-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-oceanBlue";
const activeNavItemClass = "bg-deepBlue text-white shadow-sm";
const inactiveNavItemClass = "hover:bg-deepBlue/85 hover:shadow-sm";

const PROTECTED_RETURN_PREFIXES = [
  "/interactive/",
  "/video/",
  "/audio/",
  "/experiments/",
  "/tie-ai-teacher",
];

const shouldRememberCurrentRoute = () =>
  PROTECTED_RETURN_PREFIXES.some(
    (prefix) => route.path === prefix || route.path.startsWith(prefix),
  );

const showLogoutConfirm = ref(false);
const showLogoutToast = ref(false);
const logoutToastTimeout = ref<null | any>(null);
const logoutAlert = ref<HTMLElement | null>(null);
const isHomeMenuOpen = ref(false);
const isAccountMenuOpen = ref(false);

const logout = () => {
  if (shouldRememberCurrentRoute()) {
    navigationStore.setGoBack(route.fullPath);
  }

  userToken.value = null;
  accessToken.value = null;
  refreshToken.value = null;

  layoutEffect.value = "grid";
  window.location.assign("/");
  closeAccountMenu();

  // Screen reader announcement
  if (logoutAlert.value) {
    logoutAlert.value.textContent = "";
    setTimeout(() => {
      if (logoutAlert.value) {
        logoutAlert.value.textContent = messages.success.auth.loggedOut;
      }
    }, 50);
  }

  // Show toast feedback
  showLogoutToast.value = true;
  if (logoutToastTimeout.value) clearTimeout(logoutToastTimeout.value);
  logoutToastTimeout.value = setTimeout(() => {
    showLogoutToast.value = false;
    logoutToastTimeout.value = null;
  }, 4000);
};

const onLogoutConfirm = () => {
  showLogoutConfirm.value = false;
  logout();
};

const onLogoutCancel = () => {
  showLogoutConfirm.value = false;
};

const toggleAccountMenu = () => {
  isHomeMenuOpen.value = false;
  isAccountMenuOpen.value = !isAccountMenuOpen.value;
};

const closeAccountMenu = () => {
  isAccountMenuOpen.value = false;
};

const toggleHomeMenu = () => {
  closeAccountMenu();
  isHomeMenuOpen.value = !isHomeMenuOpen.value;
};

const closeHomeMenu = () => {
  isHomeMenuOpen.value = false;
};

const openLogoutConfirmFromMenu = () => {
  closeAccountMenu();
  showLogoutConfirm.value = true;
};

const inferredRouteEducationLevel = computed(() => {
  if (route.path === "/primary" || route.path.startsWith("/primary/")) {
    return "primary";
  }

  if (route.path === "/secondary" || route.path.startsWith("/secondary/")) {
    return "secondary";
  }

  if (
    String(route.params.level ?? "")
      .toLowerCase()
      .includes("darasa")
  ) {
    return "primary";
  }

  const routeLevel = route.query.educationLevel ?? route.query.edl;
  if (routeLevel) {
    return normalizeEducationLevel(routeLevel);
  }

  return hubEducationLevel.value;
});

const currentEducationLevel = computed(() =>
  props.educationLevel
    ? normalizeEducationLevel(props.educationLevel)
    : inferredRouteEducationLevel.value,
);

const showPrimaryLanguageSwitch = computed(
  () =>
    route.path === "/primary" ||
    route.path.startsWith("/primary/") ||
    String(route.params.level ?? "")
      .toLowerCase()
      .includes("darasa") ||
    normalizeEducationLevel(
      route.query.educationLevel ?? route.query.edl,
      "secondary",
    ) === "primary",
);

const activePrimaryLanguage = computed<LanguageSupport>(() =>
  showPrimaryLanguageSwitch.value
    ? normalizeLanguageSupport(route.query.lang, primaryContentLanguage.value)
    : "english",
);

const languageSwitchContent = computed(() =>
  props.language === "kiswahili"
    ? {
        // label: "Lugha",
        english: "English",
        kiswahili: "Kiswahili",
      }
    : {
        // label: "Language",
        english: "English",
        kiswahili: "Kiswahili",
      },
);

const homeHubLabel = computed(() => {
  return props.language === "kiswahili" ? "Nyumbani" : "Home";
});

const homeMenuItems = computed(() => [
  {
    educationLevel: "primary" as const,
    label: props.language === "kiswahili" ? "Msingi" : "Primary",
  },
  {
    educationLevel: "secondary" as const,
    label: props.language === "kiswahili" ? "Sekondari" : "Secondary",
  },
]);

const setPrimaryLanguage = async (language: LanguageSupport) => {
  if (!showPrimaryLanguageSwitch.value) return;

  const normalizedLanguage = normalizeLanguageSupport(language, "kiswahili");
  primaryContentLanguage.value = normalizedLanguage;

  await router.replace({
    path: route.path,
    query: {
      ...route.query,
      lang: getHubLanguageCode("primary", normalizedLanguage),
    },
  });
};

const setPrimaryLanguageFromAccountMenu = async (language: LanguageSupport) => {
  await setPrimaryLanguage(language);
  closeAccountMenu();
};

const navigateToHomeHub = async (educationLevel: "primary" | "secondary") => {
  hubEducationLevel.value = educationLevel;
  hubHeaderLang.value = getHubLanguage(
    educationLevel,
    educationLevel === "primary" ? primaryContentLanguage.value : "english",
  );
  closeHomeMenu();
  closeAccountMenu();
  await router.push(getHubPath(educationLevel));
};

const authReturnQuery = computed(() => {
  const p = route.path;
  if (
    p === "/primary" ||
    p.startsWith("/primary/") ||
    p === "/secondary" ||
    p.startsWith("/secondary/")
  ) {
    return { redirect: route.fullPath };
  }
  return {};
});

const authSignInTo = computed(() =>
  Object.keys(authReturnQuery.value).length
    ? { path: "/auth", query: authReturnQuery.value }
    : "/auth",
);

const authSignUpTo = computed(() =>
  Object.keys(authReturnQuery.value).length
    ? { path: "/auth/SignUp", query: authReturnQuery.value }
    : "/auth/SignUp",
);

watch(
  () => route.fullPath,
  () => {
    closeHomeMenu();
    closeAccountMenu();
  },
);

watch(
  activePrimaryLanguage,
  (language) => {
    if (showPrimaryLanguageSwitch.value) {
      primaryContentLanguage.value = language;
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (logoutToastTimeout.value) clearTimeout(logoutToastTimeout.value);
});
</script>

<template>
  <!-- Header -->
  <header
    class="relative shadow-sm bg-[url('/flag/tenor.gif')] bg-cover bg-center bg-no-repeat"
    role="navigation"
  >
    <nav class="flex flex-col items-center bg-white bg-opacity-75">
      <!-- Header -->
      <included-upper-header
        class="w-full"
        :language
      />
      <div class="w-full">
        <!-- Media Screen -->
        <div
          class="flex-col items-center hidden w-full gap-2 text-white md:flex md:flex-row bg-oceanBlue rounded-xs wrapper-container"
        >
          <div class="relative">
            <button
              type="button"
              aria-label="Open home menu"
              :aria-current="isHomeRoute ? 'page' : undefined"
              :class="[
                desktopNavItemClass,
                isHomeRoute || isHomeMenuOpen
                  ? activeNavItemClass
                  : inactiveNavItemClass,
              ]"
              @click="toggleHomeMenu"
            >
              <div class="flex items-center justify-center">
                <IconsHome :size="20" />
              </div>
              <p class="hidden capitalize lg:flex">{{ homeHubLabel }}</p>
              <Icon
                name="heroicons:chevron-down-20-solid"
                class="hidden w-5 h-5 lg:block"
              />
            </button>

            <div
              v-if="isHomeMenuOpen"
              class="absolute left-0 z-30 w-52 mt-2 overflow-hidden bg-white border shadow-xl top-full rounded-2xl border-slate-200"
            >
              <button
                v-for="item in homeMenuItems"
                :key="item.educationLevel"
                type="button"
                class="flex items-center justify-between w-full gap-3 px-4 py-3 text-sm font-medium text-left transition-colors text-slate-700 hover:bg-slate-50"
                :class="
                  currentEducationLevel === item.educationLevel
                    ? 'bg-slate-50 text-deepBlue'
                    : ''
                "
                @click="navigateToHomeHub(item.educationLevel)"
              >
                <span>{{ item.label }}</span>
                <Icon
                  v-if="currentEducationLevel === item.educationLevel"
                  name="heroicons:check-20-solid"
                  class="w-5 h-5"
                />
              </button>
            </div>
          </div>

          <!-- TIE Library Books -->
          <a
            aria-label="Visit TIE online library"
            href="https://ol.tie.go.tz/index.php"
            target="_blank"
            rel="noopener noreferrer"
            :class="[desktopNavItemClass, inactiveNavItemClass]"
          >
            <div class="flex items-center justify-center">
              <IconsTieLibrary :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">
              {{ language === "english" ? `TIE Library` : `Maktaba` }}
            </p>
          </a>

          <!-- Smart Class Hub -->
          <NuxtLink
            to="/smart-class"
            aria-label="Go to Smart Class"
            :aria-current="isSmartClassRoute ? 'page' : undefined"
            :class="[
              desktopNavItemClass,
              isSmartClassRoute ? activeNavItemClass : inactiveNavItemClass,
            ]"
          >
            <div class="flex items-center justify-center">
              <IconsSmartClassHub :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">
              {{ language === "english" ? `Smart class` : `Darasa janja` }}
            </p>
          </NuxtLink>

          <!-- title (TIE online public school) -->
          <div
            class="flex-1"
            role="navigation"
          >
            <NuxtLink
              aria-label="Go home"
              to="/"
            >
              <p
                class="block text-center uppercase lg:text-large text-medium text-shadow"
              >
                {{
                  language === "english"
                    ? `TIE online school`
                    : `shule mtandao ya TET`
                }}
              </p>
            </NuxtLink>
          </div>

          <div
            v-if="showPrimaryLanguageSwitch"
            class="flex items-center gap-2 px-2"
          >
            <!-- <span class="hidden text-xs uppercase lg:block text-white/80">
              {{ languageSwitchContent.label }}
            </span> -->
            <div
              class="flex overflow-hidden border rounded-full border-white/35 bg-white/10"
            >
              <button
                type="button"
                class="px-3 py-1 text-xs font-medium transition-colors"
                :class="
                  activePrimaryLanguage === 'english'
                    ? 'bg-white text-deepBlue'
                    : 'text-white hover:bg-white/10'
                "
                @click="setPrimaryLanguage('english')"
              >
                {{ languageSwitchContent.english }}
              </button>
              <button
                type="button"
                class="px-3 py-1 text-xs font-medium transition-colors"
                :class="
                  activePrimaryLanguage === 'kiswahili'
                    ? 'bg-white text-deepBlue'
                    : 'text-white hover:bg-white/10'
                "
                @click="setPrimaryLanguage('kiswahili')"
              >
                {{ languageSwitchContent.kiswahili }}
              </button>
            </div>
          </div>

          <div class="subInfo">
            <div
              class="flex items-center gap-4 p-2"
              v-if="!userToken"
            >
              <!-- sign in -->
              <NuxtLink
                aria-label="go to sign in page"
                :to="authSignInTo"
                title="Sign in"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8"
              >
                <IconsSignIn :size="20" />
                <p class="hidden capitalize lg:flex">
                  {{ language === "english" ? `Sign in` : `Ingia` }}
                </p>
              </NuxtLink>

              <!-- sign up -->
              <NuxtLink
                aria-label="Go to sign up page"
                :to="authSignUpTo"
                title="Sign Up"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8"
              >
                <IconsProfileCircle :size="24" />
                <p class="hidden capitalize lg:flex">
                  {{ language === "english" ? `Create Account` : `Jisajili` }}
                </p>
              </NuxtLink>
            </div>

            <div
              v-else
              class="relative px-2 py-1"
            >
              <button
                aria-label="Open account menu"
                :aria-current="isAccountSectionRoute ? 'page' : undefined"
                :class="[
                  desktopNavItemClass,
                  isAccountSectionRoute || isAccountMenuOpen
                    ? activeNavItemClass
                    : inactiveNavItemClass,
                ]"
                @click="toggleAccountMenu"
              >
                <div
                  v-if="
                    userToken?.profilePic &&
                    userToken?.profilePic?.trim() !== ''
                  "
                  class="w-8 h-8 overflow-hidden rounded-full ring-2 ring-white/30"
                >
                  <img
                    :src="
                      apiDocs.baseURL.replace('v1', '') + userToken?.profilePic
                    "
                    alt="User Profile"
                    class="object-cover w-full h-full rounded-full"
                  />
                </div>
                <div
                  v-else
                  class="flex items-center justify-center w-8 h-8 rounded-full bg-white/15 ring-2 ring-white/20"
                >
                  <IconsProfileCircle :size="20" />
                </div>
                <p
                  class="hidden capitalize lg:flex text-medium line-clamp-1 max-w-40"
                >
                  {{ language === "english" ? `Account` : `Akaunti` }}
                </p>
                <Icon
                  name="heroicons:chevron-down-20-solid"
                  class="hidden w-5 h-5 lg:block"
                />
              </button>

              <div
                v-if="isAccountMenuOpen"
                class="absolute right-0 z-30 w-56 mt-2 overflow-hidden bg-white border shadow-xl top-full rounded-2xl border-slate-200"
              >
                <NuxtLink
                  aria-label="Go to learning statistics page"
                  to="/profile/learning-statistics"
                  class="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
                  @click="closeAccountMenu"
                >
                  <Icon
                    name="heroicons:chart-bar-square-20-solid"
                    class="w-5 h-5"
                  />
                  <span>{{
                    language === "english"
                      ? `Learning statistics`
                      : `Takwimu za ujifunzaji`
                  }}</span>
                </NuxtLink>

                <NuxtLink
                  aria-label="Go to profile page"
                  to="/profile"
                  class="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
                  @click="closeAccountMenu"
                >
                  <IconsProfileCircle :size="20" />
                  <span>{{
                    language === "english" ? `Profile` : `Wasifu`
                  }}</span>
                </NuxtLink>

                <button
                  aria-label="Log out"
                  class="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left transition-colors text-rose-700 hover:bg-rose-50"
                  @click="openLogoutConfirmFromMenu"
                >
                  <IconsLogout
                    :size="20"
                    title="Sign out"
                  />
                  <span>{{
                    language === "english" ? `Logout` : `Ondoka`
                  }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div
          class="flex flex-col items-center w-full text-white md:hidden md:flex-row bg-oceanBlue rounded-b-md"
        >
          <!-- Profile and Sign Up and Home -->
          <div class="flex items-center justify-between w-full">
            <div class="flex">
              <div class="relative">
                <button
                  type="button"
                  aria-label="Open home menu"
                  :aria-current="isHomeRoute ? 'page' : undefined"
                  :class="[
                    mobileNavItemClass,
                    isHomeRoute || isHomeMenuOpen
                      ? activeNavItemClass
                      : inactiveNavItemClass,
                  ]"
                  @click="toggleHomeMenu"
                >
                  <div class="flex items-center justify-center">
                    <IconsHome :size="20" />
                  </div>
                </button>

                <div
                  v-if="isHomeMenuOpen"
                  class="absolute left-0 z-30 w-48 mt-2 overflow-hidden bg-white border shadow-xl top-full rounded-2xl border-slate-200"
                >
                  <button
                    v-for="item in homeMenuItems"
                    :key="item.educationLevel"
                    type="button"
                    class="flex items-center justify-between w-full gap-3 px-4 py-3 text-sm font-medium text-left transition-colors text-slate-700 hover:bg-slate-50"
                    :class="
                      currentEducationLevel === item.educationLevel
                        ? 'bg-slate-50 text-deepBlue'
                        : ''
                    "
                    @click="navigateToHomeHub(item.educationLevel)"
                  >
                    <span>{{ item.label }}</span>
                    <Icon
                      v-if="currentEducationLevel === item.educationLevel"
                      name="heroicons:check-20-solid"
                      class="w-5 h-5"
                    />
                  </button>
                </div>
              </div>

              <!-- TIE Library Books -->
              <a
                aria-label="Visit TIE online library"
                href="https://ol.tie.go.tz/index.php"
                target="_blank"
                rel="noopener noreferrer"
                :class="[mobileNavItemClass, inactiveNavItemClass]"
              >
                <div class="flex items-center justify-center">
                  <IconsTieLibrary :size="20" />
                </div>
              </a>
              <NuxtLink
                to="/smart-class"
                aria-label="Go to Smart Class"
                :aria-current="isSmartClassRoute ? 'page' : undefined"
                :class="[
                  mobileNavItemClass,
                  isSmartClassRoute ? activeNavItemClass : inactiveNavItemClass,
                ]"
              >
                <div class="flex items-center justify-center">
                  <IconsSmartClassHub :size="20" />
                </div>
              </NuxtLink>
            </div>

            <!-- Paragraph Text -->
            <NuxtLink to="/">
              <p
                class="block text-center uppercase lg:text-large text-[14px] text-shadow"
              >
                {{
                  language === "english"
                    ? `TIE online school`
                    : `shule mtandao ya TIE`
                }}
              </p>
            </NuxtLink>

            <!-- Account and Sign in -->
            <div class="relative flex items-center">
              <div v-if="userToken">
                <button
                  aria-label="Open account menu"
                  :aria-current="isAccountSectionRoute ? 'page' : undefined"
                  :class="[
                    mobileNavItemClass,
                    isAccountSectionRoute || isAccountMenuOpen
                      ? activeNavItemClass
                      : inactiveNavItemClass,
                  ]"
                  @click="toggleAccountMenu"
                >
                  <div
                    v-if="
                      userToken?.profilePic &&
                      userToken?.profilePic?.trim() !== ''
                    "
                    class="w-8 h-8 overflow-hidden rounded-full ring-2 ring-white/30"
                  >
                    <img
                      :src="
                        apiDocs.baseURL.replace('v1', '') +
                        userToken?.profilePic
                      "
                      alt="User Profile"
                      class="object-cover w-full h-full rounded-full"
                    />
                  </div>
                  <IconsProfileCircle
                    v-else
                    :size="22"
                  />
                </button>

                <div
                  v-if="isAccountMenuOpen"
                  class="absolute right-0 z-30 w-48 overflow-hidden bg-white border shadow-xl top-full rounded-2xl border-slate-200"
                >
                  <div
                    v-if="showPrimaryLanguageSwitch"
                    class="px-4 py-3 border-b border-slate-200"
                  >
                    <!-- <p class="mb-2 text-xs font-semibold tracking-wide uppercase text-slate-500">
                      {{ languageSwitchContent.label }}
                    </p> -->
                    <div
                      class="flex overflow-hidden border rounded-full border-slate-200 bg-slate-50"
                    >
                      <button
                        type="button"
                        class="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                        :class="
                          activePrimaryLanguage === 'english'
                            ? 'bg-deepBlue text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        "
                        @click="setPrimaryLanguageFromAccountMenu('english')"
                      >
                        {{ languageSwitchContent.english }}
                      </button>
                      <button
                        type="button"
                        class="flex-1 px-3 py-1.5 text-xs font-medium transition-colors"
                        :class="
                          activePrimaryLanguage === 'kiswahili'
                            ? 'bg-deepBlue text-white'
                            : 'text-slate-700 hover:bg-slate-100'
                        "
                        @click="setPrimaryLanguageFromAccountMenu('kiswahili')"
                      >
                        {{ languageSwitchContent.kiswahili }}
                      </button>
                    </div>
                  </div>

                  <NuxtLink
                    aria-label="Go to learning statistics page"
                    to="/profile/learning-statistics"
                    class="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
                    @click="closeAccountMenu"
                  >
                    <Icon
                      name="heroicons:chart-bar-square-20-solid"
                      class="w-5 h-5"
                    />
                    <span>{{
                      language === "english"
                        ? `Learning statistics`
                        : `Takwimu za ujifunzaji`
                    }}</span>
                  </NuxtLink>

                  <NuxtLink
                    aria-label="Go to profile page"
                    to="/profile"
                    class="flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
                    @click="closeAccountMenu"
                  >
                    <IconsProfileCircle :size="20" />
                    <span>{{
                      language === "english" ? `Profile` : `Wasifu`
                    }}</span>
                  </NuxtLink>

                  <button
                    aria-label="Log out"
                    class="flex items-center w-full gap-3 px-4 py-3 text-sm font-medium text-left transition-colors text-rose-700 hover:bg-rose-50"
                    @click="openLogoutConfirmFromMenu"
                  >
                    <IconsLogout
                      :size="20"
                      title="Sign out"
                    />
                    <span>{{
                      language === "english" ? `Logout` : `Ondoka`
                    }}</span>
                  </button>
                </div>
              </div>

              <div
                v-else
                class="flex items-center"
              >
                <NuxtLink
                  :to="authSignUpTo"
                  title="Sign Up"
                  class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8"
                >
                  <IconsProfileCircle :size="20" />
                </NuxtLink>

                <NuxtLink
                  aria-label="go to sign in page"
                  :to="authSignInTo"
                  title="Sign in"
                  class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8"
                >
                  <IconsSignIn
                    :size="20"
                    class=""
                  />
                </NuxtLink>
              </div>
            </div>
          </div>
        </div>
        <div
          ref="logoutAlert"
          aria-live="assertive"
          aria-atomic="true"
          class="sr-only"
        ></div>
      </div>
    </nav>

    <!-- Logout confirmation modal -->
    <ConfirmationModal
      :is-open="showLogoutConfirm"
      title="Log out"
      :message="messages.info.auth.logoutConfirm"
      confirm-text="Log out"
      cancel-text="Cancel"
      variant="danger"
      icon="heroicons:arrow-right-on-rectangle"
      @confirm="onLogoutConfirm"
      @cancel="onLogoutCancel"
      @close="showLogoutConfirm = false"
    />

    <!-- Logout success toast -->
    <Transition name="toast">
      <div
        v-if="showLogoutToast"
        role="status"
        aria-live="polite"
        class="fixed bottom-6 left-1/2 z-[100] -translate-x-1/2 px-5 py-3 rounded-lg bg-deepBlue text-white text-center shadow-lg max-w-[90vw]"
      >
        {{ messages.success.auth.loggedOut }}
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
</style>
