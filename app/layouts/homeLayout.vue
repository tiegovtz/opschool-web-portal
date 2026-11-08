<template>
  <div :class="['bg-white', isFeedbackPage ? 'flex h-dvh flex-col overflow-hidden pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0' : 'pb-20 md:pb-0']" @contextmenu.prevent >
    <!-- Header -->
    <div class="shrink-0"><HeaderView :language :education-level /></div>

    <!-- Main content -->
    <main :class="['wrapper-container', isFeedbackPage ? '!h-auto min-h-0 flex-1' : '']" tabindex="-1" role="main">
     <div :class="['bg-white p-0 md:p-4 md:shadow-2xl', isFeedbackPage ? 'h-full min-h-0' : '!center-height']">
      <slot />
     </div>
    </main>
    
    <nav aria-label="Quick links" class="fixed right-1 top-1/2 z-10 hidden max-h-[80dvh] -translate-y-1/2 flex-col items-end gap-3 overflow-y-auto md:flex sm:right-2">
      <NuxtLink v-if="!isFeedbackPage" :to="feedbackLink" class="rotate-180 whitespace-nowrap rounded-md bg-oceanBlue px-2 py-3 text-xs text-white transition-colors [writing-mode:vertical-rl] hover:bg-deepBlue sm:text-sm">{{ language === 'english' ? 'Feedback and Support' : 'Maoni na Msaada' }}</NuxtLink>
      <NuxtLink v-if="route.path !== '/pdf' && showCombinations" to="/pdf" class="rotate-180 whitespace-nowrap rounded-md bg-oceanBlue px-2 py-3 text-xs text-white transition-colors [writing-mode:vertical-rl] hover:bg-deepBlue sm:text-sm">{{ language === 'english' ? 'Combinations of Subjects' : 'Muhtasari wa Mafunzo' }}</NuxtLink>
    </nav>

    <!-- 50 Years -->
    <!-- <div class="fixed z-10 w-16 h-2w-16 bottom-20 right-6 animate-bounce">
      <NuxtImg src="/images/2.KitabuKimoja.webp" alt="KITABU KIMOJA MWANAFUNZI MMOJA" class="object-contain w-full h-full" />
    </div>  -->
    
    <!-- Footer -->
    <div class="hidden shrink-0 md:block"><FooterView :language :education-level /></div>
    <MobileBottomNav :language :education-level />
  </div>
</template>

<script setup lang="ts">
import FooterView from '@/components/included/FooterView.vue'
import HeaderView from '~/components/included/HeaderView.vue'
import MobileBottomNav from '~/components/included/MobileBottomNav.vue'
import type { LanguageSupport } from '~/types/language.interface';
import type { EducationBucket } from '~/utilities/educationRoute';
const route = useRoute()
const isFeedbackPage = computed(() => route.path === '/feedback');
const props = withDefaults(
  defineProps<{educationLevel?:EducationBucket,language?:LanguageSupport}>(),{
    language:'english',
  },
)
const rememberedEducationLevel = useHubEducationLevel();
// A route-provided level is authoritative during SSR and hydration, before cookies settle.
const showCombinations = computed(() =>
  ['secondary', 'lower secondary', 'upper secondary'].includes(props.educationLevel ?? rememberedEducationLevel.value),
);
const feedbackLink = computed(() => ({
  path: "/feedback",
  query: {
    lang: props.language === "kiswahili" ? "sw" : "en",
    ...(props.educationLevel ? { educationLevel: props.educationLevel } : {}),
  },
}))
</script>
