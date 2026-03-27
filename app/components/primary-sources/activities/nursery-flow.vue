<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import {
  Book,
  Palette,
  Music,
  Calculator,
  Globe,
  Heart,
  ArrowLeft,
} from "lucide-vue-next";
import { cn } from "@/lib/utils";
import {
  useSubjects,
  useTopics,
} from "@/shared/services/activities-search-filters";
import { Button } from "@/components/ui/button";

type NurseryFlowProps = {
  onTopicSelect: (topicId: number, subjectId: string) => void;
};

const props = defineProps<NurseryFlowProps>();
const router = useRouter();
const route = useRoute();
const topicsRef = ref<HTMLElement | null>(null);

const subjectIcons = {
  1: Book,
  2: Calculator,
  3: Globe,
  4: Palette,
  5: Music,
  6: Heart,
};

const subjectColors = {
  1: {
    bg: "from-blue-400 to-blue-600",
    text: "text-white",
    bottomColor: "bg-blue-600",
  },
  2: {
    bg: "from-green-400 to-green-600",
    text: "text-white",
    bottomColor: "bg-green-600",
  },
  3: {
    bg: "from-purple-400 to-purple-600",
    text: "text-white",
    bottomColor: "bg-purple-600",
  },
  4: {
    bg: "from-pink-400 to-pink-600",
    text: "text-white",
    bottomColor: "bg-pink-600",
  },
  5: {
    bg: "from-orange-400 to-orange-600",
    text: "text-white",
    bottomColor: "bg-orange-600",
  },
  6: {
    bg: "from-yellow-400 to-yellow-600",
    text: "text-white",
    bottomColor: "bg-yellow-600",
  },
};

const selectedSubject = computed(() => {
  const value = Number(route.query.subject || "");
  return Number.isFinite(value) && value > 0 ? value : null;
});

const curriculum = computed(() => String(route.query.curc || "TET"));

const { subjects, subjectsLoading } = useSubjects(curriculum.value, 16);
const { topics, topicsLoading } = useTopics(
  curriculum.value,
  selectedSubject.value || undefined,
  16,
);

watch(
  [selectedSubject, topicsLoading],
  async ([subjectId, loading]) => {
    if (!subjectId || loading) return;
    await nextTick();
    topicsRef.value?.scrollIntoView({ behavior: "smooth", block: "start" });
  },
);

const getSubjectColor = (subjectIndex: number) =>
  subjectColors[subjectIndex as keyof typeof subjectColors] || subjectColors[1];

const getSubjectIcon = (subjectId: number) =>
  subjectIcons[subjectId as keyof typeof subjectIcons] || Book;

const updateQuery = async (nextQuery: Record<string, string | undefined>) => {
  await navigateTo({
    path: route.path,
    query: {
      ...route.query,
      ...nextQuery,
    },
  });
};

const handleSubjectSelect = async (subjectId: number) => {
  if (selectedSubject.value === subjectId) {
    await updateQuery({ subject: undefined, topic: undefined });
    return;
  }

  await updateQuery({ subject: String(subjectId), topic: undefined });
};

const handleTopicSelect = (topicId: number, subjectId: string) => {
  props.onTopicSelect(topicId, subjectId);
};

const backHref = computed(
  () => `/activities${route.query.curc ? `?curc=${encodeURIComponent(String(route.query.curc))}` : ""}`,
);
</script>

<template>
  <div class="min-h-screen">
    <div class="mb-6 flex flex-col gap-5 py-6 md:flex-row md:items-center md:gap-0">
      <Button :href="backHref" class="w-fit">
        <ArrowLeft :size="16" class="mr-1" />
        Back
      </Button>

      <div class="flex-1 md:text-center">
        <h1 class="text-3xl font-bold text-picton-blue-900 md:text-4xl">
          Choose Subject!
        </h1>
      </div>
    </div>

    <div class="md:px-4">
      <div v-if="subjectsLoading" class="flex h-64 items-center justify-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-picton-blue-500 border-r-transparent" />
      </div>

      <div v-else class="mx-auto max-w-7xl">
        <div class="mb-8">
          <div class="flex flex-wrap justify-center gap-4">
            <button
              v-for="(subject, index) in subjects"
              :key="subject.id"
              type="button"
              class="group"
              @click="handleSubjectSelect(subject.id)"
            >
              <div
                :class="
                  cn(
                    'relative h-32 w-56 overflow-visible rounded-2xl bg-gradient-to-b shadow-lg transition-all duration-300 hover:shadow-xl',
                    getSubjectColor(index + 1).bg,
                    selectedSubject === subject.id ? 'md:rounded-b-none' : '',
                  )
                "
              >
                <div class="relative flex h-full flex-col items-center justify-center p-4 text-center">
                  <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/30">
                    <component :is="getSubjectIcon(subject.id)" :size="20" :class="getSubjectColor(index + 1).text" />
                  </div>
                  <h3 :class="cn('font-bold transition-transform duration-300 group-hover:scale-105', getSubjectColor(index + 1).text)">
                    {{ subject.subjectName }}
                  </h3>
                </div>

                <div
                  v-if="selectedSubject === subject.id"
                  :class="cn('absolute left-0 top-full hidden h-8 w-full md:block', getSubjectColor(index + 1).bottomColor)"
                />
              </div>
            </button>
          </div>
        </div>

        <Transition name="fade">
          <div v-if="selectedSubject && subjects.length" ref="topicsRef" class="overflow-hidden">
            <div
              :class="
                cn(
                  'rounded-3xl p-4 shadow-2xl md:p-8',
                  getSubjectColor(subjects.findIndex((item) => item.id === selectedSubject) + 1).bottomColor,
                )
              "
            >
              <div v-if="topicsLoading" class="flex h-64 items-center justify-center">
                <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-white border-r-transparent" />
              </div>

              <div v-else-if="topics.length === 0" class="py-12 text-center">
                <h3 class="mb-2 text-xl font-bold text-white">No Topics Available</h3>
                <p class="text-white/80">Please select a different subject to see topics</p>
              </div>

              <div v-else class="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <button
                  v-for="topic in topics"
                  :key="topic.id"
                  type="button"
                  class="group"
                  @click="handleTopicSelect(topic.id, String(selectedSubject || 1))"
                >
                  <div class="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-white/95 p-3 shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
                    <h4 class="px-2 text-center text-lg font-bold leading-tight">
                      {{ topic.topicName }}
                    </h4>

                    <div class="pointer-events-none absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.35s ease, transform 0.35s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
