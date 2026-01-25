export function useGlobalFocus() {
  const route = useRoute()

  const focusMainIfNeeded = () => {
    requestAnimationFrame(() => {
      const main = document.getElementById('main-content')
      if (!main) return

      const active = document.activeElement

      // If user is already navigating inside main, do nothing
      if (main.contains(active)) return

      main.focus()
    })
  }

  // On page navigation
  watch(
    () => route.fullPath,
    (newPath, oldPath) => {
      if (newPath === oldPath) return
      focusMainIfNeeded()
    }
  )

  // Initial load
  onMounted(() => {
    focusMainIfNeeded()
  })
}
