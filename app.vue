<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import apiDocs from './utilities/apiDocs'
import { useBackspaceNavigation } from '@/composables/useBackspaceNavigation'
import { useGlobalFocus } from '@/composables/useGlobalFocus'
import {
  isGreaterToXL,
  isGreaterToLG,
  isGreaterToMD,
  isGreaterToSM,
  isGreaterToXS,
  screenWidth
} from './utilities/controlls'
import { webVisitor } from './utilities/platform'


// User and session state
const userToken = useCookie('signInUserToken')
const accessToken = useCookie('signInAccessToken')
const userTimeSpent = ref(0)
const isUserActive = ref(false)

// Time and interval refs
let activityInterval
let timeTick

if (import.meta.client) {
  // Resize state
  const widthGreater1280 = computed(() => screenWidth.value >= 1280)
  const widthGreater1024 = computed(() => screenWidth.value >= 1024 && screenWidth.value < 1280)
  const widthGreater768 = computed(() => screenWidth.value >= 768 && screenWidth.value < 1024)
  const widthGreater640 = computed(() => screenWidth.value >= 640 && screenWidth.value < 768)
  const widthGreater320 = computed(() => screenWidth.value >= 320 && screenWidth.value < 640)

  const handleResize = () => {
    screenWidth.value = window.innerWidth
    isGreaterToXL.value = widthGreater1280.value
    isGreaterToLG.value = widthGreater1024.value
    isGreaterToMD.value = widthGreater768.value
    isGreaterToSM.value = widthGreater640.value
    isGreaterToXS.value = widthGreater320.value
  }

  const activityHandler = () => {
    isUserActive.value = true
    clearTimeout(window.userInactiveTimeout)
    window.userInactiveTimeout = setTimeout(() => {
      isUserActive.value = false
    }, 120000)
  }

  const updateTimeSpent = async () => {
    if (userToken.value && userTimeSpent.value > 0) {
      try {
        await $fetch(apiDocs.auth.updateTimeSpent, {
          method: 'PATCH',
          body: {
            duration: userTimeSpent.value
          },
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken.value}`
          }
        })
        userTimeSpent.value = 0
      } catch (error) {
        console.error('Error updating time spent:', error)
      }
    }
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateTimeSpent()
      isUserActive.value = false
    } else {
      isUserActive.value = false
    }
  }

  onMounted(async () => {
    screenWidth.value = window.innerWidth
    handleResize()
    window.addEventListener('resize', handleResize)

    const events = ['mousemove', 'keypress', 'click', 'scroll']
    events.forEach(e => window.addEventListener(e, activityHandler))

    document.addEventListener('visibilitychange', handleVisibilityChange)

    // Time update interval (every 2 mins)
    activityInterval = setInterval(() => {
      if (userToken.value && isUserActive.value && userTimeSpent.value > 0) {
        updateTimeSpent()
      }
    }, 120000)

    // Increment time while user is active (every second)
    timeTick = setInterval(() => {
      if (userToken.value && isUserActive.value && document.visibilityState === 'visible') {
        userTimeSpent.value += 1000
      }
    }, 1000);

    webVisitor();
    useGlobalFocus();
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)

    const events = ['mousemove', 'keypress', 'click', 'scroll']
    events.forEach(e => window.removeEventListener(e, activityHandler))

    document.removeEventListener('visibilitychange', handleVisibilityChange)

    clearInterval(activityInterval)
    clearInterval(timeTick)
  });

}
</script>

<template>

  <a class="skip-link" href="#main-content" @click.prevent="focusMain">Skip to main content</a>

  <NuxtLayout>
    <NuxtLoadingIndicator color="#56ade8" errorColor="#f00" />
    <NuxtPage @contextmenu.prevent />
  </NuxtLayout>

</template>

<script setup>
import { nextTick } from 'vue'
const focusMain = () => {
  nextTick(() => {
    const el = document.querySelector('[role="main"]') || document.getElementById('main-content')
    if (el && typeof el.focus === 'function') el.focus()
  })
}
</script>

<style>
/* Global skip link */
.skip-link {
  position: absolute;
  left: -999px;
  top: auto;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
.skip-link:focus {
  left: 1rem;
  top: 1rem;
  width: auto;
  height: auto;
  padding: 0.5rem 1rem;
  background: #fff;
  color: #111;
  z-index: 2000;
  border-radius: 4px;
  text-decoration: none;
}
</style>
