<template>
  <div class="bg-white">
    <!-- Header -->
    <HeaderView />


    <!-- Main content -->
    <main class=" wrapper-container ">
     <div class="md:shadow-2xl md:p-2 p-2 bg-white !center-height">
      <slot />
     </div>
    </main>

    <!-- app download links -->
    <div class="flex flex-col item-center justify-start gap-2 my-2 md:hidden ">
      <p class="text-center"> Get the App for Android and IOS</p>
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
    <!-- Footer -->
    <FooterView />
  </div>
</template>

<script setup>
import FooterView from '@/components/included/FooterView.vue'
import HeaderView from '~/components/included/HeaderView.vue'

</script>
