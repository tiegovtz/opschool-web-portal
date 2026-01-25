import apiDocs from '~/utilities/apiDocs'
import { webVisitor } from '~/utilities/platform'

export default defineNuxtPlugin(() => {
  const userToken = useCookie('signInUserToken')
  const accessToken = useCookie('signInAccessToken')

  const userTimeSpent = ref(0)
  const isUserActive = ref(false)

  let activityInterval: number | undefined
  let timeTick: number | undefined
  let userInactiveTimeout: number | undefined

  const updateTimeSpent = async () => {
    if (!userToken.value || userTimeSpent.value <= 0) return

    try {
      await $fetch(apiDocs.auth.updateTimeSpent, {
        method: 'PATCH',
        body: { duration: userTimeSpent.value },
        headers: {
          Authorization: `Bearer ${accessToken.value}`,
          'Content-Type': 'application/json'
        }
      })
      userTimeSpent.value = 0
    } catch (err) {
      console.error('updateTimeSpent failed:', err)
    }
  }

  const activityHandler = () => {
    isUserActive.value = true
    clearTimeout(userInactiveTimeout)

    userInactiveTimeout = window.setTimeout(() => {
      isUserActive.value = false
    }, 120000)
  }

  const handleVisibilityChange = () => {
    if (document.visibilityState === 'hidden') {
      updateTimeSpent()
      isUserActive.value = false
    }
  }

  const events = ['mousemove', 'keypress', 'click', 'scroll']

  //  INIT
  events.forEach(e => window.addEventListener(e, activityHandler))
  document.addEventListener('visibilitychange', handleVisibilityChange)

  timeTick = window.setInterval(() => {
    if (
      userToken.value &&
      isUserActive.value &&
      document.visibilityState === 'visible'
    ) {
      userTimeSpent.value += 1000
    }
  }, 1000)

  activityInterval = window.setInterval(() => {
    if (userToken.value && isUserActive.value && userTimeSpent.value > 0) {
      updateTimeSpent()
    }
  }, 120000)

  // Log visitor info on first load
  webVisitor()

  // CLEANUP (page reload / HMR)
  window.addEventListener('beforeunload', () => {
    updateTimeSpent()
    clearInterval(timeTick)
    clearInterval(activityInterval)
    clearTimeout(userInactiveTimeout)

    events.forEach(e => window.removeEventListener(e, activityHandler))
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  })
})
