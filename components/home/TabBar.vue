<template>
  <section class="my-5">
    <div
      class="flex items-center overflow-x-scroll scrollbar-none whitespace-nowrap justify-start md:justify-center gap-3 mb-6">
      <!-- Interactive Books -->
      <NuxtLink to="/home"
        class="cursor-pointer rounded-[30px] bg-oceanBlue px-2 text-white text-medium lg:w-40 text-center"
        active-class="text-white !bg-deepBlue ">
        Interactive Books
      </NuxtLink>

      <!-- Electronics Books -->
      <NuxtLink to="/printed"
        class="cursor-pointer rounded-[30px] bg-oceanBlue px-2 text-white text-medium lg:w-40 text-center"
        active-class="text-white !bg-deepBlue">
        eBooks
      </NuxtLink>

      <!-- Audio -->
      <NuxtLink to="/audio"
        class="cursor-pointer rounded-[30px] bg-oceanBlue px-2 text-white text-medium lg:w-40 text-center"
        active-class="text-white !bg-deepBlue">
        Audio
      </NuxtLink>

      <!-- Video -->
      <NuxtLink to="/video"
        class="cursor-pointer rounded-[30px] bg-oceanBlue px-2 text-white text-medium lg:w-40 text-center"
        active-class="text-white !bg-deepBlue">
        Video
      </NuxtLink>
    </div>
  </section>
</template>


