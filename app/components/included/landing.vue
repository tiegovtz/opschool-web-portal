<script lang="ts" setup>
import { IconsMdiBookOpenPageVariantOutline } from '#components';


const educationLevels = [
    {
        name: 'Elimu ya Msingi', description: `Pata masomo shirikishi, shughuli za kujifunzia, na nyenzo za elimu zilizoundwa kwa ajili ya wanafunzi wa shule ya msingi.`,
         path: '/nyumbani',
        classList: ['bg-gradient-to-br from-[#4EA3D8] to-[#89C6F2] '],
        icon: IconsMdiBookOpenPageVariantOutline,
        images: [{
            src: '/images/c43f7a911cc7ca9.png',
            alt: ``
        }],
        motivation: `Tembelea Maudhui ya Elimu ya Msingi`
    },
    {
        name: 'Secondary Education', description: `Access advanced lessons, instructional
videos, and educational resources
designed for secondary school students.`, path: '/home',
        classList: ['bg-gradient-to-br from-[#1F6FB2] to-[#3DA0E3] '],
        icon: IconsMdiBookOpenPageVariantOutline,
        images: [{
            src: '/images/cd228f4bc.png',
            alt: ``
        }],
        motivation: `Explore Secondary Content`
    },
];

// fearures of the school
const features = [
    {
        name: 'Interactive Lessons', description: 'Engage with interactive lessons designed to make learning fun and effective.',
    },
    { name: 'Virtual Classrooms', description: 'Join virtual classrooms and collaborate with teachers and fellow students in real-time.' },
    { name: 'Resource Library', description: 'Access a vast library of educational resources, including textbooks, videos, and quizzes.' }
];

</script>

<template>
    <div class="flex flex-col gap-4 bg-grad">
        <section class="max-w-screen-md mx-auto">
            <h1 class="text-center text-xl font-tahomabd font-bold text-[#0F172A]">Karibu! Welcome</h1>
            <p class="text-center mt-4">Pata maudhui za kujifunzia zilizobuniwa kwa ajili ya elimu ya Msingi na
                Sekondari.
                <b class="text-[#0F172A]">(Access learning resources designed for Primary and Secondary education)</b>
            </p>
        </section>
        <!-- Education Levels -->
        <section class="mt-8">
            <!-- <h2 class="text-3xl text-center mb-4">Education Levels We Offer</h2> -->
            <div class="flex flex-col md:flex-row justify-center gap-6">
                <nuxt-link v-for="(level, idx) in educationLevels" :key="`${idx}-${level.name}-level`" :to="level.path"
                    :class="['p-6 rounded-lg shadow-md w-full md:w-1/3 relative', ...level.classList]">
                    <div :class="['absolute top-2 right-0 z-0 text-white/20 ',idx%2== 1 ? 'duration-300  delay-200':'duration-500  delay-100']" >
                        <icons-shining-pen v-if="idx%2== 0" :size="48" />
                        <icons-microscope v-else-if="idx%2== 1" :size="48" />
                    </div>
                    <div class="flex flex-col gap-6">
                        <span
                            class="p-2 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center w-12 h-12">
                            <component :is="level.icon" class="text-white" :size="32" />
                        </span>
                        <nuxt-img class="rounded-lg h-36 object-cover w-full" :src="level.images[0]?.src" />
                        <div class="">
                            <h3 class="text-xl font-semibold mb-2 text-white ">{{ level.name }}</h3>
                            <p class="text-sm text-white">{{ level.description }}</p>
                        </div>

                        <button class="h-12 w-full text-sm bg-white rounded-full px-4 py-2 text-oceanBlue">
                            {{ level.motivation }}
                        </button>
                    </div>
                </nuxt-link>
            </div>
        </section>

        <!-- Features -->
        <!-- <section class="mt-4 md:mt-16">
            <h2 class="text-3xl text-center mb-4">Explore Our Features</h2>
            <div class="flex flex-col md:flex-row justify-center gap-6">
               
                <div v-for="(f, idx) in features" :key="`${idx}-${f.name}-feature`"
                    class="bg-gray-100 p-6 rounded-lg shadow-md w-full md:w-1/3">
                    <h3 class="text-xl font-semibold mb-2">{{ f.name }}</h3>
                    <p>{{ f.description }}</p>
                </div>
            </div>
        </section> -->
    </div>
</template>