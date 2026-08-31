<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  description: string;
  headingTag?: 'h1' | 'h2' | 'h3';
  stateRole?: 'status' | 'alert';
}>(), { headingTag: 'h3', stateRole: 'status' });
</script>

<template>
  <div class="adt-state-panel" :role="stateRole">
    <div class="adt-state-panel__icon" aria-hidden="true">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 6c-2.5-2-6-2.5-10-1v14c4-1.5 7.5-1 10 1 2.5-2 6-2.5 10-1V5c-4-1.5-7.5-1-10 1Z" />
        <path d="M12 6v14M5 8.5c1.5-.2 2.8 0 4 .5M5 12c1.5-.2 2.8 0 4 .5M15 9c1.2-.5 2.5-.7 4-.5M15 12.5c1.2-.5 2.5-.7 4-.5" />
      </svg>
    </div>
    <component :is="headingTag" class="adt-state-panel__title">{{ title }}</component>
    <p class="adt-state-panel__description">{{ description }}</p>
    <div v-if="$slots.default" class="adt-state-panel__actions"><slot /></div>
  </div>
</template>

<style scoped>
.adt-state-panel {
  display: flex;
  width: 100%;
  min-height: 320px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  border: 2px dashed #bdd3e2;
  border-radius: 16px;
  background: #f8fbfd;
  text-align: center;
}
.adt-state-panel__title {
  width: 100%;
  max-width: 34rem;
  margin: 0;
  color: #0079b8;
  font-size: 1.25rem;
  font-weight: 700;
  text-align: center;
}
.adt-state-panel__description {
  width: 100%;
  max-width: 34rem;
  margin: 12px 0 0;
  color: #596575;
  font-size: .875rem;
  line-height: 1.7;
  text-align: center;
}
.adt-state-panel__icon {
  display: flex;
  width: 80px;
  height: 80px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  border-radius: 20px;
  background: #e8f3fa;
  color: #0079b8;
}
.adt-state-panel__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
</style>
