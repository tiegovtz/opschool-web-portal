import { computed } from "vue";
import { storeToRefs } from "pinia";
import { useAuthStore } from "~/stores/auth";

export function useBackendAuth() {
  const authStore = useAuthStore();
  const { token } = storeToRefs(authStore);

  return {
    token,
    isAuthenticated: computed(() => authStore.isAuthenticated),
  };
}
