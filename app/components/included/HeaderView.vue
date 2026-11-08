<script setup lang="ts">
import apiDocs from "~/utilities/apiDocs";
import { layoutEffect } from "~/utilities/controlls";
import messages from "~/utilities/messages";
import ConfirmationModal from "~/components/ai-teacher/ConfirmationModal.vue";
import { useNavigationStore } from "~/stores/navigationStore";
import LanguageSwitcher from '../ui/LanguageSwitcher.vue';
import type { LanguageSupport } from "~/types/language.interface";
import {
  getHubLanguage,
  getHubLanguageCode,
  getHubPath,
  getEducationRouteQuery,
  normalizeEducationLevel,
  normalizeLanguageSupport,
  resolveEducationLevelFromRoute,
  type EducationBucket,
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
const isAiTeacherRoute = computed(() => matchesPath("/tie-ai-teacher"));
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
  "inline-flex items-center gap-2 rounded-md border border-white/40 bg-white/10 px-3 py-1 text-center text-sm font-medium text-white whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
const mobileNavItemClass =
  "inline-flex min-h-9 min-w-9 items-center justify-center gap-2 rounded-md border border-white/40 bg-white/10 px-2 text-center text-sm font-medium text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";
const activeNavItemClass = "bg-deepBlue text-white shadow-sm";
const desktopInactiveNavItemClass = "hover:bg-white/20";
const inactiveNavItemClass = "hover:bg-white/20";

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
const mobileLogoutRequested = useState<boolean>("mobile-logout-requested", () => false);
watch(mobileLogoutRequested, (requested) => {
  if (requested) {
    mobileLogoutRequested.value = false;
    showLogoutConfirm.value = true;
  }
});
const showLogoutToast = ref(false);
const logoutToastTimeout = ref<null | any>(null);
const logoutAlert = ref<HTMLElement | null>(null);
const isHomeMenuOpen = ref(false);
const isAccountMenuOpen = ref(false);
const activeHeaderLanguage = computed<LanguageSupport>(() =>
  normalizeLanguageSupport(hubHeaderLang.value || props.language, "english"),
);
const isKiswahili = computed(() => activeHeaderLanguage.value === "kiswahili");

const userDisplayName = computed(() => {
  const user = userToken.value;
  if (!user) return "";

  const fullName = String(user.name ?? "")
    .trim()
    .replace(/\s+/g, " ");
  if (fullName) return fullName;

  return isKiswahili.value ? "Akaunti" : "Account";
});

const logoutConfirmTitle = computed(() =>
  isKiswahili.value ? "Ondoka" : "Log out",
);
const logoutConfirmMessage = computed(() =>
  isKiswahili.value
    ? "Una uhakika unataka kutoka kwenye akaunti yako?"
    : "Are you sure you want to log out of your account?",
);
const logoutConfirmButtonText = computed(() =>
  isKiswahili.value ? "Ondoka" : "Log out",
);
const logoutCancelButtonText = computed(() =>
  isKiswahili.value ? "Ghairi" : "Cancel",
);

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
  return resolveEducationLevelFromRoute(route, normalizeEducationLevel(hubEducationLevel.value));
});

const currentEducationLevel = computed(() =>
  props.educationLevel
    ? normalizeEducationLevel(props.educationLevel)
    : inferredRouteEducationLevel.value,
);

const accountRouteQuery = computed(() =>
  getEducationRouteQuery(
    currentEducationLevel.value,
    {},
    currentEducationLevel.value === "primary"
      ? activePrimaryLanguage.value
      : "english",
  ),
);

const profileRoute = computed(() => ({
  path: "/profile",
  query: accountRouteQuery.value,
}));

const learningStatisticsRoute = computed(() => ({
  path: "/profile/learning-statistics",
  query: accountRouteQuery.value,
}));

const showPrimaryLanguageSwitch = computed(
  () =>
    route.path === "/feedback" ||
    route.path === "/primary" ||
    route.path.startsWith("/primary/") ||
    ((isSmartClassRoute.value || isAccountSectionRoute.value) &&
      hubEducationLevel.value === "primary") ||
    resolveEducationLevelFromRoute(route, "lower secondary") === "primary",
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
  if (currentEducationLevel.value === "primary") {
    return props.language === "kiswahili" ? "Msingi" : "Primary";
  }

  if (currentEducationLevel.value === "lower secondary" || currentEducationLevel.value === "secondary") {
    return props.language === "kiswahili" ? "Sekondari" : "Secondary";
  }

  return props.language === "kiswahili" ? "Nyumbani" : "Home";
});

