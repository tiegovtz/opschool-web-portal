<script lang="ts" setup>
import Background from '~/components/included/background.vue';
import type { LanguageSupport } from '~/types/language.interface';

withDefaults(
    defineProps<{ educationLevel?: string, language?: LanguageSupport }>(), {
    language: 'english',
})
</script>

<template>
    <!-- Single viewport-height scroll area: no body overscroll gap; scrollbar hidden but scroll still works -->
    <div
        class="relative h-dvh max-h-dvh overflow-y-auto overflow-x-hidden overscroll-y-contain scrollbar-none"
        @contextmenu.prevent>
        <div
            class="relative flex min-h-full flex-col gap-6 bg-[linear-gradient(135deg,#d8eafb_0%,#8bb8dd_34%,#1f6fb2_68%,#174f80_100%)] p-4 py-4 md:gap-8 md:px-8 xl:px-16 pb-6">
            <Background class="" />

            <main class="flex min-h-0 flex-1 flex-col">
                <section
                    class="z-50 mx-auto w-full max-w-[1600px] shrink-0 overflow-hidden rounded-3xl bg-white pb-4">
                    <div class="bg-white">
                        <included-upper-header :language />
                    </div>
                    <!-- Clip oversized decorative layers so they do not extend document scroll -->
                    <div class="overflow-hidden px-4">
                        <section
                            class="relative mx-auto flex w-full max-w-screen-xl flex-col overflow-hidden p-2 py-2 md:p-4 md:py-4">
                            <div
                                class="pointer-events-none absolute left-[-210px] top-[120px] h-[920px] w-[620px] rounded-[50%] bg-[rgba(31,111,178,0.08)] sm:left-[-240px] sm:top-[128px] sm:h-[980px] sm:w-[660px] lg:left-[-250px] lg:top-[132px] lg:h-[1040px] lg:w-[700px]" />
                            <div
                                class="pointer-events-none absolute bottom-8 right-12 h-56 w-56 rounded-full bg-[rgba(31,111,178,0.14)] blur-sm" />
                            <slot></slot>
                        </section>
                    </div>
                </section>
            </main>

            <section class="mx-auto w-full max-w-[1600px] shrink-0">
                <included-footer-view :language appearance="rounded-glass" />
            </section>
        </div>
    </div>
</template>
