<script setup lang="ts">
import { ref, watch } from "vue";
import { DndProvider, useDrag, useDrop } from "vue3-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from 'react-dnd-touch-backend';

type Vegetable = "broccoli" | "pepper" | "onion" | "tomato" | "cucumber" | "cabbage";
const isMobile = useIsMobile();
const patterns: Vegetable[][] = [
  ["broccoli","pepper","onion","broccoli","pepper","onion","broccoli","pepper","onion"],
  ["tomato","tomato","cucumber","cucumber","tomato","tomato","cucumber","cucumber","tomato"],
  ["cabbage","cabbage","cabbage","pepper","pepper","pepper","cabbage","cabbage","cabbage"],
  ["cucumber","cucumber","tomato","tomato","broccoli","broccoli","cucumber","cucumber","tomato"],
  ["tomato","onion","tomato","onion","tomato","onion","tomato","onion","tomato"],
  ["tomato","cucumber","broccoli","pepper","tomato","cucumber","broccoli","pepper","tomato"],
];
const patternAnswers: Vegetable[] = ["broccoli","tomato","pepper","tomato","onion","cucumber"];
const draggableVegetables: Vegetable[] = ["tomato","cucumber","broccoli","pepper","onion","cabbage"];

const answers = ref<(Vegetable|null)[]>(Array(6).fill(null));
const score = ref(0);
const allAnswered = ref(false);

watch(answers, (newVal) => {
  if (newVal.every(a => a !== null)) {
    allAnswered.value = true;
  }
});

// composables for drag/drop
function useDraggable(id: Vegetable) {
  const [collect, drag] = useDrag(() => ({
    type: "VEG",
    item: { id },
    collect: monitor => ({ isDragging: monitor.isDragging() })
  }));
  return { isDragging:collect.value.isDragging, drag };
}

function useDropZone(index: number) {
  const [collect, drop] = useDrop(() => ({
    accept: "VEG",
    drop: (item: { id: Vegetable }) => {
      answers.value[index] = item.id;
      if (item.id === patternAnswers[index]) score.value++;
    },
    collect: monitor => ({ isOver: monitor.isOver() })
  }));
  return { isOver:collect.value.isOver, drop };
}
</script>

<template>
  <DndProvider :backend="isMobile ? TouchBackend: HTML5Backend">
    <h1 class="text-2xl text-center font-bold mb-4">
      Fill in the next vegetable in the pattern:
    </h1>

    <div class="flex flex-col grow">
      <div v-for="(pattern, rowIndex) in patterns" :key="rowIndex" class="flex items-center gap-10">
        <div class="font-bold">{{ rowIndex + 1 }}.</div>
        <div class="flex grow justify-between">
          <div v-for="(veg, colIndex) in pattern" :key="colIndex" class="w-12 h-12 flex items-center justify-center">
            <img :src="`/assets/${veg}.png`" :alt="veg" class="object-contain" />
          </div>
        </div>
        <!-- Drop zone -->
        <div
          v-bind="useDropZone(rowIndex).drop"
          :class="['w-12 h-12 border-2 border-dashed flex items-center justify-center',
                   useDropZone(rowIndex).isOver ? 'bg-green-200' : 'bg-gray-100']"
        >
          <img v-if="answers[rowIndex]" :src="`/assets/${answers[rowIndex]}.png`" :alt="answers[rowIndex]!" class="w-10 h-10 object-contain" />
        </div>
      </div>
    </div>

    <div class="mt-8 flex justify-end space-x-10">
      <div v-for="veg in draggableVegetables" :key="veg"
           v-bind="useDraggable(veg).drag"
           :style="{ opacity: useDraggable(veg).isDragging ? 0.5 : 1 }"
           class="w-16 h-16 flex items-center justify-center cursor-move">
        <img :src="`/assets/${veg}.png`" :alt="veg" class="object-contain" />
      </div>
    </div>

    <div v-if="allAnswered" class="mt-6 text-center">
      <p class="text-xl font-bold">Game Over</p>
      <p>You scored {{ score }} out of 6.</p>
      <button @click="() => { answers = Array(6).fill(null); score = 0; allAnswered = false; }"
              class="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
        Play Again
      </button>
    </div>
  </DndProvider>
</template>
