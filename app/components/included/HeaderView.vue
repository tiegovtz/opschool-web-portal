<script setup>
import apiDocs from "~/utilities/apiDocs";
import { layoutEffect } from "~/utilities/controlls";
import { moveFocus } from "~/utilities/focus.helper";

const userToken = useCookie("signInUserToken");
const accessToken = useCookie("signInAccessToken");
const refreshToken = useCookie("signInRefreshToken");


const logout = () => {
  // Clear All Cookies
  userToken.value = null;
  accessToken.value = null;
  refreshToken.value = null;

  // Redirect to Home

  const router = useRouter();
  layoutEffect.value = "grid";
  router.replace("/home");
  // Dismiss Drop Down
  dropDown();
};

const logoutMessage = ref("");
const logoutAlert = ref(null);

const announceLogout = (event) => {

  // Keyboard support (Enter + Space)
  if (event.type === "keyup" && !["Enter", " "].includes(event.key)) {
    return;
  }

  logoutMessage.value = "You have been logged out";

  // Screen reader announcement only (sr-only region)
  if (logoutAlert.value) {
    logoutAlert.value.textContent = "";
    setTimeout(() => {
      if (logoutAlert.value) {
        logoutAlert.value.textContent = logoutMessage.value;
      }
    }, 50);
  }

  logout(); // run your logout logic
};


const isPop = ref(true);

const dropDown = () => {
  isPop.value = !isPop.value;
};
</script>

<template>
  <!-- Header -->
  <header class="relative shadow-sm bg-[url('/flag/tenor.gif')] bg-cover bg-center bg-no-repeat" role="navigation">
    <nav class="flex flex-col items-center bg-white bg-opacity-75">
      <!-- Header -->
      <included-upper-header class="w-full" />
      <div class="w-full ">
        <!-- Media Screen -->
        <div
          class="flex-col items-center hidden w-full gap-2 text-white md:flex md:flex-row bg-oceanBlue rounded-xs wrapper-container">
          <NuxtLink aria-label="Go home" to="/home" class="flex gap-2 pl-2 pr-2 rounded-md"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsHome :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">Home</p>
          </NuxtLink>

          <!-- TIE Library Books -->
          <a aria-label="Visit TIE online library" href="https://ol.tie.go.tz/index.php" target="_blank"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsTieLibrary :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">TIE Library</p>
          </a>

          <!-- Smart Class Hub -->
          <NuxtLink to="/smart-class" aria-label="Go to Smart Class"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium rounded-md"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <IconsSmartClassHub :size="20" />
            </div>
            <p class="hidden capitalize lg:flex">Smart Class</p>
          </NuxtLink>

          <!-- title (TIE online public school) -->
          <div class="flex-1" role="navigation">
            <NuxtLink aria-label="Go home" to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                TIE online public school
              </p>
            </NuxtLink>
          </div>

          <!-- Profile and Sign Up -->
          <div class="subInfo">
            <div class="flex items-center gap-4 px-2 py-1" v-if="userToken">

              <!-- Profile -->
              <NuxtLink aria-label="Go to profile page" to="/profile">
                <div class="flex items-center justify-center overflow-hidden">
                  <div class="flex items-center gap-1 cursor-pointer">
                    <div v-if="userToken?.profilePic && userToken?.profilePic?.trim() !== ''" class="w-8 h-8">
                      <img :src="apiDocs.baseURL.replace('v1', '') + userToken?.profilePic" alt="User Profile"
                        class="object-cover w-full h-full rounded-full" />
                    </div>
                    <IconsProfileCircle v-else :size="24" />
                    <p class="capitalize text-medium line-clamp-1 max-w-60">
                      Hello,
                      {{ String(userToken.name).split(" ")[0] }}
                    </p>
                  </div>
                </div>
              </NuxtLink>

              <!-- Logout -->
              <button aria-label="click to logout"
                class="flex items-center h-6 gap-2 p-2 text-white border-white rounded-md cursor-pointer border-1 md:h-8"
                @click="announceLogout" @keyup="announceLogout">
                <span class="capitalize"> Logout </span>
                <IconsLogout :size="20" title="Sign out" />
              </button>
            </div>

            <div class="flex items-center gap-4 p-2" v-else>
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" to="/auth" title="Sign in"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsSignIn :size="20" />
                <p class="hidden capitalize lg:flex">Sign in</p>
              </NuxtLink>

              <!-- sign up -->
              <NuxtLink aria-label="Go to sign up page" to="/auth/SignUp" title="Sign Up"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <IconsProfileCircle :size="24" />
                <p class="hidden capitalize lg:flex">Create Account</p>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div class="flex flex-col items-center w-full text-white md:hidden md:flex-row bg-oceanBlue rounded-b-md">
          <!-- Profile and Sign Up and Home -->
          <div class="flex items-center justify-between w-full">
            <div class="flex">

              <NuxtLink aria-label="Go to profile page" to="/profile" v-if="userToken" class="flex items-center pl-1">
                <IconsProfileCircle :size="20" />
              </NuxtLink>

              <NuxtLink to="/auth/SignUp" title="Sign Up" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <IconsProfileCircle :size="20" />
              </NuxtLink>

              <!-- TIE Library Books -->
              <a aria-label="Visit TIE online library" href="https://ol.tie.go.tz/index.php" target="_blank"
                class="flex items-center justify-center gap-2 px-2 text-center text-white cursor-pointer text-medium lg:w-45"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <IconsSubjects :size="20" />
                </div>
              </a>
              <NuxtLink to="/smart-class" aria-label="Go to Smart Class"
                class="flex items-center justify-center gap-2 px-2 text-center text-white cursor-pointer text-medium lg:w-45 rounded-md"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <IconsSmartClassHub :size="20" />
                </div>
              </NuxtLink>
            </div>

            <!-- Paragraph Text -->
            <NuxtLink to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                TIE online public school
              </p>
            </NuxtLink>

            <!-- Logout and Sign in -->
            <div class="flex items-center">
              <NuxtLink aria-label="Go home" to="/home" class="flex gap-2 pr-2 pl-2 rounded-md"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <IconsHome :size="20" />
                </div>
                <p class="hidden capitalize lg:flex">Home</p>
              </NuxtLink>
              <div class="flex items-center h-6 gap-2 p-2 cursor-pointer md:h-8" @click="logout" v-if="userToken"
                role="button" tabindex="0" @keyup="announceLogout">
                <IconsLogout :size="20" class="" title="Sign out" />
              </div>
              <!-- sign in -->
              <NuxtLink aria-label="go to sign in page" to="/auth" title="Sign in" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <IconsSignIn :size="20" class="" />
              </NuxtLink>
            </div>
          </div>
        </div>
        <div ref="logoutAlert" aria-live="assertive" aria-atomic="true" class="sr-only"></div>
      </div>
    </nav>
  </header>
</template>
