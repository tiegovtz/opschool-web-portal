/** MediaError does not expose the HTTP status of a failed video request. */
export async function getVideoPlaybackError(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-0' },
      cache: 'no-store',
      credentials: 'include',
    })
    const status = response.status
    void response.body?.cancel().catch(() => {})

    if (status === 404) return 'This video is no longer available.'
    if (status === 401 || status === 403) {
      return 'Your session may have expired. Sign in again to watch this video.'
    }
  } catch {
    // A network or cross-origin failure cannot be classified by status.
  }

  return 'The video could not be loaded. Check your connection and try again.'
}
