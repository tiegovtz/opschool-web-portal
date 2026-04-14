<script setup lang="ts">
import { computed } from "vue";
import { storeToRefs } from "pinia";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/auth";

type Props = {
  activityId: string;
  queryParams?: string;
  href?: string;
  variant?: "default" | "brand" | "brand-lemon" | "destructive" | "outline-brand" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  class?: string;
  className?: string;
};

const props = defineProps<Props>();
const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);

const resolvedHref = computed(() => {
  const target = `/activities/${props.activityId}${props.queryParams ? `?${props.queryParams}` : ""}`;
  return isAuthenticated.value ? target : `/login?redirectTo=${encodeURIComponent(target)}`;
});
</script>

<template>
  <Button
    :href="resolvedHref"
    :variant="props.variant"
    :size="props.size"
    :class="props.class"
    :class-name="props.className"
    :aria-label="isAuthenticated ? 'Start activity' : 'Log in to start activity'"
  >
    <slot />
  </Button>
</template>
