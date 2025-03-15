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
    <nav class="relative container max-w-screen-xl flex justify-between items-center py-2 bg-grayLight">
      <NuxtLink to="/" class="cursor-pointer">
        <NuxtImg src="/logo/logo_tie.png" alt="TIE LOGO" class="w-16 h-16" />
      </NuxtLink>

      <div class=" flex max-w-60 bg-grayLight" @click="dropDown">
        <div class="flex items-start cursor-pointer">
          <div class="overflow-hidden rounded-full flex items-center justify-center">
            <NuxtImg v-if="userToken?.profilePic" :src="apiDocs.baseURL" alt="User Profile"
              class="w-full h-full object-cover" />
            <Icon v-else name="ix:user-profile-filled" class="text-gray-400/80" size="56" />
          </div>
          <div class="md:flex flex-col hidden">
            <p class="text-lg capitalize line-clamp-1">Hello, {{ userToken?.name ? String(userToken.name).split(' ')[0]
              :'friend' }}
            </p>
            <p class="text-base text-gray-400/80 capitalize">{{ userToken?.type ? userToken.type : 'Guest' }}</p>
          </div>
        </div>
        <div class="md:flex hidden">
          <Icon name="hugeicons:arrow-down-01" :class="{ 'transform rotate-180': !isPop }"
            class="cursor-pointer transition-transform duration-500 ease-in-out" size="2rem" />
        </div>
      </div>
      <div
        class="absolute top-18 right-10 -z-10 flex flex-col w-40 gap-2 bg-grayLight shadow-md rounded-md p-2 transition-all duration-500 ease-in-out"
        :class="{'!-top-20 !z-0' : isPop}">
        <p class="cursor-pointer" v-if="userToken">Profile</p>
        <p @click="logout" class="cursor-pointer" v-if="userToken">Logout</p>
        <NuxtLink to="/auth" class="cursor-pointer" v-else>Login</NuxtLink>
      </div>
    </nav>
  </header>
</template>