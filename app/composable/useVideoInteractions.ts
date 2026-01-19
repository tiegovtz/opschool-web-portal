import type { VideoInteraction } from '~/types/interactive-video.interface'
import apiDocs from '~/utilities/apiDocs'

export const useVideoInteractions = (videoId: string | Ref<string> | ComputedRef<string>) => {
  const accessToken = useCookie("signInAccessToken");
  const interactions = ref<VideoInteraction[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const loadInteractions = async () => {
    const id = unref(videoId)
    if (!id) {
      interactions.value = []
      return
    }

    try {
      isLoading.value = true
      error.value = null

      const data = await $fetch<VideoInteraction[]>(
        apiDocs.videos.getVideoInteractionsLoad.replace("{id}", id),
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken.value}`,
          },
        },
      );
      interactions.value = Array.isArray(data) ? data : []
    } catch (err: any) {
      console.error('Error loading interactions:', err)
      error.value = err.message || 'Failed to load interactions'
      interactions.value = []
    } finally {
      isLoading.value = false
    }
  }

  const refresh = async () => {
    await loadInteractions()
  }

  // Auto-load when videoId changes
  watch(() => unref(videoId), (newId) => {
    if (newId) {
      loadInteractions()
    } else {
      interactions.value = []
    }
  }, { immediate: true })

  return {
    interactions: readonly(interactions),
    isLoading: readonly(isLoading),
    error: readonly(error),
    loadInteractions,
    refresh
  }
}













