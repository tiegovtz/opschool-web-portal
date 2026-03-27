<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { cn, getImageUrl, shuffle } from "@/lib/utils";
import ActivityTitle from "@/components/templates/activity-title";
import ActivityResults, {
  ActivityResultsAlertDialog,
} from "@/components/templates/results";
// import { useSoundEffects } from "@/shared/hooks/use-sound-effects";
import { useObjects } from "@/hooks/useObjects";
import GameModeWrapper from "@/components/ui/game-mode/game-mode-wrapper";

interface MatchingItem {
  id: string;
  content: string | { color: string } | { imageSrc: string };
}

type Props = {
  questions: {
    title: string;
    fontSize?: string;
    category: "text-to-text" | "image-to-text" | "image-to-image";
    leftItems: MatchingItem[];
    rightItems: MatchingItem[];
    isGameMode?: boolean;
    type?: string;
    gameTimeLimit?: number;
    useStrict?: boolean;
  };
};

const props = defineProps<Props>();
const { playSound } = useSoundEffects();

const completedObjectIds = ref<number[]>([]);
const { objects, loading, error, refetch } = useObjects({
  type: props.questions.isGameMode ? props.questions.type || null : null,
  limit: 6,
  autoFetch: !!props.questions.isGameMode,
});

const selectedRightId = ref<string | null>(null);
const answers = ref<Record<string, string>>({});
const score = ref(0);
const allAnswered = ref(false);
const showResults = ref(false);
const timeUp = ref(false);
const isResetting = ref(false);
const completedPairs = ref(new Set<number>());
const incorrectAttempts = ref(new Set<number>());
const shuffledRightItems = ref<MatchingItem[]>([]);

const getGameItems = () => {
  if (!props.questions.isGameMode) {
    return {
      leftItems: props.questions.leftItems,
      rightItems: props.questions.rightItems,
    };
  }

  if (props.questions.category === "image-to-text") {
    return {
      leftItems: objects.value.map((obj) => ({
        id: String(obj.id),
        content: { imageSrc: getImageUrl(obj.imagePath, true) },
      })),
      rightItems: objects.value.map((obj) => ({
        id: String(obj.id),
        content: obj.syllables || obj.name,
      })),
    };
  }

  return {
    leftItems: objects.value.map((obj) => ({
      id: String(obj.id),
      content: obj.name,
    })),
    rightItems: objects.value.map((obj) => ({
      id: String(obj.id),
      content: obj.syllables || obj.name,
    })),
  };
};

const leftItems = computed(() => getGameItems().leftItems);
const rightItems = computed(() => getGameItems().rightItems);
const totalPairs = computed(() => leftItems.value.length);

watch([leftItems, rightItems, loading], ([left, right, isLoading]) => {
  if (isLoading || !left.length || !right.length) return;
  answers.value = {};
  score.value = 0;
  allAnswered.value = false;
  showResults.value = false;
  timeUp.value = false;
  completedPairs.value = new Set();
  incorrectAttempts.value = new Set();
  selectedRightId.value = null;
  shuffledRightItems.value = shuffle([...right]);
}, { immediate: true });

watch(answers, (value) => {
  if (Object.keys(value).length !== leftItems.value.length || !leftItems.value.length) {
    return;
  }

  let nextScore = 0;
  const nextCompleted = new Set<number>();
  const nextIncorrect = new Set<number>();

  leftItems.value.forEach((item, index) => {
    if (value[item.id] === item.id) {
      nextScore += 1;
      nextCompleted.add(index);
    } else {
      nextIncorrect.add(index);
    }
  });

  score.value = nextScore;
  completedPairs.value = nextCompleted;
  incorrectAttempts.value = nextIncorrect;
  allAnswered.value = true;
  playSound("success");
}, { deep: true });

const assignedRightIds = computed(() => Object.values(answers.value));
const availableRightItems = computed(() =>
  shuffledRightItems.value.filter((item) => !assignedRightIds.value.includes(item.id)),
);

const handleAssign = (leftId: string) => {
  if (!selectedRightId.value || showResults.value || timeUp.value) return;

  const nextAnswers = { ...answers.value };
  Object.entries(nextAnswers).forEach(([currentLeftId, rightId]) => {
    if (rightId === selectedRightId.value) {
      delete nextAnswers[currentLeftId];
    }
  });
  nextAnswers[leftId] = selectedRightId.value;
  answers.value = nextAnswers;
  selectedRightId.value = null;
  playSound("click");
};

