<template>
  <section class="my-5">
    <div
      class="flex items-center overflow-x-scroll scrollbar-none whitespace-nowrap justify-start md:justify-center gap-3 mb-6">
      <NuxtLink to="/home"
        class="cursor-pointer rounded-md bg-gray-500/40 md:bg-transparent px-2 text-white md:text-black text-medium hover:text-oceanBlue/60"
        active-class="text-white hover:text-white/60 bg-oceanBlue md:bg-white md:text-oceanBlue md:hover:text-oceanBlue/60">
        Interactive Books
      </NuxtLink>
      <NuxtLink to="/printed"
        class="cursor-pointer rounded-md bg-gray-500/40 md:bg-transparent px-2 text-white md:text-black text-medium hover:text-oceanBlue/60"
        active-class="text-white hover:text-white/60 bg-oceanBlue md:bg-white md:text-oceanBlue md:hover:text-oceanBlue/60">
        PDF Books
      </NuxtLink>
      <NuxtLink to="/audio"
        class="cursor-pointer rounded-md bg-gray-500/40  md:bg-transparent px-2 text-white md:text-black text-medium hover:text-oceanBlue/60"
        active-class="text-white hover:text-white/60 bg-oceanBlue md:bg-white md:text-oceanBlue md:hover:text-oceanBlue/60">
        Audio
      </NuxtLink>
      <NuxtLink to="/video"
        class="cursor-pointer rounded-md bg-gray-500/40  md:bg-transparent px-2 text-white md:text-black text-medium hover:text-oceanBlue/60"
        active-class="text-white hover:text-white/60 bg-oceanBlue md:bg-white md:text-oceanBlue md:hover:text-oceanBlue/60">
        Video
      </NuxtLink>
    </div>
  </section>
</template>


