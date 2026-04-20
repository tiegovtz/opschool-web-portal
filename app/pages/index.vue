<script setup lang="ts">
const contentLayoutLanguage = useContentLayoutLanguage();

definePageMeta({
})

// load prevously used navigation for prevously visited pages education
// from cookies
// then navigate to the last visited page
// if there is no last visited page, navigate to the default page
// const router = useRouter()
// const cookies = useCookie('tie-hub-education-level');

// const pageToVisite:Record<string, unknown> = {
// 'pre-primary':'/primary',
// 'primary':'/primary',
// 'secondary':'/secondary',
// 'higher secondary':'/secondary',  
// 'lower secondary':'/secondary',
// 'upper secondary':'/secondary',
// }

// try {
//   if(cookies.value) {
//     let educationalPageVisited = pageToVisite[cookies.value.toLowerCase().trim()] || '/primary';
//     navigateTo(educationalPageVisited, { replace: true ,redirectCode: 301});
//   }
// } catch (error) {
//   console.error('Error navigating to last visited page:', error)
// }
</script>

<template>
  <NuxtLayout name="landing" :language="contentLayoutLanguage">
    <included-landing/>
  </NuxtLayout>
</template>
