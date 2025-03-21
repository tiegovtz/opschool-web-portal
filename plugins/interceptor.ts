import { $fetch as $fetchType } from 'ofetch';
import apiDocs from "~/utilities/api-docs";

interface FetchOptions {
  headers?: Record<string, string>;
  method?: string;
  body?: any;
}

interface FetchError {
  response?: {
    status: number;
  };
}

export default defineNuxtPlugin((nuxtApp) => {
  // Set up interceptor for API requests
  const { $fetch } = useNuxtApp();
  const typedFetch = $fetch as typeof $fetchType;
  
  // Create a custom fetch instance with interceptors
  const customFetch = async (url: string, options: FetchOptions = {}) => {
    const accessToken = useCookie("signInAccessToken");
    
    // Add token to request if available
    if (accessToken.value) {
      options.headers = {
        ...options.headers,
        Authorization: `Bearer ${accessToken.value}`
      };
    }
    
    try {
      // Attempt the original request
      return await typedFetch(url, options);
    } catch (error: unknown) {
      const fetchError = error as FetchError;
      if (fetchError?.response?.status === 401 && accessToken.value) {
        // Check if token is expired
        if (isTokenExpired(accessToken.value)) {
          // Try to refresh the token
          const newToken = await refreshAuthToken();
          
          if (newToken) {
            // Update token in cookie
            accessToken.value = newToken;
            
            // Retry the original request with new token
            options.headers = {
              ...options.headers,
              Authorization: `Bearer ${newToken}`
            };
            
            // Retry the original request
            return await typedFetch(url, options);
          }
        }
      }
      
      // If we can't refresh or request still fails, throw the error
      throw error;
    }
  };

  // Provide the custom fetch to the app
  nuxtApp.provide('apiFetch', customFetch);
  
  // Handle initial token validation on app load
  nuxtApp.hooks.hook("app:created", async () => {
    const token = useCookie("signInAccessToken");
    
    if (token.value && isTokenExpired(token.value)) {
      const newToken = await refreshAuthToken();
      if (newToken) {
        token.value = newToken;
      } else {
        // If refresh fails, clear tokens (logout)
        const refreshToken = useCookie("signInRefreshToken");
        token.value = null;
        refreshToken.value = null;
        
        // Redirect to login if needed
        if (process.client) {
          navigateTo('/login'); // Adjust path as needed
        }
      }
    }
  });

  // Function to check if token is expired
  function isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.exp * 1000 < Date.now();
    } catch (error) {
      return true;
    }
  }

  // Function to refresh the token
  async function refreshAuthToken() {
    try {
      const refreshToken = useCookie("signInRefreshToken");
      
      if (!refreshToken.value) {
        return null;
      }
      
      const response = await typedFetch(apiDocs.auth.refreshToken, {
        method: "POST",
        body: { 
          refresh_token: refreshToken.value 
        },
        headers: { "Content-Type": "application/json" },
      });
      
      return response?.accessToken || null;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return null;
    }
  }
});