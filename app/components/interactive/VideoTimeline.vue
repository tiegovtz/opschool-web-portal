<script setup lang="ts">
interface TimelineMarker {
  id: string
  time: number
  percentage: number
}

interface Props {
  currentTime: number
  duration: number
  markers: TimelineMarker[]
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
})

const emit = defineEmits<{
  seek: [time: number]
}>()

const hoverTime = ref<number | null>(null)

const progressPercentage = computed(() => {
  if (!props.duration || props.duration === 0) return 0
  return (props.currentTime / props.duration) * 100
})

const hoverPercentage = computed(() => {
  if (hoverTime.value === null || !props.duration) return 0
  return (hoverTime.value / props.duration) * 100
})

const handleHover = (event: MouseEvent) => {
  if (!event.currentTarget || !props.duration) return
  const timeline = event.currentTarget as HTMLElement
  const rect = timeline.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  hoverTime.value = percentage * props.duration
}

const formatTime = (seconds: number): string => {
  if (isNaN(seconds) || !isFinite(seconds)) return '0:00'

  const minutes = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

const handleSeek = (event: MouseEvent) => {
  if (props.disabled || !event.currentTarget) return

  const timeline = event.currentTarget as HTMLElement
  const rect = timeline.getBoundingClientRect()
  const clickX = event.clientX - rect.left
  const percentage = clickX / rect.width
  const seekTime = percentage * props.duration

  emit('seek', Math.max(0, Math.min(seekTime, props.duration)))
}
</script>


<template>
  <div class="w-full group">
    <div class="relative h-1.5 bg-white/30 rounded-full cursor-pointer transition-all duration-200 group-hover:h-2" @click="handleSeek" @mousemove="handleHover" @mouseleave="hoverTime = null">
      <div
        class="absolute h-full bg-gradient-to-r from-primary to-primary-dark rounded-full transition-all duration-150 shadow-lg"
        :style="{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }"
      />
      <!-- Hover preview -->
      <div
        v-if="hoverTime !== null"
        class="absolute top-0 h-full w-0.5 bg-white/60"
        :style="{ left: `${hoverPercentage}%` }"
      />
      
      <!-- Interaction markers -->
      <div
        v-for="(marker, index) in markers"
        :key="`marker-${index}`"
        class="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-primary shadow-lg transition-transform duration-200 hover:scale-125 cursor-pointer"
        :style="{ left: `${marker.percentage}%` }"
        :aria-label="`Interaction at ${formatTime(marker.time)}`"
        @click.stop="$emit('seek', marker.time)"
      />
      
      <!-- Current time indicator -->
      <div
        class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full border-2 border-primary shadow-lg transform -translate-x-1/2 transition-all duration-150 group-hover:scale-125"
        :style="{ left: `${Math.max(0, Math.min(100, progressPercentage))}%` }"
      />
    </div>
    
    <!-- Time labels -->
    <div class="flex justify-between mt-2 text-xs text-white/90 font-mono">
      <span>{{ formatTime(currentTime) }}</span>
      <span v-if="hoverTime !== null" class="text-primary font-semibold">
        {{ formatTime(hoverTime) }}
      </span>
      <span v-else>{{ formatTime(duration) }}</span>
    </div>
  </div>
</template>
