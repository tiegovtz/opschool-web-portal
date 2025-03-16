<script setup>
import apiDocs from "~/utilities/api-docs"

const userToken = useCookie('signInUserToken')

const logout = () => {
  userToken.value = null;
  // Dismiss Drop Down
  dropDown();
}

const isPop = ref(true)

const dropDown = () => {
  isPop.value = !isPop.value;
}


</script>

<template>
  <!-- Header -->
  <header class="sticky top-0 z-10 bg-grayLight shadow-sm">

    <nav class="wrapper-container flex flex-col items-center">
      <!-- Phone Number -->
      <div class="relative flex justify-end items-center bg-oceanBlue w-full rounded-b-md">
        <div class=" flex max-w-60 bg-grayLight" v-if="userToken" @click="dropDown">
        <div class="flex items-start cursor-pointer" >
          <div class="overflow-hidden rounded-full flex items-center justify-center" >
            <NuxtImg v-if="userToken?.profilePic" :src="apiDocs.baseURL" alt="User Profile"
              class="w-full h-full object-cover" />
            <Icon v-else name="gg:profile" class="text-gray-400/80" size="56" />
          </div>
          <div class="md:flex flex-col hidden">
            <p class="text-lg capitalize line-clamp-1">Hello, {{ userToken?.name ? String(userToken.name).split(' ')[0]
              :'friend' }}
            </p>
            <p class="text-base text-gray-400/80 capitalize" v-if="userToken?.type">{{ userToken?.type ? userToken.type : 'Guest' }}</p>
          </div>
        </div>
        <div class="md:flex hidden">
          <Icon name="hugeicons:arrow-down-01" :class="{ 'transform rotate-180': !isPop }"
            class="cursor-pointer transition-transform duration-500 ease-in-out" size="2rem" />
        </div>
      </div>
      <div class="p-2 flex items-center gap-2" v-else>
        <NuxtLink to="/auth" class="flex items-center gap-2 cursor-pointer  text-white border-1 h-8 px-1 border-white rounded-md">
          <Icon name="solar:login-2-outline" class="" size="1.5rem" title="Sign in" /> 
          <span>
            Sign in
          </span>
        </NuxtLink>

        <!-- sign up -->
        <NuxtLink to="/auth/SignUp" class="flex items-center gap-2 cursor-pointer  text-white border-1 h-8 px-1 border-white rounded-md">
          <Icon name="solar:login-2-outline" class="" size="1.5rem" title="Sign in" /> 
          <span>
            Sign Up
          </span>
        </NuxtLink>
      </div>
      </div>

      <!-- Header -->
      <div class="relative flex justify-between items-center w-full">
        <div class="flex items-center justify-center">
          <NuxtImg src="/logo/emblem.png" alt="EMBLEM" class="w-16 h-16" />
        </div>
        <div class="flex flex-col items-center text-center gap-1">
          <p class="text-large font-medium uppercase">wizara ya elimu, sayansi na teknolojia </p>
          <p class="text-medium capitalize">taasisi ya elimu tanzania (TET)</p>
        </div>
      <NuxtLink to="/" class="cursor-pointer p-2">
        <NuxtImg src="/logo/logo_tie.png" alt="TIE LOGO" class="w-16 h-16" />
      </NuxtLink>
      </div>
    </nav>
  </header>
</template>