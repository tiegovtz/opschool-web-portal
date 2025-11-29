<template>
  <div class="relative flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-sm transition-colors dark:bg-slate-900" style="height: 90vh; min-height: 600px;">
    <!-- ChatKit Component -->
    <div v-if="chatkitReady && !blockingError && chatkitControl" class="relative w-full h-full" style="height: 100%; min-height: 600px;">
      <openai-chatkit
        :key="widgetInstanceKey"
        :control="chatkitControl"
        class="block w-full h-full"
        ref="chatkitElement"
        style="height: 100%; min-height: 600px; width: 100%; display: block !important; visibility: visible !important; opacity: 1 !important;"
        @error="handleComponentError"
      />
      <!-- Show loading overlay while initializing session (only show briefly) -->
      <transition name="fade">
        <div v-if="isInitializingSession" class="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10 pointer-events-none">
          <div class="text-center">
            <p class="text-gray-600">Initializing chat session...</p>
            <p class="text-xs text-gray-400 mt-2">This may take a few seconds</p>
          </div>
        </div>
      </transition>
      <!-- Fallback if component doesn't render -->
      <div v-if="!isInitializingSession && showFallback" class="absolute inset-0 flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 z-20">
        <div class="text-center p-8">
          <p class="text-red-600 mb-2">Chat component failed to load</p>
          <p class="text-sm text-gray-500 mb-4">Check console for errors</p>
          <button
            @click="handleResetChat"
            class="px-4 py-2 bg-oceanBlue text-white rounded-md hover:bg-deepBlue transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
      
      <!-- Debug overlay - remove in production -->
      <div v-if="isDev && !isInitializingSession && !showFallback" class="absolute top-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-30">
        <p>Component rendered</p>
        <p>Control: {{ chatkitControl ? 'Yes' : 'No' }}</p>
      </div>
    </div>
    
    <!-- Error/Loading State -->
    <div
      v-else
      class="flex w-full items-center justify-center"
      style="height: 100%; min-height: 600px;"
    >
      <div class="text-center p-8">
        <p v-if="blockingError" class="text-red-600 mb-4">
          {{ blockingError }}
        </p>
        <p v-else class="text-gray-600">
          Loading assistant session...
        </p>
        <button
          v-if="blockingError && retryable"
          @click="handleResetChat"
          class="mt-4 px-4 py-2 bg-oceanBlue text-white rounded-md hover:bg-deepBlue transition-colors"
        >
          Restart chat
        </button>
        <div class="mt-4 text-sm text-gray-500 space-y-1">
          <p>Debug: scriptStatus={{ scriptStatus }}</p>
          <p>Debug: chatkitReady={{ chatkitReady }}</p>
          <p>Debug: hasControl={{ !!chatkitControl }}</p>
          <p>Debug: workflowConfigured={{ isWorkflowConfigured }}</p>
          <p>Debug: isInitializingSession={{ isInitializingSession }}</p>
          <p>Debug: blockingError={{ blockingError || 'none' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useChatKit } from '~/composable/useChatKit';
import { CHATKIT_CONFIG, getThemeConfig } from '~/composable/useChatKitConfig';

interface ChatKitControl {
  getClientSecret: (currentSecret: string | null) => Promise<string>;
  theme?: {
    colorScheme?: 'light' | 'dark';
    color?: {
      grayscale?: {
        hue?: number;
        tint?: number;
        shade?: number;
      };
      accent?: {
        primary?: string;
        level?: number;
      };
    };
    radius?: string;
  };
  startScreen?: {
    greeting?: string;
    prompts?: Array<{
      label: string;
      prompt: string;
      icon?: string;
    }>;
  };
  composer?: {
    placeholder?: string;
    attachments?: {
      enabled?: boolean;
    };
  };
  threadItemActions?: {
    feedback?: boolean;
  };
  onClientTool?: (invocation: { name: string; params: Record<string, unknown> }) => Promise<{ success: boolean }>;
  onResponseEnd?: () => void;
  onResponseStart?: () => void;
  onThreadChange?: () => void;
  onError?: (data: { error: unknown }) => void;
}

const { getClientSecret: getClientSecretFromComposable, isWorkflowConfigured } = useChatKit();

const isDev = import.meta.dev;
const chatkitControl = ref<ChatKitControl | null>(null);
const chatkitReady = ref(false);
const isInitializingSession = ref(true);
const scriptStatus = ref<'pending' | 'ready' | 'error'>('pending');
const widgetInstanceKey = ref(0);
const chatkitElement = ref<HTMLElement | null>(null);
const showFallback = ref(false);
const errorState = ref({
  script: null as string | null,
  session: null as string | null,
  integration: null as string | null,
  retryable: false,
});

const handleComponentError = (event: Event) => {
  console.error('[ChatKitPanel] Component error', event);
  showFallback.value = true;
  setErrorState({ integration: 'Chat component encountered an error', retryable: true });
};

const blockingError = computed(() => {
  return errorState.value.script || errorState.value.session || errorState.value.integration;
});

const retryable = computed(() => errorState.value.retryable);

const setErrorState = (updates: Partial<typeof errorState.value>) => {
  errorState.value = { ...errorState.value, ...updates };
};

const handleScriptLoaded = () => {
  scriptStatus.value = 'ready';
  setErrorState({ script: null });
};

const handleScriptError = (event: Event) => {
  console.error('Failed to load chatkit.js', event);
  scriptStatus.value = 'error';
  const detail = (event as CustomEvent<unknown>)?.detail ?? 'unknown error';
  setErrorState({ script: `Error: ${String(detail)}`, retryable: false });
  isInitializingSession.value = false;
};

const initializeChatKit = () => {
  if (import.meta.client) {
    console.log('[ChatKitPanel] Initializing ChatKit...', {
      scriptStatus: scriptStatus.value,
      hasCustomElement: !!window.customElements?.get('openai-chatkit'),
      workflowConfigured: isWorkflowConfigured.value,
    });
    
    // Wait a bit for the web component to be fully ready
    setTimeout(() => {
      if (!chatkitControl.value) {
        console.warn('[ChatKitPanel] Control not initialized, retrying...');
      }
    }, 1000);
  }

  try {
    const theme = 'light'; // You can make this dynamic based on user preference
    
    chatkitControl.value = {
      // API configuration
      getClientSecret: async (currentSecret: string | null) => {
      console.log('[ChatKitPanel] getClientSecret called', { hasCurrentSecret: !!currentSecret });
      // Only show loading overlay for new sessions
      if (!currentSecret) {
        console.log('[ChatKitPanel] Creating new session - showing loading overlay');
        isInitializingSession.value = true;
      }
      setErrorState({ session: null, integration: null, retryable: false });

      try {
        const secret = await getClientSecretFromComposable(currentSecret);
        console.log('[ChatKitPanel] Client secret retrieved successfully');
        setErrorState({ session: null, integration: null });
        // Hide loading overlay immediately after getting secret
        isInitializingSession.value = false;
        return secret;
      } catch (error) {
        console.error('[ChatKitPanel] Failed to get client secret', error);
        const detail = error instanceof Error ? error.message : 'Unable to start ChatKit session.';
        setErrorState({ session: detail, retryable: false });
        isInitializingSession.value = false;
        throw error;
      }
    },
    
    // Theme configuration
    theme: {
      colorScheme: theme,
      ...getThemeConfig(theme),
    },
    
    // Start screen configuration
    startScreen: {
      greeting: CHATKIT_CONFIG.GREETING,
      prompts: CHATKIT_CONFIG.STARTER_PROMPTS,
    },
    
    // Composer configuration
    composer: {
      placeholder: CHATKIT_CONFIG.PLACEHOLDER_INPUT,
      attachments: {
        enabled: true,
      },
    },
    
    // Thread item actions
    threadItemActions: {
      feedback: false,
    },
    
    // Event handlers
    onClientTool: async (invocation: { name: string; params: Record<string, unknown> }) => {
      console.log('[ChatKitPanel] onClientTool', invocation);
      if (invocation.name === 'switch_theme') {
        // Handle theme switching if needed
        return { success: true };
      }
      return { success: false };
    },
    onResponseEnd: () => {
      console.log('[ChatKitPanel] onResponseEnd');
    },
    onResponseStart: () => {
      console.log('[ChatKitPanel] onResponseStart');
      setErrorState({ integration: null, retryable: false });
    },
    onThreadChange: () => {
      console.log('[ChatKitPanel] onThreadChange');
    },
    onError: ({ error }: { error: unknown }) => {
      console.error('[ChatKitPanel] ChatKit error', error);
      setErrorState({ integration: 'An error occurred. Please try again.', retryable: true });
    },
    };
  chatkitReady.value = true;
  showFallback.value = false;
  console.log('[ChatKitPanel] ChatKit initialized', { 
    hasControl: !!chatkitControl.value,
    controlKeys: chatkitControl.value ? Object.keys(chatkitControl.value) : [],
    controlStructure: chatkitControl.value
  });
  
  // Set initializing to false after a short delay to allow component to render
  // The ChatKit component will call getClientSecret when it needs to
  setTimeout(() => {
    if (isInitializingSession.value) {
      console.log('[ChatKitPanel] Setting isInitializingSession to false (timeout - component should render now)');
      isInitializingSession.value = false;
    }
  }, 500);
  
  // Set a timeout to check if component rendered
  if (import.meta.client) {
    setTimeout(() => {
      nextTick(() => {
        const element = chatkitElement.value as any;
        console.log('[ChatKitPanel] Checking component render:', {
          elementExists: !!element,
          hasShadowRoot: element && element.shadowRoot ? true : false,
          isInitializingSession: isInitializingSession.value,
          chatkitReady: chatkitReady.value
        });
        
        if (chatkitReady.value && element) {
          if (!element.shadowRoot) {
            console.warn('[ChatKitPanel] Component may not have rendered properly - no shadow root');
            // Don't show fallback immediately, wait a bit more
            setTimeout(() => {
              if (element && !element.shadowRoot) {
                console.error('[ChatKitPanel] Component still has no shadow root, showing fallback');
                showFallback.value = true;
              }
            }, 2000);
          } else {
            console.log('[ChatKitPanel] Component rendered successfully with shadow root');
            // Component is rendered, make sure initializing is false
            if (isInitializingSession.value) {
              isInitializingSession.value = false;
            }
          }
        }
      });
    }, 2000);
  }
  } catch (error) {
    console.error('[ChatKitPanel] Error initializing ChatKit', error);
    setErrorState({ 
      integration: 'Failed to initialize ChatKit. Please check your configuration.',
      retryable: true 
    });
    chatkitReady.value = false;
  }
};

const handleResetChat = () => {
  showFallback.value = false;
  setErrorState({
    script: null,
    session: null,
    integration: null,
    retryable: false,
  });
  scriptStatus.value = window.customElements?.get('openai-chatkit') ? 'ready' : 'pending';
  isInitializingSession.value = true;
  widgetInstanceKey.value += 1;
  initializeChatKit();
};

onMounted(() => {
  console.log('[ChatKitPanel] Component mounted');
  
  // Check if ChatKit is already loaded
  if (window.customElements?.get('openai-chatkit')) {
    console.log('[ChatKitPanel] ChatKit custom element already registered');
    handleScriptLoaded();
  } else {
    console.log('[ChatKitPanel] Waiting for ChatKit custom element...');
    // Set timeout to check if script loads
    const timeoutId = setTimeout(() => {
      if (!window.customElements?.get('openai-chatkit')) {
        console.error('[ChatKitPanel] ChatKit custom element not found after timeout');
        handleScriptError(new CustomEvent('chatkit-script-error', {
          detail: 'ChatKit web component is unavailable. Verify that the script URL is reachable.',
        }));
      }
    }, 5000);

    onUnmounted(() => {
      clearTimeout(timeoutId);
    });
  }

  // Listen for script load events
  window.addEventListener('chatkit-script-loaded', handleScriptLoaded);
  window.addEventListener('chatkit-script-error', handleScriptError);

  // Check workflow configuration
  if (!isWorkflowConfigured.value) {
    console.warn('[ChatKitPanel] Workflow not configured');
    setErrorState({
      session: 'Set NUXT_PUBLIC_CHATKIT_WORKFLOW_ID in your environment variables.',
      retryable: false,
    });
    isInitializingSession.value = false;
  } else {
    console.log('[ChatKitPanel] Workflow configured:', isWorkflowConfigured.value);
  }
});

watch(scriptStatus, (newStatus) => {
  if (newStatus === 'ready') {
    console.log('[ChatKitPanel] Script status changed to ready, initializing...');
    // Wait a bit for the custom element to be fully registered
    setTimeout(() => {
      initializeChatKit();
    }, 100);
  }
});

// Watch for changes in chatkitReady and chatkitControl to debug
watch([chatkitReady, chatkitControl, blockingError, isInitializingSession], ([ready, control, error, initializing]) => {
  const shouldShow = ready && !error && !!control && !initializing;
  console.log('[ChatKitPanel] State changed:', {
    chatkitReady: ready,
    hasControl: !!control,
    blockingError: error || 'none',
    isInitializingSession: initializing,
    shouldShowComponent: shouldShow,
    nextTick: 'will check DOM'
  });
  
  // Check DOM after Vue updates
  nextTick(() => {
    if (shouldShow && import.meta.client) {
      const element = document.querySelector('openai-chatkit');
      console.log('[ChatKitPanel] DOM check:', {
        elementFound: !!element,
        element: element,
        hasShadowRoot: element && (element as any).shadowRoot ? true : false
      });
    }
  });
});

onUnmounted(() => {
  window.removeEventListener('chatkit-script-loaded', handleScriptLoaded);
  window.removeEventListener('chatkit-script-error', handleScriptError);
});
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* Ensure ChatKit component is visible */
openai-chatkit {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}
</style>
