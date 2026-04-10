<script setup lang="ts">
import { ref, computed } from "vue"
import Cube from "./cube.vue"
const ui = useActivityUiText()

const maxNumber = 9999
const totalQuestions = 10

const inputValue = ref("")
const currentNumber = ref(0)
const currentQuestion = ref(1)

const handleSubmit = () => {
  const num = parseInt(inputValue.value)
  if (!isNaN(num) && num >= 0 && num <= maxNumber) {
    currentNumber.value = num
  }
}

const handleNextQuestion = () => {
  const randomNum = Math.floor(Math.random() * (maxNumber + 1))
  currentNumber.value = randomNum
  inputValue.value = ""
  currentQuestion.value =
    currentQuestion.value < totalQuestions ? currentQuestion.value + 1 : 1
}

const placeValues = computed(() => {
  const num = currentNumber.value
  return {
    thousands: Math.floor(num / 1000),
    hundreds: Math.floor((num % 1000) / 100),
    tens: Math.floor((num % 100) / 10),
    ones: num % 10,
  }
})

const breakdownText = computed(() => {
  const p = placeValues.value
  const parts: string[] = []

  if (p.thousands) parts.push(`${p.thousands} thousand`)
  if (p.hundreds) parts.push(`${p.hundreds} hundred`)
  if (p.tens) parts.push(`${p.tens} ten`)
  if (p.ones) parts.push(`${p.ones} one`)

  return parts.join(" + ")
})
</script>

<template>
  <div class="w-full max-w-6xl mx-auto p-6 bg-gradient-to-b from-blue-50 to-white rounded-lg shadow-lg">
    <h1 class="text-3xl font-bold text-center mb-8 text-blue-900">
      Place Value Blocks
    </h1>

    <div class="bg-white rounded-lg p-6 mb-6 shadow-inner">
      <div class="flex gap-6 mb-8">

        <!-- Thousands -->
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Thousands</h3>
          <div class="grid grid-cols-3 gap-10 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.thousands" :key="i">
              <Cube :size="100" color="#f59e0b" />
            </div>
            <div v-if="placeValues.thousands === 0" class="col-span-3 flex items-center justify-center h-full text-gray-400 italic">
              No thousands
            </div>
          </div>
        </div>

        <!-- Hundreds -->
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Hundreds</h3>
          <div class="grid grid-cols-3 gap-4 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.hundreds" :key="i">
              <Cube :size="60" color="#10b981" />
            </div>
            <div v-if="placeValues.hundreds === 0" class="col-span-3 flex items-center justify-center h-full text-gray-400 italic">
              No hundreds
            </div>
          </div>
        </div>

        <!-- Tens -->
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Tens</h3>
          <div class="grid grid-cols-2 gap-3 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.tens" :key="i">
              <Cube :size="40" color="#3b82f6" />
            </div>
            <div v-if="placeValues.tens === 0" class="col-span-2 flex items-center justify-center h-full text-gray-400 italic">
              No tens
            </div>
          </div>
        </div>

        <!-- Ones -->
        <div class="text-center">
          <h3 class="text-lg font-semibold mb-4 text-gray-700">Ones</h3>
          <div class="grid grid-cols-1 gap-2 justify-items-center min-h-[480px] p-4 bg-gray-300 rounded-lg">
            <div v-for="i in placeValues.ones" :key="i">
              <Cube :size="25" color="#ef4444" />
            </div>
            <div v-if="placeValues.ones === 0" class="flex items-center justify-center h-full text-gray-400 italic">
              No ones
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Input -->
    <div class="bg-gray-50 rounded-lg p-6">
      <p class="text-lg font-medium mb-4 text-gray-700">
        Write the complete number:
      </p>

      <div class="flex gap-4 items-center mb-6">
        <input
          type="number"
          v-model="inputValue"
          @keyup.enter="handleSubmit"
          class="px-4 py-2 border-2 border-gray-300 rounded-lg text-lg focus:outline-none focus:border-blue-500 w-48"
        />

        <button @click="handleSubmit" class="px-6 py-2 bg-blue-500 text-white rounded-lg">
          Show Blocks
        </button>
      </div>

      <div class="flex justify-between items-center">
        <p class="text-sm text-gray-600">
          {{ currentQuestion }} of {{ totalQuestions }} questions
        </p>

        <button @click="handleNextQuestion" class="px-6 py-3 bg-amber-600 text-white rounded-lg">
          {{ ui.nextQuestion }}
        </button>
      </div>

      <div class="flex gap-2 mt-4 justify-center">
        <button
          v-for="i in totalQuestions"
          :key="i"
          @click="currentQuestion = i"
          :class="[
            'w-10 h-10 rounded-lg font-medium',
            currentQuestion === i
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200'
          ]"
        >
          {{ i }}
        </button>
      </div>
    </div>

    <!-- Result -->
    <div v-if="currentNumber > 0" class="mt-6 p-4 bg-blue-50 rounded-lg text-center">
      <p class="text-xl font-semibold text-blue-900">
        {{ currentNumber }} =
        {{ breakdownText }}
      </p>
    </div>

  </div>
</template>
