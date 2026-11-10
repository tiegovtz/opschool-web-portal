import { getVideoPlaybackError } from '~/utilities/videoPlaybackError'

export default defineNuxtPlugin(() => {
  // Parsed chapter HTML is replaced as the learner changes chapters. Capture
  // media errors at the document so newly inserted videos work automatically.
  document.addEventListener('error', async (event) => {
    const video = event.target
    if (!(video instanceof HTMLVideoElement) || !video.matches('[data-stream-video]')) return

    const wrapper = video.closest('.video-container-wrapper')
    const alert = wrapper?.querySelector<HTMLElement>('[data-video-error]')
    const message = alert?.querySelector<HTMLElement>('[data-video-error-message]')
    if (!alert || !message) return

    const source = video.querySelector('source')?.src || video.src
    const errorMessage = await getVideoPlaybackError(source)
    if (!video.isConnected) return

    message.textContent = errorMessage
    video.hidden = true
    alert.hidden = false
  }, true)

  document.addEventListener('click', (event) => {
    const target = event.target
    if (!(target instanceof Element)) return
    const retry = target.closest('[data-video-retry]')
    if (!retry) return

    const wrapper = retry.closest('.video-container-wrapper')
    const video = wrapper?.querySelector<HTMLVideoElement>('[data-stream-video]')
    const alert = wrapper?.querySelector<HTMLElement>('[data-video-error]')
    if (!video || !alert) return

    alert.hidden = true
    video.hidden = false
    video.load()
  })
})
