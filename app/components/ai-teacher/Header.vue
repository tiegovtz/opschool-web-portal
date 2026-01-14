<template>
  <header class="px-8 py-6" aria-labelledby="app-title" tabindex="0">
    <div class="flex items-center gap-3" tabindex="-1">

      <!-- Icon container -->
      <div tabindex="0" aria-label="bulb icon with white strokes on lightblue background" class="flex items-center justify-center w-12 h-12 rounded-full bg-oceanBlue backdrop-blur"
        aria-hidden="true">
        <Icon name="heroicons:light-bulb" class="w-6 h-6 text-white" aria-hidden="true" />
      </div>

      <!-- Text content -->
      <div tabindex="0">
        <h1 id="app-title" class="text-2xl font-bold">
          TIE AI Assistant
        </h1>

        <p class="text-sm" id="app-description">
          Your intelligent learning companion
        </p>
      </div>

    </div>
  </header>
</template>
