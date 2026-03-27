// useIsMobile.ts
import { ref, onMounted, onUnmounted } from "vue";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const isMobile = ref<boolean>(false);

  const updateIsMobile = () => {
    isMobile.value = window.innerWidth < MOBILE_BREAKPOINT;
  };

  onMounted(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", updateIsMobile);
    updateIsMobile();

    onUnmounted(() => {
      mql.removeEventListener("change", updateIsMobile);
    });
  });

  return isMobile;
}
