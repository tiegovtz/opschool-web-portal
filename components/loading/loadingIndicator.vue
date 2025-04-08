<script setup lang="js">
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
  <div class="flex flex-col justify-center items-center">
   
    <div class="doting">
      <div :class="isLoading ? 'dot-animate' : ''" class="dot w-2 h-2 mx-1 inline-block "></div>
      <div :class="isLoading ? 'dot-animate' : ''" class="dot w-3 h-3 mx-1 inline-block" ></div>
      <div :class="isLoading ? 'dot-animate' : ''" class="dot w-2 h-2 mx-1 inline-block"></div>
      <div :class="isLoading ? 'dot-animate' : ''" class="dot w-3 h-3 mx-1 inline-block"></div>
      <div :class="isLoading ? 'dot-animate' : ''" class="dot w-2 h-2 mx-1 inline-block"></div>
    </div>
    <div class="text p-1 lowercase text-oceanBlue fade-in">
      {{ somo.toLowerCase() == "kiswahili " ? " .. Tafadhali subiri .." : ".. Please wait .." }}
    </div>
  </div>
</template>

<style lang="css"  nonce="tie" scoped>
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
    background:var(--color-oceanBlue);
    animation-delay: 0.15s;
  }
}

/*  */
@keyframes fade-in {
    0%,100% {
      color:var(--color-grayLight);
    }
    60% {
      color: var(--color-oceanBlue);
    }
  }

  .fade-in {
    animation: fade-in 1.2s infinite ease-in-out;
  }
</style>