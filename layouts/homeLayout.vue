
<script setup>
import FooterView from '@/components/included/FooterView.vue'
import HeaderView from '@/components/included/HeaderView.vue'
</script>


<template>
<div class="bg-white" v-trusted>
    <!-- Header -->
    <HeaderView />

    <!-- Main content -->
    <main class="wrapper-container">
     <div class="md:shadow-2xl md:p-4 p-2 bg-white !center-height">
      <slot />
     </div>
    </main>
    
    <!-- Feedback -->
    <div v-if="route.path !== '/feedback'" class="fixed right-2 z-10 top-[40%] transform -rotate-90 origin-bottom-right bg-oceanBlue hover:bg-deepBlue transition-all duration-500 ease-in-out rounded-md cursor-pointer">
      <NuxtLink to="/feedback" class="px-4 py-2 text-white">feedback</NuxtLink>
    </div>
    
    <!-- 50 Years -->
    <!-- <div class="fixed z-10 w-16 h-2w-16 bottom-20 right-6 animate-bounce">
      <NuxtImg src="/images/2.KitabuKimoja.webp" alt="KITABU KIMOJA MWANAFUNZI MMOJA" class="object-contain w-full h-full" />
    </div>  -->
    
    <!-- Footer -->
    <FooterView />
  </div>
</template>

<script setup>
import FooterView from '@/components/included/FooterView.vue'
import HeaderView from '~/components/included/HeaderView.vue'

const route = useRoute()



</script>
