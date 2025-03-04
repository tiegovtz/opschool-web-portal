<template>
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-grayLight shadow-sm py-2">
      <nav class="container flex justify-between items-center">
        <NuxtLink to="/">
          <NuxtImg src="/logo/logo_tie.png" alt="TIE" class="w-18 h-18 cursor-pointer" />
        </NuxtLink>
        <div class="flex justify-between w-60">
          <div class="flex items-start gap-3 cursor-pointer">
            <div class="h-14 w-14 overflow-hidden rounded-full">
              <NuxtImg
                src="/profile/profile.jpeg"
                alt="TIE"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="flex flex-col">
              <p class="text-lg ">Hello, Friend</p>
              <p class="text-base text-gray-400/80">Student</p>
            </div>
          </div>
          <Icon name="hugeicons:arrow-down-01" class="cursor-pointer" size="2rem" />
        </div>
      </nav>
    </header>
</template>