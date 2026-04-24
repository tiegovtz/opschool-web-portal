<script setup lang="ts">
import { ref } from "vue";
import SliderShow from "../slider/sliderShow.vue";
import type { LanguageSupport } from "~/types/language.interface";

const props = withDefaults(
  defineProps<{ educationLevel?: string, language?: LanguageSupport }>(), {
  language: 'english',
})
// Define the full text
const fullText = computed(()=>props.language == 'english' ? `
Welcome to <b>TIE ONLINE SCHOOL</b>, an innovative platform developed by the
Tanzania Institute of Education (TIE) to assist you in reaching your educational goals
through engaging methods. Here, you will access high-quality learning resources for
secondary education, thoughtfully made to give you the best experience. <br/><br/>

These resources will enable you to learn efficiently and effectively while inspiring you to
reach your full potential. This platform has been designed carefully to offer you the
necessary knowledge, skills, and competencies for your learning progress and prepare
you for the challenges ahead. <br/><br />

Embrace modern learning and take advantage of the flexibility to study anytime,
anywhere. Join this new platform and start an academic pursuit that will enable you to
soar to greater heights. <br/><b>Welcome onboard!</b>
` :
  `SHULE MTANDAO YA TET ni jukwaa shirikishi la kujifunzia kupitia maudhui ya kidijitali.
<br/><br />
Jukwaa hili limeandaliwa kwa ajili ya wanafunzi wa rika zote kwa kuwawezesha kufanya shughuli za masomo mbalimbali zinazofaa kwa darasani au kujisomea binafsi.
<br/>
Jukwaa hili linafanya ujifunzaji uwe rahisi, kufurahisha na kumfanya mwanafunzi asisahau kile alichojifunza.`);

// Define the short preview text
const shortText =computed(()=> props.language == 'english' ? `
Welcome to <b>TIE ONLINE SCHOOL</b>, an innovative platform developed by the
Tanzania Institute of Education (TIE) to assist you in reaching your educational goals
through engaging methods. Here, you will access high-quality learning resources for
secondary education, thoughtfully made to give you the best experience. <br /><br />

These resources will enable you to learn efficiently and effectively while inspiring you to
reach your full potential. This platform has been designed carefully to offer you the
necessary knowledge, skills, and competencies for your learning progress and prepare
you for the challenges ahead. <br/><br />
`: `
SHULE MTANDAO YA TET ni jukwaa shirikishi la kujifunzia kupitia maudhui ya kidijitali.
<br/>
Jukwaa hili limeandaliwa kwa ajili ya wanafunzi wa rika zote kwa kuwawezesha kufanya shughuli za masomo mbalimbali zinazofaa kwa darasani au kujisomea binafsi.
<br/><br />
Jukwaa hili linafanya ujifunzaji uwe rahisi, kufurahisha na kumfanya mwanafunzi asisahau kile alichojifunza.
Furahia kujifunza kwa kufanya shughuli mbalimbali zinazofurahisha na kukuwezesha kupata maarifa ya kina, kukuza ubunifu, uwezo wa kufikiri kwa kina, na kukuhamasisha kupenda kujifunza kwa muda wote.`);

// Track if the user has clicked "Read More"
const isExpanded = ref<boolean>(false);

// Toggle function
const toggleReadMore = async () => {
  isExpanded.value = !isExpanded.value;

  await nextTick();
  document.getElementById("hero-description")?.focus();
};
</script>

<template>
  <!-- Hero landmark -->
  <section class="flex justify-center my-2 hero-section" aria-label="Ekima interactive learning introduction">
    <div class="grid grid-cols-1 xl:grid-cols-2 md:gap-2">
      <!-- Slider -->
      <div class="flex flex-col items-center justify-center h-full">
        <SliderShow
          :language
          :variant="educationLevel === 'primary' ? 'primary' : 'secondary'"
        />
      </div>

      <!-- Text / CTA -->
      <div aria-label="welcome note" aria-describedby="hero-description" role="region" tabindex="0"
        class="flex flex-col h-full xl:ml-10">
        <!-- Main heading: visible AND readable by screen readers on all sizes -->
        <h1 class="mb-4 font-extrabold text-large md:text-extraLarge" id="hero-heading">
         {{ language=='english' ? ` Welcome`:`Karibu` }}
        </h1>

        <!-- Description container controlled by the button -->
        <div id="hero-description" tabindex="-1" role="region" aria-live="polite" aria-atomic="true"
          class="my-2 text-xl text-justify text-black text-medium text-opacity-80" v-html="isExpanded ? fullText : shortText">
        </div>

        <!-- Read more / Show less toggle -->
        <button type="button" v-if="language=='english'" @click="toggleReadMore"
          class="self-start text-sm underline rounded cursor-pointer text-oceanBlue focus:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue focus-visible:ring-offset-2"
          :aria-expanded="isExpanded" aria-controls="hero-description">
          {{ isExpanded ? "Show Less" : "Read More" }}
        </button>

        <!-- Banner image (only when collapsed) -->
        <div tabindex="0" :class="[
          'overflow-hidden rounded-md my-auto transition-all duration-500 ease-in-out bg-gradient-to-b',
          isExpanded ? 'h-0' : 'h-auto'
        ]">
          <NuxtImg src="/images/4.banner_miaka_50_transparent.gif"
            alt="Animated white banner on a stage backdrop celebrating ‘Miaka 50 ya Taasisi ya Elimu Tanzania (TET)’ (50 years of the Tanzania Institute of Education). At the top left is the TET/TIE emblem. Across the left side in yellow text is the hashtag ‘#KitabuKimojaMwanafunziMmoja’. Below it on the left is a yellow phone number ‘994040118259’, and near the bottom center-right is another yellow phone number ‘0758460508’. On the right side is a black-and-white cartoon of a smiling student with arms raised, holding an open book above their head. Curving around the illustration in blue is the slogan ‘Kitabu Kimoja Mwanafunzi Mmoja’."
            class="object-contain w-full h-full" />
        </div>
      </div>
    </div>
  </section>
</template>
