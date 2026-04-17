<template>
  <div class="bg-white" @contextmenu.prevent >
    <!-- Header -->
    <HeaderView :language :education-level />

    <!-- Main content -->
    <main class="wrapper-container" tabindex="-1" role="main">
     <div class="md:shadow-2xl md:p-4 p-2 bg-white !center-height">
      <slot />
     </div>
    </main>
    
    <!-- Feedback -->
    <div v-if="route.path !== '/feedback'" class="fixed right-2 z-10 top-[40%] transform -rotate-90 origin-bottom-right bg-oceanBlue hover:bg-deepBlue transition-all duration-500 ease-in-out rounded-md cursor-pointer">
      <NuxtLink :to="feedbackLink" class="px-4 py-2 text-white">{{ language === 'english' ? 'Feedback' : 'Maoni' }}</NuxtLink>
    </div>
    
    <!-- Combinations -->
     <div  v-if="route.path !== '/pdf'" class="fixed right-2 z-10 top-[55%] transform -rotate-90 origin-bottom-right bg-oceanBlue hover:bg-deepBlue transition-all duration-500 ease-in-out rounded-md cursor-pointer">
      <NuxtLink v-if=" useHubEducationLevel().value =='lower secondary' ||  useHubEducationLevel().value =='secondary'" to="/pdf" class="px-4 py-2 text-white">{{ language === 'english' ? 'Combinations of Subjects' : 'Muhtasari wa Mafunzo' }}</NuxtLink>
     </div>
    
    <!-- 50 Years -->
    <!-- <div class="fixed z-10 w-16 h-2w-16 bottom-20 right-6 animate-bounce">
      <NuxtImg src="/images/2.KitabuKimoja.webp" alt="KITABU KIMOJA MWANAFUNZI MMOJA" class="object-contain w-full h-full" />
    </div>  -->
    
    <!-- Footer -->
    <FooterView  :language :education-level />
  </div>
</template>

<script setup lang="ts">
import FooterView from '@/components/included/FooterView.vue'
import HeaderView from '~/components/included/HeaderView.vue'
import type { LanguageSupport } from '~/types/language.interface';
import type { EducationBucket } from '~/utilities/educationRoute';
const route = useRoute()
const props = withDefaults(
  defineProps<{educationLevel?:EducationBucket,language?:LanguageSupport}>(),{
    language:'english',
  },
)
const feedbackLink = computed(() => ({
  path: "/feedback",
  query: {
    lang: props.language === "kiswahili" ? "sw" : "en",
    ...(props.educationLevel ? { educationLevel: props.educationLevel } : {}),
  },
}))
</script>
