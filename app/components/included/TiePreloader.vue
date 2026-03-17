<script setup lang="ts">
useHead({
  link: [
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
    {
      rel: 'stylesheet',
      href: 'https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&display=swap',
    },
  ],
})

const emit = defineEmits<{ done: [] }>()

const hidden = ref(false)
const minDisplayTimeMs = 2800
const startTime = ref(0)

function finishLoading() {
  const elapsed = Date.now() - startTime.value
  const remaining = minDisplayTimeMs - elapsed

  const hidePreloader = () => {
    hidden.value = true
    nextTick(() => {
      emit('done')
    })
  }

  if (remaining > 0) {
    setTimeout(hidePreloader, remaining)
  } else {
    hidePreloader()
  }
}

onMounted(() => {
  startTime.value = Date.now()
  window.addEventListener('load', finishLoading)
  if (document.readyState === 'complete') {
    finishLoading()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('load', finishLoading)
})

const logoSrc = 'https://www.tie.go.tz/site/images/logo.png'
const logoFallbackSvg = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='48' fill='%23fbbf24'/%3E%3Ctext x='50' y='68' font-size='48' text-anchor='middle' fill='%230b1a2e' font-family='Inter' font-weight='700'%3ETIE%3C/text%3E%3C/svg%3E"
</script>

<template>
  <Transition name="tie-preloader-fade">
    <div
      v-show="!hidden"
      id="tie-preloader"
      class="tie-preloader"
      aria-hidden="true"
    >
      <div class="preloader-content">
        <div class="white-circle">
          <img
            :src="logoSrc"
            alt="TIE Tanzania Institute of Education"
            class="circle-logo"
            @error="($event.target as HTMLImageElement).src = logoFallbackSvg"
          >
        </div>

        <h1 class="institute-name">
          TANZANIA <span>INSTITUTE</span> OF EDUCATION
        </h1>
        <div class="sub-line">
          Online Public School
        </div>

        <div class="progress-track">
          <div class="progress-fill" />
        </div>

        <div class="interactive-icon" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="icon-spin" fill="currentColor" aria-hidden="true">
            <path d="M222.7 32.1c5 16.9-4.6 34.8-21.5 39.8C121.8 95.6 64 169.1 64 256c0 106 86 192 192 192s192-86 192-192c0-86.9-57.8-160.4-137.1-184.1c-16.9-5-26.6-22.9-21.5-39.8s22.9-26.6 39.8-21.5C434.9 42.1 512 140 512 256c0 141.4-114.6 256-256 256S0 397.4 0 256C0 140 77.1 42.1 182.9 10.6c16.9-5 34.8 4.6 39.8 21.5z" />
          </svg>
        </div>

        <div class="version-text">
          All rights reserved by TIE
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tie-preloader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #0b1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  font-family: 'Inter', ui-sans-serif, system-ui, sans-serif;
  transition: opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  opacity: 1;
}

.tie-preloader-fade-leave-active {
  transition: opacity 0.8s cubic-bezier(0.23, 1, 0.32, 1);
}
.tie-preloader-fade-leave-to {
  opacity: 0;
  pointer-events: none;
}

.preloader-content {
  text-align: center;
  max-width: 650px;
  padding: 24px;
}

.white-circle {
  width: 200px;
  height: 200px;
  background: white;
  border-radius: 50%;
  margin: 0 auto 28px auto;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 20px 35px -8px rgba(0, 0, 0, 0.5),
    0 0 0 3px rgba(251, 191, 36, 0.3),
    inset 0 -2px 8px rgba(0, 0, 0, 0.02);
  animation: floatCircle 2.8s infinite ease-in-out;
}

.circle-logo {
  width: 70%;
  height: auto;
  max-width: 140px;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.1));
  display: block;
}

@keyframes floatCircle {
  0% { transform: translateY(0px) scale(1); }
  45% { transform: translateY(-10px) scale(1.02); }
  100% { transform: translateY(0px) scale(1); }
}

.institute-name {
  font-size: clamp(28px, 6vw, 48px);
  font-weight: 700;
  letter-spacing: -0.02em;
  color: white;
  line-height: 1.2;
  margin-bottom: 8px;
}

.institute-name span {
  color: #fbbf24;
  font-weight: 300;
  display: inline-block;
}

.sub-line {
  font-size: 14px;
  font-weight: 500;
  color: #94a9c2;
  text-transform: uppercase;
  letter-spacing: 3px;
  margin-bottom: 40px;
  word-spacing: 4px;
}

.progress-track {
  width: 280px;
  max-width: 70vw;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  margin: 30px auto 20px;
  overflow: hidden;
}

.progress-fill {
  width: 0%;
  height: 100%;
  background: linear-gradient(90deg, #fbbf24, #ffd966, #fbbf24);
  border-radius: 10px;
  animation: loadingProgress 2.2s cubic-bezier(0.65, 0, 0.35, 1) forwards;
  box-shadow: 0 0 20px #fbbf24;
}

.interactive-icon {
  font-size: 2rem;
  color: #fbbf24;
  opacity: 0.7;
  animation: gentlePulse 1.8s infinite;
  margin-top: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.interactive-icon svg {
  width: 2rem;
  height: 2rem;
}

.icon-spin {
  animation: iconSpin 1s linear infinite;
}

@keyframes iconSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gentlePulse {
  0% { opacity: 0.5; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 0.5; transform: scale(1); }
}

@keyframes loadingProgress {
  0% { width: 0%; }
  20% { width: 35%; }
  50% { width: 68%; }
  80% { width: 85%; }
  100% { width: 100%; }
}

.version-text {
  font-size: 12px;
  color: #3a5470;
  margin-top: 48px;
  letter-spacing: 1px;
}

@media (max-width: 500px) {
  .white-circle {
    width: 160px;
    height: 160px;
  }
  .circle-logo {
    max-width: 110px;
  }
}
</style>
