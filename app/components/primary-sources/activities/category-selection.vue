<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type Props = {
  onCategorySelect: (category: "nursery" | "primary" | "secondary") => void;
};

const props = defineProps<Props>();
const ui = useActivityUiText();
const route = useRoute();
const curriculum = computed(() => String(route.query.curc || "").trim());

const categories = [
  {
    id: "nursery" as const,
    title: "Nursery",
    subtitle: "Ages 3-5",
    description: "Fun and colorful learning activities for our youngest learners",
    backgroundImage: "/images/website/nursery.webp",
    cambridgeImage: "/images/website/Cambridge nursery.webp",
    icon: "lucide:baby",
    textColor: "text-white",
  },
  {
    id: "primary" as const,
    title: "Primary",
    subtitle: "Ages 6-11",
    description: "Interactive learning experiences to build strong foundations",
    backgroundImage: "/images/website/primary.webp",
    cambridgeImage: "/images/website/Cambridge primary.webp",
    icon: "lucide:book-open",
    textColor: "text-white",
  },
  {
    id: "secondary" as const,
    title: "Secondary",
    subtitle: "Ages 12+",
    description: "Advanced activities to challenge and engage older students",
    backgroundImage: "/images/website/secondary.webp",
    cambridgeImage: "/images/website/Cambridge secondary.webp",
    icon: "lucide:graduation-cap",
    textColor: "text-white",
  },
];
</script>

<template>
  <div class="container mx-auto px-0 py-6 md:px-4 md:py-12">
    <div class="mb-16 space-y-4">
      <div class="mb-4 flex items-center justify-between">
        <Button href="/" class="w-fit xl:hidden">
          <Icon icon="lucide:arrow-left" width="16" height="16" class="mr-1" />
          {{ ui.back }}
        </Button>

        <div
          v-if="curriculum"
          class="rounded-full border border-oceanBlue/15 bg-white px-4 py-2 text-sm text-oceanBlue shadow-sm"
        >
          {{ curriculum }}
        </div>
      </div>

      <h1 class="mb-4 text-center text-4xl font-bold text-picton-blue-900 md:text-6xl">
        Choose Your Learning Level
      </h1>
      <p
        class="mx-auto max-w-2xl text-center text-lg text-picton-blue-600 md:text-xl"
        style="font-family: var(--font-shaky-hand-some-comic)"
      >
        Select the category that matches your age group for the best learning experience
      </p>
    </div>

    <div class="mx-auto grid max-w-7xl grid-cols-1 gap-8 md:grid-cols-3">
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        :aria-label="`${category.title}. ${category.description}`"
        class="group cursor-pointer text-left transition-transform duration-300 hover:-translate-y-2 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oceanBlue/60 focus-visible:ring-offset-2"
        @click="props.onCategorySelect(category.id)"
      >
        <div class="relative h-96 overflow-hidden rounded-3xl shadow-2xl transition-all duration-500 group-hover:shadow-[0_25px_60px_rgba(15,76,129,0.18)]">
          <div class="absolute inset-0 opacity-70">
            <NuxtImg
              :src="curriculum === 'Cambridge' ? category.cambridgeImage : category.backgroundImage"
              :alt="category.title"
              class="h-full w-full object-cover object-center"
            />
          </div>

          <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-black/30" />

          <div class="relative flex h-full flex-col justify-between p-8">
            <div class="self-start">
              <div class="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30">
                <Icon :icon="category.icon" width="32" height="32" :class="category.textColor" />
              </div>
            </div>

            <div class="space-y-3">
              <div>
                <h3 :class="cn('mb-2 text-3xl font-bold transition-transform duration-300 group-hover:scale-105', category.textColor)">
                  {{ category.title }}
                </h3>
                <p :class="cn('text-lg font-medium opacity-90', category.textColor)">
                  {{ category.subtitle }}
                </p>
              </div>

              <p :class="cn('text-sm leading-relaxed opacity-80', category.textColor)">
                {{ category.description }}
              </p>

              <div class="flex items-center space-x-2 pt-4">
                <span :class="cn('text-sm font-semibold', category.textColor)">Start Learning</span>
                <Icon icon="lucide:arrow-right" width="16" height="16" :class="cn(category.textColor, 'transition-transform duration-300 group-hover:translate-x-1')" aria-hidden="true" />
              </div>
            </div>
          </div>

          <div class="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
            <div class="absolute inset-0 -skew-x-12 transform bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] transition-transform duration-1000 ease-out group-hover:translate-x-[200%]" />
          </div>
        </div>
      </button>
    </div>
  </div>
</template>
