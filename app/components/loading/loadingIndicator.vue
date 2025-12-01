<script setup>
defineProps({
    isLoading:{
        type:Boolean,
        default:false
    },
    somo:{
        type:String,
        default:'physics'
    }
})
</script>

<template>
  <div aria-live="polite" aria-atomic aria-label="loading contents please wait" class="flex flex-col items-center justify-center">
   
    <div class="doting ">
      <div  class="inline-block w-2 h-2 mx-1 dot dot-animate"></div>
      <div  class="inline-block w-3 h-3 mx-1 dot dot-animate" ></div>
      <div  class="inline-block w-2 h-2 mx-1 dot dot-animate"></div>
      <div  class="inline-block w-3 h-3 mx-1 dot dot-animate"></div>
      <div  class="inline-block w-2 h-2 mx-1 dot dot-animate"></div>
    </div>
    <div class="p-1 lowercase text text-oceanBlue fade-in">
      {{ somo.toLowerCase() == "kiswahili " ? " .. Tafadhali subiri .." : ".. Please wait .." }}
    </div>
  </div>
</template>

<style scoped>
.dot {
  border-radius: 50%;
}

.dot-animate {
  animation: bounce 1.2s infinite ease-in-out;
}
.dot:nth-child(1) {
  animation-delay: -0.3s;
}

.dot:nth-child(2) {
  animation-delay: -0.15s;
}

.dot:nth-child(3) {
  animation-delay: 0s;
}

.dot:nth-child(4) {
  animation-delay: 0.15s;
}


@keyframes bounce {
  0%,
  100% {
    transform: translateY(0); /* Dots start at their initial position */
  }
  60% {
    transform: translateY(-15px); /* Dots move up by 10px */
    background:#56ade8;
    animation-delay: 0.15s;
  }
}

/*  */
@keyframes fade-in {
    0%,100% {
      color:#f0f0f0;
    }
    60% {
      color: #56ade8;
    }
  }

  .fade-in {
    animation: fade-in 1.2s infinite ease-in-out;
  }
</style>