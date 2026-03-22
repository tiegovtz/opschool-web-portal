<script setup lang="ts">
export type IconType = 'play'|'clock'|'chart'|'up'|'users'|undefined
withDefaults(defineProps<{type?:IconType,size?:number}>(),{
    type:undefined,
    size:24
})
</script>
<template>
    <template v-if="type=='play'">
        <svg aria-hidden="true" class="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="12.5" rx="3" stroke="currentColor" strokeWidth="1.9" />
        <path d="M10 9.1L14.9 11.25L10 13.4V9.1Z" fill="currentColor" />
      </svg>
    </template>
    <template v-else-if="type=='clock'">
        <svg aria-hidden="true" class="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="7.4" stroke="currentColor" strokeWidth="1.9" />
        <path d="M12 8.2V12.2L14.8 14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      </svg>
    </template>
    <template v-else-if="type=='chart'">
        <svg aria-hidden="true" class="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path d="M5 18.5H19" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
        <path d="M7.2 16V10.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
        <path d="M12 16V7.8" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
        <path d="M16.8 16V12.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      </svg>
    </template>
    <template v-else-if="type=='up'">
       <svg aria-hidden="true" class="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <path d="M8 18V8.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
        <path d="M5.5 10.8L8 8.2L10.5 10.8" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
        <circle cx="16.2" cy="8.2" r="2.2" stroke="currentColor" strokeWidth="1.9" />
        <path d="M14.6 18V13.9C14.6 13 15.3 12.3 16.2 12.3C17.1 12.3 17.8 13 17.8 13.9V18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      </svg>
    </template>
    <template  v-else-if="type=='users'">
        <svg aria-hidden="true" class="h-7 w-7" fill="none" viewBox="0 0 24 24">
        <circle cx="9" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="15.7" cy="9" r="2.1" stroke="currentColor" strokeWidth="1.9" />
        <path d="M5.8 17.5C6.2 15.7 7.7 14.5 9.5 14.5H10.1C11.9 14.5 13.4 15.7 13.8 17.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
        <path d="M14.2 16.7C14.6 15.4 15.7 14.5 17.1 14.5C18.2 14.5 19.2 15 19.8 16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      </svg>
    </template>
    <template v-else>
         <svg aria-hidden="true" class="h-7 w-7" fill="none" viewBox="0 0 24 24">
      <path d="M5 8.25L12 4.75L19 8.25" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.9" />
      <path d="M6.5 9.5V15.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M12 9.5V18" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M17.5 9.5V15.75" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
      <path d="M4.75 18.5H19.25" stroke="currentColor" strokeLinecap="round" strokeWidth="1.9" />
    </svg>
    </template>
</template>
