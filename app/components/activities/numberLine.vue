
<script setup lang="ts">
import { ref, computed } from "vue"

const props = defineProps<{
  min: number
  max: number
  correctAnswers: number[]
}>()
const ui = useActivityUiText()

const userAnswers = ref<Record<number, string>>({})
const showResults = ref(false)

/* Tick calculation */
const calculateTickIntervals = () => {
  const range = props.max - props.min
  let majorInterval, minorInterval

  if (range <= 10) {
    majorInterval = 1
    minorInterval = 0.2
  } else if (range <= 50) {
    majorInterval = 5
    minorInterval = 1
  } else if (range <= 100) {
    majorInterval = 10
    minorInterval = 2
  } else if (range <= 500) {
    majorInterval = 50
    minorInterval = 10
  } else if (range <= 1000) {
    majorInterval = 100
    minorInterval = 20
  } else {
    majorInterval = Math.ceil(range / 10)
    minorInterval = Math.ceil(majorInterval / 5)
  }

  return { majorInterval, minorInterval }
}

const { majorInterval, minorInterval } = calculateTickIntervals()

/* Generate ticks */
const majorTicks = computed(() => {
  const ticks: number[] = []
  let start = Math.ceil(props.min / majorInterval) * majorInterval

  for (let i = start; i <= props.max; i += majorInterval) {
    ticks.push(i)
  }
  return ticks
})

const minorTicks = computed(() => {
  const ticks: number[] = []
  let start = Math.ceil(props.min / minorInterval) * minorInterval

  for (let i = start; i <= props.max; i += minorInterval) {
    if (!majorTicks.value.includes(i)) ticks.push(i)
  }
  return ticks
})

/* Position */
const numberToPixel = (num: number) => {
  const lineWidth = 800
  const padding = 50
  const range = props.max - props.min
  return padding + ((num - props.min) / range) * lineWidth
}

/* Logic */
const checkAnswers = () => (showResults.value = true)

const resetActivity = () => {
  userAnswers.value = {}
  showResults.value = false
}

const isCorrect = (value: number) => {
  return parseFloat(userAnswers.value[value] as string) === value
}

const score = computed(() => {
  let correct = 0
  props.correctAnswers.forEach((a) => {
    if (isCorrect(a)) correct++
  })
  return { correct, total: props.correctAnswers.length }
})

/* UI helper */
const inputClass = (answer: number) => {
  if (!showResults.value)
    return "border-gray-300 focus:border-blue-500"

  return isCorrect(answer)
    ? "border-green-500 bg-green-50"
    : "border-red-500 bg-red-50"
}
</script>

<template>
  <div class="w-full max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">
        Number Line Activity
      </h2>
      <p class="text-gray-600">
        Fill in the missing numbers. Range: {{ min }} to {{ max }}
      </p>
    </div>

    <div class="relative mb-8 w-[900px] h-[200px] mx-auto">
      <svg width="900" height="200">
        <!-- Main line -->
        <line x1="50" y1="120" x2="850" y2="120" stroke="#374151" stroke-width="3" />

        <!-- Major ticks -->
        <g v-for="tick in majorTicks" :key="'major-' + tick">
          <line
            :x1="numberToPixel(tick)"
            y1="105"
            :x2="numberToPixel(tick)"
            y2="135"
            stroke="#374151"
            stroke-width="2"
          />
          <text
            :x="numberToPixel(tick)"
            y="155"
            text-anchor="middle"
            class="fill-gray-700 text-sm font-medium"
          >
            {{ tick }}
          </text>
        </g>

        <!-- Minor ticks -->
        <line
          v-for="tick in minorTicks"
          :key="'minor-' + tick"
          :x1="numberToPixel(tick)"
          y1="110"
          :x2="numberToPixel(tick)"
          y2="130"
          stroke="#6b7280"
          stroke-width="1"
        />

        <!-- Answer markers -->
        <g v-for="answer in correctAnswers" :key="'answer-' + answer">
          <line
            :x1="numberToPixel(answer)"
            y1="60"
            :x2="numberToPixel(answer)"
            y2="120"
            stroke="#dc2626"
            stroke-width="3"
          />
          <circle
            :cx="numberToPixel(answer)"
            cy="60"
            r="4"
            fill="#dc2626"
          />
        </g>
      </svg>

      <!-- Inputs -->
      <div
        v-for="answer in correctAnswers"
        :key="'input-' + answer"
        class="absolute"
        :style="{
          left: numberToPixel(answer) - 30 + 'px',
          top: '20px'
        }"
      >
        <input
          type="number"
          step="any"
          v-model="userAnswers[answer]"
          class="w-16 h-8 text-center border-2 rounded-md text-sm font-medium"
          :class="inputClass(answer)"
          :disabled="showResults"
          placeholder="?"
        />
      </div>
    </div>

    <!-- Buttons -->
    <div class="flex justify-center gap-4 mb-4">
      <button
        v-if="!showResults"
        @click="checkAnswers"
        class="px-6 py-2 bg-blue-600 text-white rounded-lg"
      >
        {{ ui.checkAnswers }}
      </button>

      <button
        v-else
        @click="resetActivity"
        class="px-6 py-2 bg-green-600 text-white rounded-lg"
      >
        Try Again
      </button>
    </div>

    <!-- Results -->
    <div v-if="showResults" class="bg-gray-50 rounded-lg p-4">
      <div class="text-center mb-3">
        <span class="text-lg font-semibold">
          Score: {{ score.correct }} / {{ score.total }}
        </span>
      </div>

      <div class="grid gap-2">
        <div
          v-for="answer in correctAnswers"
          :key="answer"
          :class="[
            'flex justify-between p-2 rounded',
            isCorrect(answer) ? 'bg-green-100' : 'bg-red-100'
          ]"
        >
          <span>Position: {{ answer }}</span>
          <span>
            {{ ui.yourAnswer }} {{ userAnswers[answer] || 'No answer' }}
            {{ isCorrect(answer) ? '✓' : '✗' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