const clearAssign = (leftId: string) => {
  if (showResults.value || timeUp.value) return;
  const nextAnswers = { ...answers.value };
  delete nextAnswers[leftId];
  answers.value = nextAnswers;
  playSound("click");
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

const handleRestart = async () => {
  isResetting.value = true;

  if (props.questions.isGameMode) {
    const updatedIds = [...new Set([...completedObjectIds.value, ...objects.value.map((item) => item.id)])];
    completedObjectIds.value = updatedIds;
    await refetch(updatedIds);
  } else {
    answers.value = {};
    selectedRightId.value = null;
    shuffledRightItems.value = shuffle([...props.questions.rightItems]);
    score.value = 0;
    allAnswered.value = false;
    showResults.value = false;
    timeUp.value = false;
    completedPairs.value = new Set();
    incorrectAttempts.value = new Set();
  }

  setTimeout(() => {
    isResetting.value = false;
  }, 100);
};

const renderItemLabel = (item?: MatchingItem | null) => {
  if (!item) return "";
  if (typeof item.content === "string") return item.content;
  if ("imageSrc" in item.content) return item.content.imageSrc;
  return "";
};

const renderItemType = (item?: MatchingItem | null) =>
  !!item && typeof item.content !== "string" && "imageSrc" in item.content ? "image" : "text";

const rightItemById = (id?: string | null) =>
  shuffledRightItems.value.find((item) => item.id === id) || null;
</script>

<template>
  <div v-if="props.questions.isGameMode && loading" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">Loading objects...</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && error" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold text-red-700">Error loading objects: {{ error }}</h1>
  </div>

  <div v-else-if="props.questions.isGameMode && !leftItems.length" class="flex h-full items-center justify-center">
    <h1 class="text-2xl font-bold">No objects found for the specified criteria</h1>
  </div>

  <GameModeWrapper
    v-else
    class="h-full"
    :is-game-mode="!!props.questions.isGameMode"
    :total-questions="totalPairs"
    :completed-questions="completedPairs"
    :incorrect-questions="incorrectAttempts"
    :total-time-limit="props.questions.gameTimeLimit || 300"
    :on-time-up="handleGameTimeUp"
    :on-game-complete="handleGameComplete"
  >
    <div class="flex h-full flex-col">
      <ActivityTitle :title="props.questions.title" />

      <div class="flex flex-1 flex-col gap-4">
        <div class="grid gap-4 rounded-2xl bg-picton-blue-50 p-4 md:grid-cols-[1fr_auto]">
          <div class="space-y-4">
            <div
              v-for="(leftItem, index) in leftItems"
              :key="leftItem.id"
              class="grid items-center gap-4 rounded-xl bg-white p-4 md:grid-cols-[minmax(120px,1fr)_minmax(140px,1fr)]"
              :style="{ fontSize: props.questions.fontSize ? `${props.questions.fontSize}px` : undefined }"
            >
              <div class="flex min-h-20 items-center justify-center rounded-xl bg-picton-blue-100 p-3 text-center">
                <img
                  v-if="renderItemType(leftItem) === 'image'"
                  :src="renderItemLabel(leftItem)"
                  :alt="leftItem.id"
                  class="max-h-24 object-contain"
                >
                <span v-else>{{ renderItemLabel(leftItem) }}</span>
              </div>

              <button
                :class="
                  cn(
                    'flex min-h-20 items-center justify-center rounded-xl border-2 border-dashed p-3 text-center transition',
                    answers[leftItem.id]
                      ? showResults
                        ? answers[leftItem.id] === leftItem.id
                          ? 'border-green-300 bg-green-100 text-green-700'
                          : 'border-red-300 bg-red-100 text-red-700'
                        : 'border-lemon-300 bg-lemon-100 text-lemon-800'
                      : 'border-picton-blue-300 bg-picton-blue-50 text-picton-blue-700',
                  )
                "
                @click="answers[leftItem.id] ? clearAssign(leftItem.id) : handleAssign(leftItem.id)"
              >
                <template v-if="rightItemById(answers[leftItem.id]) as matchedItem">
                  <img
                    v-if="renderItemType(matchedItem) === 'image'"
                    :src="renderItemLabel(matchedItem)"
                    :alt="matchedItem.id"
                    class="max-h-24 object-contain"
                  >
                  <span v-else>{{ renderItemLabel(matchedItem) }}</span>
                </template>
                <span v-else>Select match</span>
              </button>
            </div>
          </div>

          <div v-if="!showResults" class="rounded-2xl bg-white p-4 shadow-sm md:w-[320px]">
            <div class="mb-3 text-sm font-medium text-oceanBlue">Available matches</div>
            <div class="grid gap-3">
              <button
                v-for="item in availableRightItems"
                :key="item.id"
                :class="
                  cn(
                    'flex min-h-20 items-center justify-center rounded-xl bg-picton-blue-100 p-3 text-center transition',
                    selectedRightId === item.id
                      ? 'ring-2 ring-picton-blue-500'
                      : 'hover:bg-picton-blue-200',
                  )
                "
                @click="selectedRightId = selectedRightId === item.id ? null : item.id"
              >
                <img
                  v-if="renderItemType(item) === 'image'"
                  :src="renderItemLabel(item)"
                  :alt="item.id"
                  class="max-h-24 object-contain"
                >
                <span v-else>{{ renderItemLabel(item) }}</span>
              </button>
            </div>
          </div>
        </div>

        <ActivityResults
          v-if="showResults"
          :score="timeUp ? 0 : score"
          :total="totalPairs"
          :on-restart="handleRestart"
        />
      </div>

      <ActivityResultsAlertDialog
        :score="timeUp ? 0 : score"
        :total="totalPairs"
        :open="allAnswered && !isResetting && !showResults"
        :on-open-change="
          (open) => {
            if (open) {
              return;
            }
            showResults = true;
          }
        "
      />
    </div>
  </GameModeWrapper>
</template>
