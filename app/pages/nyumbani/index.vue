<script lang="ts" setup>
import HeroSection from '~/components/home/HeroSection.vue';
import InputsSelection from '~/components/home/InputsSelection.vue';
import TabBar from '~/components/home/TabBar.vue';

// Define meta info about page
useHead({
    title: "TIE - Tanzania Interactive Learning Platform",
    meta: [
        {
            name: "description",
            content:
                "TIE is a digital learning platform providing quality educational resources for students and teachers in Tanzania.",
        },
        {
            name: "keywords",
            content:
                "Tanzania, education, interactive learning, e-learning, students, teachers",
        },
        { name: "author", content: "Tanzania Institute of Education" },

        // Open Graph (OG) meta tags for social sharing
        {
            property: "og:title",
            content: "TIE - Tanzania Interactive Learning Platform",
        },
        {
            property: "og:description",
            content:
                "Explore interactive educational resources for students and teachers in Tanzania.",
        },
        { property: "og:image", content: "https://example.com/preview-image.jpg" }, // Replace with actual image URL
        { property: "og:url", content: "https://tie.tz" },
        { property: "og:type", content: "website" },

        // Twitter Card meta tags
        { name: "twitter:card", content: "summary_large_image" },
        {
            name: "twitter:title",
            content: "TIE - Tanzania Interactive Learning Platform",
        },
        {
            name: "twitter:description",
            content:
                "Access quality educational content for students and teachers in Tanzania.",
        },
        { name: "twitter:image", content: "https://example.com/preview-image.jpg" }, // Replace with actual image URL
    ],
});

// Define Cookie
const userToken = useCookie("signInUserToken");
</script>

<template>
    <nuxt-layout name="home-layout" language="kiswahili">
        <section v-if="userToken">
            <HomeSearchbar appearance="rounded" />
            <!--  @emit-active-tab="switchTab($event)" :active-tab="activeTab"  -->
            <TabBar :is-logged-in="true" />
        </section>
        <section v-else>
            <HeroSection language="kiswahili"/>
            <InputsSelection />
            <!-- @emit-level="level = $event" @emit-standard="filters.level = $event"
        @emit-subject="filters.subject = $event"  -->
            <TabBar />

        </section>
    </nuxt-layout>
</template>