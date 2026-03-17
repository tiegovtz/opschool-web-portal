<script lang="ts" setup>
import type { LanguageSupport } from '~/types/language.interface';

withDefaults(
  defineProps<{educationLevel?:string,language?:LanguageSupport}>(),{
    language:'english',
})
</script>

<template>
    <div class="bg-white h-dvh" @contextmenu.prevent>
        <!-- Header -->
         <included-upper-header :language/>
        <!-- content -->
         <main class="px-4  bg-[url('/images/bg-icons.png')] bg-cover bg-center bg-no-repeat" >
            <section class="md:p-4 p-2 !center-height w-full max-w-screen-xl mx-auto flex flex-col justify-center">
                <slot></slot>
            </section>
         </main>
        <!-- Footer -->  
         <included-footer-view :language/>
    </div>
</template>                      