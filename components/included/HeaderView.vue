<script setup>
import apiDocsFile from "~/utilities/api-docs";;
const apiDocs = apiDocsFile.setup()
const userToken = useCookie('signInUserToken')

const logout = () => {
  userToken.value = null;
  const router = useRoute();
  // Use the State
  // useState("topicToView", () => null);
  // useState("videoToView", () => null);
  // useState("experimentToView", () => null);

  router.replace("/home");
  // Dismiss Drop Down
  dropDown();
};

const isPop = ref(true);

const dropDown = () => {
  isPop.value = !isPop.value;
};
</script>

<template>
  <!-- Header -->
  <header class="relative shadow-sm bg-[url('/public/flag/tenor.gif')] bg-cover bg-center bg-no-repeat">
    <nav class="flex flex-col items-center bg-white bg-opacity-75">
      <!-- Header -->
      <div class="relative w-full h-24 pt-1">
        <!-- <div
          class="absolute top-0 left-0 z-0 w-full h-full bg-white bg-opacity-75"
        ></div> -->
        <div class="flex items-center justify-between w-full h-full wrapper-container">
          <NuxtLink to="/" class="flex items-center justify-center h-full cursor-pointer w-18">
            <NuxtImg src="/logo/emblem.webp" alt="EMBLEM" class="object-contain w-full h-full" />
          </NuxtLink>
          <div class="flex flex-col items-center h-full gap-1 text-center uppercase font-tahomabd">
            <p class="md:text-small text-extraSmall text-deepBlue text-shadow">
              Ministry of education, science and technology
            </p>
            <p class="lg:text-[1.8rem] md:text-[1.4rem] text-small">
              Tanzania institute of education (TIE)
            </p>
          </div>
          <NuxtLink to="/" class="flex items-center justify-center h-full p-2 cursor-pointer">
            <NuxtImg src="/logo/logo_tie.webp" alt="TIE LOGO" class="w-14 h-14" />
          </NuxtLink>
        </div>
      </div>

      <div class="w-full ">
        <!-- Media Screen -->
        <div
          class="flex-col items-center hidden w-full gap-2 text-white md:flex md:flex-row bg-oceanBlue rounded-xs wrapper-container">
          <NuxtLink to="/" class="flex gap-2 pl-2">
            <div class="flex items-center justify-center">
              <Icon name="ant-design:home-filled" size="20" />
            </div>
            <p class="hidden capitalize lg:flex">Home</p>
          </NuxtLink>
          <!-- TIE Library Books -->
          <a href="https://ol.tie.go.tz/index.php" target="_blank"
            class="flex items-center gap-2 px-2 text-center text-white cursor-pointer text-medium"
            active-class="text-white !bg-deepBlue">
            <div class="flex items-center justify-center">
              <Icon name="ph:notebook-fill" size="20" />
            </div>
            <p class="hidden capitalize lg:flex">TIE Library</p>
          </a>

          <!-- title (TIE online public school) -->
          <div class="flex-1">
            <NuxtLink to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                TIE online public school
              </p>
            </NuxtLink>
          </div>

          <!-- Profile and Sign Up -->
          <div class="subInfo">
            <div class="flex items-center gap-4 px-2 py-1" v-if="userToken">
              <div class="flex items-center justify-center overflow-hidden rounded-full">
                <div class="flex items-center gap-1 cursor-pointer">
                  <NuxtImg v-if="userToken?.profilePic" :src="apiDocs.baseURL" alt="User Profile"
                    class="object-cover w-full h-full" />
                  <Icon v-else name="iconamoon:profile-circle-thin" class="" size="2rem" />
                  <p class="capitalize text-medium line-clamp-1 max-w-60">
                    Hello,
                    {{
              userToken?.name
                ? String(userToken.name).split(" ")[0]
                : "friend"
            }}
                  </p>
                </div>
              </div>
              <div
                class="flex items-center h-6 gap-2 p-2 text-white border-white rounded-md cursor-pointer border-1 md:h-8"
                @click="logout">
                <span class="capitalize"> Logout </span>
                <Icon name="solar:logout-2-outline" class="" size="1.2rem" title="Sign out" />
              </div>
            </div>
            <div class="flex items-center gap-4 p-2" v-else>
              <!-- sign in -->
              <NuxtLink to="/auth" title="Sign in"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <Icon name="solar:login-2-outline" class="" size="1.5rem" />
                <p class="hidden capitalize lg:flex">Sign in</p>
              </NuxtLink>

              <!-- sign up -->
              <NuxtLink to="/auth/SignUp" title="Sign Up"
                class="flex items-center h-6 gap-2 px-1 text-white border-white rounded-md cursor-pointer border-1 md:h-8">
                <Icon name="iconamoon:profile-thin" class="" size="1.5rem" />
                <p class="hidden capitalize lg:flex">Create Account</p>
              </NuxtLink>
            </div>
          </div>
        </div>

        <!-- Mobile Menu -->
        <div class="flex flex-col items-center w-full text-white md:hidden md:flex-row bg-oceanBlue rounded-b-md">
          <!-- Profile and Sign Up and Home -->
          <div class="flex items-center justify-between w-full">
            <div class="flex items-center gap-2">

              <Icon v-if="userToken" name="iconamoon:profile-circle-thin" class="" size="1.2rem" />
              <NuxtLink to="/auth/SignUp" title="Sign Up" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <Icon name="iconamoon:profile-thin" class="" size="1.2rem" />
              </NuxtLink>
              <!-- TIE Library Books -->
              <a href="https://ol.tie.go.tz/index.php" target="_blank"
                class="flex items-center justify-center gap-2 px-2 text-center text-white cursor-pointer text-medium lg:w-45"
                active-class="text-white !bg-deepBlue">
                <div class="flex items-center justify-center">
                  <Icon name="ph:notebook-fill" size="20" />
                </div>
              </a>
            </div>

            <!-- Paragraph Text -->
            <NuxtLink to="/">
              <p class="block text-center uppercase lg:text-large text-medium text-shadow">
                TIE online public school
              </p>
            </NuxtLink>

            <!-- Logout and Sign in -->
            <div class="flex items-center">
              <NuxtLink to="/" class="flex gap-2 pr-2">
                <div class="flex items-center justify-center">
                  <Icon name="ant-design:home-filled" size="20" />
                </div>
                <p class="hidden capitalize lg:flex">Home</p>
              </NuxtLink>
              <div class="flex items-center h-6 gap-2 p-2 cursor-pointer md:h-8" @click="logout" v-if="userToken">
                <Icon name="solar:logout-2-outline" class="" size="1.2rem" title="Sign out" />
              </div>
              <!-- sign in -->
              <NuxtLink to="/auth" title="Sign in" v-else
                class="flex items-center h-6 gap-2 px-1 cursor-pointer md:h-8">
                <Icon name="solar:login-2-outline" class="" size="1.2rem" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </nav>
  </header>
</template>
