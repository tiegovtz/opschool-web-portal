<script setup lang="ts">
import { computed, ref } from "vue";

type PlaceValueBlocksProps = {
  maxNumber?: number;
};

const props = withDefaults(defineProps<PlaceValueBlocksProps>(), {
  maxNumber: 9999,
});
const ui = useActivityUiText();
const activityInstructionsId = "numbers-place-values-instructions";
const activityStatusId = "numbers-place-values-status";
const keyboardStatusMessage = ref("");

const inputValue = ref("");
const currentNumber = ref(0);
const currentQuestion = ref(1);
const totalQuestions = 10;

const getPlaceValues = (num: number) => ({
  thousands: Math.floor(num / 1000),
  hundreds: Math.floor((num % 1000) / 100),
  tens: Math.floor((num % 100) / 10),
  ones: num % 10,
});

const placeValues = computed(() => getPlaceValues(currentNumber.value));

const handleSubmit = () => {
  const num = Number.parseInt(inputValue.value, 10);
  if (!Number.isNaN(num) && num >= 0 && num <= props.maxNumber) {
    currentNumber.value = num;
    keyboardStatusMessage.value = ui.formatActivityUpdated(
      ui.isSwahili.value ? "Vitalu vya thamani ya nafasi" : "Place value blocks",
      num,
    );
  }
};

const handleNextQuestion = () => {
  const randomNum = Math.floor(Math.random() * (props.maxNumber + 1));
  currentNumber.value = randomNum;
  inputValue.value = "";
  currentQuestion.value = currentQuestion.value < totalQuestions ? currentQuestion.value + 1 : 1;
  keyboardStatusMessage.value = ui.formatActivityUpdated(ui.nextQuestion.value, randomNum);
};

const cubeWrapperStyle = (size: number) =>
  ({
    width: `${size}px`,
    height: `${size}px`,
    margin: "8px",
    display: "inline-block",
    position: "relative",
    transformStyle: "preserve-3d",
    transform: "rotateX(-10deg) rotateY(-10deg)",
  }) as const;

const faceStyle = (size: number, color: string, transform: string, filter?: string) =>
  ({
    position: "absolute",
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: color,
    border: "1px solid rgba(0,0,0,0.2)",
    transform,
    ...(filter ? { filter } : {}),
  }) as const;

const renderCube = (size: number, color: string) => ({
  size,
  color,
  faces: [
    { transform: `translateZ(${size / 2}px)` },
    { transform: `translateZ(-${size / 2}px) rotateY(180deg)` },
    { transform: `rotateY(90deg) translateZ(${size / 2}px)`, filter: "brightness(0.7)" },
    { transform: `rotateY(-90deg) translateZ(${size / 2}px)`, filter: "brightness(0.7)" },
    { transform: `rotateX(90deg) translateZ(${size / 2}px)`, filter: "brightness(1.2)" },
    { transform: `rotateX(-90deg) translateZ(${size / 2}px)`, filter: "brightness(0.5)" },
  ],
});

const THOUSAND = computed(() => renderCube(100, "#f59e0b"));
const HUNDRED = computed(() => renderCube(60, "#10b981"));
const TEN = computed(() => renderCube(40, "#3b82f6"));
const ONE = computed(() => renderCube(25, "#ef4444"));
</script>

