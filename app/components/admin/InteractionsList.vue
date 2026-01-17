<template>
  <div class="bg-white rounded-lg border border-gray-200">
    <div class="px-6 py-4 border-b border-gray-200">
      <h3 class="text-lg font-semibold text-gray-900">Interactions</h3>
      <p class="text-sm text-gray-600 mt-1">{{ interactions.length }} interaction(s) configured</p>
    </div>

    <div v-if="interactions.length === 0" class="px-6 py-12 text-center text-gray-500">
      <svg class="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
      </svg>
      <p>No interactions yet. Click on the timeline to add one.</p>
    </div>

    <div v-else class="divide-y divide-gray-200">
      <div
        v-for="interaction in sortedInteractions"
        :key="interaction.id"
        class="px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span
                :class="[
                  'px-2 py-1 rounded text-xs font-semibold',
                  getTypeColor(interaction.type)
                ]"
              >
                {{ getTypeLabel(interaction.type) }}
              </span>
              <span class="text-sm font-mono text-gray-600">
                {{ formatTime(interaction.startTime) }}
              </span>
            </div>
            
            <div class="text-sm text-gray-700">
              <p v-if="interaction.type === 'quiz'" class="font-medium">
                {{ (interaction as any).question }}
              </p>
              <p v-else-if="interaction.type === 'selection'" class="font-medium">
                {{ (interaction as any).task }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-2 ml-4">
            <button
              @click="$emit('edit', interaction)"
              class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
            </button>
            <button
              @click="handleDelete(interaction)"
              class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Interaction } from '~/types/interactive-video.interface'

interface Props {
  interactions: Interaction[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  edit: [interaction: Interaction]
  delete: [interactionId: string]
}>()

const sortedInteractions = computed(() => {
  return [...props.interactions].sort((a, b) => a.startTime - b.startTime)
})

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const getTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      quiz: 'Quiz',
      selection: 'Selection'
    }
  return labels[type] || type
}

const getTypeColor = (type: string): string => {
    const colors: Record<string, string> = {
      quiz: 'bg-blue-100 text-blue-800',
      selection: 'bg-green-100 text-green-800'
    }
  return colors[type] || 'bg-gray-100 text-gray-800'
}

const handleDelete = (interaction: Interaction) => {
  if (confirm(`Are you sure you want to delete this ${interaction.type} interaction?`)) {
    emit('delete', interaction.id)
  }
}
</script>

