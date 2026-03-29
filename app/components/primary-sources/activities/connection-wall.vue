<script setup lang="ts">
// @ts-nocheck
import { computed, ref, watch } from "vue";
import { cn, getImageUrl, shuffle } from "@/lib/utils";
import { ActivityType } from "@/lib/types/activity-types";
import ActivityTitle from "@/components/templates/activity-title";
import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { ActivityResultsAlertDialog } from "@/components/templates/results";
import ActivityResults from "@/components/templates/results";
import { useObjects } from "@/hooks/useObjects";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper.vue";

type TItem = {
  id: number;
  name: string;
  category: string;
  imgSrc?: string | null;
};

type Props = {
  questions: {
    algorithm: ActivityType;
    title: string;
    questions: TItem[];
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    useStrict?: boolean;
    showImages?: boolean;
  };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const completedObjectIds = ref<number[]>([]);
const { objects, loading, error, refetch } = useObjects({
  type: props.questions.isGameMode ? props.questions.type || null : null,
  limit: 12,
  autoFetch: !!props.questions.isGameMode,
});

const gameItems = computed<TItem[]>(() =>
  props.questions.isGameMode
    ? objects.value.map((obj) => ({
        id: obj.id,
        name: obj.name,
        category: obj.category || obj.name,
        imgSrc: props.questions.showImages ? getImageUrl(obj.imagePath, true) : null,
      }))
    : props.questions.questions,
);

const gameComplete = ref(false);
const selectedItems = ref<TItem[]>([]);
const incorrectItems = ref<number[]>([]);
const matchedGroups = ref<TItem[][]>([]);
const remainingItems = ref<TItem[]>([]);
const allAnswered = ref(false);
const showCategories = ref(false);
const timeUp = ref(false);
const isResetting = ref(false);
const completedGroups = ref(new Set<number>());
const incorrectAttempts = ref(new Set<number>());

const numItemsPerGroup = computed(() =>
  props.questions.algorithm === ActivityType.ConnectionWallThreeRows ? 3 : 4,
);
const score = computed(() => matchedGroups.value.length);
const total = computed(() => Math.ceil(gameItems.value.length / numItemsPerGroup.value));
const isActivityDisabled = computed(() => allAnswered.value || timeUp.value || gameComplete.value);

const initializeActivity = () => {
  matchedGroups.value = [];
  selectedItems.value = [];
  incorrectItems.value = [];
  allAnswered.value = false;
  gameComplete.value = false;
  timeUp.value = false;
  isResetting.value = false;
  completedGroups.value = new Set();
  incorrectAttempts.value = new Set();
  showCategories.value = false;
  remainingItems.value = shuffle([...gameItems.value]);
};

watch([gameItems, loading], ([items, isLoading]) => {
  if (isLoading || !items.length) return;
  initializeActivity();
}, { immediate: true });

watch(remainingItems, (value) => {
  if (!value.length && matchedGroups.value.length > 0 && !allAnswered.value) {
    allAnswered.value = true;
    playSound("success");
    completedGroups.value = new Set(Array.from({ length: matchedGroups.value.length }, (_, index) => index));
  }
}, { deep: true });

const handleItemClick = (item: TItem) => {
  if (isActivityDisabled.value || incorrectItems.value.includes(item.id)) return;

  if (selectedItems.value.find((current) => current.id === item.id)) {
    selectedItems.value = selectedItems.value.filter((current) => current.id !== item.id);
    return;
  }

  const nextSelected = [...selectedItems.value, item];
  selectedItems.value = nextSelected;

  if (nextSelected.length < numItemsPerGroup.value) {
    playSound("click");
    return;
  }

  const categories = nextSelected.reduce<Record<string, number>>((acc, current) => {
    acc[current.category] = (acc[current.category] || 0) + 1;
    return acc;
  }, {});

  const matchingCategory = Object.entries(categories).find(
    ([, count]) => count >= numItemsPerGroup.value,
  )?.[0];

  if (matchingCategory) {
    const matchedItems = nextSelected.filter((current) => current.category === matchingCategory);
    matchedGroups.value = [...matchedGroups.value, matchedItems];
    remainingItems.value = remainingItems.value.filter(
      (current) => !matchedItems.some((matched) => matched.id === current.id),
    );
    selectedItems.value = [];
    playSound("correct");
    return;
  }

  incorrectItems.value = nextSelected.map((current) => current.id);
  incorrectAttempts.value = new Set([...incorrectAttempts.value, Date.now()]);
  playSound("failure");

  setTimeout(() => {
    incorrectItems.value = [];
    selectedItems.value = [];
  }, 800);
};

const handleGameTimeUp = () => {
  if (!allAnswered.value && !timeUp.value) {
    timeUp.value = true;
    allAnswered.value = true;
    playSound("failure");
  }
};

const handleGameComplete = () => {
  if (!allAnswered.value && !timeUp.value) {
    allAnswered.value = true;
  }
};

const handleReset = () => {
  isResetting.value = true;
  allAnswered.value = false;
  if (!props.questions.isGameMode || !timeUp.value) {
    showCategories.value = true;
  }
  gameComplete.value = true;

  setTimeout(() => {
    isResetting.value = false;
  }, 50);
};

const handlePlayAgain = async () => {
  isResetting.value = true;

  if (props.questions.isGameMode) {
    const updatedIds = [...new Set([...completedObjectIds.value, ...objects.value.map((item) => item.id)])];
    completedObjectIds.value = updatedIds;
    await refetch(updatedIds);
  } else {
    initializeActivity();
  }

  setTimeout(() => {
    isResetting.value = false;
  }, 100);
};
</script>

<template>
  <div v-if="props.questions.isGameMode && loading" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">Loading objects...</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && error" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold text-red-700">Error loading objects: {{ error }}</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && !gameItems.length" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">No objects found for the specified criteria</h1>
  </div>

  <GameModeWrapper
    v-else
    class="h-full"
    :is-game-mode="!!props.questions.isGameMode"
    :total-questions="total"
    :completed-questions="completedGroups"
    :incorrect-questions="incorrectAttempts"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleGameTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <div class="flex h-full flex-col">
      <ActivityTitle :title="props.questions.title" />

      <div class="rounded-2xl bg-picton-blue-50 p-4">
        <div
          :class="
            cn(
              'grid gap-2 text-sm font-semibold md:text-lg',
              props.questions.algorithm === ActivityType.ConnectionWallThreeRows && !showCategories
                ? 'grid-cols-3'
                : props.questions.algorithm === ActivityType.ConnectionWallThreeRows && showCategories
                  ? 'grid-cols-4'
                  : !showCategories
                    ? 'grid-cols-4'
                    : 'grid-cols-5',
            )
          "
        >
          <template v-for="(group, groupIndex) in matchedGroups" :key="`group-${groupIndex}`">
            <div
              v-for="item in group"
              :key="item.id"
              class="flex min-h-[110px] flex-col items-center justify-center rounded-lg bg-lemon-100 p-2 text-center text-lemon-700 shadow-md"
            >
              <img v-if="item.imgSrc" :src="item.imgSrc" :alt="item.name" class="h-20 w-full object-contain">
              <p>{{ item.name }}</p>
            </div>

            <div
              v-if="showCategories && group[0]"
              class="flex min-h-[110px] items-center justify-center rounded-lg border border-picton-blue-300 bg-picton-blue-100 p-2 text-center font-bold text-picton-blue-800 shadow-md"
            >
              {{ group[0].category }}
            </div>
          </template>

          <button
            v-for="item in remainingItems"
            :key="item.id"
            :class="
              cn(
                'flex min-h-[110px] flex-col items-center justify-center rounded-lg p-2 text-center shadow-md transition hover:shadow-lg',
                incorrectItems.includes(item.id)
                  ? 'animate-pulse bg-red-400 text-white'
                  : selectedItems.some((current) => current.id === item.id)
                    ? 'bg-picton-blue-300'
                    : 'bg-picton-blue-100',
                isActivityDisabled ? 'cursor-not-allowed' : 'cursor-pointer',
              )
            "
            @click="handleItemClick(item)"
          >
            <img v-if="item.imgSrc" :src="item.imgSrc" :alt="item.name" class="h-20 w-full object-contain">
            <p>{{ item.name }}</p>
          </button>
        </div>

        <div v-if="gameComplete" class="mt-4">
          <ActivityResults :score="timeUp ? 0 : score" :total="total" :on-restart="handlePlayAgain" />
        </div>
      </div>

      <ActivityResultsAlertDialog
        :score="timeUp ? 0 : score"
        :total="total"
        :open="allAnswered && !isResetting"
        :on-open-change="
          (open) => {
            if (open) {
              return;
            }
            handleReset();
          }
        "
      />
    </div>
  </GameModeWrapper>
</template>