<template>
  <section
    class="w-full max-w-6xl mx-auto p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-lg"
    aria-labelledby="numbers-place-values-title"
    :aria-describedby="activityInstructionsId"
  >
    <h2 id="numbers-place-values-title" class="text-3xl font-bold text-center mb-8 text-blue-900">
      Place Value Blocks
    </h2>
    <p :id="activityInstructionsId" class="sr-only">
      {{
        ui.isSwahili
          ? "Tumia tab kusogea kwenye kisanduku cha namba, kitufe cha kuonyesha vitalu, na kitufe cha swali linalofuata."
          : "Use Tab to move through the number field, the show blocks button, and the next question button."
      }}
    </p>
    <p :id="activityStatusId" class="sr-only" aria-live="polite">
      {{ keyboardStatusMessage }}
    </p>

    <div class="bg-white rounded-lg p-6 mb-6 shadow-inner">
      <div class="flex gap-6 mb-8">
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Thousands</h3>
          <div class="grid grid-cols-3 gap-10 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.thousands" :key="`t-${i}`">
              <div :style="cubeWrapperStyle(THOUSAND.size)">
                <div
                  v-for="(f, idx) in THOUSAND.faces"
                  :key="idx"
                  :style="faceStyle(THOUSAND.size, THOUSAND.color, f.transform, f.filter)"
                />
              </div>
            </div>
            <div v-if="placeValues.thousands === 0" class="col-span-3 flex items-center justify-center h-full text-gray-400 italic">
              No thousands
            </div>
          </div>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Hundreds</h3>
          <div class="grid grid-cols-3 gap-4 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.hundreds" :key="`h-${i}`">
              <div :style="cubeWrapperStyle(HUNDRED.size)">
                <div
                  v-for="(f, idx) in HUNDRED.faces"
                  :key="idx"
                  :style="faceStyle(HUNDRED.size, HUNDRED.color, f.transform, f.filter)"
                />
              </div>
            </div>
            <div v-if="placeValues.hundreds === 0" class="col-span-3 flex items-center justify-center h-full text-gray-400 italic">
              No hundreds
            </div>
          </div>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Tens</h3>
          <div class="grid grid-cols-2 gap-3 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.tens" :key="`te-${i}`">
              <div :style="cubeWrapperStyle(TEN.size)">
                <div
                  v-for="(f, idx) in TEN.faces"
                  :key="idx"
                  :style="faceStyle(TEN.size, TEN.color, f.transform, f.filter)"
                />
              </div>
            </div>
            <div v-if="placeValues.tens === 0" class="col-span-4 flex items-center justify-center h-full text-gray-400 italic">
              No tens
            </div>
          </div>
        </div>

        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Ones</h3>
          <div class="grid grid-cols-1 gap-2 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.ones" :key="`o-${i}`">
              <div :style="cubeWrapperStyle(ONE.size)">
                <div
                  v-for="(f, idx) in ONE.faces"
                  :key="idx"
                  :style="faceStyle(ONE.size, ONE.color, f.transform, f.filter)"
                />
              </div>
            </div>
            <div v-if="placeValues.ones === 0" class="col-span-5 flex items-center justify-center h-full text-gray-400 italic">
              No ones
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-gray-50 rounded-lg p-6">
      <p class="text-lg font-medium mb-4 text-gray-700">Write the complete number:</p>
      <div class="flex gap-4 items-center mb-6">
        <input
          type="number"
          min="0"
          :max="props.maxNumber"
          :value="inputValue"
          placeholder="Enter the number"
          :aria-label="ui.isSwahili ? 'Weka namba ya kuonyesha vitalu vya thamani ya nafasi' : 'Enter a number to display place value blocks'"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
          class="px-4 py-2 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 w-48"
          @input="(e) => (inputValue = (e.target as HTMLInputElement).value)"
          @keypress="(e) => (e.key === 'Enter' ? handleSubmit() : null)"
        />
        <button
          class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
          @click="handleSubmit"
        >
          Show Blocks
        </button>
      </div>

      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">{{ currentQuestion }} of {{ totalQuestions }} questions</p>
        <button
          class="px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
          @click="handleNextQuestion"
        >
          {{ ui.nextQuestion }}
        </button>
      </div>

      <div class="flex gap-2 mt-4 justify-center">
        <button
          v-for="i in totalQuestions"
          :key="i"
          class="w-10 h-10 rounded-lg font-medium transition-colors"
          :aria-describedby="`${activityInstructionsId} ${activityStatusId}`"
          :class="
            currentQuestion === i
              ? 'bg-blue-500 text-white border-2 border-blue-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          "
          @click="currentQuestion = i"
        >
          {{ i }}
        </button>
      </div>
    </div>

    <div v-if="currentNumber > 0" class="mt-6 p-4 bg-blue-50 rounded-lg text-center">
      <p class="text-xl font-semibold text-blue-900">
        {{ currentNumber }} =
        <span v-if="placeValues.thousands > 0">
          {{ placeValues.thousands }} thousand{{ placeValues.thousands > 1 ? "s" : "" }}
        </span>
        <span
          v-if="
            placeValues.thousands > 0 &&
            (placeValues.hundreds > 0 || placeValues.tens > 0 || placeValues.ones > 0)
          "
        >
          +</span
        >
        <span v-if="placeValues.hundreds > 0">
          {{ placeValues.hundreds }} hundred{{ placeValues.hundreds > 1 ? "s" : "" }}
        </span>
        <span v-if="placeValues.hundreds > 0 && (placeValues.tens > 0 || placeValues.ones > 0)"> + </span>
        <span v-if="placeValues.tens > 0">
          {{ placeValues.tens }} ten{{ placeValues.tens > 1 ? "s" : "" }}
        </span>
        <span v-if="placeValues.tens > 0 && placeValues.ones > 0"> + </span>
        <span v-if="placeValues.ones > 0">
          {{ placeValues.ones }} one{{ placeValues.ones > 1 ? "s" : "" }}
        </span>
      </p>
    </div>
  </section>
</template>
