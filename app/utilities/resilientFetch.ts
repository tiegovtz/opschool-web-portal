// Some browser extensions (video downloaders, certain ad/privacy blockers) monkey-patch
// window.fetch and can throw/break on unrelated API calls, surfacing as "Failed to fetch".
// XMLHttpRequest is a separate API that those hooks typically don't touch, so we fall back
// to it when fetch fails at the network layer (not when the server itself returns an error).
type ResilientFetchOptions = {
  method?: string
  headers?: Record<string, string>
  body?: unknown
}

const isNetworkLevelFailure = (error: unknown): boolean => {
  // ofetch throws FetchError; a network-level failure (never reached the server) has no `.response`.
  if (error && typeof error === 'object' && 'response' in error && (error as any).response) {
    return false
  }
  return true
}

const xhrFetch = <T>(url: string, options: ResilientFetchOptions): Promise<T> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open(options.method || 'GET', url, true)

    Object.entries(options.headers || {}).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value)
    })

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(xhr.responseText ? JSON.parse(xhr.responseText) : (undefined as T))
        } catch {
          resolve(xhr.responseText as unknown as T)
        }
      } else {
        reject(new Error(`Request failed with status ${xhr.status}: ${xhr.responseText}`))
      }
    }

    xhr.onerror = () => reject(new Error('XHR fallback request failed'))

    xhr.send(options.body !== undefined ? JSON.stringify(options.body) : undefined)
  })
}

export const resilientFetch = async <T>(url: string, options: ResilientFetchOptions = {}): Promise<T> => {
  try {
    return await $fetch<T>(url, options as any)
  } catch (error) {
    if (isNetworkLevelFailure(error)) {
      console.warn('[resilientFetch] fetch failed at network layer, retrying via XHR:', url)
      return xhrFetch<T>(url, options)
    }
    throw error
  }
}
