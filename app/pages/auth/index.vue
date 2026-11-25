<script setup>
import { auth } from "~/utilities/validationInput";
import { sanitize } from "~/utilities/sanitizeInput";
import apiDocs from "~/utilities/apiDocs";
import { dataEncrypt, dataDecrypt } from "~/utilities/encryption";
import { useNavigationStore } from "~/stores/navigationStore";
import { useAuthStore } from "~/stores/auth";
import { consumePostLoginHome } from "~/utilities/postLoginHome";
import { getHubPath } from "~/utilities/educationRoute";
import { getLoginFailure, readLoginLockout, remainingLoginLockoutSeconds } from "~/utilities/loginLockout";
import { SESSION_END_KEY } from '~~/shared/auth/session';

// // Use the State
const navigationStore = useNavigationStore();
const returnPath = computed(() => navigationStore.getLatestRoute());
const route = useRoute();
const hubEducationLevel = useHubEducationLevel();
const authRedirectQuery = computed(() =>
  typeof route.query.redirect === "string" && route.query.redirect.length > 0
    ? { redirect: route.query.redirect }
    : {}
);
const isFeedbackSignIn = computed(() =>
  typeof route.query.redirect === "string" && /^\/feedback(?:[?#]|$)/.test(route.query.redirect),
);
const authLanguage = useAuthPageLanguage();
const isSwahili = computed(() => authLanguage.value === "kiswahili");
const content = computed(() => ({
  title: isSwahili.value ? "Karibu" : "Welcome",
  helper: isSwahili.value
    ? "Weka jina la mtumiaji na nenosiri kuingia. Sehemu zinazotakiwa ni jina la mtumiaji na nenosiri."
    : "Enter your username and password to sign in. Required fields are username and password.",
  homeLinkAria: isSwahili.value
    ? "Bonyeza kurudi nyumbani. Kiungo hiki kina nembo ya TET."
    : "Press to go home. The link contains the TIE logo.",
  logoAlt: isSwahili.value
    ? "Nembo ya Taasisi ya Elimu Tanzania. Bango la juu lenye ukingo wa bluu lina maandishi 'Taasisi ya Elimu Tanzania.' Katikati kuna mwenge mweusi wenye mwali mwekundu na wa manjano. Chini ya mwenge kuna kitabu kilichofunguliwa chenye mistari ya bluu na dira mbili nyeusi chini yake. Upande wa kushoto wa nembo kuna jembe la rangi ya machungwa, na upande wa kulia kuna shoka la rangi ya machungwa, yote yakiwa yameelekezwa kuelekea ndani. Nembo imezungukwa na mabango ya utepe yaliyopinda yenye ukingo wa bluu. Bango la chini, pia lenye ukingo wa bluu, lina maandishi 'Elimu ni Kazi.'"
    : "An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text 'Taasisi ya Elimu Tanzania.' At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text 'Elimu ni Kazi.'",
  usernameLabel: isSwahili.value
    ? "Jina la kuingia, mfano barua pepe, simu, Prem Number, au jina la mtumiaji"
    : "Sign-in ID (e.g., email, phone, Prem Number, or username)",
  usernamePlaceholder: isSwahili.value
    ? "(mfano: example@email.com / 0622***722 / 20190928782 / Student.Name)"
    : "(e.g. example@email.com / 0622***722 / 20190928782 / Student.Name)",
  passwordLabel: isSwahili.value ? "Nenosiri" : "Password",
  passwordPlaceholder: isSwahili.value ? "Nenosiri" : "Password",
  showPassword: isSwahili.value ? "Onyesha nenosiri" : "Show password",
  hidePassword: isSwahili.value ? "Ficha nenosiri" : "Hide password",
  forgotPassword: isSwahili.value ? "Umesahau nenosiri?" : "Forgot password?",
  rememberMe: isSwahili.value ? "Nikumbuke" : "Remember me",
  signIn: isSwahili.value ? "Ingia" : "Sign in",
  signingIn: isSwahili.value ? "Inaingia, tafadhali subiri" : "Signing in, please wait",
  noAccount: isSwahili.value ? "Huna akaunti?" : "Don't have an account?",
  signUp: isSwahili.value ? "Jisajili" : "Sign up",
  accountLocked: isSwahili.value ? "Akaunti imefungwa kwa muda" : "Account temporarily locked",
  lockoutReason: isSwahili.value
    ? "Umejaribu kuingia bila mafanikio mara nyingi."
    : "Too many unsuccessful sign-in attempts.",
  retryIn: isSwahili.value ? "Tafadhali jaribu tena baada ya" : "Please try again in",
  lockoutEnded: isSwahili.value ? "Unaweza kujaribu kuingia tena sasa." : "You can try signing in again now.",
  errors: {
    usernameInvalid: isSwahili.value
      ? "Taarifa ya kuingia si sahihi. Tumia barua pepe, namba ya simu, Prem Number ya mwanafunzi, au jina la mtumiaji."
      : "Sign-in ID is not valid (use email, phone number, Prem Number, or username)",
    passwordRequired: isSwahili.value ? "Nenosiri linahitajika" : "Password is required",
    invalidCredentials: isSwahili.value ? "Jina la mtumiaji au nenosiri si sahihi" : "Invalid username or password",
    retryLater: isSwahili.value
      ? "Umejaribu kuingia mara nyingi. Tafadhali subiri kabla ya kujaribu tena."
      : "Too many sign-in attempts. Please wait before trying again.",
    connection: isSwahili.value
      ? "Imeshindikana kuunganisha. Angalia muunganisho wako kisha ujaribu tena."
      : "Unable to connect. Check your connection and try again.",
    unavailable: isSwahili.value
      ? "Imeshindikana kuingia kwa sasa. Tafadhali jaribu tena baadaye."
      : "Unable to sign in right now. Please try again later.",
    verificationRequired: isSwahili.value
      ? "Akaunti ya msimamizi haiwezi kuingia hapa. Tembelea mfumo wa wasimamizi."
      : "Administrator accounts cannot sign in here. Please visit administrator's portal.",
  },
  feedback: {
    authenticated: isSwahili.value ? "Umefanikiwa kuingia" : "Successfully logged in",
    registered: isSwahili.value ? "Akaunti imefunguliwa. Tafadhali ingia." : "Account successfully created, Please login",
  },
}));
const userRememberMe = useCookie("userRememberMe");
const pass = userRememberMe?.value?.password?.length > 0 ? dataDecrypt(userRememberMe?.value?.password) : null

// Persist an absolute deadline so reloads and background tabs cannot restart the wait.
const initialLockoutNow = useState("auth-lockout-now", () => Date.now());
const lockoutNow = ref(initialLockoutNow.value);
const lockoutExpiry = ref();
const lockoutCookie = useCookie("signInLockout", {
  default: () => null,
  sameSite: "strict",
  secure: useRequestURL().protocol === "https:",
  path: "/auth",
  expires: () => lockoutExpiry.value,
});
watch(lockoutCookie, (value) => {
  const state = readLoginLockout(value, Date.now());
  lockoutExpiry.value = state ? new Date(state.expiresAt) : undefined;
}, { immediate: true, flush: "sync" });
const restoredLockout = readLoginLockout(lockoutCookie.value, lockoutNow.value);

// User Sign In Function
const userSignIn = reactive({
  type: "",
  status: "idle",
  username: restoredLockout?.username ?? userRememberMe.value?.username ?? null,
  password: !restoredLockout || restoredLockout.username === userRememberMe.value?.username?.trim()
    ? pass ?? null
    : null,
  rememberMe: userRememberMe.value?.rememberMe ?? false,
  controller: {
    isSubmitted: false,
    isSucces: false,
    feedback: null,
    errors: {
      username: "",
      password: "",
      type: "",
    },
  },
});

const lockoutSeconds = computed(() =>
  remainingLoginLockoutSeconds(lockoutCookie.value, userSignIn.username, lockoutNow.value),
);
const isLocked = computed(() => lockoutSeconds.value > 0);
const lockoutCountdown = computed(() => {
  const minutes = Math.floor(lockoutSeconds.value / 60);
  const seconds = lockoutSeconds.value % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
const lockoutFinished = ref(false);
const updateLockoutClock = () => {
  const now = Date.now();
  const current = lockoutCookie.value;
  if (current && !readLoginLockout(current, now)) {
    if (readLoginLockout(current, 0)?.username === userSignIn.username?.trim()) {
      lockoutFinished.value = true;
    }
    lockoutCookie.value = null;
  }
  lockoutNow.value = now;
};

// Sign In Function
const signIn = async () => {
  updateLockoutClock();
  if (isDisable.value || isLocked.value) return;

  // Reset error messages first
  userSignIn.controller.errors.username = "";
  userSignIn.controller.errors.password = "";

  let isValid = true;

  // Check for empty fields first - safely handle null/undefined username
  const username = (userSignIn.username || "").trim();
  if (!username || !auth.checkEmailPhoneOrUsername(username)) {
    userSignIn.controller.errors.username = content.value.errors.usernameInvalid;
    isValid = false;
  }

  if (!userSignIn.password) {
    userSignIn.controller.errors.password = content.value.errors.passwordRequired;
    isValid = false;
  }

  if (isValid) {
    // Form is valid, proceed with submission
    isDisable.value = true;
    lockoutFinished.value = false;
    userSignIn.controller.feedback = null;
    userSignIn.controller.isSucces = false;

    // send data
    try {
      const response = await $fetch(apiDocs.auth.login,
        {
          method: 'POST',
          retry: 0,
          body: JSON.stringify({
            username: sanitize.input(username),
            password: userSignIn.password,
          })
        }
      );

      if (response?.twoFactorRequired === true) {
        userSignIn.controller.feedback = content.value.errors.verificationRequired;
        userSignIn.controller.isSucces = false;
        return;
      }

      const issuedAccessToken = response?.accessToken ?? response?.access_token;
      const issuedRefreshToken = response?.refreshToken ?? response?.refresh_token;
      if (typeof issuedAccessToken !== 'string' || !issuedAccessToken.trim()) {
        userSignIn.controller.feedback = content.value.errors.unavailable;
        return;
      }

      if (lockoutCookie.value?.username === username) lockoutCookie.value = null;
      userSignIn.controller.feedback = content.value.feedback.authenticated;
      userSignIn.controller.isSucces = true;

      // Production builds are also previewed over plain HTTP. Secure cookies
      // cannot be stored there, so use the actual browser protocol.
      const secureCookie = import.meta.client && window.location.protocol === "https:";

      const accessToken = useCookie("signInAccessToken", {
        httpOnly: false,              // Accessible in browser
        secure: secureCookie,
        maxAge: 60 * 60 * 2,          // 2 hours
        sameSite: "strict",
        path: "/",
      });

      const refreshToken = useCookie("signInRefreshToken", {
        httpOnly: false,              // Accessible in browser
        secure: secureCookie,
        maxAge: 60 * 60 * 2,          // 2 hours
        sameSite: "strict",
        path: "/",
      });

      const userToken = useCookie("signInUserToken", {
        httpOnly: false,              // Accessible in browser
        secure: secureCookie,
        maxAge: 60 * 60 * 2,          // 2 hours
        sameSite: "strict",
        path: "/",
      });

      // create user remember me cookie
      const userRememberMe = useCookie("userRememberMe", {
        httpOnly: false,                  // Accessible in browser
        secure: secureCookie,
        maxAge: 60 * 60 * 24 * 7,         // 1 week
        sameSite: "strict",
        path: "/",
        default: () => null,
      });

      if (userSignIn.rememberMe) {
        userRememberMe.value = {
          username: userSignIn.username,
          password: dataEncrypt(userSignIn.password),
          rememberMe: userSignIn.rememberMe,
        };
      } else {
        userRememberMe.value = null;      // Clear the cookie
      }

      accessToken.value = issuedAccessToken;
      refreshToken.value = typeof issuedRefreshToken === 'string' ? issuedRefreshToken : null;
      userToken.value = response.user;
      useAuthStore().setToken(accessToken.value);

      // useCookie()'s write to document.cookie happens in a watcher callback,
      // not synchronously. Flush it before navigating, or the destination
      // route's auth middleware can read the cookie jar before the write
      // lands and bounce back here as if the login never happened.
      await nextTick();
      try { localStorage.removeItem(SESSION_END_KEY); } catch { /* Storage may be disabled. */ }

      // Navigate to the intended page after login
      const router = useRouter();
      const redirectPath =
        typeof route.query.redirect === "string" && route.query.redirect.length > 0
          ? route.query.redirect
          : returnPath.value;
      const landingChoiceHome = consumePostLoginHome();
      const fallbackHubPath = getHubPath(hubEducationLevel.value);
      await router.replace(redirectPath || landingChoiceHome || fallbackHubPath || "/secondary");
    } catch (error) {
      const { status, retryAfterSeconds } = getLoginFailure(error);
      userSignIn.controller.isSucces = false;
      if (status === 429 && retryAfterSeconds !== null) {
        const now = Date.now();
        const state = readLoginLockout({ username, expiresAt: now + retryAfterSeconds * 1000 }, now);
        if (state) {
          lockoutNow.value = now;
          lockoutExpiry.value = new Date(state.expiresAt);
          lockoutCookie.value = state;
        } else {
          userSignIn.controller.feedback = content.value.errors.retryLater;
        }
      } else if (status === 429) {
        userSignIn.controller.feedback = content.value.errors.retryLater;
      } else if (status === 400 || status === 401) {
        userSignIn.controller.feedback = content.value.errors.invalidCredentials;
      } else {
        userSignIn.controller.feedback = status
          ? content.value.errors.unavailable
          : content.value.errors.connection;
      }
    } finally {
      isDisable.value = false;
    }
  }
};

// Disable Variable
const isDisable = ref(false);
const headingRef = ref(null);

// Password toggle
const showPassword = ref(false);
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

let lockoutTimer;
const startLockoutClock = () => {
  window.clearInterval(lockoutTimer);
  updateLockoutClock();
  lockoutTimer = window.setInterval(updateLockoutClock, 1000);
};
onMounted(() => {
  startLockoutClock();
  window.addEventListener("pageshow", startLockoutClock);
  window.addEventListener("focus", updateLockoutClock);
  document.addEventListener("visibilitychange", updateLockoutClock);
  // Move focus to the heading when the sign-in page mounts
  headingRef.value?.focus();

  // Show "account created successfully" after redirect from SignUp
  if (route.query.registered === "1") {
    userSignIn.controller.feedback = content.value.feedback.registered;
    userSignIn.controller.isSucces = true;

    const router = useRouter();
    const nextQuery = { ...(route.query || {}) };
    delete nextQuery.registered;
    router.replace({ path: route.path, query: nextQuery });
  }
});

onBeforeUnmount(() => {
  window.clearInterval(lockoutTimer);
  window.removeEventListener("pageshow", startLockoutClock);
  window.removeEventListener("focus", updateLockoutClock);
  document.removeEventListener("visibilitychange", updateLockoutClock);
});

// Clear validation errors when user types
watch(
  () => userSignIn.username,
  (username) => {
    userSignIn.controller.feedback = null;
    userSignIn.controller.isSucces = false;
    lockoutFinished.value = false;
    if (username) {
      const trimmedUsername = username.trim();
      if (trimmedUsername && auth.checkEmailPhoneOrUsername(trimmedUsername)) {
        userSignIn.controller.errors.username = "";
      } else {
        userSignIn.controller.errors.username = content.value.errors.usernameInvalid;
      }
    } else {
      userSignIn.controller.errors.username = null;
    }
  }
);

watch(
  () => userSignIn.password,
  (password) => {
    if (password) {
      userSignIn.controller.errors.password = "";
    } else {
      userSignIn.controller.errors.password = null;
    }
  }
);
</script>

<template>
  <section class="flex min-h-screen items-center justify-center py-6 md:bg-gradient-to-b" aria-labelledby="Welcome">
    <!-- Message Component (announce feedback changes) -->
    <MessageComponent aria-live="assertive" role="status" :message="userSignIn.controller.feedback"
      :position="!!userSignIn.controller.feedback" :event-type="userSignIn.controller.isSucces ? 'success' : 'error'"
      :icon="userSignIn.controller.isSucces ? 'icons8:checked' : 'oui:cross-in-circle-empty'" />

    <div class="w-full max-w-md rounded-lg px-4 py-6 md:bg-white md:shadow-2xl">
      <!-- Main heading for this view -->
      <h1 id="Welcome" ref="headingRef" tabindex="-1" class="font-bold text-center text-large">
        {{ content.title }}
      </h1>

      <NuxtLink :aria-label="content.homeLinkAria" to="/" class="w-[100px] h-[100px] mx-auto my-6 flex items-center justify-center">
        <img tabindex="0" src="/logo/logo_tie.gif" class="object-contain w-full h-full"
          :alt="content.logoAlt" />
      </NuxtLink>

      <p v-if="isFeedbackSignIn" role="status" class="mx-4 mb-5 rounded-lg bg-blue-50 p-3 text-center text-sm text-[#174f80]">
        {{ isSwahili
          ? 'Ingia ili kuona na kufuatilia maombi yako ya msaada.'
          : 'Sign in to view and follow up on your support requests.' }}
      </p>

      <p v-if="route.query.reason === 'session-expired'" role="status" class="mx-4 mb-5 rounded-lg bg-blue-50 p-3 text-center text-sm text-[#174f80]">
        {{ isSwahili
          ? 'Muda wa kuingia umeisha. Tafadhali ingia tena.'
          : 'Your session has expired. Please sign in again.' }}
      </p>

      <!-- Sign in form -->
      <form @submit.prevent="signIn" autocomplete="off"
        class="px-4 text-textGray text-extraSmall" aria-describedby="signin-helper">
        <!-- Helper text (optional, can be expanded) -->
        <p id="signin-helper" class="sr-only">
          {{ content.helper }}
        </p>

        <!-- Username -->
        <div :class="[
          'flex flex-col items-start justify-start gap-2 px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
          {
            'focus-input-icon-warning focus-within:border-red-500 border-red-500':
              userSignIn.controller.errors.username,
          },
        ]">
          <label for="username" class="sr-only">
            {{ content.usernameLabel }}
          </label>

          <div class="flex items-center w-full">
            <input id="username" type="text" v-model="userSignIn.username" name="username" autocomplete="username" :disabled="isDisable"
              :aria-invalid="!!userSignIn.controller.errors.username" aria-describedby="username-error"
              class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs"
              :placeholder="content.usernamePlaceholder" />
            <Icon name="solar:user-outline" class="w-5 h-5 text-textGray" aria-hidden="true" focusable="false" />
          </div>

          <!-- Username error message -->
          <small aria-live="assertive" aria-atomic id="username-error" v-if="userSignIn.controller.errors.username" :class="[
            'w-full text-red-500 text-smallest',
            { 'mt-1': userSignIn.type.trim().toLowerCase() === 'student' },
            {
              'mt-1':
                userSignIn.type.trim().toLowerCase() === 'teacher' ||
                userSignIn.type.trim().toLowerCase() === 'education stackeholder',
            },
            { 'mt-0': userSignIn.type.trim().toLowerCase() === '' },
          ]" role="alert">
            {{ userSignIn.controller.errors.username }}
          </small>
        </div>

        <!-- Password -->
        <div :class="[
          'flex flex-col items-start justify-between px-2 mb-4 border-b border-gray-300 focus-input-icon focus-within:border-oceanBlue',
          {
            'focus-input-icon-warning focus-within:border-red-500 border-red-500':
              userSignIn.controller.errors.password,
          },
        ]">
          <label for="password" class="sr-only">{{ content.passwordLabel }}</label>

          <div class="flex items-center w-full gap-2">
            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="userSignIn.password"
              name="password" autocomplete="current-password" aria-describedby="password-error" :disabled="isDisable"
              :aria-invalid="!!userSignIn.controller.errors.password" :placeholder="content.passwordPlaceholder"
              class="w-full py-2 focus:outline-none focus:ring-0 placeholder:text-textGray/40 placeholder:text-xs" />

            <!-- Proper button for toggling password visibility -->
            <button type="button" class="p-1 rounded text-textGray focus:outline-none focus:ring-2 focus:ring-oceanBlue"
              :aria-pressed="showPassword ? 'true' : 'false'"
              :aria-label="showPassword ? content.hidePassword : content.showPassword" @click="togglePassword">
              <Icon :name="showPassword ? 'iconamoon:eye-off-light' : 'iconamoon:eye-thin'" class="w-5 h-5"
                aria-hidden="true" />
            </button>
          </div>

          <!-- Password error message -->
          <small aria-live="assertive" aria-atomic id="password-error" v-if="userSignIn.controller.errors.password"
            class="w-full text-red-500 text-smallest" role="alert">
            {{ userSignIn.controller.errors.password }}
          </small>
        </div>

        <!-- Forgot / Remember -->
        <div v-if="!isLocked" class="flex items-center justify-between my-6">
          <NuxtLink to="/auth/ForgotPassword"
            class="text-sm cursor-pointer text-textGray underline-offset-2 hover:underline">
            {{ content.forgotPassword }}
          </NuxtLink>

          <div class="flex items-center gap-2">
            <input type="checkbox" id="remember" v-model="userSignIn.rememberMe" class="w-4 h-4 cursor-pointer" />
            <label for="remember" class="text-sm cursor-pointer text-textGray">
              {{ content.rememberMe }}
            </label>
          </div>
        </div>

        <div v-if="isLocked" class="rounded-md border border-deepBlue/20 bg-oceanBlue/10 p-4 text-center text-darkBlue">
          <div role="alert">
            <p class="font-semibold">{{ content.accountLocked }}</p>
            <p class="mt-1 text-textGray">{{ content.lockoutReason }}</p>
          </div>
          <p id="signin-lockout" class="mt-2" aria-live="off">
            {{ content.retryIn }} <span class="font-semibold tabular-nums text-deepBlue">{{ lockoutCountdown }}</span>
          </p>
        </div>
        <p v-if="lockoutFinished" role="status" class="mb-4 text-center">{{ content.lockoutEnded }}</p>

        <!-- Sign in button -->
        <button v-if="!isLocked" type="submit" :disabled="isDisable" :aria-disabled="isDisable ? 'true' : 'false'"
          :aria-busy="isDisable ? 'true' : 'false'"
          class="flex items-center justify-center w-full gap-3 p-2 text-white capitalize transition-all duration-500 rounded-md bg-oceanBlue disabled:bg-gray-500/40 disabled:cursor-not-allowed hover:bg-oceanBlue/80">
          <span v-if="!isDisable">{{ content.signIn }}</span>
          <template v-else>
            <span class="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true"></span>
            <span>{{ content.signingIn }}</span>
          </template>
        </button>

        <p class="sr-only" role="status" aria-live="assertive" aria-atomic="true">
          {{ isDisable ? content.signingIn : '' }}
        </p>

        <!-- Sign up -->
        <div v-if="!isLocked" class="flex flex-col items-center gap-4 my-4">
          <p class="text-sm text-textGray">{{ content.noAccount }}</p>
          <NuxtLink :to="{ path: '/auth/SignUp', query: authRedirectQuery }"
            class="w-full p-2 text-center text-white capitalize transition-all duration-500 rounded-md cursor-pointer bg-darkBlue hover:bg-darkBlue/80">
            {{ content.signUp }}
          </NuxtLink>
        </div>
      </form>
    </div>
  </section>
</template>
