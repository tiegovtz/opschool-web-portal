<template>
  <NuxtLayout name="home-layout">
    <div class="smart-class-entry min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white font-sans">
      <!-- Header Section -->
      <div class="relative h-[50vh] flex items-center justify-center bg-gradient-to-r from-indigo-500 to-purple-600 overflow-hidden">
        <!-- Background Image Overlay -->
        <div class="absolute inset-0 bg-classroom-pattern opacity-30 z-10"></div>

        <!-- Header Content -->
        <div class="text-center z-20 relative">
          <h1 class="text-5xl md:text-6xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-yellow-300 to-green-400 animate-gradient-shift">
            Smart Class Hub
          </h1>
          <p class="text-xl md:text-2xl opacity-90 text-shadow">
            Your Gateway to Interactive Learning
          </p>
        </div>

        <!-- Gradient Overlay -->
        <div class="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-900 to-transparent z-20"></div>
      </div>

      <!-- Main Content -->
      <div class="container mx-auto px-4 py-12 max-w-7xl">
        <!-- Back Button -->
        <button
            v-if="canGoBack"
            @click="goBack"
            class="mb-8 flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-lg border-2 border-white/20 rounded-full text-white hover:bg-white/20 hover:-translate-y-1 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Icon name="mdi:arrow-left" size="20" />
          Back
        </button>

        <!-- Navigation Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <NuxtLink
              v-for="(item, index) in items"
              :key="index"
              :to="item.value === 'smart-class' ? '/smart-class' : `/smart-class/screen/${item.value}`"
              class="nav-card group relative bg-white/5 backdrop-blur-lg rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl border border-white/10 min-h-[280px] animate-slide-in"
              :style="{ animationDelay: `${index * 150}ms` }"
          >
            <!-- Card Background Gradient -->
            <div class="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-purple-600/30 opacity-50 group-hover:opacity-80 group-hover:scale-105 transition-all duration-500"></div>

            <!-- Live Badge -->
            <div v-if="item.isLive" class="absolute top-4 left-4 flex items-center gap-2 bg-red-500/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold z-30">
              <div class="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              LIVE
            </div>

            <!-- Notification Badge -->
            <div v-if="item.notifications" class="absolute top-4 right-4 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold z-30 animate-bounce">
              {{ item.notifications }}
            </div>

            <!-- Card Content -->
            <div class="relative p-8 h-full flex flex-col items-center text-center z-20">
              <!-- Icon -->
              <div class="mb-6 p-4 bg-white/10 backdrop-blur rounded-full group-hover:bg-white/20 group-hover:scale-110 transition-all duration-300">
                <Icon :name="item.icon" size="48" class="text-white" />
              </div>

              <!-- Title -->
              <h3 class="text-xl font-bold mb-3 text-white">{{ item.title }}</h3>

              <!-- Description -->
              <p class="text-white/70 text-sm leading-relaxed flex-grow">{{ item.description }}</p>

              <!-- Hover Action Button -->
              <div class="absolute bottom-4 right-4 w-11 h-11 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 text-gray-800 hover:bg-white hover:scale-110">
                <Icon name="mdi:arrow-right" size="20" />
              </div>
            </div>
          </NuxtLink>

        </div>

        <!-- Quick Stats Section -->
        <div class="bg-white/5 backdrop-blur-lg rounded-3xl p-8 border border-white/10">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div
                v-for="(stat, index) in stats"
                :key="index"
                class="flex items-center gap-4 bg-white/5 p-6 rounded-2xl hover:bg-white/10 hover:-translate-y-2 transition-all duration-300"
            >
              <!-- Stat Icon -->
              <div class="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-white">
                <Icon :name="stat.icon" size="32" />
              </div>

              <!-- Stat Content -->
              <div>
                <div class="text-2xl font-bold text-white mb-1">{{ stat.number }}</div>
                <div class="text-white/70 text-sm">{{ stat.label }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>

<script setup>
import {useRouter} from "vue-router";
import {onMounted, ref} from "vue";
// Define meta info about page
useHead({
  title: "Smart Class Hub - TIE Interactive Learning",
  meta: [
    {
      name: "description",
      content: "Access interactive Smart Class features including live classes, recorded sessions, and educational TV content."
    }
  ]
})

const canGoBack = ref(false)

// Check if there's navigation history
onMounted(() => {
  canGoBack.value = window.history.length > 1
})

const goBack = () => {
  navigateTo(-1) // Nuxt's navigateTo function
}

const items = [
  // {
  //   title: 'Dashboard',
  //   value: 'smart-class',
  //   icon: 'mdi:view-dashboard',
  //   description: 'Overview of your learning progress and achievements',
  //   notifications: null,
  //   isLive: false
  // },
  {
    title: 'Live Classes',
    value: 'live-classes',
    icon: 'mdi:video',
    description: 'Join ongoing interactive learning sessions with teachers',
    notifications: 3,
    isLive: true
  },
  {
    title: 'Upcoming Classes',
    value: 'upcoming-classes',
    icon: 'mdi:calendar-clock',
    description: 'View your scheduled learning sessions and events',
    notifications: 5,
    isLive: false
  },
  {
    title: 'SomaKwanza TV',
    value: 'live-tv',
    icon: 'mdi:television',
    description: 'Educational content streaming and live broadcasts',
    notifications: null,
    isLive: true
  },
  {
    title: 'Recorded Sessions',
    value: 'recorded-sessions',
    icon: 'mdi:video-vintage',
    description: 'Access your personal learning library and replays',
    notifications: null,
    isLive: false
  }
]

const stats = [
  {
    icon: 'mdi:account-group',
    number: '1,234',
    label: 'Active Students'
  },
  {
    icon: 'mdi:video',
    number: '56',
    label: 'Live Sessions'
  },
  {
    icon: 'mdi:clock',
    number: '8.5k',
    label: 'Hours Taught'
  }
]

const navigateTo = (path) => {
  if (path !== 'dashboard') {
    navigateTo(`/main/${path}`)
  }
}
</script>

<style scoped>
/* Custom animations */
@keyframes gradient-shift {
  0%, 100% { filter: hue-rotate(0deg); }
  50% { filter: hue-rotate(180deg); }
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-gradient-shift {
  animation: gradient-shift 3s ease-in-out infinite;
}

.animate-slide-in {
  opacity: 0;
  animation: slide-in 0.6s ease forwards;
}

.text-shadow {
  text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
}

/* Background pattern for header */
.bg-classroom-pattern {
  background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .nav-card {
    min-height: 220px;
  }
}

/* Reduced motion for accessibility */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .nav-card {
    border: 2px solid white;
  }

  .bg-white\/10 {
    background-color: rgba(255, 255, 255, 0.2);
  }
}
</style>