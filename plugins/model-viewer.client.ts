export default defineNuxtPlugin(() => {
  if (import.meta.client) {
    import('@google/model-viewer');
  }
});