const homeMenuItems = computed(() => [
  {
    educationLevel: "primary" as const,
    label: props.language === "kiswahili" ? "Msingi" : "Primary",
  },
  {
    educationLevel: "lower secondary" as EducationBucket,
    label: props.language === "kiswahili" ? "Sekondari" : "Secondary",
  },
]);

const setPrimaryLanguage = async (language: LanguageSupport) => {
  if (!showPrimaryLanguageSwitch.value) return;

  const normalizedLanguage = normalizeLanguageSupport(language, "kiswahili");
  primaryContentLanguage.value = normalizedLanguage;
  hubHeaderLang.value = normalizedLanguage;

  if (route.path === "/feedback") {
    await router.replace({
      path: route.path,
      query: {
        ...route.query,
        lang: getHubLanguageCode("primary", normalizedLanguage),
      },
    });
    return;
  }

  if (
    route.path === "/primary" ||
    route.path.startsWith("/primary/") ||
    resolveEducationLevelFromRoute(route, "lower secondary") === "primary"
  ) {
    await router.replace({
      path: route.path,
      query: {
        ...route.query,
        lang: getHubLanguageCode("primary", normalizedLanguage),
      },
    });
  }
};

const navigateToHomeHub = async (educationLevel: "primary" | "secondary") => {
  hubEducationLevel.value = educationLevel;
  hubHeaderLang.value = getHubLanguage(
    educationLevel,
    educationLevel === "primary" ? primaryContentLanguage.value : "english",
  );
  closeHomeMenu();
  closeAccountMenu();
  await router.push({
    path: getHubPath(educationLevel),
    query: route.query.section === 'adt' || route.query.section === 'interactive-content'
      ? { section: route.query.section }
      : {},
  });
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

const onDocumentPointerDown = (event: PointerEvent) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  if (isHomeMenuOpen.value && !target.closest("[data-home-menu-root]")) {
    closeHomeMenu();
  }

  if (isAccountMenuOpen.value && !target.closest("[data-account-menu-root]")) {
    closeAccountMenu();
  }
};

const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape") {
    closeHomeMenu();
    closeAccountMenu();
  }
};

onMounted(() => {
  if (!import.meta.client) return;

  document.addEventListener("pointerdown", onDocumentPointerDown);
  document.addEventListener("keydown", onDocumentKeydown);
});

onBeforeUnmount(() => {
  if (logoutToastTimeout.value) clearTimeout(logoutToastTimeout.value);
  if (!import.meta.client) return;

  document.removeEventListener("pointerdown", onDocumentPointerDown);
  document.removeEventListener("keydown", onDocumentKeydown);
});
</script>

