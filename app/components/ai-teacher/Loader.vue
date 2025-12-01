<template>
  <div class="flex justify-start animate-fade-in">
    <div class="flex gap-3 max-w-[85%]">
      <div
        class="w-8 h-8 bg-oceanBlue rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md"
      >
        <Icon
          name="heroicons:bolt"
          class="w-5 h-5 text-white"
        />
      </div>

      <div
        class="bg-white text-gray-700 px-5 py-3 rounded-2xl rounded-tl-sm shadow-md border border-gray-100 flex items-center gap-2"
      >
        <!-- Typing dots animation -->
        <div class="flex space-x-1">
          <span class="dot dot1"></span>
          <span class="dot dot2"></span>
          <span class="dot dot3"></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dot {
  width: 7px;
  height: 7px;
  background-color: #4b5563;
  border-radius: 50%;
  display: inline-block;
  animation: blink 1.4s infinite both;
}
.dot1 {
  animation-delay: 0s;
}
.dot2 {
  animation-delay: 0.2s;
}
.dot3 {
  animation-delay: 0.4s;
}
@keyframes blink {
  0% {
    opacity: 0.2;
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0.2;
  }
}
</style>
