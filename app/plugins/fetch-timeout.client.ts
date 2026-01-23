/**
 * Global fetch timeout plugin
 * Adds default timeout to all $fetch calls to prevent infinite loading
 * 
 * Note: This plugin provides a helper, but individual composables should
 * still specify timeouts explicitly for better control.
 */
export default defineNuxtPlugin((nuxtApp) => {
  // Provide a helper function for making API calls with timeout
  return {
    provide: {
      fetchWithTimeout: async (url: string, options: any = {}) => {
        // Set default timeout of 10 seconds if not specified
        if (!options.timeout && !options.signal) {
          options.timeout = 10000; // 10 seconds default
        }
        
        try {
          return await $fetch(url, options);
        } catch (error: any) {
          // Log timeout errors for debugging
          if (error.message?.includes('timeout') || error.name === 'TimeoutError') {
            console.warn(`[Fetch Timeout] Request to ${url} timed out after ${options.timeout || 10000}ms`);
          }
          throw error;
        }
      }
    }
  };
});

