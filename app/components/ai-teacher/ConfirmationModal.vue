<template>
  <Transition name="modal">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
      @click.self="handleCancel"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
        @click="handleCancel"
      ></div>

      <!-- Modal Content -->
      <div
        class="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden transform transition-all"
        @click.stop
      >
        <!-- Header -->
        <div class="bg-gradient-to-r from-oceanBlue to-deepBlue px-6 py-5">
          <div class="flex items-center gap-3">
            <div
              class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0 ring-2 ring-white/10"
            >
              <Icon
                :name="icon"
                class="w-6 h-6 text-white"
              />
            </div>
            <h2
              id="confirmation-title"
              class="text-xl font-bold text-white flex-1"
            >
              {{ title }}
            </h2>
            <button
              v-if="!required"
              @click="handleCancel"
              class="flex-shrink-0 p-2 rounded-lg hover:bg-white/20 transition-all focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Close"
            >
              <Icon
                name="heroicons:x-mark"
                class="w-5 h-5 text-white"
              />
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="px-6 py-5">
          <p
            class="text-gray-700 leading-relaxed whitespace-pre-line"
            v-html="message"
          ></p>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            @click="handleCancel"
            class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-gray-700 bg-white border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-400/50 active:scale-95"
          >
            {{ cancelText }}
          </button>
          <button
            @click="handleConfirm"
            class="flex-1 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-oceanBlue to-deepBlue hover:from-deepBlue hover:to-oceanBlue transition-all duration-200 shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-oceanBlue/50 active:scale-95"
            :class="{
              'bg-red-600 hover:bg-red-700 from-red-600 to-red-700 hover:from-red-700 hover:to-red-600 focus:ring-red-500/50': variant === 'danger'
            }"
          >
            {{ confirmText }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
interface Props {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  icon?: string;
  required?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
  icon: 'heroicons:exclamation-triangle',
  required: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
  close: [];
}>();

const handleConfirm = () => {
  emit('confirm');
  emit('close');
};

const handleCancel = () => {
  if (!props.required) {
    emit('cancel');
    emit('close');
  }
};

// Keyboard support
const handleKeyDown = (event: KeyboardEvent) => {
  if (!props.isOpen) return;

  if (event.key === 'Escape' && !props.required) {
    handleCancel();
  } else if (event.key === 'Enter' && event.ctrlKey) {
    handleConfirm();
  }
};

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.modal-enter-active {
  transition: all 0.3s ease-out;
}

.modal-leave-active {
  transition: all 0.2s ease-in;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from > div:last-child,
.modal-leave-to > div:last-child {
  transform: scale(0.95) translateY(-10px);
}
</style>
