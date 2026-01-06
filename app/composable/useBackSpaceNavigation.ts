export const useBackSpaceNavigation = () => {
    const router = useRouter();

    const handler = (event: KeyboardEvent) => {
    if (event.key !== 'Backspace') return

    const target = event.target as HTMLElement

    const isTyping =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable

    if (!isTyping) {
      event.preventDefault()
      router.back()
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handler)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handler)
  })
}