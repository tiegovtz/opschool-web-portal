<script setup lang="ts">
import type { LanguageSupport } from '~/types/language.interface';
import { moveFocus } from '~/utilities/focus.helper';

withDefaults(
  defineProps<{educationLevel?:string,language?:LanguageSupport}>(),{
    language:'english',
})

</script>

<template>
    <div class="relative shadow-sm ">
        <button
            class="absolute top-0 left-1/2 -translate-x-1/2 translate-y-1/2 -z-30 focus:z-50 border border-blue-800 rounded-full px-4 py-1 bg-white"
            aria-label="Press Enter to jump to main content" @click="moveFocus('main-container')" type="button">{{ language=='english' ?`Skip to
            the
            Content`:`Nenda kwenye maudhui` }}</button>
        <div class="relative flex justify-center w-full h-24 pt-1 bg-white/75 ">
            <div class="flex items-center justify-between w-full h-full wrapper-container">
                <NuxtLink to="/" aria-label="Go to homepage,link with court of arm image "
                    aria-describedby="tanzania-emblem-longdesc"
                    class="flex items-center justify-center h-full cursor-pointer max-w-[64px]">
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

                <div class="flex flex-col items-center h-full gap-1 text-center uppercase font-tahomabd" tabindex="0"
                    aria-label="Presented by Ministry of education, science and technology together with Tanzania institute of education (TIE)"
                    role="region">
                    <p class="md:text-small text-extraSmall text-deepBlue text-shadow">
                        {{ language=='english' ?`Ministry of education, science and technology`:`Wizara ya elimu, Sayansi na Teknolojia` }}
                    </p>
                    <p class="lg:text-[1.8rem] md:text-[1.4rem] text-small">
                       {{ language=='english' ?`Tanzania institute of education (TIE)`:`Taasisi ya Elimu Tanzania (TET)` }}
                    </p>
                </div>
                <NuxtLink to="/" class="flex items-center justify-center h-full p-2 cursor-pointer">
                    <img src="/logo/logo_tie.gif" class="w-16 h-16"
                        alt="An image logo representing the Tanzania Institute of Education. The top banner, outlined in blue, contains the text ‘Taasisi ya Elimu Tanzania.’ At the center is a black torch with a bright red and yellow flame. Below the torch is an open book with blue lines and two black compasses beneath it. On the left side of the emblem is an orange hoe, and on the right side is an orange axe, both angled inward. Surrounding the emblem are curved ribbon banners outlined in blue. The bottom banner, also outlined in blue, contains the text ‘Elimu ni Kazi." />
                </NuxtLink>
            </div>
        </div>
    </div>
</template>