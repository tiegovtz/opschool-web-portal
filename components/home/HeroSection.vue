<template>
  <section class="hero-section md:h-[400px] pt-10 overflow-hidden md:mb-0 mb-10">
    <div class=" grid grid-cols-1 md:grid-cols-2 md:gap-4">
      <div class="flex-col items-center justify-center h-[300px] hidden md:flex  ">
        <SliderShow />
      </div>
      <div class="flex flex-col justify-center md:ml-10 ">
        <h1 class="md:text-extraLarge text-large font-extrabold text-gray-800 mb-4">Welcome</h1>
        <p class="text-medium text-gray-600/60 mb-6">
          What do you want to learn today?
        </p>

        <!-- Search Form -->
        <form action="" @submit.prevent="search"
          class="flex items-center w-full max-w-lg  focus:outline-none focus:ring-2 focus:ring-gray-400 mt-auto rounded-lg bg-gray-500/20 ">
          <div class="flex items-center w-full md:px-2 p-2">
            <!-- Search Icon -->
            <Icon name="mdi:magnify" class="text-gray-400" size="1.5rem" />

            <!-- Search Input -->
            <input type="text" placeholder="Search for anything to learn" class="flex-1 h-full focus:outline-none caret-gray-400 px-2" />
          </div>

          <!-- Search Button -->
          <button type="submit"
            class="bg-oceanBlue text-white p-2 lg:flex hidden rounded-r-lg hover:bg-blue-400 transition duration-500 cursor-pointer">
            Search
          </button>
        </form>

        <!-- app download links -->
        <div class="flex flex-col item-center justify-start gap-2 mt-2">
          <p>Get the App for Android and IOS</p>
          <div class="flex item-center md:justify-start justify-center gap-2">

            <div class="play-store flex items-center justify-center bg-black rounded-md p-1 gap-2 cursor-pointer group">
              <IconsPlayStore class="cursor-pointer transition-all duration-500" />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-oceanBlue transition-all duration-500  ">
                Google play</p>
            </div>

            <!-- apple store  -->
            <div class=" flex items-center justify-center bg-black rounded-md p-1 gap-2 cursor-pointer group">
              <IconsAppStore class="cursor-pointer text-white group-hover:text-oceanBlue transition-all duration-500" />
              <p
                class="capitalize md:text-small text-extraSmall text-white group-hover:text-oceanBlue transition-all duration-500">
                Apple store</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import SliderShow from '../slider/sliderShow.vue';
</script>
