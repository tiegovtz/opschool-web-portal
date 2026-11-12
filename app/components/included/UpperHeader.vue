<script setup lang="ts">
import type { LanguageSupport } from '~/types/language.interface';
import { moveFocus } from '~/utilities/focus.helper';

const props = withDefaults(
  defineProps<{educationLevel?:string,language?:LanguageSupport,variant?:'default' | 'landing'}>(),{
    language:'english',
    variant:'default',
});

const tieLogoAlt = computed(() =>
  props.language === 'kiswahili'
    ? "Nembo ya Taasisi ya Elimu Tanzania. Bango la juu lenye ukingo wa bluu lina maandishi 'Taasisi ya Elimu Tanzania.' Katikati kuna mwenge mweusi wenye mwali mwekundu na wa manjano. Chini ya mwenge kuna kitabu kilichofunguliwa chenye mistari ya bluu na dira mbili nyeusi chini yake. Upande wa kushoto wa nembo kuna jembe la rangi ya machungwa, na upande wa kulia kuna shoka la rangi ya machungwa, yote yakiwa yameelekezwa kuelekea ndani. Nembo imezungukwa na mabango ya utepe yaliyopinda yenye ukingo wa bluu. Bango la chini, pia lenye ukingo wa bluu, lina maandishi 'Elimu ni Kazi.'"
    : "An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text 'Taasisi ya Elimu Tanzania.' At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text 'Elimu ni Kazi.'",
);

</script>

<template>
    <div :class="['relative shadow-sm', props.variant === 'landing' ? 'upper-header--landing' : '']">
        <button
            v-if="props.variant !== 'landing'"
            class="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 -z-30 focus:z-50 border border-blue-800 rounded-full px-4 py-1 bg-white"
            aria-label="Press Enter to jump to main content" @click="moveFocus('main-container')" type="button">{{ props.language=='english' ?`Skip to
            the
            Content`:`Nenda kwenye maudhui` }}</button>
        <div class="upper-header-content relative flex h-[72px] w-full justify-center bg-white/75 md:h-24 md:pt-1">
            <div class="flex items-center justify-between w-full h-full wrapper-container">
                <NuxtLink to="/" aria-label="Go to homepage,link with court of arm image "
                    aria-describedby="tanzania-emblem-longdesc"
                    class="flex h-full max-w-[44px] shrink-0 cursor-pointer items-center justify-center md:max-w-[64px]">
                    <figure>
                        <img src="/logo/emblem.webp"
                            alt="Tanzania coat of arms: man and woman supporting a central shield with Mount Kilimanjaro, flag colors, water waves, a torch, and crossed tools"
                            role="img" aria-describedby="tanzania-emblem-longdesc"
                            class="object-contain w-full h-full" />

                        <figcaption id="tanzania-emblem-longdesc" class="sr-only">
                            Tanzania’s coat of arms with a central shield supported by a man on the viewer’s left and a
                            woman on the
                            viewer’s
                            right. The shield shows Mount Kilimanjaro at the top, Tanzania’s flag colors across the
                            middle, and blue
                            and white
                            waves at the bottom. A gold torch with a red-orange flame stands in front. Behind the shield
                            are crossed
                            traditional
                            tools: a spear and a hoe.
                        </figcaption>
                    </figure>
                </NuxtLink>

                <div class="flex h-full min-w-0 flex-col items-center justify-center gap-0.5 text-center uppercase font-tahomabd md:gap-1" tabindex="0"
                    aria-label="Presented by Ministry of education, science and technology together with Tanzania institute of education (TIE)"
                    role="region">
                    <p class="text-[10px] leading-4 text-deepBlue text-shadow md:text-small">
                        {{ props.language=='english' ?`Ministry of education, science and technology`:`Wizara ya elimu, Sayansi na Teknolojia` }}
                    </p>
                    <p class="text-[13px] leading-[18px] md:text-[1.4rem] lg:text-[1.8rem]">
                       {{ props.language=='english' ?`Tanzania institute of education (TIE)`:`Taasisi ya Elimu Tanzania (TET)` }}
                    </p>
                </div>
                <NuxtLink to="/" class="flex h-full shrink-0 cursor-pointer items-center justify-center p-1 md:p-2">
                    <img src="/logo/logo_tie.webp" class="h-11 w-11 md:h-16 md:w-16" width="64" height="64"
                        :alt="tieLogoAlt" />
                </NuxtLink>
            </div>
        </div>
    </div>
</template>

<style scoped>
@media (max-width: 767px) {
  .upper-header--landing {
    padding: 12px 12px 0;
    box-shadow: none;
  }

  .upper-header--landing .upper-header-content {
    height: auto;
    min-height: 100px;
    border-radius: 18px;
    background: linear-gradient(110deg, #0879bd, #66b8e8);
    box-shadow: 0 8px 18px rgba(18, 79, 134, 0.2);
  }

  .upper-header--landing .wrapper-container {
    gap: 8px;
    padding: 8px 12px;
  }

  .upper-header--landing .wrapper-container > div p {
    color: white;
    text-shadow: none;
  }

  .upper-header--landing .wrapper-container > a:last-child img {
    width: 48px;
    height: 48px;
  }
}
</style>
