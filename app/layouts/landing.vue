<script lang="ts" setup>
import Background from '~/components/included/background.vue';
import type { LanguageSupport } from '~/types/language.interface';

withDefaults(
    defineProps<{ educationLevel?: string, language?: LanguageSupport }>(), {
    language: 'english',
})
</script>

<template>
    <div class="relative flex flex-col gap-10 justify-between  h-dvh bg-[linear-gradient(135deg,#d8eafb_0%,#8bb8dd_34%,#1f6fb2_68%,#174f80_100%)] p-4 py-4 md:px-8 xl:px-16 "
        @contextmenu.prevent>
        <!-- background -->
        <Background class="" />

        <section class="rounded-3xl overflow-hidden bg-white w-full max-w-[1600px] pb-4 m-auto">
            <!-- Header -->
            <div class="bg-white">
                <included-upper-header :language />
            </div>
            <!-- content -->
            <main class="px-4 overflow-hidden">
                <section class="md:p-4 p-2 flex-1 w-full max-w-screen-xl mx-auto flex flex-col justify-center relative">
                    <div
                        class="pointer-events-none absolute left-[-210px] top-[120px] h-[920px] w-[620px] rounded-[50%] bg-[rgba(31,111,178,0.08)] sm:left-[-240px] sm:top-[128px] sm:h-[980px] sm:w-[660px] lg:left-[-250px] lg:top-[132px] lg:h-[1040px] lg:w-[700px]" />
                    <div
                        class="pointer-events-none absolute bottom-8 right-12 h-56 w-56 rounded-full bg-[rgba(31,111,178,0.14)] blur-sm" />
                    <slot></slot>
                </section>
            </main>
        </section>
        <!-- Footer -->
        <section class="w-full max-w-[1600px] mx-auto">
            <included-footer-view :language appearance="rounded-glass" />
        </section>
    </div>
</template>