<template>
  <!-- Header -->
  <header
    class="relative shadow-sm bg-[url('/flag/tenor.gif')] bg-cover bg-center bg-no-repeat rounded-b-xl lg:rounded-none"
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
          class="hidden w-full items-center gap-4 text-white md:grid md:grid-cols-[minmax(0,1fr)_auto] min-[1441px]:grid-cols-[1fr_auto_1fr] bg-oceanBlue rounded-xs wrapper-container"
        >
          <div class="flex items-center gap-2 justify-self-start">
            <div
              class="relative"
              data-home-menu-root
            >
              <button
                type="button"
                aria-label="Open home menu"
                :aria-current="isHomeRoute ? 'page' : undefined"
                :class="[
                  desktopNavItemClass,
                  isHomeRoute || isHomeMenuOpen
                    ? activeNavItemClass
                    : desktopInactiveNavItemClass,
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
                class="absolute left-0 z-30 w-52 mt-2 overflow-hidden bg-white border shadow-xl top-full rounded-lg border-slate-200"
              >
                <button
                  v-for="item in homeMenuItems"
                  :key="item.educationLevel"
                  type="button"
                  class="flex items-center justify-between w-full gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors text-slate-700 hover:bg-slate-50"
                  :class="
                    currentEducationLevel === item.educationLevel
                      ? 'bg-slate-50 text-deepBlue'
                      : ''
                  "
                  @click="navigateToHomeHub(item.educationLevel =='primary' ? 'primary':'secondary')"
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
              :class="[desktopNavItemClass, desktopInactiveNavItemClass]"
            >
              <div class="flex items-center justify-center">
                <IconsTieLibrary :size="20" />
              </div>
              <p class="hidden capitalize md:flex">
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
                isSmartClassRoute
                  ? activeNavItemClass
                  : desktopInactiveNavItemClass,
              ]"
            >
              <div class="flex items-center justify-center">
                <IconsSmartClassHub :size="20" />
              </div>
              <p class="hidden capitalize md:flex">
                {{ language === "english" ? `Smart class` : `Darasa janja` }}
              </p>
            </NuxtLink>

            <!-- AI Teacher -->
            <!-- <NuxtLink
              to="/tie-ai-teacher"
              aria-label="Go to AI Teacher"
              :aria-current="isAiTeacherRoute ? 'page' : undefined"
              :class="[
                desktopNavItemClass,
                isAiTeacherRoute
                  ? activeNavItemClass
                  : desktopInactiveNavItemClass,
              ]"
            >
              <IconsRobotAi :size="20" />
              <p class="hidden capitalize md:flex">
                {{ language === "english" ? `AI Teacher` : `Mwalimu AI` }}
              </p>
            </NuxtLink> -->
          </div>

          <!-- title (TIE online public school) -->
          <div
            class="hidden min-w-0 justify-self-center min-[1441px]:block"
            role="navigation"
          >
            <NuxtLink
              aria-label="Go home"
              to="/"
            >
              <p
                class="block px-4 tex2.5-center lg:text-large text-medium text-shadow whitespace-nowrap uppercase font-bold"
              >
                {{
                  language === "english"
                    ? `TIE Online School`
                    : `Shule Mtandao ya TET`
                }}
              </p>
            </NuxtLink>
          </div>

          <div class="flex items-center justify-end gap-2 justify-self-end">
            <div
              v-if="showPrimaryLanguageSwitch"
              class="flex items-center gap-2 px-2"
            >
              <LanguageSwitcher
                :active="activePrimaryLanguage"
                :language-switch-content="languageSwitchContent"
                appearance="desktop-nav"
                @change="setPrimaryLanguage"
              />
            </div>

            <div class="subInfo">
              <div
                class="flex items-center gap-2 p-1"
                v-if="!userToken"
              >
                <NuxtLink
                  aria-label="go to sign in page"
                  :to="authSignInTo"
                  title="Sign in"
                  class="h-8 justify-center"
                  :class="[desktopNavItemClass, desktopInactiveNavItemClass]"
                >
                  <IconsSignIn :size="20" />
                  <p class="hidden capitalize lg:flex">
                    {{ language === "english" ? `Sign in` : `Ingia` }}
                  </p>
                </NuxtLink>

                <NuxtLink
                  aria-label="Go to sign up page"
                  :to="authSignUpTo"
                  title="Sign Up"
                  class="h-8 justify-center"
                  :class="[desktopNavItemClass, desktopInactiveNavItemClass]"
                >
                  <IconsProfileCircle :size="24" />
                  <p class="hidden capitalize md:flex">
                    {{ language === "english" ? `Create Account` : `Jisajili` }}
                  </p>
                </NuxtLink>
              </div>

              <div
                v-else
                class="relative px-2 py-1"
                data-account-menu-root
              >
                <button
                  aria-label="Open account menu"
                  :aria-current="isAccountSectionRoute ? 'page' : undefined"
                  :class="[
                    desktopNavItemClass,
                    isAccountSectionRoute || isAccountMenuOpen
                      ? activeNavItemClass
                      : desktopInactiveNavItemClass,
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
                    class="hidden capitalize lg:flex text-medium line-clamp-1 max-w-40 ellipsis"
                  >
                    {{ userDisplayName.split(' ')[0] }}
                  </p>
                  <Icon
                    name="heroicons:chevron-down-20-solid"
                    class="hidden w-5 h-5 lg:block"
                  />
                </button>

                <div
                  v-if="isAccountMenuOpen"
                  class="absolute right-0 z-50 w-56 mt-2 overflow-hidden bg-white border shadow-xl top-full rounded-lg border-slate-200"
                >
                  <NuxtLink
                    aria-label="Go to learning statistics page"
                    :to="learningStatisticsRoute"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
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
                    :to="profileRoute"
                    class="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors text-slate-700 hover:bg-slate-50"
                    @click="closeAccountMenu"
                  >
                    <IconsProfileCircle :size="20" />
                    <span>{{
                      language === "english" ? `Profile` : `Wasifu`
                    }}</span>
                  </NuxtLink>

                  <button
                    aria-label="Log out"
                    class="flex items-center w-full gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors text-rose-700 hover:bg-rose-50"
                    @click="openLogoutConfirmFromMenu"
                  >
                    <IconsLogout
                      :size="20"
                    />
                    <span>{{
                      language === "english" ? `Logout` : `Ondoka`
                    }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div
          class="w-full rounded-b-md bg-oceanBlue text-white md:hidden"
        >
          <div class="flex w-full items-center justify-between gap-2 px-4 py-1">
            <div class="flex items-center gap-1">
              <div
                class="relative"
                data-home-menu-root
              >
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
                  <span class="text-xs font-semibold">{{ homeHubLabel }}</span>
                  <Icon name="heroicons:chevron-down-20-solid" class="h-4 w-4" aria-hidden="true" />
                </button>

                <div
                  v-if="isHomeMenuOpen"
                  class="absolute left-0 z-30 w-48 mt-2 overflow-hidden bg-white border shadow-xl top-full rounded-2xl border-slate-200"
                >
                  <button
                    v-for="item in homeMenuItems"
                    :key="item.educationLevel"
                    type="button"
                    class="flex items-center justify-between w-full gap-3 px-4 py-2.5 text-sm font-medium text-left transition-colors text-slate-700 hover:bg-slate-50"
                    :class="
                      currentEducationLevel === item.educationLevel
                        ? 'bg-slate-50 text-deepBlue'
                        : ''
                    "
                    @click="navigateToHomeHub(item.educationLevel == 'primary' ? 'primary':'secondary')"
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
                :class="[mobileNavItemClass, inactiveNavItemClass, 'hidden']"
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
                  'hidden',
                ]"
              >
                <div class="flex items-center justify-center">
                  <IconsSmartClassHub :size="20" />
                </div>
              </NuxtLink>

              <NuxtLink
                to="/tie-ai-teacher"
                aria-label="Go to AI Teacher"
                :aria-current="isAiTeacherRoute ? 'page' : undefined"
                :class="[
                  mobileNavItemClass,
                  isAiTeacherRoute ? activeNavItemClass : inactiveNavItemClass,
                  'hidden',
                ]"
              >
                <IconsRobotAi :size="20" />
              </NuxtLink>
            </div>

            <LanguageSwitcher
              v-if="showPrimaryLanguageSwitch"
              :active="activePrimaryLanguage"
              :language-switch-content="languageSwitchContent"
              appearance="desktop-nav"
              @change="setPrimaryLanguage"
            />

            <!-- Account and Sign in -->
            <div class="relative flex items-center gap-1">
              <div
                v-if="userToken"
                data-account-menu-root
              >
                <NuxtLink
                  :to="profileRoute"
                  aria-label="Go to profile page"
                  :aria-current="isAccountSectionRoute ? 'page' : undefined"
                  :class="[
                    mobileNavItemClass,
                    '!h-9 !w-9 !rounded-full !p-0 aspect-square shrink-0 overflow-hidden',
                    isAccountSectionRoute
                      ? activeNavItemClass
                      : inactiveNavItemClass,
                  ]"
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
                  <span class="hidden max-w-24 truncate text-sm font-medium sm:block">
                    {{ userDisplayName }}
                  </span>
                </NuxtLink>

              </div>

              <div
                v-else
                class="flex items-center gap-1"
              >
                <NuxtLink
                  :to="authSignUpTo"
                  aria-label="Go to sign up page"
                  title="Sign Up"
                  :class="[mobileNavItemClass, inactiveNavItemClass]"
                >
                  <IconsProfileCircle :size="20" />
                </NuxtLink>

                <NuxtLink
                  aria-label="go to sign in page"
                  :to="authSignInTo"
                  title="Sign in"
                  :class="[mobileNavItemClass, inactiveNavItemClass]"
                >
                  <IconsSignIn :size="20" />
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
      :title="logoutConfirmTitle"
      :message="logoutConfirmMessage"
      :confirm-text="logoutConfirmButtonText"
      :cancel-text="logoutCancelButtonText"
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
        class="fixed top-6 left-1/2 z-[100] -translate-x-1/2 px-5 py-3 rounded-lg bg-deepBlue text-white text-center shadow-lg max-w-[90vw]"
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
