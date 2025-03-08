<template>
    <!-- Header -->
    <header class="sticky top-0 z-10 bg-grayLight shadow-sm py-2">
      <nav class="container flex justify-between items-center">
        <NuxtLink to="/" class="cursor-pointer">
          <NuxtImg src="/logo/logo_tie.png" alt="TIE LOGO" class="w-16 h-16" />
        </NuxtLink>
        <div class="flex justify-between md:w-60">
          <div class="flex items-start gap-3 cursor-pointer">
            <div class="h-16 w-16 overflow-hidden rounded-full">
              <NuxtImg
                src="/profile/profile.jpeg"
                alt="User Profile"
                class="w-full h-full object-cover"
              />
            </div>
            <div class="md:flex flex-col hidden">
              <p class="text-lg">Hello, Friend</p>
              <p class="text-base text-gray-400/80">Student</p>
            </div>
          </div>
          <div class="md:flex hidden">
          <Icon name="hugeicons:arrow-down-01" class="cursor-pointer" size="2rem" />
        </div>
        </div>
      </nav>
    </header>
</template>