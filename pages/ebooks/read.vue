<template>
    <NuxtLayout name="home-layout">
      <div class="container flex items-center justify-center w-full center-height">
        <EbookFlipBook class="w-full h-full"/>
      </div>
    </NuxtLayout>
  </template>
  
  <script setup>
  // Define meta info about page
  useHead({
    title: "TIE - Read books",
    meta: [
      {
        name: 'description',
        content: 'TIE is a digital learning platform providing quality educational resources for students and teachers in Tanzania.'
      },
      { name: 'keywords', content: 'Tanzania, education, interactive learning, e-learning, students, teachers' },
      { name: 'author', content: 'Tanzania Institute of Education' },
  
      // Open Graph (OG) meta tags for social sharing
      { property: 'og:title', content: 'TIE - Tanzania Interactive Learning Platform' },
      { property: 'og:description', content: 'Explore interactive educational resources for students and teachers in Tanzania.' },
      { property: 'og:image', content: 'https://example.com/preview-image.jpg' }, // Replace with actual image URL
      { property: 'og:url', content: 'https://tie.tz' },
      { property: 'og:type', content: 'website' },
  
      // Twitter Card meta tags
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: 'TIE - Tanzania Interactive Learning Platform' },
      { name: 'twitter:description', content: 'Access quality educational content for students and teachers in Tanzania.' },
      { name: 'twitter:image', content: 'https://example.com/preview-image.jpg' } // Replace with actual image URL
    ]
  })
  
  onMounted(()=>{
    if(!window.location.href.includes('http://localhost:3000/') || !window.location.href.includes('http://tie.ekima.africa/')){
      // redirect home
      window.location.href = '/'
    }
  })
  </script>
  