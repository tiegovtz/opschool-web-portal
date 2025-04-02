<template>
  <section class="my-5">
    <div
      class="flex items-center overflow-x-scroll scrollbar-none whitespace-nowrap justify-start md:justify-center gap-3 mb-6">
      <!-- Interactive Books -->
      <NuxtLink to="/home"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
        active-class="text-white !bg-deepBlue ">
        <div class="flex items-center justify-center">
          <Icon name="streamline:vr-headset-2-solid" size="20" class="" />
        </div>
        Interactive Books
      </NuxtLink>

      <!-- Electronics Books -->
      <NuxtLink to="/ebooks"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="ph:notebook-fill" size="20" />
        </div>
        eBooks
      </NuxtLink>

      <!-- Audio -->
      <NuxtLink to="/audio"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="famicons:headset-sharp" size="20" />
        </div>
        Audio
      </NuxtLink>

      <!-- Video -->
      <NuxtLink to="/video"
        class="flex items-center justify-center cursor-pointer rounded-md bg-oceanBlue hover:bg-deepBlue transition-colors duration-500 ease-in-out px-2 text-white text-medium lg:w-45 text-center gap-2"
        active-class="text-white !bg-deepBlue">
        <div class="flex items-center justify-center">
          <Icon name="fluent:video-24-filled" size="20" />
        </div>
        Video
      </NuxtLink>
    </div>
  </section>
</template>


